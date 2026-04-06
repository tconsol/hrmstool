const PDFDocument = require('pdfkit');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => {
  if (!d) return '_______________';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
};

/**
 * Generate a document PDF for any supported template type.
 * @param {object} document - populated document record with employee ref
 * @returns {Promise<Buffer>}
 */
const generateDocumentPDF = (document) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 60, bottom: 60, left: 60, right: 60 } });
    const buffers = [];
    doc.on('data', (c) => buffers.push(c));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const PW = 595;
    const PH = 842;
    const M = 60;
    const CW = PW - M * 2;

    // ── WATERMARK ──────────────────────────────────────────────
    if (document.companyLogo) {
      try {
        const logoData = document.companyLogo.replace(/^data:image\/\w+;base64,/, '');
        const logoBuffer = Buffer.from(logoData, 'base64');
        doc.save();
        doc.opacity(0.05);
        doc.image(logoBuffer, PW / 2 - 100, PH / 2 - 100, { width: 200, height: 200, fit: [200, 200] });
        doc.restore();
      } catch (e) { /* skip watermark */ }
    }

    // ── HEADER ─────────────────────────────────────────────────
    let y = M;
    let logoDrawn = false;
    const logoW = 120;
    const logoH = 48;

    if (document.companyLogo) {
      try {
        const logoData = document.companyLogo.replace(/^data:image\/\w+;base64,/, '');
        const logoBuffer = Buffer.from(logoData, 'base64');
        doc.image(logoBuffer, M, y, { height: logoH, fit: [logoW, logoH] });
        logoDrawn = true;
      } catch (e) { /* skip logo */ }
    }

    const textX = logoDrawn ? M + logoW + 12 : M;
    const textW = logoDrawn ? CW - logoW - 12 : CW;

    if (document.companyName) {
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a8a')
        .text(document.companyName, textX, y, { width: textW, align: logoDrawn ? 'left' : 'center' });
      y += 20;
    }
    if (document.companyAddress) {
      doc.fontSize(8).font('Helvetica').fillColor('#555555')
        .text(document.companyAddress, textX, y, { width: textW, align: logoDrawn ? 'left' : 'center' });
      y += 12;
    }
    y = Math.max(y, M + (logoDrawn ? logoH + 4 : 0));
    y += 8;
    doc.lineWidth(1.5).strokeColor('#1e3a8a').moveTo(M, y).lineTo(M + CW, y).stroke();
    y += 20;

    // ── TEMPLATE CONTENT ───────────────────────────────────────
    switch (document.type) {
      case 'offer_letter':
        y = renderOfferLetter(doc, document, y, M, CW);
        break;
      case 'appointment_letter':
        y = renderAppointmentLetter(doc, document, y, M, CW);
        break;
      case 'experience_letter':
        y = renderExperienceLetter(doc, document, y, M, CW);
        break;
      case 'relieving_letter':
        y = renderRelievingLetter(doc, document, y, M, CW);
        break;
      case 'increment_letter':
        y = renderIncrementLetter(doc, document, y, M, CW);
        break;
      case 'salary_structure':
        y = renderSalaryStructure(doc, document, y, M, CW);
        break;
    }

    // ── FOOTER ─────────────────────────────────────────────────
    const footerY = PH - 50;
    doc.lineWidth(0.5).strokeColor('#d1d5db').moveTo(M, footerY).lineTo(M + CW, footerY).stroke();
    doc.fontSize(7).font('Helvetica').fillColor('#999999')
      .text('This is a computer-generated document. No signature required unless specified.', M, footerY + 8, { width: CW, align: 'center' });

    doc.end();
  });
};

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function pageBreakCheck(doc, y, M) {
  if (y > 720) {
    doc.addPage();
    return 60;
  }
  return y;
}

function drawTable(doc, headers, rows, y, M, CW) {
  const colW = CW / headers.length;
  const rowH = 20;

  // Header
  doc.fillColor('#eef2ff').rect(M, y, CW, rowH).fill();
  doc.lineWidth(0.5).strokeColor('#c7d2fe').rect(M, y, CW, rowH).stroke();
  for (let i = 0; i < headers.length; i++) {
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e3a8a')
      .text(headers[i], M + i * colW + 6, y + 5, { width: colW - 12, lineBreak: false });
  }
  y += rowH;

  // Rows
  for (let r = 0; r < rows.length; r++) {
    const alt = r % 2 === 1;
    if (alt) {
      doc.fillColor('#f9fafb').rect(M, y, CW, rowH).fill();
    }
    doc.lineWidth(0.3).strokeColor('#e5e7eb').rect(M, y, CW, rowH).stroke();
    for (let i = 0; i < rows[r].length; i++) {
      doc.fontSize(8).font('Helvetica').fillColor('#333333')
        .text(String(rows[r][i]), M + i * colW + 6, y + 5, { width: colW - 12, lineBreak: false });
    }
    y += rowH;
    y = pageBreakCheck(doc, y, M);
  }
  return y;
}

function signatureBlock(doc, companyName, sigName, sigDesignation, y, M) {
  y += 20;
  doc.fontSize(9).font('Helvetica').fillColor('#333333')
    .text(`For ${companyName || '[Company Name]'},`, M, y);
  y += 35;
  doc.text('____________________________', M, y);
  y += 14;
  doc.font('Helvetica-Bold').text(sigName || 'Authorized Signatory', M, y);
  y += 12;
  doc.font('Helvetica').text(sigDesignation || 'Human Resources', M, y);
  return y + 10;
}

// ────────────────────────────────────────────────────────────────
// TEMPLATE RENDERERS
// ────────────────────────────────────────────────────────────────

function renderOfferLetter(doc, document, y, M, CW) {
  const { data = {}, companyName } = document;
  const emp = document.employee || {};
  const name = emp.name || data.employeeName || '[Employee Name]';

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e3a8a')
    .text('OFFER LETTER', M, y, { width: CW, align: 'center' });
  y += 30;

  doc.fontSize(9).font('Helvetica').fillColor('#333')
    .text(`Date: ${fmtDate(data.issueDate || new Date())}`, M, y);
  y += 14;
  doc.text(`Ref: OL/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`, M, y);
  y += 22;

  doc.font('Helvetica-Bold').text('To,', M, y); y += 14;
  doc.font('Helvetica').text(name, M, y); y += 12;
  if (emp.address || data.employeeAddress) {
    doc.text(emp.address || data.employeeAddress, M, y, { width: CW / 2 });
    y += 24;
  } else { y += 8; }

  doc.font('Helvetica-Bold').text('Subject: Offer of Employment', M, y); y += 20;
  doc.font('Helvetica');

  const body1 = `Dear ${name},\n\nWe are pleased to offer you the position of ${data.designation || emp.designation || '[Designation]'} in the ${data.department || emp.department || '[Department]'} department at ${companyName || '[Company Name]'}, effective from ${fmtDate(data.joiningDate || emp.joiningDate)}.`;
  doc.text(body1, M, y, { width: CW, lineGap: 3 });
  y += doc.heightOfString(body1, { width: CW, lineGap: 3 }) + 12;
  y = pageBreakCheck(doc, y, M);

  if (data.annualCTC) {
    doc.text(`Your annual compensation (CTC) will be Rs. ${Number(data.annualCTC).toLocaleString('en-IN')} (Cost to Company) per annum.`, M, y, { width: CW });
    y += 20;
  }

  // CTC Breakdown table
  if (data.ctcBreakdown) {
    const b = data.ctcBreakdown;
    const rows = [
      ['Basic Salary', fmt(b.basic), fmt(Math.round(b.basic / 12))],
      ['HRA', fmt(b.hra), fmt(Math.round(b.hra / 12))],
      ['Special Allowance', fmt(b.specialAllowance), fmt(Math.round(b.specialAllowance / 12))],
    ];
    if (b.conveyanceAllowance) rows.push(['Conveyance Allowance', fmt(b.conveyanceAllowance), fmt(Math.round(b.conveyanceAllowance / 12))]);
    if (b.medicalAllowance) rows.push(['Medical Allowance', fmt(b.medicalAllowance), fmt(Math.round(b.medicalAllowance / 12))]);
    if (b.lta) rows.push(['Leave Travel Allowance', fmt(b.lta), fmt(Math.round(b.lta / 12))]);
    rows.push(['Employer PF Contribution', fmt(b.epfEmployer), fmt(Math.round(b.epfEmployer / 12))]);
    rows.push(['Gratuity', fmt(b.gratuity), fmt(Math.round(b.gratuity / 12))]);
    if (b.insurance) rows.push(['Insurance Premium', fmt(b.insurance), fmt(Math.round(b.insurance / 12))]);
    if (b.variablePay) rows.push(['Variable Pay', fmt(b.variablePay), fmt(Math.round(b.variablePay / 12))]);
    rows.push(['Total CTC', fmt(data.annualCTC), fmt(Math.round(data.annualCTC / 12))]);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333')
      .text('Compensation Breakdown:', M, y); y += 14;
    y = drawTable(doc, ['Component', 'Annual (Rs.)', 'Monthly (Rs.)'], rows, y, M, CW);
    y += 10;
  }

  y = pageBreakCheck(doc, y, M);
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#333').text('Terms & Conditions:', M, y); y += 14;
  const terms = [
    `1. Probation Period: ${data.probationPeriod || '6'} months`,
    `2. Notice Period: ${data.noticePeriod || '1'} month(s)`,
    `3. Work Location: ${data.workLocation || '[Work Location]'}`,
    `4. Reporting To: ${data.reportingManager || '[Reporting Manager]'}`,
  ];
  doc.font('Helvetica');
  for (const t of terms) { doc.text(t, M + 10, y, { width: CW - 10 }); y += 14; }
  y += 10;

  doc.text('Please sign and return this letter as your acceptance of the above terms.', M, y, { width: CW }); y += 14;
  doc.text('We welcome you and look forward to a long and successful association.', M, y, { width: CW }); y += 10;

  y = signatureBlock(doc, companyName, data.hrName, data.hrDesignation, y, M);

  // Employee acceptance
  y += 30;
  y = pageBreakCheck(doc, y, M);
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#333').text('Employee Acceptance:', M, y); y += 20;
  doc.font('Helvetica').text('I accept the terms and conditions as stated above.', M, y); y += 30;
  doc.text('____________________________', M, y); y += 14;
  doc.text(`${name}`, M, y); y += 12;
  doc.text(`Date: _______________`, M, y);

  return y;
}

function renderAppointmentLetter(doc, document, y, M, CW) {
  const { data = {}, companyName } = document;
  const emp = document.employee || {};
  const name = emp.name || data.employeeName || '[Employee Name]';

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e3a8a')
    .text('APPOINTMENT LETTER', M, y, { width: CW, align: 'center' });
  y += 30;

  doc.fontSize(9).font('Helvetica').fillColor('#333')
    .text(`Date: ${fmtDate(data.issueDate || new Date())}`, M, y); y += 14;
  doc.text(`Ref: AL/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`, M, y); y += 22;

  doc.font('Helvetica-Bold').text('To,', M, y); y += 14;
  doc.font('Helvetica').text(name, M, y); y += 14;
  if (emp.address || data.employeeAddress) {
    doc.text(emp.address || data.employeeAddress, M, y, { width: CW / 2 }); y += 24;
  }

  doc.font('Helvetica-Bold').text('Subject: Letter of Appointment', M, y); y += 20;

  doc.font('Helvetica');
  const body = `Dear ${name},\n\nWith reference to your application and subsequent interview, we are pleased to appoint you as ${data.designation || emp.designation || '[Designation]'} in the ${data.department || emp.department || '[Department]'} department at ${companyName || '[Company Name]'}, with effect from ${fmtDate(data.joiningDate || emp.joiningDate)}.`;
  doc.text(body, M, y, { width: CW, lineGap: 3 });
  y += doc.heightOfString(body, { width: CW, lineGap: 3 }) + 16;
  y = pageBreakCheck(doc, y, M);

  doc.font('Helvetica-Bold').text('Terms of Appointment:', M, y); y += 16;
  doc.font('Helvetica');

  const clauses = [
    `1. Designation: ${data.designation || emp.designation || '[Designation]'}`,
    `2. Department: ${data.department || emp.department || '[Department]'}`,
    `3. Date of Joining: ${fmtDate(data.joiningDate || emp.joiningDate)}`,
    `4. Probation Period: ${data.probationPeriod || '6'} months from the date of joining.`,
    `5. Notice Period: ${data.noticePeriod || '1'} month(s) from either side.`,
    `6. Work Location: ${data.workLocation || '[Work Location]'}`,
    `7. Working Hours: ${data.workingHours || '9:00 AM to 6:00 PM, Monday to Friday'}`,
    `8. Compensation: Your annual CTC will be Rs. ${Number(data.annualCTC || emp.salary * 12 || 0).toLocaleString('en-IN')} per annum as per the salary structure discussed.`,
    `9. Confidentiality: You shall not disclose any confidential information of the company to any third party during or after your employment.`,
    `10. Code of Conduct: You are expected to adhere to the company's code of conduct and policies.`,
  ];

  for (const c of clauses) {
    doc.text(c, M + 10, y, { width: CW - 20, lineGap: 2 });
    y += doc.heightOfString(c, { width: CW - 20 }) + 6;
    y = pageBreakCheck(doc, y, M);
  }

  y += 10;
  doc.text('Kindly sign the duplicate copy of this letter as a token of your acceptance.', M, y, { width: CW }); y += 14;
  doc.text('We wish you a successful career with us.', M, y, { width: CW });

  y = signatureBlock(doc, companyName, data.hrName, data.hrDesignation, y, M);
  return y;
}

function renderExperienceLetter(doc, document, y, M, CW) {
  const { data = {}, companyName } = document;
  const emp = document.employee || {};
  const name = emp.name || data.employeeName || '[Employee Name]';

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e3a8a')
    .text('EXPERIENCE LETTER', M, y, { width: CW, align: 'center' });
  y += 30;

  doc.fontSize(9).font('Helvetica').fillColor('#333')
    .text(`Date: ${fmtDate(data.issueDate || new Date())}`, M, y); y += 14;
  doc.text(`Ref: EL/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`, M, y); y += 22;

  doc.font('Helvetica-Bold').text('TO WHOM IT MAY CONCERN', M, y, { width: CW, align: 'center' }); y += 24;

  doc.font('Helvetica');
  const joiningStr = fmtDate(data.joiningDate || emp.joiningDate);
  const leavingStr = fmtDate(data.lastWorkingDate);
  const designation = data.designation || emp.designation || '[Designation]';
  const department = data.department || emp.department || '[Department]';

  const body = `This is to certify that ${name} (Employee ID: ${emp.employeeId || '[ID]'}) was employed with ${companyName || '[Company Name]'} from ${joiningStr} to ${leavingStr} in the capacity of ${designation} in the ${department} department.`;
  doc.text(body, M, y, { width: CW, lineGap: 4 });
  y += doc.heightOfString(body, { width: CW, lineGap: 4 }) + 16;

  const body2 = `During the tenure with us, we found ${name} to be sincere, dedicated, and hardworking. ${data.performanceNote || 'Their conduct and performance have been satisfactory throughout their employment.'}`;
  doc.text(body2, M, y, { width: CW, lineGap: 4 });
  y += doc.heightOfString(body2, { width: CW, lineGap: 4 }) + 16;

  doc.text(`We wish ${name} all the best in future endeavors.`, M, y, { width: CW }); y += 14;
  doc.text('This certificate is issued on request for any purpose it may serve.', M, y, { width: CW });

  y = signatureBlock(doc, companyName, data.hrName, data.hrDesignation, y, M);
  return y;
}

function renderRelievingLetter(doc, document, y, M, CW) {
  const { data = {}, companyName } = document;
  const emp = document.employee || {};
  const name = emp.name || data.employeeName || '[Employee Name]';

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e3a8a')
    .text('RELIEVING LETTER', M, y, { width: CW, align: 'center' });
  y += 30;

  doc.fontSize(9).font('Helvetica').fillColor('#333')
    .text(`Date: ${fmtDate(data.issueDate || new Date())}`, M, y); y += 14;
  doc.text(`Ref: RL/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`, M, y); y += 22;

  doc.font('Helvetica-Bold').text('To,', M, y); y += 14;
  doc.font('Helvetica').text(name, M, y); y += 14;
  doc.text(`Employee ID: ${emp.employeeId || '[ID]'}`, M, y); y += 22;

  doc.font('Helvetica-Bold').text('Subject: Relieving from Services', M, y); y += 20;
  doc.font('Helvetica');

  const body = `Dear ${name},\n\nThis is to inform you that your resignation has been accepted and you are relieved from your duties at ${companyName || '[Company Name]'} effective ${fmtDate(data.lastWorkingDate)}.`;
  doc.text(body, M, y, { width: CW, lineGap: 3 });
  y += doc.heightOfString(body, { width: CW, lineGap: 3 }) + 16;

  doc.text(`You were working as ${data.designation || emp.designation || '[Designation]'} in the ${data.department || emp.department || '[Department]'} department since ${fmtDate(data.joiningDate || emp.joiningDate)}.`, M, y, { width: CW, lineGap: 3 });
  y += 20;

  doc.text('We confirm that all company assets have been returned and all dues have been settled. You are released from all your obligations towards the company.', M, y, { width: CW, lineGap: 3 });
  y += 30;

  doc.text(`We thank you for your contributions to ${companyName || '[Company Name]'} and wish you all the best in your future endeavors.`, M, y, { width: CW, lineGap: 3 });

  y = signatureBlock(doc, companyName, data.hrName, data.hrDesignation, y, M);
  return y;
}

function renderIncrementLetter(doc, document, y, M, CW) {
  const { data = {}, companyName } = document;
  const emp = document.employee || {};
  const name = emp.name || data.employeeName || '[Employee Name]';

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e3a8a')
    .text('SALARY REVISION LETTER', M, y, { width: CW, align: 'center' });
  y += 30;

  doc.fontSize(9).font('Helvetica').fillColor('#333')
    .text(`Date: ${fmtDate(data.issueDate || new Date())}`, M, y); y += 14;
  doc.text('CONFIDENTIAL', M, y, { width: CW, align: 'right' }); y += 22;

  doc.font('Helvetica-Bold').text('To,', M, y); y += 14;
  doc.font('Helvetica').text(name, M, y); y += 12;
  doc.text(`Employee ID: ${emp.employeeId || '[ID]'}`, M, y); y += 12;
  doc.text(`Department: ${data.department || emp.department || '[Department]'}`, M, y); y += 22;

  doc.font('Helvetica-Bold').text('Subject: Salary Revision', M, y); y += 20;
  doc.font('Helvetica');

  const body = `Dear ${name},\n\nBased on your performance and contribution to the organization, we are pleased to inform you that your compensation has been revised with effect from ${fmtDate(data.effectiveDate)}.`;
  doc.text(body, M, y, { width: CW, lineGap: 3 });
  y += doc.heightOfString(body, { width: CW, lineGap: 3 }) + 16;

  // Salary revision table
  const rows = [
    ['Previous CTC (Annual)', fmt(data.previousSalary)],
    ['Revised CTC (Annual)', fmt(data.newSalary)],
    ['Increment Amount', fmt((data.newSalary || 0) - (data.previousSalary || 0))],
    ['Increment %', `${(((data.newSalary || 0) - (data.previousSalary || 0)) / (data.previousSalary || 1) * 100).toFixed(1)}%`],
  ];
  y = drawTable(doc, ['Particulars', 'Amount'], rows, y, M, CW);
  y += 16;

  if (data.remarks) {
    doc.text(`Remarks: ${data.remarks}`, M, y, { width: CW }); y += 14;
  }

  doc.text('This revision is subject to the standard terms of your employment. Please keep this information confidential.', M, y, { width: CW, lineGap: 3 }); y += 20;
  doc.text('Congratulations and we look forward to your continued contribution.', M, y, { width: CW });

  y = signatureBlock(doc, companyName, data.hrName, data.hrDesignation, y, M);
  return y;
}

function renderSalaryStructure(doc, document, y, M, CW) {
  const { data = {}, companyName } = document;
  const emp = document.employee || {};
  const name = emp.name || data.employeeName || '[Employee Name]';
  const ctc = data.ctcBreakdown || emp.ctc || {};

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e3a8a')
    .text('SALARY STRUCTURE', M, y, { width: CW, align: 'center' });
  y += 8;
  doc.fontSize(9).font('Helvetica').fillColor('#555')
    .text('(Confidential)', M, y, { width: CW, align: 'center' });
  y += 24;

  // Employee info
  const info = [
    ['Employee Name', name, 'Employee ID', emp.employeeId || '[ID]'],
    ['Designation', data.designation || emp.designation || '[Designation]', 'Department', data.department || emp.department || '[Department]'],
    ['Date of Joining', fmtDate(data.joiningDate || emp.joiningDate), 'Effective From', fmtDate(data.effectiveDate || new Date())],
  ];

  for (const [l1, v1, l2, v2] of info) {
    doc.fontSize(8).font('Helvetica').fillColor('#555').text(l1 + ':', M, y, { width: 90, lineBreak: false });
    doc.font('Helvetica-Bold').fillColor('#333').text(v1, M + 92, y, { width: 150, lineBreak: false });
    doc.font('Helvetica').fillColor('#555').text(l2 + ':', M + 260, y, { width: 90, lineBreak: false });
    doc.font('Helvetica-Bold').fillColor('#333').text(v2, M + 352, y, { width: 120, lineBreak: false });
    y += 16;
  }
  y += 10;

  // Fixed Components
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#166534').text('A. Fixed Salary Components (Monthly Paid)', M, y);
  y += 14;
  const fixedRows = [
    ['Basic Salary', fmt(ctc.basic || 0), fmt(Math.round((ctc.basic || 0) / 12))],
    ['House Rent Allowance (HRA)', fmt(ctc.hra || 0), fmt(Math.round((ctc.hra || 0) / 12))],
    ['Special Allowance', fmt(ctc.specialAllowance || 0), fmt(Math.round((ctc.specialAllowance || 0) / 12))],
  ];
  if (ctc.conveyanceAllowance) fixedRows.push(['Conveyance Allowance', fmt(ctc.conveyanceAllowance), fmt(Math.round(ctc.conveyanceAllowance / 12))]);
  if (ctc.medicalAllowance) fixedRows.push(['Medical Allowance', fmt(ctc.medicalAllowance), fmt(Math.round(ctc.medicalAllowance / 12))]);
  if (ctc.lta) fixedRows.push(['Leave Travel Allowance', fmt(ctc.lta), fmt(Math.round(ctc.lta / 12))]);

  const grossAnnual = (ctc.basic || 0) + (ctc.hra || 0) + (ctc.specialAllowance || 0) + (ctc.conveyanceAllowance || 0) + (ctc.medicalAllowance || 0) + (ctc.lta || 0);
  fixedRows.push(['Gross Salary', fmt(grossAnnual), fmt(Math.round(grossAnnual / 12))]);
  y = drawTable(doc, ['Component', 'Annual (Rs.)', 'Monthly (Rs.)'], fixedRows, y, M, CW);
  y += 12;
  y = pageBreakCheck(doc, y, M);

  // Employer Contributions
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#9b1c1c').text('B. Employer Contributions (Not in-hand)', M, y);
  y += 14;
  const empContribRows = [
    ['Employer PF (12% of Basic)', fmt(ctc.epfEmployer || 0), fmt(Math.round((ctc.epfEmployer || 0) / 12))],
    ['Gratuity (4.81% of Basic)', fmt(ctc.gratuity || 0), fmt(Math.round((ctc.gratuity || 0) / 12))],
  ];
  if (ctc.insurance) empContribRows.push(['Insurance Premium', fmt(ctc.insurance), fmt(Math.round(ctc.insurance / 12))]);
  y = drawTable(doc, ['Component', 'Annual (Rs.)', 'Monthly (Rs.)'], empContribRows, y, M, CW);
  y += 12;
  y = pageBreakCheck(doc, y, M);

  // Variable
  if (ctc.variablePay) {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#92400e').text('C. Variable Pay', M, y);
    y += 14;
    y = drawTable(doc, ['Component', 'Annual (Rs.)', 'Monthly (Rs.)'], [
      ['Performance / Variable Pay', fmt(ctc.variablePay), fmt(Math.round(ctc.variablePay / 12))],
    ], y, M, CW);
    y += 12;
  }

  // Optional Benefits
  const optBenefits = [];
  if (ctc.foodCoupons) optBenefits.push(['Food Coupons', fmt(ctc.foodCoupons), fmt(Math.round(ctc.foodCoupons / 12))]);
  if (ctc.transportAllowance) optBenefits.push(['Transport Allowance', fmt(ctc.transportAllowance), fmt(Math.round(ctc.transportAllowance / 12))]);
  if (ctc.internetReimbursement) optBenefits.push(['Internet Reimbursement', fmt(ctc.internetReimbursement), fmt(Math.round(ctc.internetReimbursement / 12))]);

  if (optBenefits.length > 0) {
    y = pageBreakCheck(doc, y, M);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#6b21a8').text('D. Optional Benefits & Perks', M, y);
    y += 14;
    y = drawTable(doc, ['Benefit', 'Annual (Rs.)', 'Monthly (Rs.)'], optBenefits, y, M, CW);
    y += 12;
  }

  // Total CTC
  y = pageBreakCheck(doc, y, M);
  y += 4;
  doc.lineWidth(1).strokeColor('#1e3a8a').moveTo(M, y).lineTo(M + CW, y).stroke();
  y += 2;
  const totalH = 40;
  doc.fillColor('#eef2ff').rect(M, y, CW, totalH).fill();
  doc.lineWidth(1).strokeColor('#1e3a8a').rect(M, y, CW, totalH).stroke();
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a8a')
    .text('TOTAL ANNUAL CTC', M + 12, y + 11);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#166534')
    .text(fmt(data.annualCTC || 0), M + 12, y + 9, { width: CW - 24, align: 'right' });
  y += totalH + 16;

  doc.fontSize(8).font('Helvetica').fillColor('#555')
    .text('Note: Actual in-hand salary would be approximately 70-80% of CTC after statutory deductions (Employee PF, Professional Tax, TDS).', M, y, { width: CW, lineGap: 2 });

  return y + 20;
}

module.exports = { generateDocumentPDF };
