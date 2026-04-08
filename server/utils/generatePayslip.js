const PDFDocument = require('pdfkit');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Safely extract name from a populated ref or plain string/ObjectId
const getName = (val) => {
  if (!val) return '';
  if (typeof val === 'object' && val.name) return val.name;
  if (typeof val === 'string') return val;
  return '';
};

/**
 * @param {object} payroll  - populated payroll document
 * @param {boolean} bw      - true = black & white, false = colour (default)
 */
const generatePayslipPDF = (payroll, bw = false) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const buffers = [];
    doc.on('data', c => buffers.push(c));
    doc.on('end',  () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const emp = payroll.user;
    const M   = 42;   // left / right margin
    const PW  = 595;  // page width
    const CW  = PW - M * 2;  // content width  (511)

    // ── Palette ────────────────────────────────────────────────
    const C = {
      headerBg:   bw ? '#111111' : '#1e3a8a',
      headerSub:  bw ? '#aaaaaa' : '#93c5fd',
      sectionLbl: bw ? '#000000' : '#1e3a8a',
      earnLbl:    bw ? '#000000' : '#166534',
      dedLbl:     bw ? '#000000' : '#9b1c1c',
      netBg:      bw ? '#f0f0f0' : '#eff6ff',
      netBorder:  bw ? '#333333' : '#2563eb',
      netAmt:     bw ? '#000000' : '#166534',
      statusPaid: bw ? '#000000' : '#166534',
      statusPend: bw ? '#555555' : '#92400e',
      divider:    '#d1d5db',
      text:       '#111111',
      muted:      '#555555',
      rowAlt:     '#f9fafb',
    };

    const fmt  = n => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;
    const LH   = 17; // line height
    let   y    = 0;

    // ── HEADER ─────────────────────────────────────────────────
    doc.fillColor(C.headerBg).rect(0, y, PW, 58).fill();
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#ffffff')
       .text('HRMS  PAYSLIP', M, y + 14);
    doc.fontSize(10).font('Helvetica').fillColor(C.headerSub)
       .text(`${MONTHS[payroll.month - 1]} ${payroll.year}`, M, y + 16, { width: CW, align: 'right' });
    doc.fontSize(7.5).fillColor(C.headerSub)
       .text(`Ref: ${emp.employeeId}   |   Generated: ${new Date().toLocaleDateString('en-IN')}`,
             M, y + 33, { width: CW, align: 'right' });
    y = 58;

    // ── EMPLOYEE INFORMATION ────────────────────────────────────
    y += 14;
    doc.fontSize(7).font('Helvetica-Bold').fillColor(C.sectionLbl)
       .text('EMPLOYEE INFORMATION', M, y);
    y += 9;
    doc.lineWidth(0.8).strokeColor(C.sectionLbl).moveTo(M, y).lineTo(M + CW, y).stroke();
    y += 9;

    const empRows = [
      ['Employee ID',  emp.employeeId,                        'Department',   getName(emp.department) || 'N/A'],
      ['Name',         emp.name,                              'Designation',  getName(emp.designation) || 'N/A'],
      ['Email',        emp.email,                             'Joining Date', emp.joiningDate
                                                                              ? new Date(emp.joiningDate).toLocaleDateString('en-IN')
                                                                              : 'N/A'],
    ];
    const lw = 78; // label column width
    const c1 = M, c1v = M + lw;
    const c2 = M + 268, c2v = M + 268 + lw;
    const valW = 168;

    for (const [l1, v1, l2, v2] of empRows) {
      doc.fontSize(8).font('Helvetica').fillColor(C.muted).text(l1 + ':', c1, y, { width: lw, lineBreak: false });
      doc.font('Helvetica-Bold').fillColor(C.text).text(v1, c1v, y, { width: valW, lineBreak: false });
      doc.font('Helvetica').fillColor(C.muted).text(l2 + ':', c2, y, { width: lw, lineBreak: false });
      doc.font('Helvetica-Bold').fillColor(C.text).text(v2, c2v, y, { width: valW, lineBreak: false });
      y += LH;
    }

    y += 10;
    doc.lineWidth(0.5).strokeColor(C.divider).moveTo(M, y).lineTo(M + CW, y).stroke();
    y += 13;

    // ── EARNINGS  /  DEDUCTIONS  (two-column table) ─────────────
    const halfW = (CW - 8) / 2;  // ~251 each
    const eX = M,          eAmtX = M + halfW - 88;
    const dX = M + halfW + 8,  dAmtX = dX + halfW - 88;

    // Column headers
    doc.fontSize(8).font('Helvetica-Bold').fillColor(C.earnLbl)
       .text('EARNINGS', eX, y);
    doc.fillColor(C.dedLbl)
       .text('DEDUCTIONS', dX, y);
    y += 7;
    doc.lineWidth(1).strokeColor(C.earnLbl).moveTo(eX, y).lineTo(eX + halfW, y).stroke();
    doc.strokeColor(C.dedLbl).moveTo(dX, y).lineTo(dX + halfW, y).stroke();
    y += 8;

    // Helper to draw one row on left or right
    const drawRow = (label, amount, labelX, amtX, amtColor, rowY, alt) => {
      if (alt) {
        doc.fillColor(C.rowAlt).rect(labelX === eX ? M : dX, rowY - 2, halfW, LH + 1).fill();
      }
      doc.fontSize(8).font('Helvetica').fillColor(C.muted)
         .text(label, labelX, rowY, { width: halfW - 92, lineBreak: false });
      doc.font('Helvetica-Bold').fillColor(amtColor)
         .text(amount, amtX, rowY, { width: 88, align: 'right', lineBreak: false });
    };

    // Build rows
    const baseSalary = Number(payroll.baseSalary) || 0;
    const grossEarnings = baseSalary + (payroll.totalBonuses || 0);
    const earnRows = [['Base Salary', baseSalary]];
    if ((payroll.bonuses?.performance || 0) > 0) earnRows.push(['Performance Bonus', payroll.bonuses.performance]);
    if ((payroll.bonuses?.festival    || 0) > 0) earnRows.push(['Festival Bonus',    payroll.bonuses.festival]);
    if ((payroll.bonuses?.other       || 0) > 0) earnRows.push(['Other Bonus',       payroll.bonuses.other]);

    const dedRows = [
      ['Tax Deduction',   payroll.deductions?.tax   || 0],
      ['Leave Deduction', payroll.deductions?.leave || 0],
      ['Other Deductions',payroll.deductions?.other || 0],
    ];

    const maxRows = Math.max(earnRows.length, dedRows.length);
    for (let i = 0; i < maxRows; i++) {
      const alt = i % 2 === 1;
      if (earnRows[i]) drawRow(earnRows[i][0], fmt(earnRows[i][1]), eX, eAmtX, C.earnLbl, y, alt);
      if (dedRows[i])  drawRow(dedRows[i][0],  fmt(dedRows[i][1]),  dX, dAmtX, C.dedLbl,  y, alt);
      y += LH;
    }

    // Subtotal rows
    y += 5;
    doc.lineWidth(0.5).strokeColor(C.divider).moveTo(eX, y).lineTo(eX + halfW, y).stroke();
    doc.strokeColor(C.divider).moveTo(dX, y).lineTo(dX + halfW, y).stroke();
    y += 6;

    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.text).text('Gross Earnings', eX, y, { lineBreak: false });
    doc.fillColor(C.earnLbl).text(fmt(grossEarnings), eAmtX, y, { width: 88, align: 'right', lineBreak: false });
    doc.fillColor(C.text).text('Total Deductions', dX, y, { lineBreak: false });
    doc.fillColor(C.dedLbl).text(fmt(payroll.totalDeductions), dAmtX, y, { width: 88, align: 'right', lineBreak: false });
    y += 16;

    // ── NET SALARY BOX ─────────────────────────────────────────
    doc.lineWidth(1).strokeColor(C.netBorder).moveTo(M, y).lineTo(M + CW, y).stroke();
    y += 2;
    const netH = 46;
    doc.fillColor(C.netBg).rect(M, y, CW, netH).fill();
    doc.lineWidth(1).strokeColor(C.netBorder).rect(M, y, CW, netH).stroke();

    doc.fontSize(13).font('Helvetica-Bold').fillColor(C.sectionLbl)
       .text('NET SALARY', M + 14, y + 13);
    doc.fontSize(22).font('Helvetica-Bold').fillColor(C.netAmt)
       .text(fmt(payroll.netSalary), M + 14, y + 9, { width: CW - 28, align: 'right' });
    y += netH + 14;

    // ── PAYMENT INFORMATION ────────────────────────────────────
    doc.lineWidth(0.5).strokeColor(C.divider).moveTo(M, y).lineTo(M + CW, y).stroke();
    y += 10;

    doc.fontSize(7).font('Helvetica-Bold').fillColor(C.sectionLbl)
       .text('PAYMENT INFORMATION', M, y);
    y += 10;

    const paymentStatus = payroll.paymentStatus || 'unknown';
    const statusColor = paymentStatus === 'paid' ? C.statusPaid : C.statusPend;
    const statusLabel = paymentStatus && paymentStatus.length > 0 
      ? paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)
      : 'Unknown';
    

    doc.fontSize(9.5).font('Helvetica-Bold').fillColor(statusColor)
       .text(`Status: ${statusLabel}`, M, y);
    if (payroll.paymentDate) {
      doc.fontSize(9).font('Helvetica').fillColor(C.text)
         .text(`Payment Date: ${new Date(payroll.paymentDate).toLocaleDateString('en-IN')}`,
               M + 170, y, { lineBreak: false });
    }
    y += 28;

    // ── FOOTER ─────────────────────────────────────────────────
    doc.lineWidth(0.5).strokeColor(C.divider).moveTo(M, y).lineTo(M + CW, y).stroke();
    y += 10;
    doc.fontSize(7.5).font('Helvetica').fillColor('#888888')
       .text('This is a system-generated payslip. For queries, contact your HR department.',
             M, y, { width: CW, align: 'center' });
    doc.fontSize(6.5).fillColor('#aaaaaa')
       .text(`Confidential — For Official Use Only  |  ${bw ? 'Black & White copy' : 'Colour copy'}`,
             M, y + 14, { width: CW, align: 'center' });

    doc.end();
  });
};

module.exports = { generatePayslipPDF };
