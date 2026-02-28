// ===== PhotoCRM - Application Logic =====

(function () {
  'use strict';

  // ===== Storage Keys =====
  const STORAGE_KEY = 'photocrm_customers';
  const OPTIONS_KEY = 'photocrm_options';
  const THEME_KEY = 'photocrm_theme';
  const LANG_KEY = 'photocrm_lang';
  const TAX_SETTINGS_KEY = 'photocrm_tax_settings';
  const INVOICE_SENDER_PROFILE_KEY = 'photocrm_invoice_sender_profile';
  const EXPENSES_KEY = 'photocrm_expenses';
  const CURRENCY_KEY = 'photocrm_currency';
  const CUSTOM_FIELDS_KEY = 'photocrm_custom_fields';
  const CALENDAR_FILTERS_KEY = 'photocrm_calendar_filters';
  const DEFAULT_INVOICE_MESSAGE = 'この度はありがとうございます。';
  const FREE_PLAN_LIMIT = 30;

  function getCloudValue(key, fallback) {
    const value = window.FirebaseService?.getCachedData(key);
    return value === undefined ? fallback : value;
  }

  function getLocalValue(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    } catch {
      return fallback;
    }
  }

  function saveLocalValue(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`Failed to save local value: ${key}`, err);
    }
  }

  function saveCloudValue(key, value) {
    window.FirebaseService?.saveKey(key, value).catch((err) => {
      console.error(`Failed to save ${key}`, err);
    });
  }

  // ===== Language Management =====
  let currentLang = getCloudValue(LANG_KEY, getLocalValue(LANG_KEY, 'en'));
  if (!window.LOCALE || !window.LOCALE[currentLang]) currentLang = 'en';

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

  function updateLanguage(lang) {
    if (!window.LOCALE || !window.LOCALE[lang]) {
      console.warn(`Unsupported language "${lang}". Falling back to English.`);
      lang = 'en';
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

    // Update language selector
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.value = lang;
    }

    // Re-render dynamic content
    if (typeof renderTable === 'function') renderTable();
    if (typeof updateStats === 'function') updateStats();
    if (typeof renderCalendar === 'function') renderCalendar();
    if (typeof populateSelects === 'function') populateSelects();
    if (typeof updateDashboard === 'function') updateDashboard();
    if (typeof renderExpenses === 'function') renderExpenses();

  }
  window.updateLanguage = updateLanguage;

  // ===== Default Custom Options =====
  const DEFAULT_OPTIONS = {
    plan: [],
    costume: ['ウェディングドレス', 'カラードレス', '和装', '私服'],
    hairMakeup: [],
  };

  const OPTION_LABELS = {
    plan: 'プラン',
    costume: '衣装',
    hairMakeup: 'ヘアメイク',
  };

  // ===== Storage Helpers =====
  function loadCustomers() {
    const loaded = getCloudValue(STORAGE_KEY, []);
    const records = Array.isArray(loaded) ? loaded : [];
    return withCurrentUserId(records).map((record) => ({
      ...record,
      planDetails: normalizePlanDetails(record?.planDetails, record?.revenue),
    }));
  }
  function withCurrentUserId(records) {
    const uid = window.FirebaseService?.getCurrentUser?.()?.uid;
    if (!uid || !Array.isArray(records)) return records;
    return records.map((record) => ({ ...record, userId: uid }));
  }

  function saveCustomers(data) {
    const records = Array.isArray(data) ? data : [];
    const normalized = records.map((record) => ({
      ...(record || {}),
      planDetails: normalizePlanDetails(record?.planDetails, record?.revenue),
    }));
    saveCloudValue(STORAGE_KEY, withCurrentUserId(normalized));
  }

  function loadOptions() {
    return { ...DEFAULT_OPTIONS, ...(getCloudValue(OPTIONS_KEY, {}) || {}) };
  }
  function saveOptions(data) { saveCloudValue(OPTIONS_KEY, data); }

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
  let customers = loadCustomers();
  let options = loadOptions();
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

  // Init calendar to current month
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  let selectedDashboardMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // ===== DOM =====
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const tbody = $('#customer-tbody');
  const searchInput = $('#search-input');
  const filterPayment = $('#filter-payment');
  const filterMonth = $('#filter-month');
  const dashboardMonthPicker = $('#dashboard-month-picker');
  const dashboardPrevMonth = $('#dashboard-prev-month');
  const dashboardNextMonth = $('#dashboard-next-month');
  const modalOverlay = $('#modal-overlay');
  const detailOverlay = $('#detail-overlay');
  const confirmOverlay = $('#confirm-overlay');
  const settingsOverlay = $('#settings-overlay');
  const emptyState = $('#empty-state');
  const tableWrapper = $('#table-wrapper');
  const listView = $('#list-view');
  const calendarView = $('#calendar-view');
  const calendarFilterInputs = $$('.calendar-filter-input');
  const eventBindingRegistry = new WeakMap();

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

  // ===== Field Config =====
  const fields = [
    { key: 'inquiryDate', label: '問い合わせ日', type: 'date' },
    { key: 'contractDate', label: '成約日', type: 'date' },
    { key: 'shootingDate', label: '撮影日', type: 'date' },
    { key: 'customerName', label: 'お客様名', type: 'text' },
    { key: 'contact', label: '連絡先', type: 'text' },
    { key: 'meetingDate', label: '打ち合わせ日', type: 'date' },
    { key: 'plan', label: 'プラン', type: 'select' },
    { key: 'costume', label: '衣装', type: 'select' },
    { key: 'hairMakeup', label: 'ヘアメイク', type: 'select' },
    { key: 'billingDate', label: '請求日', type: 'date' },
    { key: 'paymentChecked', label: '入金チェック', type: 'checkbox' },
    { key: 'details', label: '詳細', type: 'textarea' },
    { key: 'notes', label: '備考', type: 'textarea' },
    { key: 'revenue', label: '売上', type: 'number' },
    { key: 'assignedTo', label: '担当者', type: 'select' },
    { key: 'location', label: '場所', type: 'text' },
  ];

  // ===== Formatting =====
  function formatDate(val) {
    if (!val) return '—';
    const d = new Date(val);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }
  const CURRENCY_CONFIG = {
    USD: { symbol: '$', locale: 'en-US' },
    JPY: { symbol: '¥', locale: 'ja-JP' },
    EUR: { symbol: '€', locale: 'de-DE' },
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

  function normalizePlanDetails(planDetails, fallbackRevenue = 0) {
    const safe = (planDetails && typeof planDetails === 'object') ? planDetails : {};
    const basePrice = toSafeNumber(safe.basePrice, 0);
    const fallbackTotal = toSafeNumber(fallbackRevenue, basePrice);
    const totalPrice = toSafeNumber(safe.totalPrice, fallbackTotal);

    return {
      planName: typeof safe.planName === 'string' ? safe.planName : '',
      basePrice,
      options: typeof safe.options === 'string' ? safe.options : '',
      totalPrice,
    };
  }

  function updateCurrency(currency) {
    if (!CURRENCY_CONFIG[currency]) return;
    currentCurrency = currency;
    saveLocalValue(CURRENCY_KEY, currency);
    saveCloudValue(CURRENCY_KEY, currency);
    const sel = document.getElementById('currency-select');
    if (sel) sel.value = currency;

    renderTable();
    updateDashboard();
    renderExpenses();
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
      enabled: false,
      rate: 10,
      label: 'Tax',
      included: false,
      companyName: '',
      address: '',
      email: '',
      phone: '',
      bank: '',
      invoiceTemplate: 'modern',
      invoiceFooterMessage: DEFAULT_INVOICE_MESSAGE,
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

  // ===== Theme Management =====
  let currentTheme = getCloudValue(THEME_KEY, getLocalValue(THEME_KEY, 'dark'));

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    saveLocalValue(THEME_KEY, theme);
    saveCloudValue(THEME_KEY, theme);

    // Update theme button icon
    const themeBtn = document.getElementById('btn-theme');
    if (themeBtn) {
      themeBtn.textContent = theme === 'dark' ? '🌙' : '☀️';
      themeBtn.title = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
  }
  window.applyTheme = applyTheme;

  function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  }
  window.toggleTheme = toggleTheme;

  function getExpenses() {
    return getCloudValue(EXPENSES_KEY, []);
  }
  function saveExpenses(expenses) { saveCloudValue(EXPENSES_KEY, expenses); }

  // ===== Populate Select Options =====
  function populateSelects() {
    const keys = ['plan', 'costume', 'hairMakeup'];
    keys.forEach(key => {
      const sel = $(`#form-${key}`);
      if (!sel) return;
      const curVal = sel.value;
      sel.innerHTML = `<option value="">${t('selectDefault')}</option>`;
      const opts = options[key] || [];
      opts.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o;
        opt.textContent = o;
        sel.appendChild(opt);
      });
      // Add "Other" option
      const otherOpt = document.createElement('option');
      otherOpt.value = '__other__';
      otherOpt.textContent = t('selectOther');
      sel.appendChild(otherOpt);

      if (curVal) sel.value = curVal;
    });

    // Populate Photographers
    const pSel = $('#form-assignedTo');
    const fSel = $('#filter-photographer');
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
        input.placeholder = `カメラマン名を入力...`;
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

  function hookSelectOther(key) {
    const sel = $(`#form-${key}`);
    if (!sel || sel.tagName !== 'SELECT') return;
    sel.addEventListener('change', () => {
      if (sel.value === '__other__') {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `form-${key}`;
        input.placeholder = `${OPTION_LABELS[key]}を入力...`;
        sel.replaceWith(input);
        input.focus();
        input.addEventListener('blur', () => {
          if (!input.value.trim()) {
            const newSel = document.createElement('select');
            newSel.id = `form-${key}`;
            input.replaceWith(newSel);
            populateSelects();
            hookSelectOther(key);
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

    const expenses = getExpenses();
    const monthlyExpenses = expenses
      .filter(e => isInYearMonth(e.date, year, month))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const monthlyProfit = monthlyRevenue - monthlyExpenses;

    const yearlyRevenue = customers
      .filter(c => isInYear(c.shootingDate, year))
      .reduce((sum, c) => sum + (Number(c.revenue) || 0), 0);

    const yearlyExpenses = expenses
      .filter(e => isInYear(e.date, year))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const yearlyProfit = yearlyRevenue - yearlyExpenses;

    $('#stat-total').textContent = total;
    $('#stat-monthly').textContent = monthlyShoots.length;
    $('#stat-revenue').textContent = formatCurrency(monthlyRevenue);
    $('#profit-month').textContent = formatCurrency(monthlyProfit);

    if ($('#expense-month')) $('#expense-month').textContent = formatCurrency(monthlyExpenses);
    if ($('#revenue-month')) $('#revenue-month').textContent = formatCurrency(monthlyRevenue);
    if ($('#profit-month-alt')) $('#profit-month-alt').textContent = formatCurrency(monthlyProfit);

    if ($('#stat-yearly-revenue')) $('#stat-yearly-revenue').textContent = formatCurrency(yearlyRevenue);
    if ($('#stat-yearly-profit')) $('#stat-yearly-profit').textContent = formatCurrency(yearlyProfit);
    if ($('#stat-yearly-expense')) $('#stat-yearly-expense').textContent = formatCurrency(yearlyExpenses);
    if ($('#yearly-revenue-label')) $('#yearly-revenue-label').textContent = t('yearlyRevenueTotal');
    if ($('#yearly-profit-label')) $('#yearly-profit-label').textContent = t('yearlyProfitTotal');
    if ($('#yearly-expense-label')) $('#yearly-expense-label').textContent = t('yearlyExpenseTotal');
  }

  // ===== Month Filter =====
  function updateMonthFilter() {
    const months = new Set();
    customers.forEach(c => { if (c.shootingDate) months.add(c.shootingDate.slice(0, 7)); });
    const sorted = [...months].sort().reverse();
    const current = filterMonth.value;
    filterMonth.innerHTML = `<option value="all">${t('filterPeriodAll')}</option>`;
    sorted.forEach(m => {
      const [y, mo] = m.split('-');
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = `${y}/${Number(mo)}`;
      filterMonth.appendChild(opt);
    });
    if (sorted.includes(current)) filterMonth.value = current;
  }

  // ===== Filter & Sort =====
  function getFilteredCustomers() {
    let list = [...customers];
    const query = searchInput.value.trim().toLowerCase();
    if (query) {
      list = list.filter(c =>
        (c.customerName || '').toLowerCase().includes(query) ||
        (c.contact || '').toLowerCase().includes(query)
      );
    }
    const pf = filterPayment.value;
    if (pf === 'paid') list = list.filter(c => c.paymentChecked);
    if (pf === 'unpaid') list = list.filter(c => !c.paymentChecked);
    const mf = filterMonth.value;
    if (mf !== 'all') list = list.filter(c => c.shootingDate && c.shootingDate.startsWith(mf));

    const pf_staff = $('#filter-photographer').value;
    if (pf_staff !== 'all') list = list.filter(c => c.assignedTo === pf_staff);

    const { key, dir } = currentSort;
    list.sort((a, b) => {
      let va = a[key] ?? '', vb = b[key] ?? '';
      if (key === 'revenue') { va = Number(va) || 0; vb = Number(vb) || 0; }
      else if (key === 'paymentChecked') { va = va ? 1 : 0; vb = vb ? 1 : 0; }
      else { va = String(va).toLowerCase(); vb = String(vb).toLowerCase(); }
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }

  // ===== Render Table =====
  function renderTable() {
    const list = getFilteredCustomers();
    if (customers.length === 0) {
      tableWrapper.style.display = 'none';
      emptyState.style.display = 'block';
      $('.toolbar').style.display = 'none';
    } else {
      tableWrapper.style.display = '';
      emptyState.style.display = 'none';
      $('.toolbar').style.display = '';
    }

    tbody.innerHTML = '';
    list.forEach(c => {
      const tr = document.createElement('tr');
      tr.dataset.id = c.id;
      tr.style.cursor = 'pointer';
      tr.innerHTML = `
        <td>${formatDate(c.inquiryDate)}</td>
        <td>${formatDate(c.contractDate)}</td>
        <td>${formatDate(c.shootingDate)}</td>
        <td class="customer-name">${escapeHtml(c.customerName || '')}</td>
        <td>${escapeHtml(c.contact || '')}</td>
        <td>${formatDate(c.meetingDate)}</td>
        <td><span class="badge badge-purple">${escapeHtml(c.plan || '—')}</span></td>
        <td style="font-weight:600;color:var(--text-primary);">${formatCurrency(c.revenue)}</td>
        <td>${c.paymentChecked ? `<span class="badge badge-success">${t('paid')}</span>` : `<span class="badge badge-warning">${t('unpaid')}</span>`}</td>
        <td><span class="badge badge-cyan">${escapeHtml(getPhotographerName(c.assignedTo))}</span></td>
        <td>
          <div style="display: flex; gap: 4px;">
            <button class="btn-icon btn-edit" title="${t('btnEdit')}" data-id="${c.id}">✏️</button>
            <button class="btn-icon" title="${t('generateInvoice')}" onclick="generateInvoiceByID('${c.id}')">📄</button>
            <button class="btn-icon" title="${t('generateQuote')}" onclick="generateQuoteByID('${c.id}')">📋</button>
            <button class="btn-icon" title="${t('generateContract')}" onclick="openContractModalByID('${c.id}')">📜</button>
            <button class="btn-icon btn-del" title="${t('btnDelete')}" data-id="${c.id}">🗑</button>
          </div>
        </td>
      `;
      tr.addEventListener('click', e => {
        if (e.target.closest('.btn-icon')) return;
        openDetail(c.id);
      });
      tbody.appendChild(tr);
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
    updateMonthFilter();
  }

  function bindSortEventListeners() {
    $$('thead th[data-sort]').forEach((th) => {
      const key = th.dataset.sort || 'unknown';
      bindEventOnce(th, 'click', () => {
        const sortKey = th.dataset.sort;
        if (!sortKey) return;
        if (currentSort.key === sortKey) currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
        else currentSort = { key: sortKey, dir: 'asc' };
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
    $('#cal-title').textContent = `${calYear}/${calMonth + 1}`;

    const days = currentLang === 'ja' ? ['日', '月', '火', '水', '木', '金', '土'] :
      currentLang === 'fr' ? ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] :
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
    bindEventOnce($('#filter-photographer'), 'change', renderTable, 'toolbar-filter-photographer');
  }

  // ===== Add / Edit Modal =====
  window.openModal = function (id) {
    if (!id && !checkCustomerLimit()) return;
    editingId = id || null;
    const form = $('#customer-form');
    form.reset();
    $('#form-id').value = '';

    Object.keys(OPTION_LABELS).forEach(key => {
      const el = $(`#form-${key}`);
      if (el && el.tagName === 'INPUT' && el.dataset.wasSelect) {
        const newSel = document.createElement('select');
        newSel.id = `form-${key}`;
        el.replaceWith(newSel);
        hookSelectOther(key);
      }
    });

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
          const val = c[f.key] || '';
          if (val && el.tagName === 'SELECT') {
            let found = false;
            for (const opt of el.options) { if (opt.value === val) { found = true; break; } }
            if (!found) {
              const opt = document.createElement('option');
              opt.value = val; opt.textContent = val;
              el.insertBefore(opt, el.lastElementChild);
            }
            el.value = val;
          }
        } else {
          el.value = c[f.key] || '';
        }
      });

      const planDetails = normalizePlanDetails(c.planDetails, c.revenue);
      const planNameInput = $('#form-plan-name');
      const basePriceInput = $('#form-base-price');
      const optionsInput = $('#form-plan-options');
      const totalPriceInput = $('#form-total-price');
      if (planNameInput) planNameInput.value = planDetails.planName;
      if (basePriceInput) basePriceInput.value = String(planDetails.basePrice);
      if (optionsInput) optionsInput.value = planDetails.options;
      if (totalPriceInput) totalPriceInput.value = String(planDetails.totalPrice);

      renderCustomFields(c);
    } else {
      $('#modal-title').textContent = t('modalAddTitle');
      const planNameInput = $('#form-plan-name');
      const basePriceInput = $('#form-base-price');
      const optionsInput = $('#form-plan-options');
      const totalPriceInput = $('#form-total-price');
      if (planNameInput) planNameInput.value = '';
      if (basePriceInput) basePriceInput.value = '';
      if (optionsInput) optionsInput.value = '';
      if (totalPriceInput) totalPriceInput.value = '';
      renderCustomFields();
    }
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

  window.saveCustomer = function () {
    const name = $('#form-customerName').value.trim();
    if (!name) { showToast(t('msgEnterName'), 'error'); return; }

    const data = {};
    fields.forEach(f => {
      const el = $(`#form-${f.key}`);
      if (!el) return;
      if (f.type === 'checkbox') data[f.key] = el.checked;
      else if (f.type === 'number') data[f.key] = el.value ? Number(el.value) : null;
      else data[f.key] = el.value || '';
    });

    const customFields = {};
    loadCustomFieldDefinitions().forEach(field => {
      const el = $(`#custom-field-${field.id}`);
      if (el && el.value.trim()) customFields[field.id] = el.value.trim();
    });
    data.customFields = customFields;

    const planNameInput = $('#form-plan-name');
    const basePriceInput = $('#form-base-price');
    const optionsInput = $('#form-plan-options');
    const totalPriceInput = $('#form-total-price');
    const rawPlanDetails = {
      planName: planNameInput?.value?.trim() || '',
      basePrice: toSafeNumber(basePriceInput?.value, 0),
      options: optionsInput?.value || '',
      totalPrice: totalPriceInput?.value,
    };
    data.planDetails = normalizePlanDetails(rawPlanDetails, data.revenue);

    if (editingId) {
      const idx = customers.findIndex(c => c.id === editingId);
      if (idx !== -1) customers[idx] = { ...customers[idx], ...data, updatedAt: new Date().toISOString() };
      showToast(t('msgUpdated'));
    } else {
      data.id = generateId();
      data.createdAt = new Date().toISOString();
      data.updatedAt = data.createdAt;
      customers.push(data);
      showToast(t('msgCreated'));
    }

    saveCustomers(customers);
    closeModal();
    renderTable();
    if (calendarView.classList.contains('active')) renderCalendar();
  };

  // ===== Detail Panel =====
  function openDetail(id) {
    const c = customers.find(x => x.id === id);
    if (!c) return;
    editingId = id; // Set editingId for task management

    // Basic fields
    $('#detail-name').textContent = c.customerName || '—';
    $('#detail-contact').textContent = c.contact || '—';
    $('#detail-shooting-date').textContent = formatDate(c.shootingDate);
    $('#detail-location').textContent = c.location || '—';
    $('#detail-plan').textContent = c.plan || '—';
    $('#detail-revenue').textContent = formatCurrency(c.revenue);
    $('#detail-payment').innerHTML = c.paymentChecked ? `<span class="badge badge-success">${t('paid')}</span>` : `<span class="badge badge-warning">${t('unpaid')}</span>`;
    $('#detail-notes').textContent = c.notes || '—';
    const planDetails = normalizePlanDetails(c.planDetails, c.revenue);
    const detailPlanName = $('#detail-plan-name');
    const detailBasePrice = $('#detail-base-price');
    const detailPlanOptions = $('#detail-plan-options');
    const detailTotalPrice = $('#detail-total-price');
    if (detailPlanName) detailPlanName.textContent = planDetails.planName || '—';
    if (detailBasePrice) detailBasePrice.textContent = formatCurrency(planDetails.basePrice);
    if (detailPlanOptions) detailPlanOptions.textContent = planDetails.options || '—';
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

  function handleConfirmDeleteClick() {
    if (deletingId) {
      customers = customers.filter(c => c.id !== deletingId);
      saveCustomers(customers);
      showToast(t('msgDeleted'));
      closeConfirmModal();
      renderTable();
      if (calendarView.classList.contains('active')) renderCalendar();
    }
  }

  // ===== Settings =====
  window.closeSettings = function () { settingsOverlay.classList.remove('active'); };
  function renderSettings() {
    const container = $('#settings-list');
    container.innerHTML = '';
    const currencySelect = $('#currency-select');
    if (currencySelect) currencySelect.value = currentCurrency;
    const keys = ['plan', 'costume', 'hairMakeup'];
    keys.forEach(key => {
      const section = document.createElement('div');
      section.className = 'settings-section';
      const label = t('label' + key.charAt(0).toUpperCase() + key.slice(1));
      section.innerHTML = `<h3>${label}</h3>`;
      const opts = options[key] || [];
      const list = document.createElement('div');
      list.className = 'settings-item-list';
      opts.forEach((o, i) => {
        const item = document.createElement('div');
        item.className = 'settings-item';
        item.innerHTML = `
          <span>${escapeHtml(o)}</span>
          <button class="btn-icon-sm" onclick="removeOption('${key}', ${i})">✕</button>
        `;
        list.appendChild(item);
      });
      section.appendChild(list);

      const addBox = document.createElement('div');
      addBox.className = 'settings-add-box';
      addBox.innerHTML = `
        <input type="text" id="add-${key}" placeholder="${t('settingsAddPlaceholder', { label })}" />
        <button class="btn btn-primary btn-sm" onclick="addOption('${key}')">${t('settingsAddBtn')}</button>
      `;
      section.appendChild(addBox);
      container.appendChild(section);
    });
  }

  window.addOption = function (key) {
    const input = $(`#add-${key}`);
    const val = input.value.trim();
    if (!val) return;
    if (!options[key]) options[key] = [];
    options[key].push(val);
    saveOptions(options);
    input.value = '';
    renderSettings();
    populateSelects();
  };

  window.removeOption = function (key, idx) {
    options[key].splice(idx, 1);
    saveOptions(options);
    renderSettings();
    populateSelects();
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
    const data = { customers, options, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `photocrm_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
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
        customers = loadCustomers();
        options = loadOptions();
        updateLanguage(currentLang);
        showToast(`Imported: ${stats.customers} new, ${stats.updated} updated, ${stats.team} members.`);
      } catch (err) {
        console.error(err);
        showToast('Invalid JSON', 'error');
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
      { key: 'shootingDate', icon: '📷', label: '撮影' },
      { key: 'meetingDate', icon: '🤝', label: '打ち合わせ' },
      { key: 'inquiryDate', icon: '💌', label: '問い合わせ' },
      { key: 'billingDate', icon: '💳', label: '請求' },
    ].filter(df => calendarFilters[df.key]);

    const nowStamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const events = [];

    customers.forEach(c => {
      dateFields.forEach(df => {
        const eventDate = c[df.key];
        if (!eventDate || !eventDate.startsWith(monthStr)) return;

        const customerName = c.customerName || '未設定';
        const plan = c.plan || '未設定';
        const contact = c.contact || '未設定';
        const notes = c.notes || 'なし';
        const summary = `${df.icon} ${df.label} - ${customerName}`;
        const description = [
          `予定種別: ${df.label}`,
          `顧客名: ${customerName}`,
          `プラン内容: ${plan}`,
          `連絡先: ${contact}`,
          `備考: ${notes}`,
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
      showToast('書き出し対象の予定がありません');
      return;
    }

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PhotoCRM//Calendar Export//JA',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:PhotoCRM Calendar',
      'X-WR-TIMEZONE:Asia/Tokyo',
      ...events,
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `photocrm-calendar-${calYear}${String(calMonth + 1).padStart(2, '0')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // CSV Export
  function handleCsvExportClick() {
    const headers = fields.map(f => f.label).join(',');
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
            ${task.dueDate ? formatDate(task.dueDate) : 'No date'}
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
      showToast(t.done ? 'Task completed!' : 'Task reopened');
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
    showToast('Task added');
  };


  // ===== Invoice Builder =====
  let invoiceBuilderCustomerId = null;

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
    const amounts = calculateTax(subtotal);
    const settings = getTaxSettings();

    const summary = document.getElementById('invoice-builder-summary');
    if (!summary) return;

    summary.innerHTML = `
      <div class="invoice-summary-row"><span>Subtotal</span><strong>${formatCurrency(amounts.subtotal)}</strong></div>
      <div class="invoice-summary-row"><span>${settings.label || 'Tax'}</span><strong>${formatCurrency(amounts.tax)}</strong></div>
      <div class="invoice-summary-row invoice-summary-total"><span>Total</span><strong>${formatCurrency(amounts.total)}</strong></div>
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
        <input class="invoice-item-desc" type="text" value="${escapeHtml(item.description || '')}" placeholder="Item description">
        <input class="invoice-item-qty" type="number" min="0" step="1" value="${Number(item.quantity) || 1}">
        <input class="invoice-item-unit" type="number" min="0" step="0.01" value="${Number(item.unitPrice) || 0}">
        <div class="invoice-item-amount">${formatCurrency(amount)}</div>
        <button type="button" class="btn-remove-line" title="Remove">✕</button>
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
      meta.innerHTML = `<strong>${escapeHtml(customer.customerName || '—')}</strong> · ${escapeHtml(customer.contact || 'No contact')} · ${formatDate(customer.shootingDate)}`;
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
    if (messageInput) messageInput.value = customer.invoiceMessage || settings.invoiceFooterMessage || DEFAULT_INVOICE_MESSAGE;

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
    const customer = customers.find(c => c.id === invoiceBuilderCustomerId);
    if (!customer || !window.generateInvoicePDF) return;

    const rows = Array.from(document.querySelectorAll('.invoice-item-row'));
    const items = normalizeInvoiceItems(rows.map(row => ({
      description: row.querySelector('.invoice-item-desc').value,
      quantity: row.querySelector('.invoice-item-qty').value,
      unitPrice: row.querySelector('.invoice-item-unit').value,
    })));

    if (!items.length) {
      showToast('Please add at least one line item', 'error');
      return;
    }

    customer.invoiceItems = items;
    customer.invoiceIssueDate = document.getElementById('invoice-issue-date')?.value || '';
    customer.invoiceDueDate = document.getElementById('invoice-due-date')?.value || '';
    customer.invoiceSenderName = document.getElementById('invoice-sender-name')?.value?.trim() || '';
    customer.invoiceRecipientName = document.getElementById('invoice-recipient-name')?.value?.trim() || '';
    customer.invoiceSenderContact = document.getElementById('invoice-sender-contact')?.value?.trim() || '';
    customer.invoiceRecipientContact = document.getElementById('invoice-recipient-contact')?.value?.trim() || '';
    customer.invoiceMessage = document.getElementById('invoice-message')?.value?.trim() || DEFAULT_INVOICE_MESSAGE;
    const settings = getTaxSettings();
    saveTaxSettings({
      ...settings,
      invoiceFooterMessage: customer.invoiceMessage,
    });
    saveInvoiceSenderProfile({
      name: customer.invoiceSenderName,
      contact: customer.invoiceSenderContact,
    });
    customer.updatedAt = new Date().toISOString();
    saveCustomers(customers);

    window.generateInvoicePDF(customer, 'invoice', {
      items,
      issueDate: customer.invoiceIssueDate,
      dueDate: customer.invoiceDueDate,
      senderName: customer.invoiceSenderName,
      recipientName: customer.invoiceRecipientName,
      senderContact: customer.invoiceSenderContact,
      recipientContact: customer.invoiceRecipientContact,
      message: customer.invoiceMessage,
    });
    closeInvoiceBuilderModal();
  }

  // ===== Expense Management Logic =====
  function renderExpenses() {
    const container = $('#expense-list');
    container.innerHTML = '';
    const expenses = getExpenses().sort((a, b) => new Date(b.date) - new Date(a.date));

    if (expenses.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">No expenses yet.</p>`;
      return;
    }

    const table = document.createElement('table');
    table.className = 'expense-table';
    table.style = "width: 100%; border-collapse: collapse; font-size: 0.9rem;";
    table.innerHTML = `
      <thead>
        <tr style="border-bottom: 2px solid var(--border); text-align: left;">
          <th style="padding: 10px;">Date</th>
          <th style="padding: 10px;">Item</th>
          <th style="padding: 10px;">Category</th>
          <th style="padding: 10px; text-align: right;">Amount</th>
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
    showToast('Expense added');
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
        closeContractModal();
      }, `contract-template-${template}`);
    });
  }

  // ===== Free Tier Limit Logic =====
  function checkCustomerLimit() {
    if (customers.length >= FREE_PLAN_LIMIT) {
      showUpgradeModal();
      return false;
    }
    return true;
  }

  function showUpgradeModal() {
    // Show a simple upgrade message or rediected to landing pricing
    const confirmed = confirm(t('msgLimitReached') || "Free plan limit reached (30 customers). Upgrade to continue adding more customers.");
    if (confirmed) {
      window.open('landing.html#pricing', '_blank');
    }
  }

  function loadInvoiceSettings() {
    const settings = getTaxSettings();
    $('#tax-rate').value = settings.rate;
    $('#tax-label').value = settings.label === 'Tax' || settings.label === 'VAT' || settings.label === 'GST' || settings.label === 'Sales Tax' || settings.label === '消費税' ? settings.label : 'Custom';

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
  }

  function handleTaxEnabledChange(e) {
    $('#tax-options').style.display = e.target.checked ? 'block' : 'none';
  }

  function handleTaxLabelChange(e) {
    $('#tax-label-custom').style.display = e.target.value === 'Custom' ? 'block' : 'none';
  }

  function handleSaveInvoiceSettings() {
    const label = $('#tax-label').value === 'Custom' ? $('#tax-label-custom').value : $('#tax-label').value;
    const currentSettings = getTaxSettings();
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
      invoiceFooterMessage: currentSettings.invoiceFooterMessage || DEFAULT_INVOICE_MESSAGE,
    };
    saveTaxSettings(settings);
    showToast(t('msgSettingsSaved'));
  }

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

  window.openContractModalByID = function(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer && window.openContractModal) {
      window.openContractModal(customer);
    }
  };

  function handleLanguageSelectChange(event) {
    const selected = event?.target?.value;
    if (!selected) return;
    updateLanguage(selected);
  }

  function handleCurrencySelectChange(event) {
    const selected = event?.target?.value;
    if (!selected) return;
    updateCurrency(selected);
  }

  function handleOpenSettingsClick() {
    renderSettings();
    settingsOverlay?.classList.add('active');
  }

  function handleAddCustomerClick() {
    openModal();
  }

  function handleTeamAddClick() {
    const name = $('#team-new-name')?.value.trim();
    const role = $('#team-new-role')?.value;
    if (!name) return;
    window.TeamManager.addPhotographer({ name, role });
    $('#team-new-name').value = '';
    renderTeamList();
    populateSelects();
    showToast(t('msgMemberAdded'));
  }

  function bindSettingsTabListeners() {
    settingsOverlay?.querySelectorAll('.settings-tab-btn').forEach((btn) => {
      const tabName = btn.dataset.tab || 'default';
      bindEventOnce(btn, 'click', () => {
        settingsOverlay.querySelectorAll('.settings-tab-btn').forEach((b) => b.classList.remove('active'));
        settingsOverlay.querySelectorAll('.settings-tab-content').forEach((c) => c.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        $(`#settings-content-${tab}`)?.classList.add('active');
        if (tab === 'invoice') loadInvoiceSettings();
        if (tab === 'team') renderTeamList();
      }, `settings-tab-${tabName}`);
    });
  }

  function handleGoogleLoginClick() {
    if (!window.FirebaseService) {
      showToast('Firebase設定の読み込みに失敗しました。');
      return;
    }
    if (typeof window.FirebaseService.signInWithPopup !== 'function') {
      showToast('Googleログイン設定に問題があります。');
      return;
    }
    window.FirebaseService.signInWithPopup().catch((err) => {
      console.error('Firebase Auth Error:', err.code, err.message);
      console.error(err);
      showToast('Googleログインに失敗しました。');
    });
  }

  function handleGoogleLogoutClick() {
    authWatcherDisabled = true;
    if (typeof authUnsubscribe === 'function') {
      authUnsubscribe();
      authUnsubscribe = null;
    }
    isLoggedIn = false;
    if (authNullTimer) {
      clearTimeout(authNullTimer);
      authNullTimer = null;
    }
    window.FirebaseService?.signOut?.().catch((err) => {
      console.error('Google logout failed', err);
    });
    try { window.localStorage.clear(); } catch {}
    try { window.sessionStorage.clear(); } catch {}
    window.location.href = window.location.origin + window.location.pathname;
  }

  function bindCoreUIEventListeners() {
    bindEventOnce(document.getElementById('lang-select'), 'change', handleLanguageSelectChange, 'lang-select-change');
    bindEventOnce(document.getElementById('currency-select'), 'change', handleCurrencySelectChange, 'currency-select-change');
    bindEventOnce(document.getElementById('btn-theme'), 'click', toggleTheme, 'theme-toggle-click');
    bindEventOnce(document.getElementById('btn-add'), 'click', handleAddCustomerClick, 'add-customer-click');
    bindEventOnce(document.getElementById('btn-settings'), 'click', handleOpenSettingsClick, 'open-settings-click');
    bindEventOnce(document.getElementById('btn-sync-export'), 'click', handleSyncExportClick, 'sync-export-click');
    bindEventOnce(document.getElementById('btn-sync-import'), 'click', handleSyncImportClick, 'sync-import-click');
    bindEventOnce(document.getElementById('import-file'), 'change', handleImportFileChange, 'import-file-change');
    bindEventOnce(document.getElementById('btn-export'), 'click', handleCsvExportClick, 'csv-export-click');
    bindEventOnce(document.getElementById('btn-ics-export'), 'click', handleIcsExportClick, 'ics-export-click');
    bindEventOnce(document.getElementById('btn-team-add'), 'click', handleTeamAddClick, 'team-add-click');
    bindEventOnce(document.getElementById('btn-add-custom-field'), 'click', handleAddCustomFieldClick, 'add-custom-field-click');
    bindEventOnce(document.getElementById('btn-google-login'), 'click', handleGoogleLoginClick, 'google-login-banner');
    bindEventOnce(document.getElementById('btn-google-login-screen'), 'click', handleGoogleLoginClick, 'google-login-screen');
    bindEventOnce(document.getElementById('btn-logout'), 'click', handleGoogleLogoutClick, 'google-logout');
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
    bindEventOnce(document.getElementById('btn-generate-custom-invoice'), 'click', handleGenerateCustomInvoiceClick, 'invoice-generate-custom');
    bindEventOnce($('#tax-enabled'), 'change', handleTaxEnabledChange, 'tax-enabled-change');
    bindEventOnce($('#tax-label'), 'change', handleTaxLabelChange, 'tax-label-change');
    bindEventOnce($('#btn-save-invoice-settings'), 'click', handleSaveInvoiceSettings, 'tax-settings-save');
    initCalendarFilters();
    bindExpenseModalEvents();
  }

  // ===== Initialization =====
  function init() {
    if (appInitialized) return;

    // 1. Apply theme first (prevents flash)
    applyTheme(currentTheme);

    // 2. Set defaults
    updateLanguage(currentLang || 'en');
    updateCurrency(currentCurrency);

    // 3. Attach event listeners
    bindCoreUIEventListeners();
    bindFeatureEventListeners();

    // Hook dynamic "Other" behavior after elements are present.
    const keys_to_hook = ['plan', 'costume', 'hairMakeup'];
    keys_to_hook.forEach(k => hookSelectOther(k));
    hookPhotographerOther();

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
    bindExpenseModalEvents();

    // Check if expense view should be visible
    if ($('#expense-container')) {
      $('#expense-container').style.display = 'block';
    }

    // Load saved view preference
    const savedView = getCloudValue('preferred_view', 'list');
    const activeTab = $(`.view-tab[data-view="${savedView}"]`);
    if (activeTab) activeTab.click();
    appInitialized = true;
  }

  function hydrateStateFromCloud() {
    currentLang = getCloudValue(LANG_KEY, getLocalValue(LANG_KEY, 'en'));
    if (!window.LOCALE || !window.LOCALE[currentLang]) currentLang = 'en';
    currentTheme = getCloudValue(THEME_KEY, getLocalValue(THEME_KEY, 'dark'));
    currentCurrency = getCloudValue(CURRENCY_KEY, getLocalValue(CURRENCY_KEY, 'USD'));
    if (!CURRENCY_CONFIG[currentCurrency]) currentCurrency = 'USD';
    customers = loadCustomers();
    options = loadOptions();
    calendarFilters = loadCalendarFilters();
  }

  let appInitialized = false;
  let authStateRequestId = 0;
  let isLoggedIn = false;
  let authNullTimer = null;
  let authWatcherDisabled = false;
  let authUnsubscribe = null;

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
    const logoutBtn = document.getElementById('btn-logout');

    if (state === 'checking') {
      if (authStatus) authStatus.textContent = '🔄 ログイン状態を確認中...';
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (authScreen) authScreen.style.display = 'none';
      if (loginScreen) loginScreen.style.display = 'none';
      if (authBanner) authBanner.style.display = 'flex';
      if (appContainer) appContainer.style.display = 'none';
      return;
    }

    if (state === 'loggedOut') {
      isLoggedIn = false;
      if (authNullTimer) {
        clearTimeout(authNullTimer);
        authNullTimer = null;
      }
      if (authStatus) authStatus.textContent = '🔐 Googleでログインしてクラウド同期を開始';
      if (loginBtn) loginBtn.style.display = '';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (authScreenRoot) authScreenRoot.style.display = 'block';
      if (authScreen) authScreen.style.display = 'block';
      if (loginScreen) loginScreen.style.display = 'flex';
      if (authBanner) authBanner.style.display = 'none';
      if (appContainer) appContainer.style.display = 'none';
      return;
    }

    if (state === 'loggedIn') {
      if (authStatus) authStatus.textContent = `✅ ${user?.displayName || user?.email || 'ログイン中'} でログイン中`;
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = '';
      if (authScreen) authScreen.style.display = 'none';
      if (loginScreen) loginScreen.style.display = 'none';
      if (authBanner) authBanner.style.display = 'flex';
      if (appContainer) appContainer.style.display = 'block';
    }
  }

  function debugHideLoginScreen() {
    const appContainer = getAppContainerElement();
    const loginScreen = document.getElementById('login-screen');
    const authBanner = document.getElementById('auth-banner');
    const authStatus = document.getElementById('auth-status');

    if (loginScreen) loginScreen.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';
    if (authBanner) authBanner.style.display = 'flex';
    if (authStatus) authStatus.textContent = '🛠 Debug: login screen was manually hidden';

    console.warn('[DEBUG] debugHideLoginScreen() applied');
  }

  window.debugHideLoginScreen = debugHideLoginScreen;

  function forceShowLoggedInUi() {
    const authScreen = document.getElementById('auth-screen');
    const appContainer = document.getElementById('app-container');
    if (authScreen) authScreen.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';
  }

  async function handleAuthStateSafely(user) {
    try {
      await handleAuthState(user);
    } catch (err) {
      console.error('Auth update error:', err);
      showToast('クラウドデータの読み込みに失敗しました。再度お試しください。');
    } finally {
      forceShowLoggedInUi();
    }
  }

  async function handleAuthState(user) {
    // UI control is handled by onAuthChanged. This function handles data loading only.
    const resolvedUser = user || window.FirebaseService?.getCurrentUser?.() || null;
    if (!resolvedUser) return;

    try {
      await window.FirebaseService.loadForUser(resolvedUser);
      hydrateStateFromCloud();
      applyTheme(currentTheme);
      updateLanguage(currentLang || 'en');
      updateCurrency(currentCurrency);
      renderTable();
      renderExpenses();
      updateDashboard();
      populateSelects();
      syncCalendarFilterControls();
      if (calendarView.classList.contains('active')) renderCalendar();
    } catch (err) {
      console.error('Cloud data load failed', err);
      showToast('クラウドデータの読み込みに失敗しました。再度お試しください。');
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

  // Ensure DOM is ready before initializing
  document.addEventListener('DOMContentLoaded', async () => {
    init();
    setAuthScreenState('checking');
    registerPwaServiceWorker();

    if (!window.FirebaseService) {
      console.error('FirebaseService is not available.');
      showToast('Firebase設定の読み込みに失敗しました。');
      setAuthScreenState('loggedOut');
      return;
    }

    try {
      await window.FirebaseService.whenReady();
    } catch (err) {
      console.error('Firebase initialization failed', err);
      showToast('Firebase初期化に失敗しました。');
      setAuthScreenState('loggedOut');
      return;
    }

    // onAuthChanged is registered only after Firebase initialization is complete.
    authWatcherDisabled = false;
    if (typeof authUnsubscribe === 'function') {
      authUnsubscribe();
      authUnsubscribe = null;
    }
    authUnsubscribe = await window.FirebaseService.onAuthChanged((user) => {
      if (authWatcherDisabled) return;
      console.log("🔔 Auth State Changed. User:", user ? user.email : "LoggedOut");

      if (user) {
        isLoggedIn = true;
        const appContainer = getAppContainerElement();
        const loginScreen = document.getElementById('login-screen');
        const isLoginScreenActive = !!loginScreen && loginScreen.style.display !== 'none';
        const isDashboardActive = !!appContainer && appContainer.style.display === 'block';
        if (isLoginScreenActive || !isDashboardActive) {
          setAuthScreenState('loggedIn', user);
          handleAuthStateSafely(user);
        }
        return;
      }

      if (!isLoggedIn) {
        setAuthScreenState('loggedOut');
        return;
      }

      isLoggedIn = false;
      setAuthScreenState('loggedOut');
    });
  });

})();
