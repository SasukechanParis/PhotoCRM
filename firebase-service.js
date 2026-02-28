(function () {
  'use strict';

  const firebaseConfig = {
    apiKey: 'AIzaSyD6fb5NWN0bAe0vW1Z9piQxv9aYE0e-tGs',
    authDomain: 'photocrm-app.firebaseapp.com',
    projectId: 'photocrm-app',
    storageBucket: 'photocrm-app.firebasestorage.app',
    messagingSenderId: '1022053730718',
    appId: '1:1022053730718:web:ca1349d94e1cac107b2e8f'
  };

  let auth;
  let db;
  const cache = {};

  const SETTINGS_KEYS = [
    'photocrm_options',
    'photocrm_plan_master',
    'photocrm_team',
    'photocrm_theme',
    'photocrm_lang',
    'photocrm_tax_settings',
    'photocrm_invoice_sender_profile',
    'photocrm_currency',
    'photocrm_custom_fields',
    'photocrm_calendar_filters',
    'photocrm_dashboard_config',
    'photocrm_contract_template',
    'preferred_view'
  ];

  const DATA_KEYS = [
    'photocrm_customers',
    'photocrm_expenses',
    ...SETTINGS_KEYS
  ];

  const firebaseInitPromise = (async () => {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.firestore();
    await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(console.error);
  })();

  let redirectResolved = false;
  let redirectResultPromise = null;
  let initialAuthStatePromise = null;

  async function ensureInitialized() {
    await firebaseInitPromise;
  }

  function ensureInitialAuthStatePromise() {
    if (initialAuthStatePromise) return initialAuthStatePromise;

    initialAuthStatePromise = new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
      });
    });

    return initialAuthStatePromise;
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

  function userSettingsRef(uid) {
    return userRootRef(uid).collection('settings');
  }

  function userMigrationRef(uid) {
    return userRootRef(uid).collection('meta').doc('migration');
  }

  function userClientsRef(uid) {
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

  function hasLocalData(payload) {
    return Object.keys(payload).some((key) => {
      const value = payload[key];
      if (Array.isArray(value)) return value.length > 0;
      if (value && typeof value === 'object') return Object.keys(value).length > 0;
      return value !== undefined && value !== null && value !== '';
    });
  }

  async function hasAnyCloudData(uid) {
    const [settingsSnap, settingsCollectionSnap, clientsSnap, expensesSnap] = await Promise.all([
      userMetaRef(uid).get(),
      userSettingsRef(uid).limit(1).get(),
      userClientsRef(uid).limit(1).get(),
      userExpensesRef(uid).limit(1).get(),
    ]);

    return settingsSnap.exists || !settingsCollectionSnap.empty || !clientsSnap.empty || !expensesSnap.empty;
  }

  async function migrateLocalDataToCloud(user) {
    const payload = localMigrationPayload();
    const uid = user.uid;

    const customers = normalizeRecordsForUser(payload.photocrm_customers || [], uid);
    const expenses = normalizeRecordsForUser(payload.photocrm_expenses || [], uid);

    if (customers.length) {
      await overwriteCollection(userClientsRef(uid), customers);
    }

    if (expenses.length) {
      await overwriteCollection(userExpensesRef(uid), expenses);
    }

    const settings = {};
    SETTINGS_KEYS.forEach((key) => {
      if (payload[key] !== undefined) settings[key] = payload[key];
    });

    const settingEntries = Object.entries(settings);
    if (settingEntries.length) {
      const settingsBatch = db.batch();
      settingEntries.forEach(([key, value]) => {
        settingsBatch.set(userSettingsRef(uid).doc(key), {
          key,
          value,
          userId: uid,
          __updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      });
      await settingsBatch.commit();
    }

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
    }, { merge: true });
  }

  async function loadCloudDataForUser(user) {
    const uid = user.uid;
    const [settingsSnap, settingsCollectionSnap, clientSnap, expenseSnap] = await Promise.all([
      userMetaRef(uid).get(),
      userSettingsRef(uid).get(),
      userClientsRef(uid).get(),
      userExpensesRef(uid).get(),
    ]);

    const settingsFromCollection = {};
    settingsCollectionSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && Object.prototype.hasOwnProperty.call(data, 'value')) {
        settingsFromCollection[docSnap.id] = data.value;
      }
    });

    const loaded = {
      ...(settingsSnap.exists ? settingsSnap.data() : {}),
      ...settingsFromCollection,
      photocrm_customers: clientSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), userId: uid })),
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
    cache[key] = value;

    if (key === 'photocrm_customers') {
      const customers = normalizeRecordsForUser(value, user.uid);
      await overwriteCollection(userClientsRef(user.uid), customers);
      return;
    }

    if (key === 'photocrm_expenses') {
      const expenses = normalizeRecordsForUser(value, user.uid);
      await overwriteCollection(userExpensesRef(user.uid), expenses);
      return;
    }

    const metaUpdatePromise = userMetaRef(user.uid).set({
      userId: user.uid,
      [key]: value,
      __updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    if (SETTINGS_KEYS.includes(key)) {
      const settingUpdatePromise = userSettingsRef(user.uid).doc(key).set({
        key,
        value,
        userId: user.uid,
        __updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      await Promise.all([metaUpdatePromise, settingUpdatePromise]);
      return;
    }

    await metaUpdatePromise;
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
    isRedirectResolved() {
      return redirectResolved;
    },
    async processRedirectResult() {
      return processRedirectResult();
    },
    async waitForInitialAuthState() {
      await ensureInitialized();
      return ensureInitialAuthStatePromise();
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
      return auth.signInWithPopup(provider);
    },
    async signInWithPopup() {
      return this.signInWithGoogle();
    },
    async signOut() {
      await ensureInitialized();
      return auth.signOut();
    },
    async onAuthChanged(callback) {
      await ensureInitialized();
      return auth.onAuthStateChanged(callback);
    }
  };
})();
