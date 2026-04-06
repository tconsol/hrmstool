const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ImageRun, Header, Footer,
  HeadingLevel, ShadingType, VerticalAlign, TableLayoutType,
} = require('docx');

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

function logoImage(base64, width = 100, height = 40) {
  if (!base64) return null;
  try {
    const raw = base64.replace(/^data:image\/\w+;base64,/, '');
    const buf = Buffer.from(raw, 'base64');
    return new ImageRun({ data: buf, transformation: { width, height } });
  } catch { return null; }
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 120 } });
}

function heading(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text, bold: true, size: 28, color: '1e3a8a', font: 'Calibri' })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 100 },
    alignment: opts.align || AlignmentType.LEFT,
    children: [new TextRun({ text, size: opts.size || 20, font: 'Calibri', bold: opts.bold, color: opts.color || '333333' })],
  });
}

function richPara(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 100 },
    alignment: opts.align || AlignmentType.LEFT,
    children: runs.map(r => new TextRun({ font: 'Calibri', size: 20, ...r })),
  });
}

function makeTable(headers, rows) {
  const colCount = headers.length;
  const colWidth = Math.floor(9000 / colCount);

  const headerRow = new TableRow({
    children: headers.map(h => new TableCell({
      width: { size: colWidth, type: WidthType.DXA },
      shading: { fill: 'eef2ff', type: ShadingType.CLEAR },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: h, bold: true, size: 18, color: '1e3a8a', font: 'Calibri' })],
      })],
    })),
  });

  const dataRows = rows.map((row, idx) => new TableRow({
    children: row.map(cell => new TableCell({
      width: { size: colWidth, type: WidthType.DXA },
      shading: idx % 2 === 1 ? { fill: 'f9fafb', type: ShadingType.CLEAR } : undefined,
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        spacing: { before: 30, after: 30 },
        children: [new TextRun({ text: String(cell), size: 18, font: 'Calibri', color: '333333' })],
      })],
    })),
  }));

  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows],
  });
}

function signBlock(companyName, name, designation) {
  return [
    emptyLine(),
    para(`For ${companyName || '[Company Name]'},`),
    emptyLine(),
    emptyLine(),
    para('____________________________'),
    para(name || 'Authorized Signatory', { bold: true }),
    para(designation || 'Human Resources', { color: '666666' }),
  ];
}

// ────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ────────────────────────────────────────────────────────────────

async function generateDocumentDocx(document) {
  const logo = logoImage(document.companyLogo, 100, 40);

  // Header children
  const headerChildren = [];
  if (logo) {
    headerChildren.push(new Paragraph({
      children: [logo],
    }));
  }
  if (document.companyName) {
    headerChildren.push(new Paragraph({
      alignment: logo ? AlignmentType.RIGHT : AlignmentType.CENTER,
      children: [new TextRun({ text: document.companyName, bold: true, size: 28, color: '1e3a8a', font: 'Calibri' })],
    }));
  }
  if (document.companyAddress) {
    headerChildren.push(new Paragraph({
      alignment: logo ? AlignmentType.RIGHT : AlignmentType.CENTER,
      children: [new TextRun({ text: document.companyAddress, size: 16, color: '555555', font: 'Calibri' })],
    }));
  }

  // Build body sections
  let bodyChildren = [];
  switch (document.type) {
    case 'offer_letter':
      bodyChildren = buildOfferLetter(document);
      break;
    case 'appointment_letter':
      bodyChildren = buildAppointmentLetter(document);
      break;
    case 'experience_letter':
      bodyChildren = buildExperienceLetter(document);
      break;
    case 'relieving_letter':
      bodyChildren = buildRelievingLetter(document);
      break;
    case 'increment_letter':
      bodyChildren = buildIncrementLetter(document);
      break;
    case 'salary_structure':
      bodyChildren = buildSalaryStructure(document);
      break;
  }

  // Footer
  const footerChildren = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'This is a computer-generated document. No signature required unless specified.', size: 14, color: '999999', font: 'Calibri' })],
    }),
  ];

  const doc = new Document({
    sections: [{
      headers: {
        default: new Header({ children: headerChildren }),
      },
      footers: {
        default: new Footer({ children: footerChildren }),
      },
      properties: {
        page: {
          margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 },
        },
      },
      children: bodyChildren,
    }],
  });

  return Packer.toBuffer(doc);
}

// ────────────────────────────────────────────────────────────────
// TEMPLATE BUILDERS
// ────────────────────────────────────────────────────────────────

function buildOfferLetter(document) {
  const { data = {}, companyName } = document;
  const emp = document.employee || {};
  const name = emp.name || data.employeeName || '[Employee Name]';
  const children = [];

  children.push(heading('OFFER LETTER'));
  children.push(para(`Date: ${fmtDate(data.issueDate || new Date())}`, { color: '666666' }));
  children.push(para(`Ref: OL/${new Date().getFullYear()}/${String(Date.now()).slice(-4)}`, { color: '666666' }));
  children.push(emptyLine());
  children.push(para('To,', { bold: true }));
  children.push(para(name));
  if (emp.address || data.employeeAddress) children.push(para(emp.address || data.employeeAddress, { color: '666666' }));
  children.push(emptyLine());
  children.push(para('Subject: Offer of Employment', { bold: true }));
  children.push(emptyLine());
  children.push(para(`Dear ${name},`));
  children.push(para(`We are pleased to offer you the position of ${data.designation || emp.designation || '[Designation]'} in the ${data.department || emp.department || '[Department]'} department at ${companyName || '[Company Name]'}, effective from ${fmtDate(data.joiningDate || emp.joiningDate)}.`));

  if (data.annualCTC) {
    children.push(para(`Your annual compensation (CTC) will be Rs. ${Number(data.annualCTC).toLocaleString('en-IN')} (Cost to Company) per annum.`));
  }

  // CTC Breakdown
  const ctc = data.ctcBreakdown || emp.ctc;
  if (ctc && ctc.basic) {
    children.push(emptyLine());
    children.push(para('Compensation Breakdown:', { bold: true }));
    const rows = [
      ['Basic Salary', fmt(ctc.basic), fmt(Math.round(ctc.basic / 12))],
      ['HRA', fmt(ctc.hra), fmt(Math.round(ctc.hra / 12))],
      ['Special Allowance', fmt(ctc.specialAllowance), fmt(Math.round(ctc.specialAllowance / 12))],
    ];
    if (ctc.conveyanceAllowance) rows.push(['Conveyance Allowance', fmt(ctc.conveyanceAllowance), fmt(Math.round(ctc.conveyanceAllowance / 12))]);
    if (ctc.medicalAllowance) rows.push(['Medical Allowance', fmt(ctc.medicalAllowance), fmt(Math.round(ctc.medicalAllowance / 12))]);
    if (ctc.lta) rows.push(['Leave Travel Allowance', fmt(ctc.lta), fmt(Math.round(ctc.lta / 12))]);
    rows.push(['Employer PF Contribution', fmt(ctc.epfEmployer), fmt(Math.round(ctc.epfEmployer / 12))]);
    rows.push(['Gratuity', fmt(ctc.gratuity), fmt(Math.round(ctc.gratuity / 12))]);
    if (ctc.insurance) rows.push(['Insurance Premium', fmt(ctc.insurance), fmt(Math.round(ctc.insurance / 12))]);
    if (ctc.variablePay) rows.push(['Variable Pay', fmt(ctc.variablePay), fmt(Math.round(ctc.variablePay / 12))]);
    rows.push(['Total CTC', fmt(data.annualCTC), fmt(Math.round(data.annualCTC / 12))]);
    children.push(makeTable(['Component', 'Annual (Rs.)', 'Monthly (Rs.)'], rows));
  }

  children.push(emptyLine());
  children.push(para('Terms & Conditions:', { bold: true }));
  children.push(para(`1. Probation Period: ${data.probationPeriod || '6'} months`));
  children.push(para(`2. Notice Period: ${data.noticePeriod || '1'} month(s)`));
  children.push(para(`3. Work Location: ${data.workLocation || '[Work Location]'}`));
  children.push(para(`4. Reporting To: ${data.reportingManager || '[Reporting Manager]'}`));
  children.push(emptyLine());
  children.push(para('Please sign and return this letter as your acceptance of the above terms.'));
  children.push(para('We welcome you and look forward to a long and successful association.'));

  children.push(...signBlock(companyName, data.hrName, data.hrDesignation));

  children.push(emptyLine());
  children.push(emptyLine());
  children.push(para('Employee Acceptance:', { bold: true }));
  children.push(para('I accept the terms and conditions as stated above.'));
  children.push(emptyLine());
  children.push(para('____________________________'));
  children.push(para(name, { bold: true }));
  children.push(para('Date: _______________'));

  return children;
}

function buildAppointmentLetter(document) {
  const { data = {}, companyName } = document;
  const emp = document.employee || {};
  const name = emp.name || data.employeeName || '[Employee Name]';
  const children = [];

  children.push(heading('APPOINTMENT LETTER'));
  children.push(para(`Date: ${fmtDate(data.issueDate || new Date())}`, { color: '666666' }));
  children.push(emptyLine());
  children.push(para('To,', { bold: true }));
  children.push(para(name));
  children.push(emptyLine());
  children.push(para('Subject: Letter of Appointment', { bold: true }));
  children.push(emptyLine());
  children.push(para(`Dear ${name},`));
  children.push(para(`With reference to your application and subsequent interview, we are pleased to appoint you as ${data.designation || emp.designation || '[Designation]'} in the ${data.department || emp.department || '[Department]'} department at ${companyName || '[Company Name]'}, with effect from ${fmtDate(data.joiningDate || emp.joiningDate)}.`));
  children.push(emptyLine());
  children.push(para('Terms of Appointment:', { bold: true }));

  const clauses = [
    `1. Designation: ${data.designation || emp.designation || '[Designation]'}`,
    `2. Department: ${data.department || emp.department || '[Department]'}`,
    `3. Date of Joining: ${fmtDate(data.joiningDate || emp.joiningDate)}`,
    `4. Probation Period: ${data.probationPeriod || '6'} months from the date of joining.`,
    `5. Notice Period: ${data.noticePeriod || '1'} month(s) from either side.`,
    `6. Work Location: ${data.workLocation || '[Work Location]'}`,
    `7. Working Hours: ${data.workingHours || '9:00 AM to 6:00 PM, Monday to Friday'}`,
    `8. Compensation: Your annual CTC will be Rs. ${Number(data.annualCTC || (emp.salary ? emp.salary * 12 : 0)).toLocaleString('en-IN')} per annum.`,
    `9. Confidentiality: You shall not disclose any confidential information of the company.`,
    `10. Code of Conduct: You are expected to adhere to the company's code of conduct and policies.`,
  ];
  for (const c of clauses) children.push(para(c));

  children.push(emptyLine());
  children.push(para('Kindly sign the duplicate copy of this letter as a token of your acceptance.'));
  children.push(para('We wish you a successful career with us.'));
  children.push(...signBlock(companyName, data.hrName, data.hrDesignation));

  return children;
}

function buildExperienceLetter(document) {
  const { data = {}, companyName } = document;
  const emp = document.employee || {};
  const name = emp.name || data.employeeName || '[Employee Name]';
  const children = [];

  children.push(heading('EXPERIENCE LETTER'));
  children.push(para(`Date: ${fmtDate(data.issueDate || new Date())}`, { color: '666666' }));
  children.push(emptyLine());
  children.push(para('TO WHOM IT MAY CONCERN', { bold: true, align: AlignmentType.CENTER }));
  children.push(emptyLine());
  children.push(para(`This is to certify that ${name} (Employee ID: ${emp.employeeId || '[ID]'}) was employed with ${companyName || '[Company Name]'} from ${fmtDate(data.joiningDate || emp.joiningDate)} to ${fmtDate(data.lastWorkingDate)} in the capacity of ${data.designation || emp.designation || '[Designation]'} in the ${data.department || emp.department || '[Department]'} department.`));
  children.push(para(`During the tenure with us, we found ${name} to be sincere, dedicated, and hardworking. ${data.performanceNote || 'Their conduct and performance have been satisfactory throughout their employment.'}`));
  children.push(para(`We wish ${name} all the best in future endeavors.`));
  children.push(para('This certificate is issued on request for any purpose it may serve.'));
  children.push(...signBlock(companyName, data.hrName, data.hrDesignation));

  return children;
}

function buildRelievingLetter(document) {
  const { data = {}, companyName } = document;
  const emp = document.employee || {};
  const name = emp.name || data.employeeName || '[Employee Name]';
  const children = [];

  children.push(heading('RELIEVING LETTER'));
  children.push(para(`Date: ${fmtDate(data.issueDate || new Date())}`, { color: '666666' }));
  children.push(emptyLine());
  children.push(para('To,', { bold: true }));
  children.push(para(name));
  children.push(para(`Employee ID: ${emp.employeeId || '[ID]'}`, { color: '666666' }));
  children.push(emptyLine());
  children.push(para('Subject: Relieving from Services', { bold: true }));
  children.push(emptyLine());
  children.push(para(`Dear ${name},`));
  children.push(para(`This is to inform you that your resignation has been accepted and you are relieved from your duties at ${companyName || '[Company Name]'} effective ${fmtDate(data.lastWorkingDate)}.`));
  children.push(para(`You were working as ${data.designation || emp.designation || '[Designation]'} in the ${data.department || emp.department || '[Department]'} department since ${fmtDate(data.joiningDate || emp.joiningDate)}.`));
  children.push(para('We confirm that all company assets have been returned and all dues have been settled. You are released from all your obligations towards the company.'));
  children.push(para(`We thank you for your contributions to ${companyName || '[Company Name]'} and wish you all the best in your future endeavors.`));
  children.push(...signBlock(companyName, data.hrName, data.hrDesignation));

  return children;
}

function buildIncrementLetter(document) {
  const { data = {}, companyName } = document;
  const emp = document.employee || {};
  const name = emp.name || data.employeeName || '[Employee Name]';
  const children = [];

  children.push(heading('SALARY REVISION LETTER'));
  children.push(para(`Date: ${fmtDate(data.issueDate || new Date())}`, { color: '666666' }));
  children.push(para('CONFIDENTIAL', { align: AlignmentType.RIGHT, bold: true, color: '991b1b' }));
  children.push(emptyLine());
  children.push(para('To,', { bold: true }));
  children.push(para(name));
  children.push(para(`Employee ID: ${emp.employeeId || '[ID]'}`, { color: '666666' }));
  children.push(para(`Department: ${data.department || emp.department || '[Department]'}`, { color: '666666' }));
  children.push(emptyLine());
  children.push(para('Subject: Salary Revision', { bold: true }));
  children.push(emptyLine());
  children.push(para(`Dear ${name},`));
  children.push(para(`Based on your performance and contribution to the organization, we are pleased to inform you that your compensation has been revised with effect from ${fmtDate(data.effectiveDate)}.`));
  children.push(emptyLine());

  const increment = (data.newSalary || 0) - (data.previousSalary || 0);
  const pct = data.previousSalary ? ((increment / data.previousSalary) * 100).toFixed(1) : '0';
  children.push(makeTable(['Particulars', 'Amount'], [
    ['Previous CTC (Annual)', fmt(data.previousSalary)],
    ['Revised CTC (Annual)', fmt(data.newSalary)],
    ['Increment Amount', fmt(increment)],
    ['Increment %', `${pct}%`],
  ]));
  children.push(emptyLine());

  if (data.remarks) children.push(para(`Remarks: ${data.remarks}`));
  children.push(para('This revision is subject to the standard terms of your employment. Please keep this information confidential.'));
  children.push(para('Congratulations and we look forward to your continued contribution.'));
  children.push(...signBlock(companyName, data.hrName, data.hrDesignation));

  return children;
}

function buildSalaryStructure(document) {
  const { data = {}, companyName } = document;
  const emp = document.employee || {};
  const name = emp.name || data.employeeName || '[Employee Name]';
  const ctc = data.ctcBreakdown || emp.ctc || {};
  const children = [];

  children.push(heading('SALARY STRUCTURE'));
  children.push(para('(Confidential)', { align: AlignmentType.CENTER, color: '666666' }));
  children.push(emptyLine());

  // Employee info
  children.push(richPara([
    { text: 'Employee Name: ', color: '666666' },
    { text: name, bold: true },
    { text: '    Employee ID: ', color: '666666' },
    { text: emp.employeeId || '[ID]', bold: true },
  ]));
  children.push(richPara([
    { text: 'Designation: ', color: '666666' },
    { text: data.designation || emp.designation || '-', bold: true },
    { text: '    Department: ', color: '666666' },
    { text: data.department || emp.department || '-', bold: true },
  ]));
  children.push(richPara([
    { text: 'Date of Joining: ', color: '666666' },
    { text: fmtDate(data.joiningDate || emp.joiningDate), bold: true },
    { text: '    Effective From: ', color: '666666' },
    { text: fmtDate(data.effectiveDate || new Date()), bold: true },
  ]));
  children.push(emptyLine());

  // Fixed Components
  children.push(para('A. Fixed Salary Components (Monthly Paid)', { bold: true, color: '166534' }));
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
  children.push(makeTable(['Component', 'Annual (Rs.)', 'Monthly (Rs.)'], fixedRows));
  children.push(emptyLine());

  // Employer Contributions
  children.push(para('B. Employer Contributions (Not in-hand)', { bold: true, color: '9b1c1c' }));
  const contribRows = [
    ['Employer PF (12% of Basic)', fmt(ctc.epfEmployer || 0), fmt(Math.round((ctc.epfEmployer || 0) / 12))],
    ['Gratuity (4.81% of Basic)', fmt(ctc.gratuity || 0), fmt(Math.round((ctc.gratuity || 0) / 12))],
  ];
  if (ctc.insurance) contribRows.push(['Insurance Premium', fmt(ctc.insurance), fmt(Math.round(ctc.insurance / 12))]);
  children.push(makeTable(['Component', 'Annual (Rs.)', 'Monthly (Rs.)'], contribRows));
  children.push(emptyLine());

  // Variable pay
  if (ctc.variablePay) {
    children.push(para('C. Variable Pay', { bold: true, color: '92400e' }));
    children.push(makeTable(['Component', 'Annual (Rs.)', 'Monthly (Rs.)'], [
      ['Performance / Variable Pay', fmt(ctc.variablePay), fmt(Math.round(ctc.variablePay / 12))],
    ]));
    children.push(emptyLine());
  }

  // Optional Benefits
  const opts = [];
  if (ctc.foodCoupons) opts.push(['Food Coupons', fmt(ctc.foodCoupons), fmt(Math.round(ctc.foodCoupons / 12))]);
  if (ctc.transportAllowance) opts.push(['Transport Allowance', fmt(ctc.transportAllowance), fmt(Math.round(ctc.transportAllowance / 12))]);
  if (ctc.internetReimbursement) opts.push(['Internet Reimbursement', fmt(ctc.internetReimbursement), fmt(Math.round(ctc.internetReimbursement / 12))]);
  if (opts.length > 0) {
    children.push(para('D. Optional Benefits & Perks', { bold: true, color: '6b21a8' }));
    children.push(makeTable(['Benefit', 'Annual (Rs.)', 'Monthly (Rs.)'], opts));
    children.push(emptyLine());
  }

  // Total CTC
  children.push(new Paragraph({
    spacing: { before: 100, after: 100 },
    shading: { fill: 'eef2ff', type: ShadingType.CLEAR },
    border: {
      top: { style: BorderStyle.SINGLE, size: 2, color: '1e3a8a' },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: '1e3a8a' },
      left: { style: BorderStyle.SINGLE, size: 2, color: '1e3a8a' },
      right: { style: BorderStyle.SINGLE, size: 2, color: '1e3a8a' },
    },
    children: [
      new TextRun({ text: 'TOTAL ANNUAL CTC:   ', bold: true, size: 24, color: '1e3a8a', font: 'Calibri' }),
      new TextRun({ text: fmt(data.annualCTC || 0), bold: true, size: 28, color: '166534', font: 'Calibri' }),
    ],
  }));

  children.push(emptyLine());
  children.push(para('Note: Actual in-hand salary would be approximately 70-80% of CTC after statutory deductions (Employee PF, Professional Tax, TDS).', { size: 16, color: '666666' }));

  return children;
}

module.exports = { generateDocumentDocx };
