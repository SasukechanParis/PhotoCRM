// Invoice & Quote PDF Generator

function generateInvoicePDF(customer, type = 'invoice') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const settings = getTaxSettings();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(24);
    doc.setTextColor(139, 92, 246); // Purple
    doc.text(type === 'invoice' ? 'INVOICE' : 'QUOTE', 20, 25);

    // Company info (right side)
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const rightX = pageWidth - 20;

    if (settings.companyName) {
        doc.text(settings.companyName, rightX, 25, { align: 'right' });
    }
    if (settings.address) {
        const addressLines = doc.splitTextToSize(settings.address, 70);
        doc.text(addressLines, rightX, 30, { align: 'right' });
    }
    if (settings.email) {
        doc.text(settings.email, rightX, 45, { align: 'right' });
    }
    if (settings.phone) {
        doc.text(settings.phone, rightX, 50, { align: 'right' });
    }

    // Invoice details
    doc.setFontSize(10);
    doc.text(`${type === 'invoice' ? 'Invoice' : 'Quote'} #: ${customer.id}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);

    if (type === 'quote') {
        const validDate = new Date();
        validDate.setDate(validDate.getDate() + 30);
        doc.text(`Valid Until: ${validDate.toLocaleDateString()}`, 20, 50);
    }

    // Bill To
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Bill To:', 20, 65);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(customer.customerName, 20, 70);
    doc.text(customer.contact, 20, 75);

    // Line
    doc.setLineWidth(0.5);
    doc.setDrawColor(139, 92, 246);
    doc.line(20, 85, pageWidth - 20, 85);

    // Table header
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Description', 20, 95);
    doc.text('Amount', rightX - 20, 95, { align: 'right' });

    // Line under header
    doc.setLineWidth(0.3);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 98, pageWidth - 20, 98);

    // Items
    doc.setFont(undefined, 'normal');
    let yPos = 108;

    doc.text(`${customer.plan} Photography Session`, 20, yPos);
    const revenue = parseFloat(customer.revenue) || 0;
    doc.text(`$${revenue.toFixed(2)}`, rightX - 20, yPos, { align: 'right' });

    if (customer.shootingDate) {
        yPos += 5;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Date: ${customer.shootingDate}`, 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
    }

    if (customer.location) {
        yPos += 5;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Location: ${customer.location}`, 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
    }

    // Calculate totals
    const amounts = calculateTax(revenue);

    // Totals section
    yPos = 150;
    doc.line(rightX - 60, yPos, rightX - 20, yPos);

    yPos += 10;
    doc.text('Subtotal:', rightX - 60, yPos);
    doc.text(`$${amounts.subtotal.toFixed(2)}`, rightX - 20, yPos, { align: 'right' });

    if (settings.enabled) {
        yPos += 7;
        doc.text(`${settings.label} (${settings.rate}%):`, rightX - 60, yPos);
        doc.text(`$${amounts.tax.toFixed(2)}`, rightX - 20, yPos, { align: 'right' });
    }

    yPos += 7;
    doc.setLineWidth(0.5);
    doc.line(rightX - 60, yPos, rightX - 20, yPos);

    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Total:', rightX - 60, yPos);
    doc.text(`$${amounts.total.toFixed(2)}`, rightX - 20, yPos, { align: 'right' });

    // Payment info
    if (settings.bank && type === 'invoice') {
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        yPos += 20;
        doc.text('Payment Information:', 20, yPos);
        yPos += 5;
        const bankLines = doc.splitTextToSize(settings.bank, pageWidth - 40);
        doc.text(bankLines, 20, yPos);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', pageWidth / 2, 280, { align: 'center' });

    // Save
    const filename = `${type}-${customer.customerName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    doc.save(filename);
}

function generateQuotePDF(customer) {
    generateInvoicePDF(customer, 'quote');
}

function generateContract(customer, templateType = 'wedding') {
    const { jsPDF } = window.jspdf;
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
Total Fee: $${customer.revenue}
Deposit: $[Amount] (due by [Date])
Balance: $[Amount] (due by [Date])

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
Session Fee: $${customer.revenue}

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
Total Project Fee: $${customer.revenue}
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
