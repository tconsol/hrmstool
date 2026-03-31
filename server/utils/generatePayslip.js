const PDFDocument = require('pdfkit');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const generatePayslipPDF = (payroll) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const emp = payroll.user;

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('HRMS PAYSLIP', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(
      `For the month of ${MONTHS[payroll.month - 1]} ${payroll.year}`,
      { align: 'center' }
    );

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Employee Details
    doc.fontSize(11).font('Helvetica-Bold').text('Employee Details');
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10);

    const leftCol = 50;
    const rightCol = 300;
    let y = doc.y;

    doc.text(`Employee ID: ${emp.employeeId}`, leftCol, y);
    doc.text(`Department: ${emp.department || 'N/A'}`, rightCol, y);
    y += 18;
    doc.text(`Name: ${emp.name}`, leftCol, y);
    doc.text(`Designation: ${emp.designation || 'N/A'}`, rightCol, y);
    y += 18;
    doc.text(`Email: ${emp.email}`, leftCol, y);
    doc.text(`Joining Date: ${emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}`, rightCol, y);

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Earnings
    doc.fontSize(11).font('Helvetica-Bold').text('Earnings');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    y = doc.y;
    doc.text('Base Salary', leftCol, y);
    doc.text(`₹${payroll.baseSalary.toLocaleString()}`, rightCol, y);

    if (payroll.totalBonuses > 0) {
      y += 18;
      doc.text('Performance Bonus', leftCol, y);
      doc.text(`₹${payroll.bonuses.performance.toLocaleString()}`, rightCol, y);
      y += 18;
      doc.text('Festival Bonus', leftCol, y);
      doc.text(`₹${payroll.bonuses.festival.toLocaleString()}`, rightCol, y);
      y += 18;
      doc.text('Other Bonus', leftCol, y);
      doc.text(`₹${payroll.bonuses.other.toLocaleString()}`, rightCol, y);
    }

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Deductions
    doc.fontSize(11).font('Helvetica-Bold').text('Deductions');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    y = doc.y;
    doc.text('Leave Deduction', leftCol, y);
    doc.text(`₹${payroll.deductions.leave.toLocaleString()}`, rightCol, y);
    y += 18;
    doc.text('Tax Deduction', leftCol, y);
    doc.text(`₹${payroll.deductions.tax.toLocaleString()}`, rightCol, y);
    y += 18;
    doc.text('Other Deductions', leftCol, y);
    doc.text(`₹${payroll.deductions.other.toLocaleString()}`, rightCol, y);

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Summary
    doc.fontSize(11).font('Helvetica-Bold').text('Summary');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    y = doc.y;
    doc.text('Total Earnings', leftCol, y);
    doc.text(`₹${(payroll.baseSalary + payroll.totalBonuses).toLocaleString()}`, rightCol, y);
    y += 18;
    doc.text('Total Deductions', leftCol, y);
    doc.text(`₹${payroll.totalDeductions.toLocaleString()}`, rightCol, y);

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Net Salary
    doc.fontSize(14).font('Helvetica-Bold');
    y = doc.y;
    doc.text('Net Salary', leftCol, y);
    doc.text(`₹${payroll.netSalary.toLocaleString()}`, rightCol, y);

    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica').text(
      `Payment Status: ${payroll.paymentStatus.toUpperCase()}`,
      { align: 'center' }
    );

    if (payroll.paymentDate) {
      doc.text(
        `Payment Date: ${new Date(payroll.paymentDate).toLocaleDateString()}`,
        { align: 'center' }
      );
    }

    doc.moveDown(3);
    doc.fontSize(8).text('This is a system-generated payslip and does not require a signature.', {
      align: 'center',
      color: '#666',
    });

    doc.end();
  });
};

module.exports = { generatePayslipPDF };
