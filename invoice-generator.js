// Invoice & Quote PDF Generator

const INVOICE_I18N = {
    ja: {
        invoiceTitle: '請求書',
        quoteTitle: '見積書',
        numberLabelInvoice: '請求書番号',
        numberLabelQuote: '見積書番号',
        billTo: '請求先',
        from: '発行者',
        invoiceDate: '請求日',
        dueDate: '支払期限',
        validUntil: '有効期限',
        description: '内容',
        qty: '数量',
        unitPrice: '単価',
        amount: '金額',
        subtotal: '小計',
        total: '合計',
        paymentInfo: 'お支払い情報',
        thanks: 'この度はありがとうございます。',
        defaultService: '撮影セッション',
    },
    en: {
        invoiceTitle: 'INVOICE',
        quoteTitle: 'QUOTE',
        numberLabelInvoice: 'Invoice #',
        numberLabelQuote: 'Quote #',
        billTo: 'Bill To',
        from: 'From',
        invoiceDate: 'Invoice Date',
        dueDate: 'Due Date',
        validUntil: 'Valid Until',
        description: 'Description',
        qty: 'Qty',
        unitPrice: 'Unit Price',
        amount: 'Amount',
        subtotal: 'Subtotal',
        total: 'Total',
        paymentInfo: 'Payment Information',
        thanks: 'Thank you for your business.',
        defaultService: 'Photography Session',
    }
};

const CJK_FONT_URL = 'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/OTF/Japanese/NotoSansCJKjp-Regular.otf';
let cjkFontLoaded = false;

function getInvoiceLang() {
    return document.documentElement.lang || localStorage.getItem('photocrm_lang') || 'en';
}

function invoiceText(key) {
    const lang = getInvoiceLang();
    return (INVOICE_I18N[lang] && INVOICE_I18N[lang][key]) || INVOICE_I18N.en[key] || key;
}

function formatInvoiceDate(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(getInvoiceLang()).format(date);
}

async function loadCjkFont(doc) {
    if (cjkFontLoaded) {
        doc.setFont('NotoSansCJKjp', 'normal');
        return;
    }

    const response = await fetch(CJK_FONT_URL);
    if (!response.ok) throw new Error('Failed to load CJK font');

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }

    const base64 = btoa(binary);
    doc.addFileToVFS('NotoSansCJKjp-Regular.otf', base64);
    doc.addFont('NotoSansCJKjp-Regular.otf', 'NotoSansCJKjp', 'normal');
    cjkFontLoaded = true;
    doc.setFont('NotoSansCJKjp', 'normal');
}

async function configureInvoiceFont(doc) {
    const lang = getInvoiceLang();
    if (!['ja', 'zh', 'zh-TW', 'ko'].includes(lang)) return;

    try {
        await loadCjkFont(doc);
    } catch (err) {
        console.warn('CJK font load failed, using fallback font.', err);
    }
}

async function generateInvoicePDF(customer, type = 'invoice', invoiceData = {}) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    await configureInvoiceFont(doc);

    const settings = getTaxSettings();
    const pageWidth = doc.internal.pageSize.getWidth();
    const currency = typeof getCurrencySymbol === 'function' ? getCurrencySymbol() : '$';

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
    const amounts = calculateTax(subtotalRaw);

    const senderName = invoiceData.senderName || customer.invoiceSenderName || settings.companyName || '—';
    const senderContact = invoiceData.senderContact || customer.invoiceSenderContact || '';
    const recipientName = invoiceData.recipientName || customer.invoiceRecipientName || customer.customerName || '—';
    const recipientContact = invoiceData.recipientContact || customer.invoiceRecipientContact || customer.contact || '';
    const issueDate = invoiceData.issueDate || customer.invoiceIssueDate || new Date().toISOString().slice(0, 10);
    const dueDate = invoiceData.dueDate || customer.invoiceDueDate || '';

    // Header
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text(type === 'invoice' ? invoiceText('invoiceTitle') : invoiceText('quoteTitle'), 20, 20);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`${type === 'invoice' ? invoiceText('numberLabelInvoice') : invoiceText('numberLabelQuote')}: ${customer.id}`, 20, 28);

    doc.setFont(undefined, 'bold');
    doc.text(senderName, pageWidth - 20, 17, { align: 'right' });
    doc.setFont(undefined, 'normal');
    if (senderContact) doc.text(senderContact, pageWidth - 20, 23, { align: 'right' });

    // Billing blocks
    let y = 48;
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(invoiceText('billTo'), 20, y);
    doc.text(invoiceText('from'), 72, y);
    doc.text(invoiceText('invoiceDate'), 125, y);
    y += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(recipientName, 20, y);
    if (recipientContact) doc.text(recipientContact, 20, y + 5);
    doc.text(senderName, 72, y);
    if (senderContact) doc.text(senderContact, 72, y + 5);
    doc.text(formatInvoiceDate(issueDate), 125, y);

    if (dueDate && type === 'invoice') {
        doc.text(`${invoiceText('dueDate')}: ${formatInvoiceDate(dueDate)}`, 125, y + 5);
    }

    if (type === 'quote') {
        const validDate = new Date(issueDate);
        validDate.setDate(validDate.getDate() + 30);
        doc.text(`${invoiceText('validUntil')}: ${formatInvoiceDate(validDate)}`, 125, y + 5);
    }

    // Items table
    const tableTop = 75;
    const col = { desc: 20, qty: 120, unit: 142, amount: pageWidth - 20 };
    doc.setFillColor(243, 244, 246);
    doc.rect(20, tableTop, pageWidth - 40, 10, 'F');

    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text(invoiceText('description'), col.desc + 2, tableTop + 6.5);
    doc.text(invoiceText('qty'), col.qty, tableTop + 6.5, { align: 'right' });
    doc.text(invoiceText('unitPrice'), col.unit, tableTop + 6.5, { align: 'right' });
    doc.text(invoiceText('amount'), col.amount, tableTop + 6.5, { align: 'right' });

    let rowY = tableTop + 15;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    items.forEach(item => {
        const wrapped = doc.splitTextToSize(item.description, 90);
        const rowHeight = Math.max(8, wrapped.length * 5);

        if (rowY + rowHeight > 240) {
            doc.addPage();
            rowY = 25;
        }

        doc.text(wrapped, col.desc + 2, rowY);
        doc.text(String(item.quantity), col.qty, rowY, { align: 'right' });
        doc.text(`${currency}${item.unitPrice.toLocaleString(getInvoiceLang())}`, col.unit, rowY, { align: 'right' });
        doc.text(`${currency}${item.amount.toLocaleString(getInvoiceLang())}`, col.amount, rowY, { align: 'right' });

        rowY += rowHeight;
        doc.setDrawColor(229, 231, 235);
        doc.line(20, rowY, pageWidth - 20, rowY);
        rowY += 4;
    });

    // Totals card
    const totalsY = Math.max(rowY + 6, 195);
    const boxX = pageWidth - 90;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(boxX, totalsY, 70, 38, 2, 2, 'F');

    doc.setFontSize(9);
    doc.text(invoiceText('subtotal'), boxX + 4, totalsY + 8);
    doc.text(`${currency}${amounts.subtotal.toFixed(2)}`, boxX + 66, totalsY + 8, { align: 'right' });

    doc.text(settings.label || 'Tax', boxX + 4, totalsY + 16);
    doc.text(`${currency}${amounts.tax.toFixed(2)}`, boxX + 66, totalsY + 16, { align: 'right' });

    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text(invoiceText('total'), boxX + 4, totalsY + 29);
    doc.text(`${currency}${amounts.total.toFixed(2)}`, boxX + 66, totalsY + 29, { align: 'right' });

    if (settings.bank && type === 'invoice') {
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text(invoiceText('paymentInfo'), 20, totalsY + 12);
        const bankLines = doc.splitTextToSize(settings.bank, pageWidth - 120);
        doc.text(bankLines, 20, totalsY + 18);
    }

    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text(invoiceText('thanks'), pageWidth / 2, 286, { align: 'center' });

    const filename = `${type}-${(recipientName || 'customer').replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    doc.save(filename);
}

function generateQuotePDF(customer) {
    generateInvoicePDF(customer, 'quote');
}

function generateContract(customer, templateType = 'wedding') {
    const { jsPDF } = window.jspdf;
    const currency = typeof getCurrencySymbol === 'function' ? getCurrencySymbol() : '$';
    const doc = new jsPDF();
    const settings = getTaxSettings();
    const pageWidth = doc.internal.pageSize.getWidth();

    const templates = {
        wedding: {
            title: 'Wedding Photography Contract',
            content: `
This agreement is made on ${new Date().toLocaleDateString()} between:

PHOTOGRAPHER: ${settings.companyName || '[Your Name]'}
CLIENT: ${customer.customerName}

1. SERVICES
The Photographer agrees to provide wedding photography services on:
Date: ${customer.shootingDate || '[Date]'}
Location: ${customer.location || '[Location]'}
Duration: [X] hours

2. PACKAGE & PRICING
Package: ${customer.plan}
Total Fee: ${currency}${customer.revenue}
Deposit: ${currency}[Amount] (due by [Date])
Balance: ${currency}[Amount] (due by [Date])

3. DELIVERABLES
- [Number] edited digital images
- Online gallery for viewing/downloading
- Delivery within [X] weeks after event

4. PAYMENT TERMS
${settings.enabled ? `Prices include ${settings.label} at ${settings.rate}%` : 'Prices exclude applicable taxes'}

5. CANCELLATION POLICY
[Your cancellation policy]

6. USAGE RIGHTS
[Your usage rights terms]

SIGNATURES

Photographer: _________________ Date: _______
Client: _________________ Date: _______
      `
        },
        portrait: {
            title: 'Portrait Photography Contract',
            content: `
This agreement is made on ${new Date().toLocaleDateString()} between:

PHOTOGRAPHER: ${settings.companyName || '[Your Name]'}
CLIENT: ${customer.customerName}

1. SESSION DETAILS
Date: ${customer.shootingDate || '[Date]'}
Location: ${customer.location || '[Location]'}
Type: Portrait Session

2. PRICING
Session Fee: ${currency}${customer.revenue}

3. DELIVERABLES
- [Number] edited digital images
- Delivery within [X] days

SIGNATURES

Photographer: _________________ Date: _______
Client: _________________ Date: _______
      `
        },
        commercial: {
            title: 'Commercial Photography Contract',
            content: `
This agreement is made on ${new Date().toLocaleDateString()} between:

PHOTOGRAPHER: ${settings.companyName || '[Your Name]'}
CLIENT: ${customer.customerName}

1. PROJECT DETAILS
Project: ${customer.plan}
Date: ${customer.shootingDate || '[Date]'}
Location: ${customer.location || '[Location]'}

2. SCOPE OF WORK
[Describe deliverables]

3. FEES
Total Project Fee: ${currency}${customer.revenue}
Usage Rights: [Specify]
Term: [Duration]

SIGNATURES

Photographer: _________________ Date: _______
Client: _________________ Date: _______
      `
        }
    };

    const template = templates[templateType] || templates.wedding;

    // Header
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(template.title, 20, 16);

    // Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');

    const lines = doc.splitTextToSize(template.content.trim(), pageWidth - 40);
    let y = 35;

    lines.forEach(line => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        doc.text(line, 20, y);
        y += 6;
    });

    doc.save(`contract-${templateType}-${customer.customerName || 'client'}.pdf`);
}

window.generateInvoicePDF = generateInvoicePDF;
window.generateQuotePDF = generateQuotePDF;
window.generateContract = generateContract;
