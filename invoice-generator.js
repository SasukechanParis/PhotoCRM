// Invoice & Quote PDF Generator

function generateInvoicePDF(customer, type = 'invoice', invoiceData = {}) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const settings = getTaxSettings();
    const pageWidth = doc.internal.pageSize.getWidth();
    const currency = typeof getCurrencySymbol === 'function' ? getCurrencySymbol() : '$';

    const items = (invoiceData.items || customer.invoiceItems || [{
        description: `${customer.plan || 'Photography'} Session`,
        quantity: 1,
        unitPrice: Number(customer.revenue) || 0,
    }]).map(item => ({
        description: item.description || 'Service',
        quantity: Math.max(0, Number(item.quantity) || 0),
        unitPrice: Math.max(0, Number(item.unitPrice) || 0),
        get amount() { return this.quantity * this.unitPrice; }
    })).filter(item => item.quantity > 0);

    const subtotalRaw = items.reduce((sum, item) => sum + item.amount, 0);
    const amounts = calculateTax(subtotalRaw);

    // Professional Header Banner
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text(type === 'invoice' ? 'INVOICE' : 'QUOTE', 20, 20);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`${type === 'invoice' ? 'Invoice' : 'Quote'} #: ${customer.id}`, 20, 28);

    doc.setFont(undefined, 'bold');
    doc.text(settings.companyName || 'PhotoCRM Studio', pageWidth - 20, 17, { align: 'right' });
    doc.setFont(undefined, 'normal');
    if (settings.email) doc.text(settings.email, pageWidth - 20, 23, { align: 'right' });
    if (settings.phone) doc.text(settings.phone, pageWidth - 20, 29, { align: 'right' });

    // Billing blocks
    let y = 48;
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Bill To', 20, y);
    doc.text('Invoice Date', 125, y);
    y += 6;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(customer.customerName || '—', 20, y);
    if (customer.contact) doc.text(customer.contact, 20, y + 5);
    doc.text(new Date().toLocaleDateString(), 125, y);
    if (type === 'quote') {
        const validDate = new Date();
        validDate.setDate(validDate.getDate() + 30);
        doc.text(`Valid Until: ${validDate.toLocaleDateString()}`, 125, y + 5);
    }

    // Items table
    const tableTop = 75;
    const col = { desc: 20, qty: 120, unit: 142, amount: pageWidth - 20 };
    doc.setFillColor(243, 244, 246);
    doc.rect(20, tableTop, pageWidth - 40, 10, 'F');

    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('Description', col.desc + 2, tableTop + 6.5);
    doc.text('Qty', col.qty, tableTop + 6.5, { align: 'right' });
    doc.text('Unit Price', col.unit, tableTop + 6.5, { align: 'right' });
    doc.text('Amount', col.amount, tableTop + 6.5, { align: 'right' });

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
        doc.text(`${currency}${item.unitPrice.toLocaleString()}`, col.unit, rowY, { align: 'right' });
        doc.text(`${currency}${item.amount.toLocaleString()}`, col.amount, rowY, { align: 'right' });

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
    doc.text('Subtotal', boxX + 4, totalsY + 8);
    doc.text(`${currency}${amounts.subtotal.toFixed(2)}`, boxX + 66, totalsY + 8, { align: 'right' });

    doc.text(settings.label || 'Tax', boxX + 4, totalsY + 16);
    doc.text(`${currency}${amounts.tax.toFixed(2)}`, boxX + 66, totalsY + 16, { align: 'right' });

    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('Total', boxX + 4, totalsY + 29);
    doc.text(`${currency}${amounts.total.toFixed(2)}`, boxX + 66, totalsY + 29, { align: 'right' });

    if (settings.bank && type === 'invoice') {
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text('Payment Information', 20, totalsY + 12);
        const bankLines = doc.splitTextToSize(settings.bank, pageWidth - 120);
        doc.text(bankLines, 20, totalsY + 18);
    }

    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text('Thank you for your business.', pageWidth / 2, 286, { align: 'center' });

    const filename = `${type}-${(customer.customerName || 'customer').replace(/\s+/g, '-')}-${Date.now()}.pdf`;
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
    doc.setFontSize(18);
    doc.setTextColor(139, 92, 246);
    doc.text(template.title, pageWidth / 2, 20, { align: 'center' });

    // Content
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(template.content.trim(), pageWidth - 40);
    doc.text(lines, 20, 35);

    doc.save(`contract-${customer.customerName.replace(/\s+/g, '-')}.pdf`);
}

window.generateInvoicePDF = generateInvoicePDF;
window.generateQuotePDF = generateQuotePDF;
window.generateContract = generateContract;
