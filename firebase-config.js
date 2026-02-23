(function () {
  'use strict';

  const firebaseConfig = {
    apiKey: "AIzaSyD6fb5NWN0bAe0vW1Z9piQxv9aYE0e-tGs",
    authDomain: "photocrm-app.firebaseapp.com",
    projectId: "photocrm-app",
    storageBucket: "photocrm-app.firebasestorage.app",
    messagingSenderId: "1022053730718",
    appId: "1:1022053730718:web:ca1349d94e1cac107b2e8f"
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const cache = {};

  function localMigrationPayload() {
    const keys = [
      'photocrm_customers',
      'photocrm_options',
      'photocrm_team',
      'photocrm_theme',
      'photocrm_lang',
      'photocrm_tax_settings',
      'photocrm_invoice_sender_profile',
      'photocrm_expenses',
      'photocrm_currency',
      'photocrm_custom_fields',
      'photocrm_calendar_filters',
      'preferred_view'
    ];

    const payload = {};
    keys.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw === null) return;
      try {
        payload[key] = JSON.parse(raw);
      } catch {
        payload[key] = raw;
      }
    });
    return payload;
  }

  function normalizeMigrationDataForUser(payload, uid) {
    const normalized = { ...payload };
    if (Array.isArray(normalized.photocrm_customers)) {
      normalized.photocrm_customers = normalized.photocrm_customers.map((customer) => ({
        ...customer,
        userId: uid,
      }));
    }
    return normalized;
  }

  function getUserMainDocRef(uid) {
    return db.collection('users').doc(uid).collection('app').doc('main');
  }

  async function ensureCloudData(user) {
    const ref = getUserMainDocRef(user.uid);
    const snap = await ref.get();

    if (!snap.exists) {
      const migratedData = normalizeMigrationDataForUser(localMigrationPayload(), user.uid);
      await ref.set({
        ...migratedData,
        userId: user.uid,
        __migratedFromLocalStorage: true,
        __updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    const finalSnap = await ref.get();
    const data = finalSnap.data() || {};
    Object.keys(cache).forEach((k) => delete cache[k]);
    Object.assign(cache, data);
    return data;
  }

  async function updateKey(user, key, value) {
    if (!user) return;
    cache[key] = value;
    const ref = getUserMainDocRef(user.uid);
    await ref.set({
      userId: user.uid,
      [key]: value,
      __updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  window.FirebaseService = {
    auth,
    db,
    getCurrentUser() {
      return auth.currentUser;
    },
    getCachedData(key) {
      return cache[key];
    },
    getAllCachedData() {
      return { ...cache };
    },
    async loadForUser(user) {
      return ensureCloudData(user);
    },
    async saveKey(key, value) {
      const user = auth.currentUser;
      if (!user) return;
      return updateKey(user, key, value);
    },
    signInWithGoogle() {
      const provider = new firebase.auth.GoogleAuthProvider();
      return auth.signInWithPopup(provider);
    },
    signOut() {
      return auth.signOut();
    },
    onAuthChanged(callback) {
      return auth.onAuthStateChanged(callback);
    }
  };
})();
