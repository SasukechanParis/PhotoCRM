import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  multiFactor,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  TotpMultiFactorGenerator,
  getMultiFactorResolver,
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
  query,
  where,
  orderBy,
  limit,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const GOOGLE_OAUTH_ACCESS_TOKEN_KEY = 'photocrm_google_oauth_access_token';
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const GOOGLE_CALENDAR_READ_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const SUPPORT_CONTACT_EMAIL = 'pholio.support@icloud.com';
const USER_PLAN_KEY = 'photocrm_user_plan';
const USER_BILLING_PROFILE_KEY = 'photocrm_user_billing_profile';
const ADMIN_EMAILS = new Set(['sasuke.photographe@gmail.com']);
const DEFAULT_USER_PLAN = 'free';
const VALID_USER_PLANS = new Set(['free', 'individual', 'small_team', 'medium_team', 'enterprise']);
const ADMIN_DEVICE_LOCK_DOC_ID = 'device_lock';
const ADMIN_SECURITY_LOGS_COLLECTION = 'admin_security_logs';
const ADMIN_SECURE_SESSION_TIMEOUT_MS = 60 * 60 * 1000;

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
  USER_PLAN_KEY,
  USER_BILLING_PROFILE_KEY,
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
let pendingMfaSignInResolver = null;
let pendingTotpEnrollment = null;
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

function toTimestampMs(value) {
  if (!value) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value?.toMillis === 'function') {
    const millis = Number(value.toMillis());
    return Number.isFinite(millis) ? millis : 0;
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    const nanos = typeof value.nanoseconds === 'number' ? value.nanoseconds : 0;
    return (value.seconds * 1000) + Math.floor(nanos / 1000000);
  }
  return 0;
}

function getRecordUpdatedAtMs(record) {
  if (!record || typeof record !== 'object') return 0;
  return Math.max(
    toTimestampMs(record.updatedAt),
    toTimestampMs(record.createdAt),
    toTimestampMs(record.__updatedAt),
  );
}

function getLatestUpdatedAtMsFromRecords(records) {
  if (!Array.isArray(records) || records.length === 0) return 0;
  return records.reduce((latest, record) => Math.max(latest, getRecordUpdatedAtMs(record)), 0);
}

function getLatestUpdatedAtMsFromDocSnapshots(docs) {
  if (!Array.isArray(docs) || docs.length === 0) return 0;
  return docs.reduce((latest, docSnap) => {
    const data = docSnap?.data?.() || {};
    return Math.max(latest, getRecordUpdatedAtMs(data));
  }, 0);
}

function userMetaRef(uid) {
  return doc(db, 'users', uid, 'meta', 'state');
}

function userRootRef(uid) {
  return doc(db, 'users', uid);
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

function adminUserSummaryRef(uid) {
  return doc(db, 'admin_user_summaries', uid);
}

function adminUserSummariesCol() {
  return collection(db, 'admin_user_summaries');
}

function supportTicketsCol() {
  return collection(db, 'support_tickets');
}

function adminDeviceLockRef() {
  return doc(db, 'admin_config', ADMIN_DEVICE_LOCK_DOC_ID);
}

function adminApprovedDevicesCol() {
  return collection(db, 'admin_config', ADMIN_DEVICE_LOCK_DOC_ID, 'approved_devices');
}

function adminApprovedDeviceRef(deviceId) {
  return doc(db, 'admin_config', ADMIN_DEVICE_LOCK_DOC_ID, 'approved_devices', String(deviceId || ''));
}

function adminPendingDevicesCol() {
  return collection(db, 'admin_config', ADMIN_DEVICE_LOCK_DOC_ID, 'pending_devices');
}

function adminPendingDeviceRef(deviceId) {
  return doc(db, 'admin_config', ADMIN_DEVICE_LOCK_DOC_ID, 'pending_devices', String(deviceId || ''));
}

function adminSecurityLogsCol() {
  return collection(db, ADMIN_SECURITY_LOGS_COLLECTION);
}

function userAdminSessionRef(uid) {
  return doc(db, 'users', uid, 'meta', 'admin_session');
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

function normalizeUserPlan(plan) {
  const normalized = String(plan || '').trim().toLowerCase();
  if (normalized === 'team' || normalized === 'small-team' || normalized === 'smallteam') return 'small_team';
  if (normalized === 'medium-team' || normalized === 'mediumteam') return 'medium_team';
  if (normalized === 'pro') return 'individual';
  if (normalized === 'ent') return 'enterprise';
  return VALID_USER_PLANS.has(normalized) ? normalized : DEFAULT_USER_PLAN;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.has(normalizeEmail(email));
}

function isAdminUser(user) {
  return isAdminEmail(user?.email);
}

function sanitizeBillingProfile(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    fullName: String(src.fullName || '').trim(),
    address: String(src.address || '').trim(),
    siretNumber: String(src.siretNumber || '').trim(),
    invoiceRegistrationNumber: String(src.invoiceRegistrationNumber || '').trim(),
    email: String(src.email || '').trim(),
  };
}

function getCachedPlan() {
  return normalizeUserPlan(cache.plan || cache[USER_PLAN_KEY] || DEFAULT_USER_PLAN);
}

function getCachedProjectCount() {
  return Array.isArray(cache.photocrm_customers) ? cache.photocrm_customers.length : 0;
}

async function syncUserProfileDoc(user, options = {}) {
  if (!user?.uid) return;
  const billingProfile = sanitizeBillingProfile(options.billingProfile ?? cache[USER_BILLING_PROFILE_KEY]);
  const baseEmail = String(options.email || billingProfile.email || user.email || '').trim();
  const email = baseEmail || `${user.uid}@unknown.local`;
  const fullName = String(options.fullName || billingProfile.fullName || user.displayName || '').trim();
  const plan = normalizeUserPlan(options.plan || getCachedPlan());

  await setDoc(userRootRef(user.uid), {
    userId: user.uid,
    uid: user.uid,
    email,
    displayName: String(user.displayName || '').trim(),
    photoURL: String(user.photoURL || '').trim(),
    fullName,
    companyName: fullName,
    address: billingProfile.address,
    siretNumber: billingProfile.siretNumber,
    invoiceRegistrationNumber: billingProfile.invoiceRegistrationNumber,
    plan,
    billingProfile: {
      ...billingProfile,
      email,
    },
    __updatedAt: serverTimestamp(),
  }, { merge: true });
}

async function syncAdminUserSummary(user, options = {}) {
  if (!user?.uid) return;
  const billingProfile = sanitizeBillingProfile(options.billingProfile ?? cache[USER_BILLING_PROFILE_KEY]);
  const baseEmail = String(options.email || billingProfile.email || user.email || '').trim();
  const email = baseEmail || `${user.uid}@unknown.local`;
  const plan = normalizeUserPlan(options.plan || getCachedPlan());
  const numericProjectCount = Number(options.projectCount);
  const projectCount = Number.isFinite(numericProjectCount)
    ? Math.max(0, Math.floor(numericProjectCount))
    : getCachedProjectCount();

  await setDoc(adminUserSummaryRef(user.uid), {
    userId: user.uid,
    email,
    plan,
    projectCount,
    __updatedAt: serverTimestamp(),
  }, { merge: true });
}

async function buildAdminUserOverview(user) {
  if (!isAdminUser(user)) {
    return {
      allowed: false,
      users: [],
      stats: {
        totalUsers: 0,
        totalProjects: 0,
        planCounts: { free: 0, individual: 0, small_team: 0, medium_team: 0, enterprise: 0 },
      },
    };
  }

  const snap = await getDocs(adminUserSummariesCol());
  const users = [];
  const planCounts = { free: 0, individual: 0, small_team: 0, medium_team: 0, enterprise: 0 };
  let totalProjects = 0;

  snap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const email = String(data.email || '').trim();
    const plan = normalizeUserPlan(data.plan || DEFAULT_USER_PLAN);
    const projectCount = Math.max(0, Math.floor(Number(data.projectCount) || 0));
    users.push({
      uid: docSnap.id,
      email,
      plan,
      projectCount,
    });
    if (Object.prototype.hasOwnProperty.call(planCounts, plan)) planCounts[plan] += 1;
    else planCounts.free += 1;
    totalProjects += projectCount;
  });

  users.sort((a, b) => a.email.localeCompare(b.email));
  return {
    allowed: true,
    users,
    stats: {
      totalUsers: users.length,
      totalProjects,
      planCounts,
    },
  };
}

function toSupportTicketListItem(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    userId: String(data.userId || '').trim(),
    email: String(data.email || '').trim(),
    displayName: String(data.displayName || '').trim(),
    subject: String(data.subject || '').trim(),
    category: String(data.category || 'bug').trim().toLowerCase(),
    message: String(data.message || '').trim(),
    language: String(data.language || '').trim(),
    currency: String(data.currency || '').trim(),
    status: String(data.status || 'pending').trim().toLowerCase(),
    ai_draft_reply: String(data.ai_draft_reply || '').trim(),
    admin_reply: data.admin_reply && typeof data.admin_reply === 'object'
      ? {
        message: String(data.admin_reply.message || '').trim(),
        by: String(data.admin_reply.by || '').trim(),
        byUid: String(data.admin_reply.byUid || '').trim(),
        repliedAtIso: String(data.admin_reply.repliedAtIso || '').trim(),
      }
      : null,
    user_notification_pending: !!data.user_notification_pending,
    user_notification_message: String(data.user_notification_message || '').trim(),
    createdAtIso: String(data.createdAtIso || '').trim(),
    repliedAtIso: String(data.repliedAtIso || '').trim(),
    updatedAtIso: String(data.updatedAtIso || '').trim(),
  };
}

function sortSupportTicketsByCreatedAtDesc(a, b) {
  const aTime = Number(new Date(a?.createdAtIso || 0).getTime()) || 0;
  const bTime = Number(new Date(b?.createdAtIso || 0).getTime()) || 0;
  return bTime - aTime;
}

async function buildAdminSupportTickets(user) {
  if (!isAdminUser(user)) {
    return { allowed: false, tickets: [] };
  }

  let snap;
  try {
    snap = await getDocs(query(supportTicketsCol(), orderBy('createdAt', 'desc'), limit(300)));
  } catch (err) {
    console.warn('Support tickets ordered query failed; fallback to plain collection scan.', err);
    snap = await getDocs(supportTicketsCol());
  }

  const tickets = snap.docs.map(toSupportTicketListItem).sort(sortSupportTicketsByCreatedAtDesc);
  return { allowed: true, tickets };
}

async function buildCurrentUserSupportTickets(user) {
  if (!user?.uid) return { allowed: false, tickets: [] };

  let snap;
  try {
    snap = await getDocs(query(
      supportTicketsCol(),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(200),
    ));
  } catch (err) {
    console.warn('Support tickets user query failed; fallback without orderBy.', err);
    snap = await getDocs(query(
      supportTicketsCol(),
      where('userId', '==', user.uid),
      limit(200),
    ));
  }
  const tickets = snap.docs.map(toSupportTicketListItem).sort(sortSupportTicketsByCreatedAtDesc);
  return { allowed: true, tickets };
}

async function replySupportTicketByAdmin(user, ticketId, payload = {}) {
  if (!isAdminUser(user)) throw new Error('forbidden');
  const normalizedTicketId = String(ticketId || '').trim();
  if (!normalizedTicketId) throw new Error('invalid_ticket_id');

  const ticketRef = doc(db, 'support_tickets', normalizedTicketId);
  const existingSnap = await getDoc(ticketRef);
  if (!existingSnap.exists()) throw new Error('ticket_not_found');

  const safePayload = payload && typeof payload === 'object' ? payload : {};
  const replyMessage = String(safePayload.replyMessage || '').trim();
  if (!replyMessage) throw new Error('reply_required');
  const aiDraftReply = String(safePayload.aiDraftReply || '').trim();
  const repliedAtIso = new Date().toISOString();
  const adminName = String(user.displayName || user.email || 'Admin').trim();

  await setDoc(ticketRef, {
    status: 'replied',
    ai_draft_reply: aiDraftReply,
    admin_reply: {
      message: replyMessage,
      by: adminName,
      byUid: user.uid,
      repliedAt: serverTimestamp(),
      repliedAtIso,
    },
    repliedAt: serverTimestamp(),
    repliedAtIso,
    user_notification_pending: true,
    user_notification_message: replyMessage,
    updatedAt: serverTimestamp(),
    updatedAtIso: repliedAtIso,
  }, { merge: true });

  return { id: normalizedTicketId, repliedAtIso, status: 'replied' };
}

function normalizeDeviceId(value) {
  return String(value || '').trim().slice(0, 160);
}

function sanitizeAdminDevicePayload(payload = {}) {
  const src = payload && typeof payload === 'object' ? payload : {};
  const deviceId = normalizeDeviceId(src.deviceId || src.id);
  return {
    deviceId,
    fingerprintHash: String(src.fingerprintHash || '').trim().slice(0, 256),
    label: String(src.label || '').trim().slice(0, 160) || 'Unknown Device',
    platform: String(src.platform || '').trim().slice(0, 120),
    userAgent: String(src.userAgent || '').trim().slice(0, 1024),
    resolution: String(src.resolution || '').trim().slice(0, 80),
    timezone: String(src.timezone || '').trim().slice(0, 80),
    language: String(src.language || '').trim().slice(0, 40),
  };
}

function mapAdminDeviceSnapshot(docSnap, status = 'approved') {
  const data = docSnap?.data?.() || {};
  const rawStatus = String(data.status || status || '').trim().toLowerCase();
  return {
    id: docSnap.id,
    deviceId: docSnap.id,
    status: rawStatus || status,
    label: String(data.label || '').trim(),
    platform: String(data.platform || '').trim(),
    resolution: String(data.resolution || '').trim(),
    timezone: String(data.timezone || '').trim(),
    language: String(data.language || '').trim(),
    fingerprintHash: String(data.fingerprintHash || '').trim(),
    userAgent: String(data.userAgent || '').trim(),
    createdAtIso: String(data.createdAtIso || '').trim(),
    requestedAtIso: String(data.requestedAtIso || '').trim(),
    approvedAtIso: String(data.approvedAtIso || '').trim(),
    approvedBy: String(data.approvedBy || '').trim(),
    lastSeenAtIso: String(data.lastSeenAtIso || '').trim(),
    revokedAtIso: String(data.revokedAtIso || '').trim(),
  };
}

function sortAdminDevicesByRecent(a, b) {
  const aTime = Math.max(
    toTimestampMs(a?.lastSeenAtIso),
    toTimestampMs(a?.approvedAtIso),
    toTimestampMs(a?.requestedAtIso),
    toTimestampMs(a?.createdAtIso),
  );
  const bTime = Math.max(
    toTimestampMs(b?.lastSeenAtIso),
    toTimestampMs(b?.approvedAtIso),
    toTimestampMs(b?.requestedAtIso),
    toTimestampMs(b?.createdAtIso),
  );
  return bTime - aTime;
}

function fallbackHashHex(input) {
  const text = String(input || '');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

async function sha256Hex(input) {
  const text = String(input || '');
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || typeof TextEncoder === 'undefined') {
    return `fallback_${fallbackHashHex(text)}`;
  }
  const encoded = new TextEncoder().encode(text);
  const digest = await subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

function getAdminMfaState(user) {
  const isAdmin = isAdminUser(user);
  const factors = Array.isArray(user?.multiFactor?.enrolledFactors)
    ? user.multiFactor.enrolledFactors
    : [];
  return {
    required: isAdmin,
    enrolled: factors.length > 0,
    verified: factors.length > 0,
    enrolledFactorCount: factors.length,
    factors: factors.map((factor) => ({
      uid: String(factor?.uid || factor?.factorId || '').trim(),
      displayName: String(factor?.displayName || '').trim(),
      phoneNumber: String(factor?.phoneNumber || '').trim(),
      enrollmentTime: String(factor?.enrollmentTime || '').trim(),
    })),
  };
}

async function probeAdminMfaOptionsForCurrentAdmin(user) {
  if (!user) throw new Error('not_logged_in');
  if (!isAdminUser(user)) throw new Error('not_admin');

  const enrolledFactors = Array.isArray(user?.multiFactor?.enrolledFactors)
    ? user.multiFactor.enrolledFactors
    : [];
  const enrolledFactorIds = enrolledFactors
    .map((factor) => String(factor?.factorId || '').trim())
    .filter(Boolean);

  const supportedFactorIds = [];
  if (TotpMultiFactorGenerator?.FACTOR_ID) {
    supportedFactorIds.push(String(TotpMultiFactorGenerator.FACTOR_ID));
  }

  let sessionInfo = { ok: false, keys: [], type: '', note: '' };
  let sessionErrorCode = '';
  let sessionErrorMessage = '';
  try {
    const session = await multiFactor(user).getSession();
    sessionInfo = {
      ok: true,
      keys: Object.keys(session || {}),
      type: String(session?.type || ''),
      note: 'Firebase SDK does not expose explicit allowed factorIds from getSession().',
    };
  } catch (err) {
    sessionErrorCode = String(err?.code || err?.name || '').trim();
    sessionErrorMessage = String(err?.message || '').trim();
    sessionInfo = {
      ok: false,
      keys: [],
      type: '',
      note: 'getSession() failed.',
    };
  }

  const availableFactorIds = Array.from(new Set(supportedFactorIds));
  const hasTotpInList = availableFactorIds.includes(String(TotpMultiFactorGenerator?.FACTOR_ID || 'totp'));
  const totpAvailable = hasTotpInList && !sessionErrorCode;
  return {
    availableFactorIds,
    enrolledFactorIds,
    sessionInfo,
    sessionErrorCode,
    sessionErrorMessage,
    totpAvailable,
  };
}

function mapMfaHint(hint) {
  return {
    uid: String(hint?.uid || '').trim(),
    factorId: String(hint?.factorId || '').trim(),
    displayName: String(hint?.displayName || '').trim(),
    phoneNumber: String(hint?.phoneNumber || '').trim(),
  };
}

function getPendingMfaChallenge() {
  if (!pendingMfaSignInResolver) return null;
  return {
    required: true,
    factorType: 'totp',
    hintCount: Array.isArray(pendingMfaSignInResolver.hints) ? pendingMfaSignInResolver.hints.length : 0,
    hints: (Array.isArray(pendingMfaSignInResolver.hints) ? pendingMfaSignInResolver.hints : [])
      .map(mapMfaHint),
    createdAtMs: Number(pendingMfaSignInResolver.__createdAtMs) || Date.now(),
  };
}

async function resolvePendingMfaSignInCode(oneTimePassword = '', hintUid = '') {
  const otp = String(oneTimePassword || '').trim();
  if (!pendingMfaSignInResolver) throw new Error('mfa_no_pending_challenge');
  if (!otp || otp.length < 6) throw new Error('mfa_invalid_code');
  const resolver = pendingMfaSignInResolver;
  const hints = Array.isArray(resolver.hints) ? resolver.hints : [];
  const selectedHint = hints.find((hint) => String(hint?.uid || '') === String(hintUid || '').trim())
    || hints.find((hint) => hint?.factorId === TotpMultiFactorGenerator.FACTOR_ID)
    || hints[0];
  if (!selectedHint) throw new Error('mfa_hint_not_found');
  if (selectedHint.factorId !== TotpMultiFactorGenerator.FACTOR_ID) {
    throw new Error('mfa_factor_not_supported');
  }
  const assertion = TotpMultiFactorGenerator.assertionForSignIn(selectedHint.uid, otp);
  const result = await resolver.resolveSignIn(assertion);
  pendingMfaSignInResolver = null;
  return result;
}

function clearPendingMfaSignInChallenge() {
  pendingMfaSignInResolver = null;
}

async function startTotpEnrollmentForCurrentAdmin(user, options = {}) {
  if (!user) throw new Error('not_logged_in');
  if (!isAdminUser(user)) throw new Error('not_admin');
  const safeOptions = options && typeof options === 'object' ? options : {};
  const issuer = String(safeOptions.issuer || 'Pholio').trim() || 'Pholio';
  const accountName = String(safeOptions.accountName || user.email || 'admin').trim() || 'admin';
  const session = await multiFactor(user).getSession();
  const totpSecret = await TotpMultiFactorGenerator.generateSecret(session);
  pendingTotpEnrollment = {
    uid: user.uid,
    issuer,
    accountName,
    secret: totpSecret,
    createdAtMs: Date.now(),
  };
  return {
    required: true,
    issuer,
    accountName,
    secretKey: String(totpSecret.secretKey || '').trim(),
    qrCodeUrl: String(totpSecret.generateQrCodeUrl(accountName, issuer) || '').trim(),
  };
}

function getPendingTotpEnrollment() {
  if (!pendingTotpEnrollment) return null;
  return {
    uid: pendingTotpEnrollment.uid,
    issuer: pendingTotpEnrollment.issuer,
    accountName: pendingTotpEnrollment.accountName,
    secretKey: String(pendingTotpEnrollment.secret?.secretKey || '').trim(),
    qrCodeUrl: String(pendingTotpEnrollment.secret?.generateQrCodeUrl(
      pendingTotpEnrollment.accountName,
      pendingTotpEnrollment.issuer
    ) || '').trim(),
  };
}

async function finalizeTotpEnrollmentForCurrentAdmin(user, oneTimePassword = '', displayName = 'Pholio Admin') {
  if (!user) throw new Error('not_logged_in');
  if (!isAdminUser(user)) throw new Error('not_admin');
  if (!pendingTotpEnrollment || pendingTotpEnrollment.uid !== user.uid) {
    throw new Error('totp_enrollment_not_started');
  }
  const otp = String(oneTimePassword || '').trim();
  if (!otp || otp.length < 6) throw new Error('mfa_invalid_code');
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(
    pendingTotpEnrollment.secret,
    otp,
  );
  await multiFactor(user).enroll(assertion, String(displayName || 'Pholio Admin').trim() || 'Pholio Admin');
  pendingTotpEnrollment = null;
  return {
    enrolled: true,
    mfa: getAdminMfaState(user),
  };
}

function cancelTotpEnrollment() {
  pendingTotpEnrollment = null;
}

async function createAdminSecureSession(user, options = {}) {
  if (!isAdminUser(user)) {
    return { allowed: false, reason: 'not_admin' };
  }
  const nowMs = Date.now();
  const issuedAtIso = new Date(nowMs).toISOString();
  const expiresAtMs = nowMs + ADMIN_SECURE_SESSION_TIMEOUT_MS;
  const expiresAtIso = new Date(expiresAtMs).toISOString();
  const device = sanitizeAdminDevicePayload(options.device || {});
  const mfa = options.mfa && typeof options.mfa === 'object'
    ? options.mfa
    : getAdminMfaState(user);
  const rawToken = `${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}.${Math.random().toString(36).slice(2)}.${nowMs.toString(36)}`;
  const tokenHash = await sha256Hex(rawToken);

  await setDoc(userAdminSessionRef(user.uid), {
    userId: user.uid,
    email: String(user.email || '').trim(),
    tokenHash,
    deviceId: device.deviceId,
    deviceLabel: device.label,
    mfaRequired: !!mfa.required,
    mfaVerified: !!mfa.verified,
    mfaEnrolledFactorCount: Number(mfa.enrolledFactorCount) || 0,
    issuedAt: serverTimestamp(),
    issuedAtIso,
    lastActivityAt: serverTimestamp(),
    lastActivityAtIso: issuedAtIso,
    expiresAtIso,
    expiresAtMs,
    status: 'active',
    __updatedAt: serverTimestamp(),
  }, { merge: true });

  return {
    allowed: true,
    token: rawToken,
    tokenHash,
    issuedAtIso,
    expiresAtIso,
    expiresAtMs,
  };
}

async function verifyAdminSecureSessionToken(user, rawToken = '') {
  if (!isAdminUser(user)) return { valid: false, reason: 'not_admin' };
  const token = String(rawToken || '').trim();
  if (!token) return { valid: false, reason: 'missing_session_token' };

  const sessionSnap = await getDoc(userAdminSessionRef(user.uid));
  if (!sessionSnap.exists()) return { valid: false, reason: 'session_not_found' };
  const sessionData = sessionSnap.data() || {};
  const status = String(sessionData.status || 'active').trim().toLowerCase();
  if (status !== 'active') return { valid: false, reason: 'session_inactive' };

  const expiresAtMs = Number(sessionData.expiresAtMs) || 0;
  if (expiresAtMs > 0 && Date.now() > expiresAtMs) {
    return { valid: false, reason: 'session_expired' };
  }

  const storedHash = String(sessionData.tokenHash || '').trim();
  if (!storedHash) return { valid: false, reason: 'session_hash_missing' };
  const currentHash = await sha256Hex(token);
  if (storedHash !== currentHash) return { valid: false, reason: 'session_token_mismatch' };
  return { valid: true, reason: 'ok', session: sessionData };
}

async function touchAdminSecureSession(user, options = {}) {
  if (!isAdminUser(user)) return { allowed: false, reason: 'not_admin' };
  const safeOptions = options && typeof options === 'object' ? options : {};
  const sessionCheck = await verifyAdminSecureSessionToken(user, safeOptions.token || '');
  if (!sessionCheck.valid) return { allowed: false, reason: sessionCheck.reason };
  const touchedAtIso = new Date().toISOString();
  await setDoc(userAdminSessionRef(user.uid), {
    userId: user.uid,
    lastActivityAt: serverTimestamp(),
    lastActivityAtIso: touchedAtIso,
    deviceId: normalizeDeviceId(safeOptions.deviceId),
    reason: String(safeOptions.reason || 'activity').trim(),
    __updatedAt: serverTimestamp(),
  }, { merge: true });
  return { allowed: true, touchedAtIso };
}

async function endAdminSecureSession(user, reason = 'manual') {
  if (!isAdminUser(user)) return { allowed: false, reason: 'not_admin' };
  const endedAtIso = new Date().toISOString();
  await setDoc(userAdminSessionRef(user.uid), {
    userId: user.uid,
    status: 'closed',
    closedReason: String(reason || 'manual').trim(),
    endedAt: serverTimestamp(),
    endedAtIso,
    __updatedAt: serverTimestamp(),
  }, { merge: true });
  return { allowed: true, endedAtIso };
}

async function enqueueUnauthorizedAccessEmailNotification(logPayload = {}) {
  // Placeholder hook:
  // Future Cloud Function can read this log and send an admin email alert.
  return {
    queued: false,
    provider: 'placeholder',
    logId: String(logPayload.logId || '').trim(),
  };
}

async function appendAdminSecurityLog(user, payload = {}) {
  if (!isAdminUser(user)) return { allowed: false, reason: 'not_admin' };
  const safePayload = payload && typeof payload === 'object' ? payload : {};
  const nowIso = new Date().toISOString();
  const device = sanitizeAdminDevicePayload(safePayload.device || {});
  const logRef = doc(adminSecurityLogsCol());
  const logEntry = {
    id: logRef.id,
    userId: user.uid,
    email: String(user.email || '').trim(),
    displayName: String(user.displayName || '').trim(),
    type: String(safePayload.type || 'admin_security_event').trim(),
    reason: String(safePayload.reason || '').trim(),
    message: String(safePayload.message || '').trim(),
    deviceId: device.deviceId,
    deviceLabel: device.label,
    platform: device.platform,
    resolution: device.resolution,
    timezone: device.timezone,
    language: device.language,
    userAgent: device.userAgent,
    fingerprintHash: device.fingerprintHash,
    metadata: safePayload.metadata && typeof safePayload.metadata === 'object'
      ? safePayload.metadata
      : {},
    createdAt: serverTimestamp(),
    createdAtIso: nowIso,
    __updatedAt: serverTimestamp(),
  };

  await setDoc(logRef, logEntry, { merge: true });
  const notifyResult = await enqueueUnauthorizedAccessEmailNotification({ ...logEntry, logId: logRef.id });
  await setDoc(logRef, {
    notification: notifyResult,
    notificationQueued: !!notifyResult?.queued,
    __updatedAt: serverTimestamp(),
  }, { merge: true });
  return { allowed: true, id: logRef.id, createdAtIso: nowIso };
}

async function logUnauthorizedAdminDeviceAttempt(user, devicePayload = {}, reason = 'unauthorized_device') {
  return appendAdminSecurityLog(user, {
    type: 'unauthorized_admin_device_attempt',
    reason,
    message: 'Unauthorized admin-device access attempt detected.',
    device: devicePayload,
  });
}

async function hasApprovedAdminDevices() {
  const approvedSnap = await getDocs(query(adminApprovedDevicesCol(), limit(1)));
  return !approvedSnap.empty;
}

async function fetchAdminDeviceLists() {
  const [approvedSnap, pendingSnap] = await Promise.all([
    getDocs(adminApprovedDevicesCol()),
    getDocs(adminPendingDevicesCol()),
  ]);
  const approved = approvedSnap.docs
    .map((docSnap) => mapAdminDeviceSnapshot(docSnap, 'approved'))
    .filter((device) => String(device.status || 'approved').toLowerCase() !== 'revoked')
    .sort(sortAdminDevicesByRecent);
  const pending = pendingSnap.docs
    .map((docSnap) => mapAdminDeviceSnapshot(docSnap, 'pending'))
    .filter((device) => String(device.status || 'pending').toLowerCase() !== 'revoked')
    .sort(sortAdminDevicesByRecent);
  return { approved, pending };
}

async function isTrustedApprovedAdminDevice(deviceId) {
  const normalizedId = normalizeDeviceId(deviceId);
  if (!normalizedId) return false;
  const approvedSnap = await getDoc(adminApprovedDeviceRef(normalizedId));
  if (!approvedSnap.exists()) return false;
  const status = String(approvedSnap.data()?.status || 'approved').toLowerCase();
  return status === 'approved';
}

async function bootstrapFirstApprovedAdminDevice(user, devicePayload = {}) {
  const device = sanitizeAdminDevicePayload(devicePayload);
  if (!device.deviceId) return { allowed: false, authorized: false, reason: 'invalid_device' };
  const nowIso = new Date().toISOString();
  await Promise.all([
    setDoc(adminApprovedDeviceRef(device.deviceId), {
      ...device,
      status: 'approved',
      trustedSeed: true,
      approvedBy: user.uid,
      approvedAt: serverTimestamp(),
      approvedAtIso: nowIso,
      createdAt: serverTimestamp(),
      createdAtIso: nowIso,
      lastSeenAt: serverTimestamp(),
      lastSeenAtIso: nowIso,
      __updatedAt: serverTimestamp(),
    }, { merge: true }),
    setDoc(adminDeviceLockRef(), {
      initialized: true,
      initializedBy: user.uid,
      initializedAt: serverTimestamp(),
      initializedAtIso: nowIso,
      lastApprovedDeviceId: device.deviceId,
      __updatedAt: serverTimestamp(),
    }, { merge: true }),
  ]);

  return {
    allowed: true,
    authorized: true,
    autoApproved: true,
    pending: false,
    reason: 'first_device_bootstrap',
    device,
  };
}

async function markApprovedAdminDeviceSeen(user, devicePayload = {}) {
  const device = sanitizeAdminDevicePayload(devicePayload);
  if (!device.deviceId) return { allowed: false, authorized: false, reason: 'invalid_device' };
  const approvedRef = adminApprovedDeviceRef(device.deviceId);
  const approvedSnap = await getDoc(approvedRef);
  if (!approvedSnap.exists()) {
    return { allowed: false, authorized: false, pending: true, reason: 'unauthorized_device', device };
  }
  const approvedData = approvedSnap.data() || {};
  const status = String(approvedData.status || 'approved').toLowerCase();
  if (status !== 'approved') {
    return { allowed: false, authorized: false, pending: true, reason: 'device_not_approved', device };
  }
  const storedFingerprintHash = String(approvedData.fingerprintHash || '').trim();
  const incomingFingerprintHash = String(device.fingerprintHash || '').trim();
  if (storedFingerprintHash && incomingFingerprintHash && storedFingerprintHash !== incomingFingerprintHash) {
    return { allowed: false, authorized: false, pending: true, reason: 'fingerprint_mismatch', device };
  }
  const nowIso = new Date().toISOString();
  const nextFingerprintHash = storedFingerprintHash || incomingFingerprintHash;
  await Promise.all([
    setDoc(approvedRef, {
      ...device,
      fingerprintHash: nextFingerprintHash,
      status: 'approved',
      lastSeenBy: user.uid,
      lastSeenAt: serverTimestamp(),
      lastSeenAtIso: nowIso,
      __updatedAt: serverTimestamp(),
    }, { merge: true }),
    deleteDoc(adminPendingDeviceRef(device.deviceId)).catch(() => {}),
    setDoc(adminDeviceLockRef(), {
      initialized: true,
      lastApprovedDeviceId: device.deviceId,
      lastApprovedSeenAt: serverTimestamp(),
      lastApprovedSeenAtIso: nowIso,
      __updatedAt: serverTimestamp(),
    }, { merge: true }),
  ]);
  return { allowed: true, authorized: true, pending: false, reason: 'authorized_device', device };
}

async function registerPendingAdminDevice(user, devicePayload = {}, reason = 'unauthorized_device') {
  const device = sanitizeAdminDevicePayload(devicePayload);
  if (!device.deviceId) return { allowed: false, authorized: false, reason: 'invalid_device' };
  const nowIso = new Date().toISOString();
  await Promise.all([
    setDoc(adminPendingDeviceRef(device.deviceId), {
      ...device,
      status: 'pending',
      requestedBy: user.uid,
      requestedAt: serverTimestamp(),
      requestedAtIso: nowIso,
      lastAttemptAt: serverTimestamp(),
      lastAttemptAtIso: nowIso,
      __updatedAt: serverTimestamp(),
    }, { merge: true }),
    setDoc(adminDeviceLockRef(), {
      initialized: true,
      lastPendingDeviceId: device.deviceId,
      lastPendingAt: serverTimestamp(),
      lastPendingAtIso: nowIso,
      __updatedAt: serverTimestamp(),
    }, { merge: true }),
  ]);
  await logUnauthorizedAdminDeviceAttempt(user, device, reason).catch((err) => {
    console.warn('Failed to write unauthorized admin-device log', err);
  });
  return { allowed: false, authorized: false, pending: true, reason, device };
}

async function enforceAdminDeviceLock(user, devicePayload = {}) {
  if (!isAdminUser(user)) return { allowed: false, authorized: false, reason: 'not_admin' };
  const device = sanitizeAdminDevicePayload(devicePayload);
  if (!device.deviceId) return { allowed: false, authorized: false, reason: 'invalid_device' };

  const hasApproved = await hasApprovedAdminDevices();
  if (!hasApproved) {
    return bootstrapFirstApprovedAdminDevice(user, device);
  }
  const approvedResult = await markApprovedAdminDeviceSeen(user, device);
  if (approvedResult.allowed && approvedResult.authorized) return approvedResult;
  return registerPendingAdminDevice(user, device, approvedResult.reason || 'unauthorized_device');
}

async function getAdminSecurityBootstrap(user, payload = {}) {
  if (!isAdminUser(user)) {
    return {
      allowed: false,
      authorized: false,
      isAdmin: false,
      reason: 'not_admin',
      mfa: { required: false, verified: false, enrolled: false, enrolledFactorCount: 0, factors: [] },
      devices: { approved: [], pending: [] },
      session: null,
    };
  }

  const safePayload = payload && typeof payload === 'object' ? payload : {};
  const device = sanitizeAdminDevicePayload(safePayload.device || {});
  const mfa = getAdminMfaState(user);
  if (!mfa.verified) {
    await appendAdminSecurityLog(user, {
      type: 'admin_mfa_required',
      reason: 'mfa_required',
      message: 'Admin login blocked because MFA enrollment is missing.',
      device,
      metadata: { enrolledFactorCount: mfa.enrolledFactorCount || 0 },
    }).catch((err) => {
      console.warn('Failed to write MFA-required admin log', err);
    });
    return {
      allowed: false,
      authorized: false,
      isAdmin: true,
      reason: 'mfa_required',
      mfa,
      device,
      devices: await fetchAdminDeviceLists(),
      session: null,
    };
  }

  const deviceLockResult = await enforceAdminDeviceLock(user, device);
  const devices = await fetchAdminDeviceLists();
  if (!deviceLockResult.authorized) {
    return {
      allowed: false,
      authorized: false,
      isAdmin: true,
      reason: deviceLockResult.reason || 'unauthorized_device',
      mfa,
      device,
      devices,
      session: null,
    };
  }

  const session = await createAdminSecureSession(user, { device, mfa });
  return {
    allowed: true,
    authorized: true,
    isAdmin: true,
    reason: 'authorized',
    mfa,
    device,
    devices,
    session,
  };
}

async function assertTrustedAdminDeviceOrThrow(user, currentDeviceId = '', sessionToken = '') {
  if (!isAdminUser(user)) throw new Error('not_admin');
  const sessionCheck = await verifyAdminSecureSessionToken(user, sessionToken);
  if (!sessionCheck.valid) throw new Error(sessionCheck.reason || 'invalid_admin_session');
  const normalizedCurrentDeviceId = normalizeDeviceId(currentDeviceId);
  const trusted = await isTrustedApprovedAdminDevice(normalizedCurrentDeviceId);
  if (!trusted) throw new Error('untrusted_device');
  return normalizedCurrentDeviceId;
}

async function getAdminDeviceManagementState(user, payload = {}) {
  if (!isAdminUser(user)) return { allowed: false, reason: 'not_admin', devices: { approved: [], pending: [] } };
  const safePayload = payload && typeof payload === 'object' ? payload : {};
  try {
    await assertTrustedAdminDeviceOrThrow(
      user,
      safePayload.currentDeviceId || '',
      safePayload.sessionToken || safePayload.token || ''
    );
  } catch (err) {
    return {
      allowed: false,
      reason: String(err?.message || 'unauthorized_device'),
      devices: { approved: [], pending: [] },
    };
  }
  return {
    allowed: true,
    reason: 'authorized',
    devices: await fetchAdminDeviceLists(),
  };
}

async function approvePendingAdminDevice(user, targetDeviceId, payload = {}) {
  const currentDeviceId = await assertTrustedAdminDeviceOrThrow(
    user,
    payload.currentDeviceId || '',
    payload.sessionToken || payload.token || ''
  );
  const normalizedTargetDeviceId = normalizeDeviceId(targetDeviceId);
  if (!normalizedTargetDeviceId) throw new Error('invalid_device');
  const pendingRef = adminPendingDeviceRef(normalizedTargetDeviceId);
  const pendingSnap = await getDoc(pendingRef);
  if (!pendingSnap.exists()) throw new Error('pending_device_not_found');
  const pendingData = pendingSnap.data() || {};
  const nowIso = new Date().toISOString();
  await Promise.all([
    setDoc(adminApprovedDeviceRef(normalizedTargetDeviceId), {
      ...pendingData,
      status: 'approved',
      approvedBy: user.uid,
      approvedByDeviceId: currentDeviceId,
      approvedAt: serverTimestamp(),
      approvedAtIso: nowIso,
      lastSeenAt: serverTimestamp(),
      lastSeenAtIso: nowIso,
      __updatedAt: serverTimestamp(),
    }, { merge: true }),
    deleteDoc(pendingRef),
    setDoc(adminDeviceLockRef(), {
      lastApprovedDeviceId: normalizedTargetDeviceId,
      lastApprovedAt: serverTimestamp(),
      lastApprovedAtIso: nowIso,
      __updatedAt: serverTimestamp(),
    }, { merge: true }),
  ]);
  await appendAdminSecurityLog(user, {
    type: 'admin_device_approved',
    reason: 'device_approved',
    message: 'Pending admin device approved from trusted device.',
    device: { ...pendingData, deviceId: normalizedTargetDeviceId },
    metadata: { approvedByDeviceId: currentDeviceId },
  }).catch((err) => {
    console.warn('Failed to write admin-device approved log', err);
  });
  return { allowed: true, reason: 'approved', deviceId: normalizedTargetDeviceId };
}

async function revokeApprovedAdminDevice(user, targetDeviceId, payload = {}) {
  const currentDeviceId = await assertTrustedAdminDeviceOrThrow(
    user,
    payload.currentDeviceId || '',
    payload.sessionToken || payload.token || ''
  );
  const normalizedTargetDeviceId = normalizeDeviceId(targetDeviceId);
  if (!normalizedTargetDeviceId) throw new Error('invalid_device');
  if (normalizedTargetDeviceId === currentDeviceId) throw new Error('cannot_revoke_current_device');
  const approvedRef = adminApprovedDeviceRef(normalizedTargetDeviceId);
  const approvedSnap = await getDoc(approvedRef);
  if (!approvedSnap.exists()) throw new Error('approved_device_not_found');
  const approvedData = approvedSnap.data() || {};
  const nowIso = new Date().toISOString();
  await Promise.all([
    deleteDoc(approvedRef),
    deleteDoc(adminPendingDeviceRef(normalizedTargetDeviceId)).catch(() => {}),
    setDoc(adminDeviceLockRef(), {
      lastRevokedDeviceId: normalizedTargetDeviceId,
      lastRevokedAt: serverTimestamp(),
      lastRevokedAtIso: nowIso,
      __updatedAt: serverTimestamp(),
    }, { merge: true }),
  ]);
  await appendAdminSecurityLog(user, {
    type: 'admin_device_revoked',
    reason: 'device_revoked',
    message: 'Approved admin device access revoked.',
    device: { ...approvedData, deviceId: normalizedTargetDeviceId },
    metadata: { revokedByDeviceId: currentDeviceId },
  }).catch((err) => {
    console.warn('Failed to write admin-device revoked log', err);
  });
  return { allowed: true, reason: 'revoked', deviceId: normalizedTargetDeviceId };
}

function buildLocalDataSummary(payload = localMigrationPayload()) {
  const customers = Array.isArray(payload.photocrm_customers) ? payload.photocrm_customers.length : 0;
  const expenses = Array.isArray(payload.photocrm_expenses) ? payload.photocrm_expenses.length : 0;
  const latestUpdatedAtMs = Math.max(
    getLatestUpdatedAtMsFromRecords(payload.photocrm_customers),
    getLatestUpdatedAtMsFromRecords(payload.photocrm_expenses),
  );
  return {
    hasLocalData: customers > 0 || expenses > 0,
    customers,
    expenses,
    latestUpdatedAtMs,
    latestUpdatedAt: latestUpdatedAtMs > 0 ? new Date(latestUpdatedAtMs).toISOString() : '',
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
  const latestUpdatedAtMs = Math.max(
    getLatestUpdatedAtMsFromDocSnapshots(projectsSnap.docs),
    getLatestUpdatedAtMsFromDocSnapshots(legacyClientsSnap.docs),
    getLatestUpdatedAtMsFromDocSnapshots(expensesSnap.docs),
  );

  return {
    projects,
    legacyClients,
    expenses,
    hasCloudData: (projects + legacyClients + expenses) > 0,
    latestUpdatedAtMs,
    latestUpdatedAt: latestUpdatedAtMs > 0 ? new Date(latestUpdatedAtMs).toISOString() : '',
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
  const normalizedPlan = normalizeUserPlan(payload[USER_PLAN_KEY] || payload.plan || DEFAULT_USER_PLAN);

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
  settings[USER_PLAN_KEY] = normalizeUserPlan(settings[USER_PLAN_KEY] || normalizedPlan);

  await syncSettingsToCloud(uid, settings);

  await setDoc(userMetaRef(uid), {
    ...settings,
    plan: settings[USER_PLAN_KEY],
    userId: uid,
    __updatedAt: serverTimestamp(),
  }, { merge: true });

  await setDoc(userMigrationRef(uid), {
    localStorageMigrated: true,
    migratedAt: serverTimestamp(),
    customerCount: customers.length,
    expenseCount: expenses.length,
    overwrite,
    source: String(options.source || 'localStorage_manual_merge'),
  }, { merge: true });

  const profileSyncResults = await Promise.allSettled([
    syncUserProfileDoc(user, {
      plan: settings[USER_PLAN_KEY],
      billingProfile: settings[USER_BILLING_PROFILE_KEY],
    }),
    syncAdminUserSummary(user, {
      plan: settings[USER_PLAN_KEY],
      projectCount: customers.length,
      billingProfile: settings[USER_BILLING_PROFILE_KEY],
    }),
  ]);
  profileSyncResults.forEach((result) => {
    if (result.status === 'rejected') {
      console.warn('Post-migration profile sync failed', result.reason);
    }
  });

  return {
    customerCount: customers.length,
    expenseCount: expenses.length,
    overwrite,
    hadLocalData: hasLocalData(payload),
  };
}

async function autoSyncLocalDataWithCloud(user) {
  const localSummary = buildLocalDataSummary();
  if (!localSummary.hasLocalData) {
    return { merged: false, reason: 'no_local_data', customerCount: 0, expenseCount: 0, overwrite: false };
  }

  const cloudSummary = await getCloudDataSummary(user.uid);
  const localUpdatedAtMs = Number(localSummary.latestUpdatedAtMs) || 0;
  const cloudUpdatedAtMs = Number(cloudSummary.latestUpdatedAtMs) || 0;
  const hasCloudData = !!cloudSummary.hasCloudData;

  const shouldOverwrite = hasCloudData && localUpdatedAtMs > 0 && localUpdatedAtMs > cloudUpdatedAtMs;
  const shouldMerge = !hasCloudData
    || shouldOverwrite
    || (hasCloudData && localUpdatedAtMs === 0 && (localSummary.customers > 0 || localSummary.expenses > 0));

  if (!shouldMerge) {
    return { merged: false, reason: 'cloud_newer', customerCount: 0, expenseCount: 0, overwrite: false };
  }

  const result = await migrateLocalDataToCloud(user, {
    overwrite: shouldOverwrite,
    source: 'localStorage_auto_sync',
  });
  return {
    merged: true,
    reason: shouldOverwrite ? 'local_newer_overwrite' : 'auto_merged',
    ...result,
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

  const rawPlan = loaded.plan || loaded[USER_PLAN_KEY] || settingsFromCollection[USER_PLAN_KEY] || '';
  const normalizedPlan = normalizeUserPlan(rawPlan || DEFAULT_USER_PLAN);
  const hadPersistedPlan = Boolean(rawPlan);
  loaded.plan = normalizedPlan;
  loaded[USER_PLAN_KEY] = normalizedPlan;

  if (!hadPersistedPlan || rawPlan !== normalizedPlan || !settingsFromCollection[USER_PLAN_KEY]) {
    setDoc(userMetaRef(uid), {
      userId: uid,
      plan: normalizedPlan,
      [USER_PLAN_KEY]: normalizedPlan,
      __updatedAt: serverTimestamp(),
    }, { merge: true }).catch((err) => {
      console.warn('Failed to backfill user plan metadata', err);
    });
    setDoc(userSettingsDoc(uid, USER_PLAN_KEY), {
      key: USER_PLAN_KEY,
      value: normalizedPlan,
      userId: uid,
      __updatedAt: serverTimestamp(),
    }, { merge: true }).catch((err) => {
      console.warn('Failed to backfill user plan setting', err);
    });
  }

  Object.keys(cache).forEach((key) => delete cache[key]);
  Object.assign(cache, loaded);

  const profileSyncResults = await Promise.allSettled([
    syncUserProfileDoc(user, {
      plan: normalizedPlan,
      billingProfile: loaded[USER_BILLING_PROFILE_KEY],
    }),
    syncAdminUserSummary(user, {
      plan: normalizedPlan,
      projectCount: Array.isArray(loaded.photocrm_customers) ? loaded.photocrm_customers.length : 0,
      billingProfile: loaded[USER_BILLING_PROFILE_KEY],
    }),
  ]);
  profileSyncResults.forEach((result) => {
    if (result.status === 'rejected') {
      console.warn('Profile sync after cloud load failed', result.reason);
    }
  });
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
  const normalizedValue = key === USER_PLAN_KEY ? normalizeUserPlan(value) : value;
  cache[key] = normalizedValue;

  if (key === 'photocrm_customers') {
    const customers = normalizeRecordsForUser(normalizedValue, user.uid);
    await overwriteCollection(userProjectsCol(user.uid), customers);
    await syncAdminUserSummary(user, { projectCount: customers.length });
    return;
  }

  if (key === 'photocrm_expenses') {
    const expenses = normalizeRecordsForUser(normalizedValue, user.uid);
    await overwriteCollection(userExpensesCol(user.uid), expenses);
    return;
  }

  const metaPayload = {
    userId: user.uid,
    [key]: normalizedValue,
    __updatedAt: serverTimestamp(),
  };
  if (key === USER_PLAN_KEY) {
    metaPayload.plan = normalizedValue;
    cache.plan = normalizedValue;
  }
  const metaPromise = setDoc(userMetaRef(user.uid), metaPayload, { merge: true });

  if (SETTINGS_KEYS.includes(key)) {
    const settingsPromise = setDoc(userSettingsDoc(user.uid, key), {
      key,
      value: normalizedValue,
      userId: user.uid,
      __updatedAt: serverTimestamp(),
    }, { merge: true });
    await Promise.all([metaPromise, settingsPromise]);
    if (key === USER_PLAN_KEY || key === USER_BILLING_PROFILE_KEY) {
      const syncResults = await Promise.allSettled([
        syncUserProfileDoc(user, {
          plan: key === USER_PLAN_KEY ? normalizedValue : undefined,
          billingProfile: key === USER_BILLING_PROFILE_KEY ? normalizedValue : undefined,
        }),
        syncAdminUserSummary(user, {
          plan: key === USER_PLAN_KEY ? normalizedValue : undefined,
          billingProfile: key === USER_BILLING_PROFILE_KEY ? normalizedValue : undefined,
        }),
      ]);
      syncResults.forEach((result) => {
        if (result.status === 'rejected') {
          console.warn(`Profile sync failed after saving ${key}`, result.reason);
        }
      });
    }
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

  getUserPlan() {
    return normalizeUserPlan(cache.plan || cache[USER_PLAN_KEY] || DEFAULT_USER_PLAN);
  },

  async setUserPlan(plan) {
    await ensureInitialized();
    const user = auth.currentUser;
    const normalizedPlan = normalizeUserPlan(plan);
    if (!user) {
      cache.plan = normalizedPlan;
      cache[USER_PLAN_KEY] = normalizedPlan;
      return normalizedPlan;
    }
    await updateKey(user, USER_PLAN_KEY, normalizedPlan);
    return normalizedPlan;
  },

  getLocalDataSummary() {
    return buildLocalDataSummary();
  },

  async getCloudDataSummary() {
    await ensureInitialized();
    const user = auth.currentUser;
    if (!user) {
      return {
        projects: 0,
        legacyClients: 0,
        expenses: 0,
        hasCloudData: false,
        latestUpdatedAtMs: 0,
        latestUpdatedAt: '',
      };
    }
    return getCloudDataSummary(user.uid);
  },

  async autoSyncLocalDataToCloud() {
    await ensureInitialized();
    const user = auth.currentUser;
    if (!user) return { merged: false, reason: 'not_logged_in' };
    const result = await autoSyncLocalDataWithCloud(user);
    if (result?.merged) await loadCloudDataForUser(user);
    return result;
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
    const syncResults = await Promise.allSettled([
      syncUserProfileDoc(result.user),
      syncAdminUserSummary(result.user),
    ]);
    syncResults.forEach((syncResult) => {
      if (syncResult.status === 'rejected') {
        console.warn('Post-login profile sync failed', syncResult.reason);
      }
    });
    return result;
  },

  async signInWithPopup() {
    return this.signInWithGoogle();
  },

  getGoogleAccessToken() {
    return String(googleOAuthAccessToken || '');
  },

  isCurrentUserAdmin() {
    return isAdminUser(auth.currentUser);
  },

  async bootstrapAdminSecurity() {
    await ensureInitialized();
    const isAdmin = isAdminUser(auth.currentUser);
    return {
      allowed: isAdmin,
      authorized: isAdmin,
      reason: isAdmin ? 'authorized' : 'not_admin',
      devices: { approved: [], pending: [] },
      session: { token: '', expiresAtMs: 0 },
      mfa: { required: false, verified: false, enrolledFactorCount: 0 },
    };
  },

  async getAdminDeviceConfig() {
    await ensureInitialized();
    const isAdmin = isAdminUser(auth.currentUser);
    return {
      allowed: isAdmin,
      reason: isAdmin ? 'authorized' : 'not_admin',
      devices: { approved: [], pending: [] },
    };
  },

  async approveAdminDevice() {
    await ensureInitialized();
    return { allowed: false, reason: 'disabled' };
  },

  async revokeAdminDevice() {
    await ensureInitialized();
    return { allowed: false, reason: 'disabled' };
  },

  async touchAdminSecureSession() {
    await ensureInitialized();
    const isAdmin = isAdminUser(auth.currentUser);
    return { allowed: isAdmin, reason: isAdmin ? 'authorized' : 'not_admin' };
  },

  async endAdminSecureSession(reason = 'manual') {
    await ensureInitialized();
    return { ended: true, reason: String(reason || 'manual') };
  },

  async getAdminUserOverview() {
    await ensureInitialized();
    const user = auth.currentUser;
    if (!isAdminUser(user)) {
      return {
        allowed: false,
        reason: 'not_admin',
        users: [],
        stats: {
          totalUsers: 0,
          totalProjects: 0,
          planCounts: { free: 0, individual: 0, small_team: 0, medium_team: 0, enterprise: 0 },
        },
      };
    }
    return buildAdminUserOverview(user);
  },

  async getAdminSupportTickets() {
    await ensureInitialized();
    const user = auth.currentUser;
    if (!isAdminUser(user)) {
      return { allowed: false, reason: 'not_admin', tickets: [] };
    }
    return buildAdminSupportTickets(user);
  },

  async getMySupportTickets() {
    await ensureInitialized();
    return buildCurrentUserSupportTickets(auth.currentUser);
  },

  async replySupportTicket(ticketId, payload = {}) {
    await ensureInitialized();
    const user = auth.currentUser;
    if (!isAdminUser(user)) throw new Error('not_admin');
    const safePayload = payload && typeof payload === 'object' ? payload : {};
    return replySupportTicketByAdmin(user, ticketId, safePayload);
  },

  async saveEnterpriseInquiry(payload = {}) {
    await ensureInitialized();
    const user = auth.currentUser;
    const inquiryRef = doc(collection(db, 'inquiries'));
    const createdAtIso = new Date().toISOString();
    const safePayload = payload && typeof payload === 'object' ? payload : {};
    const inquiry = {
      id: inquiryRef.id,
      plan: normalizeUserPlan(safePayload.plan || 'enterprise'),
      teamName: String(safePayload.teamName || safePayload.companyName || '').trim(),
      representativeName: String(safePayload.representativeName || '').trim(),
      memberRange: String(safePayload.memberRange || '').trim(),
      message: String(safePayload.message || '').trim(),
      status: 'new',
      source: 'pholio_app',
      userId: user?.uid || null,
      email: user?.email || '',
      displayName: user?.displayName || '',
      createdAt: serverTimestamp(),
      createdAtIso,
    };
    await setDoc(inquiryRef, inquiry, { merge: true });
    return { id: inquiryRef.id, createdAtIso };
  },

  async saveSupportTicket(payload = {}) {
    await ensureInitialized();
    const user = auth.currentUser;
    if (!user) throw new Error('not_logged_in');

    const ticketRef = doc(collection(db, 'support_tickets'));
    const createdAtIso = new Date().toISOString();
    const safePayload = payload && typeof payload === 'object' ? payload : {};
    const rawCategory = String(safePayload.category || 'bug').trim().toLowerCase();
    const allowedCategories = new Set(['bug', 'question', 'feature_request']);
    const category = allowedCategories.has(rawCategory) ? rawCategory : 'bug';
    const osInfoPayload = safePayload.osInfo && typeof safePayload.osInfo === 'object'
      ? safePayload.osInfo
      : {};

    const ticket = {
      id: ticketRef.id,
      userId: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      subject: String(safePayload.subject || '').trim(),
      category,
      message: String(safePayload.message || '').trim(),
      notifyTo: String(safePayload.notifyTo || SUPPORT_CONTACT_EMAIL).trim() || SUPPORT_CONTACT_EMAIL,
      language: String(safePayload.language || ''),
      currency: String(safePayload.currency || ''),
      osInfo: {
        platform: String(osInfoPayload.platform || ''),
        userAgent: String(osInfoPayload.userAgent || ''),
        language: String(osInfoPayload.language || ''),
        vendor: String(osInfoPayload.vendor || ''),
        hardwareConcurrency: Number.isFinite(Number(osInfoPayload.hardwareConcurrency))
          ? Number(osInfoPayload.hardwareConcurrency)
          : null,
        deviceMemory: Number.isFinite(Number(osInfoPayload.deviceMemory))
          ? Number(osInfoPayload.deviceMemory)
          : null,
      },
      status: 'pending',
      ai_draft_reply: String(safePayload.ai_draft_reply || ''),
      user_notification_pending: false,
      user_notification_message: '',
      source: 'pholio_app',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAtIso,
    };
    await setDoc(ticketRef, ticket, { merge: true });
    return { id: ticketRef.id, createdAtIso };
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
