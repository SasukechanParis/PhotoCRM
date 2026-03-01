(function () {
  'use strict';

  const GOOGLE_OAUTH_ACCESS_TOKEN_KEY = 'photocrm_google_oauth_access_token';
  const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
  const GOOGLE_CALENDAR_READ_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

  const firebaseConfig = {
    apiKey: "AIzaSyD6fb5NWN0bAe0vW1Z9piQxv9aYE0e-tGs",
    authDomain: "photocrm-app.firebaseapp.com",
    projectId: "photocrm-app",
    storageBucket: "photocrm-app.firebasestorage.app",
    messagingSenderId: "1022053730718",
    appId: "1:1022053730718:web:ca1349d94e1cac107b2e8f"
  };

  let auth;
  let db;
  const firebaseInitPromise = (async () => {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.firestore();
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(console.error);
  })();
  const cache = {};

  const SETTINGS_KEYS = [
    'photocrm_options',
    'photocrm_team',
    'photocrm_theme',
    'photocrm_lang',
    'photocrm_tax_settings',
    'photocrm_invoice_sender_profile',
    'photocrm_currency',
    'photocrm_custom_fields',
    'photocrm_calendar_filters',
    'photocrm_form_field_visibility',
    'photocrm_google_calendar_auto_sync',
    'photocrm_google_calendar_selected_id',
    'preferred_view'
  ];

  const DATA_KEYS = [
    'photocrm_customers',
    'photocrm_expenses',
    ...SETTINGS_KEYS
  ];

  let redirectResolved = false;
  let redirectResultPromise = null;
  let googleOAuthAccessToken = (() => {
    try {
      return localStorage.getItem(GOOGLE_OAUTH_ACCESS_TOKEN_KEY) || '';
    } catch {
      return '';
    }
  })();

  function setGoogleOAuthAccessToken(token) {
    const next = String(token || '').trim();
    googleOAuthAccessToken = next;
    try {
      if (next) localStorage.setItem(GOOGLE_OAUTH_ACCESS_TOKEN_KEY, next);
      else localStorage.removeItem(GOOGLE_OAUTH_ACCESS_TOKEN_KEY);
    } catch {
      // no-op
    }
  }

  async function ensureInitialized() {
    await firebaseInitPromise;
  }

  function parseLocalValue(raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  function localMigrationPayload() {
    const payload = {};
    DATA_KEYS.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw !== null) payload[key] = parseLocalValue(raw);
    });
    return payload;
  }

  function normalizeRecordsForUser(records, uid) {
    if (!Array.isArray(records)) return [];
    return records.map((record, index) => {
      const safeRecord = (record && typeof record === 'object') ? record : { value: record };
      return {
        ...safeRecord,
        id: safeRecord.id || `migrated_${index}_${Date.now().toString(36)}`,
        userId: uid,
      };
    });
  }

  function userRootRef(uid) {
    if (!db) throw new Error('Firebase is not initialized yet.');
    return db.collection('users').doc(uid);
  }

  function userMetaRef(uid) {
    return userRootRef(uid).collection('meta').doc('state');
  }

  function userMigrationRef(uid) {
    return userRootRef(uid).collection('meta').doc('migration');
  }

  function userProjectsRef(uid) {
    return userRootRef(uid).collection('projects');
  }

  function userLegacyClientsRef(uid) {
    return userRootRef(uid).collection('clients');
  }

  function userExpensesRef(uid) {
    return userRootRef(uid).collection('expenses');
  }

  async function overwriteCollection(collectionRef, records) {
    const previous = await collectionRef.get();
    const batch = db.batch();

    previous.forEach((docSnap) => batch.delete(docSnap.ref));

    records.forEach((record) => {
      const docId = String(record.id || collectionRef.doc().id);
      batch.set(collectionRef.doc(docId), {
        ...record,
        id: docId,
      });
    });

    await batch.commit();
  }

  async function mergeCollectionRecords(collectionRef, records) {
    if (!Array.isArray(records) || records.length === 0) return;
    const batch = db.batch();
    records.forEach((record) => {
      const docId = String(record.id || collectionRef.doc().id);
      batch.set(collectionRef.doc(docId), {
        ...record,
        id: docId,
      }, { merge: true });
    });
    await batch.commit();
  }


  function hasLocalData(payload) {
    return Object.keys(payload).some((key) => {
      const value = payload[key];
      if (Array.isArray(value)) return value.length > 0;
      if (value && typeof value === 'object') return Object.keys(value).length > 0;
      return value !== undefined && value !== null && value !== '';
    });
  }

  function buildLocalDataSummary(payload = localMigrationPayload()) {
    const customers = Array.isArray(payload.photocrm_customers) ? payload.photocrm_customers.length : 0;
    const expenses = Array.isArray(payload.photocrm_expenses) ? payload.photocrm_expenses.length : 0;
    return {
      hasLocalData: customers > 0 || expenses > 0,
      customers,
      expenses,
    };
  }

  async function getCloudDataSummary(uid) {
    const [projectsSnap, legacyClientsSnap, expensesSnap] = await Promise.all([
      userProjectsRef(uid).get(),
      userLegacyClientsRef(uid).get(),
      userExpensesRef(uid).get(),
    ]);
    const projects = projectsSnap.size;
    const legacyClients = legacyClientsSnap.size;
    const expenses = expensesSnap.size;
    return {
      projects,
      legacyClients,
      expenses,
      hasCloudData: (projects + legacyClients + expenses) > 0,
    };
  }

  async function hasAnyCloudData(uid) {
    const [settingsSnap, projectsSnap, legacyClientsSnap, expensesSnap] = await Promise.all([
      userMetaRef(uid).get(),
      userProjectsRef(uid).limit(1).get(),
      userLegacyClientsRef(uid).limit(1).get(),
      userExpensesRef(uid).limit(1).get(),
    ]);

    return settingsSnap.exists || !projectsSnap.empty || !legacyClientsSnap.empty || !expensesSnap.empty;
  }

  async function migrateLocalDataToCloud(user, options = {}) {
    const payload = localMigrationPayload();
    const uid = user.uid;
    const overwrite = options.overwrite === true;

    const customers = normalizeRecordsForUser(payload.photocrm_customers || [], uid);
    const expenses = normalizeRecordsForUser(payload.photocrm_expenses || [], uid);

    if (customers.length) {
      if (overwrite) await overwriteCollection(userProjectsRef(uid), customers);
      else await mergeCollectionRecords(userProjectsRef(uid), customers);
    }

    if (expenses.length) {
      if (overwrite) await overwriteCollection(userExpensesRef(uid), expenses);
      else await mergeCollectionRecords(userExpensesRef(uid), expenses);
    }

    const settings = {};
    SETTINGS_KEYS.forEach((key) => {
      if (payload[key] !== undefined) settings[key] = payload[key];
    });

    await userMetaRef(uid).set({
      ...settings,
      userId: uid,
      __updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    await userMigrationRef(uid).set({
      localStorageMigrated: true,
      migratedAt: firebase.firestore.FieldValue.serverTimestamp(),
      customerCount: customers.length,
      expenseCount: expenses.length,
      overwrite,
      source: 'localStorage_manual_merge',
    }, { merge: true });

    return {
      customerCount: customers.length,
      expenseCount: expenses.length,
      overwrite,
      hadLocalData: hasLocalData(payload),
    };
  }

  async function loadCloudDataForUser(user) {
    const uid = user.uid;
    const [settingsSnap, projectSnap, legacyClientSnap, expenseSnap] = await Promise.all([
      userMetaRef(uid).get(),
      userProjectsRef(uid).get(),
      userLegacyClientsRef(uid).get(),
      userExpensesRef(uid).get(),
    ]);

    const customerDocs = projectSnap.docs.length > 0 ? projectSnap.docs : legacyClientSnap.docs;

    const loaded = {
      ...(settingsSnap.exists ? settingsSnap.data() : {}),
      photocrm_customers: customerDocs.map((doc) => ({ id: doc.id, ...doc.data(), userId: uid })),
      photocrm_expenses: expenseSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), userId: uid })),
    };

    Object.keys(cache).forEach((k) => delete cache[k]);
    Object.assign(cache, loaded);
    return loaded;
  }

  async function ensureCloudData(user) {
    const migrationSnap = await userMigrationRef(user.uid).get();
    if (!migrationSnap.exists || !migrationSnap.data()?.localStorageMigrated) {
      const payload = localMigrationPayload();
      const localExists = hasLocalData(payload);
      const cloudExists = await hasAnyCloudData(user.uid);

      if (localExists && !cloudExists) {
        await migrateLocalDataToCloud(user);
      } else {
        await userMigrationRef(user.uid).set({
          localStorageMigrated: true,
          migratedAt: firebase.firestore.FieldValue.serverTimestamp(),
          skipped: true,
          reason: localExists ? 'cloud_data_already_exists' : 'no_local_data'
        }, { merge: true });
      }
    }
    return loadCloudDataForUser(user);
  }

  async function updateKey(user, key, value) {
    if (!user) return;
    cache[key] = value;

    if (key === 'photocrm_customers') {
      const customers = normalizeRecordsForUser(value, user.uid);
      await overwriteCollection(userProjectsRef(user.uid), customers);
      return;
    }

    if (key === 'photocrm_expenses') {
      const expenses = normalizeRecordsForUser(value, user.uid);
      await overwriteCollection(userExpensesRef(user.uid), expenses);
      return;
    }

    await userMetaRef(user.uid).set({
      userId: user.uid,
      [key]: value,
      __updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  async function processRedirectResult() {
    // signInWithRedirect replaced by signInWithPopup. Safe no-op.
    redirectResolved = true;
    return null;
  }

  window.FirebaseService = {
    async whenReady() {
      await ensureInitialized();
      return { auth, db };
    },
    getCurrentUser() {
      return auth.currentUser;
    },
    getCachedData(key) {
      return cache[key];
    },
    getAllCachedData() {
      return { ...cache };
    },
    getLocalDataSummary() {
      return buildLocalDataSummary();
    },
    async getCloudDataSummary() {
      await ensureInitialized();
      const user = auth.currentUser;
      if (!user) return { projects: 0, legacyClients: 0, expenses: 0, hasCloudData: false };
      return getCloudDataSummary(user.uid);
    },
    async mergeLocalDataToCloud(options = {}) {
      await ensureInitialized();
      const user = auth.currentUser;
      if (!user) return { merged: false, reason: 'not_logged_in' };
      const result = await migrateLocalDataToCloud(user, options);
      await loadCloudDataForUser(user);
      return { merged: true, ...result };
    },
    isRedirectResolved() {
      return redirectResolved;
    },
    async processRedirectResult() {
      return processRedirectResult();
    },
    async loadForUser(user) {
      await ensureInitialized();
      return ensureCloudData(user);
    },
    async saveKey(key, value) {
      await ensureInitialized();
      const user = auth.currentUser;
      if (!user) return;
      return updateKey(user, key, value);
    },
    async signInWithGoogle() {
      await ensureInitialized();
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      provider.addScope(GOOGLE_CALENDAR_SCOPE);
      provider.addScope(GOOGLE_CALENDAR_READ_SCOPE);
      const result = await auth.signInWithPopup(provider);
      const credential = firebase.auth.GoogleAuthProvider.credentialFromResult(result);
      setGoogleOAuthAccessToken(credential?.accessToken || '');
      return result;
    },
    async signInWithPopup() {
      return this.signInWithGoogle();
    },
    getGoogleAccessToken() {
      return String(googleOAuthAccessToken || '');
    },
    async signOut() {
      await ensureInitialized();
      setGoogleOAuthAccessToken('');
      return auth.signOut();
    },
    onAuthChanged(callback) {
      // Register synchronously after whenReady() has been awaited by caller
      return auth.onAuthStateChanged((user) => {
        if (!user) setGoogleOAuthAccessToken('');
        callback(user);
      });
    },
    getCurrentUser() {
      return auth ? auth.currentUser : null;
    },
    async getCurrentUserAsync() {
      await ensureInitialized();
      return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          resolve(user);
        });
      });
    }
  };
})();
