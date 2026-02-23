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

function escapeInvoiceHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildInvoiceMarkup(type, customer, settings, invoiceModel) {
    const currency = typeof getCurrencySymbol === 'function' ? getCurrencySymbol() : '$';
    const numberLabel = type === 'invoice' ? invoiceText('numberLabelInvoice') : invoiceText('numberLabelQuote');
    const title = type === 'invoice' ? invoiceText('invoiceTitle') : invoiceText('quoteTitle');
    const dueLabel = type === 'invoice' ? invoiceText('dueDate') : invoiceText('validUntil');

    const itemsHtml = invoiceModel.items.map(item => `
        <tr>
            <td class="item-desc">${escapeInvoiceHtml(item.description)}</td>
            <td class="item-num">${item.quantity}</td>
            <td class="item-num">${escapeInvoiceHtml(`${currency}${item.unitPrice.toLocaleString(getInvoiceLang())}`)}</td>
            <td class="item-num">${escapeInvoiceHtml(`${currency}${item.amount.toLocaleString(getInvoiceLang())}`)}</td>
        </tr>
    `).join('');

    const paymentInfoHtml = settings.bank && type === 'invoice'
        ? `<section class="payment"><h3>${invoiceText('paymentInfo')}</h3><p>${escapeInvoiceHtml(settings.bank).replace(/\n/g, '<br>')}</p></section>`
        : '';

    return `
        <div class="invoice-print-root">
            <style>
                .invoice-print-root { width: 794px; background: #fff; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif; padding: 40px; box-sizing: border-box; }
                .invoice-header { background: #1f2937; color: #fff; border-radius: 10px; padding: 24px; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
                .invoice-header h1 { margin: 0; font-size: 32px; letter-spacing: 0.03em; }
                .invoice-header p { margin: 6px 0 0; font-size: 14px; }
                .invoice-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 24px; }
                .invoice-card { background: #f9fafb; border-radius: 8px; padding: 12px; min-height: 90px; }
                .invoice-card h3 { margin: 0 0 8px; font-size: 13px; color: #4b5563; }
                .invoice-card p { margin: 0; font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
                .item-table { width: 100%; border-collapse: collapse; margin-top: 24px; table-layout: fixed; }
                .item-table th, .item-table td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; font-size: 13px; vertical-align: top; }
                .item-table th { background: #f3f4f6; text-align: left; color: #374151; }
                .item-table .item-desc { width: 55%; white-space: pre-wrap; word-break: break-word; }
                .item-table .item-num { text-align: right; white-space: nowrap; }
                .summary { margin-top: 20px; margin-left: auto; width: 320px; background: #f9fafb; border-radius: 8px; padding: 14px; }
                .summary-row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 14px; }
                .summary-row.total { margin-top: 12px; padding-top: 10px; border-top: 1px solid #d1d5db; font-size: 18px; font-weight: 700; }
                .payment { margin-top: 18px; font-size: 13px; }
                .payment h3 { margin: 0 0 6px; font-size: 13px; color: #374151; }
                .payment p { margin: 0; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
                .invoice-footer { text-align: center; margin-top: 28px; color: #6b7280; font-size: 12px; }
            </style>
            <header class="invoice-header">
                <div>
                    <h1>${escapeInvoiceHtml(title)}</h1>
                    <p>${escapeInvoiceHtml(`${numberLabel}: ${customer.id}`)}</p>
                </div>
                <div style="text-align: right; font-size: 14px; line-height: 1.5;">
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
                    <p>${escapeInvoiceHtml(formatInvoiceDate(invoiceModel.issueDate))}<br>${escapeInvoiceHtml(`${dueLabel}: ${formatInvoiceDate(invoiceModel.dueDate)}`)}</p>
                </article>
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
                <div class="summary-row"><span>${invoiceText('subtotal')}</span><span>${escapeInvoiceHtml(`${currency}${invoiceModel.amounts.subtotal.toFixed(2)}`)}</span></div>
                <div class="summary-row"><span>${escapeInvoiceHtml(settings.label || 'Tax')}</span><span>${escapeInvoiceHtml(`${currency}${invoiceModel.amounts.tax.toFixed(2)}`)}</span></div>
                <div class="summary-row total"><span>${invoiceText('total')}</span><span>${escapeInvoiceHtml(`${currency}${invoiceModel.amounts.total.toFixed(2)}`)}</span></div>
            </section>
            ${paymentInfoHtml}
            <footer class="invoice-footer">${invoiceText('thanks')}</footer>
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
    const amounts = calculateTax(subtotalRaw);

    const senderName = invoiceData.senderName || customer.invoiceSenderName || settings.companyName || '—';
    const senderContact = invoiceData.senderContact || customer.invoiceSenderContact || '';
    const recipientName = invoiceData.recipientName || customer.invoiceRecipientName || customer.customerName || '—';
    const recipientContact = invoiceData.recipientContact || customer.invoiceRecipientContact || customer.contact || '';
    const issueDate = invoiceData.issueDate || customer.invoiceIssueDate || new Date().toISOString().slice(0, 10);
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
        items,
        amounts,
    });

    await renderInvoiceDomToPdf(markup, filename);
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
