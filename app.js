// ===== Pholio - Application Logic =====

(function () {
  'use strict';
  const DEFAULT_PLAN_TAG_COLORS = ['#8b5cf6', '#7c3aed', '#6d28d9', '#a855f7', '#9333ea', '#7e22ce'];
  // ===== Storage Keys =====
  const STORAGE_KEY = 'photocrm_customers';
  const OPTIONS_KEY = 'photocrm_options';
  const PLAN_MASTER_KEY = 'photocrm_plan_master';
  const THEME_KEY = 'photocrm_theme';
  const LANG_KEY = 'photocrm_lang';
  const TAX_SETTINGS_KEY = 'photocrm_tax_settings';
  const INVOICE_SENDER_PROFILE_KEY = 'photocrm_invoice_sender_profile';
  const EXPENSES_KEY = 'photocrm_expenses';
  const CURRENCY_KEY = 'photocrm_currency';
  const ACCENT_COLOR_KEY = 'photocrm_accent_color';
  const CUSTOM_FIELDS_KEY = 'photocrm_custom_fields';
  const CALENDAR_FILTERS_KEY = 'photocrm_calendar_filters';
  const DASHBOARD_VISIBILITY_KEY = 'photocrm_dashboard_visible';
  const DASHBOARD_CONFIG_KEY = 'photocrm_dashboard_config';
  const LIST_COLUMN_CONFIG_KEY = 'photocrm_list_column_config';
  const CONTRACT_TEMPLATE_KEY = 'photocrm_contract_template';
  const DYNAMIC_ITEM_NAME_SUGGESTIONS_KEY = 'photocrm_dynamic_item_name_suggestions';
  const DYNAMIC_ITEM_SUGGESTIONS_KEY = 'photocrm_dynamic_item_suggestions';
  const STATUS_COLOR_MAP_KEY = 'photocrm_status_color_map';
  const HERO_METRICS_VISIBLE_KEY = 'photocrm_hero_metrics_visible';
  const HERO_METRICS_CONFIG_KEY = 'photocrm_hero_metrics_config';
  const FORM_FIELD_VISIBILITY_KEY = 'photocrm_form_field_visibility';
  const GOOGLE_CALENDAR_AUTO_SYNC_KEY = 'photocrm_google_calendar_auto_sync';
  const GOOGLE_CALENDAR_SELECTED_ID_KEY = 'photocrm_google_calendar_selected_id';
  const USER_PLAN_KEY = 'photocrm_user_plan';
  const USER_BILLING_PROFILE_KEY = 'photocrm_user_billing_profile';
  const STUDIO_NAME_KEY = 'photocrm_studio_name';
  const ENTERPRISE_CONTACT_REQUESTS_KEY = 'photocrm_enterprise_contact_requests';
  const SUPPORT_REPLY_NOTICE_SEEN_KEY = 'photocrm_support_reply_notice_seen';
  const ADMIN_MANAGEMENT_EMAILS = new Set(['sasuke.photographe@gmail.com']);
  const GOOGLE_CALENDAR_DEFAULT_ID = 'sasuke.photographe@gmail.com';
  const LOCAL_GUEST_MODE_KEY = 'photocrm_local_guest_mode';
  const IDB_MIRROR_DB_NAME = 'PholioDB';
  const IDB_MIRROR_DB_VERSION = 1;
  const IDB_MIRROR_STORE_NAME = 'kv_mirror';
  const SAFE_MODE_MINIMAL_BOOT = false;
  const FORCE_DARK_MODE = false;
  const ENABLE_STATS_FEATURES = true;
  const DEFAULT_INVOICE_MESSAGE_KEY = 'invoiceDefaultMessage';
  const FREE_PLAN_LIMIT = 20;
  const DEFAULT_ACCENT_COLOR = '#8b5cf6';
  const ADMIN_SECURE_SESSION_KEY = 'photocrm_admin_secure_session';
  const ADMIN_SESSION_TIMEOUT_MS = 60 * 60 * 1000;
  const ADMIN_SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;
  const PLAN_CONFIG = Object.freeze({
    free: {
      basePrice: 0,
      includedMembers: 1,
      extraMemberPrice: 0,
      maxMembers: null,
    },
    individual: {
      basePrice: 9,
      includedMembers: 1,
      extraMemberPrice: 0,
      maxMembers: null,
    },
    small_team: {
      basePrice: 19,
      includedMembers: 5,
      extraMemberPrice: 5,
      maxMembers: null,
    },
    medium_team: {
      basePrice: 39,
      includedMembers: 15,
      extraMemberPrice: 0,
      maxMembers: 15,
    },
    enterprise: {
      basePrice: 0,
      includedMembers: Number.POSITIVE_INFINITY,
      extraMemberPrice: 0,
      maxMembers: null,
    },
  });

  const DASHBOARD_CARD_DEFINITIONS = [
    { key: 'totalCustomers', labelKey: 'cardTotalCustomers', fallbackLabel: 'Total Customers' },
    { key: 'monthlyShoots', labelKey: 'cardMonthlyShoots', fallbackLabel: 'Monthly Shoots' },
    { key: 'monthlyRevenue', labelKey: 'cardMonthlyRevenue', fallbackLabel: 'Monthly Revenue' },
    { key: 'monthlyProfit', labelKey: 'cardProfit', fallbackLabel: 'Profit' },
    { key: 'yearlyRevenue', labelKey: 'yearlyRevenueTotal', fallbackLabel: 'Yearly Revenue' },
    { key: 'yearlyExpense', labelKey: 'yearlyExpenseTotal', fallbackLabel: 'Yearly Expense' },
    { key: 'yearlyProfit', labelKey: 'yearlyProfitTotal', fallbackLabel: 'Yearly Profit' },
    { key: 'unpaid', labelKey: 'cardUnpaid', fallbackLabel: 'Unpaid' },
    { key: 'expenseSection', labelKey: 'expenseTracking', fallbackLabel: 'Expense Section' },
  ];

  const HERO_METRIC_DEFINITIONS = [
    { key: 'monthlyNetProfit', labelKey: 'heroMetricMonthlyNetProfit', fallbackLabel: 'Monthly Net Profit' },
    { key: 'averageMargin', labelKey: 'heroMetricAverageMargin', fallbackLabel: 'Average Profit Rate' },
    { key: 'yearlyNetProfit', labelKey: 'heroMetricYearlyNetProfit', fallbackLabel: 'Yearly Net Profit' },
  ];

  const LIST_COLUMN_DEFINITIONS = [
    { key: 'shootingDate', labelKey: 'thShootingDate', fallbackLabel: 'Shooting Date', sortKey: 'shootingDate' },
    { key: 'inquiryDate', labelKey: 'thInquiryDate', fallbackLabel: 'Inquiry Date', sortKey: 'inquiryDate' },
    { key: 'contractDate', labelKey: 'thContractDate', fallbackLabel: 'Contract Date', sortKey: 'contractDate' },
    { key: 'customerName', labelKey: 'thCustomerName', fallbackLabel: 'Customer', sortKey: 'customerName' },
    { key: 'workflowStatus', labelKey: 'thStatus', fallbackLabel: 'Status', sortKey: 'workflowStatus' },
    { key: 'contact', labelKey: 'thContact', fallbackLabel: 'Contact', sortKey: 'contact' },
    { key: 'meetingDate', labelKey: 'thMeetingDate', fallbackLabel: 'Meeting Date', sortKey: 'meetingDate' },
    { key: 'plan', labelKey: 'thPlan', fallbackLabel: 'Plan', sortKey: 'plan' },
    { key: 'revenue', labelKey: 'thRevenue', fallbackLabel: 'Revenue', sortKey: 'revenue' },
    { key: 'paymentChecked', labelKey: 'thPayment', fallbackLabel: 'Payment', sortKey: 'paymentChecked' },
    { key: 'assignedTo', labelKey: 'thPhotographer', fallbackLabel: 'Staff', sortKey: 'assignedTo' },
  ];
  const MOBILE_SORT_OPTIONS = [
    { key: 'shootingDate', labelKey: 'thShootingDate', fallbackLabel: 'Shooting Date' },
    { key: 'inquiryDate', labelKey: 'thInquiryDate', fallbackLabel: 'Inquiry Date' },
    { key: 'contractDate', labelKey: 'thContractDate', fallbackLabel: 'Contract Date' },
    { key: 'meetingDate', labelKey: 'thMeetingDate', fallbackLabel: 'Meeting Date' },
    { key: 'customerName', labelKey: 'thCustomerName', fallbackLabel: 'Customer' },
    { key: 'revenue', labelKey: 'thRevenue', fallbackLabel: 'Revenue' },
    { key: 'paymentChecked', labelKey: 'thPayment', fallbackLabel: 'Payment' },
    { key: 'assignedTo', labelKey: 'thPhotographer', fallbackLabel: 'Staff' },
  ];

  const FORM_FIELD_VISIBILITY_DEFINITIONS = [
    { key: 'inquiryDate', labelKey: 'labelInquiryDate', fallbackLabel: 'Inquiry Date' },
    { key: 'contractDate', labelKey: 'labelContractDate', fallbackLabel: 'Contract Date' },
    { key: 'location', labelKey: 'labelLocation', fallbackLabel: 'Location' },
    { key: 'assignedTo', labelKey: 'labelAssignedTo', fallbackLabel: 'Photographer' },
    { key: 'deliveryDate', labelKey: 'labelDeliveryDate', fallbackLabel: 'Delivery Date' },
    { key: 'paymentConfirmDate', labelKey: 'labelPaymentConfirmDate', fallbackLabel: 'Payment Confirmation Date' },
  ];

  const WORKFLOW_STATUS_META = {
    not_started: { labelKey: 'workflowNotStarted', className: 'workflow-not-started' },
    shot: { labelKey: 'workflowShot', className: 'workflow-shot' },
    retouching: { labelKey: 'workflowRetouching', className: 'workflow-retouching' },
    completed: { labelKey: 'workflowCompleted', className: 'workflow-completed' },
    cancelled: { labelKey: 'workflowCancelled', className: 'workflow-cancelled' },
  };
  const DEFAULT_STATUS_COLORS = {
    not_started: '#9ca3af',
    shot: '#f59e0b',
    retouching: '#3b82f6',
    completed: '#22c55e',
    cancelled: '#ef4444',
  };
  function getCloudValue(key, fallback) {
    const value = window.FirebaseService?.getCachedData(key);
    return value === undefined ? fallback : value;
  }

  const State = {
    getRaw(key, fallback = null) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch {
        return fallback;
      }
    },
    getJSON(key, fallback) {
      const raw = this.getRaw(key, null);
      if (raw === null) return fallback;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    },
    setJSON(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (err) {
        console.warn(`Failed to persist state key: ${key}`, err);
        return false;
      }
    },
  };

  function getLocalValue(key, fallback) {
    return State.getJSON(key, fallback);
  }

  let idbMirrorDbPromise = null;

  function openMirrorDatabase() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(null);
    }
    if (idbMirrorDbPromise) return idbMirrorDbPromise;

    idbMirrorDbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(IDB_MIRROR_DB_NAME, IDB_MIRROR_DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(IDB_MIRROR_STORE_NAME)) {
            db.createObjectStore(IDB_MIRROR_STORE_NAME, { keyPath: 'key' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          console.warn('IndexedDB open failed:', request.error);
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB unavailable:', err);
        resolve(null);
      }
    });

    return idbMirrorDbPromise;
  }

  function mirrorToIndexedDB(key, value) {
    if (!key) return;
    openMirrorDatabase().then((db) => {
      if (!db) return;
      try {
        const tx = db.transaction(IDB_MIRROR_STORE_NAME, 'readwrite');
        tx.objectStore(IDB_MIRROR_STORE_NAME).put({
          key,
          value,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn(`IndexedDB mirror write failed: ${key}`, err);
      }
    });
  }

  function getMirrorTargetKeys() {
    return [
      STORAGE_KEY,
      OPTIONS_KEY,
      PLAN_MASTER_KEY,
      DASHBOARD_CONFIG_KEY,
      LIST_COLUMN_CONFIG_KEY,
      CONTRACT_TEMPLATE_KEY,
      EXPENSES_KEY,
      LANG_KEY,
      THEME_KEY,
      ACCENT_COLOR_KEY,
      CURRENCY_KEY,
      TAX_SETTINGS_KEY,
      INVOICE_SENDER_PROFILE_KEY,
      CUSTOM_FIELDS_KEY,
      CALENDAR_FILTERS_KEY,
      DYNAMIC_ITEM_NAME_SUGGESTIONS_KEY,
      DYNAMIC_ITEM_SUGGESTIONS_KEY,
      STATUS_COLOR_MAP_KEY,
      HERO_METRICS_VISIBLE_KEY,
      HERO_METRICS_CONFIG_KEY,
      FORM_FIELD_VISIBILITY_KEY,
      GOOGLE_CALENDAR_AUTO_SYNC_KEY,
      GOOGLE_CALENDAR_SELECTED_ID_KEY,
      USER_PLAN_KEY,
      USER_BILLING_PROFILE_KEY,
      STUDIO_NAME_KEY,
      ENTERPRISE_CONTACT_REQUESTS_KEY,
    ];
  }

  function readRawLocalStorage(key) {
    return State.getRaw(key, null);
  }

  function writeLocalStorageValue(key, value) {
    return State.setJSON(key, value);
  }

  async function getMirrorRecordMap() {
    const db = await openMirrorDatabase();
    if (!db) return new Map();

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_MIRROR_STORE_NAME, 'readonly');
        const store = tx.objectStore(IDB_MIRROR_STORE_NAME);

        if (typeof store.getAll === 'function') {
          const req = store.getAll();
          req.onsuccess = () => {
            const rows = Array.isArray(req.result) ? req.result : [];
            resolve(new Map(rows.map((row) => [row.key, row])));
          };
          req.onerror = () => resolve(new Map());
          return;
        }

        const records = new Map();
        const cursorReq = store.openCursor();
        cursorReq.onsuccess = (event) => {
          const cursor = event.target.result;
          if (!cursor) {
            resolve(records);
            return;
          }
          const row = cursor.value;
          if (row && row.key) records.set(row.key, row);
          cursor.continue();
        };
        cursorReq.onerror = () => resolve(new Map());
      } catch {
        resolve(new Map());
      }
    });
  }

  async function restoreLocalStorageFromIndexedDBIfNeeded() {
    const customersRaw = readRawLocalStorage(STORAGE_KEY);
    if (customersRaw !== null) return false;

    const mirrorMap = await getMirrorRecordMap();
    if (mirrorMap.size === 0) return false;

    let restoredCount = 0;
    getMirrorTargetKeys().forEach((key) => {
      const localMirror = mirrorMap.get(`local:${key}`);
      const cloudMirror = mirrorMap.get(`cloud:${key}`);
      const candidate = localMirror || cloudMirror;
      if (!candidate || candidate.value === undefined) return;
      if (writeLocalStorageValue(key, candidate.value)) restoredCount += 1;
    });

    return restoredCount > 0;
  }

  function mirrorCurrentLocalStorageToIndexedDB() {
    getMirrorTargetKeys().forEach((key) => {
      const raw = readRawLocalStorage(key);
      if (raw === null) return;
      try {
        mirrorToIndexedDB(`local:${key}`, JSON.parse(raw));
      } catch {
        mirrorToIndexedDB(`local:${key}`, raw);
      }
    });
  }

  function saveLocalValue(key, value) {
    State.setJSON(key, value);
    mirrorToIndexedDB(`local:${key}`, value);
  }

  let cloudSaveRetryToastTimer = null;
  function notifyCloudSaveRetry() {
    if (cloudSaveRetryToastTimer) return;
    showToast(
      getLocaleTextOrFallback(
        'cloudSaveRetryMessage',
        'クラウド保存に失敗しました。通信状態を確認して再試行してください。'
      ),
      'error'
    );
    cloudSaveRetryToastTimer = window.setTimeout(() => {
      cloudSaveRetryToastTimer = null;
    }, 5000);
  }

  function saveCloudValue(key, value, options = {}) {
    const propagateError = !!options?.propagateError;
    State.setJSON(key, value);
    mirrorToIndexedDB(`local:${key}`, value);
    mirrorToIndexedDB(`cloud:${key}`, value);
    const currentUser = window.FirebaseService?.getCurrentUser?.();
    if (currentUser) setCloudSyncIndicator('syncing');
    else setCloudSyncIndicator('local');
    try {
      const maybePromise = window.FirebaseService?.saveKey?.(key, value);
      if (maybePromise && typeof maybePromise.then === 'function') {
        return maybePromise.then(() => {
          if (window.FirebaseService?.getCurrentUser?.()) setCloudSyncIndicator('ready');
          else setCloudSyncIndicator('local');
          return true;
        }).catch((err) => {
          console.error(`Failed to save ${key}`, err);
          setCloudSyncIndicator('error');
          notifyCloudSaveRetry();
          if (propagateError) throw err;
          return false;
        });
      }
      return Promise.resolve(true);
    } catch (err) {
      console.error(`Failed to save ${key}`, err);
      setCloudSyncIndicator('error');
      notifyCloudSaveRetry();
      if (propagateError) return Promise.reject(err);
      return Promise.resolve(false);
    }
  }

  // ===== Language Management =====
  let currentLang = getCloudValue(LANG_KEY, getLocalValue(LANG_KEY, 'ja'));
  if (!window.LOCALE || !window.LOCALE[currentLang]) currentLang = 'ja';
  let currentUserPlan = normalizeUserPlan(
    getCloudValue(USER_PLAN_KEY, getCloudValue('plan', getLocalValue(USER_PLAN_KEY, 'free')))
  );
  let currentStudioName = normalizeStudioName(
    getCloudValue(STUDIO_NAME_KEY, getLocalValue(STUDIO_NAME_KEY, ''))
  );
  let currentAccentColor = normalizeAccentColor(
    getCloudValue(ACCENT_COLOR_KEY, getLocalValue(ACCENT_COLOR_KEY, DEFAULT_ACCENT_COLOR))
  );

  function getLanguageSelectElements() {
    const elements = [
      document.getElementById('languageSelect'),
      document.getElementById('languageSelect-mobile'),
      document.getElementById('lang-select'),
    ].filter(Boolean);
    return Array.from(new Set(elements));
  }

  function getLanguageSelectElement() {
    return getLanguageSelectElements()[0] || null;
  }

  function normalizeStudioName(value) {
    return String(value || '').trim().slice(0, 80);
  }

  function getStudioDisplayName() {
    const billingProfileName = normalizeStudioName(getBillingProfile()?.fullName || '');
    return billingProfileName || currentStudioName || 'Pholio';
  }

  function updateHeaderBrandWordmark() {
    const brandWordmark = document.getElementById('brand-wordmark') || document.querySelector('.brand-wordmark');
    if (!brandWordmark) return;
    brandWordmark.textContent = getStudioDisplayName();
  }

  function setStudioName(name, options = {}) {
    const { persistCloud = true } = options;
    currentStudioName = normalizeStudioName(name);
    if (persistCloud) saveCloudValue(STUDIO_NAME_KEY, currentStudioName);
    else saveLocalValue(STUDIO_NAME_KEY, currentStudioName);
    updateHeaderBrandWordmark();
  }

  function canAccessTeamManagement(plan = currentUserPlan) {
    const normalized = normalizeUserPlan(plan);
    return normalized === 'small_team' || normalized === 'medium_team' || normalized === 'enterprise';
  }

  function updateTeamManagementTabAvailability() {
    const teamTabButton = settingsOverlay?.querySelector?.('.settings-tab-btn[data-tab="team"]')
      || document.querySelector('.settings-tab-btn[data-tab="team"]');
    const teamTabContent = document.getElementById('settings-content-team');
    if (!teamTabButton || !teamTabContent) return;

    const allowed = canAccessTeamManagement(currentUserPlan);
    teamTabButton.style.display = allowed ? '' : 'none';
    teamTabButton.disabled = !allowed;
    teamTabButton.setAttribute('aria-disabled', String(!allowed));

    if (!allowed && teamTabButton.classList.contains('active')) {
      teamTabButton.classList.remove('active');
      teamTabContent.classList.remove('active');
      const menuTab = settingsOverlay?.querySelector?.('.settings-tab-btn[data-tab="menu"]');
      const menuContent = document.getElementById('settings-content-menu');
      if (menuTab) menuTab.classList.add('active');
      if (menuContent) menuContent.classList.add('active');
    }
    if (!allowed) teamTabContent.classList.remove('active');
  }

  function getHeaderCurrencySelectElements() {
    const elements = [
      document.getElementById('currency-select'),
      document.getElementById('currency-select-mobile'),
    ].filter(Boolean);
    return Array.from(new Set(elements));
  }

  function getLanguageOptionDefinitions() {
    return [
      { code: 'ja', label: '🇯🇵 日本語' },
      { code: 'en', label: '🇺🇸 English' },
      { code: 'fr', label: '🇫🇷 Français' },
      { code: 'zh-CN', label: '🇨🇳 简体中文' },
      { code: 'zh-TW', label: '🇹🇼 繁體中文' },
      { code: 'ko', label: '🇰🇷 한국어' },
    ];
  }

  function getHeroMetricLabelByLang(key) {
    if (key === 'monthlyNetProfit') {
      return t('heroMetricMonthlyNetProfit');
    }
    if (key === 'averageMargin') {
      return t('heroMetricAverageMargin');
    }
    if (key === 'yearlyNetProfit') {
      return t('heroMetricYearlyNetProfit');
    }
    return '';
  }

  function updateHeroMetricLabels() {
    const monthlyLabel = document.getElementById('stat-monthly-net-profit-label');
    if (monthlyLabel) monthlyLabel.textContent = getHeroMetricLabelByLang('monthlyNetProfit');
    const marginLabel = document.getElementById('stat-average-margin-label');
    if (marginLabel) marginLabel.textContent = getHeroMetricLabelByLang('averageMargin');
    const yearlyLabel = document.getElementById('stat-yearly-net-profit-label');
    if (yearlyLabel) yearlyLabel.textContent = getHeroMetricLabelByLang('yearlyNetProfit');
  }

  function applyExtendedStaticTranslations() {
    const setText = (selector, key) => {
      const el = document.querySelector(selector);
      if (el) el.textContent = t(key);
    };
    const setPlaceholder = (selector, key) => {
      const el = document.querySelector(selector);
      if (el) el.placeholder = t(key);
    };
    const setTitle = (selector, key) => {
      const el = document.querySelector(selector);
      if (el) el.title = t(key);
    };

    const workflowLabel = document.querySelector('label[for="form-workflowStatus"]');
    if (workflowLabel) workflowLabel.textContent = t('labelWorkflowStatus');
    const workflowSelect = document.getElementById('form-workflowStatus');
    if (workflowSelect) {
      const optionMap = {
        not_started: 'workflowNotStarted',
        shot: 'workflowShot',
        retouching: 'workflowRetouching',
        completed: 'workflowCompleted',
        cancelled: 'workflowCancelled',
      };
      Array.from(workflowSelect.options).forEach((option) => {
        const key = optionMap[option.value];
        if (key) option.textContent = t(key);
      });
    }

    setText('.dynamic-items-header .form-section-title', 'sectionDynamicItems');
    setText('#add-item-btn', 'btnAddDynamicItem');
    setText('label[for="form-plan-price"]', 'labelPlanRevenue');
    setText('label[for="form-plan-cost"]', 'labelPlanCost');
    setPlaceholder('#form-plan-price', 'placeholderRevenueShort');
    setPlaceholder('#form-plan-cost', 'placeholderCostShort');
    setText('label[for="form-expense"]', 'labelExpenseYen');
    setPlaceholder('#form-expense', 'placeholderExpense');
    setText('label[for="form-plan-name"]', 'labelPlanName');
    setText('label[for="form-base-price"]', 'labelBasePrice');
    setText('label[for="form-price-adjustment"]', 'labelManualAdjustment');
    setText('label[for="form-total-price"]', 'labelTotalPrice');
    setPlaceholder('#form-plan-name', 'placeholderPlanName');
    setPlaceholder('#form-base-price', 'placeholderBasePrice');
    setPlaceholder('#form-price-adjustment', 'placeholderManualAdjustment');
    setPlaceholder('#form-total-price', 'placeholderTotalPrice');

    const planNameGroup = document.querySelector('label[for="form-plan-name"]')?.closest('.form-group');
    const planDetailTitle = planNameGroup?.previousElementSibling;
    if (planDetailTitle?.classList?.contains('form-section-title')) {
      planDetailTitle.textContent = t('sectionPlanDetails');
    }

    const profitLabel = document.querySelector('label[for="form-profit"]');
    if (profitLabel) profitLabel.textContent = t('labelProfitYen');

    setText('.settings-tab-btn[data-tab="contract"]', 'contractSettings');
    setText('#settings-content-contract h3', 'contractTemplateTitle');
    setText('label[for="contract-template-editor"]', 'contractTemplateBody');
    setText('#btn-contract-preset-standard', 'contractPresetStandard');
    setText('#btn-contract-preset-bridal', 'contractPresetBridal');
    setText('#btn-contract-preset-light', 'contractPresetLight');
    setText('#btn-save-contract-template', 'contractTemplateSave');
    setText('#data-protection-status', 'dataProtectionStatus');
    setText('.data-protection-note', 'dataProtectionCloudStatus');
    setPlaceholder('#tax-label-custom', 'taxCustomLabelPlaceholder');
    setText('#btn-google-login-screen', 'googleLogin');
    setText('#btn-google-login', 'googleLogin');
    setText('#btn-logout', 'logout');
    setText('.login-card p', 'loginScreenDescription');
    setText('#settings-content-contract .help-text', 'contractTemplateHelp');
    setTitle('#dashboard-month-picker', 'dashboardMonthHint');

    const dateFormatHint = t('dateFormatHint');
    document.querySelectorAll('input[type="date"]').forEach((input) => {
      if (!input.dataset.baseTitle) {
        input.dataset.baseTitle = input.title || '';
      }
      input.title = input.dataset.baseTitle
        ? `${input.dataset.baseTitle} (${dateFormatHint})`
        : dateFormatHint;

      if (input.id) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        const labelKey = label?.getAttribute('data-i18n');
        if (label && labelKey) {
          label.textContent = `${t(labelKey)} (${dateFormatHint})`;
        }
      }
    });

    const detailWorkflowLabel = document.getElementById('detail-workflow-status')?.closest('.detail-item')?.querySelector('.detail-label');
    if (detailWorkflowLabel) detailWorkflowLabel.textContent = t('labelWorkflowStatus');
    const detailPlanNameLabel = document.getElementById('detail-plan-name')?.closest('.detail-item')?.querySelector('.detail-label');
    if (detailPlanNameLabel) detailPlanNameLabel.textContent = t('labelPlanName');
    const detailBasePriceLabel = document.getElementById('detail-base-price')?.closest('.detail-item')?.querySelector('.detail-label');
    if (detailBasePriceLabel) detailBasePriceLabel.textContent = t('labelBasePrice');
    const detailTotalPriceLabel = document.getElementById('detail-total-price')?.closest('.detail-item')?.querySelector('.detail-label');
    if (detailTotalPriceLabel) detailTotalPriceLabel.textContent = t('labelTotalPrice');
    setCloudSyncIndicator(cloudSyncState);
    updateAdminTotpControlsVisibility();
    if (isCurrentUserAdmin() && !canAccessAdminPanel()) {
      const normalizedReason = String(adminSecurityContext.reason || '').trim().toLowerCase();
      if (normalizedReason === 'admin_security_init_failed') {
        setAdminDeviceWarning('');
        setAdminSecurityStatusMini('error');
      } else {
        const warningMessage = getAdminSecurityWarningMessage(adminSecurityContext.reason);
        if (warningMessage) setAdminDeviceWarning(warningMessage, 'error');
      }
    } else {
      setAdminSecurityStatusMini('online');
    }
  }

  function t(key, params = {}) {
    if (!window.LOCALE || !window.LOCALE[currentLang]) {
      console.error('Locales not loaded');
      return key;
    }
    const translation = window.LOCALE[currentLang][key];
    if (!translation) {
      console.warn(`Missing translation: ${key} for ${currentLang}`);
      return key;
    }
    let str = translation;
    Object.keys(params).forEach(k => {
      str = str.replace(`{${k}}`, params[k]);
    });
    return str;
  }
  window.t = t;

  function getUnsetDisplayText() {
    const localeBucket = window.LOCALE?.[currentLang] || {};
    const candidate = localeBucket.valUnsetInput || localeBucket.valUnset;
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
    return '（未入力）';
  }

  function toDisplayText(value) {
    if (value === null || value === undefined) return getUnsetDisplayText();
    const text = String(value).trim();
    return text || getUnsetDisplayText();
  }

  function getDefaultInvoiceMessage() {
    return t(DEFAULT_INVOICE_MESSAGE_KEY);
  }

  function getInvoiceCountryProfiles() {
    const profiles = window.INVOICE_COUNTRY_PROFILES;
    if (!profiles || typeof profiles !== 'object') return {};
    return profiles;
  }

  function getInvoiceCountryProfile(lang = currentLang) {
    const profiles = getInvoiceCountryProfiles();
    return profiles[lang] || profiles.en || {
      code: 'US',
      currency: 'USD',
      defaultTaxRate: 10,
      taxLabel: 'Tax',
      legalSectionTitle: 'Legal Information',
      legalSectionHint: '',
      legalFields: [],
    };
  }

  function normalizeUserPlan(plan) {
    const normalized = String(plan || '').trim().toLowerCase();
    if (normalized === 'small_team' || normalized === 'team' || normalized === 'small-team' || normalized === 'smallteam') return 'small_team';
    if (normalized === 'medium_team' || normalized === 'medium-team' || normalized === 'mediumteam') return 'medium_team';
    if (normalized === 'individual' || normalized === 'pro') return 'individual';
    if (normalized === 'enterprise' || normalized === 'ent') return 'enterprise';
    return 'free';
  }

  function hasPaidPlanAccess(plan = currentUserPlan) {
    return normalizeUserPlan(plan) !== 'free';
  }

  function getCustomerLimitByPlan(plan = currentUserPlan) {
    return normalizeUserPlan(plan) === 'free' ? FREE_PLAN_LIMIT : Number.POSITIVE_INFINITY;
  }

  function canUseLanguageByPlan(lang, plan = currentUserPlan) {
    const normalizedLang = String(lang || '').trim();
    if (normalizedLang === 'ja' || normalizedLang === 'en') return true;
    return hasPaidPlanAccess(plan);
  }

  function getPlanBadgeText(plan = currentUserPlan) {
    const normalized = normalizeUserPlan(plan);
    if (normalized === 'small_team') return 'TEAM S';
    if (normalized === 'medium_team') return 'TEAM M';
    if (normalized === 'enterprise') return 'ENTERPRISE';
    if (normalized === 'individual') return 'PRO';
    return 'FREE';
  }

  function getPlanTier(plan = currentUserPlan) {
    const normalized = normalizeUserPlan(plan);
    if (normalized === 'enterprise') return 4;
    if (normalized === 'medium_team') return 3;
    if (normalized === 'small_team') return 2;
    if (normalized === 'individual') return 1;
    return 0;
  }

  function getSubscriptionActionLabel(targetPlan, currentPlan = currentUserPlan) {
    const targetTier = getPlanTier(targetPlan);
    const currentTier = getPlanTier(currentPlan);
    if (targetTier > currentTier) return t('settingsSubscriptionUpgradeButton');
    return t('settingsSubscriptionSelectButton');
  }

  function getSubscriptionPlanEntries() {
    const perMonthSuffix = t('settingsSubscriptionPerMonthSuffix') || '/mo';
    const formatPlanPrice = (planKey) => `${formatCurrency(getPlanConfig(planKey).basePrice)}${perMonthSuffix}`;
    return [
      {
        key: 'free',
        name: t('settingsSubscriptionFreeName'),
        price: formatPlanPrice('free'),
        summary: t('settingsSubscriptionFreeSummary', { limit: String(FREE_PLAN_LIMIT) }),
      },
      {
        key: 'individual',
        name: t('settingsSubscriptionIndividualName'),
        price: formatPlanPrice('individual'),
        summary: t('settingsSubscriptionIndividualSummary'),
      },
      {
        key: 'small_team',
        name: t('settingsSubscriptionSmallTeamName'),
        price: formatPlanPrice('small_team'),
        summary: t('settingsSubscriptionSmallTeamSummary'),
      },
      {
        key: 'medium_team',
        name: t('settingsSubscriptionMediumTeamName'),
        price: formatPlanPrice('medium_team'),
        summary: t('settingsSubscriptionMediumTeamSummary'),
      },
      {
        key: 'enterprise',
        name: t('settingsSubscriptionEnterpriseName'),
        price: t('settingsSubscriptionEnterprisePrice'),
        summary: t('settingsSubscriptionEnterpriseSummary'),
      },
    ];
  }

  function renderSubscriptionPlanSectionHtml(sectionId = 'settings-subscription-plan-section') {
    const normalizedCurrentPlan = normalizeUserPlan(currentUserPlan);
    const currentPlanBadgeText = getPlanBadgeText(normalizedCurrentPlan);
    const currentTeamMemberCount = getCurrentTeamMemberCount();
    const currentPlanEstimate = calculatePlanEstimate(normalizedCurrentPlan, currentTeamMemberCount);
    const estimateSummaryText = getPlanEstimateSummaryText(normalizedCurrentPlan, currentTeamMemberCount);
    const estimateExtraText = currentPlanEstimate.extraMembers > 0
      ? t('settingsSubscriptionExtraMembers', { count: String(currentPlanEstimate.extraMembers) })
      : '';
    const estimateEnterpriseNoticeText = currentPlanEstimate.requiresEnterprise
      ? t('settingsSubscriptionEnterpriseLimitNotice', { limit: String(currentPlanEstimate.maxMembers || 15) })
      : '';
    const estimateAddonPolicyText = normalizedCurrentPlan === 'small_team'
      ? t('settingsSubscriptionAddonPerMember', { price: formatPlanMonthlyPrice(getPlanConfig('small_team').extraMemberPrice) })
      : '';

    const subscriptionPlanRows = getSubscriptionPlanEntries().map((planEntry) => {
      const isCurrent = normalizedCurrentPlan === planEntry.key;
      const isEnterpriseContact = planEntry.key === 'enterprise' && !isCurrent;
      const actionLabel = isCurrent
        ? t('settingsSubscriptionCurrentButton')
        : (isEnterpriseContact ? t('settingsSubscriptionContactButton') : getSubscriptionActionLabel(planEntry.key, normalizedCurrentPlan));
      return `
        <div class="subscription-plan-card ${isCurrent ? 'is-current' : ''}">
          <div class="subscription-plan-meta">
            <div class="subscription-plan-name">${escapeHtml(planEntry.name || planEntry.key)}</div>
            <div class="subscription-plan-price">${escapeHtml(planEntry.price || '')}</div>
            <div class="subscription-plan-summary">${escapeHtml(planEntry.summary || '')}</div>
          </div>
          <button
            type="button"
            class="btn btn-secondary btn-sm subscription-plan-action-btn"
            ${isEnterpriseContact
              ? `data-subscription-contact="${escapeHtml(planEntry.key)}"`
              : `data-subscription-plan-target="${escapeHtml(planEntry.key)}"`}
            ${isCurrent ? 'disabled' : ''}
          >${escapeHtml(actionLabel)}</button>
        </div>
      `;
    }).join('');

    return `
      <div class="settings-section" id="${escapeHtml(sectionId)}">
        <h3>${escapeHtml(t('settingsSubscriptionSection'))}</h3>
        <p class="settings-detail-empty">${escapeHtml(t('settingsSubscriptionDescription'))}</p>
        <p class="settings-detail-empty subscription-beta-note">${escapeHtml(t('settingsSubscriptionBetaNote'))}</p>
        <div class="settings-item subscription-current-row">
          <span>${escapeHtml(t('settingsSubscriptionCurrentPlanLabel'))}</span>
          <span class="header-plan-badge" data-plan="${escapeHtml(normalizedCurrentPlan)}">${escapeHtml(currentPlanBadgeText)}</span>
        </div>
        <div class="settings-detail-empty">${escapeHtml(t('settingsSubscriptionRegisteredMembers', { count: String(currentTeamMemberCount) }))}</div>
        <div class="settings-detail-empty">${escapeHtml(estimateSummaryText)}</div>
        ${estimateExtraText ? `<div class="settings-detail-empty">${escapeHtml(estimateExtraText)}</div>` : ''}
        ${estimateAddonPolicyText ? `<div class="settings-detail-empty">${escapeHtml(estimateAddonPolicyText)}</div>` : ''}
        ${estimateEnterpriseNoticeText ? `<div class="settings-detail-empty">${escapeHtml(estimateEnterpriseNoticeText)}</div>` : ''}
        <div class="subscription-plan-list">${subscriptionPlanRows}</div>
        <div class="subscription-plan-footer">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-subscription-plan-details">${escapeHtml(t('settingsSubscriptionDetailsLink'))}</button>
        </div>
      </div>
    `;
  }

  function bindSubscriptionPlanSectionEvents(container, prefix = 'subscription-plan') {
    if (!container) return;
    container.querySelectorAll('button[data-subscription-plan-target]').forEach((button) => {
      const targetPlan = String(button.dataset.subscriptionPlanTarget || '').trim();
      bindEventOnce(button, 'click', () => {
        if (!targetPlan) return;
        handleSubscriptionPlanSelect(targetPlan);
      }, `${prefix}-select-${targetPlan}`);
    });
    container.querySelectorAll('button[data-subscription-contact]').forEach((button) => {
      const target = String(button.dataset.subscriptionContact || '').trim() || 'enterprise';
      bindEventOnce(button, 'click', () => {
        handleSubscriptionPlanContactClick(target);
      }, `${prefix}-contact-${target}`);
    });
    bindEventOnce(container.querySelector('#btn-subscription-plan-details'), 'click', handleSubscriptionPlanDetailsClick, `${prefix}-details-open`);
  }

  function getPlanConfig(plan = currentUserPlan) {
    const normalized = normalizeUserPlan(plan);
    return PLAN_CONFIG[normalized] || PLAN_CONFIG.free;
  }

  function getCurrentTeamMemberCount() {
    const members = window.TeamManager?.loadPhotographers?.();
    return Array.isArray(members) ? members.length : 0;
  }

  function formatPlanMonthlyPrice(amount) {
    return formatCurrency(Math.max(0, Math.round(toSafeNumber(amount, 0))));
  }

  function calculatePlanEstimate(plan = currentUserPlan, memberCount = getCurrentTeamMemberCount()) {
    const normalized = normalizeUserPlan(plan);
    const config = getPlanConfig(normalized);
    const safeMemberCount = Math.max(0, Math.floor(toSafeNumber(memberCount, 0)));
    const basePrice = Math.max(0, toSafeNumber(config.basePrice, 0));
    const includedMembers = Math.max(0, Math.floor(toSafeNumber(config.includedMembers, 0)));
    const extraMemberPrice = Math.max(0, toSafeNumber(config.extraMemberPrice, 0));
    const extraMembers = Math.max(0, safeMemberCount - includedMembers);
    const extraCost = extraMembers * extraMemberPrice;
    const totalPrice = basePrice + extraCost;
    const maxMembers = config.maxMembers == null ? null : Math.max(0, Math.floor(toSafeNumber(config.maxMembers, 0)));
    const requiresEnterprise = maxMembers != null && safeMemberCount > maxMembers;

    return {
      plan: normalized,
      memberCount: safeMemberCount,
      basePrice,
      includedMembers,
      extraMemberPrice,
      extraMembers,
      extraCost,
      totalPrice,
      maxMembers,
      requiresEnterprise,
    };
  }

  function getPlanEstimateSummaryText(plan = currentUserPlan, memberCount = getCurrentTeamMemberCount()) {
    const estimate = calculatePlanEstimate(plan, memberCount);
    if (estimate.plan === 'enterprise') {
      return t('settingsSubscriptionCurrentEstimated', {
        amount: t('settingsSubscriptionEnterprisePrice'),
      });
    }
    if (estimate.extraCost > 0 && estimate.extraMembers > 0) {
      return t('settingsSubscriptionCurrentEstimatedWithExtra', {
        amount: formatPlanMonthlyPrice(estimate.totalPrice),
        base: formatPlanMonthlyPrice(estimate.basePrice),
        extra: formatPlanMonthlyPrice(estimate.extraCost),
        extraMembers: String(estimate.extraMembers),
      });
    }
    return t('settingsSubscriptionCurrentEstimated', {
      amount: formatPlanMonthlyPrice(estimate.totalPrice),
    });
  }

  function updateHeaderPlanBadge() {
    const badge = document.getElementById('header-plan-badge');
    const usageBadge = document.getElementById('header-plan-usage');
    const profileBadge = document.getElementById('profile-plan-badge');
    const profileLabel = document.getElementById('profile-plan-label');
    const plan = normalizeUserPlan(currentUserPlan);
    const planText = getPlanBadgeText(plan);
    if (badge) {
      badge.textContent = planText;
      badge.dataset.plan = plan;
      badge.title = `Plan: ${planText}`;
    }
    if (profileBadge) {
      profileBadge.textContent = planText;
      profileBadge.dataset.plan = plan;
    }
    if (profileLabel) profileLabel.textContent = planText;
    if (usageBadge) {
      if (plan === 'free') {
        const limit = getCustomerLimitByPlan(plan);
        const used = Array.isArray(customers) ? customers.length : 0;
        const remaining = Math.max(0, (Number.isFinite(limit) ? limit : 0) - used);
        usageBadge.textContent = t('planRemainingCount', { count: String(remaining) });
        usageBadge.style.display = 'inline-flex';
      } else {
        usageBadge.style.display = 'none';
        usageBadge.textContent = '';
      }
    }
  }

  function syncPlanFromStorage() {
    const candidate = getCloudValue(USER_PLAN_KEY, getCloudValue('plan', getLocalValue(USER_PLAN_KEY, 'free')));
    setCurrentUserPlan(candidate, { persistCloud: false });
  }

  function setCurrentUserPlan(plan, options = {}) {
    const { persistCloud = false } = options;
    currentUserPlan = normalizeUserPlan(plan);
    saveLocalValue(USER_PLAN_KEY, currentUserPlan);
    // Future Stripe integration can call this function with persistCloud=true
    // after a successful checkout/webhook verification.
    if (persistCloud && window.FirebaseService?.setUserPlan) {
      window.FirebaseService.setUserPlan(currentUserPlan).catch((err) => {
        console.warn('Failed to persist user plan', err);
      });
    }
    updateHeaderPlanBadge();
    updateTeamManagementTabAvailability();
    refreshLanguageOptionAvailability();
    if (!canUseLanguageByPlan(currentLang, currentUserPlan)) {
      updateLanguage('ja');
    }
  }

  function refreshLanguageOptionAvailability() {
    const languageSelects = getLanguageSelectElements();
    if (languageSelects.length === 0) return;
    languageSelects.forEach((languageSelect) => {
      Array.from(languageSelect.options).forEach((option) => {
        const allowed = canUseLanguageByPlan(option.value, currentUserPlan);
        option.disabled = !allowed;
        option.dataset.planLocked = allowed ? 'false' : 'true';
      });
      languageSelect.title = hasPaidPlanAccess(currentUserPlan)
        ? ''
        : (t('planFeatureLanguageLocked') || '');
    });
  }

  function refreshUiAfterLanguageChange() {
    renderTable();
    renderWorkflowStatusLegend();
    renderCalendar();
    populateSelects();
    updateDashboard();
    renderExpenses();
    renderDashboardQuickMenu();
    renderListColumnsMenu();
    updateGraphToggleButtonLabel();
    updateHeroStatsToggleButtonLabel();
    renderSettings();
    updateTeamManagementTabAvailability();
    syncDynamicItemRowsWithSettings();
  }

  function updateLanguage(lang) {
    if (!canUseLanguageByPlan(lang, currentUserPlan)) {
      lang = canUseLanguageByPlan(currentLang, currentUserPlan) ? currentLang : 'ja';
    }
    if (!window.LOCALE || !window.LOCALE[lang]) {
      console.warn(`Unsupported language "${lang}". Falling back to Japanese.`);
      lang = 'ja';
    }

    currentLang = lang;
    saveLocalValue(LANG_KEY, lang);
    saveCloudValue(LANG_KEY, lang);
    document.documentElement.lang = lang;


    // Update all text content with data-i18n
    const elementsWithI18n = document.querySelectorAll('[data-i18n]');

    elementsWithI18n.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const translation = t(key);
        el.textContent = translation;
      }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.placeholder = t(key);
      }
    });

    // Update titles
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.title = t(key);
      }
    });

    // Update aria-label attributes
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria-label');
      if (key) {
        el.setAttribute('aria-label', t(key));
      }
    });

    // Update alt attributes
    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
      const key = el.getAttribute('data-i18n-alt');
      if (key) {
        el.setAttribute('alt', t(key));
      }
    });

    // Update language selector
    getLanguageSelectElements().forEach((langSelect) => {
      langSelect.value = lang;
      langSelect.disabled = false;
      langSelect.title = '';
    });
    const themeBtn = document.getElementById('btn-theme');
    if (themeBtn) {
      const themeTitle = currentTheme === 'dark' ? t('themeSwitchToLight') : t('themeSwitchToDark');
      themeBtn.title = themeTitle;
      themeBtn.setAttribute('aria-label', themeTitle);
    }
    applyExtendedStaticTranslations();
    updateHeroMetricLabels();
    if (typeof setDashboardVisibility === 'function') setDashboardVisibility(dashboardVisible);

    const customerTable = document.getElementById('customer-table');
    if (customerTable) customerTable.style.tableLayout = 'auto';
    const customerTableWrapper = document.getElementById('table-wrapper');
    if (customerTableWrapper) customerTableWrapper.style.overflowX = 'auto';
    if (legalModalOverlay?.classList.contains('active')) {
      setLegalRegion(getDefaultLegalRegionForLanguage(currentLang), { rerender: false });
      renderLegalModal(activeLegalDocType);
    }

    refreshLanguageOptionAvailability();
    refreshUiAfterLanguageChange();
    updateSettingsCurrentTabIndicator();
    scheduleVerticalLongVowelNormalization();
  }
  window.updateLanguage = updateLanguage;
  window.updateUITS = updateLanguage;

  // ===== Default Custom Options =====
  const DEFAULT_OPTIONS = {
    plan: [],
    dynamicItemHints: [],
  };

  function ensureLocalStorageDefaults() {
    if (State.getRaw(STORAGE_KEY, null) === null) State.setJSON(STORAGE_KEY, []);
    if (State.getRaw(EXPENSES_KEY, null) === null) State.setJSON(EXPENSES_KEY, []);
    if (State.getRaw(PLAN_MASTER_KEY, null) === null) State.setJSON(PLAN_MASTER_KEY, []);
    if (State.getRaw(OPTIONS_KEY, null) === null) State.setJSON(OPTIONS_KEY, DEFAULT_OPTIONS);
    if (State.getRaw(USER_PLAN_KEY, null) === null) State.setJSON(USER_PLAN_KEY, 'free');
    if (State.getRaw(USER_BILLING_PROFILE_KEY, null) === null) State.setJSON(USER_BILLING_PROFILE_KEY, {});
    if (State.getRaw(STUDIO_NAME_KEY, null) === null) State.setJSON(STUDIO_NAME_KEY, '');
    if (State.getRaw(ACCENT_COLOR_KEY, null) === null) State.setJSON(ACCENT_COLOR_KEY, DEFAULT_ACCENT_COLOR);
  }

  // ===== Storage Helpers =====
  function loadCustomers() {
    try {
      const loaded = getCloudValue(STORAGE_KEY, []);
      const records = Array.isArray(loaded) ? loaded : [];
      const currentUid = String(window.FirebaseService?.getCurrentUser?.()?.uid || '').trim();
      const scopedRecords = currentUid
        ? records.filter((record) => {
          const ownerUid = String(record?.userId || '').trim();
          return !ownerUid || ownerUid === currentUid;
        })
        : records;
      return withCurrentUserId(scopedRecords).map((record) => {
        const normalizedExtraChargeItems = normalizeExtraChargeItems(record?.extraChargeItems);
        const fallbackExpense = toSafeNumber(record?.planCost, toSafeNumber(record?.planDetails?.planCost, 0))
          + normalizedExtraChargeItems.reduce((sum, item) => sum + toSafeNumber(item?.cost, 0), 0);
        return {
          ...record,
          planDetails: normalizePlanDetails(record?.planDetails, record?.revenue),
          extraChargeItems: normalizedExtraChargeItems,
          workflowStatus: normalizeWorkflowStatus(record?.workflowStatus),
          expense: toSafeNumber(record?.expense, fallbackExpense),
          costumePrice: toSafeNumber(record?.costumePrice, 0),
          hairMakeupPrice: toSafeNumber(record?.hairMakeupPrice, 0),
        };
      });
    } catch (err) {
      console.error('[Customer Load] failed', err);
      return [];
    }
  }
  function withCurrentUserId(records) {
    const uid = window.FirebaseService?.getCurrentUser?.()?.uid;
    if (!uid || !Array.isArray(records)) return records;
    return records.map((record) => ({ ...record, userId: uid }));
  }

  function saveCustomers(data, options = {}) {
    try {
      const records = Array.isArray(data) ? data : [];
      const normalized = records.map((record) => {
        const normalizedExtraChargeItems = normalizeExtraChargeItems(record?.extraChargeItems);
        const fallbackExpense = toSafeNumber(record?.planCost, toSafeNumber(record?.planDetails?.planCost, 0))
          + normalizedExtraChargeItems.reduce((sum, item) => sum + toSafeNumber(item?.cost, 0), 0);
        return {
          ...(record || {}),
          planDetails: normalizePlanDetails(record?.planDetails, record?.revenue),
          extraChargeItems: normalizedExtraChargeItems,
          workflowStatus: normalizeWorkflowStatus(record?.workflowStatus),
          expense: toSafeNumber(record?.expense, fallbackExpense),
          costumePrice: toSafeNumber(record?.costumePrice, 0),
          hairMakeupPrice: toSafeNumber(record?.hairMakeupPrice, 0),
        };
      });
      return saveCloudValue(STORAGE_KEY, withCurrentUserId(normalized), options);
    } catch (err) {
      console.error('[Customer Save] normalization failed', err);
      return Promise.reject(err);
    }
  }

  function loadOptions() {
    const raw = { ...DEFAULT_OPTIONS, ...(getCloudValue(OPTIONS_KEY, {}) || {}) };
    if (!Array.isArray(raw.plan)) raw.plan = [];
    if (!Array.isArray(raw.dynamicItemHints)) raw.dynamicItemHints = [...DEFAULT_OPTIONS.dynamicItemHints];
    return raw;
  }
  function saveOptions(data) {
    const normalized = { ...(data || {}) };
    if (!Array.isArray(normalized.plan)) normalized.plan = [];
    if (!Array.isArray(normalized.dynamicItemHints)) normalized.dynamicItemHints = [...DEFAULT_OPTIONS.dynamicItemHints];
    saveCloudValue(OPTIONS_KEY, normalized);
  }

  function getContractPresetTemplates() {
    return {
      standard: t('contractPresetTextStandard'),
      bridal: t('contractPresetTextBridal'),
      light: t('contractPresetTextLight'),
    };
  }

  function getDefaultContractTemplateText() {
    return getContractPresetTemplates().standard;
  }

  function loadContractTemplate() {
    const fallback = getDefaultContractTemplateText();
    const loaded = getCloudValue(CONTRACT_TEMPLATE_KEY, getLocalValue(CONTRACT_TEMPLATE_KEY, fallback));
    if (typeof loaded !== 'string' || !loaded.trim()) return fallback;
    return loaded;
  }

  function saveContractTemplate(templateText) {
    const next = String(templateText || '').trim() || getDefaultContractTemplateText();
    contractTemplateText = next;
    saveLocalValue(CONTRACT_TEMPLATE_KEY, next);
    saveCloudValue(CONTRACT_TEMPLATE_KEY, next);
  }

  function getDefaultDashboardConfig() {
    return DASHBOARD_CARD_DEFINITIONS.map((item) => ({
      key: item.key,
      visible: true,
    }));
  }

  function normalizeDashboardConfig(config) {
    const allowedKeys = new Set(DASHBOARD_CARD_DEFINITIONS.map((item) => item.key));
    const unique = new Map();

    if (Array.isArray(config)) {
      config.forEach((item) => {
        const key = item && typeof item.key === 'string' ? item.key : '';
        if (!allowedKeys.has(key) || unique.has(key)) return;
        unique.set(key, {
          key,
          visible: item.visible !== false,
        });
      });
    }

    DASHBOARD_CARD_DEFINITIONS.forEach((item) => {
      if (!unique.has(item.key)) {
        unique.set(item.key, { key: item.key, visible: true });
      }
    });

    return Array.from(unique.values());
  }

  function loadDashboardConfig() {
    const defaultConfig = getDefaultDashboardConfig();
    const loaded = getCloudValue(DASHBOARD_CONFIG_KEY, getLocalValue(DASHBOARD_CONFIG_KEY, defaultConfig));
    return normalizeDashboardConfig(loaded);
  }

  function saveDashboardConfig(config) {
    const normalized = normalizeDashboardConfig(config);
    dashboardConfig = normalized;
    saveLocalValue(DASHBOARD_CONFIG_KEY, normalized);
    saveCloudValue(DASHBOARD_CONFIG_KEY, normalized);
  }

  function getDashboardCardLabel(itemKey) {
    const item = DASHBOARD_CARD_DEFINITIONS.find((entry) => entry.key === itemKey);
    if (!item) return itemKey;
    const label = item.labelKey ? t(item.labelKey) : '';
    return label && label !== item.labelKey ? label : item.fallbackLabel;
  }

  function getDefaultHeroMetricsConfig() {
    const legacyVisible = getCloudValue(
      HERO_METRICS_VISIBLE_KEY,
      getLocalValue(HERO_METRICS_VISIBLE_KEY, false)
    ) === true;
    return HERO_METRIC_DEFINITIONS.map((item) => ({
      key: item.key,
      visible: legacyVisible,
    }));
  }

  function normalizeHeroMetricsConfig(config) {
    const allowedKeys = new Set(HERO_METRIC_DEFINITIONS.map((item) => item.key));
    const unique = new Map();

    if (Array.isArray(config)) {
      config.forEach((item) => {
        const key = item && typeof item.key === 'string' ? item.key : '';
        if (!allowedKeys.has(key) || unique.has(key)) return;
        unique.set(key, {
          key,
          visible: item.visible !== false,
        });
      });
    }

    HERO_METRIC_DEFINITIONS.forEach((item) => {
      if (!unique.has(item.key)) {
        unique.set(item.key, { key: item.key, visible: true });
      }
    });

    return Array.from(unique.values());
  }

  function loadHeroMetricsConfig() {
    const defaultConfig = getDefaultHeroMetricsConfig();
    const loaded = getCloudValue(HERO_METRICS_CONFIG_KEY, getLocalValue(HERO_METRICS_CONFIG_KEY, defaultConfig));
    return normalizeHeroMetricsConfig(loaded);
  }

  function saveHeroMetricsConfig(config) {
    const normalized = normalizeHeroMetricsConfig(config);
    heroMetricsConfig = normalized;
    heroMetricsVisible = normalized.some((item) => item.visible !== false);
    saveLocalValue(HERO_METRICS_CONFIG_KEY, normalized);
    saveCloudValue(HERO_METRICS_CONFIG_KEY, normalized);
    saveLocalValue(HERO_METRICS_VISIBLE_KEY, heroMetricsVisible);
    saveCloudValue(HERO_METRICS_VISIBLE_KEY, heroMetricsVisible);
  }

  function getHeroMetricLabel(itemKey) {
    const item = HERO_METRIC_DEFINITIONS.find((entry) => entry.key === itemKey);
    if (!item) return itemKey;
    const label = item.labelKey ? t(item.labelKey) : '';
    return label && label !== item.labelKey ? label : item.fallbackLabel;
  }

  function getDefaultListColumnConfig() {
    return LIST_COLUMN_DEFINITIONS.map((item) => ({
      key: item.key,
      visible: true,
    }));
  }

  function normalizeListColumnConfig(config) {
    const allowedKeys = new Set(LIST_COLUMN_DEFINITIONS.map((item) => item.key));
    const unique = new Map();

    if (Array.isArray(config)) {
      config.forEach((item) => {
        const key = item && typeof item.key === 'string' ? item.key : '';
        if (!allowedKeys.has(key) || unique.has(key)) return;
        unique.set(key, {
          key,
          visible: item.visible !== false,
        });
      });
    }

    LIST_COLUMN_DEFINITIONS.forEach((item) => {
      if (!unique.has(item.key)) {
        unique.set(item.key, { key: item.key, visible: true });
      }
    });

    return Array.from(unique.values());
  }

  function loadListColumnConfig() {
    const defaultConfig = getDefaultListColumnConfig();
    const loaded = getCloudValue(LIST_COLUMN_CONFIG_KEY, getLocalValue(LIST_COLUMN_CONFIG_KEY, defaultConfig));
    return normalizeListColumnConfig(loaded);
  }

  function saveListColumnConfig(config) {
    const normalized = normalizeListColumnConfig(config);
    listColumnConfig = normalized;
    saveLocalValue(LIST_COLUMN_CONFIG_KEY, normalized);
    saveCloudValue(LIST_COLUMN_CONFIG_KEY, normalized);
  }

  function getListColumnLabel(itemKey) {
    const item = LIST_COLUMN_DEFINITIONS.find((entry) => entry.key === itemKey);
    if (!item) return itemKey;
    const label = item.labelKey ? t(item.labelKey) : '';
    return label && label !== item.labelKey ? label : item.fallbackLabel;
  }

  function getVisibleListColumns() {
    return listColumnConfig
      .filter((item) => item.visible !== false)
      .map((item) => LIST_COLUMN_DEFINITIONS.find((entry) => entry.key === item.key))
      .filter(Boolean);
  }

  function getListColumnOrderMap() {
    const map = {};
    listColumnConfig.forEach((item, index) => {
      if (!item?.key) return;
      map[item.key] = index + 1;
    });
    return map;
  }

  function normalizePlanMasterItem(plan) {
    const safe = (plan && typeof plan === 'object') ? plan : {};
    const name = typeof safe.name === 'string' ? safe.name.trim() : '';
    const revenue = toSafeNumber(safe.price, toSafeNumber(safe.basePrice, 0));
    const cost = toSafeNumber(safe.cost, toSafeNumber(safe.baseCost, toSafeNumber(safe.planCost, 0)));
    const color = normalizeHexColor(safe.color, getDefaultPlanTagColor(name));
    return {
      name,
      price: revenue,
      cost,
      color,
    };
  }

  function loadPlanMaster() {
    const loaded = getCloudValue(PLAN_MASTER_KEY, getLocalValue(PLAN_MASTER_KEY, []));
    const list = Array.isArray(loaded) ? loaded : [];
    return list
      .map(normalizePlanMasterItem)
      .filter((plan) => plan.name);
  }

  function savePlanMaster(data) {
    const normalized = (Array.isArray(data) ? data : [])
      .map(normalizePlanMasterItem)
      .filter((plan) => plan.name);
    planMaster = normalized;
    saveLocalValue(PLAN_MASTER_KEY, normalized);
    saveCloudValue(PLAN_MASTER_KEY, normalized);

    if (!options || typeof options !== 'object') options = loadOptions();
    options.plan = normalized.map((plan) => plan.name);
    saveOptions(options);
  }

  function findPlanMasterByValue(value) {
    if (!value) return null;
    return planMaster.find((plan) => plan.name === value) || null;
  }

  function loadCustomFieldDefinitions() {
    return getCloudValue(CUSTOM_FIELDS_KEY, []);
  }

  function saveCustomFieldDefinitions(fields) {
    saveCloudValue(CUSTOM_FIELDS_KEY, fields);
  }

  function addCustomFieldDefinition(label) {
    const definitions = loadCustomFieldDefinitions();
    const id = 'custom_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const field = { id, label, type: 'text' };
    definitions.push(field);
    saveCustomFieldDefinitions(definitions);
    return field;
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ===== State =====
  ensureLocalStorageDefaults();
  let customers = loadCustomers();
  let options = loadOptions();
  let dynamicItemNameSuggestions = loadDynamicItemNameSuggestions();
  let dynamicItemSuggestionMap = loadDynamicItemSuggestionMap();
  let planMaster = loadPlanMaster();
  function ensurePlanMasterFallbackFromOptions() {
    if (planMaster.length > 0 || !Array.isArray(options.plan) || options.plan.length === 0) return;
    planMaster = options.plan
      .filter((name) => typeof name === 'string' && name.trim())
      .map((name) => normalizePlanMasterItem({ name }));
    savePlanMaster(planMaster);
  }
  ensurePlanMasterFallbackFromOptions();
  let currentSort = { key: 'shootingDate', dir: 'desc' };
  let editingId = null;
  let deletingId = null;
  let calYear, calMonth;
  const DEFAULT_CALENDAR_FILTERS = {
    inquiryDate: true,
    meetingDate: true,
    shootingDate: true,
    billingDate: true,
  };

  function loadCalendarFilters() {
    const saved = getCloudValue(CALENDAR_FILTERS_KEY, {});
    return { ...DEFAULT_CALENDAR_FILTERS, ...(saved || {}) };
  }

  function saveCalendarFilters(filters) {
    saveCloudValue(CALENDAR_FILTERS_KEY, filters);
  }

  let calendarFilters = loadCalendarFilters();
  let dashboardVisible = getCloudValue(DASHBOARD_VISIBILITY_KEY, getLocalValue(DASHBOARD_VISIBILITY_KEY, true)) !== false;
  let dashboardConfig = loadDashboardConfig();
  let isDashboardQuickMenuOpen = false;
  let listColumnConfig = loadListColumnConfig();
  let isListColumnsMenuOpen = false;
  let listColumnsHideTimer = null;
  let statusColorMap = loadStatusColorMap();
  let heroMetricsConfig = loadHeroMetricsConfig();
  let heroMetricsVisible = heroMetricsConfig.some((item) => item.visible !== false);
  let contractTemplateText = loadContractTemplate();
  let formFieldVisibilityConfig = loadFormFieldVisibilityConfig();
  let googleCalendarAutoSyncEnabled = loadGoogleCalendarAutoSyncEnabled();
  let googleCalendarSelectedId = loadGoogleCalendarSelectedId();
  let googleCalendarList = [];
  let googleCalendarListLoaded = false;
  let googleCalendarListPromise = null;
  let isGraphVisible = false;
  let isMobileHeaderMenuOpen = false;
  let graphHideTimer = null;
  let isExpenseManuallyEdited = false;

  // Init calendar to current month
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  let selectedDashboardMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let revenueProfitChartInstance = null;
  let requestTrendChartInstance = null;

  function reloadRuntimeStateFromStorage() {
    customers = loadCustomers();
    options = loadOptions();
    dynamicItemNameSuggestions = loadDynamicItemNameSuggestions();
    dynamicItemSuggestionMap = loadDynamicItemSuggestionMap();
    planMaster = loadPlanMaster();
    ensurePlanMasterFallbackFromOptions();
    calendarFilters = loadCalendarFilters();
    dashboardVisible = getCloudValue(DASHBOARD_VISIBILITY_KEY, getLocalValue(DASHBOARD_VISIBILITY_KEY, true)) !== false;
    dashboardConfig = loadDashboardConfig();
    listColumnConfig = loadListColumnConfig();
    statusColorMap = loadStatusColorMap();
    heroMetricsConfig = loadHeroMetricsConfig();
    contractTemplateText = loadContractTemplate();
    formFieldVisibilityConfig = loadFormFieldVisibilityConfig();
    googleCalendarAutoSyncEnabled = loadGoogleCalendarAutoSyncEnabled();
    googleCalendarSelectedId = loadGoogleCalendarSelectedId();
    currentStudioName = normalizeStudioName(getCloudValue(STUDIO_NAME_KEY, getLocalValue(STUDIO_NAME_KEY, '')));
    currentAccentColor = normalizeAccentColor(
      getCloudValue(ACCENT_COLOR_KEY, getLocalValue(ACCENT_COLOR_KEY, DEFAULT_ACCENT_COLOR))
    );
    syncPlanFromStorage();
    applyAccentColor(currentAccentColor, { persist: false });
    updateHeaderBrandWordmark();
  }

  // ===== DOM =====
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const tbody = $('#customer-tbody');
  const searchInput = $('#search-input');
  const filterPayment = $('#filter-payment');
  const filterPhotographer = $('#filter-photographer');
  const filterMonth = $('#filter-month');
  const mobileFilterToggleButton = $('#btn-mobile-filters');
  const mobileFilterSheetOverlay = $('#mobile-filter-sheet-overlay');
  const mobileFilterSheet = $('#mobile-filter-sheet');
  const mobileFilterPayment = $('#mobile-filter-payment');
  const mobileFilterPhotographer = $('#mobile-filter-photographer');
  const mobileFilterMonth = $('#mobile-filter-month');
  const mobileSortQuickList = $('#mobile-sort-quick-list');
  const mobileFilterCloseButton = $('#btn-mobile-filter-close');
  const dashboardMonthPicker = $('#dashboard-month-picker');
  const dashboardPrevMonth = $('#dashboard-prev-month');
  const dashboardNextMonth = $('#dashboard-next-month');
  const modalOverlay = $('#modal-overlay');
  const detailOverlay = $('#detail-overlay');
  const confirmOverlay = $('#confirm-overlay');
  const settingsOverlay = $('#settings-overlay');
  const emptyState = $('#empty-state');
  const tableWrapper = $('#table-wrapper');
  const customerCardGrid = $('#customer-card-grid');
  const listColumnsMenu = $('#list-columns-menu');
  const listColumnsMenuContent = $('#list-columns-menu-content');
  const listColumnsButton = $('#btn-list-columns');
  const appHeader = document.querySelector('.app-header');
  const headerActions = document.querySelector('.header-actions');
  const mobileHeaderMenuButton = document.getElementById('btn-mobile-header-menu');
  const cloudSyncIndicator = document.getElementById('cloud-sync-indicator');
  const cloudSyncLabel = document.getElementById('cloud-sync-label');
  const tomorrowReminderCard = document.getElementById('tomorrow-reminder-card');
  const tomorrowReminderTitle = document.getElementById('tomorrow-reminder-title');
  const tomorrowReminderList = document.getElementById('tomorrow-reminder-list');
  const legalModalOverlay = document.getElementById('legal-modal-overlay');
  const legalModalTitle = document.getElementById('legal-modal-title');
  const legalModalContent = document.getElementById('legal-modal-content');
  const legalModalCloseButton = document.getElementById('btn-legal-modal-close');
  const legalModalCloseFooterButton = document.getElementById('btn-legal-modal-close-footer');
  const contactModalOverlay = document.getElementById('contact-modal-overlay');
  const contactModalCloseButton = document.getElementById('btn-contact-modal-close');
  const contactModalCloseFooterButton = document.getElementById('btn-contact-modal-close-footer');
  const contactModalSubmitButton = document.getElementById('btn-contact-submit');
  const legalRegionTabs = Array.from(document.querySelectorAll('[data-legal-region]'));
  const legalRegionGlobalTab = document.getElementById('legal-region-tab-global');
  const legalRegionJapanTab = document.getElementById('legal-region-tab-japan');
  const legalRegionEuTab = document.getElementById('legal-region-tab-eu');
  const listView = $('#list-view');
  const calendarView = $('#calendar-view');
  const calendarFilterInputs = $$('.calendar-filter-input');
  const eventBindingRegistry = new WeakMap();
  let isMobileFilterSheetOpen = false;

  function bindEventOnce(element, eventName, handler, bindingKey = null, options = undefined) {
    if (!element || typeof handler !== 'function') return;

    let boundKeys = eventBindingRegistry.get(element);
    if (!boundKeys) {
      boundKeys = new Set();
      eventBindingRegistry.set(element, boundKeys);
    }

    const key = bindingKey || `${eventName}:${handler.name || 'anonymous'}`;
    if (boundKeys.has(key)) return;

    element.addEventListener(eventName, handler, options);
    boundKeys.add(key);
  }

  function safeRun(label, fn, fallback = null) {
    try {
      return fn();
    } catch (err) {
      console.error(`[SafeRun] ${label}`, err);
      return fallback;
    }
  }

  const VERTICAL_TEXT_TARGET_SELECTOR = [
    '.vertical-text',
    '.vertical-writing',
    '.tategaki',
    '[style*="writing-mode: vertical"]',
    '[style*="writing-mode:vertical"]',
    '[style*="writing-mode: vertical-rl"]',
    '[style*="writing-mode:vertical-rl"]',
    '[style*="writing-mode: vertical-lr"]',
    '[style*="writing-mode:vertical-lr"]',
  ].join(', ');
  let verticalLongVowelNormalizeFrame = null;

  function normalizeVerticalLongVowelMarks(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return;

    const targets = root.querySelectorAll(VERTICAL_TEXT_TARGET_SELECTOR);
    targets.forEach((target) => {
      const walker = document.createTreeWalker(
        target,
        window.NodeFilter?.SHOW_TEXT ?? 4,
        null
      );
      const textNodes = [];
      let currentNode = walker.nextNode();
      while (currentNode) {
        if (
          currentNode.nodeValue
          && currentNode.nodeValue.includes('ー')
          && !currentNode.parentElement?.closest('.ch-rotate')
        ) {
          textNodes.push(currentNode);
        }
        currentNode = walker.nextNode();
      }

      textNodes.forEach((textNode) => {
        const text = textNode.nodeValue;
        if (!text || !text.includes('ー')) return;

        const fragment = document.createDocumentFragment();
        for (const ch of text) {
          if (ch === 'ー') {
            const marker = document.createElement('span');
            marker.className = 'ch-rotate';
            marker.textContent = 'ー';
            fragment.appendChild(marker);
          } else {
            fragment.appendChild(document.createTextNode(ch));
          }
        }

        textNode.parentNode?.replaceChild(fragment, textNode);
      });
    });
  }

  function scheduleVerticalLongVowelNormalization(root = document) {
    if (verticalLongVowelNormalizeFrame) {
      cancelAnimationFrame(verticalLongVowelNormalizeFrame);
    }
    verticalLongVowelNormalizeFrame = requestAnimationFrame(() => {
      verticalLongVowelNormalizeFrame = null;
      normalizeVerticalLongVowelMarks(root);
    });
  }

  let activeLegalDocType = 'terms';
  let activeLegalRegion = 'global';

  function normalizeLegalDocType(type) {
    return String(type || '').trim().toLowerCase() === 'privacy' ? 'privacy' : 'terms';
  }

  function normalizeLegalRegion(region) {
    const value = String(region || '').trim().toLowerCase();
    if (value === 'japan') return 'japan';
    if (value === 'eu') return 'eu';
    return 'global';
  }

  function getDefaultLegalRegionForLanguage(lang = currentLang) {
    const normalizedLang = String(lang || '').trim().toLowerCase();
    if (normalizedLang === 'ja') return 'japan';
    if (normalizedLang === 'fr') return 'eu';
    return 'global';
  }

  function getLegalDocTranslationKeys(type, region) {
    const normalizedType = normalizeLegalDocType(type);
    const normalizedRegion = normalizeLegalRegion(region);
    const suffixMap = {
      global: 'Global',
      japan: 'Japan',
      eu: 'Eu',
    };
    const suffix = suffixMap[normalizedRegion] || suffixMap.global;
    if (normalizedType === 'privacy') {
      return { titleKey: 'privacyModalTitle', contentKey: `privacyLegal${suffix}Content` };
    }
    return { titleKey: 'termsModalTitle', contentKey: `termsLegal${suffix}Content` };
  }

  function getLegalLocaleTextOrFallback(key, fallback = '') {
    const currentLocale = window.LOCALE?.[currentLang];
    if (currentLocale && typeof currentLocale[key] === 'string' && currentLocale[key]) return currentLocale[key];
    const englishLocale = window.LOCALE?.en;
    if (englishLocale && typeof englishLocale[key] === 'string' && englishLocale[key]) return englishLocale[key];
    const japaneseLocale = window.LOCALE?.ja;
    if (japaneseLocale && typeof japaneseLocale[key] === 'string' && japaneseLocale[key]) return japaneseLocale[key];
    return fallback;
  }

  function interpolateLegalTemplate(template, params = {}) {
    let resolved = String(template || '');
    Object.entries(params).forEach(([key, value]) => {
      resolved = resolved.split(`{${key}}`).join(String(value ?? ''));
    });
    return resolved;
  }

  function updateLegalRegionSwitchLabels() {
    if (legalRegionGlobalTab) legalRegionGlobalTab.textContent = getLegalLocaleTextOrFallback('legalRegionGlobalLabel', 'Global');
    if (legalRegionJapanTab) legalRegionJapanTab.textContent = getLegalLocaleTextOrFallback('legalRegionJapanLabel', 'Japan');
    if (legalRegionEuTab) legalRegionEuTab.textContent = getLegalLocaleTextOrFallback('legalRegionEuLabel', 'EU');
  }

  function updateLegalRegionTabsState(region = activeLegalRegion) {
    const normalizedRegion = normalizeLegalRegion(region);
    legalRegionTabs.forEach((button) => {
      const isActive = normalizeLegalRegion(button?.dataset?.legalRegion) === normalizedRegion;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    activeLegalRegion = normalizedRegion;
  }

  function buildLegalModalBodyHtml(contentText) {
    const lines = String(contentText || '').split(/\r?\n/);
    const html = [];
    let listItems = [];

    const flushList = () => {
      if (!listItems.length) return;
      html.push(`<ul>${listItems.join('')}</ul>`);
      listItems = [];
    };

    lines.forEach((rawLine) => {
      const line = String(rawLine || '').trim();
      if (!line) {
        flushList();
        return;
      }
      if (line.startsWith('## ')) {
        flushList();
        html.push(`<h4 class="legal-doc-heading">${escapeHtml(line.slice(3).trim())}</h4>`);
        return;
      }
      if (line.startsWith('- ')) {
        listItems.push(`<li>${escapeHtml(line.slice(2).trim())}</li>`);
        return;
      }
      flushList();
      html.push(`<p>${escapeHtml(line).replace(/\n/g, '<br>')}</p>`);
    });

    flushList();
    return html.join('');
  }

  function setLegalRegion(region = 'global', options = {}) {
    const { rerender = true } = options;
    updateLegalRegionTabsState(region);
    if (rerender && legalModalOverlay?.classList.contains('active')) {
      renderLegalModal(activeLegalDocType);
    }
  }

  function renderLegalModal(type = activeLegalDocType) {
    if (!legalModalTitle || !legalModalContent) return;
    const normalizedType = normalizeLegalDocType(type);
    const normalizedRegion = normalizeLegalRegion(activeLegalRegion);
    activeLegalDocType = normalizedType;
    const { titleKey, contentKey } = getLegalDocTranslationKeys(normalizedType, normalizedRegion);
    const legalContactEmail = getLegalLocaleTextOrFallback('legalContactEmail', '')
      || window.LOCALE?.ja?.legalContactEmail
      || '';
    const legalServiceName = getLegalLocaleTextOrFallback('legalServiceName', '本サービス');
    const defaultTitle = normalizedType === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
    const fallbackContentKey = normalizedType === 'privacy' ? 'privacyModalContent' : 'termsModalContent';
    const rawContent = getLegalLocaleTextOrFallback(contentKey, getLegalLocaleTextOrFallback(fallbackContentKey, ''));

    updateLegalRegionSwitchLabels();
    updateLegalRegionTabsState(normalizedRegion);
    legalModalTitle.textContent = getLegalLocaleTextOrFallback(titleKey, defaultTitle);
    legalModalContent.innerHTML = buildLegalModalBodyHtml(
      interpolateLegalTemplate(rawContent, {
        contactEmail: legalContactEmail,
        brandName: legalServiceName,
      })
    );
  }

  function openLegalModal(type = 'terms') {
    if (!legalModalOverlay) return;
    setLegalRegion(getDefaultLegalRegionForLanguage(currentLang), { rerender: false });
    renderLegalModal(type);
    legalModalOverlay.style.display = 'flex';
    window.requestAnimationFrame(() => {
      legalModalOverlay.classList.add('active');
    });
  }

  function closeLegalModal() {
    if (!legalModalOverlay) return;
    legalModalOverlay.classList.remove('active');
    window.setTimeout(() => {
      if (!legalModalOverlay.classList.contains('active')) {
        legalModalOverlay.style.display = 'none';
      }
    }, 220);
  }

  function handleLegalDocLinkClick(event) {
    event.preventDefault();
    const docType = event?.currentTarget?.dataset?.legalDoc || 'terms';
    openLegalModal(docType);
  }

  function handleLegalRegionTabClick(event) {
    event.preventDefault();
    const region = event?.currentTarget?.dataset?.legalRegion || 'global';
    setLegalRegion(region);
  }

  function resetContactModalForm() {
    const nameInput = document.getElementById('contact-form-name');
    const emailInput = document.getElementById('contact-form-email');
    const messageInput = document.getElementById('contact-form-message');
    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (messageInput) messageInput.value = '';
  }

  function openContactModal() {
    if (!contactModalOverlay) return;
    contactModalOverlay.style.display = 'flex';
    window.requestAnimationFrame(() => {
      contactModalOverlay.classList.add('active');
    });
  }

  function closeContactModal() {
    if (!contactModalOverlay) return;
    contactModalOverlay.classList.remove('active');
    window.setTimeout(() => {
      if (!contactModalOverlay.classList.contains('active')) {
        contactModalOverlay.style.display = 'none';
      }
    }, 220);
  }

  async function handleContactSubmit(event) {
    event?.preventDefault?.();
    const name = String(document.getElementById('contact-form-name')?.value || '').trim();
    const email = String(document.getElementById('contact-form-email')?.value || '').trim();
    const message = String(document.getElementById('contact-form-message')?.value || '').trim();

    if (!message) {
      showToast(t('contactValidation'), 'error');
      return;
    }

    const user = window.FirebaseService?.getCurrentUser?.();
    if (!user || typeof window.FirebaseService?.saveSupportTicket !== 'function') {
      showToast(t('contactLoginRequired'), 'error');
      return;
    }

    const supportSubject = getLocaleTextOrFallback('contactSubjectDefault', 'General Inquiry');
    const messageBody = [
      name ? `${t('contactNameLabel')}: ${name}` : '',
      email ? `${t('contactEmailLabel')}: ${email}` : '',
      '',
      message,
    ].filter(Boolean).join('\n');

    setActionButtonLoadingState(
      contactModalSubmitButton,
      true,
      getLocaleTextOrFallback('btnSaving', '保存中...')
    );
    try {
      await window.FirebaseService.saveSupportTicket({
        subject: supportSubject,
        category: 'question',
        message: messageBody,
        notifyTo: getLegalLocaleTextOrFallback('legalContactEmail', 'pholio.support@icloud.com'),
        language: currentLang,
        currency: currentCurrency,
        osInfo: getClientOsInfo(),
        status: 'pending',
        ai_draft_reply: '',
      });
      resetContactModalForm();
      closeContactModal();
      showToast(t('contactSubmitSuccess'));
    } catch (err) {
      console.error('Contact ticket submit failed', err);
      showToast(t('contactSubmitFailed'), 'error');
    } finally {
      setActionButtonLoadingState(
        contactModalSubmitButton,
        false,
        getLocaleTextOrFallback('btnSaving', '保存中...')
      );
    }
  }

  window.closeLegalModal = closeLegalModal;
  window.closeContactModal = closeContactModal;

  function applyMinimalSafeModeUI() {
    if (!SAFE_MODE_MINIMAL_BOOT) return;
    ['btn-toggle-dashboard', 'btn-toggle-graph'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const quickMenu = document.getElementById('dashboard-quick-menu');
    if (quickMenu) quickMenu.style.display = 'none';
    const heroPanel = document.querySelector('.dashboard-hero-metrics');
    if (heroPanel) heroPanel.classList.add('is-hidden');
  }

  function initializeManifestSafely() {
    try {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (!manifestLink) return;
      if (window.location.protocol === 'file:') {
        manifestLink.remove();
      }
    } catch (err) {
      console.warn('Manifest initialization skipped', err);
    }
  }

  function shouldStartInLocalGuestMode() {
    if (window.location.protocol === 'file:') return true;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('guest') === '1') {
        saveLocalValue(LOCAL_GUEST_MODE_KEY, true);
        return true;
      }
    } catch {
      // Ignore URL parsing failures.
    }
    return false;
  }

  function activateLocalGuestMode(message = '') {
    isLoggedIn = true;
    currentAuthUserEmail = '';
    clearAdminSecurityState('not_admin');
    saveLocalValue(LOCAL_GUEST_MODE_KEY, true);
    setCurrentUserPlan('free', { persistCloud: false });
    safeRun('localMode.theme', () => applyTheme('dark'));
    safeRun('localMode.language', () => updateLanguage(currentLang || 'ja'));
    safeRun('localMode.renderTable', () => renderTable());
    safeRun('localMode.renderExpenses', () => renderExpenses());
    safeRun('localMode.updateDashboard', () => updateDashboard());
    safeRun('localMode.populateSelects', () => populateSelects());
    safeRun('localMode.syncCalendarFilterControls', () => syncCalendarFilterControls());
    setAuthScreenState('loggedIn', { displayName: 'Guest (Local Mode)' });
    const authStatus = document.getElementById('auth-status');
    const loginBtn = document.getElementById('btn-google-login');
    const loginScreenBtn = document.getElementById('btn-google-login-screen');
    const logoutBtn = document.getElementById('btn-logout');
    if (authStatus) authStatus.textContent = message || t('localGuestModeDefault');
    if (loginBtn) loginBtn.style.display = '';
    if (loginScreenBtn) loginScreenBtn.style.display = '';
    if (logoutBtn) logoutBtn.style.display = 'none';
    setCloudSyncIndicator('local');
    updateHeaderAuthUi({ displayName: 'Guest (Local Mode)' });
    if (message) showToast(message);
  }

  // ===== Field Config =====
  const fields = [
    { key: 'inquiryDate', labelKey: 'thInquiryDate', type: 'date' },
    { key: 'contractDate', labelKey: 'thContractDate', type: 'date' },
    { key: 'deliveryDate', labelKey: 'labelDeliveryDate', type: 'date' },
    { key: 'shootingDate', labelKey: 'thShootingDate', type: 'date' },
    { key: 'customerName', labelKey: 'thCustomerName', type: 'text' },
    { key: 'contact', labelKey: 'thContact', type: 'text' },
    { key: 'leadSource', labelKey: 'labelLeadSource', type: 'select' },
    { key: 'meetingDate', labelKey: 'thMeetingDate', type: 'date' },
    { key: 'workflowStatus', labelKey: 'labelWorkflowStatus', type: 'select' },
    { key: 'plan', labelKey: 'thPlan', type: 'select' },
    { key: 'billingDate', labelKey: 'labelBillingDate', type: 'date' },
    { key: 'paymentConfirmDate', labelKey: 'labelPaymentConfirmDate', type: 'date' },
    { key: 'paymentChecked', labelKey: 'labelPaymentChecked', type: 'checkbox' },
    { key: 'details', labelKey: 'labelDetails', type: 'textarea' },
    { key: 'notes', labelKey: 'labelNotes', type: 'textarea' },
    { key: 'revenue', labelKey: 'thRevenue', type: 'number' },
    { key: 'assignedTo', labelKey: 'labelAssignedTo', type: 'select' },
    { key: 'location', labelKey: 'labelLocation', type: 'text' },
  ];

  function getFieldLabel(field) {
    if (!field) return '';
    if (field.labelKey) return t(field.labelKey);
    return field.label || field.key || '';
  }

  function getDefaultFormFieldVisibilityConfig() {
    return FORM_FIELD_VISIBILITY_DEFINITIONS.reduce((acc, item) => {
      acc[item.key] = true;
      return acc;
    }, {});
  }

  function normalizeFormFieldVisibilityConfig(config) {
    const source = (config && typeof config === 'object') ? config : {};
    return FORM_FIELD_VISIBILITY_DEFINITIONS.reduce((acc, item) => {
      acc[item.key] = source[item.key] !== false;
      return acc;
    }, {});
  }

  function loadFormFieldVisibilityConfig() {
    return normalizeFormFieldVisibilityConfig(getLocalValue(
      FORM_FIELD_VISIBILITY_KEY,
      getDefaultFormFieldVisibilityConfig()
    ));
  }

  function saveFormFieldVisibilityConfig(nextConfig) {
    formFieldVisibilityConfig = normalizeFormFieldVisibilityConfig(nextConfig);
    saveLocalValue(FORM_FIELD_VISIBILITY_KEY, formFieldVisibilityConfig);
  }

  function isFormFieldVisible(fieldKey) {
    return formFieldVisibilityConfig?.[fieldKey] !== false;
  }

  function getFormFieldVisibilityLabel(key) {
    const definition = FORM_FIELD_VISIBILITY_DEFINITIONS.find((item) => item.key === key);
    if (!definition) return key;
    const translated = t(definition.labelKey);
    return translated && translated !== definition.labelKey ? translated : definition.fallbackLabel;
  }

  function resolveDefaultAssignedToValue() {
    const photographers = window.TeamManager?.loadPhotographers?.();
    if (Array.isArray(photographers) && photographers.length > 0) {
      const firstId = String(photographers[0]?.id || '').trim();
      if (firstId) return firstId;
    }
    const currentUser = window.FirebaseService?.getCurrentUser?.();
    const fallback = String(currentUser?.uid || currentUser?.email || currentUser?.displayName || 'self').trim();
    return fallback || 'self';
  }

  function applyModalFieldVisibility() {
    FORM_FIELD_VISIBILITY_DEFINITIONS.forEach((item) => {
      const visible = isFormFieldVisible(item.key);
      document.querySelectorAll(`[data-input-key="${item.key}"]`).forEach((element) => {
        element.style.display = visible ? '' : 'none';
      });
    });

    if (!isFormFieldVisible('assignedTo')) {
      const assignedToInput = document.getElementById('form-assignedTo');
      if (assignedToInput && !String(assignedToInput.value || '').trim()) {
        assignedToInput.value = resolveDefaultAssignedToValue();
      }
    }
  }

  function loadGoogleCalendarAutoSyncEnabled() {
    return getCloudValue(
      GOOGLE_CALENDAR_AUTO_SYNC_KEY,
      getLocalValue(GOOGLE_CALENDAR_AUTO_SYNC_KEY, false)
    ) === true;
  }

  function setGoogleCalendarAutoSyncEnabled(enabled) {
    googleCalendarAutoSyncEnabled = !!enabled;
    saveLocalValue(GOOGLE_CALENDAR_AUTO_SYNC_KEY, googleCalendarAutoSyncEnabled);
    saveCloudValue(GOOGLE_CALENDAR_AUTO_SYNC_KEY, googleCalendarAutoSyncEnabled);
  }

  function loadGoogleCalendarSelectedId() {
    const loaded = getCloudValue(
      GOOGLE_CALENDAR_SELECTED_ID_KEY,
      getLocalValue(GOOGLE_CALENDAR_SELECTED_ID_KEY, GOOGLE_CALENDAR_DEFAULT_ID)
    );
    const normalized = String(loaded || '').trim();
    return normalized || GOOGLE_CALENDAR_DEFAULT_ID;
  }

  function setGoogleCalendarSelectedId(calendarId) {
    const normalized = String(calendarId || '').trim() || GOOGLE_CALENDAR_DEFAULT_ID;
    googleCalendarSelectedId = normalized;
    saveLocalValue(GOOGLE_CALENDAR_SELECTED_ID_KEY, normalized);
    saveCloudValue(GOOGLE_CALENDAR_SELECTED_ID_KEY, normalized);
  }

  function getTargetGoogleCalendarId() {
    const normalized = String(googleCalendarSelectedId || '').trim();
    return normalized || GOOGLE_CALENDAR_DEFAULT_ID;
  }

  function renderGoogleCalendarSelectOptions(selectElement, calendars = []) {
    if (!selectElement) return;
    const targetId = getTargetGoogleCalendarId();
    const safeCalendars = Array.isArray(calendars) ? calendars : [];
    if (safeCalendars.length === 0) {
      selectElement.innerHTML = `<option value="${escapeHtml(targetId)}">${escapeHtml(targetId)}</option>`;
      selectElement.value = targetId;
      return;
    }

    selectElement.innerHTML = safeCalendars.map((calendar) => {
      const id = String(calendar?.id || '').trim();
      if (!id) return '';
      const summary = String(calendar?.summary || id);
      const marker = calendar?.primary ? ' ★' : '';
      return `<option value="${escapeHtml(id)}">${escapeHtml(summary + marker)}</option>`;
    }).join('');

    const hasCurrent = safeCalendars.some((calendar) => String(calendar?.id || '').trim() === targetId);
    if (hasCurrent) {
      selectElement.value = targetId;
      return;
    }
    const firstId = String(safeCalendars[0]?.id || '').trim();
    if (firstId) {
      setGoogleCalendarSelectedId(firstId);
      selectElement.value = firstId;
    }
  }

  async function fetchGoogleCalendarList(force = false) {
    const token = window.FirebaseService?.getGoogleAccessToken?.() || '';
    if (!token) {
      googleCalendarList = [];
      googleCalendarListLoaded = false;
      return [];
    }
    if (googleCalendarListLoaded && !force) return googleCalendarList;
    if (googleCalendarListPromise && !force) return googleCalendarListPromise;

    googleCalendarListPromise = (async () => {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = body?.error?.message || `HTTP ${response.status}`;
        throw new Error(message);
      }

      const items = Array.isArray(body?.items) ? body.items : [];
      const normalized = items
        .map((item) => ({
          id: String(item?.id || '').trim(),
          summary: String(item?.summary || item?.id || '').trim(),
          primary: item?.primary === true,
        }))
        .filter((item) => !!item.id)
        .sort((a, b) => {
          if (a.primary && !b.primary) return -1;
          if (!a.primary && b.primary) return 1;
          return a.summary.localeCompare(b.summary);
        });

      googleCalendarList = normalized;
      googleCalendarListLoaded = true;
      return normalized;
    })();

    try {
      return await googleCalendarListPromise;
    } finally {
      googleCalendarListPromise = null;
    }
  }

  async function refreshGoogleCalendarSelectInSettings(force = false) {
    const select = document.getElementById('settings-google-calendar-select');
    const status = document.getElementById('settings-google-calendar-status');
    const refreshBtn = document.getElementById('settings-google-calendar-refresh');
    if (!select || !status) return;

    const token = window.FirebaseService?.getGoogleAccessToken?.() || '';
    if (!token) {
      renderGoogleCalendarSelectOptions(select, []);
      status.textContent = t('settingsGoogleCalendarNeedsLogin');
      if (refreshBtn) refreshBtn.disabled = true;
      select.disabled = true;
      return;
    }

    status.textContent = t('settingsGoogleCalendarLoading');
    select.disabled = true;
    if (refreshBtn) refreshBtn.disabled = true;

    try {
      const calendars = await fetchGoogleCalendarList(force);
      renderGoogleCalendarSelectOptions(select, calendars);
      status.textContent = calendars.length > 0
        ? t('settingsGoogleCalendarLoaded', { count: String(calendars.length) })
        : t('settingsGoogleCalendarNoCalendars');
    } catch (error) {
      console.error('Failed to fetch Google Calendar list', error);
      renderGoogleCalendarSelectOptions(select, []);
      status.textContent = t('settingsGoogleCalendarLoadFailed');
    } finally {
      const selectCurrent = document.getElementById('settings-google-calendar-select');
      const refreshCurrent = document.getElementById('settings-google-calendar-refresh');
      if (selectCurrent) selectCurrent.disabled = false;
      if (refreshCurrent) refreshCurrent.disabled = false;
    }
  }

  function getLocaleForDates() {
    if (currentLang === 'fr') return 'fr-FR';
    if (currentLang === 'ja') return 'ja-JP';
    return 'en-US';
  }

  function toTitleCaseMonth(monthName) {
    if (!monthName) return '';
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  }

  function formatCalendarHeader(year, monthIndex) {
    const monthValue = String(monthIndex + 1).padStart(2, '0');
    const monthName = toTitleCaseMonth(
      new Date(year, monthIndex, 1).toLocaleString(getLocaleForDates(), { month: 'long' })
    );
    const formatted = t('calendarHeaderFormat', {
      year: String(year),
      month: monthValue,
      monthName,
    });
    if (!formatted || formatted === 'calendarHeaderFormat') {
      return `${year}/${monthValue}`;
    }
    return formatted;
  }

  // ===== Formatting =====
  function formatDate(val) {
    if (!val) return '—';
    const d = new Date(val);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatDateTime(val) {
    if (!val) return '—';
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return '—';
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  const CURRENCY_CONFIG = {
    USD: { symbol: '$', locale: 'en-US' },
    JPY: { symbol: '¥', locale: 'ja-JP' },
    EUR: { symbol: '€', locale: 'fr-FR' },
    KRW: { symbol: '₩', locale: 'ko-KR' },
    CNY: { symbol: '¥', locale: 'zh-CN' },
    TWD: { symbol: 'NT$', locale: 'zh-TW' },
  };

  let currentCurrency = getCloudValue(CURRENCY_KEY, getLocalValue(CURRENCY_KEY, 'USD'));
  if (!CURRENCY_CONFIG[currentCurrency]) currentCurrency = 'USD';

  function getCurrencySymbol() {
    return CURRENCY_CONFIG[currentCurrency].symbol;
  }

  function getCurrentCurrency() {
    return currentCurrency;
  }

  function formatCurrency(val) {
    const cfg = CURRENCY_CONFIG[currentCurrency] || CURRENCY_CONFIG.USD;
    return cfg.symbol + (Number(val) || 0).toLocaleString(cfg.locale);
  }

  function toSafeNumber(value, fallback = 0) {
    if (value === '' || value === null || value === undefined) return fallback;
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function normalizeWorkflowStatus(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'cancel' || normalized === 'canceled') return 'cancelled';
    if (normalized === 'select_waiting' || normalized === 'selection_waiting' || normalized === 'waiting_select') return 'shot';
    return WORKFLOW_STATUS_META[normalized] ? normalized : 'not_started';
  }

  function normalizeHexColor(value, fallback = '#8b5cf6') {
    const raw = String(value || '').trim();
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
      return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
    }
    return fallback.toLowerCase();
  }

  function hexToRgba(hexColor, alpha = 0.2) {
    const hex = normalizeHexColor(hexColor).replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function hashString(value) {
    let hash = 0;
    String(value || '').split('').forEach((char) => {
      hash = ((hash << 5) - hash) + char.charCodeAt(0);
      hash |= 0;
    });
    return Math.abs(hash);
  }

  function getDefaultPlanTagColor(name = '') {
    const paletteIndex = hashString(name) % DEFAULT_PLAN_TAG_COLORS.length;
    return DEFAULT_PLAN_TAG_COLORS[paletteIndex];
  }

  function normalizeStatusColorMap(source) {
    const safe = (source && typeof source === 'object') ? source : {};
    return Object.keys(WORKFLOW_STATUS_META).reduce((acc, key) => {
      acc[key] = normalizeHexColor(safe[key], DEFAULT_STATUS_COLORS[key]);
      return acc;
    }, {});
  }

  function loadStatusColorMap() {
    return normalizeStatusColorMap(
      getCloudValue(STATUS_COLOR_MAP_KEY, getLocalValue(STATUS_COLOR_MAP_KEY, DEFAULT_STATUS_COLORS))
    );
  }

  function saveStatusColorMap(nextMap) {
    statusColorMap = normalizeStatusColorMap(nextMap);
    saveLocalValue(STATUS_COLOR_MAP_KEY, statusColorMap);
    saveCloudValue(STATUS_COLOR_MAP_KEY, statusColorMap);
  }

  function getWorkflowStatusMeta(value) {
    return WORKFLOW_STATUS_META[normalizeWorkflowStatus(value)];
  }

  function getWorkflowStatusLabel(value) {
    const meta = getWorkflowStatusMeta(value);
    return t(meta?.labelKey || 'workflowNotStarted');
  }

  function getWorkflowStatusColor(status) {
    const key = normalizeWorkflowStatus(status);
    return normalizeHexColor(statusColorMap?.[key], DEFAULT_STATUS_COLORS[key]);
  }

  function renderWorkflowStatusDot(customer) {
    const statusKey = normalizeWorkflowStatus(customer?.workflowStatus);
    const statusMeta = getWorkflowStatusMeta(statusKey);
    const statusLabel = getWorkflowStatusLabel(statusKey);
    const statusColor = getWorkflowStatusColor(statusKey);
    return `<span class="workflow-dot ${statusMeta.className}" title="${escapeHtml(statusLabel)}" aria-label="${escapeHtml(statusLabel)}" style="background:${statusColor}; box-shadow:0 0 0 2px ${hexToRgba(statusColor, 0.28)};"></span>`;
  }

  function renderWorkflowStatusLegend() {
    const legendRoot = document.getElementById('workflow-status-legend');
    if (!legendRoot) return;

    const statusOrder = ['not_started', 'shot', 'retouching', 'completed', 'cancelled'];
    const itemsHtml = statusOrder
      .filter((statusKey) => !!WORKFLOW_STATUS_META[statusKey])
      .map((statusKey) => {
        const statusLabel = getWorkflowStatusLabel(statusKey);
        const statusColor = getWorkflowStatusColor(statusKey);
        return `
          <span class="workflow-legend-item" title="${escapeHtml(statusLabel)}">
            <span class="workflow-dot ${WORKFLOW_STATUS_META[statusKey].className}" style="background:${statusColor}; box-shadow:0 0 0 2px ${hexToRgba(statusColor, 0.22)};"></span>
            <span>${escapeHtml(statusLabel)}</span>
          </span>
        `;
      })
      .join('');

    legendRoot.innerHTML = `
      <span class="workflow-legend-title">${escapeHtml(t('statusLegendTitle'))}</span>
      ${itemsHtml}
    `;
  }

  function renderWorkflowStatusBadge(customer) {
    const statusKey = normalizeWorkflowStatus(customer?.workflowStatus);
    const statusMeta = getWorkflowStatusMeta(statusKey);
    const statusLabel = getWorkflowStatusLabel(statusKey);
    const statusColor = getWorkflowStatusColor(statusKey);
    return `<span class="badge badge-workflow ${statusMeta.className}" style="background:${hexToRgba(statusColor, 0.2)}; color:${statusColor}; border-color:${hexToRgba(statusColor, 0.4)};">${statusLabel}</span>`;
  }

  function resolvePlanTagColor(planName) {
    const plan = findPlanMasterByValue(planName);
    return normalizeHexColor(plan?.color, getDefaultPlanTagColor(planName));
  }

  function renderPlanBadge(planName) {
    const name = planName || '—';
    const color = resolvePlanTagColor(name);
    return `<span class="badge badge-plan" style="background:${hexToRgba(color, 0.2)}; color:${color}; border-color:${hexToRgba(color, 0.45)};">${escapeHtml(name)}</span>`;
  }

  function normalizeExtraChargeItems(items) {
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => {
        const rawName = typeof item?.name === 'string' ? item.name.trim() : '';
        const rawDetail = typeof item?.detail === 'string' ? item.detail.trim() : '';
        const name = rawName || t('dynamicItemDefaultName');
        let revenue = toSafeNumber(item?.revenue, NaN);
        let cost = toSafeNumber(item?.cost, NaN);
        const hasRevenue = Number.isFinite(revenue);
        const hasCost = Number.isFinite(cost);

        if (!hasRevenue && !hasCost) {
          const legacyAmount = toSafeNumber(item?.amount, 0);
          if (normalizeDynamicItemType(item?.type) === 'cost') {
            revenue = 0;
            cost = legacyAmount;
          } else {
            revenue = legacyAmount;
            cost = 0;
          }
        } else {
          revenue = hasRevenue ? revenue : 0;
          cost = hasCost ? cost : 0;
        }
        return {
          name,
          detail: rawDetail,
          revenue,
          cost,
        };
      })
      .filter((item) => item.name || item.detail || item.revenue !== 0 || item.cost !== 0);
  }

  function normalizeDynamicItemSuggestionMap(source) {
    if (!source || typeof source !== 'object') return {};
    const normalized = {};
    Object.entries(source).forEach(([rawKey, values]) => {
      const key = String(rawKey || '').trim().toLowerCase();
      if (!key || !Array.isArray(values)) return;
      const uniq = [];
      const seen = new Set();
      values.forEach((value) => {
        let label = '';
        let revenue = 0;
        let cost = 0;
        if (typeof value === 'string') {
          label = String(value).trim();
          const parsed = extractPriceFromText(label);
          if (extractTypeFromText(label) === 'cost') {
            cost = parsed;
          } else {
            revenue = parsed;
          }
        } else if (value && typeof value === 'object') {
          label = String(value.label ?? value.name ?? value.value ?? '').trim();
          const rawRevenue = toSafeNumber(value.revenue, NaN);
          const rawCost = toSafeNumber(value.cost, NaN);
          const hasRevenue = Number.isFinite(rawRevenue);
          const hasCost = Number.isFinite(rawCost);
          if (hasRevenue || hasCost) {
            revenue = hasRevenue ? rawRevenue : 0;
            cost = hasCost ? rawCost : 0;
          } else {
            const legacyPrice = toSafeNumber(value.price, extractPriceFromText(label));
            if (normalizeDynamicItemType(value.type) === 'cost') {
              cost = legacyPrice;
            } else {
              revenue = legacyPrice;
            }
          }
        }
        if (!label) return;
        const labelKey = label.toLowerCase();
        if (seen.has(labelKey)) return;
        seen.add(labelKey);
        uniq.push({ label, revenue: toSafeNumber(revenue, 0), cost: toSafeNumber(cost, 0) });
      });
      if (uniq.length > 0) normalized[key] = uniq.slice(0, 30);
    });
    return normalized;
  }

  function extractPriceFromText(text) {
    const value = String(text || '');
    if (!value) return 0;
    const match = value.match(/(?:¥|￥|\$|€)?\s*([0-9][0-9,\.]{0,15})\s*(?:円|JPY|USD|EUR)?/i);
    if (!match) return 0;
    const numeric = Number(String(match[1]).replace(/,/g, ''));
    return Number.isFinite(numeric) ? Math.round(numeric) : 0;
  }

  function normalizeDynamicItemType(type) {
    const normalized = String(type || '').trim().toLowerCase();
    if (normalized === 'cost' || normalized === '原価' || normalized === 'expense') return 'cost';
    return 'revenue';
  }

  function extractTypeFromText(text) {
    const value = String(text || '').toLowerCase();
    if (!value) return 'revenue';
    if (value.includes('原価') || value.includes('cost')) return 'cost';
    return 'revenue';
  }

  function isPlanCategoryName(name) {
    const normalized = String(name || '').trim().toLowerCase();
    return normalized === 'プラン' || normalized === 'plan';
  }

  function normalizeDynamicItemDetailList(values) {
    const normalizedMap = normalizeDynamicItemSuggestionMap({ temp: values });
    return Array.isArray(normalizedMap.temp) ? normalizedMap.temp : [];
  }

  function normalizeDynamicItemNameSuggestions(source) {
    const list = Array.isArray(source) ? source : [];
    const normalized = [];
    const seen = new Set();
    list.forEach((entry) => {
      const value = String(entry || '').trim();
      const key = value.toLowerCase();
      if (!value || seen.has(key)) return;
      seen.add(key);
      normalized.push(value);
    });
    return normalized.slice(0, 40);
  }

  function loadDynamicItemNameSuggestions() {
    const fallback = Array.isArray(options?.dynamicItemHints) && options.dynamicItemHints.length > 0
      ? options.dynamicItemHints
      : DEFAULT_OPTIONS.dynamicItemHints;
    return normalizeDynamicItemNameSuggestions(getLocalValue(DYNAMIC_ITEM_NAME_SUGGESTIONS_KEY, fallback));
  }

  function saveDynamicItemNameSuggestions(nextList) {
    dynamicItemNameSuggestions = normalizeDynamicItemNameSuggestions(nextList);
    saveLocalValue(DYNAMIC_ITEM_NAME_SUGGESTIONS_KEY, dynamicItemNameSuggestions);
  }

  function getDynamicItemNameSuggestions() {
    return normalizeDynamicItemNameSuggestions(dynamicItemNameSuggestions)
      .filter((name) => !isPlanCategoryName(name));
  }

  function loadDynamicItemSuggestionMap() {
    return normalizeDynamicItemSuggestionMap(getLocalValue(DYNAMIC_ITEM_SUGGESTIONS_KEY, {}));
  }

  function saveDynamicItemSuggestionMap(nextMap) {
    dynamicItemSuggestionMap = normalizeDynamicItemSuggestionMap(nextMap);
    saveLocalValue(DYNAMIC_ITEM_SUGGESTIONS_KEY, dynamicItemSuggestionMap);
  }

  function getDynamicItemSuggestionKey(name) {
    return String(name || '').trim().toLowerCase();
  }

  function getDynamicItemDetailEntries(name) {
    const key = getDynamicItemSuggestionKey(name);
    if (!key) return [];
    const entries = dynamicItemSuggestionMap[key];
    return Array.isArray(entries) ? entries : [];
  }

  function getDynamicItemDetailSuggestions(name) {
    return getDynamicItemDetailEntries(name).map((entry) => String(entry?.label || '').trim()).filter(Boolean);
  }

  function getDynamicItemDetailEntry(name, label) {
    const target = String(label || '').trim();
    if (!target) return null;
    const targetKey = target.toLowerCase();
    const entries = getDynamicItemDetailEntries(name);
    return entries.find((entry) => String(entry?.label || '').trim().toLowerCase() === targetKey) || null;
  }

  function rememberDynamicItemDetails(items = []) {
    if (!Array.isArray(items) || items.length === 0) return;
    const nextNameSuggestions = getDynamicItemNameSuggestions();
    let nameUpdated = false;
    const nextMap = normalizeDynamicItemSuggestionMap(dynamicItemSuggestionMap);
    let updated = false;

    items.forEach((item) => {
      const itemName = String(item?.name || '').trim();
      const key = getDynamicItemSuggestionKey(itemName);
      const detail = String(item?.detail || '').trim();
      if (itemName) {
        const existingIdx = nextNameSuggestions.findIndex((name) => name.toLowerCase() === itemName.toLowerCase());
        if (existingIdx === -1) {
          nextNameSuggestions.unshift(itemName);
          nameUpdated = true;
        }
      }
      if (!key || !detail) return;
      const bucket = Array.isArray(nextMap[key]) ? [...nextMap[key]] : [];
      const detailKey = detail.toLowerCase();
      const foundIndex = bucket.findIndex((entry) => String(entry?.label || '').trim().toLowerCase() === detailKey);
      const nextRevenue = toSafeNumber(item?.revenue, 0);
      const nextCost = toSafeNumber(item?.cost, 0);
      if (foundIndex !== -1) {
        const currentRevenue = toSafeNumber(bucket[foundIndex]?.revenue, 0);
        const currentCost = toSafeNumber(bucket[foundIndex]?.cost, 0);
        if (nextRevenue !== currentRevenue) {
          bucket[foundIndex] = { ...bucket[foundIndex], revenue: nextRevenue };
          updated = true;
        }
        if (nextCost !== currentCost) {
          bucket[foundIndex] = { ...bucket[foundIndex], cost: nextCost };
          updated = true;
        }
        return;
      }
      bucket.unshift({ label: detail, revenue: nextRevenue, cost: nextCost });
      nextMap[key] = normalizeDynamicItemDetailList(bucket);
      updated = true;
    });

    if (nameUpdated) saveDynamicItemNameSuggestions(nextNameSuggestions);
    if (updated) saveDynamicItemSuggestionMap(nextMap);
  }

  function normalizePlanDetails(planDetails, fallbackRevenue = 0) {
    const safe = (planDetails && typeof planDetails === 'object') ? planDetails : {};
    const basePrice = toSafeNumber(safe.basePrice, 0);
    const planCost = toSafeNumber(safe.planCost, toSafeNumber(safe.baseCost, 0));
    const fallbackTotal = toSafeNumber(fallbackRevenue, basePrice);
    const totalPrice = toSafeNumber(safe.totalPrice, fallbackTotal);

    return {
      planName: typeof safe.planName === 'string' ? safe.planName : '',
      basePrice,
      planCost,
      options: typeof safe.options === 'string' ? safe.options : '',
      totalPrice,
    };
  }

  function resolveCustomerPlanName(customer) {
    const match = findPlanMasterByValue(customer?.planMasterId || customer?.plan || '');
    if (match?.name) return String(match.name).trim();
    return typeof customer?.plan === 'string' ? customer.plan.trim() : '';
  }

  let dynamicItemRowSeed = 0;

  function renderDynamicItemNameDatalist(row) {
    if (!row) return;
    const datalist = row.querySelector('.dynamic-item-name-options');
    if (!datalist) return;
    const suggestions = getDynamicItemNameSuggestions();
    datalist.innerHTML = suggestions
      .map((value) => `<option value="${escapeHtml(value)}"></option>`)
      .join('');
  }

  function getDynamicItemCategoryValue(row) {
    if (!row) return '';
    const nameInput = row.querySelector('.dynamic-item-name');
    if (!nameInput) return '';
    return String(nameInput.value || '').trim();
  }

  function getDynamicItemDetailValue(row) {
    if (!row) return '';
    const detailSelect = row.querySelector('.dynamic-item-detail-select');
    const detailCustom = row.querySelector('.dynamic-item-detail-custom');
    if (detailSelect) {
      if (detailSelect.value === '__other__') return String(detailCustom?.value || '').trim();
      return String(detailSelect.value || '').trim();
    }
    const detailInput = row.querySelector('.dynamic-item-detail');
    return String(detailInput?.value || '').trim();
  }

  function getDynamicItemRevenueValue(row) {
    if (!row) return 0;
    const revenueInput = row.querySelector('.dynamic-item-revenue');
    return toSafeNumber(revenueInput?.value, 0);
  }

  function setDynamicItemRevenueValue(row, value) {
    if (!row) return;
    const revenueInput = row.querySelector('.dynamic-item-revenue');
    if (!revenueInput) return;
    revenueInput.value = String(toSafeNumber(value, 0));
  }

  function getDynamicItemCostValue(row) {
    if (!row) return 0;
    const costInput = row.querySelector('.dynamic-item-cost');
    return toSafeNumber(costInput?.value, 0);
  }

  function setDynamicItemCostValue(row, value) {
    if (!row) return;
    const costInput = row.querySelector('.dynamic-item-cost');
    if (!costInput) return;
    costInput.value = String(toSafeNumber(value, 0));
  }

  function applyDynamicItemPriceFromSelection(row) {
    if (!row) return;
    const detailSelect = row.querySelector('.dynamic-item-detail-select');
    if (!detailSelect) return;
    if (!detailSelect.value || detailSelect.value === '__other__') return;
    const category = getDynamicItemCategoryValue(row);
    const selected = getDynamicItemDetailEntry(category, detailSelect.value);
    const optionLabel = String(detailSelect.value || '').trim();
    const selectedRevenue = toSafeNumber(selected?.revenue, NaN);
    const selectedCost = toSafeNumber(selected?.cost, NaN);
    const hasSelectedRevenue = Number.isFinite(selectedRevenue);
    const hasSelectedCost = Number.isFinite(selectedCost);

    if (hasSelectedRevenue || hasSelectedCost) {
      setDynamicItemRevenueValue(row, hasSelectedRevenue ? selectedRevenue : 0);
      setDynamicItemCostValue(row, hasSelectedCost ? selectedCost : 0);
      return;
    }

    const optionText = String(detailSelect.options?.[detailSelect.selectedIndex]?.textContent || optionLabel).trim();
    const legacyPrice = extractPriceFromText(optionLabel) || extractPriceFromText(optionText);
    if (normalizeDynamicItemType(selected?.type || extractTypeFromText(`${optionLabel} ${optionText}`)) === 'cost') {
      setDynamicItemRevenueValue(row, 0);
      setDynamicItemCostValue(row, legacyPrice);
      return;
    }
    setDynamicItemRevenueValue(row, legacyPrice);
    setDynamicItemCostValue(row, 0);
  }

  function setDynamicItemCustomDetailVisible(row, visible) {
    const detailCustom = row?.querySelector('.dynamic-item-detail-custom');
    if (!detailCustom) return;
    detailCustom.classList.toggle('hidden', !visible);
    if (visible) {
      detailCustom.removeAttribute('disabled');
    } else {
      detailCustom.setAttribute('disabled', 'disabled');
      detailCustom.value = '';
    }
  }

  function renderDynamicItemDetailDatalist(row) {
    if (!row) return;
    const detailSelect = row.querySelector('.dynamic-item-detail-select');
    if (!detailSelect) return;

    const defaultLabel = t('selectDefault');
    const otherLabel = t('dynamicItemOtherManual');

    const currentDetail = detailSelect.dataset.currentDetail !== undefined
      ? String(detailSelect.dataset.currentDetail || '').trim()
      : getDynamicItemDetailValue(row);
    delete detailSelect.dataset.currentDetail;

    const category = getDynamicItemCategoryValue(row);
    const options = getDynamicItemDetailEntries(category);
    detailSelect.innerHTML = [
      `<option value="">${escapeHtml(defaultLabel)}</option>`,
      ...options.map((entry) => {
        const label = String(entry?.label || '').trim();
        const revenue = toSafeNumber(entry?.revenue, 0);
        const cost = toSafeNumber(entry?.cost, 0);
        const metaParts = [];
        if (revenue > 0) metaParts.push(t('dynamicItemMetaRevenue', { amount: formatCurrency(revenue) }));
        if (cost > 0) metaParts.push(t('dynamicItemMetaCost', { amount: formatCurrency(cost) }));
        const caption = metaParts.length > 0 ? `${label} (${metaParts.join(' / ')})` : label;
        return `<option value="${escapeHtml(label)}">${escapeHtml(caption)}</option>`;
      }),
      `<option value="__other__">${escapeHtml(otherLabel)}</option>`,
    ].join('');

    const hasCurrent = currentDetail && options.some((entry) => String(entry?.label || '').trim() === currentDetail);
    if (hasCurrent) {
      detailSelect.value = currentDetail;
      setDynamicItemCustomDetailVisible(row, false);
      return;
    }

    if (currentDetail) {
      detailSelect.value = '__other__';
      setDynamicItemCustomDetailVisible(row, true);
      const detailCustom = row.querySelector('.dynamic-item-detail-custom');
      if (detailCustom) detailCustom.value = currentDetail;
      return;
    }

    detailSelect.value = '';
    setDynamicItemCustomDetailVisible(row, false);
  }

  function getDynamicItemRows() {
    return Array.from(document.querySelectorAll('#dynamic-items-container .dynamic-item-row'));
  }

  function getConfiguredDynamicItemNames() {
    return getDynamicItemNameSuggestions();
  }

  function mergeDynamicItemsWithConfigured(items = []) {
    const normalized = normalizeExtraChargeItems(items).map((item) => ({
      ...item,
      settingItem: item?.settingItem === true,
      lockedCategory: item?.lockedCategory === true,
    })).filter((item) => !isPlanCategoryName(item.name));
    const configuredNames = getConfiguredDynamicItemNames();
    if (configuredNames.length === 0) return normalized;

    const usedIndexes = new Set();
    const merged = configuredNames.map((configuredName) => {
      const matchIndex = normalized.findIndex((item, index) => {
        if (usedIndexes.has(index)) return false;
        return String(item.name || '').trim().toLowerCase() === configuredName.toLowerCase();
      });

      if (matchIndex !== -1) {
        usedIndexes.add(matchIndex);
        return {
          ...normalized[matchIndex],
          name: configuredName,
          settingItem: true,
          lockedCategory: true,
        };
      }

      return {
        name: configuredName,
        detail: '',
        revenue: 0,
        cost: 0,
        settingItem: true,
        lockedCategory: true,
      };
    });

    normalized.forEach((item, index) => {
      if (usedIndexes.has(index)) return;
      if (item.settingItem) return;
      merged.push(item);
    });

    return merged;
  }

  function getCurrentExtraChargeBreakdown() {
    return getDynamicItemRows().reduce((sum, row) => {
      sum.revenue += getDynamicItemRevenueValue(row);
      sum.cost += getDynamicItemCostValue(row);
      return sum;
    }, { revenue: 0, cost: 0 });
  }

  function collectDynamicChargeItems(includeMeta = false) {
    const collected = getDynamicItemRows()
      .map((row) => {
        return {
          name: getDynamicItemCategoryValue(row),
          detail: getDynamicItemDetailValue(row),
          revenue: getDynamicItemRevenueValue(row),
          cost: getDynamicItemCostValue(row),
          settingItem: row.dataset.settingItem === 'true',
          lockedCategory: row.dataset.lockedCategory === 'true',
        };
      })
      .filter((item) => {
        if (item.settingItem) {
          return !!item.detail || item.revenue !== 0 || item.cost !== 0;
        }
        return item.name || item.detail || item.revenue !== 0 || item.cost !== 0;
      })
      .map((item) => ({
        name: item.name || t('dynamicItemDefaultName'),
        detail: item.detail,
        revenue: toSafeNumber(item.revenue, 0),
        cost: toSafeNumber(item.cost, 0),
        settingItem: item.settingItem,
        lockedCategory: item.lockedCategory,
      }));

    if (includeMeta) return collected;
    return collected.map((item) => ({
      name: item.name,
      detail: item.detail,
      revenue: toSafeNumber(item.revenue, 0),
      cost: toSafeNumber(item.cost, 0),
    }));
  }

  function createDynamicItemRow(item = {}) {
    dynamicItemRowSeed += 1;
    const nameDatalistId = `dynamic-item-name-options-${Date.now()}-${dynamicItemRowSeed}`;
    const normalizedName = String(item?.name || '').trim();
    const isSettingItem = item?.settingItem === true;
    const isLockedCategory = item?.lockedCategory === true || isSettingItem;
    const normalizedRevenue = toSafeNumber(item?.revenue, 0);
    const normalizedCost = toSafeNumber(item?.cost, 0);
    const row = document.createElement('div');
    row.className = 'dynamic-item-row';
    if (item?.planLinked) row.dataset.planLinked = 'true';
    row.dataset.settingItem = isSettingItem ? 'true' : 'false';
    row.dataset.lockedCategory = isLockedCategory ? 'true' : 'false';
    row.innerHTML = `
      <div class="dynamic-item-field dynamic-item-category-field">
        <label class="dynamic-item-inline-label">${escapeHtml(t('dynamicItemCategory'))}</label>
        ${isLockedCategory
        ? `<span class="dynamic-item-category-label">${escapeHtml(normalizedName || t('dynamicItemDefaultName'))}</span>
             <input type="hidden" class="dynamic-item-name" value="${escapeHtml(normalizedName || t('dynamicItemDefaultName'))}" />`
        : `<input type="text" class="dynamic-item-name" list="${nameDatalistId}" placeholder="${escapeHtml(t('dynamicItemCategoryPlaceholder'))}" value="${escapeHtml(normalizedName)}" />`
      }
      </div>
      <datalist id="${nameDatalistId}" class="dynamic-item-name-options"></datalist>
      <div class="dynamic-item-field dynamic-item-detail-field">
        <label class="dynamic-item-inline-label">${escapeHtml(t('dynamicItemDetail'))}</label>
        <select class="dynamic-item-detail-select" data-current-detail="${escapeHtml(item.detail || '')}"></select>
        <input type="text" class="dynamic-item-detail-custom hidden" placeholder="${escapeHtml(t('dynamicItemDetailPlaceholder'))}" disabled />
      </div>
      <div class="dynamic-item-field dynamic-item-revenue-field">
        <label class="dynamic-item-inline-label">${escapeHtml(t('dynamicItemRevenue'))}</label>
        <input type="number" class="dynamic-item-revenue" min="0" step="1" value="${normalizedRevenue}" />
      </div>
      <div class="dynamic-item-field dynamic-item-cost-field">
        <label class="dynamic-item-inline-label">${escapeHtml(t('dynamicItemCost'))}</label>
        <input type="number" class="dynamic-item-cost" min="0" step="1" value="${normalizedCost}" />
      </div>
      <button type="button" class="btn btn-secondary dynamic-item-remove" aria-label="${escapeHtml(t('dynamicItemRemove'))}" title="${escapeHtml(isSettingItem ? t('dynamicItemManageInSettings') : t('dynamicItemRemove'))}" ${isSettingItem ? 'disabled' : ''}>🗑</button>
    `;

    const nameInput = row.querySelector('.dynamic-item-name');
    const detailSelect = row.querySelector('.dynamic-item-detail-select');
    const detailCustomInput = row.querySelector('.dynamic-item-detail-custom');
    const revenueInput = row.querySelector('.dynamic-item-revenue');
    const costInput = row.querySelector('.dynamic-item-cost');
    const removeButton = row.querySelector('.dynamic-item-remove');

    if (nameInput && nameInput.type !== 'hidden') {
      bindEventOnce(nameInput, 'input', () => {
        renderDynamicItemNameDatalist(row);
        renderDynamicItemDetailDatalist(row);
        updateGrandTotal();
      }, `dynamic-item-name-${Date.now()}-${Math.random()}`);
    }

    bindEventOnce(detailSelect, 'change', () => {
      const isOther = detailSelect?.value === '__other__';
      setDynamicItemCustomDetailVisible(row, isOther);
      if (!isOther) applyDynamicItemPriceFromSelection(row);
      updateGrandTotal();
    }, `dynamic-item-detail-select-${Date.now()}-${Math.random()}`);
    bindEventOnce(detailCustomInput, 'input', updateGrandTotal, `dynamic-item-detail-custom-${Date.now()}-${Math.random()}`);
    bindEventOnce(revenueInput, 'input', updateGrandTotal, `dynamic-item-revenue-${Date.now()}-${Math.random()}`);
    bindEventOnce(costInput, 'input', updateGrandTotal, `dynamic-item-cost-${Date.now()}-${Math.random()}`);
    bindEventOnce(removeButton, 'click', () => {
      row.remove();
      updateGrandTotal();
    }, `dynamic-item-remove-${Date.now()}-${Math.random()}`);

    renderDynamicItemNameDatalist(row);
    renderDynamicItemDetailDatalist(row);
    return row;
  }

  function renderDynamicChargeItems(items = []) {
    const container = $('#dynamic-items-container');
    if (!container) return;
    container.innerHTML = '';

    mergeDynamicItemsWithConfigured(items).forEach((item) => {
      container.appendChild(createDynamicItemRow(item));
    });

    updateGrandTotal();
  }

  function syncDynamicItemRowsWithSettings() {
    const container = $('#dynamic-items-container');
    const modal = document.getElementById('modal-overlay');
    if (!container || !modal || modal.style.display !== 'flex') return;
    const currentItems = collectDynamicChargeItems(true);
    renderDynamicChargeItems(currentItems);
  }

  function addDynamicChargeItem(item = {}) {
    const container = $('#dynamic-items-container');
    if (!container) return;
    container.appendChild(createDynamicItemRow({
      ...item,
      settingItem: item?.settingItem === true,
      lockedCategory: item?.lockedCategory === true,
    }));
    updateGrandTotal();
  }

  function getPlanPriceInput() {
    return $('#form-plan-price');
  }

  function getPlanCostInput() {
    return $('#form-plan-cost');
  }

  function setPlanBasePriceValue(value) {
    const numericValue = toSafeNumber(value, 0);
    const basePriceInput = $('#form-base-price');
    const planPriceInput = getPlanPriceInput();
    if (basePriceInput) basePriceInput.value = String(numericValue);
    if (planPriceInput) planPriceInput.value = String(numericValue);
  }

  function getPlanBasePriceValue() {
    const planPriceInput = getPlanPriceInput();
    const basePriceInput = $('#form-base-price');
    if (planPriceInput) return toSafeNumber(planPriceInput.value, toSafeNumber(basePriceInput?.value, 0));
    return toSafeNumber(basePriceInput?.value, 0);
  }

  function setPlanBaseCostValue(value) {
    const numericValue = toSafeNumber(value, 0);
    const planCostInput = getPlanCostInput();
    if (planCostInput) planCostInput.value = String(numericValue);
  }

  function getPlanBaseCostValue() {
    const planCostInput = getPlanCostInput();
    return toSafeNumber(planCostInput?.value, 0);
  }

  function getCurrentPricingTotals() {
    const planRevenue = getPlanBasePriceValue();
    const planCost = getPlanBaseCostValue();
    const breakdown = getCurrentExtraChargeBreakdown();
    const revenueTotal = planRevenue + breakdown.revenue;
    const estimatedExpense = planCost + breakdown.cost;
    const expenseInput = $('#form-expense');
    if (expenseInput && !isExpenseManuallyEdited) {
      expenseInput.value = String(estimatedExpense);
    }
    const expenseTotal = expenseInput
      ? toSafeNumber(expenseInput.value, estimatedExpense)
      : estimatedExpense;
    const profitTotal = revenueTotal - expenseTotal;
    return {
      planRevenue,
      planCost,
      extraRevenue: breakdown.revenue,
      extraCost: breakdown.cost,
      estimatedExpense,
      expenseTotal,
      revenueTotal,
      profitTotal,
    };
  }

  function updateProfitDisplay(value) {
    const profitInput = $('#form-profit');
    if (!profitInput) return;
    const profit = toSafeNumber(value, 0);
    profitInput.value = String(profit);
    profitInput.classList.remove('profit-positive', 'profit-negative', 'profit-neutral');
    if (profit > 0) profitInput.classList.add('profit-positive');
    else if (profit < 0) profitInput.classList.add('profit-negative');
    else profitInput.classList.add('profit-neutral');
  }

  function updateGrandTotal() {
    const totalPriceInput = $('#form-total-price');
    const revenueInput = $('#form-revenue');
    const adjustmentInput = $('#form-price-adjustment');
    const totals = getCurrentPricingTotals();

    if (adjustmentInput) adjustmentInput.value = '0';
    if (totalPriceInput) totalPriceInput.value = String(totals.revenueTotal);
    if (revenueInput) revenueInput.value = String(totals.revenueTotal);
    updateProfitDisplay(totals.profitTotal);
    return totals.revenueTotal;
  }

  function handlePlanPriceInputChange(event) {
    const next = toSafeNumber(event?.target?.value, 0);
    const basePriceInput = $('#form-base-price');
    if (basePriceInput) basePriceInput.value = String(next);
    updateGrandTotal();
  }

  function handleBasePriceInputChange(event) {
    const next = toSafeNumber(event?.target?.value, 0);
    const planPriceInput = getPlanPriceInput();
    if (planPriceInput) planPriceInput.value = String(next);
    updateGrandTotal();
  }

  function handlePlanCostInputChange() {
    if (!isExpenseManuallyEdited) {
      const expenseInput = $('#form-expense');
      if (expenseInput) expenseInput.value = '';
    }
    updateGrandTotal();
  }

  function syncAdjustmentFromRevenueInput() {
    // Revenue is now derived from plan + revenue-type option items.
    updateGrandTotal();
  }

  function handleExpenseInputChange() {
    isExpenseManuallyEdited = true;
    updateGrandTotal();
  }

  function syncAdjustmentFromTotalInput() {
    // Total is synchronized with revenue and computed automatically.
    updateGrandTotal();
  }

  function handlePlanSelectChange(event) {
    const selectedValue = event?.target?.value || '';
    const selectedPlan = findPlanMasterByValue(selectedValue);
    const planNameInput = $('#form-plan-name');
    const adjustmentInput = $('#form-price-adjustment');
    const expenseInput = $('#form-expense');

    if (!selectedPlan) {
      if (planNameInput) planNameInput.value = '';
      if (adjustmentInput) adjustmentInput.value = '0';
      if (expenseInput) expenseInput.value = '';
      isExpenseManuallyEdited = false;
      setPlanBasePriceValue(0);
      setPlanBaseCostValue(0);
      updateGrandTotal();
      return;
    }

    if (planNameInput) planNameInput.value = selectedPlan.name;
    setPlanBasePriceValue(selectedPlan.price);
    setPlanBaseCostValue(selectedPlan.cost);
    if (adjustmentInput) adjustmentInput.value = '0';
    if (expenseInput) expenseInput.value = '';
    isExpenseManuallyEdited = false;
    updateGrandTotal();
  }

  function updateCurrency(currency) {
    if (!CURRENCY_CONFIG[currency]) return;
    currentCurrency = currency;
    saveLocalValue(CURRENCY_KEY, currency);
    saveCloudValue(CURRENCY_KEY, currency);
    getHeaderCurrencySelectElements().forEach((sel) => {
      sel.value = currency;
    });

    renderTable();
    updateDashboard();
    renderExpenses();
    if (settingsOverlay?.classList.contains('active')) {
      renderSettings();
      renderPlanManagementSection();
    }
    if (editingId) openDetail(editingId);
  }

  window.getCurrencySymbol = getCurrencySymbol;
  window.getCurrentCurrency = getCurrentCurrency;
  window.formatCurrency = formatCurrency;
  window.updateCurrency = updateCurrency;
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
  // ===== Financial Helpers =====
  function getTaxSettings() {
    const defaults = {
      enabled: true,
      rate: 10,
      label: 'Tax',
      included: false,
      companyName: '',
      address: '',
      email: '',
      phone: '',
      bank: '',
      invoiceTemplate: 'modern',
      invoiceFooterMessage: getDefaultInvoiceMessage(),
      invoiceLogoDataUrl: '',
      invoiceStampDataUrl: '',
      invoiceRegionCode: '',
      legalFieldValues: {},
    };

    return { ...defaults, ...(getCloudValue(TAX_SETTINGS_KEY, {}) || {}) };
  }

  function saveTaxSettings(settings) {
    saveCloudValue(TAX_SETTINGS_KEY, settings);
  }

  function getInvoiceSenderProfile() {
    try {
      return getCloudValue(INVOICE_SENDER_PROFILE_KEY, { name: '', contact: '' });
    } catch {
      return { name: '', contact: '' };
    }
  }

  function saveInvoiceSenderProfile(profile) {
    saveCloudValue(INVOICE_SENDER_PROFILE_KEY, {
      name: (profile?.name || '').trim(),
      contact: (profile?.contact || '').trim(),
    });
  }

  function getBillingProfileDefaults() {
    return {
      fullName: '',
      address: '',
      siretNumber: '',
      invoiceRegistrationNumber: '',
      email: '',
    };
  }

  function getBillingProfile() {
    const defaults = getBillingProfileDefaults();
    const saved = getCloudValue(USER_BILLING_PROFILE_KEY, {});
    if (!saved || typeof saved !== 'object') return defaults;
    return { ...defaults, ...saved };
  }

  function saveBillingProfile(profile) {
    const defaults = getBillingProfileDefaults();
    const sanitized = {
      ...defaults,
      ...(profile && typeof profile === 'object' ? profile : {}),
    };
    saveCloudValue(USER_BILLING_PROFILE_KEY, {
      fullName: String(sanitized.fullName || '').trim(),
      address: String(sanitized.address || '').trim(),
      siretNumber: String(sanitized.siretNumber || '').trim(),
      invoiceRegistrationNumber: String(sanitized.invoiceRegistrationNumber || '').trim(),
      email: String(sanitized.email || '').trim(),
    });
  }

  function buildExportSnapshot(backupType = 'manual') {
    return {
      customers,
      options,
      planMaster,
      dashboardConfig,
      listColumnConfig,
      statusColorMap,
      heroMetricsConfig,
      heroMetricsVisible,
      googleCalendarAutoSyncEnabled,
      googleCalendarSelectedId: getTargetGoogleCalendarId(),
      contractTemplateText,
      dynamicItemNameSuggestions: getDynamicItemNameSuggestions(),
      dynamicItemSuggestionMap: normalizeDynamicItemSuggestionMap(dynamicItemSuggestionMap),
      expenses: getExpenses(),
      taxSettings: getTaxSettings(),
      invoiceSenderProfile: getInvoiceSenderProfile(),
      billingProfile: getBillingProfile(),
      studioName: currentStudioName,
      theme: currentTheme,
      accentColor: currentAccentColor,
      language: currentLang,
      currency: currentCurrency,
      exportedAt: new Date().toISOString(),
      backupType,
    };
  }

  function downloadJsonFile(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  window.getTaxSettings = getTaxSettings; // Make global for generator

  function calculateTax(amount) {
    const settings = getTaxSettings();
    const num = Number(amount) || 0;
    if (!settings.enabled) return { subtotal: num, tax: 0, total: num };

    if (settings.included) {
      const subtotal = num / (1 + settings.rate / 100);
      const tax = num - subtotal;
      return { subtotal, tax, total: num };
    } else {
      const tax = num * (settings.rate / 100);
      const total = num + tax;
      return { subtotal: num, tax, total };
    }
  }

  window.calculateTax = calculateTax;

  function normalizeAccentColor(value) {
    const raw = String(value || '').trim();
    if (!raw) return DEFAULT_ACCENT_COLOR;
    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
    const hex = normalized.toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
    if (/^#[0-9a-f]{3}$/.test(hex)) {
      const [r, g, b] = hex.slice(1).split('');
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    return DEFAULT_ACCENT_COLOR;
  }

  function hexToRgb(hex) {
    const normalized = normalizeAccentColor(hex).slice(1);
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
    };
  }

  function channelToHex(value) {
    const clamped = Math.max(0, Math.min(255, Math.round(value)));
    return clamped.toString(16).padStart(2, '0');
  }

  function adjustColor(hex, ratio = 0) {
    const { r, g, b } = hexToRgb(hex);
    const next = (channel) => {
      if (ratio >= 0) return channel + (255 - channel) * ratio;
      return channel * (1 + ratio);
    };
    return `#${channelToHex(next(r))}${channelToHex(next(g))}${channelToHex(next(b))}`;
  }

  function getAccentPalette(accentHex) {
    const normalized = normalizeAccentColor(accentHex);
    const rgb = hexToRgb(normalized);
    return {
      accent: normalized,
      accentHover: adjustColor(normalized, 0.18),
      accentGlow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`,
    };
  }

  function applyAccentColor(color, options = {}) {
    const { persist = true } = options;
    const palette = getAccentPalette(color);
    currentAccentColor = palette.accent;

    const root = document.documentElement;
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--accent-hover', palette.accentHover);
    root.style.setProperty('--accent-glow', palette.accentGlow);
    root.style.setProperty('--primary', palette.accent);
    root.style.setProperty('--primary-light', palette.accentGlow);

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', palette.accent);

    saveLocalValue(ACCENT_COLOR_KEY, palette.accent);
    if (persist) saveCloudValue(ACCENT_COLOR_KEY, palette.accent);
  }
  window.applyAccentColor = applyAccentColor;

  // ===== Theme Management =====
  let currentTheme = FORCE_DARK_MODE
    ? 'dark'
    : getCloudValue(THEME_KEY, getLocalValue(THEME_KEY, 'dark'));

  function applyTheme(theme) {
    if (FORCE_DARK_MODE) theme = 'dark';
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    saveLocalValue(THEME_KEY, theme);
    saveCloudValue(THEME_KEY, theme);

    // Update theme button icon
    const themeBtn = document.getElementById('btn-theme');
    if (themeBtn) {
      themeBtn.textContent = theme === 'dark' ? '🌙' : '☀️';
      themeBtn.title = theme === 'dark' ? t('themeSwitchToLight') : t('themeSwitchToDark');
      themeBtn.setAttribute('aria-label', themeBtn.title);
    }
  }
  window.applyTheme = applyTheme;

  function toggleTheme() {
    if (FORCE_DARK_MODE) {
      applyTheme('dark');
      return;
    }
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  }
  window.toggleTheme = toggleTheme;

  function updateToggleButtonText(buttonId, text, title, expanded = null) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    button.textContent = text;
    button.title = title;
    button.setAttribute('aria-label', title);
    if (expanded !== null) {
      button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
  }

  function updateHeroStatsToggleButtonLabel() {
    const label = `📊 ${t('statsButton')}`;
    const title = t('statsMenuTitle');
    updateToggleButtonText('btn-toggle-dashboard', label, title, isDashboardQuickMenuOpen);
  }

  function setHeroMetricsVisibility(isVisible) {
    const nextVisible = !!isVisible;
    heroMetricsConfig = normalizeHeroMetricsConfig(heroMetricsConfig).map((item) => ({
      ...item,
      visible: nextVisible,
    }));
    saveHeroMetricsConfig(heroMetricsConfig);
    applyHeroMetricsConfig();
  }

  function applyHeroMetricsConfig() {
    const panel = document.querySelector('.dashboard-hero-metrics');
    if (!panel) return;

    const cards = Array.from(panel.querySelectorAll('.hero-metric-card[data-hero-metric-key]'));
    const cardMap = new Map(cards.map((card) => [card.dataset.heroMetricKey, card]));
    let visibleCount = 0;

    normalizeHeroMetricsConfig(heroMetricsConfig).forEach((item) => {
      const card = cardMap.get(item.key);
      if (!card) return;
      const isVisible = item.visible !== false;
      card.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount += 1;
    });

    heroMetricsVisible = visibleCount > 0;
    panel.classList.toggle('is-hidden', !heroMetricsVisible);
    saveLocalValue(HERO_METRICS_VISIBLE_KEY, heroMetricsVisible);
    saveCloudValue(HERO_METRICS_VISIBLE_KEY, heroMetricsVisible);
    updateHeroStatsToggleButtonLabel();
  }

  function updateHeroMetricVisibility(itemKey, visible) {
    heroMetricsConfig = normalizeHeroMetricsConfig(heroMetricsConfig).map((item) => (
      item.key === itemKey ? { ...item, visible: !!visible } : item
    ));
    saveHeroMetricsConfig(heroMetricsConfig);
    applyHeroMetricsConfig();
    renderDashboardQuickMenu();
  }

  function setDashboardVisibility(isVisible) {
    const nextVisible = !!isVisible;
    const visibilityChanged = dashboardVisible !== nextVisible;
    dashboardVisible = nextVisible;
    const collapsible = document.getElementById('dashboard-collapsible');

    if (collapsible) {
      collapsible.classList.toggle('is-collapsed', !dashboardVisible);
    }

    saveLocalValue(DASHBOARD_VISIBILITY_KEY, dashboardVisible);
    if (visibilityChanged) {
      saveCloudValue(DASHBOARD_VISIBILITY_KEY, dashboardVisible);
    }
    if (dashboardVisible && revenueProfitChartInstance) {
      requestAnimationFrame(() => {
        revenueProfitChartInstance.resize();
        revenueProfitChartInstance.update('none');
        if (requestTrendChartInstance) {
          requestTrendChartInstance.resize();
          requestTrendChartInstance.update('none');
        }
      });
    }
    renderDashboardQuickMenu();
  }

  function updateGraphToggleButtonLabel() {
    const label = isGraphVisible ? `📈 ${t('graphToggleOn')}` : `📈 ${t('graphToggleOff')}`;
    const title = isGraphVisible ? t('graphToggleHide') : t('graphToggleShow');
    updateToggleButtonText('btn-toggle-graph', label, title, isGraphVisible);
  }

  function setGraphVisibility(isVisible, shouldRender = true) {
    const graphContainer = document.getElementById('graph-container');
    isGraphVisible = !!isVisible;
    updateGraphToggleButtonLabel();
    if (!graphContainer) return;

    if (graphHideTimer) {
      clearTimeout(graphHideTimer);
      graphHideTimer = null;
    }

    if (isGraphVisible) {
      graphContainer.style.display = 'block';
      requestAnimationFrame(() => {
        graphContainer.classList.add('is-visible');
      });
      if (shouldRender) {
        renderRevenueChart(selectedDashboardMonth.getFullYear());
        renderRequestTrendChart(selectedDashboardMonth.getFullYear());
      }
      if (revenueProfitChartInstance) {
        requestAnimationFrame(() => {
          revenueProfitChartInstance.resize();
          revenueProfitChartInstance.update('none');
          if (requestTrendChartInstance) {
            requestTrendChartInstance.resize();
            requestTrendChartInstance.update('none');
          }
        });
      }
      return;
    }

    graphContainer.classList.remove('is-visible');
    graphHideTimer = setTimeout(() => {
      if (isGraphVisible) return;
      graphContainer.style.display = 'none';
    }, 220);
  }

  function renderDashboardQuickMenu() {
    const menuContent = document.getElementById('dashboard-quick-menu-content');
    if (!menuContent) return;

    const rows = [];
    rows.push(`
      <label class="dashboard-quick-item dashboard-quick-item-main">
        <input type="checkbox" id="dashboard-quick-visible" ${dashboardVisible ? 'checked' : ''}>
        <span>${escapeHtml(t('dashboardQuickShowArea'))}</span>
      </label>
      <div class="dashboard-quick-divider"></div>
    `);

    rows.push(`
      <div class="dashboard-quick-item-main">${escapeHtml(t('quickMenuHeroMetrics'))}</div>
    `);
    normalizeHeroMetricsConfig(heroMetricsConfig).forEach((item) => {
      rows.push(`
        <label class="dashboard-quick-item">
          <input type="checkbox" data-hero-metric-key="${item.key}" ${item.visible ? 'checked' : ''}>
          <span>${escapeHtml(getHeroMetricLabel(item.key))}</span>
        </label>
      `);
    });
    rows.push(`<div class="dashboard-quick-divider"></div>`);

    rows.push(`
      <div class="dashboard-quick-item-main">${escapeHtml(t('quickMenuDashboardCards'))}</div>
    `);

    dashboardConfig.forEach((item) => {
      rows.push(`
        <label class="dashboard-quick-item">
          <input type="checkbox" data-dashboard-key="${item.key}" ${item.visible ? 'checked' : ''}>
          <span>${escapeHtml(getDashboardCardLabel(item.key))}</span>
        </label>
      `);
    });

    menuContent.innerHTML = rows.join('');

    const visibleInput = menuContent.querySelector('#dashboard-quick-visible');
    bindEventOnce(visibleInput, 'change', (e) => {
      setDashboardVisibility(!!e.target.checked);
    }, 'dashboard-quick-visible-change');

    menuContent.querySelectorAll('input[data-hero-metric-key]').forEach((input) => {
      const key = input.dataset.heroMetricKey;
      bindEventOnce(input, 'change', (e) => {
        updateHeroMetricVisibility(key, !!e.target.checked);
      }, `dashboard-quick-hero-${key}`);
    });

    menuContent.querySelectorAll('input[data-dashboard-key]').forEach((input) => {
      const key = input.dataset.dashboardKey;
      bindEventOnce(input, 'change', (e) => {
        updateDashboardCardVisibility(key, !!e.target.checked);
      }, `dashboard-quick-${key}`);
    });
  }

  function setDashboardQuickMenuOpen(isOpen) {
    const menu = document.getElementById('dashboard-quick-menu');
    const toggleBtn = document.getElementById('btn-toggle-dashboard');
    if (!menu || !toggleBtn) return;

    isDashboardQuickMenuOpen = !!isOpen;
    if (isDashboardQuickMenuOpen) {
      renderDashboardQuickMenu();
      menu.style.display = 'block';
      menu.classList.add('active');
    } else {
      menu.classList.remove('active');
      menu.style.display = 'none';
    }
    toggleBtn.setAttribute('data-menu-open', isDashboardQuickMenuOpen ? 'true' : 'false');
    updateHeroStatsToggleButtonLabel();
  }

  function handleDashboardToggleButtonClick(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setListColumnsMenuOpen(false);
    setDashboardQuickMenuOpen(!isDashboardQuickMenuOpen);
  }

  function handleGraphToggleButtonClick(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setDashboardQuickMenuOpen(false);
    setGraphVisibility(!isGraphVisible, true);
  }

  function handleDashboardQuickMenuOutsideClick(event) {
    if (!isDashboardQuickMenuOpen) return;
    const menu = document.getElementById('dashboard-quick-menu');
    const toggleBtn = document.getElementById('btn-toggle-dashboard');
    if (!menu || !toggleBtn) return;
    if (menu.contains(event.target) || toggleBtn.contains(event.target)) return;
    setDashboardQuickMenuOpen(false);
  }

  function handleDashboardQuickMenuEscape(event) {
    if (event.key === 'Escape' && isDashboardQuickMenuOpen) {
      setDashboardQuickMenuOpen(false);
    }
  }

  function applyDashboardConfig() {
    const grid = document.getElementById('dashboard-cards-grid');
    const expenseContainer = document.getElementById('expense-container');
    if (!grid && !expenseContainer) return;

    const cards = grid ? Array.from(grid.querySelectorAll('[data-dashboard-key]')) : [];
    const cardMap = new Map(cards.map((card) => [card.dataset.dashboardKey, card]));
    let visibleCount = 0;
    const expenseSetting = dashboardConfig.find((item) => item.key === 'expenseSection');
    const isExpenseVisible = expenseSetting ? expenseSetting.visible !== false : true;

    dashboardConfig.forEach((item) => {
      if (item.key === 'expenseSection') return;
      const card = cardMap.get(item.key);
      if (!card) return;
      card.style.display = item.visible ? '' : 'none';
      if (item.visible) visibleCount += 1;
      if (grid) grid.appendChild(card);
    });

    cards.forEach((card) => {
      if (!dashboardConfig.some((item) => item.key === card.dataset.dashboardKey)) {
        card.style.display = '';
        if (grid) grid.appendChild(card);
        visibleCount += 1;
      }
    });

    if (grid) grid.style.display = visibleCount > 0 ? 'grid' : 'none';
    if (expenseContainer) expenseContainer.style.display = isExpenseVisible ? 'block' : 'none';
    renderDashboardQuickMenu();
  }

  function updateDashboardCardVisibility(itemKey, visible) {
    dashboardConfig = dashboardConfig.map((item) => (
      item.key === itemKey ? { ...item, visible: !!visible } : item
    ));
    saveDashboardConfig(dashboardConfig);
    applyDashboardConfig();
    renderDashboardQuickMenu();
    renderSettings();
  }

  function moveDashboardCard(itemKey, direction) {
    const index = dashboardConfig.findIndex((item) => item.key === itemKey);
    if (index === -1) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= dashboardConfig.length) return;

    const next = [...dashboardConfig];
    const [picked] = next.splice(index, 1);
    next.splice(targetIndex, 0, picked);
    saveDashboardConfig(next);
    applyDashboardConfig();
    renderDashboardQuickMenu();
    renderSettings();
  }

  function getListSettingsButtonLabel() {
    if (isMobileViewport()) return '⚙';
    return `⚙ ${t('listColumnSettings')}`;
  }

  function getListSettingsHintLabel() {
    return t('listColumnSettingsHint');
  }

  function updateListSettingsButtonLabel() {
    if (!listColumnsButton) return;
    const label = getListSettingsButtonLabel();
    listColumnsButton.textContent = label;
    listColumnsButton.title = label;
    listColumnsButton.setAttribute('aria-label', label);
  }

  function updateListColumnVisibility(itemKey, visible) {
    const visibleCount = listColumnConfig.filter((item) => item.visible !== false).length;
    if (!visible && visibleCount <= 1) {
      showToast(getListColumnMinimumMessage(), 'error');
      renderListColumnsMenu();
      return;
    }
    listColumnConfig = listColumnConfig.map((item) => (
      item.key === itemKey ? { ...item, visible: !!visible } : item
    ));
    saveListColumnConfig(listColumnConfig);
    renderTable();
    renderListColumnsMenu();
  }

  function moveListColumn(itemKey, direction) {
    const index = listColumnConfig.findIndex((item) => item.key === itemKey);
    if (index === -1) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= listColumnConfig.length) return;

    const next = [...listColumnConfig];
    const [picked] = next.splice(index, 1);
    next.splice(targetIndex, 0, picked);
    saveListColumnConfig(next);
    renderTable();
    renderListColumnsMenu();
  }

  function renderListColumnsMenu() {
    if (!listColumnsMenuContent) return;
    updateListSettingsButtonLabel();

    const rows = [
      `<div class="list-columns-menu-hint">${escapeHtml(getListSettingsHintLabel())}</div>`,
    ];

    listColumnConfig.forEach((item, index) => {
      rows.push(`
        <div class="list-columns-item">
          <label class="list-columns-toggle">
            <input type="checkbox" data-list-column-key="${item.key}" ${item.visible ? 'checked' : ''}>
            <span>${escapeHtml(getListColumnLabel(item.key))}</span>
          </label>
          <div class="list-columns-order">
            <button type="button" class="btn-icon-sm" data-list-column-move="${item.key}" data-list-column-dir="-1" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" class="btn-icon-sm" data-list-column-move="${item.key}" data-list-column-dir="1" ${index === listColumnConfig.length - 1 ? 'disabled' : ''}>↓</button>
          </div>
        </div>
      `);
    });

    listColumnsMenuContent.innerHTML = rows.join('');

    listColumnsMenuContent.querySelectorAll('input[data-list-column-key]').forEach((input) => {
      const key = input.dataset.listColumnKey;
      bindEventOnce(input, 'change', (e) => {
        updateListColumnVisibility(key, !!e.target.checked);
      }, `list-column-visible-${key}`);
    });

    listColumnsMenuContent.querySelectorAll('button[data-list-column-move]').forEach((button) => {
      const key = button.dataset.listColumnMove;
      const direction = Number(button.dataset.listColumnDir || '0');
      bindEventOnce(button, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!Number.isFinite(direction) || direction === 0) return;
        moveListColumn(key, direction);
      }, `list-column-move-${key}-${direction}`);
    });
  }

  function ensureListColumnsMenuMountedToBody() {
    if (!listColumnsMenu || !document.body) return;
    if (listColumnsMenu.parentElement !== document.body) {
      document.body.appendChild(listColumnsMenu);
    }
  }

  function positionListColumnsMenu() {
    if (!listColumnsMenu || !listColumnsButton) return;

    const triggerRect = listColumnsButton.getBoundingClientRect();
    const viewportPadding = 12;
    const menuWidth = Math.min(340, window.innerWidth - (viewportPadding * 2));
    listColumnsMenu.style.width = `${menuWidth}px`;

    let left = triggerRect.right - menuWidth;
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - menuWidth - viewportPadding));

    let top = triggerRect.bottom + 8;
    const menuHeight = listColumnsMenu.offsetHeight || 320;
    if (top + menuHeight > window.innerHeight - viewportPadding) {
      top = Math.max(viewportPadding, triggerRect.top - menuHeight - 8);
    }

    listColumnsMenu.style.left = `${Math.round(left)}px`;
    listColumnsMenu.style.top = `${Math.round(top)}px`;
  }

  function handleListColumnsViewportChange() {
    updateListSettingsButtonLabel();
    if (!isListColumnsMenuOpen) return;
    positionListColumnsMenu();
  }

  function setListColumnsMenuOpen(isOpen) {
    if (!listColumnsMenu || !listColumnsButton) return;
    if (listColumnsHideTimer) {
      clearTimeout(listColumnsHideTimer);
      listColumnsHideTimer = null;
    }
    isListColumnsMenuOpen = !!isOpen;
    if (isListColumnsMenuOpen) {
      ensureListColumnsMenuMountedToBody();
      renderListColumnsMenu();
      listColumnsMenu.style.display = 'block';
      positionListColumnsMenu();
      requestAnimationFrame(() => {
        if (!isListColumnsMenuOpen) return;
        listColumnsMenu.classList.add('active');
      });
      listColumnsButton.classList.add('active');
    } else {
      listColumnsMenu.classList.remove('active');
      listColumnsButton.classList.remove('active');
      listColumnsHideTimer = setTimeout(() => {
        if (isListColumnsMenuOpen) return;
        listColumnsMenu.style.display = 'none';
      }, 180);
    }
    listColumnsButton.setAttribute('aria-expanded', isListColumnsMenuOpen ? 'true' : 'false');
  }

  function handleListColumnsToggleButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();
    setDashboardQuickMenuOpen(false);
    setListColumnsMenuOpen(!isListColumnsMenuOpen);
  }

  function handleListColumnsOutsideClick(event) {
    if (!isListColumnsMenuOpen) return;
    if (!listColumnsMenu || !listColumnsButton) return;
    if (listColumnsMenu.contains(event.target) || listColumnsButton.contains(event.target)) return;
    setListColumnsMenuOpen(false);
  }

  function handleListColumnsEscape(event) {
    if (event.key === 'Escape' && isListColumnsMenuOpen) {
      setListColumnsMenuOpen(false);
    }
  }

  function isMobileViewport() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  function copySelectOptions(sourceSelect, targetSelect) {
    if (!sourceSelect || !targetSelect) return;
    const previousValue = targetSelect.value;
    targetSelect.innerHTML = '';
    Array.from(sourceSelect.options || []).forEach((option) => {
      const next = document.createElement('option');
      next.value = option.value;
      next.textContent = option.textContent;
      targetSelect.appendChild(next);
    });
    if (Array.from(targetSelect.options).some((option) => option.value === previousValue)) {
      targetSelect.value = previousValue;
    } else if (Array.from(targetSelect.options).some((option) => option.value === sourceSelect.value)) {
      targetSelect.value = sourceSelect.value;
    }
  }

  function syncMobileFilterSheetFromToolbar() {
    copySelectOptions(filterPayment, mobileFilterPayment);
    copySelectOptions(filterPhotographer, mobileFilterPhotographer);
    copySelectOptions(filterMonth, mobileFilterMonth);
    if (!MOBILE_SORT_OPTIONS.some((option) => option.key === currentSort.key)) {
      currentSort = { key: 'shootingDate', dir: 'desc' };
    }
    if (currentSort.dir !== 'asc' && currentSort.dir !== 'desc') {
      currentSort.dir = 'desc';
    }
    renderMobileSortQuickList();
  }

  function applyMobileFilterSheetSelection() {
    if (filterPayment && mobileFilterPayment) {
      filterPayment.value = mobileFilterPayment.value;
    }
    if (filterPhotographer && mobileFilterPhotographer) {
      filterPhotographer.value = mobileFilterPhotographer.value;
    }
    if (filterMonth && mobileFilterMonth) {
      filterMonth.value = mobileFilterMonth.value;
    }
    renderTable();
  }

  function getMobileSortOptionLabel(option) {
    if (!option) return '';
    const translated = t(option.labelKey);
    return translated && translated !== option.labelKey ? translated : option.fallbackLabel;
  }

  function renderMobileSortQuickList() {
    if (!mobileSortQuickList) return;
    const ascLabel = t('mobileSortAsc');
    const descLabel = t('mobileSortDesc');
    const rows = MOBILE_SORT_OPTIONS.map((option) => {
      const label = escapeHtml(getMobileSortOptionLabel(option));
      const ascActive = currentSort.key === option.key && currentSort.dir === 'asc';
      const descActive = currentSort.key === option.key && currentSort.dir === 'desc';
      return `
        <div class="mobile-sort-row">
          <span class="mobile-sort-row-label" title="${label}">${label}</span>
          <div class="mobile-sort-arrows" role="group" aria-label="${label}">
            <button type="button" class="mobile-sort-arrow-btn ${ascActive ? 'active' : ''}"
              data-mobile-sort-key="${option.key}" data-mobile-sort-dir="asc"
              title="${escapeHtml(ascLabel)}" aria-label="${escapeHtml(ascLabel)}">▲</button>
            <button type="button" class="mobile-sort-arrow-btn ${descActive ? 'active' : ''}"
              data-mobile-sort-key="${option.key}" data-mobile-sort-dir="desc"
              title="${escapeHtml(descLabel)}" aria-label="${escapeHtml(descLabel)}">▼</button>
          </div>
        </div>
      `;
    }).join('');
    mobileSortQuickList.innerHTML = rows;
  }

  function setMobileFilterSheetOpen(isOpen) {
    if (!mobileFilterSheetOverlay || !mobileFilterSheet || !mobileFilterToggleButton) return;

    if (!isMobileViewport()) {
      isMobileFilterSheetOpen = false;
      mobileFilterSheetOverlay.classList.remove('active');
      mobileFilterSheetOverlay.style.display = 'none';
      mobileFilterSheetOverlay.setAttribute('aria-hidden', 'true');
      mobileFilterToggleButton.setAttribute('aria-expanded', 'false');
      return;
    }

    isMobileFilterSheetOpen = !!isOpen;
    if (isMobileFilterSheetOpen) {
      syncMobileFilterSheetFromToolbar();
      setMobileHeaderMenuOpen(false);
      mobileFilterSheetOverlay.style.display = 'flex';
      requestAnimationFrame(() => {
        mobileFilterSheetOverlay.classList.add('active');
      });
      mobileFilterSheetOverlay.setAttribute('aria-hidden', 'false');
      mobileFilterToggleButton.setAttribute('aria-expanded', 'true');
      return;
    }

    mobileFilterSheetOverlay.classList.remove('active');
    mobileFilterSheetOverlay.setAttribute('aria-hidden', 'true');
    mobileFilterToggleButton.setAttribute('aria-expanded', 'false');
    window.setTimeout(() => {
      if (!isMobileFilterSheetOpen) mobileFilterSheetOverlay.style.display = 'none';
    }, 220);
  }

  function handleMobileFilterToggleClick(event) {
    if (!isMobileViewport()) return;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setMobileFilterSheetOpen(!isMobileFilterSheetOpen);
  }

  function handleMobileFilterSheetOverlayClick(event) {
    if (!isMobileFilterSheetOpen) return;
    if (event.target === mobileFilterSheetOverlay) {
      setMobileFilterSheetOpen(false);
    }
  }

  function handleMobileFilterSheetEscape(event) {
    if (event.key === 'Escape' && isMobileFilterSheetOpen) {
      setMobileFilterSheetOpen(false);
    }
  }

  function handleMobileFilterSheetControlChange() {
    applyMobileFilterSheetSelection();
  }

  function handleMobileSortQuickClick(event) {
    const trigger = event?.target?.closest?.('button[data-mobile-sort-key][data-mobile-sort-dir]');
    if (!trigger) return;
    const sortKey = trigger.dataset.mobileSortKey || 'shootingDate';
    const sortDir = trigger.dataset.mobileSortDir === 'asc' ? 'asc' : 'desc';
    currentSort = { key: sortKey, dir: sortDir };
    renderMobileSortQuickList();
    renderTable();
  }

  function handleMobileFilterSheetViewportChange() {
    if (!isMobileViewport()) {
      setMobileFilterSheetOpen(false);
    }
  }

  function setMobileHeaderMenuOpen(isOpen) {
    if (!appHeader || !mobileHeaderMenuButton || !headerActions) return;
    if (!isMobileViewport()) {
      isMobileHeaderMenuOpen = false;
      appHeader.classList.remove('mobile-menu-open');
      mobileHeaderMenuButton.setAttribute('aria-expanded', 'false');
      return;
    }
    isMobileHeaderMenuOpen = !!isOpen;
    appHeader.classList.toggle('mobile-menu-open', isMobileHeaderMenuOpen);
    mobileHeaderMenuButton.setAttribute('aria-expanded', isMobileHeaderMenuOpen ? 'true' : 'false');
  }

  function handleMobileHeaderMenuToggleClick(event) {
    if (!isMobileViewport()) return;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setMobileFilterSheetOpen(false);
    setMobileHeaderMenuOpen(!isMobileHeaderMenuOpen);
  }

  function handleMobileHeaderMenuOutsideClick(event) {
    if (!isMobileHeaderMenuOpen || !appHeader) return;
    if (appHeader.contains(event.target)) return;
    setMobileHeaderMenuOpen(false);
  }

  function handleMobileHeaderMenuEscape(event) {
    if (event.key === 'Escape' && isMobileHeaderMenuOpen) {
      setMobileHeaderMenuOpen(false);
    }
  }

  function handleMobileHeaderActionClick(event) {
    if (!isMobileHeaderMenuOpen || !isMobileViewport()) return;
    if (!headerActions) return;
    const clickable = event.target.closest('button, .btn, .theme-toggle, a');
    if (!clickable) return;
    setMobileHeaderMenuOpen(false);
  }

  function handleMobileHeaderViewportChange() {
    updateListSettingsButtonLabel();
    if (!isMobileViewport()) {
      setMobileHeaderMenuOpen(false);
    }
    handleMobileFilterSheetViewportChange();
  }

  window.toggleDashboardCardVisibility = updateDashboardCardVisibility;
  window.moveDashboardCard = moveDashboardCard;

  function getExpenses() {
    return getCloudValue(EXPENSES_KEY, []);
  }
  function saveExpenses(expenses) { saveCloudValue(EXPENSES_KEY, expenses); }

  // ===== Populate Select Options =====
  function populateSelects() {
    const planSelect = $('#form-plan');
    if (planSelect) {
      const curVal = planSelect.value;
      planSelect.innerHTML = `<option value="">${t('selectDefault')}</option>`;
      const plans = Array.isArray(planMaster) ? planMaster : [];
      plans.forEach((plan) => {
        const opt = document.createElement('option');
        opt.value = plan.name;
        opt.textContent = plan.name;
        planSelect.appendChild(opt);
      });

      if (curVal) {
        const matched = findPlanMasterByValue(curVal);
        if (matched) {
          planSelect.value = matched.name;
        } else {
          const legacyOpt = document.createElement('option');
          legacyOpt.value = curVal;
          legacyOpt.textContent = curVal;
          planSelect.appendChild(legacyOpt);
          planSelect.value = curVal;
        }
      }
    }

    // Populate Photographers
    const pSel = $('#form-assignedTo');
    const fSel = filterPhotographer;
    if (pSel && fSel) {
      const curP = pSel.value;
      const curF = fSel.value;
      const photographers = window.TeamManager.loadPhotographers();
      const options = photographers.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
      pSel.innerHTML = `<option value="">${t('selectDefault')}</option>` + options;
      fSel.innerHTML = `<option value="all">${t('filterPhotographer')}</option>` + options;
      pSel.value = curP;
      fSel.value = curF;
    }

    if (isMobileFilterSheetOpen) {
      syncMobileFilterSheetFromToolbar();
    }
  }

  function hookPhotographerOther() {
    const sel = $('#form-assignedTo');
    if (!sel || sel.tagName !== 'SELECT') return;

    // Add "Other" if not present
    if (![...sel.options].some(o => o.value === '__other__')) {
      const otherOpt = document.createElement('option');
      otherOpt.value = '__other__';
      otherOpt.textContent = t('selectOther');
      sel.appendChild(otherOpt);
    }

    sel.addEventListener('change', () => {
      if (sel.value === '__other__') {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'form-assignedTo';
        input.placeholder = t('placeholderPhotographerName');
        sel.replaceWith(input);
        input.focus();
        input.addEventListener('blur', () => {
          if (!input.value.trim()) {
            const newSel = document.createElement('select');
            newSel.id = 'form-assignedTo';
            input.replaceWith(newSel);
            populateSelects();
            hookPhotographerOther();
          }
        });
      }
    });
  }

  function renderCustomFields(customerData = {}) {
    const container = $('#custom-fields-container');
    if (!container) return;

    container.innerHTML = '';
    const definitions = loadCustomFieldDefinitions();
    const values = customerData.customFields || {};

    definitions.forEach(field => {
      const div = document.createElement('div');
      div.className = 'form-group';
      div.innerHTML = `
        <label>${escapeHtml(field.label)}</label>
        <div style="display:flex; gap:6px;">
          <input type="text" id="custom-field-${field.id}" value="${escapeHtml(values[field.id] || '')}" placeholder="${escapeHtml(field.label)}" style="flex:1;" />
          <button type="button" class="btn-icon" title="Delete" onclick="removeCustomField('${field.id}')">🗑</button>
        </div>
      `;
      container.appendChild(div);
    });
  }

  function removeCustomField(fieldId) {
    if (!confirm(t('confirmDeleteField') || 'Delete this field?')) return;
    const filtered = loadCustomFieldDefinitions().filter(field => field.id !== fieldId);
    saveCustomFieldDefinitions(filtered);
    renderCustomFields();
    showToast(t('customFieldRemoved') || 'Custom field removed');
  }
  window.removeCustomField = removeCustomField;

  // ===== Dashboard =====
  function getMonthRange(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    return {
      year,
      month,
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0),
      monthKey: `${year}-${String(month + 1).padStart(2, '0')}`,
    };
  }

  function parseDateParts(dateStr) {
    if (!dateStr) return null;

    const normalized = String(dateStr).trim().replace(/[年月]/g, '-').replace(/[日]/g, '');
    const match = normalized.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]) - 1,
        day: Number(match[3]),
      };
    }

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return null;

    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
    };
  }

  function isInYearMonth(dateStr, year, month) {
    const parts = parseDateParts(dateStr);
    return !!parts && parts.year === year && parts.month === month;
  }

  function isInYear(dateStr, year) {
    const parts = parseDateParts(dateStr);
    return !!parts && parts.year === year;
  }

  function getDashboardChartMonthLabels() {
    const locale = currentLang === 'fr' ? 'fr-FR' : (currentLang === 'ja' ? 'ja-JP' : 'en-US');
    return Array.from({ length: 12 }, (_, index) => (
      new Date(2000, index, 1).toLocaleString(locale, { month: 'short' })
    ));
  }

  function getDashboardChartDatasetLabels() {
    return {
      revenue: t('chartMonthlyRevenue'),
      profit: t('chartMonthlyProfit'),
    };
  }

  function getDashboardRequestChartDatasetLabels(year) {
    return {
      current: t('chartRequestCurrentYear', { year: String(year) }),
      previous: t('chartRequestPreviousYear', { year: String(year - 1) }),
      comparison: t('chartComparison'),
    };
  }

  function getCustomerExpenseValue(customer) {
    const storedExpense = Number(customer?.expense);
    if (Number.isFinite(storedExpense)) return storedExpense;
    const planCost = toSafeNumber(customer?.planCost, toSafeNumber(customer?.planDetails?.planCost, 0));
    const extraCost = normalizeExtraChargeItems(customer?.extraChargeItems)
      .reduce((sum, item) => sum + toSafeNumber(item?.cost, 0), 0);
    return planCost + extraCost;
  }

  function getCustomerProfitValue(customer) {
    const revenue = toSafeNumber(customer?.revenue, toSafeNumber(customer?.planDetails?.totalPrice, 0));
    const storedProfit = Number(customer?.profit);
    if (Number.isFinite(storedProfit)) return storedProfit;
    return revenue - getCustomerExpenseValue(customer);
  }

  function buildMonthlyRevenueProfitSeries(year) {
    const revenueByMonth = Array(12).fill(0);
    const profitByMonth = Array(12).fill(0);

    customers.forEach((customer) => {
      const parts = parseDateParts(customer?.shootingDate);
      if (!parts || parts.year !== year || parts.month < 0 || parts.month > 11) return;

      const revenue = toSafeNumber(customer?.revenue, toSafeNumber(customer?.planDetails?.totalPrice, 0));
      const profit = getCustomerProfitValue(customer);
      revenueByMonth[parts.month] += revenue;
      profitByMonth[parts.month] += profit;
    });

    return { revenueByMonth, profitByMonth };
  }

  function getRequestBaseDate(customer) {
    return customer?.contractDate || customer?.inquiryDate || customer?.createdAt || '';
  }

  function buildMonthlyRequestCountSeries(year) {
    const currentYearCounts = Array(12).fill(0);
    const previousYearCounts = Array(12).fill(0);

    customers.forEach((customer) => {
      const parts = parseDateParts(getRequestBaseDate(customer));
      if (!parts || parts.month < 0 || parts.month > 11) return;
      if (parts.year === year) {
        currentYearCounts[parts.month] += 1;
      } else if (parts.year === year - 1) {
        previousYearCounts[parts.month] += 1;
      }
    });

    return { currentYearCounts, previousYearCounts };
  }

  function renderRevenueChart(year) {
    const canvas = document.getElementById('revenueChart');
    if (!canvas || typeof window.Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels = getDashboardChartMonthLabels();
    const { revenueByMonth, profitByMonth } = buildMonthlyRevenueProfitSeries(year);
    const datasetLabels = getDashboardChartDatasetLabels();

    if (!revenueProfitChartInstance) {
      revenueProfitChartInstance = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: datasetLabels.revenue,
              data: revenueByMonth,
              backgroundColor: '#007bff',
              borderColor: '#007bff',
              borderWidth: 1,
              borderRadius: 6,
              maxBarThickness: 28,
            },
            {
              label: datasetLabels.profit,
              data: profitByMonth,
              backgroundColor: '#28a745',
              borderColor: '#28a745',
              borderWidth: 1,
              borderRadius: 6,
              maxBarThickness: 28,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                pointStyle: 'rectRounded',
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${formatCurrency(Number(context.parsed?.y) || 0)}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => formatCurrency(Number(value) || 0),
              },
            },
          },
        },
      });
      return;
    }

    revenueProfitChartInstance.data.labels = labels;
    if (revenueProfitChartInstance.data.datasets[0]) {
      revenueProfitChartInstance.data.datasets[0].label = datasetLabels.revenue;
      revenueProfitChartInstance.data.datasets[0].data = revenueByMonth;
      revenueProfitChartInstance.data.datasets[0].backgroundColor = '#007bff';
      revenueProfitChartInstance.data.datasets[0].borderColor = '#007bff';
    }
    if (revenueProfitChartInstance.data.datasets[1]) {
      revenueProfitChartInstance.data.datasets[1].label = datasetLabels.profit;
      revenueProfitChartInstance.data.datasets[1].data = profitByMonth;
      revenueProfitChartInstance.data.datasets[1].backgroundColor = '#28a745';
      revenueProfitChartInstance.data.datasets[1].borderColor = '#28a745';
    }
    revenueProfitChartInstance.update();
  }

  function renderRequestTrendChart(year) {
    const canvas = document.getElementById('requestTrendChart');
    if (!canvas || typeof window.Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels = getDashboardChartMonthLabels();
    const { currentYearCounts, previousYearCounts } = buildMonthlyRequestCountSeries(year);
    const hasPreviousYearData = previousYearCounts.some((value) => value > 0);
    const datasetLabels = getDashboardRequestChartDatasetLabels(year);

    const datasets = [
      {
        label: datasetLabels.current,
        data: currentYearCounts,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.14)',
        fill: false,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ];

    if (hasPreviousYearData) {
      datasets.push({
        label: datasetLabels.previous,
        data: previousYearCounts,
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148,163,184,0.12)',
        fill: false,
        tension: 0.3,
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 2.5,
        pointHoverRadius: 4.5,
      });
    }

    if (!requestTrendChartInstance) {
      requestTrendChartInstance = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                pointStyle: 'circle',
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${Number(context.parsed?.y) || 0}${t('chartRequestCountUnit')}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
            },
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
              },
            },
          },
        },
      });
      return;
    }

    requestTrendChartInstance.data.labels = labels;
    requestTrendChartInstance.data.datasets = datasets;
    requestTrendChartInstance.update();
  }

  function syncDashboardMonthPicker() {
    if (!dashboardMonthPicker) return;
    const { monthKey } = getMonthRange(selectedDashboardMonth);
    dashboardMonthPicker.value = monthKey;
  }

  function moveDashboardMonth(offset) {
    selectedDashboardMonth = new Date(
      selectedDashboardMonth.getFullYear(),
      selectedDashboardMonth.getMonth() + offset,
      1
    );
    syncDashboardMonthPicker();
    updateDashboard();
  }

  function updateDashboard() {
    const total = customers.length;
    const { year, month } = getMonthRange(selectedDashboardMonth);

    const monthlyShoots = customers.filter(c => isInYearMonth(c.shootingDate, year, month));
    const monthlyRevenue = monthlyShoots.reduce((sum, c) => sum + (Number(c.revenue) || 0), 0);
    const monthlyProjectExpense = monthlyShoots.reduce((sum, c) => sum + getCustomerExpenseValue(c), 0);
    const monthlyNetProfit = monthlyRevenue - monthlyProjectExpense;
    const averageProfitRate = monthlyRevenue > 0 ? (monthlyNetProfit / monthlyRevenue) * 100 : 0;

    const expenses = getExpenses();
    const monthlyExpenses = expenses
      .filter(e => isInYearMonth(e.date, year, month))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const monthlyProfit = monthlyNetProfit;

    const yearlyRevenue = customers
      .filter(c => isInYear(c.shootingDate, year))
      .reduce((sum, c) => sum + (Number(c.revenue) || 0), 0);
    const yearlyProjectProfit = customers
      .filter((c) => isInYear(c.shootingDate, year))
      .reduce((sum, c) => sum + getCustomerProfitValue(c), 0);

    const yearlyExpenses = expenses
      .filter(e => isInYear(e.date, year))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const yearlyProfit = yearlyRevenue - yearlyExpenses;
    const unpaidCount = customers.filter((customer) => !customer.paymentChecked).length;

    const setTextById = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    setTextById('stat-total', total);
    setTextById('stat-monthly', monthlyShoots.length);
    setTextById('stat-revenue', formatCurrency(monthlyRevenue));
    setTextById('profit-month', formatCurrency(monthlyProfit));
    if ($('#stat-monthly-net-profit')) $('#stat-monthly-net-profit').textContent = formatCurrency(monthlyNetProfit);
    const averageMarginEl = $('#stat-average-margin');
    if (averageMarginEl) {
      averageMarginEl.textContent = `${averageProfitRate.toFixed(1)}%`;
      averageMarginEl.classList.toggle('is-positive', averageProfitRate > 0);
      averageMarginEl.classList.toggle('is-negative', averageProfitRate < 0);
    }
    const yearlyNetProfitEl = $('#stat-yearly-net-profit');
    if (yearlyNetProfitEl) {
      yearlyNetProfitEl.textContent = formatCurrency(yearlyProjectProfit);
      yearlyNetProfitEl.classList.toggle('is-positive', yearlyProjectProfit > 0);
      yearlyNetProfitEl.classList.toggle('is-negative', yearlyProjectProfit < 0);
    }

    if ($('#expense-month')) $('#expense-month').textContent = formatCurrency(monthlyExpenses);
    if ($('#revenue-month')) $('#revenue-month').textContent = formatCurrency(monthlyRevenue);
    if ($('#profit-month-alt')) $('#profit-month-alt').textContent = formatCurrency(monthlyProfit);

    if ($('#stat-yearly-revenue')) $('#stat-yearly-revenue').textContent = formatCurrency(yearlyRevenue);
    if ($('#stat-yearly-profit')) $('#stat-yearly-profit').textContent = formatCurrency(yearlyProfit);
    if ($('#stat-yearly-expense')) $('#stat-yearly-expense').textContent = formatCurrency(yearlyExpenses);
    if ($('#stat-unpaid')) $('#stat-unpaid').textContent = unpaidCount;
    if ($('#yearly-revenue-label')) $('#yearly-revenue-label').textContent = t('yearlyRevenueTotal');
    if ($('#yearly-profit-label')) $('#yearly-profit-label').textContent = t('yearlyProfitTotal');
    if ($('#yearly-expense-label')) $('#yearly-expense-label').textContent = t('yearlyExpenseTotal');
    if (isGraphVisible || revenueProfitChartInstance || requestTrendChartInstance) {
      renderRevenueChart(year);
      renderRequestTrendChart(year);
    }
  }

  // ===== Month Filter =====
  function updateMonthFilter() {
    if (!filterMonth) return;
    const months = new Set();
    customers.forEach(c => { if (c.shootingDate) months.add(c.shootingDate.slice(0, 7)); });
    const sorted = [...months].sort().reverse();
    const current = filterMonth.value;
    filterMonth.innerHTML = `<option value="all">${t('filterPeriodAll')}</option>`;
    sorted.forEach(m => {
      const [y, mo] = m.split('-');
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = formatCalendarHeader(Number(y), Number(mo) - 1);
      filterMonth.appendChild(opt);
    });
    if (sorted.includes(current)) filterMonth.value = current;
    if (isMobileFilterSheetOpen) {
      syncMobileFilterSheetFromToolbar();
    }
  }

  // ===== Filter & Sort =====
  function getFilteredCustomers() {
    let list = [...customers];
    const query = (searchInput?.value || '').trim().toLowerCase();
    if (query) {
      list = list.filter(c =>
        (c.customerName || '').toLowerCase().includes(query) ||
        (c.contact || '').toLowerCase().includes(query)
      );
    }
    const pf = filterPayment?.value || 'all';
    if (pf === 'paid') list = list.filter(c => c.paymentChecked);
    if (pf === 'unpaid') list = list.filter(c => !c.paymentChecked);
    const mf = filterMonth?.value || 'all';
    if (mf !== 'all') list = list.filter(c => c.shootingDate && c.shootingDate.startsWith(mf));

    const pf_staff = filterPhotographer?.value || 'all';
    if (pf_staff !== 'all') list = list.filter(c => c.assignedTo === pf_staff);

    const { key, dir } = currentSort;
    const dateSortKeys = new Set(['inquiryDate', 'contractDate', 'shootingDate', 'meetingDate', 'billingDate', 'deliveryDate', 'paymentConfirmDate']);
    list.sort((a, b) => {
      let va = a[key] ?? '', vb = b[key] ?? '';
      if (key === 'revenue') {
        va = Number(va) || 0;
        vb = Number(vb) || 0;
      } else if (key === 'paymentChecked') {
        va = va ? 1 : 0;
        vb = vb ? 1 : 0;
      } else if (dateSortKeys.has(key)) {
        const aParts = parseDateParts(va);
        const bParts = parseDateParts(vb);
        va = aParts ? new Date(aParts.year, aParts.month, aParts.day).getTime() : 0;
        vb = bParts ? new Date(bParts.year, bParts.month, bParts.day).getTime() : 0;
      } else {
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
      }
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }

  // ===== Render Table =====
  function getActionLabels() {
    return {
      edit: t('edit'),
      detail: t('actionDetail'),
      contract: t('generateContract'),
      history: t('actionHistory'),
      delete: t('delete'),
      actions: t('thActions'),
      shootingDate: t('thShootingDate'),
      revenue: t('thRevenue'),
    };
  }

  function renderCustomerColumnValue(customer, columnKey, viewMode = 'table') {
    switch (columnKey) {
      case 'inquiryDate':
      case 'contractDate':
      case 'shootingDate':
      case 'meetingDate':
        return toDisplayText(formatDate(customer[columnKey]));
      case 'customerName':
        return `<span>${escapeHtml(toDisplayText(customer.customerName))}</span>`;
      case 'workflowStatus': {
        const statusKey = normalizeWorkflowStatus(customer?.workflowStatus);
        const statusLabel = getWorkflowStatusLabel(statusKey);
        return `
          <span class="status-dot-cell" title="${escapeHtml(statusLabel)}" aria-label="${escapeHtml(statusLabel)}">
            ${renderWorkflowStatusDot(customer)}
          </span>
        `;
      }
      case 'contact':
        return escapeHtml(toDisplayText(customer.contact));
      case 'plan':
        return renderPlanBadge(toDisplayText(resolveCustomerPlanName(customer)));
      case 'revenue':
        return viewMode === 'card'
          ? `<strong>${formatCurrency(customer.revenue)}</strong>`
          : `<span style="font-weight:600;color:var(--text-primary);">${formatCurrency(customer.revenue)}</span>`;
      case 'paymentChecked':
        return customer.paymentChecked
          ? `<span class="badge badge-success">${t('paid')}</span>`
          : `<span class="badge badge-warning">${t('unpaid')}</span>`;
      case 'assignedTo':
        return `<span class="badge badge-cyan">${escapeHtml(getPhotographerName(customer.assignedTo))}</span>`;
      default:
        return '—';
    }
  }

  function renderTableHeaders(visibleColumns, actionLabels) {
    const headerRow = document.querySelector('#customer-table thead tr');
    if (!headerRow) return;

    const headers = visibleColumns.map((column) => {
      const label = escapeHtml(getListColumnLabel(column.key));
      const sortAttr = column.sortKey ? ` data-sort="${column.sortKey}"` : '';
      const arrow = column.sortKey ? ' <span class="sort-arrow">▼</span>' : '';
      return `<th${sortAttr} data-column-key="${column.key}"><span>${label}</span>${arrow}</th>`;
    });
    headers.push(`<th data-column-key="actions">${escapeHtml(actionLabels.actions)}</th>`);
    headerRow.innerHTML = headers.join('');
    bindSortEventListeners();
  }

  function getListColumnMinimumMessage() {
    return t('listColumnMinimumMessage');
  }

  function renderTable() {
    const list = getFilteredCustomers();
    const actionLabels = getActionLabels();
    const visibleColumns = getVisibleListColumns();
    const listOrderMap = getListColumnOrderMap();
    const workflowLegend = document.getElementById('workflow-status-legend');
    renderTableHeaders(visibleColumns, actionLabels);
    renderWorkflowStatusLegend();

    if (customers.length === 0) {
      tableWrapper.style.display = 'none';
      if (customerCardGrid) customerCardGrid.style.display = 'none';
      if (workflowLegend) workflowLegend.style.display = 'none';
      emptyState.style.display = 'block';
      $('.toolbar').style.display = 'none';
      setMobileFilterSheetOpen(false);
    } else {
      tableWrapper.style.display = '';
      if (customerCardGrid) customerCardGrid.style.display = '';
      if (workflowLegend) workflowLegend.style.display = 'flex';
      emptyState.style.display = 'none';
      $('.toolbar').style.display = '';
    }

    tbody.innerHTML = '';
    if (customerCardGrid) customerCardGrid.innerHTML = '';
    list.forEach(c => {
      const tr = document.createElement('tr');
      const rowAccentColor = resolvePlanTagColor(resolveCustomerPlanName(c));
      tr.dataset.id = c.id;
      tr.style.cursor = 'pointer';
      tr.style.setProperty('--row-accent', rowAccentColor);
      tr.classList.add('customer-row-colorized');
      const dataCells = visibleColumns.map((column) => {
        const classList = [];
        if (column.key === 'customerName') classList.push('customer-name');
        const classAttr = classList.length ? ` class="${classList.join(' ')}"` : '';
        return `<td data-column-key="${column.key}"${classAttr}>${renderCustomerColumnValue(c, column.key, 'table')}</td>`;
      }).join('');

      tr.innerHTML = `
        ${dataCells}
        <td data-column-key="actions">
          <div class="table-action-group action-buttons">
            <button type="button" class="table-action-btn action-btn btn-edit" title="${escapeHtml(actionLabels.edit)}" aria-label="${escapeHtml(actionLabels.edit)}" onclick="openModal('${c.id}')">
              <span class="table-action-icon">✏️</span>
              <span class="table-action-label">${escapeHtml(actionLabels.edit)}</span>
            </button>
            <button type="button" class="table-action-btn action-btn" title="${escapeHtml(actionLabels.detail)}" aria-label="${escapeHtml(actionLabels.detail)}" onclick="openCustomerDetailByID('${c.id}')">
              <span class="table-action-icon">📄</span>
              <span class="table-action-label">${escapeHtml(actionLabels.detail)}</span>
            </button>
            <button type="button" class="table-action-btn action-btn" title="${escapeHtml(actionLabels.contract)}" aria-label="${escapeHtml(actionLabels.contract)}" onclick="openContractModalByID('${c.id}')">
              <span class="table-action-icon">📋</span>
              <span class="table-action-label">${escapeHtml(actionLabels.contract)}</span>
            </button>
            <button type="button" class="table-action-btn action-btn" title="${escapeHtml(actionLabels.history)}" aria-label="${escapeHtml(actionLabels.history)}" onclick="openCustomerHistoryByID('${c.id}')">
              <span class="table-action-icon">📜</span>
              <span class="table-action-label">${escapeHtml(actionLabels.history)}</span>
            </button>
            <button type="button" class="table-action-btn action-btn action-btn-delete btn-del" title="${escapeHtml(actionLabels.delete)}" aria-label="${escapeHtml(actionLabels.delete)}" onclick="openConfirm('${c.id}')">
              <span class="table-action-icon">🗑</span>
              <span class="table-action-label">${escapeHtml(actionLabels.delete)}</span>
            </button>
          </div>
        </td>
      `;
      tr.addEventListener('click', e => {
        if (e.target.closest('.table-action-btn, .btn-icon')) return;
        openDetail(c.id);
      });
      tbody.appendChild(tr);

      if (customerCardGrid) {
        const statusDot = renderWorkflowStatusDot(c);
        const shootingLabel = t('thShootingDate');
        const shootingValue = formatDate(c.shootingDate) || getUnsetDisplayText();
        const mobileDateText = shootingValue;
        const revenueLabel = t('thRevenue');
        const profitLabel = t('cardProfit');
        const planLabel = t('thPlan');
        const noteLabel = t('labelNotes');
        const planValue = toDisplayText(resolveCustomerPlanName(c));
        const revenueValue = toSafeNumber(c.revenue, 0);
        const profitValue = getCustomerProfitValue(c);
        const profitClass = profitValue < 0 ? 'is-negative' : 'is-positive';
        const noteValue = toDisplayText(String(c.notes || c.details || '').replace(/\s+/g, ' ').trim());

        const card = document.createElement('article');
        card.className = 'customer-card';
        card.classList.add('customer-row-colorized-card');
        card.style.setProperty('--row-accent', rowAccentColor);
        card.style.setProperty('--field-order-shootingDate', String(listOrderMap.shootingDate || 1));
        card.style.setProperty('--field-order-customerName', String(listOrderMap.customerName || 2));
        card.style.setProperty('--field-order-plan', String(listOrderMap.plan || 3));
        card.dataset.id = c.id;
        card.innerHTML = `
          <div class="customer-card-mobile-head">
            <div class="customer-card-mobile-left">
              <span class="customer-card-status-dot">${statusDot}</span>
              <div class="customer-card-mobile-main customer-card-flex-fields">
                <div class="customer-card-mobile-date customer-card-field" data-field="shootingDate" title="${escapeHtml(`${shootingLabel}: ${shootingValue}`)}">${escapeHtml(mobileDateText)}</div>
                <div class="customer-card-mobile-name customer-card-field" data-field="customerName" title="${escapeHtml(toDisplayText(c.customerName))}">${escapeHtml(toDisplayText(c.customerName))}</div>
              </div>
            </div>
            <div class="customer-card-mobile-metrics">
              <span class="metric-badge metric-revenue" title="${escapeHtml(`${revenueLabel}: ${formatCurrency(revenueValue)}`)}">${escapeHtml(`${revenueLabel} ${formatCurrency(revenueValue)}`)}</span>
              <span class="metric-badge metric-profit ${profitClass}" title="${escapeHtml(`${profitLabel}: ${formatCurrency(profitValue)}`)}">${escapeHtml(`${profitLabel} ${formatCurrency(profitValue)}`)}</span>
            </div>
          </div>
          <div class="customer-card-mobile-foot">
            <div class="customer-card-mobile-plan customer-card-field" data-field="plan" title="${escapeHtml(`${planLabel}: ${planValue}`)}">${escapeHtml(`${planLabel}: ${planValue}`)}</div>
            <div class="customer-card-mobile-note" title="${escapeHtml(`${noteLabel}: ${noteValue}`)}">${escapeHtml(`${noteLabel}: ${noteValue}`)}</div>
          </div>
          <div class="customer-card-actions action-buttons">
            <button type="button" class="table-action-btn action-btn btn-edit" title="${escapeHtml(actionLabels.edit)}" aria-label="${escapeHtml(actionLabels.edit)}" onclick="openModal('${c.id}')">
              <span class="table-action-icon">✏️</span>
              <span class="table-action-label">${escapeHtml(actionLabels.edit)}</span>
            </button>
            <button type="button" class="table-action-btn action-btn" title="${escapeHtml(actionLabels.detail)}" aria-label="${escapeHtml(actionLabels.detail)}" onclick="openCustomerDetailByID('${c.id}')">
              <span class="table-action-icon">📄</span>
              <span class="table-action-label">${escapeHtml(actionLabels.detail)}</span>
            </button>
            <button type="button" class="table-action-btn action-btn" title="${escapeHtml(actionLabels.contract)}" aria-label="${escapeHtml(actionLabels.contract)}" onclick="openContractModalByID('${c.id}')">
              <span class="table-action-icon">📋</span>
              <span class="table-action-label">${escapeHtml(actionLabels.contract)}</span>
            </button>
            <button type="button" class="table-action-btn action-btn" title="${escapeHtml(actionLabels.history)}" aria-label="${escapeHtml(actionLabels.history)}" onclick="openCustomerHistoryByID('${c.id}')">
              <span class="table-action-icon">📜</span>
              <span class="table-action-label">${escapeHtml(actionLabels.history)}</span>
            </button>
            <button type="button" class="table-action-btn action-btn action-btn-delete btn-del" title="${escapeHtml(actionLabels.delete)}" aria-label="${escapeHtml(actionLabels.delete)}" onclick="openConfirm('${c.id}')">
              <span class="table-action-icon">🗑</span>
              <span class="table-action-label">${escapeHtml(actionLabels.delete)}</span>
            </button>
          </div>
        `;
        card.addEventListener('click', (e) => {
          if (e.target.closest('.table-action-btn, .btn-icon')) return;
          openDetail(c.id);
        });
        customerCardGrid.appendChild(card);
      }
    });

    const totalRevenue = list.reduce((s, c) => s + (Number(c.revenue) || 0), 0);
    $('#table-count').textContent = `${list.length}${t('countSuffix')}`;
    $('#table-revenue-total').textContent = `${t('totalRevenuePrefix')}${formatCurrency(totalRevenue)}`;

    $$('thead th').forEach(th => {
      th.classList.toggle('sorted', th.dataset.sort === currentSort.key);
      const arrow = th.querySelector('.sort-arrow');
      if (arrow && th.dataset.sort === currentSort.key)
        arrow.textContent = currentSort.dir === 'asc' ? '▲' : '▼';
    });

    updateDashboard();
    renderTomorrowReminderCard();
    updateMonthFilter();
    updateHeaderPlanBadge();
    if (isMobileFilterSheetOpen) renderMobileSortQuickList();
    scheduleVerticalLongVowelNormalization();
  }

  function bindSortEventListeners() {
    const dateSortKeys = new Set(['inquiryDate', 'contractDate', 'shootingDate', 'meetingDate', 'billingDate', 'deliveryDate', 'paymentConfirmDate']);
    $$('thead th[data-sort]').forEach((th) => {
      const key = th.dataset.sort || 'unknown';
      bindEventOnce(th, 'click', () => {
        const sortKey = th.dataset.sort;
        if (!sortKey) return;
        if (currentSort.key === sortKey) currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
        else currentSort = { key: sortKey, dir: dateSortKeys.has(sortKey) ? 'desc' : 'asc' };
        renderTable();
      }, `table-sort-${key}`);
    });
  }

  function bindViewTabEventListeners() {
    $$('.view-tab').forEach((tab) => {
      const view = tab.dataset.view || 'list';
      bindEventOnce(tab, 'click', () => {
        $$('.view-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        saveCloudValue('preferred_view', view);

        if (view === 'calendar') {
          listView.classList.remove('active');
          calendarView.classList.add('active');
          renderCalendar();
        } else {
          calendarView.classList.remove('active');
          listView.classList.add('active');
        }
      }, `view-tab-${view}`);
    });
  }

  // ===== Calendar =====
  function renderCalendar() {
    const grid = $('#calendar-grid');
    grid.innerHTML = '';

    // Title
    $('#cal-title').textContent = formatCalendarHeader(calYear, calMonth);

    const weekdaysRaw = t('calendarWeekdaysShort');
    const days = weekdaysRaw && weekdaysRaw !== 'calendarWeekdaysShort'
      ? weekdaysRaw.split(',').map((day) => day.trim())
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    days.forEach((d, i) => {
      const hdr = document.createElement('div');
      hdr.className = 'calendar-day-header' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '');
      hdr.textContent = d;
      grid.appendChild(hdr);
    });

    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const prevDays = new Date(calYear, calMonth, 0).getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
    const eventsByDay = {};

    const dateFields = [
      { key: 'shootingDate', cls: 'shooting', label: '📷' },
      { key: 'meetingDate', cls: 'meeting', label: '🤝' },
      { key: 'inquiryDate', cls: 'inquiry', label: '💌' },
      { key: 'billingDate', cls: 'billing', label: '💳' },
    ].filter(df => calendarFilters[df.key]);

    customers.forEach(c => {
      dateFields.forEach(df => {
        if (c[df.key] && c[df.key].startsWith(monthStr)) {
          const day = parseInt(c[df.key].split('-')[2], 10);
          if (!eventsByDay[day]) eventsByDay[day] = [];
          eventsByDay[day].push({
            type: df.cls,
            label: `${df.label} ${c.customerName || ''}`,
            id: c.id,
          });
        }
      });
    });

    for (let i = firstDay - 1; i >= 0; i--) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell other-month';
      cell.innerHTML = `<div class="day-number">${prevDays - i}</div>`;
      grid.appendChild(cell);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = new Date(calYear, calMonth, d).getDay();
      const cell = document.createElement('div');
      let classes = 'calendar-cell';
      if (dateStr === todayStr) classes += ' today';
      if (dow === 0) classes += ' sun';
      if (dow === 6) classes += ' sat';
      cell.className = classes;

      let inner = `<div class="day-number">${d}</div><div class="calendar-events">`;
      const events = eventsByDay[d] || [];
      events.forEach(ev => {
        inner += `<div class="calendar-event ${ev.type}" data-id="${ev.id}">${escapeHtml(ev.label)}</div>`;
      });
      inner += `</div>`;
      cell.innerHTML = inner;
      grid.appendChild(cell);
    }

    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell other-month';
      cell.innerHTML = `<div class="day-number">${i}</div>`;
      grid.appendChild(cell);
    }

    grid.querySelectorAll('.calendar-event').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openDetail(el.dataset.id);
      });
    });
  }

  function syncCalendarFilterControls() {
    calendarFilterInputs.forEach(input => {
      if (!Object.prototype.hasOwnProperty.call(calendarFilters, input.value)) return;
      input.checked = !!calendarFilters[input.value];
    });
  }

  function initCalendarFilters() {
    syncCalendarFilterControls();
    calendarFilterInputs.forEach((input) => {
      const inputKey = input.value || 'unknown';
      bindEventOnce(input, 'change', () => {
        if (!Object.prototype.hasOwnProperty.call(calendarFilters, input.value)) return;
        calendarFilters[input.value] = input.checked;
        saveCalendarFilters(calendarFilters);
        renderCalendar();
      }, `calendar-filter-${inputKey}`);
    });
  }

  function bindCalendarNavigationEventListeners() {
    bindEventOnce($('#cal-prev'), 'click', () => {
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      renderCalendar();
    }, 'calendar-prev-month');

    bindEventOnce($('#cal-next'), 'click', () => {
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      renderCalendar();
    }, 'calendar-next-month');

    bindEventOnce($('#cal-today'), 'click', () => {
      const d = new Date();
      calYear = d.getFullYear();
      calMonth = d.getMonth();
      renderCalendar();
    }, 'calendar-current-month');
  }

  function bindToolbarFilterEventListeners() {
    bindEventOnce(searchInput, 'input', renderTable, 'toolbar-search-input');
    bindEventOnce(filterPayment, 'change', renderTable, 'toolbar-filter-payment');
    bindEventOnce(filterMonth, 'change', renderTable, 'toolbar-filter-month');
    bindEventOnce(filterPhotographer, 'change', renderTable, 'toolbar-filter-photographer');
  }

  function shouldSyncGoogleCalendarEvent(previousCustomer, nextCustomer) {
    if (!googleCalendarAutoSyncEnabled) return false;
    if (!nextCustomer || !String(nextCustomer.shootingDate || '').trim()) return false;
    const targetCalendarId = getTargetGoogleCalendarId();
    if (String(nextCustomer.google_event_calendar_id || '').trim() !== targetCalendarId) return true;
    if (!previousCustomer) return true;
    if (!String(previousCustomer.shootingDate || '').trim()) return true;
    if ((previousCustomer.shootingDate || '') !== (nextCustomer.shootingDate || '')) return true;
    if (!String(nextCustomer.google_event_id || '').trim()) return true;
    return (
      (previousCustomer.customerName || '') !== (nextCustomer.customerName || '')
      || (previousCustomer.plan || '') !== (nextCustomer.plan || '')
      || (previousCustomer.location || '') !== (nextCustomer.location || '')
      || (previousCustomer.notes || '') !== (nextCustomer.notes || '')
      || toSafeNumber(previousCustomer.revenue, 0) !== toSafeNumber(nextCustomer.revenue, 0)
    );
  }

  function toLocalDateTimeString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
  }

  function resolveShootingEventDateRange(shootingDateValue) {
    const raw = String(shootingDateValue || '').trim();
    if (!raw) return null;

    let startDate;
    if (raw.includes('T')) {
      startDate = new Date(raw);
    } else {
      startDate = new Date(`${raw}T10:00:00`);
    }
    if (Number.isNaN(startDate.getTime())) return null;
    const endDate = new Date(startDate.getTime() + (60 * 60 * 1000));
    return { startDate, endDate };
  }

  function parseBookingSlot(rawDateTimeValue) {
    const range = resolveShootingEventDateRange(rawDateTimeValue);
    if (!range) return null;

    const dateKey = `${range.startDate.getFullYear()}-${String(range.startDate.getMonth() + 1).padStart(2, '0')}-${String(range.startDate.getDate()).padStart(2, '0')}`;
    const startMinutes = (range.startDate.getHours() * 60) + range.startDate.getMinutes();
    const endMinutes = (range.endDate.getHours() * 60) + range.endDate.getMinutes();
    const startLabel = `${String(range.startDate.getHours()).padStart(2, '0')}:${String(range.startDate.getMinutes()).padStart(2, '0')}`;
    const endLabel = `${String(range.endDate.getHours()).padStart(2, '0')}:${String(range.endDate.getMinutes()).padStart(2, '0')}`;

    return {
      dateKey,
      startMinutes,
      endMinutes,
      startLabel,
      endLabel,
    };
  }

  function isBookingSlotOverlapped(sourceSlot, targetSlot) {
    if (!sourceSlot || !targetSlot) return false;
    if (sourceSlot.dateKey !== targetSlot.dateKey) return false;
    return sourceSlot.startMinutes < targetSlot.endMinutes
      && targetSlot.startMinutes < sourceSlot.endMinutes;
  }

  function findDoubleBookingConflict(candidateShootingDate, ignoreCustomerId = '') {
    const candidateSlot = parseBookingSlot(candidateShootingDate);
    if (!candidateSlot) return null;

    for (const customer of customers) {
      if (!customer) continue;
      if (ignoreCustomerId && customer.id === ignoreCustomerId) continue;
      const targetSlot = parseBookingSlot(customer.shootingDate);
      if (!targetSlot) continue;
      if (isBookingSlotOverlapped(candidateSlot, targetSlot)) {
        return { customer, slot: targetSlot };
      }
    }
    return null;
  }

  function getTomorrowDateKey() {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function renderTomorrowReminderCard() {
    if (!tomorrowReminderCard || !tomorrowReminderTitle || !tomorrowReminderList) return;

    const tomorrowKey = getTomorrowDateKey();
    const tomorrowBookings = customers
      .map((customer) => ({ customer, slot: parseBookingSlot(customer?.shootingDate) }))
      .filter((entry) => entry.slot && entry.slot.dateKey === tomorrowKey)
      .sort((a, b) => a.slot.startMinutes - b.slot.startMinutes);

    if (tomorrowBookings.length === 0) {
      tomorrowReminderCard.style.display = 'none';
      tomorrowReminderTitle.textContent = '';
      tomorrowReminderList.innerHTML = '';
      return;
    }

    tomorrowReminderTitle.textContent = t('reminderTomorrowTitle', { count: String(tomorrowBookings.length) });
    tomorrowReminderList.innerHTML = tomorrowBookings.map(({ customer, slot }) => {
      const text = t('reminderTomorrowItem', {
        customer: String(customer?.customerName || '—'),
        time: `${slot.startLabel}〜${slot.endLabel}`,
        location: String(customer?.location || t('icsUnset')),
      });
      return `<li>${escapeHtml(text)}</li>`;
    }).join('');
    tomorrowReminderCard.style.display = 'block';
  }

  function buildGoogleCalendarEventPayload(customer) {
    const range = resolveShootingEventDateRange(customer?.shootingDate);
    if (!range) return null;

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const customerName = customer?.customerName || t('icsUnset');
    const planName = resolveCustomerPlanName(customer);
    const summary = t('googleCalendarEventTitle', { customer: customerName });
    const descriptionLines = [
      `${t('googleCalendarDescPlan')}: ${planName || '—'}`,
      `${t('googleCalendarDescLocation')}: ${customer?.location || '—'}`,
      `${t('googleCalendarDescNotes')}: ${customer?.notes || customer?.details || '—'}`,
      `${t('googleCalendarDescRevenue')}: ${formatCurrency(toSafeNumber(customer?.revenue, 0))}`,
    ];

    return {
      summary,
      description: descriptionLines.join('\n'),
      location: customer?.location || '',
      start: {
        dateTime: toLocalDateTimeString(range.startDate),
        timeZone,
      },
      end: {
        dateTime: toLocalDateTimeString(range.endDate),
        timeZone,
      },
    };
  }

  async function upsertGoogleCalendarEvent(customer) {
    const payload = buildGoogleCalendarEventPayload(customer);
    if (!payload) return null;
    const accessToken = window.FirebaseService?.getGoogleAccessToken?.() || '';
    if (!accessToken) {
      throw new Error('missing_google_access_token');
    }

    const calendarId = getTargetGoogleCalendarId();
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    const existingEventId = String(customer?.google_event_id || '').trim();
    const existingEventCalendarId = String(customer?.google_event_calendar_id || '').trim();
    const shouldUpdateExisting = !!existingEventId && existingEventCalendarId === calendarId;
    const endpoint = shouldUpdateExisting
      ? `${baseUrl}/${encodeURIComponent(existingEventId)}`
      : baseUrl;
    const resolvedMethod = shouldUpdateExisting ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method: resolvedMethod,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = responseBody?.error?.message || `HTTP ${response.status}`;
      throw new Error(message);
    }
    return {
      ...responseBody,
      __calendarId: calendarId,
    };
  }

  async function runGoogleCalendarAutoSync(customerId, previousCustomer = null) {
    if (!googleCalendarAutoSyncEnabled) return;
    const customerIndex = customers.findIndex((entry) => entry.id === customerId);
    if (customerIndex === -1) return;

    const currentCustomer = customers[customerIndex];
    if (!shouldSyncGoogleCalendarEvent(previousCustomer, currentCustomer)) return;

    try {
      const eventData = await upsertGoogleCalendarEvent(currentCustomer);
      const nextEventId = String(eventData?.id || '').trim();
      if (!nextEventId) return;

      const currentEventId = String(currentCustomer.google_event_id || '').trim();
      const nextEventCalendarId = String(eventData?.__calendarId || getTargetGoogleCalendarId()).trim();
      const currentEventCalendarId = String(currentCustomer.google_event_calendar_id || '').trim();

      if (nextEventId !== currentEventId || nextEventCalendarId !== currentEventCalendarId) {
        customers[customerIndex] = {
          ...currentCustomer,
          google_event_id: nextEventId,
          google_event_calendar_id: nextEventCalendarId,
          updatedAt: new Date().toISOString(),
        };
        saveCustomers(customers);
      }
      showToast(t('googleCalendarSyncSuccess'));
      return;
    } catch (error) {
      console.error('Google Calendar auto-sync failed', error);
      showToast(t('googleCalendarSyncFailed'), 'error');
    }
  }

  // ===== Add / Edit Modal =====
  window.openModal = function (id) {
    if (!id && !checkCustomerLimit()) return;
    editingId = id || null;
    isExpenseManuallyEdited = false;
    const form = $('#customer-form');
    form.reset();
    $('#form-id').value = '';

    populateSelects();

    if (editingId) {
      const c = customers.find(x => x.id === editingId);
      if (!c) return;
      $('#modal-title').textContent = t('modalEditTitle');
      $('#form-id').value = c.id;
      fields.forEach(f => {
        const el = $(`#form-${f.key}`);
        if (!el) return;
        if (f.type === 'checkbox') {
          el.checked = !!c[f.key];
        } else if (f.type === 'select') {
          const rawVal = f.key === 'plan' ? (c[f.key] || c.planMasterId || '') : (c[f.key] || '');
          const val = f.key === 'plan'
            ? (findPlanMasterByValue(rawVal)?.name || rawVal)
            : rawVal;
          if (val && el.tagName === 'SELECT') {
            let found = false;
            for (const opt of el.options) { if (opt.value === val) { found = true; break; } }
            if (!found) {
              const opt = document.createElement('option');
              opt.value = val; opt.textContent = val;
              el.appendChild(opt);
            }
            el.value = val;
          }
        } else {
          el.value = c[f.key] || '';
        }
      });

      const planDetails = normalizePlanDetails(c.planDetails, c.revenue);
      const planNameInput = $('#form-plan-name');
      const adjustmentInput = $('#form-price-adjustment');
      const totalPriceInput = $('#form-total-price');
      const expenseInput = $('#form-expense');
      const matchedPlanMaster = findPlanMasterByValue(c?.planMasterId || c?.plan || '');
      let extraChargeItems = normalizeExtraChargeItems(c.extraChargeItems);
      if (extraChargeItems.length === 0) {
        const legacyItems = [];
        const costumePrice = toSafeNumber(c.costumePrice, 0);
        const hairPrice = toSafeNumber(c.hairMakeupPrice, 0);
        if ((c.costume || '').trim() || costumePrice > 0) {
          legacyItems.push({ name: t('labelCostume'), detail: (c.costume || '').trim(), amount: costumePrice });
        }
        if ((c.hairMakeup || '').trim() || hairPrice > 0) {
          legacyItems.push({ name: t('labelHairMakeup'), detail: (c.hairMakeup || '').trim(), amount: hairPrice });
        }
        extraChargeItems = normalizeExtraChargeItems(legacyItems);
      }
      if (planNameInput) planNameInput.value = planDetails.planName;
      setPlanBasePriceValue(planDetails.basePrice);
      setPlanBaseCostValue(toSafeNumber(planDetails.planCost, toSafeNumber(matchedPlanMaster?.cost, 0)));
      if (adjustmentInput) adjustmentInput.value = '0';
      if (totalPriceInput) totalPriceInput.value = String(planDetails.totalPrice);
      const fallbackExpense = toSafeNumber(planDetails.planCost, toSafeNumber(matchedPlanMaster?.cost, 0))
        + extraChargeItems.reduce((sum, item) => sum + toSafeNumber(item?.cost, 0), 0);
      const hasStoredExpense = Number.isFinite(Number(c.expense));
      const currentExpense = hasStoredExpense ? Number(c.expense) : fallbackExpense;
      if (expenseInput) expenseInput.value = String(currentExpense);
      isExpenseManuallyEdited = hasStoredExpense;
      renderDynamicChargeItems(extraChargeItems);
      updateGrandTotal();

      renderCustomFields(c);
    } else {
      $('#modal-title').textContent = t('modalAddTitle');
      const planNameInput = $('#form-plan-name');
      const adjustmentInput = $('#form-price-adjustment');
      const totalPriceInput = $('#form-total-price');
      const expenseInput = $('#form-expense');
      if (planNameInput) planNameInput.value = '';
      setPlanBasePriceValue(0);
      setPlanBaseCostValue(0);
      if (adjustmentInput) adjustmentInput.value = '0';
      if (totalPriceInput) totalPriceInput.value = '';
      if (expenseInput) expenseInput.value = '';
      isExpenseManuallyEdited = false;
      renderDynamicChargeItems([]);
      updateGrandTotal();
      renderCustomFields();
    }
    applyModalFieldVisibility();
    modalOverlay.style.display = 'flex';
    setTimeout(() => modalOverlay.classList.add('active'), 10);
  };

  window.closeModal = function () {
    modalOverlay.classList.remove('active');
    setTimeout(() => {
      modalOverlay.style.display = 'none';
      editingId = null;
    }, 300);
  };

  function hasCloudAuthenticatedUser() {
    return !!window.FirebaseService?.getCurrentUser?.()?.uid && getLocalValue(LOCAL_GUEST_MODE_KEY, false) !== true;
  }

  function cloneCustomerSnapshot(records = customers) {
    try {
      if (typeof structuredClone === 'function') return structuredClone(records);
      return JSON.parse(JSON.stringify(records));
    } catch {
      return Array.isArray(records) ? records.map((record) => ({ ...(record || {}) })) : [];
    }
  }

  function normalizeOperationErrorCode(err) {
    return String(err?.code || err?.name || '').trim().toLowerCase();
  }

  function buildCustomerOperationErrorMessage(operationType, err) {
    const code = normalizeOperationErrorCode(err);
    if (code.includes('permission-denied') || code.includes('forbidden')) {
      return getLocaleTextOrFallback('msgErrorPermissionDenied', '権限がありません。アクセス権をご確認ください。');
    }
    if (code.includes('unauthenticated') || code.includes('requires-auth') || code.includes('auth/')) {
      return getLocaleTextOrFallback('msgErrorAuthRequired', 'ログイン状態を確認してください。再ログイン後にお試しください。');
    }
    if (
      code.includes('network')
      || code.includes('unavailable')
      || code.includes('timeout')
      || code.includes('deadline-exceeded')
    ) {
      return getLocaleTextOrFallback('msgErrorNetwork', '通信に失敗しました。ネットワーク接続を確認して再度お試しください。');
    }
    if (operationType === 'delete') {
      return getLocaleTextOrFallback('msgCustomerDeleteFailed', '顧客データの削除に失敗しました。');
    }
    return getLocaleTextOrFallback('msgCustomerSaveFailed', '顧客データの保存に失敗しました。');
  }

  function setActionButtonLoadingState(button, isLoading, loadingText = '') {
    if (!button) return;
    if (isLoading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent || '';
      }
      button.disabled = true;
      button.classList.add('is-loading');
      if (loadingText) button.textContent = loadingText;
      return;
    }
    button.disabled = false;
    button.classList.remove('is-loading');
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
  }

  function assertCustomerWriteAccess(record = null) {
    const currentUid = String(window.FirebaseService?.getCurrentUser?.()?.uid || '').trim();
    if (!currentUid || !record || typeof record !== 'object') return;
    const ownerUid = String(record.userId || '').trim();
    if (ownerUid && ownerUid !== currentUid) {
      const err = new Error('Cross-user write operation blocked.');
      err.code = 'permission-denied';
      throw err;
    }
  }

  window.saveCustomer = async function () {
    const saveButton = document.getElementById('btn-save');
    if (saveButton?.disabled) return;
    const name = $('#form-customerName').value.trim();
    if (!name) { showToast(t('msgEnterName'), 'error'); return; }
    const operationType = editingId ? 'update' : 'create';
    const previousCustomer = editingId
      ? (customers.find((entry) => entry.id === editingId) || null)
      : null;
    const customersSnapshot = cloneCustomerSnapshot(customers);

    if (editingId) assertCustomerWriteAccess(previousCustomer);
    setActionButtonLoadingState(
      saveButton,
      true,
      getLocaleTextOrFallback('btnSaving', '保存中...')
    );

    try {
      const data = {};
      fields.forEach(f => {
        const el = $(`#form-${f.key}`);
        if (!el) return;
        if (f.type === 'checkbox') data[f.key] = el.checked;
        else if (f.type === 'number') data[f.key] = el.value ? Number(el.value) : null;
        else data[f.key] = el.value || '';
      });
      if (!isFormFieldVisible('assignedTo') && !String(data.assignedTo || '').trim()) {
        data.assignedTo = resolveDefaultAssignedToValue();
      }
      data.workflowStatus = normalizeWorkflowStatus(data.workflowStatus);

      const customFields = {};
      loadCustomFieldDefinitions().forEach(field => {
        const el = $(`#custom-field-${field.id}`);
        if (el && el.value.trim()) customFields[field.id] = el.value.trim();
      });
      data.customFields = customFields;

      const bookingConflict = findDoubleBookingConflict(data.shootingDate, editingId || '');
      if (bookingConflict) {
        const conflictCustomerName = String(bookingConflict.customer?.customerName || '—');
        const conflictLocation = String(bookingConflict.customer?.location || t('icsUnset'));
        const conflictTime = `${bookingConflict.slot.startLabel}〜${bookingConflict.slot.endLabel}`;
        const proceed = window.confirm(t('doubleBookingConfirm', {
          customer: conflictCustomerName,
          date: bookingConflict.slot.dateKey,
          time: conflictTime,
          location: conflictLocation,
        }));
        if (!proceed) return;
      }

      const planSelect = $('#form-plan');
      const selectedPlan = findPlanMasterByValue(planSelect?.value || '');
      if (selectedPlan) {
        data.planMasterId = selectedPlan.name;
        data.plan = selectedPlan.name;
      } else {
        data.planMasterId = data.plan || '';
      }

      const planNameInput = $('#form-plan-name');
      const adjustmentInput = $('#form-price-adjustment');
      const totalPriceInput = $('#form-total-price');
      const revenueInput = $('#form-revenue');
      const expenseInput = $('#form-expense');
      const planRevenue = getPlanBasePriceValue();
      const planCost = toSafeNumber(getPlanBaseCostValue(), toSafeNumber(selectedPlan?.cost, 0));
      const extraChargeItems = collectDynamicChargeItems();
      rememberDynamicItemDetails(extraChargeItems);
      const extraChargeBreakdown = extraChargeItems.reduce((sum, item) => {
        sum.revenue += toSafeNumber(item.revenue, 0);
        sum.cost += toSafeNumber(item.cost, 0);
        return sum;
      }, { revenue: 0, cost: 0 });
      if (adjustmentInput) adjustmentInput.value = '0';
      const totalFromBreakdown = planRevenue + extraChargeBreakdown.revenue;
      const finalRevenue = toSafeNumber(updateGrandTotal(), totalFromBreakdown);
      const fallbackExpense = planCost + extraChargeBreakdown.cost;
      const finalExpense = toSafeNumber(expenseInput?.value, fallbackExpense);
      if (expenseInput) expenseInput.value = String(finalExpense);
      const finalProfit = finalRevenue - finalExpense;
      if (totalPriceInput) totalPriceInput.value = String(finalRevenue);
      if (revenueInput) revenueInput.value = String(finalRevenue);
      updateProfitDisplay(finalProfit);
      data.revenue = finalRevenue;
      data.expense = finalExpense;
      data.profit = finalProfit;
      data.planCost = planCost;
      data.extraChargeItems = extraChargeItems;
      data.costumePrice = 0;
      data.hairMakeupPrice = 0;
      data.costume = '';
      data.hairMakeup = '';

      const rawPlanDetails = {
        planName: planNameInput?.value?.trim() || selectedPlan?.name || '',
        basePrice: planRevenue,
        planCost,
        options: '',
        totalPrice: finalRevenue,
      };
      data.planDetails = normalizePlanDetails(rawPlanDetails, data.revenue);

      if (editingId) {
        const idx = customers.findIndex(c => c.id === editingId);
        if (idx === -1) {
          const notFoundError = new Error('Customer not found');
          notFoundError.code = 'not-found';
          throw notFoundError;
        }
        assertCustomerWriteAccess(customers[idx]);
        customers[idx] = { ...customers[idx], ...data, updatedAt: new Date().toISOString() };
      } else {
        data.id = generateId();
        data.createdAt = new Date().toISOString();
        data.updatedAt = data.createdAt;
        customers.push(data);
      }

      await saveCustomers(customers, { propagateError: hasCloudAuthenticatedUser() });

      showToast(editingId ? t('msgUpdated') : t('msgCreated'));
      const savedCustomerId = data.id || editingId;
      runGoogleCalendarAutoSync(
        savedCustomerId,
        previousCustomer ? { ...previousCustomer } : null
      ).catch((error) => {
        console.error('Google Calendar sync scheduling failed', error);
      });
      closeModal();
      renderTable();
      if (calendarView.classList.contains('active')) renderCalendar();
    } catch (err) {
      customers = customersSnapshot;
      saveCustomers(customers).catch(() => {});
      const normalizedCode = normalizeOperationErrorCode(err);
      console.error('[Customer Save] failed', {
        operationType,
        editingId,
        code: normalizedCode || 'unknown',
        message: err?.message || '',
        error: err,
      });
      const userMessage = buildCustomerOperationErrorMessage(operationType, err);
      showToast(
        normalizedCode ? `${userMessage} (${normalizedCode})` : userMessage,
        'error'
      );
    } finally {
      setActionButtonLoadingState(
        saveButton,
        false,
        getLocaleTextOrFallback('btnSaving', '保存中...')
      );
    }
  };

  // ===== Detail Panel =====
  function openDetail(id) {
    const c = customers.find(x => x.id === id);
    if (!c) return;
    editingId = id; // Set editingId for task management

    // Basic fields
    $('#detail-name').textContent = toDisplayText(c.customerName);
    $('#detail-contact').textContent = toDisplayText(c.contact);
    $('#detail-shooting-date').textContent = toDisplayText(formatDate(c.shootingDate));
    $('#detail-location').textContent = toDisplayText(c.location);
    $('#detail-plan').textContent = toDisplayText(resolveCustomerPlanName(c));
    const detailWorkflowStatus = $('#detail-workflow-status');
    if (detailWorkflowStatus) detailWorkflowStatus.innerHTML = renderWorkflowStatusBadge(c);
    $('#detail-revenue').textContent = formatCurrency(c.revenue);
    $('#detail-payment').innerHTML = c.paymentChecked ? `<span class="badge badge-success">${t('paid')}</span>` : `<span class="badge badge-warning">${t('unpaid')}</span>`;
    $('#detail-notes').textContent = toDisplayText(c.notes);
    const planDetails = normalizePlanDetails(c.planDetails, c.revenue);
    const detailPlanName = $('#detail-plan-name');
    const detailBasePrice = $('#detail-base-price');
    const detailTotalPrice = $('#detail-total-price');
    if (detailPlanName) detailPlanName.textContent = toDisplayText(planDetails.planName || resolveCustomerPlanName(c));
    if (detailBasePrice) detailBasePrice.textContent = formatCurrency(planDetails.basePrice);
    if (detailTotalPrice) detailTotalPrice.textContent = formatCurrency(planDetails.totalPrice);

    const detailContainer = $('#detail-body-container');
    detailContainer.querySelectorAll('.custom-detail-field').forEach(el => el.remove());
    const defs = loadCustomFieldDefinitions();
    defs.forEach(field => {
      const value = c.customFields && c.customFields[field.id];
      if (!value) return;
      const item = document.createElement('div');
      item.className = 'detail-item custom-detail-field';
      item.innerHTML = `<label class="detail-label">${escapeHtml(field.label)}</label><p class="detail-value">${escapeHtml(value)}</p>`;
      detailContainer.insertBefore(item, detailContainer.querySelector('.full-width'));
    });

    // Task Management
    renderTasks(c);

    // Button actions
    $('#detail-invoice-btn').onclick = () => { closeDetailModal(); setTimeout(() => openInvoiceBuilderModal(id), 200); };
    $('#detail-edit-btn').onclick = () => { closeDetailModal(); setTimeout(() => openModal(id), 200); };
    $('#detail-delete-btn').onclick = () => { closeDetailModal(); setTimeout(() => openConfirm(id), 200); };

    detailOverlay.style.display = 'flex';
    setTimeout(() => detailOverlay.classList.add('active'), 10);
  }

  window.openDetail = openDetail; // Make it globally accessible

  window.closeDetailModal = function () {
    detailOverlay.classList.remove('active');
    setTimeout(() => { detailOverlay.style.display = 'none'; }, 300);
  };

  // Legacy alias if needed
  window.closeDetail = window.closeDetailModal;

  // ===== Delete =====
  window.openConfirm = function (id) {
    deletingId = id;
    confirmOverlay.style.display = 'flex';
    setTimeout(() => confirmOverlay.classList.add('active'), 10);
  };
  window.closeConfirmModal = function () {
    confirmOverlay.classList.remove('active');
    setTimeout(() => {
      confirmOverlay.style.display = 'none';
      deletingId = null;
    }, 300);
  };
  window.closeConfirm = window.closeConfirmModal;

  async function handleConfirmDeleteClick() {
    if (deletingId) {
      const deleteButton = document.getElementById('btn-confirm-delete');
      if (deleteButton?.disabled) return;
      const customersSnapshot = cloneCustomerSnapshot(customers);
      setActionButtonLoadingState(
        deleteButton,
        true,
        getLocaleTextOrFallback('btnDeleting', '削除中...')
      );
      try {
        const target = customers.find(c => c.id === deletingId);
        if (!target) {
          const notFoundError = new Error('Customer not found');
          notFoundError.code = 'not-found';
          throw notFoundError;
        }
        assertCustomerWriteAccess(target);
        customers = customers.filter(c => c.id !== deletingId);
        await saveCustomers(customers, { propagateError: hasCloudAuthenticatedUser() });
        showToast(t('msgDeleted'));
        closeConfirmModal();
        renderTable();
        if (calendarView.classList.contains('active')) renderCalendar();
      } catch (err) {
        customers = customersSnapshot;
        saveCustomers(customers).catch(() => {});
        const normalizedCode = normalizeOperationErrorCode(err);
        console.error('[Customer Delete] failed', {
          deletingId,
          code: normalizedCode || 'unknown',
          message: err?.message || '',
          error: err,
        });
        const userMessage = buildCustomerOperationErrorMessage('delete', err);
        showToast(
          normalizedCode ? `${userMessage} (${normalizedCode})` : userMessage,
          'error'
        );
      } finally {
        setActionButtonLoadingState(
          deleteButton,
          false,
          getLocaleTextOrFallback('btnDeleting', '削除中...')
        );
      }
    }
  }

  // ===== Settings =====
  window.closeSettings = function () { settingsOverlay.classList.remove('active'); };

  function resetPlanMasterFormInputs() {
    const editInput = $('#edit-plan-index');
    const nameInput = $('#add-plan-name');
    const priceInput = $('#add-plan-price');
    const costInput = $('#add-plan-cost');
    if (editInput) editInput.value = '';
    if (nameInput) nameInput.value = '';
    if (priceInput) priceInput.value = '';
    if (costInput) costInput.value = '';
  }

  function setPlanMasterFormByIndex(index) {
    const plan = planMaster[index];
    if (!plan) return;
    const editInput = $('#edit-plan-index');
    const nameInput = $('#add-plan-name');
    const priceInput = $('#add-plan-price');
    const costInput = $('#add-plan-cost');
    if (editInput) editInput.value = String(index);
    if (nameInput) nameInput.value = plan.name;
    if (priceInput) priceInput.value = String(plan.price);
    if (costInput) costInput.value = String(toSafeNumber(plan.cost, 0));
  }

  function savePlanMasterFromForm() {
    const editInput = $('#edit-plan-index');
    const nameInput = $('#add-plan-name');
    const priceInput = $('#add-plan-price');
    const costInput = $('#add-plan-cost');
    const name = nameInput?.value?.trim() || '';
    if (!name) {
      showToast(t('msgPlanNameRequired'), 'error');
      return;
    }

    const editIndexRaw = editInput?.value ?? '';
    const editIndex = editIndexRaw === '' ? -1 : Number(editIndexRaw);
    const hasEditTarget = Number.isInteger(editIndex) && editIndex >= 0 && editIndex < planMaster.length;
    const duplicateIndex = planMaster.findIndex((plan, idx) => idx !== editIndex && plan.name.toLowerCase() === name.toLowerCase());
    if (duplicateIndex !== -1) {
      showToast(t('msgPlanDuplicate'), 'error');
      return;
    }

    const existingColor = hasEditTarget
      ? normalizeHexColor(planMaster[editIndex]?.color, getDefaultPlanTagColor(name))
      : getDefaultPlanTagColor(name);

    const nextPlan = normalizePlanMasterItem({
      name,
      price: priceInput?.value,
      cost: costInput?.value,
      color: existingColor,
    });

    if (hasEditTarget) {
      planMaster[editIndex] = nextPlan;
    } else {
      planMaster.push(nextPlan);
    }

    savePlanMaster(planMaster);
    resetPlanMasterFormInputs();
    renderSettings();
    populateSelects();
  }

  function removePlanMasterByIndex(index) {
    if (!planMaster[index]) return;
    if (!confirm(t('confirmDeleteMessage') || 'Are you sure?')) return;
    planMaster.splice(index, 1);
    savePlanMaster(planMaster);
    resetPlanMasterFormInputs();
    renderSettings();
    populateSelects();
  }

  function updatePlanColorByIndex(index, color) {
    if (!planMaster[index]) return;
    const nextColor = normalizeHexColor(color, getDefaultPlanTagColor(planMaster[index].name));
    const nextPlans = [...planMaster];
    nextPlans[index] = normalizePlanMasterItem({
      ...nextPlans[index],
      color: nextColor,
    });
    savePlanMaster(nextPlans);
    renderSettings();
    renderTable();
    if (editingId) openDetail(editingId);
  }

  function refreshDynamicItemSuggestionInputs() {
    getDynamicItemRows().forEach((row) => {
      renderDynamicItemNameDatalist(row);
      renderDynamicItemDetailDatalist(row);
    });
  }

  function persistDynamicItemHints(nextList) {
    const normalized = normalizeDynamicItemNameSuggestions(nextList)
      .filter((name) => !isPlanCategoryName(name));
    saveDynamicItemNameSuggestions(normalized);
    options = { ...(options || {}), dynamicItemHints: normalized };
    saveOptions(options);
    const nextMap = normalizeDynamicItemSuggestionMap(dynamicItemSuggestionMap);
    delete nextMap[t('labelPlan')];
    delete nextMap.プラン;
    delete nextMap.plan;
    saveDynamicItemSuggestionMap(nextMap);
    refreshDynamicItemSuggestionInputs();
    syncDynamicItemRowsWithSettings();
    return normalized;
  }

  function addDynamicItemHintFromSettings() {
    const input = $('#add-dynamic-item-name');
    const name = (input?.value || '').trim();
    if (!name) {
      showToast(t('msgDynamicItemNameRequired'), 'error');
      return;
    }
    if (isPlanCategoryName(name)) {
      showToast(t('msgDynamicItemPlanBlockedAdd'), 'error');
      return;
    }

    const current = getDynamicItemNameSuggestions();
    if (current.some((item) => item.toLowerCase() === name.toLowerCase())) {
      showToast(t('msgDynamicItemNameDuplicate'), 'error');
      return;
    }

    persistDynamicItemHints([name, ...current]);
    if (input) input.value = '';
    renderSettings();
  }

  function updateDynamicItemHintByIndex(index, nextName) {
    const current = getDynamicItemNameSuggestions();
    if (!current[index]) return;
    const previousName = current[index];

    const name = String(nextName || '').trim();
    if (!name) {
      showToast(t('msgDynamicItemNameRequired'), 'error');
      return;
    }
    if (isPlanCategoryName(name)) {
      showToast(t('msgDynamicItemPlanBlockedSet'), 'error');
      return;
    }

    const duplicateIndex = current.findIndex((item, idx) => idx !== index && item.toLowerCase() === name.toLowerCase());
    if (duplicateIndex !== -1) {
      showToast(t('msgDynamicItemNameDuplicate'), 'error');
      return;
    }

    const previousKey = getDynamicItemSuggestionKey(previousName);
    const nextKey = getDynamicItemSuggestionKey(name);
    if (previousKey !== nextKey) {
      const nextMap = normalizeDynamicItemSuggestionMap(dynamicItemSuggestionMap);
      const previousDetails = Array.isArray(nextMap[previousKey]) ? nextMap[previousKey] : [];
      const nextDetails = Array.isArray(nextMap[nextKey]) ? nextMap[nextKey] : [];
      const mergedDetails = normalizeDynamicItemDetailList([...previousDetails, ...nextDetails]);
      if (mergedDetails.length > 0) nextMap[nextKey] = mergedDetails;
      else delete nextMap[nextKey];
      delete nextMap[previousKey];
      saveDynamicItemSuggestionMap(nextMap);
    }

    current[index] = name;
    persistDynamicItemHints(current);
    renderSettings();
  }

  function removeDynamicItemHintByIndex(index) {
    const current = getDynamicItemNameSuggestions();
    if (!current[index]) return;
    if (!confirm(t('confirmDeleteMessage') || 'Are you sure?')) return;
    const removedName = current[index];
    current.splice(index, 1);
    const removedKey = getDynamicItemSuggestionKey(removedName);
    const nextMap = normalizeDynamicItemSuggestionMap(dynamicItemSuggestionMap);
    delete nextMap[removedKey];
    saveDynamicItemSuggestionMap(nextMap);
    persistDynamicItemHints(current);
    renderSettings();
  }

  function addDynamicItemDetailFromSettings(categoryIndex) {
    const categories = getDynamicItemNameSuggestions();
    const categoryName = categories[categoryIndex];
    if (!categoryName) return;
    const detailInput = $(`#add-dynamic-item-detail-name-${categoryIndex}`);
    const revenueInput = $(`#add-dynamic-item-detail-revenue-${categoryIndex}`);
    const costInput = $(`#add-dynamic-item-detail-cost-${categoryIndex}`);
    const detail = String(detailInput?.value || '').trim();
    const revenue = toSafeNumber(revenueInput?.value, 0);
    const cost = toSafeNumber(costInput?.value, 0);
    if (!detail) {
      showToast(t('msgDynamicDetailRequired'), 'error');
      return;
    }

    const key = getDynamicItemSuggestionKey(categoryName);
    const nextMap = normalizeDynamicItemSuggestionMap(dynamicItemSuggestionMap);
    const currentDetails = Array.isArray(nextMap[key]) ? [...nextMap[key]] : [];
    if (currentDetails.some((entry) => String(entry?.label || '').trim().toLowerCase() === detail.toLowerCase())) {
      showToast(t('msgDynamicDetailDuplicate'), 'error');
      return;
    }
    nextMap[key] = normalizeDynamicItemDetailList([{ label: detail, revenue, cost }, ...currentDetails]);
    saveDynamicItemSuggestionMap(nextMap);
    if (detailInput) detailInput.value = '';
    if (revenueInput) revenueInput.value = '';
    if (costInput) costInput.value = '';
    syncDynamicItemRowsWithSettings();
    renderSettings();
  }

  function updateDynamicItemDetailByIndex(categoryIndex, detailIndex, nextDetailValue, nextRevenueValue, nextCostValue) {
    const categories = getDynamicItemNameSuggestions();
    const categoryName = categories[categoryIndex];
    if (!categoryName) return;
    const key = getDynamicItemSuggestionKey(categoryName);
    const nextMap = normalizeDynamicItemSuggestionMap(dynamicItemSuggestionMap);
    const details = Array.isArray(nextMap[key]) ? normalizeDynamicItemDetailList(nextMap[key]) : [];
    if (!details[detailIndex]) return;

    const detail = String(nextDetailValue || '').trim();
    const revenue = toSafeNumber(nextRevenueValue, 0);
    const cost = toSafeNumber(nextCostValue, 0);
    if (!detail) {
      showToast(t('msgDynamicDetailRequired'), 'error');
      return;
    }
    const duplicateIndex = details.findIndex((entry, index) => (
      index !== detailIndex
      && String(entry?.label || '').trim().toLowerCase() === detail.toLowerCase()
    ));
    if (duplicateIndex !== -1) {
      showToast(t('msgDynamicDetailDuplicate'), 'error');
      return;
    }

    details[detailIndex] = { label: detail, revenue, cost };
    nextMap[key] = normalizeDynamicItemDetailList(details);
    saveDynamicItemSuggestionMap(nextMap);
    syncDynamicItemRowsWithSettings();
    renderSettings();
  }

  function removeDynamicItemDetailByIndex(categoryIndex, detailIndex) {
    const categories = getDynamicItemNameSuggestions();
    const categoryName = categories[categoryIndex];
    if (!categoryName) return;
    if (!confirm(t('confirmDeleteMessage') || 'Are you sure?')) return;
    const key = getDynamicItemSuggestionKey(categoryName);
    const nextMap = normalizeDynamicItemSuggestionMap(dynamicItemSuggestionMap);
    const details = Array.isArray(nextMap[key]) ? normalizeDynamicItemDetailList(nextMap[key]) : [];
    if (!details[detailIndex]) return;

    details.splice(detailIndex, 1);
    if (details.length > 0) nextMap[key] = normalizeDynamicItemDetailList(details);
    else delete nextMap[key];
    saveDynamicItemSuggestionMap(nextMap);
    syncDynamicItemRowsWithSettings();
    renderSettings();
  }

  function renderSettings() {
    const container = $('#settings-list');
    if (!container) return;
    container.innerHTML = '';
    const languageOptionRows = getLanguageOptionDefinitions().map(({ code, label }) => {
      const allowed = canUseLanguageByPlan(code, currentUserPlan);
      return `
      <option value="${escapeHtml(code)}" ${currentLang === code ? 'selected' : ''} ${allowed ? '' : 'disabled'}>
        ${escapeHtml(label)}
      </option>
    `;
    }).join('');
    const currencyOptionRows = Object.entries(CURRENCY_CONFIG).map(([code, config]) => `
      <option value="${escapeHtml(code)}" ${currentCurrency === code ? 'selected' : ''}>${escapeHtml(`${code} (${config.symbol})`)}</option>
    `).join('');

    const planRows = planMaster.length === 0
      ? `<div class="settings-item"><span>${escapeHtml(t('settingsPlanEmpty'))}</span></div>`
      : planMaster.map((plan, index) => `
        <div class="settings-item">
          <div style="flex:1;">
            <div style="font-weight:600;">${escapeHtml(plan.name)}</div>
            <div style="font-size:0.85rem;color:var(--text-muted);">${escapeHtml(t('settingsPlanSummary', { revenue: formatCurrency(plan.price), cost: formatCurrency(plan.cost) }))}</div>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <label class="settings-color-label" title="${escapeHtml(t('settingsPlanColor'))}">
              <span class="settings-color-dot" style="background:${resolvePlanTagColor(plan.name)};"></span>
              <input type="color" class="settings-color-input" data-plan-color="${index}" value="${resolvePlanTagColor(plan.name)}" aria-label="${escapeHtml(t('settingsPlanColor'))}">
            </label>
            <button type="button" class="btn-icon-sm" data-plan-edit="${index}" title="${escapeHtml(t('edit'))}">✏️</button>
            <button type="button" class="btn-icon-sm" data-plan-remove="${index}" title="${escapeHtml(t('delete'))}">✕</button>
          </div>
        </div>
      `).join('');

    const dynamicItemHintRows = getDynamicItemNameSuggestions();
    const dynamicItemRows = dynamicItemHintRows.length === 0
      ? `<div class="settings-item"><span>${escapeHtml(t('settingsDynamicItemEmpty'))}</span></div>`
      : dynamicItemHintRows.map((itemName, index) => {
        const detailOptions = getDynamicItemDetailEntries(itemName);
        const detailRows = detailOptions.length === 0
          ? `<div class="settings-detail-empty">${escapeHtml(t('settingsDynamicDetailEmpty'))}</div>`
          : detailOptions.map((detailEntry, detailIndex) => `
            <div class="settings-detail-row">
              <input
                type="text"
                class="settings-inline-input settings-inline-input-name"
                data-dynamic-detail-name-input="${index}:${detailIndex}"
                value="${escapeHtml(detailEntry.label || '')}"
                placeholder="${escapeHtml(t('settingsDynamicDetailNamePlaceholder'))}"
              />
              <input
                type="number"
                class="settings-inline-input settings-inline-input-revenue"
                data-dynamic-detail-revenue-input="${index}:${detailIndex}"
                value="${toSafeNumber(detailEntry.revenue, 0)}"
                min="0"
                step="1"
                placeholder="${escapeHtml(t('settingsDynamicRevenuePlaceholder'))}"
              />
              <input
                type="number"
                class="settings-inline-input settings-inline-input-cost"
                data-dynamic-detail-cost-input="${index}:${detailIndex}"
                value="${toSafeNumber(detailEntry.cost, 0)}"
                min="0"
                step="1"
                placeholder="${escapeHtml(t('settingsDynamicCostPlaceholder'))}"
              />
              <button type="button" class="btn-icon-sm" data-dynamic-detail-save="${index}:${detailIndex}" title="${escapeHtml(t('save'))}">💾</button>
              <button type="button" class="btn-icon-sm" data-dynamic-detail-remove="${index}:${detailIndex}" title="${escapeHtml(t('delete'))}">✕</button>
            </div>
          `).join('');
        return `
        <div class="settings-item settings-master-item">
          <div class="settings-master-head">
            <input
              type="text"
              class="settings-inline-input"
              data-dynamic-item-input="${index}"
              value="${escapeHtml(itemName)}"
              placeholder="${escapeHtml(t('settingsDynamicCategoryPlaceholder'))}"
            />
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn-icon-sm" data-dynamic-item-save="${index}" title="${escapeHtml(t('save'))}">💾</button>
              <button type="button" class="btn-icon-sm" data-dynamic-item-remove="${index}" title="${escapeHtml(t('delete'))}">✕</button>
            </div>
          </div>
          <div class="settings-detail-list">${detailRows}</div>
          <div class="settings-detail-add">
            <input
              type="text"
              class="settings-inline-input settings-inline-input-name"
              id="add-dynamic-item-detail-name-${index}"
              data-dynamic-detail-add-input="${index}"
              placeholder="${escapeHtml(t('settingsDynamicDetailNamePlaceholder'))}"
            />
            <input
              type="number"
              class="settings-inline-input settings-inline-input-revenue"
              id="add-dynamic-item-detail-revenue-${index}"
              min="0"
              step="1"
              placeholder="${escapeHtml(t('settingsDynamicRevenuePlaceholder'))}"
            />
            <input
              type="number"
              class="settings-inline-input settings-inline-input-cost"
              id="add-dynamic-item-detail-cost-${index}"
              min="0"
              step="1"
              placeholder="${escapeHtml(t('settingsDynamicCostPlaceholder'))}"
            />
            <button type="button" class="btn btn-secondary btn-sm" data-dynamic-detail-add="${index}">${escapeHtml(t('settingsDynamicAddDetail'))}</button>
          </div>
        </div>
      `;
      }).join('');

    const dashboardRows = dashboardConfig.map((item, index) => {
      const label = getDashboardCardLabel(item.key);
      const disableUp = index === 0 ? 'disabled' : '';
      const disableDown = index === dashboardConfig.length - 1 ? 'disabled' : '';
      const checked = item.visible ? 'checked' : '';
      return `
        <div class="settings-item dashboard-config-row">
          <label class="dashboard-config-label">
            <input type="checkbox" data-dashboard-visible="${item.key}" ${checked}>
            <span>${escapeHtml(label)}</span>
          </label>
          <div class="dashboard-config-order">
            <button type="button" class="btn-icon-sm" data-dashboard-move-key="${item.key}" data-dashboard-move-dir="-1" ${disableUp} title="${escapeHtml(t('moveUp'))}">↑</button>
            <button type="button" class="btn-icon-sm" data-dashboard-move-key="${item.key}" data-dashboard-move-dir="1" ${disableDown} title="${escapeHtml(t('moveDown'))}">↓</button>
          </div>
        </div>
      `;
    }).join('');

    const formVisibilityRows = FORM_FIELD_VISIBILITY_DEFINITIONS.map((item) => `
      <div class="settings-item dashboard-config-row">
        <label class="dashboard-config-label">
          <input type="checkbox" data-form-visibility-key="${item.key}" ${isFormFieldVisible(item.key) ? 'checked' : ''}>
          <span>${escapeHtml(getFormFieldVisibilityLabel(item.key))}</span>
        </label>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="settings-section">
        <h3>${escapeHtml(t('settingsStudioSection'))}</h3>
        <div class="settings-item dashboard-config-row">
          <label class="dashboard-config-label" for="settings-studio-name">${escapeHtml(t('settingsStudioNameLabel'))}</label>
          <input
            type="text"
            id="settings-studio-name"
            class="ui-button-standard"
            style="min-width: 180px;"
            value="${escapeHtml(currentStudioName)}"
            placeholder="${escapeHtml(t('settingsStudioNamePlaceholder'))}"
          >
        </div>
        <div style="display:flex; justify-content:flex-end;">
          <button type="button" class="btn btn-primary btn-sm" id="btn-save-studio-name">${escapeHtml(t('settingsStudioNameSave'))}</button>
        </div>
      </div>
      <div class="settings-section">
        <h3>${escapeHtml(t('settingsLanguageSection'))}</h3>
        <div class="settings-item dashboard-config-row">
          <label class="dashboard-config-label" for="settings-language-select">${escapeHtml(t('settingsLanguageLabel'))}</label>
          <select id="settings-language-select" class="ui-button-standard" style="min-width: 180px;">${languageOptionRows}</select>
        </div>
        <div class="settings-detail-empty">${escapeHtml(t('settingsLanguageHelp'))}</div>
      </div>
      <div class="settings-section">
        <h3>${escapeHtml(t('settingsCurrencySection'))}</h3>
        <div class="settings-item dashboard-config-row">
          <label class="dashboard-config-label" for="settings-currency-select">${escapeHtml(t('currency'))}</label>
          <select id="settings-currency-select" class="ui-button-standard" style="min-width: 180px;">${currencyOptionRows}</select>
        </div>
        <div class="settings-detail-empty">${escapeHtml(t('settingsCurrencyHelp'))}</div>
      </div>
      <div class="settings-section">
        <h3>${escapeHtml(t('settingsAccentSection'))}</h3>
        <div class="settings-item dashboard-config-row">
          <label class="dashboard-config-label" for="settings-accent-color">${escapeHtml(t('settingsAccentLabel'))}</label>
          <div class="settings-accent-control">
            <input
              type="color"
              id="settings-accent-color"
              class="settings-color-input settings-accent-input"
              value="${escapeHtml(currentAccentColor)}"
              aria-label="${escapeHtml(t('settingsAccentLabel'))}"
            >
            <button type="button" class="btn btn-secondary btn-sm" id="btn-reset-accent-color">${escapeHtml(t('settingsAccentReset'))}</button>
          </div>
        </div>
        <div class="settings-detail-empty">${escapeHtml(t('settingsAccentHelp'))}</div>
      </div>
      <div class="settings-section">
        <h3>${escapeHtml(t('settingsPlanSection'))}</h3>
        <div class="settings-item-list">${planRows}</div>
        <div class="settings-add-box" style="display:grid; grid-template-columns:1fr; gap:8px;">
          <input type="hidden" id="edit-plan-index" value="">
          <input type="text" id="add-plan-name" placeholder="${escapeHtml(t('settingsPlanNamePlaceholder'))}">
          <input type="number" id="add-plan-price" min="0" step="1" placeholder="${escapeHtml(t('settingsPlanRevenuePlaceholder'))}">
          <input type="number" id="add-plan-cost" min="0" step="1" placeholder="${escapeHtml(t('settingsPlanCostPlaceholder'))}">
          <div style="display:flex; gap:8px;">
            <button type="button" class="btn btn-primary btn-sm" id="btn-plan-save">${t('settingsAddBtn')}</button>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-plan-reset">${escapeHtml(t('clear'))}</button>
          </div>
        </div>
      </div>
      <div class="settings-section">
        <h3>${escapeHtml(t('settingsDynamicSection'))}</h3>
        <div class="settings-item-list">${dynamicItemRows}</div>
        <div class="settings-add-box" style="display:grid; grid-template-columns:1fr auto; gap:8px;">
          <input type="text" id="add-dynamic-item-name" placeholder="${escapeHtml(t('settingsDynamicCategoryPlaceholder'))}">
          <button type="button" class="btn btn-primary btn-sm" id="btn-dynamic-item-add">${escapeHtml(t('settingsDynamicAddCategory'))}</button>
        </div>
      </div>
      <div class="settings-section">
        <h3>${escapeHtml(t('settingsGoogleCalendarSection'))}</h3>
        <div class="settings-item dashboard-config-row">
          <label class="dashboard-config-label">
            <input type="checkbox" id="settings-google-calendar-sync" ${googleCalendarAutoSyncEnabled ? 'checked' : ''}>
            <span>${escapeHtml(t('settingsGoogleCalendarAutoSync'))}</span>
          </label>
        </div>
        <div class="settings-detail-empty">${escapeHtml(t('settingsGoogleCalendarAutoSyncDesc'))}</div>
        <div class="settings-item dashboard-config-row">
          <label class="dashboard-config-label" for="settings-google-calendar-select">${escapeHtml(t('settingsGoogleCalendarSelectLabel'))}</label>
          <div style="display:flex; align-items:center; gap:6px; min-width: 240px;">
            <select id="settings-google-calendar-select" class="ui-button-standard" style="flex:1; min-width:0;"></select>
            <button type="button" class="btn-icon-sm" id="settings-google-calendar-refresh" title="${escapeHtml(t('settingsGoogleCalendarRefresh'))}" aria-label="${escapeHtml(t('settingsGoogleCalendarRefresh'))}">↻</button>
          </div>
        </div>
        <div class="settings-detail-empty" id="settings-google-calendar-status">${escapeHtml(t('settingsGoogleCalendarSelectHelp'))}</div>
      </div>
      <div class="settings-section">
        <h3>${escapeHtml(t('settingsDisplaySection'))}</h3>
        <div class="settings-item-list dashboard-config-list">${dashboardRows}</div>
      </div>
      <div class="settings-section">
        <h3>${escapeHtml(t('settingsInputVisibilitySection'))}</h3>
        <div class="settings-item-list dashboard-config-list">${formVisibilityRows}</div>
      </div>
    `;

    bindEventOnce(container.querySelector('#btn-plan-save'), 'click', savePlanMasterFromForm, 'plan-master-save');
    bindEventOnce(container.querySelector('#btn-plan-reset'), 'click', resetPlanMasterFormInputs, 'plan-master-reset');
    bindEventOnce(container.querySelector('#btn-dynamic-item-add'), 'click', addDynamicItemHintFromSettings, 'dynamic-item-add');
    bindEventOnce(container.querySelector('#btn-save-studio-name'), 'click', () => {
      const nameInput = container.querySelector('#settings-studio-name');
      setStudioName(nameInput?.value || '');
      if (nameInput) nameInput.value = currentStudioName;
      showToast(t('settingsSaved'));
    }, 'settings-studio-name-save');
    bindEventOnce(container.querySelector('#settings-studio-name'), 'keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      const nameInput = container.querySelector('#settings-studio-name');
      setStudioName(nameInput?.value || '');
      if (nameInput) nameInput.value = currentStudioName;
      showToast(t('settingsSaved'));
    }, 'settings-studio-name-enter');
    bindEventOnce(container.querySelector('#settings-language-select'), 'change', (event) => {
      const nextLang = String(event?.target?.value || '').trim();
      if (!nextLang) return;
      if (!canUseLanguageByPlan(nextLang, currentUserPlan)) {
        showToast(t('planFeatureLanguageLocked') || 'Upgrade required to use this language.', 'error');
        const select = container.querySelector('#settings-language-select');
        if (select) select.value = currentLang;
        return;
      }
      applyInvoiceLocaleDefaults(nextLang, { force: true });
      updateUITS(nextLang);
      if (settingsOverlay?.classList.contains('active')) {
        renderSettings();
        renderPlanManagementSection();
        loadInvoiceSettings();
      }
    }, 'settings-language-select-change');
    bindEventOnce(container.querySelector('#settings-currency-select'), 'change', (event) => {
      const nextCurrency = String(event?.target?.value || '').trim();
      if (!nextCurrency) return;
      updateCurrency(nextCurrency);
    }, 'settings-currency-select-change');

    const accentColorInput = container.querySelector('#settings-accent-color');
    if (accentColorInput) {
      accentColorInput.value = normalizeAccentColor(currentAccentColor);
      bindEventOnce(accentColorInput, 'input', (event) => {
        const nextColor = String(event?.target?.value || '').trim();
        applyAccentColor(nextColor, { persist: false });
      }, 'settings-accent-color-input');
      bindEventOnce(accentColorInput, 'change', (event) => {
        const nextColor = String(event?.target?.value || '').trim();
        applyAccentColor(nextColor, { persist: true });
        showToast(t('settingsSaved'));
      }, 'settings-accent-color-change');
    }

    bindEventOnce(container.querySelector('#btn-reset-accent-color'), 'click', () => {
      applyAccentColor(DEFAULT_ACCENT_COLOR, { persist: true });
      const input = container.querySelector('#settings-accent-color');
      if (input) input.value = currentAccentColor;
      showToast(t('settingsSaved'));
    }, 'settings-accent-color-reset');

    container.querySelectorAll('button[data-plan-edit]').forEach((button) => {
      const index = Number(button.dataset.planEdit);
      bindEventOnce(button, 'click', () => setPlanMasterFormByIndex(index), `plan-master-edit-${index}`);
    });

    container.querySelectorAll('button[data-plan-remove]').forEach((button) => {
      const index = Number(button.dataset.planRemove);
      bindEventOnce(button, 'click', () => removePlanMasterByIndex(index), `plan-master-remove-${index}`);
    });

    container.querySelectorAll('input[data-plan-color]').forEach((input) => {
      const index = Number(input.dataset.planColor);
      bindEventOnce(input, 'input', () => updatePlanColorByIndex(index, input.value), `plan-master-color-${index}`);
      bindEventOnce(input, 'change', () => updatePlanColorByIndex(index, input.value), `plan-master-color-change-${index}`);
    });

    const addDynamicItemNameInput = container.querySelector('#add-dynamic-item-name');
    bindEventOnce(addDynamicItemNameInput, 'keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      addDynamicItemHintFromSettings();
    }, 'dynamic-item-add-enter');

    container.querySelectorAll('button[data-dynamic-item-save]').forEach((button) => {
      const index = Number(button.dataset.dynamicItemSave);
      bindEventOnce(button, 'click', () => {
        const input = container.querySelector(`input[data-dynamic-item-input="${index}"]`);
        updateDynamicItemHintByIndex(index, input?.value || '');
      }, `dynamic-item-save-${index}`);
    });

    container.querySelectorAll('button[data-dynamic-item-remove]').forEach((button) => {
      const index = Number(button.dataset.dynamicItemRemove);
      bindEventOnce(button, 'click', () => removeDynamicItemHintByIndex(index), `dynamic-item-remove-${index}`);
    });

    container.querySelectorAll('input[data-dynamic-detail-add-input]').forEach((input) => {
      const index = Number(input.dataset.dynamicDetailAddInput);
      bindEventOnce(input, 'keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        addDynamicItemDetailFromSettings(index);
      }, `dynamic-detail-add-enter-${index}`);
    });

    container.querySelectorAll('button[data-dynamic-detail-add]').forEach((button) => {
      const index = Number(button.dataset.dynamicDetailAdd);
      bindEventOnce(button, 'click', () => addDynamicItemDetailFromSettings(index), `dynamic-detail-add-${index}`);
    });

    container.querySelectorAll('button[data-dynamic-detail-save]').forEach((button) => {
      const raw = button.dataset.dynamicDetailSave || '';
      const [categoryIndex, detailIndex] = raw.split(':').map(Number);
      bindEventOnce(button, 'click', () => {
        const nameInput = container.querySelector(`input[data-dynamic-detail-name-input="${categoryIndex}:${detailIndex}"]`);
        const revenueInput = container.querySelector(`input[data-dynamic-detail-revenue-input="${categoryIndex}:${detailIndex}"]`);
        const costInput = container.querySelector(`input[data-dynamic-detail-cost-input="${categoryIndex}:${detailIndex}"]`);
        updateDynamicItemDetailByIndex(
          categoryIndex,
          detailIndex,
          nameInput?.value || '',
          revenueInput?.value || '0',
          costInput?.value || '0',
        );
      }, `dynamic-detail-save-${raw}`);
    });

    container.querySelectorAll('button[data-dynamic-detail-remove]').forEach((button) => {
      const raw = button.dataset.dynamicDetailRemove || '';
      const [categoryIndex, detailIndex] = raw.split(':').map(Number);
      bindEventOnce(button, 'click', () => removeDynamicItemDetailByIndex(categoryIndex, detailIndex), `dynamic-detail-remove-${raw}`);
    });

    container.querySelectorAll('input[data-dashboard-visible]').forEach((input) => {
      const key = input.dataset.dashboardVisible || '';
      bindEventOnce(input, 'change', (e) => {
        updateDashboardCardVisibility(key, !!e.target.checked);
      }, `settings-dashboard-visible-${key}`);
    });

    container.querySelectorAll('button[data-dashboard-move-key]').forEach((button) => {
      const key = button.dataset.dashboardMoveKey || '';
      const direction = Number(button.dataset.dashboardMoveDir || '0');
      bindEventOnce(button, 'click', () => {
        if (!Number.isFinite(direction) || direction === 0) return;
        moveDashboardCard(key, direction);
      }, `settings-dashboard-move-${key}-${direction}`);
    });

    const googleCalendarToggle = container.querySelector('#settings-google-calendar-sync');
    bindEventOnce(googleCalendarToggle, 'change', (event) => {
      setGoogleCalendarAutoSyncEnabled(!!event.target.checked);
    }, 'settings-google-calendar-sync-toggle');

    const googleCalendarSelect = container.querySelector('#settings-google-calendar-select');
    bindEventOnce(googleCalendarSelect, 'change', (event) => {
      const selectedId = String(event?.target?.value || '').trim();
      if (!selectedId) return;
      setGoogleCalendarSelectedId(selectedId);
    }, 'settings-google-calendar-select-change');

    const googleCalendarRefresh = container.querySelector('#settings-google-calendar-refresh');
    bindEventOnce(googleCalendarRefresh, 'click', () => {
      refreshGoogleCalendarSelectInSettings(true);
    }, 'settings-google-calendar-refresh');

    refreshGoogleCalendarSelectInSettings(false);

    container.querySelectorAll('input[data-form-visibility-key]').forEach((input) => {
      const key = input.dataset.formVisibilityKey || '';
      bindEventOnce(input, 'change', (event) => {
        const next = {
          ...formFieldVisibilityConfig,
          [key]: !!event.target.checked,
        };
        saveFormFieldVisibilityConfig(next);
        applyModalFieldVisibility();
      }, `settings-form-visibility-${key}`);
    });
  };

  // ===== Toast =====
  function showToast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast toast-${type} active`;
    t.textContent = msg;
    $('#toast-container').appendChild(t);
    setTimeout(() => { t.classList.remove('active'); setTimeout(() => t.remove(), 300); }, 3000);
  }

  // ===== Message Analyzer Integration =====
  // ===== Import/Export =====
  function handleSyncExportClick() {
    const data = buildExportSnapshot('manual');
    downloadJsonFile(`photocrm_backup_${new Date().toISOString().slice(0, 10)}.json`, data);
    showToast(t('msgExported') || 'Exported');
  }

  function handleSyncImportClick() {
    $('#import-file')?.click();
  }

  function handleImportFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const stats = await window.SyncManager.mergeData(data);
        if (Array.isArray(data.planMaster)) savePlanMaster(data.planMaster);
        if (Array.isArray(data.dashboardConfig)) saveDashboardConfig(data.dashboardConfig);
        if (Array.isArray(data.listColumnConfig)) saveListColumnConfig(data.listColumnConfig);
        if (data.statusColorMap && typeof data.statusColorMap === 'object') saveStatusColorMap(data.statusColorMap);
        if (Array.isArray(data.heroMetricsConfig)) saveHeroMetricsConfig(data.heroMetricsConfig);
        if (typeof data.heroMetricsVisible === 'boolean') setHeroMetricsVisibility(data.heroMetricsVisible);
        if (typeof data.googleCalendarAutoSyncEnabled === 'boolean') setGoogleCalendarAutoSyncEnabled(data.googleCalendarAutoSyncEnabled);
        if (typeof data.googleCalendarSelectedId === 'string') setGoogleCalendarSelectedId(data.googleCalendarSelectedId);
        if (data.billingProfile && typeof data.billingProfile === 'object') saveBillingProfile(data.billingProfile);
        if (typeof data.studioName === 'string') setStudioName(data.studioName);
        if (typeof data.accentColor === 'string') applyAccentColor(data.accentColor, { persist: true });
        if (typeof data.contractTemplateText === 'string') saveContractTemplate(data.contractTemplateText);
        reloadRuntimeStateFromStorage();
        applyHeroMetricsConfig();
        applyDashboardConfig();
        updateLanguage(currentLang);
        showToast(`Imported: ${stats.customers} new, ${stats.updated} updated, ${stats.team} members.`);
      } catch (err) {
        console.error(err);
        showToast(t('invalidJson'), 'error');
      }
    };
    reader.readAsText(file);
  }

  function handleAddCustomFieldClick() {
    const label = prompt(t('enterFieldName') || 'Enter custom field label');
    if (!label || !label.trim()) return;
    addCustomFieldDefinition(label.trim());
    renderCustomFields();
    showToast(t('customFieldAdded') || 'Custom field added');
  }

  // Team Management UI
  function renderTeamList() {
    const photographers = window.TeamManager.loadPhotographers();
    const container = $('#team-list');
    container.innerHTML = '';
    photographers.forEach(p => {
      const item = document.createElement('div');
      item.className = 'team-member-item';
      item.innerHTML = `
        <div class="team-member-info">
          <h4>${escapeHtml(p.name)}</h4>
          <p>${t('role' + p.role.charAt(0).toUpperCase() + p.role.slice(1))}</p>
        </div>
        <button class="btn-icon btn-del-member" data-id="${p.id}">✕</button>
      `;
      item.querySelector('.btn-del-member').onclick = () => {
        window.TeamManager.removePhotographer(p.id);
        renderTeamList();
        renderSettings();
        renderPlanManagementSection();
        populateSelects();
        renderTable();
      };
      container.appendChild(item);
    });
  }

  function getPhotographerName(id) {
    if (!id) return '—';
    const psychologists = window.TeamManager.loadPhotographers();
    const p = psychologists.find(x => x.id === id);
    return p ? p.name : '—';
  }

  // ICS Export
  function formatICSDate(dateStr) {
    return (dateStr || '').replace(/-/g, '');
  }

  function addDays(dateStr, days = 1) {
    const d = new Date(`${dateStr}T00:00:00`);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function escapeICSText(value) {
    return String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/\r?\n/g, '\\n')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,');
  }

  function createICSEventsForCalendarView() {
    const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
    const dateFields = [
      { key: 'shootingDate', icon: '📷', label: t('icsEventShooting') },
      { key: 'meetingDate', icon: '🤝', label: t('icsEventMeeting') },
      { key: 'inquiryDate', icon: '💌', label: t('icsEventInquiry') },
      { key: 'billingDate', icon: '💳', label: t('icsEventBilling') },
    ].filter(df => calendarFilters[df.key]);

    const nowStamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const events = [];

    customers.forEach(c => {
      dateFields.forEach(df => {
        const eventDate = c[df.key];
        if (!eventDate || !eventDate.startsWith(monthStr)) return;

        const customerName = c.customerName || t('icsUnset');
        const plan = resolveCustomerPlanName(c);
        const contact = c.contact || t('icsUnset');
        const notes = c.notes || t('icsNone');
        const summary = `${df.icon} ${df.label} - ${customerName}`;
        const description = [
          `${t('icsDescType')}: ${df.label}`,
          `${t('icsDescCustomer')}: ${customerName}`,
          `${t('icsDescPlan')}: ${plan}`,
          `${t('icsDescContact')}: ${contact}`,
          `${t('icsDescNotes')}: ${notes}`,
        ].join('\n');

        events.push([
          'BEGIN:VEVENT',
          `UID:${escapeICSText(`${c.id}-${df.key}-${eventDate}@photocrm`)}`,
          `DTSTAMP:${nowStamp}`,
          `DTSTART;VALUE=DATE:${formatICSDate(eventDate)}`,
          `DTEND;VALUE=DATE:${formatICSDate(addDays(eventDate, 1))}`,
          `SUMMARY:${escapeICSText(summary)}`,
          `DESCRIPTION:${escapeICSText(description)}`,
          'STATUS:CONFIRMED',
          'TRANSP:OPAQUE',
          'END:VEVENT'
        ].join('\r\n'));
      });
    });

    return events;
  }

  function handleIcsExportClick() {
    const events = createICSEventsForCalendarView();
    if (events.length === 0) {
      showToast(t('icsNoEvents'));
      return;
    }

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Pholio//Calendar Export//JA',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Pholio Calendar',
      'X-WR-TIMEZONE:Asia/Tokyo',
      ...events,
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pholio-calendar-${calYear}${String(calMonth + 1).padStart(2, '0')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // CSV Export
  function handleCsvExportClick() {
    const headers = fields.map((f) => getFieldLabel(f)).join(',');
    const rows = customers.map(c => fields.map(f => {
      let v = c[f.key] ?? '';
      if (typeof v === 'string') v = v.replace(/"/g, '""');
      return `"${v}"`;
    }).join(',')).join('\n');
    const csv = headers + '\n' + rows;
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===== Task Management Logic =====
  function renderTasks(customer) {
    const container = $('#task-list');
    container.innerHTML = '';
    const tasks = customer.tasks || [];

    if (tasks.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:10px;">${t('noTasks') || 'No tasks yet'}</p>`;
      $('#task-progress').textContent = '0%';
      return;
    }

    tasks.forEach(task => {
      const el = document.createElement('div');
      el.className = `task-item ${task.done ? 'done' : ''}`;
      el.style = "display: flex; align-items: center; gap: 10px; padding: 8px; background: var(--bg-app); border-radius: 8px; border: 1px solid var(--border);";

      const priorityColors = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };
      const pColor = priorityColors[task.priority] || 'var(--text-muted)';

      el.innerHTML = `
        <input type="checkbox" ${task.done ? 'checked' : ''} onchange="window.toggleTask('${customer.id}', '${task.id}')">
        <div style="flex: 1;">
          <div style="font-weight: 500; text-decoration: ${task.done ? 'line-through' : 'none'}; opacity: ${task.done ? 0.6 : 1};">${escapeHtml(task.name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${pColor}; margin-right: 4px;"></span>
            ${task.dueDate ? formatDate(task.dueDate) : t('noDate')}
          </div>
        </div>
        <button class="btn-icon" onclick="window.deleteTask('${customer.id}', '${task.id}')" style="font-size: 0.8rem; color: var(--danger);">✕</button>
      `;
      container.appendChild(el);
    });

    const doneCount = tasks.filter(t => t.done).length;
    const progress = Math.round((doneCount / tasks.length) * 100);
    $('#task-progress').textContent = `${progress}%`;

    // Update customer object with progress
    customer.progress = progress;
    saveCustomers(customers);
    renderTable();
  }

  window.toggleTask = function (customerId, taskId) {
    const c = customers.find(x => x.id === customerId);
    if (!c) return;
    const t = c.tasks.find(x => x.id === taskId);
    if (t) {
      t.done = !t.done;
      saveCustomers(customers);
      renderTasks(c);
      showToast(t.done ? t('taskCompleted') : t('taskReopened'));
    }
  };

  window.deleteTask = function (customerId, taskId) {
    const c = customers.find(x => x.id === customerId);
    if (!c) return;
    c.tasks = c.tasks.filter(x => x.id !== taskId);
    saveCustomers(customers);
    renderTasks(c);
  };

  window.openTaskModal = function () {
    $('#task-name').value = '';
    $('#task-due-date').value = '';
    $('#task-priority').value = 'medium';
    $('#task-modal').style.display = 'flex';
    setTimeout(() => $('#task-modal').classList.add('active'), 10);
  };

  window.closeTaskModal = function () {
    $('#task-modal').classList.remove('active');
    setTimeout(() => $('#task-modal').style.display = 'none', 300);
  };

  window.saveTask = function () {
    const name = $('#task-name').value.trim();
    if (!name) return;

    const c = customers.find(x => x.id === editingId);
    if (!c) return;

    if (!c.tasks) c.tasks = [];
    c.tasks.push({
      id: generateId(),
      name,
      dueDate: $('#task-due-date').value,
      priority: $('#task-priority').value,
      done: false
    });

    saveCustomers(customers);
    renderTasks(c);
    closeTaskModal();
    showToast(t('taskAdded'));
  };


  // ===== Invoice Builder =====
  let invoiceBuilderCustomerId = null;
  let invoicePreviewDraftData = null;

  function getDefaultInvoiceItems(customer) {
    return [{
      description: `${customer.plan || 'Photography'} Session`,
      quantity: 1,
      unitPrice: Number(customer.revenue) || 0,
    }];
  }

  function normalizeInvoiceItems(items) {
    return (items || []).map(item => ({
      description: (item.description || '').trim(),
      quantity: Math.max(0, Number(item.quantity) || 0),
      unitPrice: Math.max(0, Number(item.unitPrice) || 0),
    })).filter(item => item.description && item.quantity > 0);
  }

  function calculateInvoiceTotalsForBuilder(subtotalRaw) {
    const subtotal = Math.max(0, Number(subtotalRaw) || 0);
    const settings = getTaxSettings();
    const isTaxEnabled = settings.enabled !== false;
    const taxRate = Math.max(0, Number(settings.rate) || 0);
    const isTaxIncluded = settings.included === true;
    const taxLabel = settings.label || getInvoiceCountryProfile(currentLang).taxLabel || 'Tax';

    if (!isTaxEnabled || taxRate <= 0) {
      return {
        subtotal,
        tax: 0,
        total: subtotal,
        taxRate,
        taxLabel,
      };
    }

    if (isTaxIncluded) {
      const preTax = subtotal / (1 + taxRate / 100);
      const tax = subtotal - preTax;
      return {
        subtotal: preTax,
        tax,
        total: subtotal,
        taxRate,
        taxLabel,
      };
    }

    const tax = subtotal * (taxRate / 100);
    return {
      subtotal,
      tax,
      total: subtotal + tax,
      taxRate,
      taxLabel,
    };
  }

  function updateInvoiceBuilderSummary() {
    const customer = customers.find(x => x.id === invoiceBuilderCustomerId);
    if (!customer) return;

    const rows = Array.from(document.querySelectorAll('.invoice-item-row'));
    const items = normalizeInvoiceItems(rows.map(row => ({
      description: row.querySelector('.invoice-item-desc').value,
      quantity: row.querySelector('.invoice-item-qty').value,
      unitPrice: row.querySelector('.invoice-item-unit').value,
    })));

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const amounts = calculateInvoiceTotalsForBuilder(subtotal);

    const summary = document.getElementById('invoice-builder-summary');
    if (!summary) return;

    summary.innerHTML = `
      <div class="invoice-summary-row"><span>${t('invoicePdfSubtotal')}</span><strong>${formatCurrency(amounts.subtotal)}</strong></div>
      <div class="invoice-summary-row"><span>${escapeHtml(amounts.taxLabel)} (${amounts.taxRate}%)</span><strong>${formatCurrency(amounts.tax)}</strong></div>
      <div class="invoice-summary-row invoice-summary-total"><span>${t('invoicePdfTotal')}</span><strong>${formatCurrency(amounts.total)}</strong></div>
    `;
  }

  function renderInvoiceBuilderItems(items = []) {
    const container = document.getElementById('invoice-items-container');
    if (!container) return;

    container.innerHTML = '';
    const safeItems = items.length ? items : [{ description: '', quantity: 1, unitPrice: 0 }];

    safeItems.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'invoice-item-row';
      const amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

      row.innerHTML = `
        <input class="invoice-item-desc" type="text" value="${escapeHtml(item.description || '')}" placeholder="${escapeHtml(t('invoiceItemDescription'))}">
        <input class="invoice-item-qty" type="number" min="0" step="1" value="${Number(item.quantity) || 1}">
        <input class="invoice-item-unit" type="number" min="0" step="0.01" value="${Number(item.unitPrice) || 0}">
        <div class="invoice-item-amount">${formatCurrency(amount)}</div>
        <button type="button" class="btn-remove-line" title="${escapeHtml(t('remove'))}">✕</button>
      `;

      row.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
          const qty = Math.max(0, Number(row.querySelector('.invoice-item-qty').value) || 0);
          const unitPrice = Math.max(0, Number(row.querySelector('.invoice-item-unit').value) || 0);
          row.querySelector('.invoice-item-amount').textContent = formatCurrency(qty * unitPrice);
          updateInvoiceBuilderSummary();
        });
      });

      row.querySelector('.btn-remove-line').onclick = () => {
        row.remove();
        if (!container.children.length) renderInvoiceBuilderItems();
        updateInvoiceBuilderSummary();
      };

      container.appendChild(row);
    });

    updateInvoiceBuilderSummary();
  }

  function openInvoiceBuilderModal(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    invoiceBuilderCustomerId = customerId;
    const meta = document.getElementById('invoice-customer-meta');
    if (meta) {
      meta.innerHTML = `<strong>${escapeHtml(customer.customerName || '—')}</strong> · ${escapeHtml(customer.contact || t('noContact'))} · ${formatDate(customer.shootingDate)}`;
    }

    const items = normalizeInvoiceItems(customer.invoiceItems);
    renderInvoiceBuilderItems(items.length ? items : getDefaultInvoiceItems(customer));

    const settings = getTaxSettings();
    const senderProfile = getInvoiceSenderProfile();
    const issueDateInput = document.getElementById('invoice-issue-date');
    const dueDateInput = document.getElementById('invoice-due-date');
    const senderNameInput = document.getElementById('invoice-sender-name');
    const recipientNameInput = document.getElementById('invoice-recipient-name');
    const senderContactInput = document.getElementById('invoice-sender-contact');
    const recipientContactInput = document.getElementById('invoice-recipient-contact');
    const messageInput = document.getElementById('invoice-message');
    const today = new Date();
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 14);

    if (issueDateInput) issueDateInput.value = customer.invoiceIssueDate || today.toISOString().slice(0, 10);
    if (dueDateInput) dueDateInput.value = customer.invoiceDueDate || defaultDueDate.toISOString().slice(0, 10);
    if (senderNameInput) senderNameInput.value = customer.invoiceSenderName || senderProfile.name || settings.companyName || '';
    if (recipientNameInput) recipientNameInput.value = customer.invoiceRecipientName || customer.customerName || '';
    if (senderContactInput) senderContactInput.value = customer.invoiceSenderContact || senderProfile.contact || settings.email || '';
    if (recipientContactInput) recipientContactInput.value = customer.invoiceRecipientContact || customer.contact || '';
    if (messageInput) messageInput.value = customer.invoiceMessage || settings.invoiceFooterMessage || getDefaultInvoiceMessage();

    const modal = document.getElementById('invoice-builder-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
  }

  window.openInvoiceBuilderModal = openInvoiceBuilderModal;

  window.closeInvoiceBuilderModal = function () {
    const modal = document.getElementById('invoice-builder-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
  };

  function handleInvoiceDuePlus14Click() {
    const issueDateInput = document.getElementById('invoice-issue-date');
    const dueDateInput = document.getElementById('invoice-due-date');
    if (!dueDateInput) return;
    const baseDate = issueDateInput?.value ? new Date(issueDateInput.value) : new Date();
    if (Number.isNaN(baseDate.getTime())) return;
    baseDate.setDate(baseDate.getDate() + 14);
    dueDateInput.value = baseDate.toISOString().slice(0, 10);
  }

  function collectInvoiceBuilderDraftData() {
    const customer = customers.find(c => c.id === invoiceBuilderCustomerId);
    if (!customer) return null;

    const rows = Array.from(document.querySelectorAll('.invoice-item-row'));
    const items = normalizeInvoiceItems(rows.map(row => ({
      description: row.querySelector('.invoice-item-desc').value,
      quantity: row.querySelector('.invoice-item-qty').value,
      unitPrice: row.querySelector('.invoice-item-unit').value,
    })));

    if (!items.length) {
      showToast(t('invoiceLineItemRequired'), 'error');
      return null;
    }

    return {
      customer,
      items,
      issueDate: document.getElementById('invoice-issue-date')?.value || '',
      dueDate: document.getElementById('invoice-due-date')?.value || '',
      senderName: document.getElementById('invoice-sender-name')?.value?.trim() || '',
      recipientName: document.getElementById('invoice-recipient-name')?.value?.trim() || '',
      senderContact: document.getElementById('invoice-sender-contact')?.value?.trim() || '',
      recipientContact: document.getElementById('invoice-recipient-contact')?.value?.trim() || '',
      message: document.getElementById('invoice-message')?.value?.trim() || getDefaultInvoiceMessage(),
    };
  }

  function persistInvoiceDraftToCustomer(draft) {
    const customer = draft.customer;
    customer.invoiceItems = draft.items;
    customer.invoiceIssueDate = draft.issueDate;
    customer.invoiceDueDate = draft.dueDate;
    customer.invoiceSenderName = draft.senderName;
    customer.invoiceRecipientName = draft.recipientName;
    customer.invoiceSenderContact = draft.senderContact;
    customer.invoiceRecipientContact = draft.recipientContact;
    customer.invoiceMessage = draft.message;

    const settings = getTaxSettings();
    saveTaxSettings({
      ...settings,
      invoiceFooterMessage: draft.message,
    });
    saveInvoiceSenderProfile({
      name: draft.senderName,
      contact: draft.senderContact,
    });
    customer.updatedAt = new Date().toISOString();
    saveCustomers(customers);
  }

  function openInvoicePreviewModal() {
    const draft = collectInvoiceBuilderDraftData();
    if (!draft) return;
    if (typeof window.buildInvoicePreviewMarkup !== 'function') {
      showToast('印刷プレビューの生成に失敗しました。', 'error');
      return;
    }
    invoicePreviewDraftData = draft;
    const frame = document.getElementById('invoice-preview-frame');
    const modal = document.getElementById('invoice-preview-modal');
    if (!frame || !modal) return;

    const markup = window.buildInvoicePreviewMarkup(draft.customer, 'invoice', {
      items: draft.items,
      issueDate: draft.issueDate,
      dueDate: draft.dueDate,
      senderName: draft.senderName,
      recipientName: draft.recipientName,
      senderContact: draft.senderContact,
      recipientContact: draft.recipientContact,
      message: draft.message,
    });
    frame.srcdoc = `<!doctype html><html lang="${escapeHtml(currentLang || 'en')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f3f4f6;">${markup}</body></html>`;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
  }

  window.closeInvoicePreviewModal = function () {
    const modal = document.getElementById('invoice-preview-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 250);
  };

  function handleInvoicePreviewPrintClick() {
    const frame = document.getElementById('invoice-preview-frame');
    if (!frame?.contentWindow) return;
    frame.contentWindow.focus();
    frame.contentWindow.print();
  }

  function handleInvoicePreviewPdfDownloadClick() {
    if (!invoicePreviewDraftData || typeof window.generateInvoicePDF !== 'function') {
      showToast('PDFの出力データが見つかりません。', 'error');
      return;
    }
    const draft = invoicePreviewDraftData;
    persistInvoiceDraftToCustomer(draft);
    window.generateInvoicePDF(draft.customer, 'invoice', {
      items: draft.items,
      issueDate: draft.issueDate,
      dueDate: draft.dueDate,
      senderName: draft.senderName,
      recipientName: draft.recipientName,
      senderContact: draft.senderContact,
      recipientContact: draft.recipientContact,
      message: draft.message,
    });
  }

  function handleAddInvoiceItemClick() {
    const container = document.getElementById('invoice-items-container');
    if (!container) return;
    const rows = Array.from(container.querySelectorAll('.invoice-item-row')).map(row => ({
      description: row.querySelector('.invoice-item-desc').value,
      quantity: row.querySelector('.invoice-item-qty').value,
      unitPrice: row.querySelector('.invoice-item-unit').value,
    }));
    rows.push({ description: '', quantity: 1, unitPrice: 0 });
    renderInvoiceBuilderItems(rows);
  }

  function handleGenerateCustomInvoiceClick() {
    if (typeof window.generateInvoicePDF !== 'function') return;
    const draft = collectInvoiceBuilderDraftData();
    if (!draft) return;
    persistInvoiceDraftToCustomer(draft);

    window.generateInvoicePDF(draft.customer, 'invoice', {
      items: draft.items,
      issueDate: draft.issueDate,
      dueDate: draft.dueDate,
      senderName: draft.senderName,
      recipientName: draft.recipientName,
      senderContact: draft.senderContact,
      recipientContact: draft.recipientContact,
      message: draft.message,
    });
    closeInvoiceBuilderModal();
  }

  // ===== Expense Management Logic =====
  function renderExpenses() {
    const container = $('#expense-list');
    container.innerHTML = '';
    const expenses = getExpenses().sort((a, b) => new Date(b.date) - new Date(a.date));
    const translatedNoExpenses = t('noExpensesYet');
    const noExpensesMessage = translatedNoExpenses !== 'noExpensesYet'
      ? translatedNoExpenses
      : 'No expenses registered yet';

    if (expenses.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">${noExpensesMessage}</p>`;
      return;
    }

    const table = document.createElement('table');
    table.className = 'expense-table';
    table.style = "width: 100%; border-collapse: collapse; font-size: 0.9rem;";
    table.innerHTML = `
      <thead>
        <tr style="border-bottom: 2px solid var(--border); text-align: left;">
          <th style="padding: 10px;">${t('tableDate')}</th>
          <th style="padding: 10px;">${t('tableItem')}</th>
          <th style="padding: 10px;">${t('category')}</th>
          <th style="padding: 10px; text-align: right;">${t('amount')}</th>
          <th style="padding: 10px;"></th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    expenses.forEach(e => {
      const tr = document.createElement('tr');
      tr.style = "border-bottom: 1px solid var(--border);";
      tr.innerHTML = `
        <td style="padding: 10px;">${formatDate(e.date)}</td>
        <td style="padding: 10px; font-weight: 500;">${escapeHtml(e.item)}</td>
        <td style="padding: 10px;"><span class="badge" style="background: var(--bg-app); border: 1px solid var(--border); color: var(--text-muted); font-size: 0.7rem;">${e.category}</span></td>
        <td style="padding: 10px; text-align: right; font-weight: 600;">${formatCurrency(e.amount)}</td>
        <td style="padding: 10px; text-align: right;"><button class="btn-icon" onclick="window.deleteExpense('${e.id}')" style="color: var(--danger);">✕</button></td>
      `;
      tbody.appendChild(tr);
    });

    container.appendChild(table);
    updateDashboard(); // Refresh stats
  }

  window.openExpenseModal = function () {
    $('#expense-date').value = new Date().toISOString().split('T')[0];
    $('#expense-item').value = '';
    $('#expense-amount').value = '';
    $('#expense-modal').style.display = 'flex';
    setTimeout(() => $('#expense-modal').classList.add('active'), 10);
  };

  window.closeExpenseModal = function () {
    $('#expense-modal').classList.remove('active');
    setTimeout(() => $('#expense-modal').style.display = 'none', 300);
  };

  window.saveExpense = function (event) {
    if (event) event.preventDefault();

    const item = $('#expense-item').value.trim();
    const amount = Number($('#expense-amount').value);
    if (!item || !amount) return;

    const expenses = getExpenses();
    expenses.push({
      id: generateId(),
      date: $('#expense-date').value,
      category: $('#expense-category').value,
      item,
      amount
    });

    saveExpenses(expenses);
    renderExpenses();
    closeExpenseModal();
    showToast(t('expenseAdded'));
  };

  function bindExpenseModalEvents() {
    const expenseForm = $('#expense-form');
    const addExpenseBtn = $('#addExpenseBtn');
    bindEventOnce(expenseForm, 'submit', window.saveExpense, 'expense-form-submit');
    bindEventOnce(addExpenseBtn, 'click', window.saveExpense, 'expense-add-click');
  }

  window.deleteExpense = function (id) {
    let expenses = getExpenses();
    expenses = expenses.filter(x => x.id !== id);
    saveExpenses(expenses);
    renderExpenses();
  };

  // ===== Contract Logic =====
  window.openContractModal = function (customer) {
    window.currentContractCustomer = customer;
    $('#contract-modal').style.display = 'flex';
    setTimeout(() => $('#contract-modal').classList.add('active'), 10);
  };

  window.closeContractModal = function () {
    $('#contract-modal').classList.remove('active');
    setTimeout(() => $('#contract-modal').style.display = 'none', 300);
  };

  function bindContractTemplateEventListeners() {
    document.querySelectorAll('.contract-template-btn').forEach((btn) => {
      const template = btn.dataset.template || 'default';
      bindEventOnce(btn, 'click', () => {
        window.generateContract(window.currentContractCustomer, template);
        window.closeContractModal();
      }, `contract-template-${template}`);
    });
  }

  // ===== Free Tier Limit Logic =====
  function checkCustomerLimit() {
    const limit = getCustomerLimitByPlan(currentUserPlan);
    if (Number.isFinite(limit) && customers.length >= limit) {
      showUpgradeModal(limit);
      return false;
    }
    return true;
  }

  function showUpgradeModal(limit = FREE_PLAN_LIMIT) {
    const confirmed = confirm(
      t('msgLimitReachedPlan', { limit: String(limit) })
      || `Free plan limit reached (${limit} customers). Upgrade to continue adding more customers.`
    );
    if (confirmed) {
      openSettingsPlanManagementSection();
    }
  }

  function handleSubscriptionPlanSelect(nextPlan) {
    const normalized = normalizeUserPlan(nextPlan);
    if (normalized === normalizeUserPlan(currentUserPlan)) return;
    if (normalized === 'enterprise') {
      handleSubscriptionPlanContactClick(normalized);
      return;
    }
    setCurrentUserPlan(normalized, { persistCloud: true });
    renderSettings();
    renderPlanManagementSection();
    loadBillingProfileSettings();
    showToast(t('settingsSubscriptionUpdated', { plan: getPlanBadgeText(normalized) }));
  }

  function handleSubscriptionPlanContactClick(targetPlan = 'enterprise') {
    openEnterpriseContactModal(targetPlan);
  }

  function handleSubscriptionPlanDetailsClick() {
    const detailLines = getSubscriptionPlanEntries().map((entry) => `• ${entry.name} (${entry.price}): ${entry.summary}`);
    const detailsText = [t('settingsSubscriptionDetailsModalTitle'), '', ...detailLines].join('\n');
    window.alert(detailsText);
  }

  function getEnterpriseContactRequests() {
    const loaded = getCloudValue(ENTERPRISE_CONTACT_REQUESTS_KEY, getLocalValue(ENTERPRISE_CONTACT_REQUESTS_KEY, []));
    return Array.isArray(loaded) ? loaded : [];
  }

  function saveEnterpriseContactRequests(requests) {
    const normalized = Array.isArray(requests) ? requests : [];
    if (window.FirebaseService?.getCurrentUser?.()) {
      saveCloudValue(ENTERPRISE_CONTACT_REQUESTS_KEY, normalized);
      return;
    }
    saveLocalValue(ENTERPRISE_CONTACT_REQUESTS_KEY, normalized);
  }

  function openEnterpriseContactModal(targetPlan = 'enterprise') {
    const overlay = document.getElementById('enterprise-contact-overlay');
    if (!overlay) return;
    const planInput = document.getElementById('enterprise-contact-plan');
    if (planInput) planInput.value = String(targetPlan || 'enterprise');
    const teamNameInput = document.getElementById('enterprise-contact-team-name');
    const representativeInput = document.getElementById('enterprise-contact-representative-name');
    const rangeSelect = document.getElementById('enterprise-contact-member-range');
    const messageInput = document.getElementById('enterprise-contact-message');
    if (teamNameInput) teamNameInput.value = '';
    if (representativeInput) representativeInput.value = '';
    if (rangeSelect) rangeSelect.value = '';
    if (messageInput) messageInput.value = '';
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('active'), 10);
  }

  function closeEnterpriseContactModal() {
    const overlay = document.getElementById('enterprise-contact-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    setTimeout(() => { overlay.style.display = 'none'; }, 220);
  }

  function getClientOsInfo() {
    const nav = window.navigator || {};
    const uaData = nav.userAgentData || null;
    return {
      platform: String(uaData?.platform || nav.platform || 'unknown'),
      userAgent: String(nav.userAgent || ''),
      language: String(nav.language || ''),
      vendor: String(nav.vendor || ''),
      hardwareConcurrency: Number.isFinite(Number(nav.hardwareConcurrency)) ? Number(nav.hardwareConcurrency) : null,
      deviceMemory: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
    };
  }

  function fallbackHashHex(value) {
    const text = String(value || '');
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  async function computeSha256Hex(value) {
    const text = String(value || '');
    const subtle = window.crypto?.subtle;
    if (!subtle || typeof TextEncoder === 'undefined') {
      return `fallback_${fallbackHashHex(text)}`;
    }
    const encoded = new TextEncoder().encode(text);
    const digest = await subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((item) => item.toString(16).padStart(2, '0'))
      .join('');
  }

  function getCanvasFingerprintSeed() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 220;
      canvas.height = 60;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      ctx.textBaseline = 'top';
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 220, 60);
      ctx.fillStyle = '#22d3ee';
      ctx.fillText('Pholio Device Lock', 8, 10);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(window.navigator?.userAgent || '', 8, 30);
      return canvas.toDataURL();
    } catch {
      return '';
    }
  }

  async function buildAdminDeviceContext(forceRefresh = false) {
    if (!forceRefresh && adminDeviceContextCache && adminDeviceContextCache.deviceId) {
      return adminDeviceContextCache;
    }
    const nav = window.navigator || {};
    const screenInfo = window.screen || {};
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const resolution = `${Number(screenInfo.width) || 0}x${Number(screenInfo.height) || 0}@${Number(window.devicePixelRatio) || 1}`;
    const platform = String(nav.userAgentData?.platform || nav.platform || 'unknown');
    const userAgent = String(nav.userAgent || '');
    const language = String(nav.language || '');
    const fingerprintRaw = JSON.stringify({
      canvas: getCanvasFingerprintSeed(),
      timezone,
      resolution,
      platform,
      language,
      userAgent,
      vendor: String(nav.vendor || ''),
      hardwareConcurrency: Number(nav.hardwareConcurrency) || 0,
      deviceMemory: Number(nav.deviceMemory) || 0,
      colorDepth: Number(screenInfo.colorDepth) || 0,
    });
    const fingerprintHash = await computeSha256Hex(fingerprintRaw);
    const deviceId = `dev_${fingerprintHash.slice(0, 24)}`;
    const deviceLabel = `${platform || 'Unknown'} ${resolution}`.trim();
    adminDeviceContextCache = {
      deviceId,
      fingerprintHash,
      label: deviceLabel,
      platform,
      userAgent,
      resolution,
      timezone,
      language,
    };
    return adminDeviceContextCache;
  }

  function persistAdminSecureSession(sessionToken = '', expiresAtMs = 0) {
    try {
      const payload = {
        token: String(sessionToken || ''),
        expiresAtMs: Number(expiresAtMs) || 0,
      };
      sessionStorage.setItem(ADMIN_SECURE_SESSION_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }

  function clearPersistedAdminSecureSession() {
    try {
      sessionStorage.removeItem(ADMIN_SECURE_SESSION_KEY);
    } catch {
      // ignore storage errors
    }
  }

  function setAdminDeviceWarning(message = '', type = 'warning') {
    const warningEl = document.getElementById('admin-device-warning');
    if (!warningEl) return;
    const nextMessage = String(message || '').trim();
    if (!nextMessage) {
      warningEl.textContent = '';
      warningEl.classList.remove('is-warning', 'is-error', 'is-info');
      warningEl.style.display = 'none';
      return;
    }
    warningEl.textContent = nextMessage;
    warningEl.classList.remove('is-warning', 'is-error', 'is-info');
    warningEl.classList.add(
      type === 'error' ? 'is-error' : (type === 'info' ? 'is-info' : 'is-warning')
    );
    warningEl.style.display = 'block';
  }

  function setAdminSecurityStatusMini(state = 'online') {
    const statusEl = document.getElementById('admin-security-status-mini');
    if (!statusEl) return;
    const normalized = String(state || 'online').trim().toLowerCase();
    const adminVisible = isCurrentUserAdmin() || !!adminSecurityContext.isAdmin;
    statusEl.classList.remove('is-error', 'is-online');
    if (!adminVisible) {
      statusEl.style.display = 'none';
      return;
    }
    if (normalized === 'error') {
      statusEl.textContent = t('adminSecurityStatusOfflineError');
      statusEl.classList.add('is-error');
      return;
    }
    statusEl.textContent = t('adminSecurityStatusOnline');
    statusEl.classList.add('is-online');
  }

  function getAdminSecurityWarningMessage(reason = '') {
    const normalizedReason = String(reason || '').trim().toLowerCase();
    if (normalizedReason === 'mfa_required') return t('adminMfaRequiredWarning');
    if (
      normalizedReason.startsWith('session_')
      || normalizedReason.includes('session')
      || normalizedReason === 'invalid_admin_session'
    ) {
      return t('adminSessionExpiredWarning');
    }
    if (
      normalizedReason === 'unauthorized_device'
      || normalizedReason === 'device_not_approved'
      || normalizedReason === 'fingerprint_mismatch'
    ) {
      return t('adminDeviceUnauthorizedWarning');
    }
    if (normalizedReason === 'session_timeout') return t('adminSessionExpiredWarning');
    if (normalizedReason === 'admin_security_init_failed') return t('adminSecurityInitFailed');
    return '';
  }

  function logAdminSecurityInitError(context = '', err = null, metadata = {}) {
    const safeMetadata = metadata && typeof metadata === 'object' ? metadata : {};
    const detail = {
      context: String(context || '').trim() || 'admin_security',
      code: String(err?.code || err?.name || '').trim(),
      message: String(err?.message || err || '').trim(),
      reason: String(safeMetadata.reason || '').trim(),
      deviceId: String(safeMetadata.deviceId || '').trim(),
      hasFirebaseService: !!window.FirebaseService,
    };
    console.error(
      `[Admin Debug] Error Code: ${detail.code || 'unknown'} | Context: ${detail.context} | Message: ${detail.message || 'n/a'} | Reason: ${detail.reason || 'n/a'}`,
      err
    );
    console.log('[Admin Debug] Detail:', detail);
  }

  function canAccessAdminPanel() {
    return isCurrentUserAdmin();
  }

  function clearAdminSessionTimeoutCheck() {
    if (!adminSessionTimeoutHandle) return;
    clearTimeout(adminSessionTimeoutHandle);
    adminSessionTimeoutHandle = null;
  }

  function unbindAdminSessionActivityListeners() {
    if (!adminSessionActivityBound) return;
    const eventNames = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    eventNames.forEach((eventName) => {
      window.removeEventListener(eventName, handleAdminSessionActivity, true);
    });
    adminSessionActivityBound = false;
  }

  function bindAdminSessionActivityListeners() {
    if (adminSessionActivityBound) return;
    const eventNames = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    eventNames.forEach((eventName) => {
      window.addEventListener(eventName, handleAdminSessionActivity, true);
    });
    adminSessionActivityBound = true;
  }

  function stopAdminSessionMonitor() {
    clearAdminSessionTimeoutCheck();
    unbindAdminSessionActivityListeners();
    adminSessionLastActivityAt = 0;
    adminSessionLastTouchedAt = 0;
  }

  function scheduleAdminSessionTimeoutCheck() {
    clearAdminSessionTimeoutCheck();
    if (!canAccessAdminPanel()) return;
    const elapsedMs = Date.now() - (adminSessionLastActivityAt || Date.now());
    const remainingMs = ADMIN_SESSION_TIMEOUT_MS - elapsedMs;
    if (remainingMs <= 0) {
      handleAdminSessionTimeout();
      return;
    }
    const delayMs = Math.min(remainingMs, 30 * 1000);
    adminSessionTimeoutHandle = setTimeout(() => {
      scheduleAdminSessionTimeoutCheck();
    }, delayMs);
  }

  async function syncAdminSessionHeartbeat(force = false) {
    if (!canAccessAdminPanel()) return;
    const now = Date.now();
    if (!force && (now - adminSessionLastTouchedAt) < ADMIN_SESSION_TOUCH_INTERVAL_MS) return;
    adminSessionLastTouchedAt = now;
    try {
      const result = await window.FirebaseService?.touchAdminSecureSession?.({
        deviceId: adminSecurityContext.deviceId,
        token: adminSecurityContext.sessionToken,
        reason: force ? 'heartbeat' : 'activity',
      });
      if (result && result.allowed === false) {
        adminSecurityContext = {
          ...adminSecurityContext,
          authorized: false,
          sessionActive: false,
          reason: String(result.reason || 'session_timeout'),
          sessionToken: '',
          sessionExpiresAtMs: 0,
        };
        clearPersistedAdminSecureSession();
        stopAdminSessionMonitor();
        setAdminDeviceWarning(getAdminSecurityWarningMessage(adminSecurityContext.reason), 'error');
        updateAdminSettingsAvailability();
      }
    } catch (err) {
      console.warn('Admin session heartbeat failed', err);
    }
  }

  function handleAdminSessionActivity() {
    if (!canAccessAdminPanel()) return;
    adminSessionLastActivityAt = Date.now();
    scheduleAdminSessionTimeoutCheck();
    syncAdminSessionHeartbeat(false);
  }

  function startAdminSessionMonitor() {
    if (!canAccessAdminPanel()) {
      stopAdminSessionMonitor();
      return;
    }
    adminSessionLastActivityAt = Date.now();
    bindAdminSessionActivityListeners();
    scheduleAdminSessionTimeoutCheck();
    syncAdminSessionHeartbeat(true);
  }

  function handleAdminSessionTimeout() {
    if (!isCurrentUserAdmin()) return;
    stopAdminSessionMonitor();
    adminSecurityContext = {
      ...adminSecurityContext,
      authorized: false,
      sessionActive: false,
      reason: 'session_timeout',
      sessionToken: '',
      sessionExpiresAtMs: 0,
    };
    clearPersistedAdminSecureSession();
    setAdminDeviceWarning(getAdminSecurityWarningMessage('session_timeout'), 'error');
    window.FirebaseService?.endAdminSecureSession?.('timeout').catch(() => {});
    updateAdminSettingsAvailability();
    showToast(t('adminSessionExpiredWarning'), 'error');
  }

  function clearAdminSecurityState(reason = 'not_admin') {
    stopAdminSessionMonitor();
    clearPersistedAdminSecureSession();
    adminDeviceState = { approved: [], pending: [] };
    adminSecurityContext = {
      isAdmin: false,
      authorized: false,
      sessionActive: false,
      reason,
      deviceId: '',
      mfaVerified: false,
      mfaRequired: false,
      mfaEnrolledFactorCount: 0,
      sessionToken: '',
      sessionExpiresAtMs: 0,
    };
    setAdminDeviceWarning('');
    setAdminSecurityStatusMini('online');
  }

  function getAdminMfaStatusText() {
    return '';
  }

  function isAdminUserForTotpUi() {
    return isCurrentUserAdmin();
  }

  function setAdminMfaEnrollMode() {
    // MFA/TOTP removed
  }

  function updateAdminTotpControlsVisibility() {
    // MFA/TOTP removed
  }

  function closeAdminTotpModal() {
    // MFA/TOTP removed
  }

  function setAdminTotpQrPreview() {
    // MFA/TOTP removed
  }

  function closeMfaLoginModal() {
    // MFA/TOTP removed
  }

  function openMfaLoginModal() {
    // MFA/TOTP removed
  }

  async function openAdminTotpSetupModal() {
    // MFA/TOTP removed
  }

  async function handleAdminTotpEnrollSubmit() {
    // MFA/TOTP removed
  }

  async function handleMfaLoginSubmit() {
    // MFA/TOTP removed
  }

  function renderAdminDeviceTableRows() {
    // Device lock UI removed
  }

  async function refreshAdminDeviceList() {
    // Device lock UI removed
  }

  async function handleAdminDeviceActionClick() {
    // Device lock UI removed
  }

  async function initializeAdminSecurityForUser(user) {
    adminDeviceContextCache = null;
    adminDeviceState = { approved: [], pending: [] };

    const isAdmin = !!(user && isAdminEmail(user.email));
    adminSecurityContext = {
      isAdmin,
      authorized: isAdmin,
      sessionActive: isAdmin,
      reason: isAdmin ? 'authorized' : 'not_admin',
      deviceId: '',
      mfaVerified: false,
      mfaRequired: false,
      mfaEnrolledFactorCount: 0,
      sessionToken: '',
      sessionExpiresAtMs: 0,
    };

    if (isAdmin) {
      setAdminDeviceWarning('');
      setAdminSecurityStatusMini('online');
    } else {
      clearAdminSecurityState('not_admin');
    }
    updateAdminSettingsAvailability();
  }

  function resetSupportTicketForm() {

    const subjectInput = document.getElementById('support-ticket-subject');
    const categorySelect = document.getElementById('support-ticket-category');
    const messageInput = document.getElementById('support-ticket-message');
    if (subjectInput) subjectInput.value = '';
    if (categorySelect) categorySelect.value = 'bug';
    if (messageInput) messageInput.value = '';
  }

  async function handleSupportTicketSubmit() {
    const subject = String(document.getElementById('support-ticket-subject')?.value || '').trim();
    const category = String(document.getElementById('support-ticket-category')?.value || 'bug').trim() || 'bug';
    const message = String(document.getElementById('support-ticket-message')?.value || '').trim();

    if (!subject || !message) {
      showToast(t('supportValidation'), 'error');
      return;
    }

    const user = window.FirebaseService?.getCurrentUser?.();
    if (!user || typeof window.FirebaseService?.saveSupportTicket !== 'function') {
      showToast(t('supportLoginRequired'), 'error');
      return;
    }

    const payload = {
      subject,
      category,
      message,
      notifyTo: getLegalLocaleTextOrFallback('legalContactEmail', 'pholio.support@icloud.com'),
      language: currentLang,
      currency: currentCurrency,
      osInfo: getClientOsInfo(),
      status: 'pending',
      ai_draft_reply: '',
    };

    try {
      await window.FirebaseService.saveSupportTicket(payload);
      resetSupportTicketForm();
      showToast(t('supportSubmitSuccess'));
    } catch (err) {
      console.error('Support ticket submit failed', err);
      showToast(t('supportSubmitFailed'), 'error');
    }
  }

  async function handleEnterpriseContactSubmit() {
    const teamName = String(document.getElementById('enterprise-contact-team-name')?.value || '').trim();
    const representativeName = String(document.getElementById('enterprise-contact-representative-name')?.value || '').trim();
    const memberRange = String(document.getElementById('enterprise-contact-member-range')?.value || '').trim();
    const message = String(document.getElementById('enterprise-contact-message')?.value || '').trim();
    const selectedPlan = String(document.getElementById('enterprise-contact-plan')?.value || 'enterprise').trim();

    if (!teamName || !representativeName || !memberRange) {
      showToast(t('enterpriseContactValidation'), 'error');
      return;
    }

    const inquiryPayload = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      plan: normalizeUserPlan(selectedPlan),
      teamName,
      companyName: teamName,
      representativeName,
      memberRange,
      message,
    };
    const nextRequests = [inquiryPayload, ...getEnterpriseContactRequests()];
    saveEnterpriseContactRequests(nextRequests);

    try {
      if (window.FirebaseService?.saveEnterpriseInquiry) {
        await window.FirebaseService.saveEnterpriseInquiry(inquiryPayload);
      }
      showToast('Success! We will contact you soon.');
      closeEnterpriseContactModal();
    } catch (err) {
      console.error('Enterprise inquiry submit failed', err);
      showToast('Inquiry submission failed. Please try again.', 'error');
    }
  }

  function renderPlanManagementSection() {
    const container = document.getElementById('settings-plan-content-container');
    if (!container) return;
    container.innerHTML = renderSubscriptionPlanSectionHtml('settings-subscription-plan-section');
    bindSubscriptionPlanSectionEvents(container, 'settings-plan');
  }

  function openSettingsPlanManagementSection() {
    handleOpenSettingsClick();
    const planTabBtn = settingsOverlay?.querySelector('.settings-tab-btn[data-tab="plan"]');
    if (planTabBtn && !planTabBtn.classList.contains('active')) planTabBtn.click();
    window.requestAnimationFrame(() => {
      const section = document.getElementById('settings-subscription-plan-section');
      if (!section) return;
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      section.classList.add('settings-section-focus');
      window.setTimeout(() => section.classList.remove('settings-section-focus'), 1200);
    });
  }

  function renderInvoiceLegalFields(lang = currentLang, settings = getTaxSettings()) {
    const profile = getInvoiceCountryProfile(lang);
    const section = $('#invoice-legal-section');
    const titleEl = $('#invoice-legal-section-title');
    const captionEl = $('#invoice-legal-caption');
    const container = $('#invoice-legal-fields');
    if (!container) return;

    const legalFields = Array.isArray(profile.legalFields) ? profile.legalFields : [];
    const legalValues = settings?.legalFieldValues && typeof settings.legalFieldValues === 'object'
      ? settings.legalFieldValues
      : {};

    if (!hasPaidPlanAccess(currentUserPlan) && legalFields.length > 0) {
      if (titleEl) titleEl.textContent = profile.legalSectionTitle || 'Legal Information';
      if (captionEl) captionEl.textContent = t('planFeatureLegalLocked') || '';
      if (section) section.style.display = '';
      container.innerHTML = `<div class="invoice-legal-locked">${escapeHtml(t('planFeatureLegalLocked') || '')}</div>`;
      return;
    }

    if (titleEl) titleEl.textContent = profile.legalSectionTitle || 'Legal Information';
    if (captionEl) captionEl.textContent = profile.legalSectionHint || '';
    if (section) section.style.display = legalFields.length ? '' : 'none';

    container.innerHTML = legalFields.map((field) => `
      <div class="invoice-legal-field">
        <label for="invoice-legal-${escapeHtml(field.key)}">${escapeHtml(field.label || field.key)}</label>
        <input
          type="text"
          id="invoice-legal-${escapeHtml(field.key)}"
          data-legal-field-key="${escapeHtml(field.key)}"
          placeholder="${escapeHtml(field.placeholder || '')}"
          value="${escapeHtml(legalValues[field.key] || '')}"
        >
      </div>
    `).join('');
  }

  function getInvoiceLegalFieldValuesFromForm() {
    const legalFieldValues = {};
    document.querySelectorAll('#invoice-legal-fields [data-legal-field-key]').forEach((input) => {
      const key = input.getAttribute('data-legal-field-key');
      if (!key) return;
      legalFieldValues[key] = String(input.value || '').trim();
    });
    return legalFieldValues;
  }

  function applyInvoiceLocaleDefaults(lang, options = {}) {
    const { force = true } = options;
    const profile = getInvoiceCountryProfile(lang);
    const currentSettings = getTaxSettings();
    const isFirstRegionInit = !currentSettings.invoiceRegionCode;
    const shouldApplyLocaleDefaults = force || isFirstRegionInit;
    const nextSettings = {
      ...currentSettings,
      rate: shouldApplyLocaleDefaults
        ? Number(profile.defaultTaxRate ?? currentSettings.rate ?? 10)
        : Number(currentSettings.rate ?? profile.defaultTaxRate ?? 10),
      label: shouldApplyLocaleDefaults
        ? (profile.taxLabel || currentSettings.label || 'Tax')
        : (currentSettings.label || profile.taxLabel || 'Tax'),
      invoiceRegionCode: profile.code || currentSettings.invoiceRegionCode || '',
      legalFieldValues: { ...(currentSettings.legalFieldValues || {}) },
    };

    (profile.legalFields || []).forEach((field) => {
      if (typeof nextSettings.legalFieldValues[field.key] !== 'string') {
        nextSettings.legalFieldValues[field.key] = '';
      }
    });

    saveTaxSettings(nextSettings);
  }

  function setInvoiceAssetPreview(selector, dataUrl = '') {
    const img = $(selector);
    if (!img) return;
    if (dataUrl) {
      img.src = dataUrl;
      img.style.display = 'inline-block';
    } else {
      img.removeAttribute('src');
      img.style.display = 'none';
    }
  }

  function readImageFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  let pendingInvoiceLogoDataUrl = '';
  let pendingInvoiceStampDataUrl = '';

  function loadInvoiceSettings() {
    const settings = getTaxSettings();
    $('#tax-rate').value = settings.rate;
    const taxLabelSelect = $('#tax-label');
    const hasPresetTaxLabel = Array.from(taxLabelSelect?.options || []).some((option) => option.value === settings.label);
    if (taxLabelSelect) taxLabelSelect.value = hasPresetTaxLabel ? settings.label : 'Custom';

    if ($('#tax-label').value === 'Custom') {
      $('#tax-label-custom').style.display = 'block';
      $('#tax-label-custom').value = settings.label;
    } else {
      $('#tax-label-custom').style.display = 'none';
    }

    $('#tax-included').checked = settings.included;
    $('#tax-options').style.display = settings.enabled ? 'block' : 'none';

    $('#invoice-company-name').value = settings.companyName || '';
    $('#invoice-address').value = settings.address || '';
    $('#invoice-email').value = settings.email || '';
    $('#invoice-phone').value = settings.phone || '';
    $('#invoice-bank').value = settings.bank || '';
    const templateSelect = $('#invoice-template');
    if (templateSelect) templateSelect.value = settings.invoiceTemplate || 'modern';
    renderInvoiceLegalFields(currentLang, settings);
    pendingInvoiceLogoDataUrl = settings.invoiceLogoDataUrl || '';
    pendingInvoiceStampDataUrl = settings.invoiceStampDataUrl || '';
    setInvoiceAssetPreview('#invoice-logo-preview', pendingInvoiceLogoDataUrl);
    setInvoiceAssetPreview('#invoice-stamp-preview', pendingInvoiceStampDataUrl);
    const logoInput = $('#invoice-logo-upload');
    const stampInput = $('#invoice-stamp-upload');
    if (logoInput) logoInput.value = '';
    if (stampInput) stampInput.value = '';
  }

  function loadBillingProfileSettings() {
    const profile = getBillingProfile();
    const userEmail = String(window.FirebaseService?.getCurrentUser?.()?.email || '').trim();
    const fullNameInput = $('#profile-full-name');
    const addressInput = $('#profile-address');
    const siretInput = $('#profile-siret-number');
    const registrationInput = $('#profile-registration-number');
    const emailInput = $('#profile-email');
    const planBadge = $('#profile-plan-badge');
    const planLabel = $('#profile-plan-label');
    const currentPlanText = getPlanBadgeText(currentUserPlan);

    if (fullNameInput) fullNameInput.value = profile.fullName || '';
    if (addressInput) addressInput.value = profile.address || '';
    if (siretInput) siretInput.value = profile.siretNumber || '';
    if (registrationInput) registrationInput.value = profile.invoiceRegistrationNumber || '';
    if (emailInput) emailInput.value = profile.email || userEmail;
    if (planBadge) {
      planBadge.textContent = currentPlanText;
      planBadge.dataset.plan = normalizeUserPlan(currentUserPlan);
    }
    if (planLabel) planLabel.textContent = currentPlanText;
    updateAdminTotpControlsVisibility();
  }

  function handleSaveBillingProfile() {
    const fullName = $('#profile-full-name')?.value || '';
    const address = $('#profile-address')?.value || '';
    const siretNumber = $('#profile-siret-number')?.value || '';
    const invoiceRegistrationNumber = $('#profile-registration-number')?.value || '';
    const email = $('#profile-email')?.value || '';

    saveBillingProfile({
      fullName,
      address,
      siretNumber,
      invoiceRegistrationNumber,
      email,
    });
    setStudioName(fullName, { persistCloud: true });
    updateHeaderBrandWordmark();
    showToast(t('billingProfileSaved') || t('msgSettingsSaved'));
  }

  function handleTaxEnabledChange(e) {
    $('#tax-options').style.display = e.target.checked ? 'block' : 'none';
  }

  function handleTaxLabelChange(e) {
    $('#tax-label-custom').style.display = e.target.value === 'Custom' ? 'block' : 'none';
  }

  async function handleInvoiceLogoUploadChange(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;
    try {
      pendingInvoiceLogoDataUrl = await readImageFileAsDataUrl(file);
      setInvoiceAssetPreview('#invoice-logo-preview', pendingInvoiceLogoDataUrl);
    } catch (err) {
      console.error('Invoice logo load failed', err);
      showToast(t('invoiceLogoLoadFailed') || 'Failed to load logo image.', 'error');
    }
  }

  async function handleInvoiceStampUploadChange(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;
    try {
      pendingInvoiceStampDataUrl = await readImageFileAsDataUrl(file);
      setInvoiceAssetPreview('#invoice-stamp-preview', pendingInvoiceStampDataUrl);
    } catch (err) {
      console.error('Invoice stamp load failed', err);
      showToast(t('invoiceStampLoadFailed') || 'Failed to load stamp image.', 'error');
    }
  }

  function handleClearInvoiceLogoClick() {
    pendingInvoiceLogoDataUrl = '';
    setInvoiceAssetPreview('#invoice-logo-preview', '');
    const input = $('#invoice-logo-upload');
    if (input) input.value = '';
  }

  function handleClearInvoiceStampClick() {
    pendingInvoiceStampDataUrl = '';
    setInvoiceAssetPreview('#invoice-stamp-preview', '');
    const input = $('#invoice-stamp-upload');
    if (input) input.value = '';
  }

  function handleSaveInvoiceSettings() {
    const label = $('#tax-label').value === 'Custom' ? $('#tax-label-custom').value : $('#tax-label').value;
    const currentSettings = getTaxSettings();
    const profile = getInvoiceCountryProfile(currentLang);
    const settings = {
      enabled: $('#tax-enabled').checked,
      rate: Number($('#tax-rate').value),
      label: label,
      included: $('#tax-included').checked,
      companyName: $('#invoice-company-name').value,
      address: $('#invoice-address').value,
      email: $('#invoice-email').value,
      phone: $('#invoice-phone').value,
      bank: $('#invoice-bank').value,
      invoiceTemplate: $('#invoice-template').value || 'modern',
      invoiceFooterMessage: currentSettings.invoiceFooterMessage || getDefaultInvoiceMessage(),
      invoiceLogoDataUrl: pendingInvoiceLogoDataUrl || '',
      invoiceStampDataUrl: pendingInvoiceStampDataUrl || '',
      invoiceRegionCode: profile.code || currentSettings.invoiceRegionCode || '',
      legalFieldValues: {
        ...(currentSettings.legalFieldValues || {}),
        ...getInvoiceLegalFieldValuesFromForm(),
      },
    };
    saveTaxSettings(settings);
    showToast(t('msgSettingsSaved'));
  }

  function loadContractTemplateSettings() {
    const textarea = $('#contract-template-editor');
    if (textarea) textarea.value = contractTemplateText || getDefaultContractTemplateText();
  }

  function applyContractTemplatePreset(presetKey) {
    const presets = getContractPresetTemplates();
    const next = presets[presetKey] || presets.standard;
    const textarea = $('#contract-template-editor');
    if (textarea) textarea.value = next;
  }

  function handleSaveContractTemplate() {
    const textarea = $('#contract-template-editor');
    if (!textarea) return;
    saveContractTemplate(textarea.value);
    loadContractTemplateSettings();
    showToast(t('contractTemplateSaved'));
  }

  window.getContractTemplateText = function () {
    return contractTemplateText || getDefaultContractTemplateText();
  };

  // ===== Helper Functions for Invoice/Quote/Contract =====
  window.generateInvoiceByID = function(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer && window.generateInvoicePDF) {
      window.generateInvoicePDF(customer);
    }
  };

  window.generateQuoteByID = function(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer && window.generateQuotePDF) {
      window.generateQuotePDF(customer);
    }
  };

  window.openCustomerDetailByID = function(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    openDetail(customer.id);
  };

  window.openCustomerHistoryByID = function(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    openDetail(customer.id);
    setTimeout(() => {
      const taskList = document.getElementById('task-list');
      if (taskList) taskList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 280);
  };

  window.openContractModalByID = function(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    if (window.generateContract) {
      window.generateContract(customer, 'custom');
      showToast(t('contractGenerated'));
      return;
    }

    if (window.openContractModal) {
      window.openContractModal(customer);
    }
  };

  function handleLanguageSelectChange(event) {
    const selected = event?.target?.value;
    if (!selected) return;
    if (!canUseLanguageByPlan(selected, currentUserPlan)) {
      showToast(t('planFeatureLanguageLocked') || 'Upgrade required to use this language.', 'error');
      getLanguageSelectElements().forEach((languageSelect) => {
        languageSelect.value = currentLang;
      });
      return;
    }
    applyInvoiceLocaleDefaults(selected, { force: true });
    updateUITS(selected);
    if (settingsOverlay?.classList.contains('active')) {
      renderSettings();
      renderPlanManagementSection();
      loadInvoiceSettings();
    }
    setMobileHeaderMenuOpen(false);
  }

  function handleOpenSettingsClick() {
    setDashboardQuickMenuOpen(false);
    setListColumnsMenuOpen(false);
    setMobileHeaderMenuOpen(false);
    renderSettings();
    loadBillingProfileSettings();
    loadContractTemplateSettings();
    renderPlanManagementSection();
    updateTeamManagementTabAvailability();
    updateAdminSettingsAvailability();
    if (canAccessAdminPanel()) {
      refreshAdminOverview();
      refreshAdminDeviceList();
    } else if (isCurrentUserAdmin()) {
      const normalizedReason = String(adminSecurityContext.reason || '').trim().toLowerCase();
      if (normalizedReason === 'admin_security_init_failed') {
        setAdminDeviceWarning('');
        setAdminSecurityStatusMini('error');
      } else {
        const warning = getAdminSecurityWarningMessage(adminSecurityContext.reason);
        if (warning) setAdminDeviceWarning(warning, 'error');
      }
    }
    updateSettingsCurrentTabIndicator();
    settingsOverlay?.classList.add('active');
  }

  function handleAddCustomerClick() {
    setMobileHeaderMenuOpen(false);
    openModal();
  }

  function handleTeamAddClick() {
    const name = $('#team-new-name')?.value.trim();
    const role = $('#team-new-role')?.value;
    if (!name) return;
    const nextMemberCount = getCurrentTeamMemberCount() + 1;
    const nextEstimate = calculatePlanEstimate(currentUserPlan, nextMemberCount);
    if (nextEstimate.plan === 'small_team' && nextEstimate.extraMembers > 0 && nextEstimate.extraCost > 0) {
      const confirmedAddon = confirm(t('teamAddonConfirm', {
        extraMembers: String(nextEstimate.extraMembers),
        extraCost: formatPlanMonthlyPrice(nextEstimate.extraCost),
        perMember: formatPlanMonthlyPrice(nextEstimate.extraMemberPrice),
        estimated: formatPlanMonthlyPrice(nextEstimate.totalPrice),
      }));
      if (!confirmedAddon) return;
    }
    if (nextEstimate.plan === 'medium_team' && nextEstimate.requiresEnterprise) {
      const confirmedEnterprise = confirm(t('teamEnterpriseConfirm', {
        limit: String(nextEstimate.maxMembers || 15),
      }));
      if (!confirmedEnterprise) return;
    }
    window.TeamManager.addPhotographer({ name, role });
    $('#team-new-name').value = '';
    renderTeamList();
    renderSettings();
    renderPlanManagementSection();
    populateSelects();
    showToast(t('msgMemberAdded'));
  }

  function updateSettingsCurrentTabIndicator() {
    const indicator = document.getElementById('settings-current-tab-indicator');
    if (!indicator) return;
    const activeButton = settingsOverlay?.querySelector('.settings-tab-btn.active');
    const label = String(activeButton?.textContent || '').trim();
    indicator.textContent = label ? `▶ ${label}` : '';
  }

  function bindSettingsTabListeners() {
    settingsOverlay?.querySelectorAll('.settings-tab-btn').forEach((btn) => {
      const tabName = btn.dataset.tab || 'default';
      bindEventOnce(btn, 'click', () => {
        settingsOverlay.querySelectorAll('.settings-tab-btn').forEach((b) => b.classList.remove('active'));
        settingsOverlay.querySelectorAll('.settings-tab-content').forEach((c) => c.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        if (tab === 'team' && !canAccessTeamManagement(currentUserPlan)) {
          return;
        }
        $(`#settings-content-${tab}`)?.classList.add('active');
        if (tab === 'invoice') loadInvoiceSettings();
        if (tab === 'profile') loadBillingProfileSettings();
        if (tab === 'plan') renderPlanManagementSection();
        if (tab === 'contract') loadContractTemplateSettings();
        if (tab === 'team') renderTeamList();
        if (tab === 'support') {
          refreshMySupportReplies({ notify: false });
        }
        if (tab === 'admin') {
          refreshAdminOverview();
        }
        updateSettingsCurrentTabIndicator();
      }, `settings-tab-${tabName}`);
    });
  }

  async function handleGoogleLoginClick() {
    try {
      if (window.location.protocol === 'file:') {
        activateLocalGuestMode(t('localGuestModeFile'));
        return;
      }

      if (!window.FirebaseService) {
        showToast(t('firebaseConfigLoadFailed'));
        return;
      }
      const loginFn = window.FirebaseService.signInWithPopup
        ?? window.FirebaseService.signInWithGoogle;
      await loginFn.call(window.FirebaseService);
    } catch (err) {
      console.error('Firebase Auth Error:', err?.code, err?.message);
      console.error(err);

      if (String(err?.code || '') === 'auth/operation-not-supported-in-this-environment') {
        activateLocalGuestMode(t('localGuestModeUnsupported'));
        alert(t('googleLoginUnavailableAlert'));
        return;
      }

      showToast(t('googleLoginFailed'));
      alert(t('googleLoginFailedAlert'));
    }
  }

  function handleGoogleLogoutClick() {
    isLoggedIn = false;
    mergePromptedUid = null;
    saveLocalValue(LOCAL_GUEST_MODE_KEY, false);
    clearAdminSecurityState('not_admin');
    setCloudSyncIndicator('syncing');
    Promise.resolve(window.FirebaseService?.signOut?.())
      .catch((err) => {
        console.error('Google logout failed', err);
      })
      .finally(() => {
        setCloudSyncIndicator('local');
        setAuthScreenState('loggedOut');
      });
  }

  async function handleRefreshClick() {
    const refreshButton = document.getElementById('btn-refresh');
    if (refreshButton?.disabled) return;
    if (refreshButton) refreshButton.disabled = true;
    try {
      window.location.reload();
    } catch (err) {
      console.error('Refresh failed', err);
      showToast('更新に失敗しました。再読み込みしてください。', 'error');
    } finally {
      if (refreshButton) refreshButton.disabled = false;
    }
  }

  function enforceLoggedOutScreen() {
    if (!isLoggedIn) {
      setAuthScreenState('loggedOut');
    }
  }

  function enforceLoggedOutScreenSoon() {
    window.setTimeout(enforceLoggedOutScreen, 0);
    window.setTimeout(enforceLoggedOutScreen, 200);
    window.setTimeout(enforceLoggedOutScreen, 600);
  }

  function patchAuthBootstrapForMobile() {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    enforceLoggedOutScreenSoon();
  }

  function bindCoreUIEventListeners() {
    updateListSettingsButtonLabel();
    getLanguageSelectElements().forEach((selectEl, index) => {
      bindEventOnce(selectEl, 'change', handleLanguageSelectChange, `lang-select-change-${index}`);
    });
    getHeaderCurrencySelectElements().forEach((currencySelectEl, index) => {
      bindEventOnce(currencySelectEl, 'change', (event) => {
        const nextCurrency = String(event?.target?.value || '').trim();
        if (!nextCurrency) return;
        updateCurrency(nextCurrency);
        setMobileHeaderMenuOpen(false);
      }, `header-currency-select-change-${index}`);
    });
    bindEventOnce(document.getElementById('btn-theme'), 'click', toggleTheme, 'theme-toggle-click');
    if (ENABLE_STATS_FEATURES) {
      bindEventOnce(document.getElementById('btn-toggle-dashboard'), 'click', handleDashboardToggleButtonClick, 'dashboard-visibility-toggle');
      bindEventOnce(document.getElementById('btn-toggle-graph'), 'click', handleGraphToggleButtonClick, 'graph-visibility-toggle');
    }
    bindEventOnce(document.getElementById('btn-list-columns'), 'click', handleListColumnsToggleButtonClick, 'list-columns-toggle');
    bindEventOnce(document, 'click', handleDashboardQuickMenuOutsideClick, 'dashboard-quick-menu-outside-click');
    bindEventOnce(document, 'click', handleListColumnsOutsideClick, 'list-columns-outside-click');
    bindEventOnce(document, 'keydown', handleDashboardQuickMenuEscape, 'dashboard-quick-menu-escape');
    bindEventOnce(document, 'keydown', handleListColumnsEscape, 'list-columns-escape');
    bindEventOnce(window, 'resize', handleListColumnsViewportChange, 'list-columns-viewport-resize');
    bindEventOnce(window, 'scroll', handleListColumnsViewportChange, 'list-columns-viewport-scroll', true);
    bindEventOnce(mobileHeaderMenuButton, 'click', handleMobileHeaderMenuToggleClick, 'mobile-header-menu-toggle');
    bindEventOnce(document, 'click', handleMobileHeaderMenuOutsideClick, 'mobile-header-menu-outside');
    bindEventOnce(document, 'keydown', handleMobileHeaderMenuEscape, 'mobile-header-menu-escape');
    bindEventOnce(headerActions, 'click', handleMobileHeaderActionClick, 'mobile-header-menu-action-click');
    bindEventOnce(window, 'resize', handleMobileHeaderViewportChange, 'mobile-header-menu-viewport');
    bindEventOnce(mobileFilterToggleButton, 'click', handleMobileFilterToggleClick, 'mobile-filter-toggle');
    bindEventOnce(mobileFilterSheetOverlay, 'click', handleMobileFilterSheetOverlayClick, 'mobile-filter-overlay-click');
    bindEventOnce(mobileFilterCloseButton, 'click', () => setMobileFilterSheetOpen(false), 'mobile-filter-close');
    bindEventOnce(mobileFilterPayment, 'change', handleMobileFilterSheetControlChange, 'mobile-filter-payment-change');
    bindEventOnce(mobileFilterPhotographer, 'change', handleMobileFilterSheetControlChange, 'mobile-filter-photographer-change');
    bindEventOnce(mobileFilterMonth, 'change', handleMobileFilterSheetControlChange, 'mobile-filter-month-change');
    bindEventOnce(mobileSortQuickList, 'click', handleMobileSortQuickClick, 'mobile-filter-sort-quick-click');
    bindEventOnce(document, 'keydown', handleMobileFilterSheetEscape, 'mobile-filter-escape');
    bindEventOnce(window, 'resize', handleMobileFilterSheetViewportChange, 'mobile-filter-viewport');
    bindEventOnce(document.getElementById('form-plan'), 'change', handlePlanSelectChange, 'form-plan-select-change');
    bindEventOnce(document.getElementById('form-plan-price'), 'input', handlePlanPriceInputChange, 'form-plan-price-input');
    bindEventOnce(document.getElementById('form-plan-cost'), 'input', handlePlanCostInputChange, 'form-plan-cost-input');
    bindEventOnce(document.getElementById('form-base-price'), 'input', handleBasePriceInputChange, 'form-base-price-input');
    bindEventOnce(document.getElementById('form-price-adjustment'), 'input', updateGrandTotal, 'form-price-adjustment-input');
    bindEventOnce(document.getElementById('form-revenue'), 'input', syncAdjustmentFromRevenueInput, 'form-revenue-input');
    bindEventOnce(document.getElementById('form-expense'), 'input', handleExpenseInputChange, 'form-expense-input');
    bindEventOnce(document.getElementById('form-total-price'), 'input', syncAdjustmentFromTotalInput, 'form-total-price-input');
    bindEventOnce(document.getElementById('btn-add'), 'click', handleAddCustomerClick, 'add-customer-click');
    bindEventOnce(document.getElementById('btn-add-fab'), 'click', handleAddCustomerClick, 'add-customer-fab-click');
    bindEventOnce(document.getElementById('btn-settings'), 'click', handleOpenSettingsClick, 'open-settings-click');
    bindEventOnce(document.getElementById('btn-sync-export'), 'click', handleSyncExportClick, 'sync-export-click');
    bindEventOnce(document.getElementById('btn-sync-import'), 'click', handleSyncImportClick, 'sync-import-click');
    bindEventOnce(document.getElementById('import-file'), 'change', handleImportFileChange, 'import-file-change');
    bindEventOnce(document.getElementById('btn-export'), 'click', handleCsvExportClick, 'csv-export-click');
    bindEventOnce(document.getElementById('btn-ics-export'), 'click', handleIcsExportClick, 'ics-export-click');
    bindEventOnce(document.getElementById('btn-team-add'), 'click', handleTeamAddClick, 'team-add-click');
    bindEventOnce(document.getElementById('btn-enterprise-contact-submit'), 'click', handleEnterpriseContactSubmit, 'enterprise-contact-submit');
    bindEventOnce(document.getElementById('btn-enterprise-contact-cancel'), 'click', closeEnterpriseContactModal, 'enterprise-contact-cancel');
    bindEventOnce(document.getElementById('btn-enterprise-contact-close'), 'click', closeEnterpriseContactModal, 'enterprise-contact-close');
    bindEventOnce(document.getElementById('enterprise-contact-overlay'), 'click', (event) => {
      if (event.target?.id === 'enterprise-contact-overlay') closeEnterpriseContactModal();
    }, 'enterprise-contact-overlay-close');
    bindEventOnce(document.getElementById('btn-support-submit'), 'click', handleSupportTicketSubmit, 'support-ticket-submit');
    bindEventOnce(document.getElementById('add-item-btn'), 'click', () => addDynamicChargeItem(), 'add-extra-item-click');
    bindEventOnce(document.getElementById('btn-google-login'), 'click', handleGoogleLoginClick, 'google-login-banner');
    bindEventOnce(document.getElementById('btn-google-login-screen'), 'click', handleGoogleLoginClick, 'google-login-screen');
    bindEventOnce(document.getElementById('btn-logout'), 'click', handleGoogleLogoutClick, 'google-logout');
    bindEventOnce(document.getElementById('btn-refresh'), 'click', handleRefreshClick, 'manual-refresh');
    document.querySelectorAll('[data-legal-doc]').forEach((link, index) => {
      bindEventOnce(link, 'click', handleLegalDocLinkClick, `legal-doc-link-${index}`);
    });
    document.querySelectorAll('[data-contact-link]').forEach((link, index) => {
      bindEventOnce(link, 'click', (event) => {
        event.preventDefault();
        openContactModal();
      }, `contact-link-${index}`);
    });
    legalRegionTabs.forEach((button, index) => {
      bindEventOnce(button, 'click', handleLegalRegionTabClick, `legal-region-tab-${index}`);
    });
    bindEventOnce(legalModalCloseButton, 'click', closeLegalModal, 'legal-modal-close-top');
    bindEventOnce(legalModalCloseFooterButton, 'click', closeLegalModal, 'legal-modal-close-footer');
    bindEventOnce(legalModalOverlay, 'click', (event) => {
      if (event?.target?.id === 'legal-modal-overlay') closeLegalModal();
    }, 'legal-modal-overlay-close');
    bindEventOnce(document, 'keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (legalModalOverlay?.classList.contains('active')) closeLegalModal();
      if (contactModalOverlay?.classList.contains('active')) closeContactModal();
    }, 'legal-modal-escape');
    bindEventOnce(contactModalCloseButton, 'click', closeContactModal, 'contact-modal-close-top');
    bindEventOnce(contactModalCloseFooterButton, 'click', closeContactModal, 'contact-modal-close-footer');
    bindEventOnce(contactModalSubmitButton, 'click', handleContactSubmit, 'contact-submit');
    bindEventOnce(contactModalOverlay, 'click', (event) => {
      if (event?.target?.id === 'contact-modal-overlay') closeContactModal();
    }, 'contact-modal-overlay-close');
    bindSettingsTabListeners();
  }

  function bindFeatureEventListeners() {
    bindSortEventListeners();
    bindViewTabEventListeners();
    bindCalendarNavigationEventListeners();
    bindToolbarFilterEventListeners();
    bindContractTemplateEventListeners();
    bindEventOnce($('#btn-confirm-delete'), 'click', handleConfirmDeleteClick, 'confirm-delete');
    bindEventOnce(document.getElementById('btn-add-invoice-item'), 'click', handleAddInvoiceItemClick, 'invoice-item-add');
    bindEventOnce(document.getElementById('btn-preview-custom-invoice'), 'click', openInvoicePreviewModal, 'invoice-preview-open');
    bindEventOnce(document.getElementById('btn-generate-custom-invoice'), 'click', handleGenerateCustomInvoiceClick, 'invoice-generate-custom');
    bindEventOnce(document.getElementById('btn-print-invoice-preview'), 'click', handleInvoicePreviewPrintClick, 'invoice-preview-print');
    bindEventOnce(document.getElementById('btn-download-invoice-preview-pdf'), 'click', handleInvoicePreviewPdfDownloadClick, 'invoice-preview-pdf');
    bindEventOnce(document.getElementById('btn-invoice-due-plus14'), 'click', handleInvoiceDuePlus14Click, 'invoice-due-plus14');
    bindEventOnce(document.getElementById('invoice-logo-upload'), 'change', handleInvoiceLogoUploadChange, 'invoice-logo-upload');
    bindEventOnce(document.getElementById('invoice-stamp-upload'), 'change', handleInvoiceStampUploadChange, 'invoice-stamp-upload');
    bindEventOnce(document.getElementById('btn-clear-invoice-logo'), 'click', handleClearInvoiceLogoClick, 'invoice-logo-clear');
    bindEventOnce(document.getElementById('btn-clear-invoice-stamp'), 'click', handleClearInvoiceStampClick, 'invoice-stamp-clear');
    bindEventOnce($('#tax-enabled'), 'change', handleTaxEnabledChange, 'tax-enabled-change');
    bindEventOnce($('#tax-label'), 'change', handleTaxLabelChange, 'tax-label-change');
    bindEventOnce($('#btn-save-invoice-settings'), 'click', handleSaveInvoiceSettings, 'tax-settings-save');
    bindEventOnce(document.getElementById('btn-save-billing-profile'), 'click', handleSaveBillingProfile, 'billing-profile-save');
    bindEventOnce(document.getElementById('btn-admin-refresh'), 'click', refreshAdminOverview, 'admin-overview-refresh');
    bindEventOnce(document.getElementById('btn-admin-support-refresh'), 'click', refreshAdminSupportTickets, 'admin-support-refresh');
    bindEventOnce(document.getElementById('admin-support-ticket-list-body'), 'click', handleAdminSupportTicketListClick, 'admin-support-list-click');
    bindEventOnce(document.getElementById('btn-admin-support-reply'), 'click', handleAdminSupportReplySubmit, 'admin-support-reply');
    bindEventOnce(document.getElementById('btn-save-contract-template'), 'click', handleSaveContractTemplate, 'contract-template-save');
    bindEventOnce(document.getElementById('btn-contract-preset-standard'), 'click', () => applyContractTemplatePreset('standard'), 'contract-preset-standard');
    bindEventOnce(document.getElementById('btn-contract-preset-bridal'), 'click', () => applyContractTemplatePreset('bridal'), 'contract-preset-bridal');
    bindEventOnce(document.getElementById('btn-contract-preset-light'), 'click', () => applyContractTemplatePreset('light'), 'contract-preset-light');
    initCalendarFilters();
    bindExpenseModalEvents();
  }

  let uiInitialized = false;

  function initializeUI() {
    if (uiInitialized) return;
    bindCoreUIEventListeners();
    bindFeatureEventListeners();
    setListColumnsMenuOpen(false);
    hookPhotographerOther();
    uiInitialized = true;
  }

  // ===== Initialization =====
  function init() {
    if (appInitialized) return;

    // 1. Apply theme first (prevents flash)
    applyTheme(FORCE_DARK_MODE ? 'dark' : currentTheme);
    applyAccentColor(currentAccentColor, { persist: false });

    // 2. Set defaults
    syncPlanFromStorage();
    updateLanguage(currentLang || 'ja');
    applyInvoiceLocaleDefaults(currentLang || 'ja', { force: false });
    updateCurrency(currentCurrency);
    updateHeaderBrandWordmark();
    if (ENABLE_STATS_FEATURES) {
      applyHeroMetricsConfig();
      setDashboardVisibility(dashboardVisible);
      setGraphVisibility(false, false);
      applyDashboardConfig();
    } else {
      applyMinimalSafeModeUI();
    }

    // 3. Attach event listeners
    initializeUI();

    if (dashboardMonthPicker) {
      syncDashboardMonthPicker();
      bindEventOnce(dashboardMonthPicker, 'change', (e) => {
        if (!e.target.value) return;
        const [year, month] = e.target.value.split('-').map(Number);
        if (!year || !month) return;
        selectedDashboardMonth = new Date(year, month - 1, 1);
        updateDashboard();
      }, 'dashboard-month-picker-change');
    }

    if (dashboardPrevMonth) {
      bindEventOnce(dashboardPrevMonth, 'click', () => moveDashboardMonth(-1), 'dashboard-prev-month');
    }

    if (dashboardNextMonth) {
      bindEventOnce(dashboardNextMonth, 'click', () => moveDashboardMonth(1), 'dashboard-next-month');
    }

    // Initial render
    renderTable();
    renderExpenses();

    // Load saved view preference
    const savedView = getCloudValue('preferred_view', 'list');
    const activeTab = $(`.view-tab[data-view="${savedView}"]`);
    if (activeTab) activeTab.click();
    appInitialized = true;
  }

  function hydrateStateFromCloud() {
    const hydratedLang = getCloudValue(LANG_KEY, getLocalValue(LANG_KEY, 'ja'));
    currentLang = hydratedLang;
    if (!window.LOCALE || !window.LOCALE[currentLang]) currentLang = 'ja';
    currentTheme = FORCE_DARK_MODE ? 'dark' : getCloudValue(THEME_KEY, getLocalValue(THEME_KEY, 'dark'));
    currentAccentColor = normalizeAccentColor(
      getCloudValue(ACCENT_COLOR_KEY, getLocalValue(ACCENT_COLOR_KEY, DEFAULT_ACCENT_COLOR))
    );
    currentCurrency = getCloudValue(CURRENCY_KEY, getLocalValue(CURRENCY_KEY, 'USD'));
    if (!CURRENCY_CONFIG[currentCurrency]) currentCurrency = 'USD';
    currentStudioName = normalizeStudioName(getCloudValue(STUDIO_NAME_KEY, getLocalValue(STUDIO_NAME_KEY, '')));
    syncPlanFromStorage();
    reloadRuntimeStateFromStorage();
    updateHeaderBrandWordmark();
    if (ENABLE_STATS_FEATURES) {
      applyHeroMetricsConfig();
      applyDashboardConfig();
      setDashboardVisibility(dashboardVisible);
    } else {
      applyMinimalSafeModeUI();
    }
    renderListColumnsMenu();
  }

  let appInitialized = false;
  let isLoggedIn = false;
  let authWatcherDisabled = false;
  let authUnsubscribe = null;
  let currentAuthUserEmail = '';
  let cloudSyncState = 'local';
  let mergePromptedUid = null;
  let adminSupportTickets = [];
  let selectedAdminSupportTicketId = '';
  let adminDeviceContextCache = null;
  let adminDeviceState = { approved: [], pending: [] };
  let adminSecurityContext = {
    isAdmin: false,
    authorized: false,
    sessionActive: false,
    reason: 'not_admin',
    deviceId: '',
    mfaVerified: false,
    mfaRequired: false,
    mfaEnrolledFactorCount: 0,
    sessionToken: '',
    sessionExpiresAtMs: 0,
  };
  let adminSessionLastActivityAt = 0;
  let adminSessionTimeoutHandle = null;
  let adminSessionActivityBound = false;
  let adminSessionLastTouchedAt = 0;
  let mfaLoginChallengeInfo = null;
  let adminMfaEnrollMode = 'totp';
  let adminMfaProbeResult = null;

  function getLocaleTextOrFallback(key, fallback = '') {
    const locale = window.LOCALE?.[currentLang];
    if (locale && Object.prototype.hasOwnProperty.call(locale, key)) {
      const value = locale[key];
      if (typeof value === 'string' && value) return value;
    }
    return fallback;
  }

  function getCloudSyncStatusLabel(state) {
    if (state === 'syncing') return getLocaleTextOrFallback('cloudSyncStatusSyncing', 'Syncing to cloud...');
    if (state === 'ready') return getLocaleTextOrFallback('cloudSyncStatusReady', 'Cloud synced');
    if (state === 'error') return getLocaleTextOrFallback('cloudSyncStatusError', 'Sync error');
    return getLocaleTextOrFallback('cloudSyncStatusLocal', 'Saved locally');
  }

  function getCloudSyncTooltipLabel(state, fallbackLabel = '') {
    if (state === 'ready') return getLocaleTextOrFallback('cloudSyncStatusReady', 'Cloud synced');
    if (state === 'syncing') return getLocaleTextOrFallback('cloudSyncStatusSyncing', 'Syncing to cloud...');
    if (state === 'error') return getLocaleTextOrFallback('cloudSyncErrorRelogin', 'Sync error: please sign in again.');
    return fallbackLabel || getLocaleTextOrFallback('cloudSyncStatusLocal', 'Saved locally');
  }

  function setCloudSyncIndicator(state = 'local', customMessage = '') {
    cloudSyncState = state;
    const statusLabel = customMessage || getCloudSyncStatusLabel(state);
    const tooltipLabel = getCloudSyncTooltipLabel(state, statusLabel);
    if (cloudSyncIndicator) cloudSyncIndicator.dataset.state = state;
    if (cloudSyncIndicator) {
      cloudSyncIndicator.title = tooltipLabel;
      cloudSyncIndicator.setAttribute('aria-label', tooltipLabel);
    }
    if (cloudSyncLabel) cloudSyncLabel.textContent = statusLabel;
  }

  function getAuthDisplayName(user) {
    return String(user?.displayName || user?.email || t('authLoggedInUserFallback'));
  }

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function isAdminEmail(email) {
    return ADMIN_MANAGEMENT_EMAILS.has(normalizeEmail(email));
  }

  function isCurrentUserAdmin() {
    const currentUserEmail = String(window.FirebaseService?.getCurrentUser?.()?.email || '').trim();
    if (currentUserEmail) return isAdminEmail(currentUserEmail);
    if (typeof window.FirebaseService?.isCurrentUserAdmin === 'function') {
      try {
        return !!window.FirebaseService.isCurrentUserAdmin();
      } catch {
        return false;
      }
    }
    return false;
  }

  function formatAdminPlanLabel(plan) {
    const normalized = normalizeUserPlan(plan);
    if (normalized === 'small_team') return 'TEAM S';
    if (normalized === 'medium_team') return 'TEAM M';
    if (normalized === 'enterprise') return 'ENTERPRISE';
    if (normalized === 'individual') return 'PRO';
    return 'FREE';
  }

  function getSupportStatusLabel(status) {
    return status === 'replied' ? t('adminSupportStatusReplied') : t('adminSupportStatusPending');
  }

  function getSupportCategoryLabel(category) {
    const normalized = String(category || '').trim().toLowerCase();
    if (normalized === 'question') return t('supportCategoryQuestion');
    if (normalized === 'feature_request') return t('supportCategoryFeatureRequest');
    return t('supportCategoryBug');
  }

  function renderAdminSupportTicketDetail(ticketId = '') {
    const detailSubjectEl = document.getElementById('admin-support-detail-subject');
    const detailMessageEl = document.getElementById('admin-support-detail-message');
    const aiDraftInput = document.getElementById('admin-support-ai-draft');
    const replyInput = document.getElementById('admin-support-reply');
    const sendButton = document.getElementById('btn-admin-support-reply');
    const ticket = adminSupportTickets.find((item) => item.id === ticketId) || null;

    if (!ticket) {
      if (detailSubjectEl) detailSubjectEl.textContent = t('adminSupportSelectTicket');
      if (detailMessageEl) detailMessageEl.textContent = '—';
      if (aiDraftInput) aiDraftInput.value = '';
      if (replyInput) replyInput.value = '';
      if (sendButton) sendButton.disabled = true;
      selectedAdminSupportTicketId = '';
      return;
    }

    selectedAdminSupportTicketId = ticket.id;
    if (detailSubjectEl) {
      const subject = ticket.subject || '—';
      const meta = `${getSupportCategoryLabel(ticket.category)} · ${formatDateTime(ticket.createdAtIso)}`;
      detailSubjectEl.textContent = `${subject} (${meta})`;
    }
    if (detailMessageEl) detailMessageEl.textContent = ticket.message || '—';
    if (aiDraftInput) aiDraftInput.value = ticket.ai_draft_reply || '';
    if (replyInput) {
      const existingReply = ticket?.admin_reply?.message || ticket.user_notification_message || '';
      replyInput.value = existingReply || ticket.ai_draft_reply || '';
    }
    if (sendButton) sendButton.disabled = false;
  }

  function renderAdminSupportTicketList(tickets = []) {
    const tableBody = document.getElementById('admin-support-ticket-list-body');
    if (!tableBody) return;

    if (!Array.isArray(tickets) || tickets.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4">${escapeHtml(t('adminSupportNoData'))}</td></tr>`;
      renderAdminSupportTicketDetail('');
      return;
    }

    tableBody.innerHTML = tickets.map((ticket) => {
      const isActive = ticket.id === selectedAdminSupportTicketId;
      const status = String(ticket.status || 'pending').trim().toLowerCase();
      const statusClass = status === 'replied' ? 'admin-ticket-status-replied' : 'admin-ticket-status-pending';
      const statusLabel = getSupportStatusLabel(status);
      const userLabel = ticket.displayName || ticket.email || ticket.userId || '—';
      return `
        <tr data-ticket-id="${escapeHtml(ticket.id)}" class="${isActive ? 'active' : ''}">
          <td><span class="admin-ticket-status ${statusClass}">${escapeHtml(statusLabel)}</span></td>
          <td title="${escapeHtml(ticket.email || userLabel)}">${escapeHtml(userLabel)}</td>
          <td>${escapeHtml(getSupportCategoryLabel(ticket.category))}</td>
          <td>${escapeHtml(formatDateTime(ticket.createdAtIso))}</td>
        </tr>
      `;
    }).join('');

    const stillExists = tickets.some((ticket) => ticket.id === selectedAdminSupportTicketId);
    const targetId = stillExists ? selectedAdminSupportTicketId : tickets[0]?.id || '';
    renderAdminSupportTicketDetail(targetId);
  }

  function handleAdminSupportTicketListClick(event) {
    const row = event?.target?.closest?.('tr[data-ticket-id]');
    if (!row) return;
    const ticketId = String(row.dataset.ticketId || '').trim();
    if (!ticketId) return;
    selectedAdminSupportTicketId = ticketId;
    renderAdminSupportTicketList(adminSupportTickets);
  }

  async function refreshAdminSupportTickets() {
    if (!canAccessAdminPanel()) return;
    if (!window.FirebaseService?.getAdminSupportTickets) return;
    const currentDevice = await buildAdminDeviceContext();

    const tableBody = document.getElementById('admin-support-ticket-list-body');
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="4">${escapeHtml(t('adminLoading'))}</td></tr>`;
    }

    try {
      const result = await window.FirebaseService.getAdminSupportTickets({
        currentDeviceId: currentDevice.deviceId,
        sessionToken: adminSecurityContext.sessionToken,
      });
      if (!result?.allowed) {
        adminSecurityContext = {
          ...adminSecurityContext,
          authorized: false,
          sessionActive: false,
          reason: String(result.reason || 'unauthorized_device'),
          sessionToken: '',
          sessionExpiresAtMs: 0,
        };
        clearPersistedAdminSecureSession();
        stopAdminSessionMonitor();
        setAdminDeviceWarning(getAdminSecurityWarningMessage(adminSecurityContext.reason), 'error');
        updateAdminSettingsAvailability();
        return;
      }
      adminSupportTickets = Array.isArray(result.tickets) ? result.tickets : [];
      renderAdminSupportTicketList(adminSupportTickets);
    } catch (err) {
      console.error('Admin support tickets load failed', err);
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="4">${escapeHtml(t('adminSupportLoadFailed'))}</td></tr>`;
      }
    }
  }

  async function handleAdminSupportReplySubmit() {
    if (!canAccessAdminPanel()) {
      showToast(t('adminDeviceActionFailed'), 'error');
      return;
    }
    const ticketId = String(selectedAdminSupportTicketId || '').trim();
    if (!ticketId) {
      showToast(t('adminSupportSelectTicket'), 'error');
      return;
    }
    const aiDraftInput = document.getElementById('admin-support-ai-draft');
    const replyInput = document.getElementById('admin-support-reply');
    const sendButton = document.getElementById('btn-admin-support-reply');
    const aiDraftReply = String(aiDraftInput?.value || '').trim();
    const replyMessage = String(replyInput?.value || '').trim();
    if (!replyMessage) {
      showToast(t('adminSupportReplyValidation'), 'error');
      return;
    }

    if (sendButton) sendButton.disabled = true;
    try {
      const currentDevice = await buildAdminDeviceContext();
      await window.FirebaseService?.replySupportTicket?.(ticketId, {
        currentDeviceId: currentDevice.deviceId,
        sessionToken: adminSecurityContext.sessionToken,
        aiDraftReply,
        replyMessage,
      });
      showToast(t('adminSupportReplySent'));
      await refreshAdminSupportTickets();
    } catch (err) {
      console.error('Admin support reply submit failed', err);
      showToast(t('adminSupportLoadFailed'), 'error');
    } finally {
      if (sendButton) sendButton.disabled = false;
    }
  }

  function renderSupportRepliesForCurrentUser(tickets = []) {
    const listRoot = document.getElementById('support-reply-list');
    if (!listRoot) return;

    const repliedTickets = (Array.isArray(tickets) ? tickets : [])
      .filter((ticket) => String(ticket?.status || '').toLowerCase() === 'replied')
      .filter((ticket) => String(ticket?.admin_reply?.message || ticket?.user_notification_message || '').trim().length > 0)
      .sort((a, b) => (Number(new Date(b?.repliedAtIso || b?.createdAtIso || 0).getTime()) || 0)
        - (Number(new Date(a?.repliedAtIso || a?.createdAtIso || 0).getTime()) || 0));

    if (repliedTickets.length === 0) {
      listRoot.innerHTML = `<p class="help-text">${escapeHtml(t('supportMyRepliesEmpty'))}</p>`;
      return;
    }

    listRoot.innerHTML = repliedTickets.map((ticket) => {
      const subject = ticket.subject || '—';
      const repliedAt = formatDateTime(ticket.repliedAtIso || ticket.createdAtIso);
      const replyText = ticket.admin_reply?.message || ticket.user_notification_message || '';
      return `
        <div class="support-reply-item">
          <div class="support-reply-item-head">
            <span>${escapeHtml(t('supportReplyFromAdmin'))}</span>
            <span>${escapeHtml(t('supportReplyAt'))}: ${escapeHtml(repliedAt)}</span>
          </div>
          <div class="support-reply-item-subject">${escapeHtml(subject)}</div>
          <div class="support-reply-item-body">${escapeHtml(replyText)}</div>
        </div>
      `;
    }).join('');
  }

  async function refreshMySupportReplies(options = {}) {
    const { notify = false } = options;
    const user = window.FirebaseService?.getCurrentUser?.();
    if (!user || !window.FirebaseService?.getMySupportTickets) {
      renderSupportRepliesForCurrentUser([]);
      return;
    }
    try {
      const result = await window.FirebaseService.getMySupportTickets();
      const tickets = Array.isArray(result?.tickets) ? result.tickets : [];
      renderSupportRepliesForCurrentUser(tickets);

      if (!notify) return;
      const replied = tickets.filter((ticket) => (
        String(ticket?.status || '').toLowerCase() === 'replied'
        && String(ticket?.admin_reply?.message || ticket?.user_notification_message || '').trim().length > 0
      ));
      if (replied.length === 0) return;

      const seenMap = getLocalValue(SUPPORT_REPLY_NOTICE_SEEN_KEY, {});
      const nextSeenMap = seenMap && typeof seenMap === 'object' ? { ...seenMap } : {};
      const unseen = replied.filter((ticket) => {
        const version = String(ticket.repliedAtIso || ticket.updatedAtIso || ticket.createdAtIso || '');
        return !nextSeenMap[ticket.id] || nextSeenMap[ticket.id] !== version;
      });
      if (unseen.length === 0) return;

      showToast(t('supportReplyAvailable', { count: String(unseen.length) }));
      unseen.forEach((ticket) => {
        const version = String(ticket.repliedAtIso || ticket.updatedAtIso || ticket.createdAtIso || '');
        nextSeenMap[ticket.id] = version;
      });
      saveLocalValue(SUPPORT_REPLY_NOTICE_SEEN_KEY, nextSeenMap);
    } catch (err) {
      console.error('Support replies load failed', err);
    }
  }

  function renderAdminOverview(overview) {
    const totalUsersEl = document.getElementById('admin-stat-total-users');
    const planCountsEl = document.getElementById('admin-stat-plan-counts');
    const totalProjectsEl = document.getElementById('admin-stat-total-projects');
    const tableBody = document.getElementById('admin-user-list-body');
    if (!totalUsersEl || !planCountsEl || !totalProjectsEl || !tableBody) return;

    const safeOverview = overview && typeof overview === 'object' ? overview : {};
    const stats = safeOverview.stats && typeof safeOverview.stats === 'object' ? safeOverview.stats : {};
    const planCounts = stats.planCounts && typeof stats.planCounts === 'object'
      ? stats.planCounts
      : { free: 0, individual: 0, small_team: 0, medium_team: 0, enterprise: 0 };
    const users = Array.isArray(safeOverview.users) ? safeOverview.users : [];
    const totalUsers = Number(stats.totalUsers) || users.length || 0;
    const totalProjects = Number(stats.totalProjects) || 0;
    const teamCount = (Number(planCounts.small_team) || 0) + (Number(planCounts.medium_team) || 0) + (Number(planCounts.enterprise) || 0);

    totalUsersEl.textContent = String(totalUsers);
    planCountsEl.textContent = `FREE ${Number(planCounts.free) || 0} / PRO ${Number(planCounts.individual) || 0} / TEAM ${teamCount}`;
    totalProjectsEl.textContent = String(totalProjects);

    if (users.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="3">${escapeHtml(t('adminNoData'))}</td></tr>`;
      return;
    }

    tableBody.innerHTML = users.map((user) => `
      <tr>
        <td>${escapeHtml(user.email || '—')}</td>
        <td>${escapeHtml(formatAdminPlanLabel(user.plan))}</td>
        <td>${escapeHtml(String(Number(user.projectCount) || 0))}</td>
      </tr>
    `).join('');
  }

  async function refreshAdminOverview() {
    if (!canAccessAdminPanel()) return;
    if (!window.FirebaseService?.getAdminUserOverview) return;
    const currentDevice = await buildAdminDeviceContext();

    const tableBody = document.getElementById('admin-user-list-body');
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="3">${escapeHtml(t('adminLoading'))}</td></tr>`;
    }
    try {
      const overview = await window.FirebaseService.getAdminUserOverview({
        currentDeviceId: currentDevice.deviceId,
        sessionToken: adminSecurityContext.sessionToken,
      });
      if (!overview?.allowed) {
        adminSecurityContext = {
          ...adminSecurityContext,
          authorized: false,
          sessionActive: false,
          reason: String(overview.reason || 'unauthorized_device'),
          sessionToken: '',
          sessionExpiresAtMs: 0,
        };
        clearPersistedAdminSecureSession();
        stopAdminSessionMonitor();
        setAdminDeviceWarning(getAdminSecurityWarningMessage(adminSecurityContext.reason), 'error');
        updateAdminSettingsAvailability();
        return;
      }
      renderAdminOverview(overview);
      await refreshAdminSupportTickets();
      await refreshAdminDeviceList();
    } catch (err) {
      console.error('Admin overview load failed', err);
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="3">${escapeHtml(t('adminLoadFailed'))}</td></tr>`;
      }
    }
  }

  function updateAdminSettingsAvailability() {
    const tabButton = document.getElementById('settings-tab-admin');
    const tabContent = document.getElementById('settings-content-admin');
    if (!tabButton || !tabContent) return;

    const hasAdminAccess = isCurrentUserAdmin();
    tabButton.style.display = hasAdminAccess ? '' : 'none';

    if (hasAdminAccess) {
      setAdminDeviceWarning('');
      setAdminSecurityStatusMini('online');
      return;
    }

    tabButton.classList.remove('active');
    tabContent.classList.remove('active');
    const menuTab = settingsOverlay?.querySelector('.settings-tab-btn[data-tab="menu"]');
    const menuContent = document.getElementById('settings-content-menu');
    if (menuTab) menuTab.classList.add('active');
    if (menuContent) menuContent.classList.add('active');
    setAdminDeviceWarning('');
    setAdminSecurityStatusMini('online');
  }

  function updateHeaderAuthUi(user = null) {
    const headerPlanBadge = document.getElementById('header-plan-badge');
    const headerPlanUsage = document.getElementById('header-plan-usage');
    const hasUser = !!user;
    if (headerPlanBadge) {
      headerPlanBadge.style.display = hasUser ? 'inline-flex' : 'none';
    }
    updateHeaderPlanBadge();
    if (!hasUser && headerPlanUsage) {
      headerPlanUsage.style.display = 'none';
    }
    updateAdminSettingsAvailability();
  }

  function hasGuestLocalData() {
    const localCustomers = getLocalValue(STORAGE_KEY, []);
    const localExpenses = getLocalValue(EXPENSES_KEY, []);
    const customerCount = Array.isArray(localCustomers) ? localCustomers.length : 0;
    const expenseCount = Array.isArray(localExpenses) ? localExpenses.length : 0;
    return customerCount > 0 || expenseCount > 0;
  }

  async function maybeMergeGuestDataToCloud(user) {
    if (!user || !window.FirebaseService) return;
    if (mergePromptedUid === user.uid) return;
    mergePromptedUid = user.uid;

    setCloudSyncIndicator('syncing');
    try {
      await (
        window.FirebaseService.autoSyncLocalDataToCloud?.()
        ?? window.FirebaseService.mergeLocalDataToCloud?.({ overwrite: false })
      );
    } catch (err) {
      console.error('Local merge to cloud failed', err);
    }
  }

  function getAppContainerElement() {
    const byId = document.getElementById('app-container');
    if (byId) return byId;
    const byClass = document.querySelector('.app-container');
    if (byClass && !byClass.id) byClass.id = 'app-container';
    return byClass;
  }

  function setAuthScreenState(state, user = null) {
    const appContainer = getAppContainerElement();
    const authScreenRoot = document.getElementById('auth-screen');
    const authScreen = document.getElementById('auth-screen') || document.getElementById('login-screen');
    const loginScreen = document.getElementById('login-screen');
    const authBanner = document.getElementById('auth-banner');
    const authStatus = document.getElementById('auth-status');
    const loginBtn = document.getElementById('btn-google-login');
    const loginScreenBtn = document.getElementById('btn-google-login-screen');
    const logoutBtn = document.getElementById('btn-logout');
    const refreshBtn = document.getElementById('btn-refresh');

    if (state === 'checking') {
      if (authStatus) authStatus.textContent = t('authChecking');
      if (loginBtn) loginBtn.style.display = 'none';
      if (loginScreenBtn) loginScreenBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (refreshBtn) refreshBtn.style.display = 'none';
      if (authScreen) authScreen.style.display = 'none';
      if (loginScreen) loginScreen.style.display = 'none';
      if (authBanner) authBanner.style.display = 'flex';
      if (appContainer) appContainer.style.display = 'none';
      updateHeaderAuthUi(null);
      setCloudSyncIndicator('syncing');
      return;
    }

    if (state === 'loggedOut') {
      isLoggedIn = false;
      currentAuthUserEmail = '';
      clearAdminSecurityState('not_admin');
      setCurrentUserPlan('free', { persistCloud: false });
      if (authStatus) authStatus.textContent = t('authLoggedOutPrompt');
      if (loginBtn) loginBtn.style.display = '';
      if (loginScreenBtn) loginScreenBtn.style.display = '';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (refreshBtn) refreshBtn.style.display = 'none';
      if (authScreenRoot) authScreenRoot.style.display = 'block';
      if (authScreen) authScreen.style.display = 'block';
      if (loginScreen) loginScreen.style.display = 'flex';
      if (authBanner) authBanner.style.display = 'none';
      if (appContainer) appContainer.style.display = 'none';
      updateHeaderAuthUi(null);
      renderSupportRepliesForCurrentUser([]);
      setCloudSyncIndicator('local');
      return;
    }

    if (state === 'loggedIn') {
      const userName = getAuthDisplayName(user);
      currentAuthUserEmail = String(user?.email || '').trim();
      syncPlanFromStorage();
      if (authStatus) authStatus.textContent = t('authLoggedInAs', { user: userName });
      if (loginBtn) loginBtn.style.display = 'none';
      if (loginScreenBtn) loginScreenBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = '';
      if (refreshBtn) refreshBtn.style.display = 'inline-flex';
      if (authScreen) authScreen.style.display = 'none';
      if (loginScreen) loginScreen.style.display = 'none';
      if (authBanner) authBanner.style.display = 'none';
      if (appContainer) appContainer.style.display = 'block';
      updateHeaderAuthUi(user);
      setCloudSyncIndicator('syncing', `${t('cloudSyncStatusSyncing')} (${userName})`);
    }
  }

  async function handleAuthState(user) {
    // UI control is handled by onAuthChanged. This function handles data loading only.
    const resolvedUser = user || window.FirebaseService?.getCurrentUser?.() || null;
    if (!resolvedUser) return;

    try {
      await window.FirebaseService.loadForUser(resolvedUser);
      hydrateStateFromCloud();
      syncPlanFromStorage();
      if (window.FirebaseService?.setUserPlan && !getCloudValue('plan', null)) {
        window.FirebaseService.setUserPlan(currentUserPlan).catch((err) => {
          console.warn('User plan bootstrap save failed', err);
        });
      }
      applyTheme(currentTheme);
      updateLanguage(currentLang || 'ja');
      updateCurrency(currentCurrency);
      renderTable();
      renderExpenses();
      updateDashboard();
      populateSelects();
      syncCalendarFilterControls();
      if (calendarView.classList.contains('active')) renderCalendar();
      setCloudSyncIndicator('ready');
      refreshMySupportReplies({ notify: true });
    } catch (err) {
      console.error('Cloud data load failed', err);
      showToast(
        getLocaleTextOrFallback(
          'cloudDataLoadRetryMessage',
          'クラウドデータの読み込みに失敗しました。右上の更新ボタンから再試行してください。'
        ),
        'error'
      );
      setCloudSyncIndicator('error');
    } finally {
      const appContainer = document.getElementById('app-container');
      if (appContainer) appContainer.style.display = 'block';
    }
  }

  function registerPwaServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('SW registration failed', err);
    });
  }

  async function initializeFirebaseAuthFlow() {
    try {
      if (shouldStartInLocalGuestMode()) {
        activateLocalGuestMode(
          window.location.protocol === 'file:'
            ? t('localGuestModeFile')
            : t('localGuestModeDefault')
        );
        return;
      }

      if (SAFE_MODE_MINIMAL_BOOT) {
        authWatcherDisabled = true;
        if (typeof authUnsubscribe === 'function') {
          authUnsubscribe();
          authUnsubscribe = null;
        }
        isLoggedIn = false;
        safeRun('safeMode.theme', () => applyTheme('dark'));
        safeRun('safeMode.language', () => updateLanguage(currentLang || 'ja'));
        safeRun('safeMode.applyMinimalSafeModeUI', () => applyMinimalSafeModeUI());
        setAuthScreenState('loggedOut');
        return;
      }

      if (!window.FirebaseService) {
        console.error('FirebaseService is not available.');
        showToast(t('firebaseConfigLoadFailed'));
        setAuthScreenState('loggedOut');
        return;
      }

      await window.FirebaseService.whenReady();

      authWatcherDisabled = false;
      if (typeof authUnsubscribe === 'function') {
        authUnsubscribe();
        authUnsubscribe = null;
      }

      authUnsubscribe = window.FirebaseService.onAuthChanged((user) => {
        if (authWatcherDisabled) return;

        if (user) {
          isLoggedIn = true;
          saveLocalValue(LOCAL_GUEST_MODE_KEY, false);
          setAuthScreenState('loggedIn', user);
          (async () => {
            await maybeMergeGuestDataToCloud(user);
            await handleAuthState(user);
            await initializeAdminSecurityForUser(user);
            setCloudSyncIndicator('ready');
          })().catch((err) => {
            console.error('Auth state update failed', err);
            setCloudSyncIndicator('error');
          });
          return;
        }

        isLoggedIn = false;
        clearAdminSecurityState('not_admin');
        if (window.location.protocol === 'file:' && hasGuestLocalData()) {
          activateLocalGuestMode(t('localGuestModeDefault'));
          return;
        }
        setAuthScreenState('loggedOut');
      });
    } catch (err) {
      console.error('Firebase auth bootstrap failed', err);
      setAuthScreenState('loggedOut');
      showToast(t('firebaseAuthInitFailed'));
    }
  }

  async function bootstrapApp() {
    initializeManifestSafely();

    const restoredFromMirror = await restoreLocalStorageFromIndexedDBIfNeeded();
    mirrorCurrentLocalStorageToIndexedDB();
    if (restoredFromMirror) reloadRuntimeStateFromStorage();

    init();
    setAuthScreenState('checking');
    patchAuthBootstrapForMobile();
    registerPwaServiceWorker();
    await initializeFirebaseAuthFlow();
  }

  // Ensure DOM is ready before initializing
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await bootstrapApp();
      scheduleVerticalLongVowelNormalization();
    } catch (err) {
      console.error('App bootstrap failed', err);
      try {
        init();
        setAuthScreenState('loggedOut');
        scheduleVerticalLongVowelNormalization();
      } catch (fallbackErr) {
        console.error('Bootstrap fallback failed', fallbackErr);
      }
    }
  });

})();
