import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const GOOGLE_OAUTH_ACCESS_TOKEN_KEY = 'photocrm_google_oauth_access_token';
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const GOOGLE_CALENDAR_READ_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

const firebaseConfig = {
  apiKey: 'AIzaSyD6fb5NWN0bAe0vW1Z9piQxv9aYE0e-tGs',
  authDomain: 'photocrm-app.firebaseapp.com',
  projectId: 'photocrm-app',
  storageBucket: 'photocrm-app.firebasestorage.app',
  messagingSenderId: '1022053730718',
  appId: '1:1022053730718:web:ca1349d94e1cac107b2e8f',
};

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
  'photocrm_form_field_visibility',
  'photocrm_google_calendar_auto_sync',
  'photocrm_google_calendar_selected_id',
  'preferred_view',
];

const DATA_KEYS = [
  'photocrm_customers',
  'photocrm_expenses',
  ...SETTINGS_KEYS,
];

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const cache = {};

const firebaseInitPromise = setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error('Auth persistence setup failed', err);
});

let redirectResolved = false;
let initialAuthStatePromise = null;
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

function ensureInitialAuthStatePromise() {
  if (initialAuthStatePromise) return initialAuthStatePromise;
  initialAuthStatePromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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

function userMetaRef(uid) {
  return doc(db, 'users', uid, 'meta', 'state');
}

function userMigrationRef(uid) {
  return doc(db, 'users', uid, 'meta', 'migration');
}

function userSettingsCol(uid) {
  return collection(db, 'users', uid, 'settings');
}

function userSettingsDoc(uid, key) {
  return doc(db, 'users', uid, 'settings', key);
}

function userProjectsCol(uid) {
  return collection(db, 'users', uid, 'projects');
}

function userLegacyClientsCol(uid) {
  return collection(db, 'users', uid, 'clients');
}

function userExpensesCol(uid) {
  return collection(db, 'users', uid, 'expenses');
}

async function overwriteCollection(collectionRef, records) {
  const previous = await getDocs(collectionRef);
  const batch = writeBatch(db);

  previous.forEach((docSnap) => batch.delete(docSnap.ref));

  records.forEach((record) => {
    const docId = String(record.id || doc(collectionRef).id);
    batch.set(doc(collectionRef, docId), {
      ...record,
      id: docId,
    });
  });

  await batch.commit();
}

async function mergeCollectionRecords(collectionRef, records) {
  if (!Array.isArray(records) || records.length === 0) return;
  const batch = writeBatch(db);
  records.forEach((record) => {
    const docId = String(record.id || doc(collectionRef).id);
    batch.set(doc(collectionRef, docId), {
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
    getDocs(userProjectsCol(uid)),
    getDocs(userLegacyClientsCol(uid)),
    getDocs(userExpensesCol(uid)),
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

async function syncSettingsToCloud(uid, settings) {
  const entries = Object.entries(settings);
  if (entries.length === 0) return;

  const batch = writeBatch(db);
  entries.forEach(([key, value]) => {
    batch.set(userSettingsDoc(uid, key), {
      key,
      value,
      userId: uid,
      __updatedAt: serverTimestamp(),
    }, { merge: true });
  });
  await batch.commit();
}

async function migrateLocalDataToCloud(user, options = {}) {
  const payload = localMigrationPayload();
  const uid = user.uid;
  const overwrite = options.overwrite === true;

  const customers = normalizeRecordsForUser(payload.photocrm_customers || [], uid);
  const expenses = normalizeRecordsForUser(payload.photocrm_expenses || [], uid);

  if (customers.length) {
    if (overwrite) await overwriteCollection(userProjectsCol(uid), customers);
    else await mergeCollectionRecords(userProjectsCol(uid), customers);
  }

  if (expenses.length) {
    if (overwrite) await overwriteCollection(userExpensesCol(uid), expenses);
    else await mergeCollectionRecords(userExpensesCol(uid), expenses);
  }

  const settings = {};
  SETTINGS_KEYS.forEach((key) => {
    if (payload[key] !== undefined) settings[key] = payload[key];
  });

  await syncSettingsToCloud(uid, settings);

  await setDoc(userMetaRef(uid), {
    ...settings,
    userId: uid,
    __updatedAt: serverTimestamp(),
  }, { merge: true });

  await setDoc(userMigrationRef(uid), {
    localStorageMigrated: true,
    migratedAt: serverTimestamp(),
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
  const [settingsSnap, settingsCollectionSnap, projectSnap, legacyClientSnap, expenseSnap] = await Promise.all([
    getDoc(userMetaRef(uid)),
    getDocs(userSettingsCol(uid)),
    getDocs(userProjectsCol(uid)),
    getDocs(userLegacyClientsCol(uid)),
    getDocs(userExpensesCol(uid)),
  ]);

  const settingsFromCollection = {};
  settingsCollectionSnap.forEach((docSnap) => {
    const data = docSnap.data();
    if (data && Object.prototype.hasOwnProperty.call(data, 'value')) {
      settingsFromCollection[docSnap.id] = data.value;
    }
  });

  const projectDocs = projectSnap.docs.length > 0 ? projectSnap.docs : legacyClientSnap.docs;

  if (projectSnap.docs.length === 0 && legacyClientSnap.docs.length > 0) {
    mergeCollectionRecords(
      userProjectsCol(uid),
      legacyClientSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data(), userId: uid }))
    ).catch((err) => {
      console.warn('Legacy clients->projects migration failed', err);
    });
  }

  const loaded = {
    ...(settingsSnap.exists() ? settingsSnap.data() : {}),
    ...settingsFromCollection,
    photocrm_customers: projectDocs.map((entry) => ({ id: entry.id, ...entry.data(), userId: uid })),
    photocrm_expenses: expenseSnap.docs.map((entry) => ({ id: entry.id, ...entry.data(), userId: uid })),
  };

  Object.keys(cache).forEach((key) => delete cache[key]);
  Object.assign(cache, loaded);
  return loaded;
}

async function ensureCloudData(user) {
  const summary = await getCloudDataSummary(user.uid);
  await setDoc(userMigrationRef(user.uid), {
    lastLoginAt: serverTimestamp(),
    hasCloudData: summary.hasCloudData,
  }, { merge: true });

  return loadCloudDataForUser(user);
}

async function updateKey(user, key, value) {
  cache[key] = value;

  if (key === 'photocrm_customers') {
    const customers = normalizeRecordsForUser(value, user.uid);
    await overwriteCollection(userProjectsCol(user.uid), customers);
    return;
  }

  if (key === 'photocrm_expenses') {
    const expenses = normalizeRecordsForUser(value, user.uid);
    await overwriteCollection(userExpensesCol(user.uid), expenses);
    return;
  }

  const metaPromise = setDoc(userMetaRef(user.uid), {
    userId: user.uid,
    [key]: value,
    __updatedAt: serverTimestamp(),
  }, { merge: true });

  if (SETTINGS_KEYS.includes(key)) {
    const settingsPromise = setDoc(userSettingsDoc(user.uid, key), {
      key,
      value,
      userId: user.uid,
      __updatedAt: serverTimestamp(),
    }, { merge: true });
    await Promise.all([metaPromise, settingsPromise]);
    return;
  }

  await metaPromise;
}

async function processRedirectResult() {
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

  async getCurrentUserAsync() {
    await ensureInitialized();
    if (auth.currentUser) return auth.currentUser;
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user || null);
      });
    });
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

  async waitForInitialAuthState() {
    await ensureInitialized();
    return ensureInitialAuthStatePromise();
  },

  async loadForUser(user) {
    await ensureInitialized();
    const targetUser = user || auth.currentUser;
    if (!targetUser) return null;
    return ensureCloudData(targetUser);
  },

  async saveKey(key, value) {
    await ensureInitialized();
    const user = auth.currentUser;
    if (!user) return;
    return updateKey(user, key, value);
  },

  async signInWithGoogle() {
    await ensureInitialized();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    provider.addScope(GOOGLE_CALENDAR_SCOPE);
    provider.addScope(GOOGLE_CALENDAR_READ_SCOPE);

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
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
    return firebaseSignOut(auth);
  },

  onAuthChanged(callback) {
    return onAuthStateChanged(auth, (user) => {
      if (!user) setGoogleOAuthAccessToken('');
      callback(user);
    });
  },
};
