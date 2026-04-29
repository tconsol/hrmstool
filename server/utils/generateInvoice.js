const PDFDocument = require('pdfkit');

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusColors = {
  draft:     '#64748b',
  sent:      '#2563eb',
  paid:      '#16a34a',
  overdue:   '#dc2626',
  cancelled: '#9ca3af',
};

/**
 * Generate a GST-compliant A4 invoice PDF.
 * @param {object} invoice    - populated Invoice document
 * @param {object} org        - Organization document (has name, logo, gstNumber, address, email, phone)
 * @returns {Promise<Buffer>}
 */
const generateInvoicePDF = (invoice, org) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: {
      Title: `Invoice ${invoice.invoiceNumber}`,
      Author: org.name,
    }});
    const buffers = [];
    doc.on('data', c => buffers.push(c));
    doc.on('end',  () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const PW  = 595;
    const PH  = 842;
    const M   = 44;
    const CW  = PW - M * 2;   // 507
    let   y   = 0;

    const brandBlue  = '#1e40af';
    const brandLight = '#eff6ff';
    const borderGray = '#e2e8f0';
    const textDark   = '#0f172a';
    const textMuted  = '#64748b';
    const white      = '#ffffff';

    // ── WATERMARK (very faint org name across page) ──────────────────
    doc.save();
    doc.rotate(-40, { origin: [PW / 2, PH / 2] });
    doc.fontSize(68).font('Helvetica-Bold').fillColor('#e2e8f0').fillOpacity(0.25);
    const wmText = org.name ? org.name.toUpperCase() : 'INVOICE';
    doc.text(wmText, 0, PH / 2 - 60, { width: PW + 200, align: 'center', lineBreak: false });
    doc.fillOpacity(1);
    doc.restore();

    // ── HEADER BAR ────────────────────────────────────────────────────
    doc.fillColor(brandBlue).rect(0, 0, PW, 72).fill();

    // Logo (if available) — top-left
    let logoRendered = false;
    if (org.logo && org.logo.startsWith('data:image')) {
      try {
        const base64Data = org.logo.split(',')[1];
        const imgBuffer  = Buffer.from(base64Data, 'base64');
        doc.image(imgBuffer, M, 12, { height: 48, fit: [120, 48] });
        logoRendered = true;
      } catch (_) { /* skip bad logo */ }
    }
    if (!logoRendered) {
      doc.fontSize(20).font('Helvetica-Bold').fillColor(white).text(
        org.name || 'Company', M, 22, { width: 200, lineBreak: false }
      );
    }

    // "INVOICE" label — top-right
    const invoiceLabel = invoice.type === 'incoming' ? 'PURCHASE INVOICE' : 'TAX INVOICE';
    doc.fontSize(18).font('Helvetica-Bold').fillColor(white)
       .text(invoiceLabel, M, 16, { width: CW, align: 'right' });
    doc.fontSize(9).font('Helvetica').fillColor('#bfdbfe')
       .text(`# ${invoice.invoiceNumber}`, M, 40, { width: CW, align: 'right' });

    y = 72;

    // ── STATUS BADGE ─────────────────────────────────────────────────
    const statusColor = statusColors[invoice.status] || '#64748b';
    doc.roundedRect(PW - M - 70, y + 8, 70, 18, 5).fill(statusColor);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(white)
       .text((invoice.status || 'DRAFT').toUpperCase(), PW - M - 70, y + 13, { width: 70, align: 'center' });

    y += 14;

    // ── FROM / TO section ─────────────────────────────────────────────
    const halfCW = (CW - 16) / 2;  // ~245 each
    const fromX  = M;
    const toX    = M + halfCW + 16;

    // "From" label
    doc.fontSize(7).font('Helvetica-Bold').fillColor(textMuted).text('FROM', fromX, y);
    // "To" label
    const toLabel = invoice.type === 'incoming' ? 'VENDOR' : 'BILL TO';
    doc.text(toLabel, toX, y);
    y += 11;

    // FROM — our org details
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor(textDark).text(org.name || '', fromX, y, { width: halfCW });
    const fromLines = [
      org.address,
      org.email,
      org.phone,
      org.gstNumber ? `GSTIN: ${org.gstNumber}` : '',
    ].filter(Boolean);
    y += 14;
    doc.fontSize(8).font('Helvetica').fillColor(textMuted);
    for (const line of fromLines) {
      doc.text(line, fromX, y, { width: halfCW });
      y += 12;
    }

    // TO — party details (rendered at same row start as FROM)
    let toY = y - (fromLines.length * 12) - 14;  // reset to where FROM name started
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor(textDark).text(invoice.party.name || '', toX, toY, { width: halfCW });
    const toLines = [
      invoice.party.address,
      invoice.party.email,
      invoice.party.phone,
      invoice.party.gstin ? `GSTIN: ${invoice.party.gstin}` : '',
      invoice.party.state ? `State: ${invoice.party.state}` : '',
    ].filter(Boolean);
    toY += 14;
    doc.fontSize(8).font('Helvetica').fillColor(textMuted);
    for (const line of toLines) {
      doc.text(line, toX, toY, { width: halfCW });
      toY += 12;
    }

    // Advance y past whichever column is taller
    y = Math.max(y, toY) + 8;

    // ── DATES BAR ────────────────────────────────────────────────────
    doc.fillColor(brandLight).rect(M, y, CW, 26).fill();
    doc.lineWidth(0.5).strokeColor(borderGray).rect(M, y, CW, 26).stroke();

    const invDate = invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN') : '—';
    const dueDate = invoice.dueDate     ? new Date(invoice.dueDate).toLocaleDateString('en-IN')     : 'On receipt';

    doc.fontSize(7.5).font('Helvetica').fillColor(textMuted)
       .text('Invoice Date:', M + 8, y + 9, { lineBreak: false })
       .font('Helvetica-Bold').fillColor(textDark)
       .text(invDate, M + 65, y + 9, { lineBreak: false });

    doc.font('Helvetica').fillColor(textMuted)
       .text('Due Date:', M + 185, y + 9, { lineBreak: false })
       .font('Helvetica-Bold').fillColor(textDark)
       .text(dueDate, M + 235, y + 9, { lineBreak: false });

    if (invoice.paymentTerms) {
      doc.font('Helvetica').fillColor(textMuted)
         .text('Terms:', M + 330, y + 9, { lineBreak: false })
         .font('Helvetica-Bold').fillColor(textDark)
         .text(invoice.paymentTerms, M + 360, y + 9, { lineBreak: false, width: 140 });
    }
    y += 34;

    // ── LINE ITEMS TABLE ─────────────────────────────────────────────
    // Column widths: desc, hsn, qty, rate, gst%, amount
    const cols = {
      desc:    { x: M,           w: 180 },
      hsn:     { x: M + 180,     w: 58  },
      qty:     { x: M + 238,     w: 42  },
      rate:    { x: M + 280,     w: 72  },
      gst:     { x: M + 352,     w: 48  },
      amount:  { x: M + 400,     w: CW - 400 }, // ~107
    };

    // Table header
    doc.fillColor(brandBlue).rect(M, y, CW, 20).fill();
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(white);
    doc.text('#',           M + 4,            y + 7, { width: 14, align: 'left'  });
    doc.text('Description', cols.desc.x + 18, y + 7, { width: cols.desc.w - 18  });
    doc.text('HSN/SAC',     cols.hsn.x,        y + 7, { width: cols.hsn.w, align: 'center' });
    doc.text('Qty',         cols.qty.x,        y + 7, { width: cols.qty.w, align: 'center' });
    doc.text('Unit Price',  cols.rate.x,       y + 7, { width: cols.rate.w, align: 'right' });
    doc.text('GST%',        cols.gst.x,        y + 7, { width: cols.gst.w, align: 'center' });
    doc.text('Amount',      cols.amount.x,     y + 7, { width: cols.amount.w, align: 'right' });
    y += 20;

    // Table rows
    (invoice.lineItems || []).forEach((item, idx) => {
      const rowH = 22;
      if (idx % 2 === 0) {
        doc.fillColor('#f8fafc').rect(M, y, CW, rowH).fill();
      }
      doc.lineWidth(0.3).strokeColor(borderGray)
         .moveTo(M, y + rowH).lineTo(M + CW, y + rowH).stroke();

      doc.fontSize(8).font('Helvetica').fillColor(textDark);
      doc.text(String(idx + 1),          M + 4,            y + 7, { width: 14, lineBreak: false });
      doc.text(item.description || '',   cols.desc.x + 18, y + 7, { width: cols.desc.w - 18, lineBreak: false });
      doc.text(item.hsn || '—',          cols.hsn.x,        y + 7, { width: cols.hsn.w, align: 'center', lineBreak: false });
      doc.text(String(item.quantity),    cols.qty.x,        y + 7, { width: cols.qty.w, align: 'center', lineBreak: false });
      doc.text(fmt(item.unitPrice),      cols.rate.x,       y + 7, { width: cols.rate.w, align: 'right', lineBreak: false });
      doc.text(`${item.taxRate || 0}%`,  cols.gst.x,        y + 7, { width: cols.gst.w, align: 'center', lineBreak: false });
      doc.font('Helvetica-Bold')
         .text(fmt(item.amount),         cols.amount.x,     y + 7, { width: cols.amount.w, align: 'right', lineBreak: false });
      y += rowH;
    });

    // Table bottom border
    doc.lineWidth(1).strokeColor(brandBlue).moveTo(M, y).lineTo(M + CW, y).stroke();
    y += 14;

    // ── TOTALS SECTION ────────────────────────────────────────────────
    const totX  = M + 290;
    const totW  = CW - 290;
    const totLW = 130;
    const totVW = totW - totLW;

    const addTotal = (label, value, bold = false, highlight = false) => {
      if (highlight) {
        doc.fillColor(brandBlue).rect(totX, y - 2, totW, 22).fill();
        doc.fontSize(9.5).font('Helvetica-Bold').fillColor(white)
           .text(label, totX + 8, y + 4, { width: totLW, lineBreak: false })
           .text(value, totX + totLW, y + 4, { width: totVW - 8, align: 'right', lineBreak: false });
        y += 22;
      } else {
        doc.fontSize(8)
           .font(bold ? 'Helvetica-Bold' : 'Helvetica')
           .fillColor(bold ? textDark : textMuted)
           .text(label, totX + 8, y, { width: totLW, lineBreak: false })
           .font('Helvetica-Bold').fillColor(textDark)
           .text(value, totX + totLW, y, { width: totVW - 8, align: 'right', lineBreak: false });
        y += 16;
        doc.lineWidth(0.3).strokeColor(borderGray).moveTo(totX, y - 2).lineTo(totX + totW, y - 2).stroke();
      }
    };

    addTotal('Subtotal',      fmt(invoice.subtotal));
    addTotal('GST Amount',    fmt(invoice.taxAmount));
    if (invoice.discount > 0) {
      addTotal('Discount',    `- ${fmt(invoice.discount)}`);
    }
    y += 4;
    addTotal('TOTAL',         fmt(invoice.totalAmount), false, true);

    // ── NOTES ────────────────────────────────────────────────────────
    y += 16;
    if (invoice.notes) {
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(textMuted).text('NOTES:', M, y);
      y += 11;
      doc.fontSize(8).font('Helvetica').fillColor(textDark).text(invoice.notes, M, y, { width: CW });
      y += doc.heightOfString(invoice.notes, { width: CW }) + 10;
    }

    // ── FOOTER ───────────────────────────────────────────────────────
    const footerY = PH - 44;
    doc.lineWidth(0.5).strokeColor(borderGray).moveTo(M, footerY).lineTo(M + CW, footerY).stroke();
    doc.fontSize(7.5).font('Helvetica').fillColor(textMuted)
       .text(
         `${org.name || ''}  |  ${org.gstNumber ? 'GSTIN: ' + org.gstNumber + '  |  ' : ''}Generated: ${new Date().toLocaleDateString('en-IN')}`,
         M, footerY + 8, { width: CW, align: 'center' }
       );
    doc.text('This is a computer generated invoice.', M, footerY + 20, { width: CW, align: 'center' });

    doc.end();
  });
};

module.exports = { generateInvoicePDF };
