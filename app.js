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
  const FREE_PLAN_LIMIT = 30;

  // ===== Language Management =====
  let currentLang = localStorage.getItem(LANG_KEY) || 'en';
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
    console.log('🌍 === updateLanguage START ===');
    console.log('🌍 Requested language:', lang);
    console.log('🌍 window.LOCALE exists:', !!window.LOCALE);
    if (window.LOCALE) {
      console.log('🌍 Available languages:', Object.keys(window.LOCALE));
      console.log('🌍 Has requested language:', !!window.LOCALE[lang]);
    }

    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;

    console.log('🌍 Saved language to localStorage:', localStorage.getItem(LANG_KEY));

    // Update all text content with data-i18n
    const elementsWithI18n = document.querySelectorAll('[data-i18n]');
    console.log(`🌍 Found ${elementsWithI18n.length} elements with [data-i18n]`);

    let successCount = 0;
    elementsWithI18n.forEach((el, index) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const translation = t(key);
        const oldText = el.textContent;
        el.textContent = translation;
        successCount++;

        // Log first 5 translations for debugging
        if (index < 5) {
          console.log(`🌍 [${index}] "${key}": "${oldText}" → "${translation}"`);
        }
      }
    });
    console.log(`🌍 Successfully translated ${successCount} elements`);

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

    console.log('🌍 === updateLanguage COMPLETE ===\n');
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
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function saveCustomers(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

  function loadOptions() {
    try {
      const d = JSON.parse(localStorage.getItem(OPTIONS_KEY));
      return d || { ...DEFAULT_OPTIONS };
    } catch { return { ...DEFAULT_OPTIONS }; }
  }
  function saveOptions(data) { localStorage.setItem(OPTIONS_KEY, JSON.stringify(data)); }

  function loadCustomFieldDefinitions() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_FIELDS_KEY)) || []; }
    catch { return []; }
  }

  function saveCustomFieldDefinitions(fields) {
    localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(fields));
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

  // Init calendar to current month
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();

  // ===== DOM =====
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const tbody = $('#customer-tbody');
  const searchInput = $('#search-input');
  const filterPayment = $('#filter-payment');
  const filterMonth = $('#filter-month');
  const modalOverlay = $('#modal-overlay');
  const detailOverlay = $('#detail-overlay');
  const confirmOverlay = $('#confirm-overlay');
  const settingsOverlay = $('#settings-overlay');
  const emptyState = $('#empty-state');
  const tableWrapper = $('#table-wrapper');
  const listView = $('#list-view');
  const calendarView = $('#calendar-view');

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

  let currentCurrency = localStorage.getItem(CURRENCY_KEY) || 'USD';
  if (!CURRENCY_CONFIG[currentCurrency]) currentCurrency = 'USD';

  function getCurrencySymbol() {
    return CURRENCY_CONFIG[currentCurrency].symbol;
  }

  function formatCurrency(val) {
    const cfg = CURRENCY_CONFIG[currentCurrency] || CURRENCY_CONFIG.USD;
    return cfg.symbol + (Number(val) || 0).toLocaleString(cfg.locale);
  }

  function updateCurrency(currency) {
    if (!CURRENCY_CONFIG[currency]) return;
    currentCurrency = currency;
    localStorage.setItem(CURRENCY_KEY, currency);
    const sel = document.getElementById('currency-select');
    if (sel) sel.value = currency;

    renderTable();
    updateDashboard();
    renderExpenses();
    if (editingId) openDetail(editingId);
  }

  window.getCurrencySymbol = getCurrencySymbol;
  window.formatCurrency = formatCurrency;
  window.updateCurrency = updateCurrency;
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
  // ===== Financial Helpers =====
  function getTaxSettings() {
    const saved = localStorage.getItem(TAX_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : {
      enabled: false,
      rate: 10,
      label: 'Tax',
      included: false,
      companyName: '',
      address: '',
      email: '',
      phone: '',
      bank: '',
    };
  }

  function saveTaxSettings(settings) {
    localStorage.setItem(TAX_SETTINGS_KEY, JSON.stringify(settings));
  }

  function getInvoiceSenderProfile() {
    try {
      return JSON.parse(localStorage.getItem(INVOICE_SENDER_PROFILE_KEY)) || { name: '', contact: '' };
    } catch {
      return { name: '', contact: '' };
    }
  }

  function saveInvoiceSenderProfile(profile) {
    localStorage.setItem(INVOICE_SENDER_PROFILE_KEY, JSON.stringify({
      name: (profile?.name || '').trim(),
      contact: (profile?.contact || '').trim(),
    }));
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
  let currentTheme = localStorage.getItem(THEME_KEY) || 'dark';

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

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
    try { return JSON.parse(localStorage.getItem(EXPENSES_KEY)) || []; }
    catch { return []; }
  }
  function saveExpenses(expenses) { localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses)); }

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
  function updateDashboard() {
    const total = customers.length;
    const now = new Date();
    const curMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyShoots = customers.filter(c => c.shootingDate && c.shootingDate.startsWith(curMonthStr));
    const monthlyRevenue = monthlyShoots.reduce((s, c) => s + (Number(c.revenue) || 0), 0);
    const unpaid = customers.filter(c => !c.paymentChecked).length;

    const expenses = getExpenses();
    const monthlyExpenses = expenses.filter(e => e.date && e.date.startsWith(curMonthStr))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const monthlyProfit = monthlyRevenue - monthlyExpenses;

    $('#stat-total').textContent = total;
    $('#stat-monthly').textContent = monthlyShoots.length; // Fixed ID to match HTML
    $('#stat-revenue').textContent = formatCurrency(monthlyRevenue);
    $('#profit-month').textContent = formatCurrency(monthlyProfit); // Fixed ID to match HTML

    // Also update expense section stats if visible
    if ($('#expense-month')) $('#expense-month').textContent = formatCurrency(monthlyExpenses);
    if ($('#revenue-month')) $('#revenue-month').textContent = formatCurrency(monthlyRevenue);
    if ($('#profit-month-alt')) $('#profit-month-alt').textContent = formatCurrency(monthlyProfit);
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

  // ===== Sort =====
  $$('thead th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (currentSort.key === key) currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
      else currentSort = { key, dir: 'asc' };
      renderTable();
    });
  });

  // ===== View Toggle =====
  $$('.view-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.view-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const view = tab.dataset.view;

      localStorage.setItem('preferred_view', view);

      if (view === 'calendar') {
        listView.classList.remove('active');
        calendarView.classList.add('active');
        renderCalendar();
      } else {
        calendarView.classList.remove('active');
        listView.classList.add('active');
      }
    });
  });

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

    customers.forEach(c => {
      const dateFields = [
        { key: 'shootingDate', cls: 'shooting', label: '📷' },
        { key: 'meetingDate', cls: 'meeting', label: '🤝' },
        { key: 'inquiryDate', cls: 'inquiry', label: '💌' },
        { key: 'billingDate', cls: 'billing', label: '💳' },
      ];
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

  $('#cal-prev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });
  $('#cal-next').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });
  $('#cal-today').addEventListener('click', () => {
    calYear = now.getFullYear();
    calMonth = now.getMonth();
    renderCalendar();
  });

  // ===== Modal (Add / Edit) =====
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
      renderCustomFields(c);
    } else {
      $('#modal-title').textContent = t('modalAddTitle');
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

  $('#btn-confirm-delete').addEventListener('click', () => {
    if (deletingId) {
      customers = customers.filter(c => c.id !== deletingId);
      saveCustomers(customers);
      showToast(t('msgDeleted'));
      closeConfirmModal();
      renderTable();
      if (calendarView.classList.contains('active')) renderCalendar();
    }
  });

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
  $('#btn-sync-export').addEventListener('click', () => {
    const data = { customers, options, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `photocrm_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast(t('msgExported') || 'Exported');
  });

  $('#btn-sync-import').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        const stats = window.SyncManager.mergeData(data);
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
  });

  $('#btn-add-custom-field')?.addEventListener('click', () => {
    const label = prompt(t('enterFieldName') || 'Enter custom field label');
    if (!label || !label.trim()) return;
    addCustomFieldDefinition(label.trim());
    renderCustomFields();
    showToast(t('customFieldAdded') || 'Custom field added');
  });

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
  $('#btn-ics-export').addEventListener('click', () => {
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//PhotoCRM//JP\n";
    customers.forEach(c => {
      if (c.shootingDate) {
        const d = c.shootingDate.replace(/-/g, '');
        ics += "BEGIN:VEVENT\n";
        ics += `DTSTART;VALUE=DATE:${d}\n`;
        ics += `SUMMARY:📷 ${c.customerName || ''}\n`;
        ics += `DESCRIPTION:Plan: ${c.plan || '-'}\\nContact: ${c.contact || '-'}\n`;
        ics += "END:VEVENT\n";
      }
      if (c.meetingDate) {
        const d = c.meetingDate.replace(/-/g, '');
        ics += "BEGIN:VEVENT\n";
        ics += `DTSTART;VALUE=DATE:${d}\n`;
        ics += `SUMMARY:🤝 ${c.customerName || ''}\n`;
        ics += "END:VEVENT\n";
      }
    });
    ics += "END:VCALENDAR";
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shoots.ics';
    a.click();
  });

  // CSV Export
  $('#btn-export').addEventListener('click', () => {
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
  });

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
    const today = new Date();
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 14);

    if (issueDateInput) issueDateInput.value = customer.invoiceIssueDate || today.toISOString().slice(0, 10);
    if (dueDateInput) dueDateInput.value = customer.invoiceDueDate || defaultDueDate.toISOString().slice(0, 10);
    if (senderNameInput) senderNameInput.value = customer.invoiceSenderName || senderProfile.name || settings.companyName || '';
    if (recipientNameInput) recipientNameInput.value = customer.invoiceRecipientName || customer.customerName || '';
    if (senderContactInput) senderContactInput.value = customer.invoiceSenderContact || senderProfile.contact || settings.email || '';
    if (recipientContactInput) recipientContactInput.value = customer.invoiceRecipientContact || customer.contact || '';

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

  document.getElementById('btn-add-invoice-item').onclick = () => {
    const container = document.getElementById('invoice-items-container');
    const rows = Array.from(container.querySelectorAll('.invoice-item-row')).map(row => ({
      description: row.querySelector('.invoice-item-desc').value,
      quantity: row.querySelector('.invoice-item-qty').value,
      unitPrice: row.querySelector('.invoice-item-unit').value,
    }));
    rows.push({ description: '', quantity: 1, unitPrice: 0 });
    renderInvoiceBuilderItems(rows);
  };

  document.getElementById('btn-generate-custom-invoice').onclick = () => {
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
    });
    closeInvoiceBuilderModal();
  };

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

  window.saveExpense = function () {
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

  // Set up contract template buttons
  document.querySelectorAll('.contract-template-btn').forEach(btn => {
    btn.onclick = () => {
      const template = btn.dataset.template;
      window.generateContract(window.currentContractCustomer, template);
      closeContractModal();
    };
  });

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

  // ===== Settings Tabs Logic =====
  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      $(`#settings-content-${btn.dataset.tab}`).classList.add('active');

      if (btn.dataset.tab === 'invoice') loadInvoiceSettings();
      if (btn.dataset.tab === 'team') renderTeamList();
    };
  });

  function loadInvoiceSettings() {
    const settings = getTaxSettings();
    $('#tax-enabled').checked = settings.enabled;
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
  }

  $('#tax-enabled').onchange = (e) => {
    $('#tax-options').style.display = e.target.checked ? 'block' : 'none';
  };

  $('#tax-label').onchange = (e) => {
    $('#tax-label-custom').style.display = e.target.value === 'Custom' ? 'block' : 'none';
  };

  $('#btn-save-invoice-settings').onclick = () => {
    const label = $('#tax-label').value === 'Custom' ? $('#tax-label-custom').value : $('#tax-label').value;
    const settings = {
      enabled: $('#tax-enabled').checked,
      rate: Number($('#tax-rate').value),
      label: label,
      included: $('#tax-included').checked,
      companyName: $('#invoice-company-name').value,
      address: $('#invoice-address').value,
      email: $('#invoice-email').value,
      phone: $('#invoice-phone').value,
      bank: $('#invoice-bank').value
    };
    saveTaxSettings(settings);
    showToast(t('msgSettingsSaved'));
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

  window.openContractModalByID = function(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer && window.openContractModal) {
      window.openContractModal(customer);
    }
  };

  // ===== Initialization =====
  function init() {
    console.log('🚀 ========================================');
    console.log('🚀 PhotoCRM v2.2.3 Initializing...');
    console.log('🚀 ========================================');
    console.log('🚀 Theme:', currentTheme);
    console.log('🚀 Language:', currentLang);
    console.log('🚀 Locale loaded:', !!window.LOCALE);
    console.log('🚀 Message Analyzer: Removed');

    // 1. Apply theme first (prevents flash)
    applyTheme(currentTheme);
    console.log('✅ Theme applied');

    // 2. Set defaults
    updateLanguage(currentLang || 'en');
    updateCurrency(currentCurrency);

    // 3. Attach event listeners
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', e => updateLanguage(e.target.value));
    }

    const currencySelect = document.getElementById('currency-select');
    if (currencySelect) {
      currencySelect.addEventListener('change', e => updateCurrency(e.target.value));
    }

    const themeBtn = document.getElementById('btn-theme');
    if (themeBtn) {
      themeBtn.addEventListener('click', toggleTheme);
    }

    // Team Tab switching
    settingsOverlay.querySelectorAll('.settings-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        settingsOverlay.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
        settingsOverlay.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        $(`#settings-content-${tab}`).classList.add('active');
        if (tab === 'team') renderTeamList();
      });
    });

    // Add member
    $('#btn-team-add').addEventListener('click', () => {
      const name = $('#team-new-name').value.trim();
      const role = $('#team-new-role').value;
      if (!name) return;
      window.TeamManager.addPhotographer({ name, role });
      $('#team-new-name').value = '';
      renderTeamList();
      populateSelects();
      showToast(t('msgMemberAdded'));
    });

    $('#filter-photographer').addEventListener('change', renderTable);
    $('#btn-theme').textContent = currentTheme === 'dark' ? '🌙' : '☀️';

    $('#btn-add').addEventListener('click', () => openModal());
    $('#btn-settings').addEventListener('click', () => {
      renderSettings();
      settingsOverlay.classList.add('active');
    });

    searchInput.addEventListener('input', renderTable);
    filterPayment.addEventListener('change', renderTable);
    filterMonth.addEventListener('change', renderTable);

    // Initial render
    renderTable();
    renderExpenses();

    // Check if expense view should be visible
    if ($('#expense-container')) {
      $('#expense-container').style.display = 'block';
    }

    // Load saved view preference
    const savedView = localStorage.getItem('preferred_view') || 'list';
    const activeTab = $(`.view-tab[data-view="${savedView}"]`);
    if (activeTab) activeTab.click();

    // Register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => { });
    }
  }

  // Hook for "Other" in selects
  const keys_to_hook = ['plan', 'costume', 'hairMakeup'];
  keys_to_hook.forEach(k => hookSelectOther(k));
  hookPhotographerOther();

  // Ensure DOM is ready before initializing
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });

})();
