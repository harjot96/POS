const PDFDocument = require('pdfkit');
const streamBuffers = require('stream-buffers');

/**
 * Creates a single line with:
 *  leftText + (dots) + rightText
 * fitting within maxWidth, using the doc's current font metrics.
 */
function dottedLine(doc, leftText, rightText, maxWidth) {
  let line = leftText;
  let dots = '';

  // Keep adding dots until the total width of (left + dots + right) >= maxWidth
  while (doc.widthOfString(line + dots + rightText) < maxWidth) {
    dots += '.';
  }
  return line + dots + rightText;
}

/**
 * Generates a professional receipt-style PDF.
 * @param {Object} bill - Bill/sale data.
 * @returns {Promise<Buffer>} - Resolves with the PDF file buffer.
 */
function generateProfessionalReceipt(bill) {
  return new Promise((resolve, reject) => {
    // Typical thermal receipt: ~2-3 inches wide.
    // We'll use 220 points wide (~3 inches). Height is arbitrary; doc grows as needed.
    const doc = new PDFDocument({
      size: [220, 600],
      margins: { top: 10, bottom: 10, left: 10, right: 10 },
    });

    const stream = new streamBuffers.WritableStreamBuffer();
    doc.pipe(stream);

    // Use a monospaced font (Courier) for consistent spacing
    doc.font('Courier');

    // -- HEADER: Store Info --
    doc.fontSize(12)
       .text(bill.store_name || 'MY RETAIL STORE', { align: 'center' })
       .moveDown(0.2);

    doc.fontSize(8)
       .text(bill.store_address || '123 Main Street, City, State 00000', { align: 'center' })
       .text(bill.store_contact || 'Phone: (000) 123-4567', { align: 'center' })
       .moveDown(0.5);

    // Optional: If you have a logo image, uncomment and adjust:
    // doc.image('path/to/logo.png', {
    //   fit: [60, 60],
    //   align: 'center'
    // });
    // doc.moveDown(0.5);

    // -- Thin dotted separator --
    doc.dash(1, { space: 1 })
       .moveTo(doc.x, doc.y)
       .lineTo(doc.page.width - doc.options.margins.right, doc.y)
       .stroke()
       .undash()
       .moveDown(0.5);

    // -- RECEIPT TITLE --
    doc.fontSize(11)
       .text('RECEIPT', { align: 'center' })
       .moveDown(0.5);

    // -- Receipt Info (ID, Transaction, Payment) --
    doc.fontSize(8)
       .text(`Receipt #: ${bill._id || '123456'}`)
       .text(`Transaction ID: ${bill.transaction_id || 'N/A'}`)
       .text(`Payment Method: ${bill.payment_method || 'Cash'}`)
       .moveDown(0.5);

    // -- Date/Time/Cashier --
    doc.text(`Date: ${bill.date || new Date().toLocaleDateString()}`)
       .text(`Time: ${bill.time || new Date().toLocaleTimeString()}`)
       .text(`Cashier: ${bill.cashier || 'John Smith'}`)
       .moveDown(0.5);

    // -- Another dotted separator --
    doc.dash(1, { space: 1 })
       .moveTo(doc.x, doc.y)
       .lineTo(doc.page.width - doc.options.margins.right, doc.y)
       .stroke()
       .undash()
       .moveDown(0.5);

    // -- ITEMS LIST --
    const maxTextWidth = doc.page.width - doc.options.margins.left - doc.options.margins.right;
    if (bill.items && bill.items.length > 0) {
      doc.fontSize(8);
      bill.items.forEach((item) => {
        const name = item.product_name || 'Item';
        const priceStr = `$${(item.price || 0).toFixed(2)}`;
        const line = dottedLine(doc, name, priceStr, maxTextWidth);
        doc.text(line);
      });
    } else {
      doc.fontSize(8).text('No items found.');
    }

    // -- Totals Separator --
    doc.moveDown(0.5);
    doc.dash(1, { space: 1 })
       .moveTo(doc.x, doc.y)
       .lineTo(doc.page.width - doc.options.margins.right, doc.y)
       .stroke()
       .undash()
       .moveDown(0.5);

    // -- Subtotal, Discount, Tax, Final Amount --
    doc.fontSize(8)
       .text(`Subtotal: $${(bill.total_amount || 0).toFixed(2)}`, { align: 'right' })
       .text(`Discount: $${(bill.discount || 0).toFixed(2)}`, { align: 'right' })
       .text(`Tax: $${(bill.taxAmount || 0).toFixed(2)}`, { align: 'right' })
       .moveDown(0.2);

    doc.fontSize(9)
       .text(`Total: $${(bill.final_amount || 0).toFixed(2)}`, { align: 'right' })
       .moveDown(0.5);

    // -- Footer Separator --
    doc.dash(1, { space: 1 })
       .moveTo(doc.x, doc.y)
       .lineTo(doc.page.width - doc.options.margins.right, doc.y)
       .stroke()
       .undash()
       .moveDown(0.5);

    // -- THANK YOU & DISCLAIMER --
    doc.fontSize(8)
       .text('Thank you for shopping with us!', { align: 'center' })
       .moveDown(0.2);

    doc.text('Please come again.', { align: 'center' })
       .moveDown(0.5);

    // Disclaimers or extra note
    doc.fontSize(6)
       .text(
         bill.footer_note ||
         'No returns without receipt. All sales final unless stated otherwise.',
         { align: 'center' }
       );

    // End the document
    doc.end();

    // Handle buffer
    stream.on('finish', () => {
      const buffer = stream.getContents();
      if (buffer) {
        resolve(buffer);
      } else {
        reject(new Error('No contents generated in PDF'));
      }
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = { generateProfessionalReceipt };
