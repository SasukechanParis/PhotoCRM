// Invoice & Quote PDF Generator

const INVOICE_I18N = {
    ja: {
        invoiceTitle: '請求書',
        quoteTitle: '見積書',
        invoiceDate: '請求日',
        dueDate: '支払期限',
        validUntil: '有効期限',
        description: '内容',
        qty: '数量',
        unitPrice: '単価',
        amount: '金額',
        subtotal: '小計',
        total: '合計',
        tax: '消費税',
        billTo: '請求先',
        from: '発行者',
        legalInfo: '法定情報',
        paymentInfo: 'お支払い情報',
        note: '備考',
        issuerSignature: '発行者署名',
        recipientSignature: '受領者署名',
        issuedOn: '発行日',
        contractTitle: '撮影業務委託契約書',
        contractDate: '契約締結日',
        partyClient: '甲（依頼者）',
        partyProvider: '乙（撮影者）',
        contactLine: '連絡先',
        defaultService: '撮影セッション',
        thanks: 'この度はありがとうございます。',
    },
    en: {
        invoiceTitle: 'INVOICE',
        quoteTitle: 'QUOTE',
        invoiceDate: 'Invoice Date',
        dueDate: 'Due Date',
        validUntil: 'Valid Until',
        description: 'Description',
        qty: 'Qty',
        unitPrice: 'Unit Price',
        amount: 'Amount',
        subtotal: 'Subtotal',
        total: 'Total',
        tax: 'Tax',
        billTo: 'Bill To',
        from: 'From',
        legalInfo: 'Legal Information',
        paymentInfo: 'Payment Information',
        note: 'Notes',
        issuerSignature: 'Issuer Signature',
        recipientSignature: 'Recipient Signature',
        issuedOn: 'Issued On',
        contractTitle: 'Photography Service Agreement',
        contractDate: 'Agreement Date',
        partyClient: 'Client',
        partyProvider: 'Provider',
        contactLine: 'Contact',
        defaultService: 'Photography Session',
        thanks: 'Thank you for your business.',
    },
    fr: {
        invoiceTitle: 'FACTURE',
        quoteTitle: 'DEVIS',
        invoiceDate: 'Date de facturation',
        dueDate: 'Date d\'echeance',
        validUntil: 'Valable jusqu\'au',
        description: 'Description',
        qty: 'Qté',
        unitPrice: 'Prix unitaire',
        amount: 'Montant',
        subtotal: 'Sous-total',
        total: 'Total',
        tax: 'TVA',
        billTo: 'Client',
        from: 'Emetteur',
        legalInfo: 'Informations legales',
        paymentInfo: 'Coordonnees de paiement',
        note: 'Remarques',
        issuerSignature: 'Signature emetteur',
        recipientSignature: 'Signature client',
        issuedOn: 'Emise le',
        contractTitle: 'Contrat de prestation photographique',
        contractDate: 'Date du contrat',
        partyClient: 'Client',
        partyProvider: 'Prestataire',
        contactLine: 'Contact',
        defaultService: 'Seance photo',
        thanks: 'Merci pour votre confiance.',
    },
    "zh-CN": {
        invoiceTitle: '发票',
        quoteTitle: '报价单',
        invoiceDate: '开票日期',
        dueDate: '付款期限',
        validUntil: '有效期至',
        description: '项目',
        qty: '数量',
        unitPrice: '单价',
        amount: '金额',
        subtotal: '小计',
        total: '合计',
        tax: '增值税',
        billTo: '客户',
        from: '开票方',
        legalInfo: '法定信息',
        paymentInfo: '收款信息',
        note: '备注',
        issuerSignature: '开票方签名',
        recipientSignature: '客户签名',
        issuedOn: '签发日期',
        contractTitle: '摄影服务合同',
        contractDate: '签约日期',
        partyClient: '甲方',
        partyProvider: '乙方',
        contactLine: '联系方式',
        defaultService: '摄影服务',
        thanks: '感谢您的信任。',
    },
    "zh-TW": {
        invoiceTitle: '發票',
        quoteTitle: '報價單',
        invoiceDate: '開立日期',
        dueDate: '付款期限',
        validUntil: '有效期限',
        description: '項目',
        qty: '數量',
        unitPrice: '單價',
        amount: '金額',
        subtotal: '小計',
        total: '合計',
        tax: '營業稅',
        billTo: '客戶',
        from: '開立方',
        legalInfo: '法定資訊',
        paymentInfo: '收款資訊',
        note: '備註',
        issuerSignature: '開立方簽名',
        recipientSignature: '客戶簽名',
        issuedOn: '開立日期',
        contractTitle: '攝影服務合約',
        contractDate: '簽約日期',
        partyClient: '甲方',
        partyProvider: '乙方',
        contactLine: '聯絡方式',
        defaultService: '攝影服務',
        thanks: '感謝您的信任。',
    },
    ko: {
        invoiceTitle: '청구서',
        quoteTitle: '견적서',
        invoiceDate: '청구일',
        dueDate: '지급 기한',
        validUntil: '유효 기한',
        description: '내용',
        qty: '수량',
        unitPrice: '단가',
        amount: '금액',
        subtotal: '소계',
        total: '합계',
        tax: '부가세',
        billTo: '청구 대상',
        from: '발행자',
        legalInfo: '법적 정보',
        paymentInfo: '입금 정보',
        note: '비고',
        issuerSignature: '발행자 서명',
        recipientSignature: '수령자 서명',
        issuedOn: '발행일',
        contractTitle: '촬영 용역 계약서',
        contractDate: '계약 체결일',
        partyClient: '갑(의뢰인)',
        partyProvider: '을(촬영자)',
        contactLine: '연락처',
        defaultService: '촬영 세션',
        thanks: '이용해 주셔서 감사합니다.',
    },
};

const INVOICE_LOCALE_KEY_MAP = {
    billTo: 'invoicePdfBillTo',
    from: 'invoicePdfFrom',
    qty: 'invoicePdfQty',
    unitPrice: 'invoicePdfUnitPrice',
    amount: 'invoicePdfAmount',
    subtotal: 'invoicePdfSubtotal',
    total: 'invoicePdfTotal',
};

const DEFAULT_INVOICE_MESSAGE = 'この度はありがとうございます。';
const DEFAULT_INVOICE_TAX_RATE = 10;

const INVOICE_TEMPLATE_STYLES = {
    modern: {
        rootClass: 'template-modern',
        css: `
            .invoice-print-root.template-modern .invoice-header { background: #1f2937; color: #fff; border-radius: 10px; padding: 24px; }
            .invoice-print-root.template-modern .invoice-card,
            .invoice-print-root.template-modern .summary { background: #f9fafb; border-radius: 8px; }
            .invoice-print-root.template-modern .item-table th { background: #f3f4f6; }
        `,
    },
    classic: {
        rootClass: 'template-classic',
        css: `
            .invoice-print-root.template-classic { border: 2px solid #111827; }
            .invoice-print-root.template-classic .invoice-header { border: 2px solid #111827; background: #fff; color: #111827; padding: 18px 20px; }
            .invoice-print-root.template-classic .invoice-card,
            .invoice-print-root.template-classic .summary { border: 1px solid #9ca3af; border-radius: 0; background: #fff; }
            .invoice-print-root.template-classic .item-table,
            .invoice-print-root.template-classic .item-table th,
            .invoice-print-root.template-classic .item-table td { border: 1px solid #9ca3af; }
            .invoice-print-root.template-classic .item-table th { background: #f8fafc; }
            .invoice-print-root.template-classic .seal-space { display: block; }
        `,
    },
    minimal: {
        rootClass: 'template-minimal',
        css: `
            .invoice-print-root.template-minimal { padding: 30px; color: #111827; }
            .invoice-print-root.template-minimal .invoice-header { background: transparent; color: #111827; border-bottom: 1px solid #d1d5db; padding: 0 0 14px; border-radius: 0; }
            .invoice-print-root.template-minimal .invoice-grid { margin-top: 18px; gap: 10px; }
            .invoice-print-root.template-minimal .invoice-card,
            .invoice-print-root.template-minimal .summary { background: transparent; border: 1px solid #e5e7eb; border-radius: 4px; }
            .invoice-print-root.template-minimal .item-table th { background: transparent; border-bottom: 2px solid #d1d5db; }
            .invoice-print-root.template-minimal .item-table td { border-bottom: 1px solid #e5e7eb; }
        `,
    },
};

function resolveInvoiceLanguage(lang) {
    const raw = String(lang || '').trim();
    if (INVOICE_I18N[raw]) return raw;
    const normalized = raw.toLowerCase();
    if (normalized.startsWith('zh-cn')) return 'zh-CN';
    if (normalized.startsWith('zh-tw')) return 'zh-TW';
    if (normalized.startsWith('fr')) return 'fr';
    if (normalized.startsWith('ja')) return 'ja';
    if (normalized.startsWith('ko')) return 'ko';
    return 'en';
}

function getInvoiceLang() {
    const htmlLang = document.documentElement.lang || '';
    const storedLang = window.FirebaseService?.getCachedData('photocrm_lang') || 'en';
    return resolveInvoiceLanguage(htmlLang || storedLang);
}

function invoiceText(key) {
    const localeKey = INVOICE_LOCALE_KEY_MAP[key];
    if (localeKey && typeof window.t === 'function') {
        const translated = window.t(localeKey);
        if (translated && translated !== localeKey) return translated;
    }

    const lang = getInvoiceLang();
    return (INVOICE_I18N[lang] && INVOICE_I18N[lang][key])
        || (INVOICE_I18N.en && INVOICE_I18N.en[key])
        || key;
}

function getActiveCurrencyCode() {
    return typeof getCurrentCurrency === 'function'
        ? getCurrentCurrency()
        : (window.FirebaseService?.getCachedData('photocrm_currency') || 'USD');
}

function formatInvoiceMoney(value) {
    const amount = Number(value) || 0;
    const lang = getInvoiceLang();
    const currencyCode = getActiveCurrencyCode();
    const zeroDecimalCurrencies = new Set(['JPY', 'KRW', 'TWD']);
    const isZeroDecimal = zeroDecimalCurrencies.has(currencyCode);
    return new Intl.NumberFormat(lang, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: isZeroDecimal ? 0 : 2,
        maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(amount);
}

function formatInvoiceDate(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(getInvoiceLang()).format(date);
}

function calculateInvoiceTotals(amount, settings = {}) {
    const rawSubtotal = Math.max(0, Number(amount) || 0);
    const taxRate = Math.max(0, Number(settings.rate) || DEFAULT_INVOICE_TAX_RATE);
    const taxEnabled = settings.enabled !== false;
    const taxIncluded = settings.included === true;

    if (!taxEnabled || taxRate <= 0) {
        return {
            subtotal: rawSubtotal,
            tax: 0,
            total: rawSubtotal,
            taxRate,
        };
    }

    if (taxIncluded) {
        const subtotal = rawSubtotal / (1 + taxRate / 100);
        const tax = rawSubtotal - subtotal;
        return { subtotal, tax, total: rawSubtotal, taxRate };
    }

    const tax = rawSubtotal * (taxRate / 100);
    return {
        subtotal: rawSubtotal,
        tax,
        total: rawSubtotal + tax,
        taxRate,
    };
}

function getInvoiceCountryProfiles() {
    const profiles = window.INVOICE_COUNTRY_PROFILES;
    if (!profiles || typeof profiles !== 'object') return {};
    return profiles;
}

function getInvoiceCountryProfile(lang = getInvoiceLang()) {
    const profiles = getInvoiceCountryProfiles();
    return profiles[lang] || profiles.en || {
        code: 'US',
        currency: 'USD',
        defaultTaxRate: DEFAULT_INVOICE_TAX_RATE,
        taxLabel: 'Tax',
        legalFields: [],
    };
}

function escapeInvoiceHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildInvoiceLegalInfoRows(settings, lang = getInvoiceLang()) {
    const profile = getInvoiceCountryProfile(lang);
    const legalFields = Array.isArray(profile.legalFields) ? profile.legalFields : [];
    const legalValues = settings?.legalFieldValues && typeof settings.legalFieldValues === 'object'
        ? settings.legalFieldValues
        : {};

    return legalFields
        .map((field) => {
            const value = String(legalValues[field.key] || '').trim();
            if (!value) return '';
            return `
                <div class="invoice-legal-line">
                    <span class="invoice-legal-key">${escapeInvoiceHtml(field.label || field.key)}:</span>
                    <span>${escapeInvoiceHtml(value)}</span>
                </div>
            `;
        })
        .filter(Boolean)
        .join('');
}

function buildInvoiceMarkup(type, customer, settings, invoiceModel) {
    const lang = getInvoiceLang();
    const profile = getInvoiceCountryProfile(lang);
    const title = type === 'invoice' ? invoiceText('invoiceTitle') : invoiceText('quoteTitle');
    const dueLabel = type === 'invoice' ? invoiceText('dueDate') : invoiceText('validUntil');
    const templateName = settings.invoiceTemplate || 'modern';
    const template = INVOICE_TEMPLATE_STYLES[templateName] || INVOICE_TEMPLATE_STYLES.modern;
    const footerMessage = invoiceModel.message || settings.invoiceFooterMessage || invoiceText('thanks') || DEFAULT_INVOICE_MESSAGE;
    const dueDateText = invoiceModel.dueDate ? formatInvoiceDate(invoiceModel.dueDate) : '—';
    const taxLabel = settings.label || profile.taxLabel || invoiceText('tax');

    const itemsHtml = invoiceModel.items.map(item => `
        <tr>
            <td class="item-desc">${escapeInvoiceHtml(item.description)}</td>
            <td class="item-num">${item.quantity}</td>
            <td class="item-num">${escapeInvoiceHtml(formatInvoiceMoney(item.unitPrice))}</td>
            <td class="item-num">${escapeInvoiceHtml(formatInvoiceMoney(item.amount))}</td>
        </tr>
    `).join('');

    const legalInfoRows = buildInvoiceLegalInfoRows(settings, lang);
    const legalInfoHtml = legalInfoRows
        ? `
            <article class="invoice-card invoice-legal-card">
                <h3>${invoiceText('legalInfo')}</h3>
                <div class="invoice-legal-list">${legalInfoRows}</div>
            </article>
        `
        : '';

    const paymentInfoHtml = settings.bank && type === 'invoice'
        ? `<section class="payment"><h3>${invoiceText('paymentInfo')}</h3><p>${escapeInvoiceHtml(settings.bank).replace(/\n/g, '<br>')}</p></section>`
        : '';

    const logoHtml = settings.invoiceLogoDataUrl
        ? `<img class="invoice-brand-logo" src="${escapeInvoiceHtml(settings.invoiceLogoDataUrl)}" alt="Brand Logo">`
        : `<div class="invoice-brand-logo placeholder">LOGO</div>`;

    const stampHtml = settings.invoiceStampDataUrl
        ? `<img class="invoice-stamp-image" src="${escapeInvoiceHtml(settings.invoiceStampDataUrl)}" alt="Stamp">`
        : `<div class="invoice-stamp-placeholder">${invoiceText('recipientSignature')}</div>`;

    return `
        <div class="invoice-print-root ${template.rootClass}">
            <style>
                @page { size: A4 portrait; margin: 12mm; }
                .invoice-print-root { width: 210mm; min-height: 297mm; background: #fff; color: #111827; font-family: 'Inter', 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif; padding: 16mm 14mm; box-sizing: border-box; }
                .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
                .invoice-brand { display: flex; align-items: center; gap: 14px; }
                .invoice-brand-logo { width: 56px; height: 56px; border-radius: 12px; object-fit: cover; border: 1px solid #d1d5db; background: #fff; }
                .invoice-brand-logo.placeholder { display: flex; align-items: center; justify-content: center; font-size: 11px; color: #6b7280; background: #f8fafc; }
                .invoice-header h1 { margin: 0; font-size: 30px; letter-spacing: 0.05em; }
                .invoice-header p { margin: 6px 0 0; font-size: 13px; }
                .invoice-header-meta { text-align: right; font-size: 14px; line-height: 1.5; max-width: 45%; }
                .invoice-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 24px; }
                .invoice-card { padding: 12px; min-height: 90px; }
                .invoice-card h3 { margin: 0 0 8px; font-size: 13px; color: #4b5563; }
                .invoice-card p { margin: 0; font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
                .invoice-legal-list { display: grid; gap: 6px; font-size: 13px; line-height: 1.5; }
                .invoice-legal-line { display: flex; gap: 8px; align-items: baseline; }
                .invoice-legal-key { font-weight: 600; color: #374151; min-width: 86px; }
                .item-table { width: 100%; border-collapse: collapse; margin-top: 24px; table-layout: fixed; }
                .item-table th, .item-table td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; font-size: 13px; vertical-align: top; }
                .item-table th { text-align: left; color: #374151; background: #eef2ff; }
                .item-table .item-desc { width: 55%; white-space: pre-wrap; word-break: break-word; }
                .item-table .item-num { text-align: right; white-space: nowrap; }
                .summary { margin-top: 20px; margin-left: auto; width: 340px; padding: 14px; }
                .summary-row { display: flex; justify-content: space-between; gap: 12px; margin: 6px 0; font-size: 14px; }
                .summary-row.total { margin-top: 12px; padding-top: 10px; border-top: 1px solid #d1d5db; font-size: 18px; font-weight: 700; }
                .payment { margin-top: 18px; font-size: 13px; }
                .payment h3 { margin: 0 0 6px; font-size: 13px; color: #374151; }
                .payment p { margin: 0; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
                .invoice-note { margin-top: 18px; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 12px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
                .invoice-sign-grid { margin-top: 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .invoice-sign-box { border: 1px solid #d1d5db; border-radius: 10px; min-height: 92px; padding: 10px 12px; position: relative; }
                .invoice-sign-label { font-size: 12px; color: #4b5563; margin-bottom: 24px; }
                .invoice-sign-line { border-bottom: 1px solid #9ca3af; margin-top: 24px; }
                .invoice-stamp-slot { position: absolute; right: 10px; top: 10px; width: 64px; height: 64px; border: 1px dashed #d1d5db; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fff; }
                .invoice-stamp-image { width: 100%; height: 100%; object-fit: cover; }
                .invoice-stamp-placeholder { font-size: 10px; color: #9ca3af; text-align: center; line-height: 1.3; padding: 4px; }
                .invoice-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; }
                ${template.css}
            </style>
            <header class="invoice-header">
                <div class="invoice-brand">
                    ${logoHtml}
                    <div><h1>${escapeInvoiceHtml(title)}</h1></div>
                </div>
                <div class="invoice-header-meta">
                    <strong>${escapeInvoiceHtml(invoiceModel.senderName)}</strong><br>
                    ${escapeInvoiceHtml(invoiceModel.senderContact || '')}
                </div>
            </header>
            <section class="invoice-grid">
                <article class="invoice-card">
                    <h3>${invoiceText('billTo')}</h3>
                    <p><strong>${escapeInvoiceHtml(invoiceModel.recipientName)}</strong>${invoiceModel.recipientContact ? `<br>${escapeInvoiceHtml(invoiceModel.recipientContact)}` : ''}</p>
                </article>
                <article class="invoice-card">
                    <h3>${invoiceText('from')}</h3>
                    <p><strong>${escapeInvoiceHtml(invoiceModel.senderName)}</strong>${invoiceModel.senderContact ? `<br>${escapeInvoiceHtml(invoiceModel.senderContact)}` : ''}</p>
                </article>
                <article class="invoice-card">
                    <h3>${invoiceText('invoiceDate')}</h3>
                    <p>${escapeInvoiceHtml(formatInvoiceDate(invoiceModel.issueDate))}<br>${escapeInvoiceHtml(`${dueLabel}: ${dueDateText}`)}</p>
                </article>
                ${legalInfoHtml}
            </section>
            <table class="item-table">
                <thead>
                    <tr>
                        <th>${invoiceText('description')}</th>
                        <th style="text-align:right;">${invoiceText('qty')}</th>
                        <th style="text-align:right;">${invoiceText('unitPrice')}</th>
                        <th style="text-align:right;">${invoiceText('amount')}</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <section class="summary">
                <div class="summary-row"><span>${invoiceText('subtotal')}</span><span>${escapeInvoiceHtml(formatInvoiceMoney(invoiceModel.amounts.subtotal))}</span></div>
                <div class="summary-row"><span>${escapeInvoiceHtml(taxLabel)} (${invoiceModel.amounts.taxRate}%)</span><span>${escapeInvoiceHtml(formatInvoiceMoney(invoiceModel.amounts.tax))}</span></div>
                <div class="summary-row total"><span>${invoiceText('total')}</span><span>${escapeInvoiceHtml(formatInvoiceMoney(invoiceModel.amounts.total))}</span></div>
            </section>
            ${paymentInfoHtml}
            <section class="invoice-note"><strong>${invoiceText('note')}</strong><br>${escapeInvoiceHtml(footerMessage)}</section>
            <section class="invoice-sign-grid">
                <div class="invoice-sign-box">
                    <div class="invoice-sign-label">${invoiceText('issuerSignature')}</div>
                    <div class="invoice-sign-line"></div>
                </div>
                <div class="invoice-sign-box">
                    <div class="invoice-sign-label">${invoiceText('recipientSignature')}</div>
                    <div class="invoice-sign-line"></div>
                    <div class="invoice-stamp-slot">${stampHtml}</div>
                </div>
            </section>
            <footer class="invoice-footer">${invoiceText('issuedOn')}: ${escapeInvoiceHtml(formatInvoiceDate(invoiceModel.issueDate))}</footer>
        </div>
    `;
}

async function renderInvoiceDomToPdf(markup, filename) {
    if (!window.html2canvas) {
        throw new Error('html2canvas is not loaded.');
    }

    const { jsPDF } = window.jspdf;
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-10000px';
    wrapper.style.top = '0';
    wrapper.style.zIndex = '-1';
    wrapper.innerHTML = markup;
    document.body.appendChild(wrapper);

    try {
        const target = wrapper.firstElementChild;
        const renderScale = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
        const canvas = await window.html2canvas(target, {
            scale: renderScale,
            useCORS: true,
            backgroundColor: '#ffffff',
        });

        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const pagePixelHeight = Math.floor(canvas.width * (pageHeight / pageWidth));
        let renderedHeight = 0;
        let pageIndex = 0;

        while (renderedHeight < canvas.height) {
            const sliceHeight = Math.min(pagePixelHeight, canvas.height - renderedHeight);
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = sliceHeight;

            const ctx = pageCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, renderedHeight, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

            const sliceData = pageCanvas.toDataURL('image/jpeg', 0.95);
            const sliceHeightInPdf = (sliceHeight * pageWidth) / canvas.width;
            if (pageIndex > 0) doc.addPage();
            doc.addImage(sliceData, 'JPEG', 0, 0, pageWidth, sliceHeightInPdf, undefined, 'FAST');

            renderedHeight += sliceHeight;
            pageIndex += 1;
        }

        doc.save(filename);
    } finally {
        wrapper.remove();
    }
}

async function generateInvoicePDF(customer, type = 'invoice', invoiceData = {}) {
    const settings = getTaxSettings();

    const items = (invoiceData.items || customer.invoiceItems || [{
        description: `${customer.plan || invoiceText('defaultService')}`,
        quantity: 1,
        unitPrice: Number(customer.revenue) || 0,
    }]).map(item => ({
        description: item.description || invoiceText('defaultService'),
        quantity: Math.max(0, Number(item.quantity) || 0),
        unitPrice: Math.max(0, Number(item.unitPrice) || 0),
        get amount() { return this.quantity * this.unitPrice; }
    })).filter(item => item.quantity > 0);

    const subtotalRaw = items.reduce((sum, item) => sum + item.amount, 0);
    const amounts = calculateInvoiceTotals(subtotalRaw, settings);

    const senderName = invoiceData.senderName || customer.invoiceSenderName || settings.companyName || '—';
    const senderContact = invoiceData.senderContact || customer.invoiceSenderContact || '';
    const recipientName = invoiceData.recipientName || customer.invoiceRecipientName || customer.customerName || '—';
    const recipientContact = invoiceData.recipientContact || customer.invoiceRecipientContact || customer.contact || '';
    const issueDate = invoiceData.issueDate || customer.invoiceIssueDate || new Date().toISOString().slice(0, 10);
    const message = invoiceData.message || customer.invoiceMessage || settings.invoiceFooterMessage || invoiceText('thanks') || DEFAULT_INVOICE_MESSAGE;
    let dueDate = invoiceData.dueDate || customer.invoiceDueDate || '';
    if (type === 'quote') {
        const validDate = new Date(issueDate);
        validDate.setDate(validDate.getDate() + 30);
        dueDate = validDate;
    }

    const filename = `${type}-${(recipientName || 'customer').replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    const markup = buildInvoiceMarkup(type, customer, settings, {
        senderName,
        senderContact,
        recipientName,
        recipientContact,
        issueDate,
        dueDate,
        message,
        items,
        amounts,
    });

    await renderInvoiceDomToPdf(markup, filename);
}

function generateQuotePDF(customer) {
    generateInvoicePDF(customer, 'quote');
}

function applyContractTemplatePlaceholders(templateText, customer = {}, settings = {}) {
    const replacements = {
        '{{customer_name}}': customer.customerName || '—',
        '{{shooting_date}}': customer.shootingDate || '—',
        '{{total_price}}': formatInvoiceMoney(Number(customer.revenue) || 0),
        '{{plan_name}}': customer.plan || '—',
        '{{location}}': customer.location || '—',
        '{{contact}}': customer.contact || '—',
        '{{today}}': formatInvoiceDate(new Date()),
        '{{company_name}}': settings.companyName || '—',
    };

    let text = String(templateText || '');
    Object.entries(replacements).forEach(([token, value]) => {
        text = text.split(token).join(String(value || ''));
    });
    return text;
}

function getContractLegalLines(settings, lang = getInvoiceLang()) {
    const profile = getInvoiceCountryProfile(lang);
    const legalFields = Array.isArray(profile.legalFields) ? profile.legalFields : [];
    const legalValues = settings?.legalFieldValues && typeof settings.legalFieldValues === 'object'
        ? settings.legalFieldValues
        : {};

    return legalFields
        .map((field) => {
            const value = String(legalValues[field.key] || '').trim();
            if (!value) return '';
            return `${field.label || field.key}: ${value}`;
        })
        .filter(Boolean);
}

function getLocalizedContractTemplates(lang, customer, taxLabel, taxRate) {
    const shootingDate = customer.shootingDate || '—';
    const location = customer.location || '—';
    const planName = customer.plan || '—';
    const revenueText = formatInvoiceMoney(Number(customer.revenue) || 0);
    const locale = resolveInvoiceLanguage(lang);

    const templatesByLang = {
        ja: {
            wedding: {
                title: '撮影業務委託契約書（Wedding）',
                content: `
第1条（目的）
本契約は婚礼撮影業務の提供条件を定める。

第2条（業務内容）
撮影日: ${shootingDate}
撮影場所: ${location}
プラン: ${planName}

第3条（報酬）
報酬総額: ${revenueText}
税区分: ${taxLabel} ${taxRate}%

第4条（納品）
撮影後、合理的期間内に編集済みデータを納品する。

第5条（キャンセル）
撮影日前のキャンセルは規定のキャンセル料を請求できる。
`,
            },
            portrait: {
                title: '撮影業務委託契約書（Portrait）',
                content: `
第1条（業務内容）
ポートレート撮影を次の条件で実施する。
撮影日: ${shootingDate}
撮影場所: ${location}

第2条（報酬）
報酬総額: ${revenueText}
税区分: ${taxLabel} ${taxRate}%

第3条（成果物）
編集済みデータをオンラインまたは指定媒体で納品する。
`,
            },
            commercial: {
                title: '撮影業務委託契約書（Commercial）',
                content: `
第1条（委託範囲）
商業撮影業務を次の条件で委託する。
案件名: ${planName}
撮影日: ${shootingDate}
撮影場所: ${location}

第2条（報酬）
報酬総額: ${revenueText}
税区分: ${taxLabel} ${taxRate}%

第3条（利用許諾）
成果物の利用範囲は見積書・発注書の記載に従う。
`,
            },
        },
        en: {
            wedding: {
                title: 'Photography Service Agreement (Wedding)',
                content: `
Article 1 (Purpose)
This agreement defines terms for wedding photography services.

Article 2 (Scope)
Shooting date: ${shootingDate}
Location: ${location}
Plan: ${planName}

Article 3 (Fees and Tax)
Service fee: ${revenueText}
Tax: ${taxLabel} ${taxRate}%

Article 4 (Delivery)
Edited deliverables will be provided within a reasonable period.
`,
            },
            portrait: {
                title: 'Photography Service Agreement (Portrait)',
                content: `
Article 1 (Scope)
Portrait photography service is provided under the following terms.
Shooting date: ${shootingDate}
Location: ${location}

Article 2 (Fees and Tax)
Service fee: ${revenueText}
Tax: ${taxLabel} ${taxRate}%

Article 3 (Copyright and Usage)
Copyright remains with the photographer unless otherwise agreed.
`,
            },
            commercial: {
                title: 'Photography Service Agreement (Commercial)',
                content: `
Article 1 (Commissioned Work)
Commercial photography service is commissioned under this agreement.
Project: ${planName}
Shooting date: ${shootingDate}
Location: ${location}

Article 2 (Fees and Tax)
Service fee: ${revenueText}
Tax: ${taxLabel} ${taxRate}%

Article 3 (License)
Usage scope follows the quotation or purchase order.
`,
            },
        },
        fr: {
            wedding: {
                title: 'Contrat de prestation photo (Mariage)',
                content: `
Article 1 - Objet
Le present contrat fixe les conditions de la prestation photo de mariage.

Article 2 - Mission
Date de prise de vue : ${shootingDate}
Lieu : ${location}
Forfait : ${planName}

Article 3 - Prix et fiscalite
Montant de la prestation : ${revenueText}
Fiscalite : ${taxLabel} ${taxRate}%

Article 4 - Livraison
Les livrables retouches sont remis dans un delai raisonnable.
`,
            },
            portrait: {
                title: 'Contrat de prestation photo (Portrait)',
                content: `
Article 1 - Mission
Le photographe realise une seance portrait selon les modalites suivantes.
Date de prise de vue : ${shootingDate}
Lieu : ${location}

Article 2 - Prix et fiscalite
Montant de la prestation : ${revenueText}
Fiscalite : ${taxLabel} ${taxRate}%

Article 3 - Droits d\'auteur
Les droits d\'auteur demeurent la propriete du photographe.
`,
            },
            commercial: {
                title: 'Contrat de prestation photo (Commercial)',
                content: `
Article 1 - Objet
Prestation photographique commerciale pour le projet ci-dessous.
Projet : ${planName}
Date de prise de vue : ${shootingDate}
Lieu : ${location}

Article 2 - Prix et fiscalite
Montant de la prestation : ${revenueText}
Fiscalite : ${taxLabel} ${taxRate}%

Article 3 - Licence d\'utilisation
Le perimetre d\'utilisation suit le devis valide.
`,
            },
        },
        "zh-CN": {
            wedding: {
                title: '摄影服务合同（婚礼）',
                content: `
第1条（合同目的）
本合同用于约定婚礼摄影服务内容与交付标准。

第2条（服务内容）
拍摄日期：${shootingDate}
拍摄地点：${location}
方案：${planName}

第3条（费用与税费）
服务金额：${revenueText}
税费：${taxLabel} ${taxRate}%

第4条（交付）
乙方应在合理期限内完成后期并交付成片。
`,
            },
            portrait: {
                title: '摄影服务合同（人像）',
                content: `
第1条（服务范围）
乙方根据本合同提供人像摄影服务。
拍摄日期：${shootingDate}
拍摄地点：${location}

第2条（费用与税费）
服务金额：${revenueText}
税费：${taxLabel} ${taxRate}%

第3条（版权与授权）
作品著作权归乙方所有，授权范围以合同约定为准。
`,
            },
            commercial: {
                title: '摄影服务合同（商业）',
                content: `
第1条（委托事项）
甲方委托乙方提供商业摄影服务。
项目：${planName}
拍摄日期：${shootingDate}
拍摄地点：${location}

第2条（费用与税费）
服务金额：${revenueText}
税费：${taxLabel} ${taxRate}%

第3条（成果使用）
成果使用范围以报价单及合同附件约定为准。
`,
            },
        },
        "zh-TW": {
            wedding: {
                title: '攝影服務合約（婚禮）',
                content: `
第1條（合約目的）
本合約用於約定婚禮攝影服務內容與交付標準。

第2條（服務內容）
拍攝日期：${shootingDate}
拍攝地點：${location}
方案：${planName}

第3條（費用與稅務）
服務金額：${revenueText}
稅務：${taxLabel} ${taxRate}%

第4條（交付）
乙方應於合理期間內完成後製並交付成果。
`,
            },
            portrait: {
                title: '攝影服務合約（人像）',
                content: `
第1條（服務範圍）
乙方依本合約提供人像攝影服務。
拍攝日期：${shootingDate}
拍攝地點：${location}

第2條（費用與稅務）
服務金額：${revenueText}
稅務：${taxLabel} ${taxRate}%

第3條（著作權）
作品著作權歸乙方所有，授權範圍依合約約定。
`,
            },
            commercial: {
                title: '攝影服務合約（商業）',
                content: `
第1條（委託事項）
甲方委託乙方提供商業攝影服務。
專案：${planName}
拍攝日期：${shootingDate}
拍攝地點：${location}

第2條（費用與稅務）
服務金額：${revenueText}
稅務：${taxLabel} ${taxRate}%

第3條（成果使用）
成果使用範圍依報價單與附件規定。
`,
            },
        },
        ko: {
            wedding: {
                title: '촬영 용역 계약서 (웨딩)',
                content: `
제1조(목적)
본 계약은 웨딩 촬영 용역의 조건을 정함을 목적으로 한다.

제2조(업무 내용)
촬영일: ${shootingDate}
촬영장소: ${location}
플랜: ${planName}

제3조(대금 및 세금)
용역 대금: ${revenueText}
세금: ${taxLabel} ${taxRate}%

제4조(납품)
을은 촬영 후 합리적인 기간 내 편집본을 납품한다.
`,
            },
            portrait: {
                title: '촬영 용역 계약서 (인물)',
                content: `
제1조(업무 범위)
을은 본 계약에 따라 인물 촬영 용역을 제공한다.
촬영일: ${shootingDate}
촬영장소: ${location}

제2조(대금 및 세금)
용역 대금: ${revenueText}
세금: ${taxLabel} ${taxRate}%

제3조(저작권)
결과물 저작권은 을에게 있으며, 사용 범위는 계약에 따른다.
`,
            },
            commercial: {
                title: '촬영 용역 계약서 (상업)',
                content: `
제1조(위탁 내용)
갑은 을에게 상업 촬영 업무를 위탁한다.
프로젝트: ${planName}
촬영일: ${shootingDate}
촬영장소: ${location}

제2조(대금 및 세금)
용역 대금: ${revenueText}
세금: ${taxLabel} ${taxRate}%

제3조(이용 허락)
결과물 이용 범위는 견적서 또는 발주서에 따른다.
`,
            },
        },
    };

    return templatesByLang[locale] || templatesByLang.en;
}

function generateContract(customer, templateType = 'wedding') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const settings = getTaxSettings();
    const lang = getInvoiceLang();
    const profile = getInvoiceCountryProfile(lang);
    const taxLabel = settings.label || profile.taxLabel || invoiceText('tax');
    const taxRate = Math.max(0, Number(settings.rate) || profile.defaultTaxRate || DEFAULT_INVOICE_TAX_RATE);
    const pageWidth = doc.internal.pageSize.getWidth();
    const sectionHeadingPattern = /^(第\d+条|Article\s+\d+|제\d+조)/i;
    const templates = getLocalizedContractTemplates(lang, customer, taxLabel, taxRate);
    const legalLines = getContractLegalLines(settings, lang);

    const customTemplateSource = typeof window.getContractTemplateText === 'function'
        ? window.getContractTemplateText()
        : (window.FirebaseService?.getCachedData('photocrm_contract_template') || '');

    const customTemplate = {
        title: invoiceText('contractTitle'),
        content: applyContractTemplatePlaceholders(customTemplateSource, customer, settings),
    };

    const template = templateType === 'custom' && customTemplate.content.trim()
        ? customTemplate
        : (templates[templateType] || templates.wedding);

    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, pageWidth, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(template.title, 20, 16);

    if (settings.invoiceLogoDataUrl) {
        try {
            doc.addImage(settings.invoiceLogoDataUrl, 'PNG', pageWidth - 36, 5, 16, 16);
        } catch {
            // Ignore logo rendering errors and keep document generation available.
        }
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10.5);
    doc.setFont(undefined, 'normal');

    const partyLines = [
        `${invoiceText('contractDate')}: ${formatInvoiceDate(new Date())}`,
        `${invoiceText('partyClient')}: ${customer.customerName || '—'}`,
        `${invoiceText('partyProvider')}: ${settings.companyName || '—'}`,
        `${invoiceText('contactLine')}: ${customer.contact || '—'}`,
        ...legalLines,
    ];

    let y = 36;
    partyLines.forEach((line) => {
        const wrapped = doc.splitTextToSize(line, pageWidth - 40);
        wrapped.forEach((part) => {
            if (y > 268) {
                doc.addPage();
                y = 20;
            }
            doc.text(part, 20, y);
            y += 6;
        });
    });

    y += 2;
    const lines = doc.splitTextToSize(template.content.trim(), pageWidth - 40);

    lines.forEach((line) => {
        if (y > 268) {
            doc.addPage();
            y = 20;
        }
        if (sectionHeadingPattern.test(line.trim())) {
            doc.setFont(undefined, 'bold');
            doc.text(line, 20, y);
            doc.setFont(undefined, 'normal');
        } else {
            doc.text(line, 20, y);
        }
        y += 6;
    });

    if (y > 246) {
        doc.addPage();
        y = 24;
    } else {
        y += 8;
    }

    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(20, y, 80, 24, 2, 2);
    doc.roundedRect(pageWidth - 100, y, 80, 24, 2, 2);
    doc.setFontSize(10);
    doc.text(invoiceText('recipientSignature'), 24, y + 8);
    doc.text(invoiceText('issuerSignature'), pageWidth - 96, y + 8);
    doc.line(24, y + 20, 94, y + 20);
    doc.line(pageWidth - 96, y + 20, pageWidth - 26, y + 20);

    if (settings.invoiceStampDataUrl) {
        try {
            doc.addImage(settings.invoiceStampDataUrl, 'PNG', pageWidth - 42, y + 2, 16, 16);
        } catch {
            // Ignore stamp rendering error and continue exporting.
        }
    }

    doc.save(`contract-${templateType}-${customer.customerName || 'client'}.pdf`);
}

function buildInvoicePreviewMarkup(customer, type = 'invoice', invoiceData = {}) {
    const settings = getTaxSettings();
    const items = (invoiceData.items || customer.invoiceItems || [{
        description: `${customer.plan || invoiceText('defaultService')}`,
        quantity: 1,
        unitPrice: Number(customer.revenue) || 0,
    }]).map(item => ({
        description: item.description || invoiceText('defaultService'),
        quantity: Math.max(0, Number(item.quantity) || 0),
        unitPrice: Math.max(0, Number(item.unitPrice) || 0),
        get amount() { return this.quantity * this.unitPrice; }
    })).filter(item => item.quantity > 0);

    const subtotalRaw = items.reduce((sum, item) => sum + item.amount, 0);
    const amounts = calculateInvoiceTotals(subtotalRaw, settings);
    const issueDate = invoiceData.issueDate || customer.invoiceIssueDate || new Date().toISOString().slice(0, 10);
    const dueDate = invoiceData.dueDate || customer.invoiceDueDate || '';

    return buildInvoiceMarkup(type, customer, settings, {
        senderName: invoiceData.senderName || customer.invoiceSenderName || settings.companyName || '—',
        senderContact: invoiceData.senderContact || customer.invoiceSenderContact || '',
        recipientName: invoiceData.recipientName || customer.invoiceRecipientName || customer.customerName || '—',
        recipientContact: invoiceData.recipientContact || customer.invoiceRecipientContact || customer.contact || '',
        issueDate,
        dueDate,
        message: invoiceData.message || customer.invoiceMessage || settings.invoiceFooterMessage || invoiceText('thanks') || DEFAULT_INVOICE_MESSAGE,
        items,
        amounts,
    });
}

window.generateInvoicePDF = generateInvoicePDF;
window.generateQuotePDF = generateQuotePDF;
window.generateContract = generateContract;
window.buildInvoicePreviewMarkup = buildInvoicePreviewMarkup;
