import PDFDocument from 'pdfkit';

export interface InvoicePdfData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  status: string;
  customer: {
    name: string;
    company?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    taxId?: string | null;
  };
  subscriptionNumber?: string;
  lines: Array<{
    productNameSnapshot: string;
    variantNameSnapshot?: string | null;
    quantity: number;
    unitPriceSnapshot: string | number;
    discountAmount: string | number;
    taxRate: string | number;
    taxAmount: string | number;
    lineTotal: string | number;
  }>;
  subtotal: string | number;
  discountAmount: string | number;
  taxAmount: string | number;
  grandTotal: string | number;
  amountPaid: string | number;
  outstandingBalance: string | number;
}

export function generateInvoicePdfBuffer(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header Banner
      doc.rect(0, 0, 595, 80).fill('#1e3a8a');
      doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('BRIGHTLOOP SOFTWARE', 40, 25);
      doc.fontSize(10).font('Helvetica').text('Subscription Management System', 40, 50);
      doc.fontSize(16).font('Helvetica-Bold').text('INVOICE', 460, 30, { align: 'right' });

      doc.fillColor('#333333');

      // Invoice & Customer Info
      const startY = 100;
      doc.fontSize(10).font('Helvetica-Bold').text('Billed To:', 40, startY);
      doc.font('Helvetica').text(data.customer.name, 40, startY + 15);
      if (data.customer.company) doc.text(data.customer.company, 40, startY + 28);
      if (data.customer.address) doc.text(data.customer.address, 40, startY + 41);
      if (data.customer.city) doc.text(`${data.customer.city}, ${data.customer.state || ''} ${data.customer.country || ''}`, 40, startY + 54);
      if (data.customer.taxId) doc.text(`GST/Tax ID: ${data.customer.taxId}`, 40, startY + 67);

      // Meta Box
      const metaX = 350;
      doc.fontSize(10).font('Helvetica-Bold').text('Invoice #:', metaX, startY);
      doc.font('Helvetica').text(data.invoiceNumber, metaX + 80, startY);

      doc.font('Helvetica-Bold').text('Invoice Date:', metaX, startY + 15);
      doc.font('Helvetica').text(data.invoiceDate, metaX + 80, startY + 15);

      doc.font('Helvetica-Bold').text('Due Date:', metaX, startY + 30);
      doc.font('Helvetica').text(data.dueDate, metaX + 80, startY + 30);

      doc.font('Helvetica-Bold').text('Status:', metaX, startY + 45);
      doc.font('Helvetica-Bold').fillColor(data.status === 'PAID' ? '#16a34a' : data.status === 'OVERDUE' ? '#dc2626' : '#2563eb')
        .text(data.status, metaX + 80, startY + 45);

      doc.fillColor('#333333');
      if (data.subscriptionNumber) {
        doc.font('Helvetica-Bold').text('Subscription:', metaX, startY + 60);
        doc.font('Helvetica').text(data.subscriptionNumber, metaX + 80, startY + 60);
      }

      // Items Table Header
      const tableY = startY + 95;
      doc.rect(40, tableY, 515, 22).fill('#f1f5f9');
      doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold');
      doc.text('Item Description', 50, tableY + 6);
      doc.text('Qty', 260, tableY + 6, { width: 30, align: 'center' });
      doc.text('Unit Price', 300, tableY + 6, { width: 60, align: 'right' });
      doc.text('Discount', 370, tableY + 6, { width: 50, align: 'right' });
      doc.text('Tax', 430, tableY + 6, { width: 45, align: 'right' });
      doc.text('Total', 485, tableY + 6, { width: 60, align: 'right' });

      // Items Table Rows
      let currentY = tableY + 25;
      doc.font('Helvetica').fontSize(9).fillColor('#334155');

      data.lines.forEach((line) => {
        const itemTitle = line.variantNameSnapshot
          ? `${line.productNameSnapshot} (${line.variantNameSnapshot})`
          : line.productNameSnapshot;

        doc.text(itemTitle, 50, currentY, { width: 200 });
        doc.text(line.quantity.toString(), 260, currentY, { width: 30, align: 'center' });
        doc.text(`₹${Number(line.unitPriceSnapshot).toFixed(2)}`, 300, currentY, { width: 60, align: 'right' });
        doc.text(`₹${Number(line.discountAmount).toFixed(2)}`, 370, currentY, { width: 50, align: 'right' });
        doc.text(`₹${Number(line.taxAmount).toFixed(2)}`, 430, currentY, { width: 45, align: 'right' });
        doc.text(`₹${Number(line.lineTotal).toFixed(2)}`, 485, currentY, { width: 60, align: 'right' });

        currentY += 20;
        doc.moveTo(40, currentY - 4).lineTo(555, currentY - 4).strokeColor('#e2e8f0').stroke();
      });

      // Totals Box
      currentY += 10;
      const totalX = 350;
      doc.fontSize(9).font('Helvetica');

      doc.text('Subtotal:', totalX, currentY);
      doc.text(`₹${Number(data.subtotal).toFixed(2)}`, 485, currentY, { width: 60, align: 'right' });
      currentY += 16;

      doc.text('Discount:', totalX, currentY);
      doc.text(`- ₹${Number(data.discountAmount).toFixed(2)}`, 485, currentY, { width: 60, align: 'right' });
      currentY += 16;

      doc.text('Tax Amount:', totalX, currentY);
      doc.text(`+ ₹${Number(data.taxAmount).toFixed(2)}`, 485, currentY, { width: 60, align: 'right' });
      currentY += 16;

      doc.rect(totalX - 10, currentY - 2, 215, 24).fill('#f8fafc');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10);
      doc.text('Grand Total:', totalX, currentY + 4);
      doc.text(`₹${Number(data.grandTotal).toFixed(2)}`, 485, currentY + 4, { width: 60, align: 'right' });
      currentY += 30;

      doc.fillColor('#16a34a').font('Helvetica').fontSize(9);
      doc.text('Amount Paid:', totalX, currentY);
      doc.text(`₹${Number(data.amountPaid).toFixed(2)}`, 485, currentY, { width: 60, align: 'right' });
      currentY += 16;

      doc.fillColor('#dc2626').font('Helvetica-Bold');
      doc.text('Outstanding Balance:', totalX, currentY);
      doc.text(`₹${Number(data.outstandingBalance).toFixed(2)}`, 485, currentY, { width: 60, align: 'right' });

      // Footer
      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
        .text('Thank you for choosing Brightloop Software! For support, contact support@brightloop.com', 40, 780, { align: 'center', width: 515 });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

