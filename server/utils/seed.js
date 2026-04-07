const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

const Organization = require('../models/Organization');
const User = require('../models/User');
const Department = require('../models/Department');
const Holiday = require('../models/Holiday');
const Announcement = require('../models/Announcement');
const Shift = require('../models/Shift');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Asset = require('../models/Asset');
const Training = require('../models/Training');
const SuperAdmin = require('../models/SuperAdmin');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear all existing data
    console.log('🗑️  Clearing existing data...');
    await Organization.deleteMany({});
    await User.deleteMany({});
    await Department.deleteMany({});
    await Holiday.deleteMany({});
    await Announcement.deleteMany({});
    await Shift.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await Payroll.deleteMany({});
    await Asset.deleteMany({});
    await Training.deleteMany({});
    await SuperAdmin.deleteMany({});
    console.log('✓ All existing data cleared');

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // ==================== SUPER ADMIN ====================
    console.log('🛡️  Creating super admin...');
    const superAdmin = new SuperAdmin({
      name: 'Platform Owner',
      email: 'superadmin@hrms.com',
      password: 'superadmin123',
      phone: '9999999999',
      status: 'active',
    });
    await superAdmin.save();
    console.log('✓ Super admin created');

    // ============================================================
    // ORGANIZATION 1: TechCorp Solutions (Technology)
    // ============================================================
    console.log('\n🏢 [1/4] Creating TechCorp Solutions...');
    const org1 = new Organization({
      name: 'TechCorp Solutions',
      slug: 'techcorp-solutions',
      email: 'admin@hrms.com',
      phone: '+91-9876543210',
      address: 'Mumbai, Maharashtra, India',
      website: 'https://techcorp.com',
      industry: 'Technology',
      employeeCount: '51-200',
      subscription: {
        plan: 'professional',
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(currentYear + 1)),
        maxEmployees: 200,
      },
      settings: {
        fiscalYearStart: 4,
        workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        shiftStartTime: '09:00',
        shiftEndTime: '18:00',
        lateThresholdMinutes: 15,
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
      },
    });
    await org1.save();

    const org1DeptData = [
      { name: 'Engineering',     code: 'ENG',   description: 'Software Development & Infrastructure' },
      { name: 'Design',          code: 'DES',   description: 'UI/UX & Graphic Design' },
      { name: 'Marketing',       code: 'MKT',   description: 'Marketing & Communications' },
      { name: 'Finance',         code: 'FIN',   description: 'Accounting & Financial Management' },
      { name: 'Sales',           code: 'SALES', description: 'Business Development & Sales' },
      { name: 'Human Resources', code: 'HR',    description: 'HR & Administration' },
    ];
    const org1Depts = [];
    for (const d of org1DeptData) {
      const dept = new Department({ ...d, organization: org1._id, isActive: true });
      await dept.save();
      org1Depts.push(dept);
    }

    await new Shift({ name: 'Morning Shift', startTime: '09:00', endTime: '18:00', graceMinutes: 15, isDefault: true, organization: org1._id }).save();
    await new Shift({ name: 'Evening Shift', startTime: '14:00', endTime: '23:00', graceMinutes: 10, organization: org1._id }).save();

    // NOTE: department stored as NAME string (not ObjectId)
    const org1HR = [];
    const org1HRData = [
      { employeeId: 'EMP0001', name: 'Rajesh Kumar', email: 'admin@hrms.com', password: 'admin123', phone: '9876543210', designation: 'HR Manager',  department: 'Human Resources', salary: 85000, role: 'hr' },
      { employeeId: 'EMP0002', name: 'Neha Singh',   email: 'hr@hrms.com',   password: 'hr123456', phone: '9876543220', designation: 'HR Executive', department: 'Human Resources', salary: 60000, role: 'hr' },
    ];
    for (const d of org1HRData) {
      const u = new User({ ...d, organization: org1._id, joiningDate: new Date('2022-01-15'), address: 'Mumbai, India', status: 'active' });
      await u.save();
      org1HR.push(u);
    }
    org1.createdBy = org1HR[0]._id;
    await org1.save();

    const org1Emps = [];
    const org1EmpData = [
      { employeeId: 'EMP0003', name: 'Rahul Sharma', email: 'rahul@hrms.com', password: 'employee123', phone: '9876543211', department: 'Engineering',    designation: 'Senior Developer',   salary: 80000, joiningDate: new Date('2021-06-01') },
      { employeeId: 'EMP0004', name: 'Priya Patel',  email: 'priya@hrms.com', password: 'employee123', phone: '9876543212', department: 'Design',          designation: 'UI/UX Designer',     salary: 65000, joiningDate: new Date('2022-08-15') },
      { employeeId: 'EMP0005', name: 'Amit Kumar',   email: 'amit@hrms.com',  password: 'employee123', phone: '9876543213', department: 'Engineering',    designation: 'Backend Developer',  salary: 75000, joiningDate: new Date('2022-01-10') },
      { employeeId: 'EMP0006', name: 'Sneha Reddy',  email: 'sneha@hrms.com', password: 'employee123', phone: '9876543214', department: 'Marketing',       designation: 'Marketing Manager',  salary: 70000, joiningDate: new Date('2021-03-01') },
      { employeeId: 'EMP0007', name: 'Vikram Singh', email: 'vikram@hrms.com',password: 'employee123', phone: '9876543215', department: 'Engineering',    designation: 'Frontend Developer', salary: 72000, joiningDate: new Date('2023-02-15') },
      { employeeId: 'EMP0008', name: 'Anjali Gupta', email: 'anjali@hrms.com',password: 'employee123', phone: '9876543216', department: 'Finance',         designation: 'Finance Analyst',    salary: 60000, joiningDate: new Date('2023-07-10') },
      { employeeId: 'EMP0009', name: 'Rohan Desai',  email: 'rohan@hrms.com', password: 'employee123', phone: '9876543217', department: 'Sales',           designation: 'Sales Executive',    salary: 55000, joiningDate: new Date('2023-09-01') },
      { employeeId: 'EMP0010', name: 'Divya Singh',  email: 'divya@hrms.com', password: 'employee123', phone: '9876543218', department: 'Design',          designation: 'Graphic Designer',   salary: 50000, joiningDate: new Date('2024-01-15') },
    ];
    for (const d of org1EmpData) {
      const u = new User({ ...d, role: 'employee', organization: org1._id, address: 'India', status: 'active' });
      await u.save();
      org1Emps.push(u);
    }

    const org1Holidays = [];
    const org1HolidayData = [
      { name: 'Republic Day',     date: new Date(currentYear, 0, 26), type: 'national' },
      { name: 'Holi',             date: new Date(currentYear, 2, 25), type: 'national' },
      { name: 'Independence Day', date: new Date(currentYear, 7, 15), type: 'national' },
      { name: 'Diwali',           date: new Date(currentYear, 10, 1), type: 'national' },
      { name: 'Foundation Day',   date: new Date(currentYear, 4,  1), type: 'company', description: 'TechCorp Foundation Day' },
    ];
    for (const d of org1HolidayData) {
      const h = new Holiday({ ...d, organization: org1._id });
      await h.save();
      org1Holidays.push(h);
    }

    const org1AnnouncementData = [
      { title: 'Welcome to TechCorp HRMS', content: 'We are excited to launch our new HRMS. This will streamline all HR processes.', priority: 'high', targetRoles: ['hr', 'manager', 'employee'] },
      { title: 'Holiday Schedule Updated', content: 'Please note the updated holiday schedule for this financial year.', priority: 'medium', targetRoles: ['employee'] },
      { title: 'Urgent: Update Your KYC', content: 'All employees must update KYC documents by end of month.', priority: 'urgent', targetRoles: ['employee'] },
    ];
    for (const d of org1AnnouncementData) {
      await new Announcement({ ...d, createdBy: org1HR[0]._id, organization: org1._id, isActive: true }).save();
    }

    let org1AttCount = 0;
    for (const emp of org1Emps) {
      for (let i = 30; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth, new Date().getDate() - i);
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        if (org1Holidays.some(h => new Date(h.date).toDateString() === date.toDateString())) continue;
        const status = Math.random() > 0.12 ? (Math.random() > 0.88 ? 'late' : 'present') : 'absent';
        let checkIn = null, checkOut = null, workHours = 0;
        if (status !== 'absent') {
          const ci = new Date(date); ci.setHours(status === 'late' ? 10 : 9, Math.floor(Math.random() * 30), 0, 0);
          const co = new Date(ci); co.setHours(ci.getHours() + 8, Math.floor(Math.random() * 60), 0, 0);
          checkIn = ci; checkOut = co; workHours = parseFloat(((co - ci) / 3600000).toFixed(2));
        }
        try {
          await new Attendance({ user: emp._id, organization: org1._id, date: new Date(date.setHours(0,0,0,0)), checkIn, checkOut, status, workHours, markedBy: 'self' }).save();
          org1AttCount++;
        } catch (_) {}
      }
    }

    const org1LeaveData = [
      { user: org1Emps[0]._id, leaveType: 'casual', startDate: new Date(currentYear, currentMonth, 1),  endDate: new Date(currentYear, currentMonth, 3),  totalDays: 3, reason: 'Personal work',   status: 'approved', approvedBy: org1HR[0]._id },
      { user: org1Emps[1]._id, leaveType: 'sick',   startDate: new Date(currentYear, currentMonth, 8),  endDate: new Date(currentYear, currentMonth, 9),  totalDays: 2, reason: 'Medical checkup', status: 'approved', approvedBy: org1HR[0]._id },
      { user: org1Emps[2]._id, leaveType: 'paid',   startDate: new Date(currentYear, currentMonth + 1, 1), endDate: new Date(currentYear, currentMonth + 1, 5), totalDays: 5, reason: 'Vacation', status: 'pending' },
      { user: org1Emps[3]._id, leaveType: 'casual', startDate: new Date(currentYear, currentMonth, 15), endDate: new Date(currentYear, currentMonth, 15), totalDays: 1, reason: 'Family event',  status: 'approved', approvedBy: org1HR[0]._id },
    ];
    for (const d of org1LeaveData) {
      await new Leave({ ...d, organization: org1._id }).save();
      if (d.status === 'approved') await User.findByIdAndUpdate(d.user, { $inc: { [`leaveBalance.${d.leaveType}`]: -d.totalDays } });
    }

    let org1PayrollCount = 0;
    for (const emp of org1Emps) {
      for (let offset = 0; offset <= 2; offset++) {
        const pm = currentMonth - offset; const py = pm < 0 ? currentYear - 1 : currentYear; const m = pm < 0 ? 12 + pm : pm;
        const tax = emp.salary > 50000 ? emp.salary * 0.1 : 0; const net = emp.salary - tax;
        try {
          await new Payroll({ user: emp._id, organization: org1._id, month: m + 1, year: py, baseSalary: emp.salary, deductions: { leave: 0, tax: parseFloat(tax.toFixed(2)), other: 0 }, bonuses: { performance: 0, festival: 0, other: 0 }, totalDeductions: parseFloat(tax.toFixed(2)), totalBonuses: 0, netSalary: parseFloat(net.toFixed(2)), paymentStatus: offset === 0 ? 'pending' : 'paid', paymentDate: offset === 0 ? null : new Date(py, m, 28), generatedBy: org1HR[0]._id }).save();
          org1PayrollCount++;
        } catch (_) {}
      }
    }

    const org1AssetData = [
      { name: 'MacBook Pro M2',    type: 'laptop',  brand: 'Apple',  serialNumber: 'TC-MBP-001', purchaseCost: 200000, assignedTo: org1Emps[0]._id, status: 'assigned' },
      { name: 'Dell XPS 15',       type: 'laptop',  brand: 'Dell',   serialNumber: 'TC-DL-001',  purchaseCost: 120000, assignedTo: org1Emps[1]._id, status: 'assigned' },
      { name: 'iPhone 15 Pro',     type: 'phone',   brand: 'Apple',  serialNumber: 'TC-IP-001',  purchaseCost: 130000, assignedTo: org1Emps[2]._id, status: 'assigned' },
      { name: 'LG 27" 4K Monitor', type: 'monitor', brand: 'LG',     serialNumber: 'TC-LG-001',  purchaseCost: 35000,  status: 'available' },
    ];
    for (const d of org1AssetData) {
      await new Asset({ ...d, organization: org1._id, purchaseDate: new Date(currentYear - 1, 6, 1), assignedDate: d.assignedTo ? new Date() : null }).save();
    }

    const org1TrainingData = [
      { title: 'Onboarding Program', type: 'onboarding', trainer: 'Rajesh Kumar',  startDate: new Date(currentYear, currentMonth, 1),      endDate: new Date(currentYear, currentMonth, 3),      status: 'ongoing',   maxParticipants: 50, description: 'Introduction to company culture' },
      { title: 'React Advanced',     type: 'online',     trainer: 'TechAcademy',   startDate: new Date(currentYear, currentMonth, 10),     endDate: new Date(currentYear, currentMonth + 1, 10), status: 'upcoming',  maxParticipants: 30, description: 'Deep dive into React & hooks' },
      { title: 'Leadership Workshop',type: 'workshop',   trainer: 'HR Department', startDate: new Date(currentYear, currentMonth - 1, 15), endDate: new Date(currentYear, currentMonth - 1, 17), status: 'completed', maxParticipants: 20, description: 'Enhance leadership skills' },
    ];
    for (const d of org1TrainingData) {
      await new Training({ ...d, createdBy: org1HR[0]._id, organization: org1._id }).save();
    }
    console.log(`✓ TechCorp Solutions: ${org1HR.length + org1Emps.length} users, ${org1AttCount} attendance, ${org1PayrollCount} payroll`);

    // ============================================================
    // ORGANIZATION 2: MediCare Hospital (Healthcare)
    // ============================================================
    console.log('\n🏢 [2/4] Creating MediCare Hospital...');
    const org2 = new Organization({
      name: 'MediCare Hospital', slug: 'medicare-hospital', email: 'admin@medicare.com',
      phone: '+91-9876500001', address: 'Bengaluru, Karnataka, India', website: 'https://medicare.com',
      industry: 'Healthcare', employeeCount: '201-500',
      subscription: { plan: 'enterprise', startDate: new Date(), endDate: new Date(new Date().setFullYear(currentYear + 2)), maxEmployees: 500 },
      settings: { fiscalYearStart: 4, workingDays: ['Mon','Tue','Wed','Thu','Fri','Sat'], shiftStartTime: '08:00', shiftEndTime: '20:00', lateThresholdMinutes: 10, currency: 'INR', dateFormat: 'DD/MM/YYYY' },
    });
    await org2.save();

    for (const d of [
      { name: 'Cardiology', code: 'CARD', description: 'Heart & Cardiovascular' },
      { name: 'Neurology', code: 'NEUR', description: 'Brain & Nervous System' },
      { name: 'Orthopaedics', code: 'ORTH', description: 'Bone & Joint' },
      { name: 'Administration', code: 'ADM', description: 'Hospital Administration' },
      { name: 'Pharmacy', code: 'PHAR', description: 'Pharmacy & Medicines' },
      { name: 'Human Resources', code: 'HR', description: 'HR & Administration' },
    ]) { await new Department({ ...d, organization: org2._id, isActive: true }).save(); }

    await new Shift({ name: 'Day Shift', startTime: '08:00', endTime: '20:00', graceMinutes: 10, isDefault: true, organization: org2._id }).save();
    await new Shift({ name: 'Night Shift', startTime: '20:00', endTime: '08:00', graceMinutes: 10, organization: org2._id }).save();

    const org2HR = [];
    for (const d of [
      { employeeId: 'EMP0001', name: 'Dr. Anita Sharma', email: 'admin@medicare.com', password: 'admin123', phone: '9876500001', designation: 'HR Director', department: 'Human Resources', salary: 95000, role: 'hr' },
      { employeeId: 'EMP0002', name: 'Kiran Mehta',      email: 'hr@medicare.com',    password: 'hr123456', phone: '9876500002', designation: 'HR Manager',  department: 'Human Resources', salary: 70000, role: 'hr' },
    ]) { const u = new User({ ...d, organization: org2._id, joiningDate: new Date('2020-05-01'), address: 'Bengaluru, India', status: 'active' }); await u.save(); org2HR.push(u); }
    org2.createdBy = org2HR[0]._id; await org2.save();

    const org2Emps = [];
    for (const d of [
      { employeeId: 'EMP0003', name: 'Dr. Suresh Rao',   email: 'suresh@medicare.com', password: 'employee123', phone: '9876500003', department: 'Cardiology',     designation: 'Senior Cardiologist', salary: 150000, joiningDate: new Date('2018-03-10') },
      { employeeId: 'EMP0004', name: 'Dr. Meena Iyer',   email: 'meena@medicare.com',  password: 'employee123', phone: '9876500004', department: 'Neurology',      designation: 'Neurologist',         salary: 140000, joiningDate: new Date('2019-07-20') },
      { employeeId: 'EMP0005', name: 'Ravi Prakash',     email: 'ravi@medicare.com',   password: 'employee123', phone: '9876500005', department: 'Administration', designation: 'Admin Officer',       salary: 50000,  joiningDate: new Date('2021-02-15') },
      { employeeId: 'EMP0006', name: 'Sunita Nair',      email: 'sunita@medicare.com', password: 'employee123', phone: '9876500006', department: 'Pharmacy',       designation: 'Pharmacist',          salary: 55000,  joiningDate: new Date('2022-08-01') },
      { employeeId: 'EMP0007', name: 'Dr. Arjun Pillai', email: 'arjun@medicare.com',  password: 'employee123', phone: '9876500007', department: 'Orthopaedics',   designation: 'Ortho Surgeon',       salary: 145000, joiningDate: new Date('2020-11-15') },
    ]) { const u = new User({ ...d, role: 'employee', organization: org2._id, address: 'Bengaluru, India', status: 'active' }); await u.save(); org2Emps.push(u); }

    await new Holiday({ name: 'Republic Day', date: new Date(currentYear, 0, 26), type: 'national', organization: org2._id }).save();
    await new Holiday({ name: 'Independence Day', date: new Date(currentYear, 7, 15), type: 'national', organization: org2._id }).save();
    await new Holiday({ name: 'Hospital Foundation Day', date: new Date(currentYear, 3, 10), type: 'company', description: 'MediCare Foundation Day', organization: org2._id }).save();
    await new Announcement({ title: 'New Night Shift Allowance', content: 'Night shift staff will receive a 20% shift allowance from this month.', priority: 'high', targetRoles: ['employee'], createdBy: org2HR[0]._id, organization: org2._id, isActive: true }).save();

    let org2AttCount = 0;
    for (const emp of org2Emps) {
      for (let i = 20; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth, new Date().getDate() - i);
        if (date.getDay() === 0) continue;
        const status = Math.random() > 0.1 ? 'present' : 'absent';
        let checkIn = null, checkOut = null, workHours = 0;
        if (status === 'present') { const ci = new Date(date); ci.setHours(8, 0, 0, 0); const co = new Date(ci); co.setHours(20, 0, 0, 0); checkIn = ci; checkOut = co; workHours = 12; }
        try { await new Attendance({ user: emp._id, organization: org2._id, date: new Date(date.setHours(0,0,0,0)), checkIn, checkOut, status, workHours, markedBy: 'self' }).save(); org2AttCount++; } catch (_) {}
      }
    }

    await new Leave({ user: org2Emps[0]._id, leaveType: 'paid', startDate: new Date(currentYear, currentMonth, 5), endDate: new Date(currentYear, currentMonth, 7), totalDays: 3, reason: 'Family vacation', status: 'approved', approvedBy: org2HR[0]._id, organization: org2._id }).save();
    await new Leave({ user: org2Emps[2]._id, leaveType: 'sick', startDate: new Date(currentYear, currentMonth, 12), endDate: new Date(currentYear, currentMonth, 13), totalDays: 2, reason: 'Fever', status: 'pending', organization: org2._id }).save();

    let org2PayrollCount = 0;
    for (const emp of org2Emps) {
      for (let offset = 0; offset <= 1; offset++) {
        const pm = currentMonth - offset; const py = pm < 0 ? currentYear - 1 : currentYear; const m = pm < 0 ? 12 + pm : pm;
        const net = emp.salary * 0.9;
        try { await new Payroll({ user: emp._id, organization: org2._id, month: m + 1, year: py, baseSalary: emp.salary, deductions: { leave: 0, tax: parseFloat((emp.salary * 0.1).toFixed(2)), other: 0 }, bonuses: { performance: 0, festival: 0, other: 0 }, totalDeductions: parseFloat((emp.salary * 0.1).toFixed(2)), totalBonuses: 0, netSalary: parseFloat(net.toFixed(2)), paymentStatus: offset === 0 ? 'pending' : 'paid', paymentDate: offset === 0 ? null : new Date(py, m, 28), generatedBy: org2HR[0]._id }).save(); org2PayrollCount++; } catch (_) {}
      }
    }
    console.log(`✓ MediCare Hospital: ${org2HR.length + org2Emps.length} users, ${org2AttCount} attendance, ${org2PayrollCount} payroll`);

    // ============================================================
    // ORGANIZATION 3: EduPrime Academy (Education)
    // ============================================================
    console.log('\n🏢 [3/4] Creating EduPrime Academy...');
    const org3 = new Organization({
      name: 'EduPrime Academy', slug: 'eduprime-academy', email: 'admin@eduprime.com',
      phone: '+91-9876600001', address: 'Hyderabad, Telangana, India', website: 'https://eduprime.com',
      industry: 'Education', employeeCount: '11-50',
      subscription: { plan: 'starter', startDate: new Date(), endDate: new Date(new Date().setFullYear(currentYear + 1)), maxEmployees: 50 },
      settings: { fiscalYearStart: 6, workingDays: ['Mon','Tue','Wed','Thu','Fri'], shiftStartTime: '08:30', shiftEndTime: '17:00', lateThresholdMinutes: 10, currency: 'INR', dateFormat: 'DD/MM/YYYY' },
    });
    await org3.save();

    for (const d of [
      { name: 'Science', code: 'SCI', description: 'Physics, Chemistry, Biology' },
      { name: 'Mathematics', code: 'MATH', description: 'Mathematics & Statistics' },
      { name: 'English', code: 'ENG', description: 'English Language & Literature' },
      { name: 'Administration', code: 'ADM', description: 'School Administration' },
      { name: 'Human Resources', code: 'HR', description: 'HR & Staffing' },
    ]) { await new Department({ ...d, organization: org3._id, isActive: true }).save(); }

    await new Shift({ name: 'School Hours', startTime: '08:30', endTime: '17:00', graceMinutes: 10, isDefault: true, organization: org3._id }).save();

    const org3HR = [];
    const prof = new User({ employeeId: 'EMP0001', name: 'Prof. Lakshmi Devi', email: 'admin@eduprime.com', password: 'admin123', phone: '9876600001', designation: 'Principal', department: 'Administration', salary: 80000, role: 'hr', organization: org3._id, joiningDate: new Date('2015-06-01'), address: 'Hyderabad, India', status: 'active' });
    await prof.save(); org3HR.push(prof);
    org3.createdBy = prof._id; await org3.save();

    const org3Emps = [];
    for (const d of [
      { employeeId: 'EMP0002', name: 'Mr. Sudhir Babu',  email: 'sudhir@eduprime.com', password: 'employee123', phone: '9876600002', department: 'Science',       designation: 'Science Teacher', salary: 45000, joiningDate: new Date('2018-07-01') },
      { employeeId: 'EMP0003', name: 'Mrs. Padma Reddy', email: 'padma@eduprime.com',  password: 'employee123', phone: '9876600003', department: 'Mathematics',    designation: 'Maths Teacher',   salary: 42000, joiningDate: new Date('2019-07-15') },
      { employeeId: 'EMP0004', name: 'Mr. Aryan Kapoor', email: 'aryan@eduprime.com',  password: 'employee123', phone: '9876600004', department: 'English',        designation: 'English Teacher', salary: 40000, joiningDate: new Date('2020-06-01') },
      { employeeId: 'EMP0005', name: 'Ms. Rekha Mishra', email: 'rekha@eduprime.com',  password: 'employee123', phone: '9876600005', department: 'Administration', designation: 'Admin Clerk',     salary: 32000, joiningDate: new Date('2022-01-10') },
    ]) { const u = new User({ ...d, role: 'employee', organization: org3._id, address: 'Hyderabad, India', status: 'active' }); await u.save(); org3Emps.push(u); }

    await new Holiday({ name: 'Republic Day',     date: new Date(currentYear, 0, 26), type: 'national', organization: org3._id }).save();
    await new Holiday({ name: 'Teachers Day',     date: new Date(currentYear, 8,  5), type: 'company', description: 'National Teachers Day', organization: org3._id }).save();
    await new Holiday({ name: 'Independence Day', date: new Date(currentYear, 7, 15), type: 'national', organization: org3._id }).save();
    await new Announcement({ title: 'Annual Day Celebration', content: 'Annual Day is on 15th December. All staff must confirm participation.', priority: 'high', targetRoles: ['employee'], createdBy: prof._id, organization: org3._id, isActive: true }).save();

    let org3AttCount = 0;
    for (const emp of org3Emps) {
      for (let i = 15; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth, new Date().getDate() - i);
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        const status = Math.random() > 0.08 ? 'present' : 'absent';
        let checkIn = null, checkOut = null, workHours = 0;
        if (status === 'present') { const ci = new Date(date); ci.setHours(8, 25 + Math.floor(Math.random() * 10), 0, 0); const co = new Date(ci); co.setHours(17, Math.floor(Math.random() * 30), 0, 0); checkIn = ci; checkOut = co; workHours = parseFloat(((co - ci) / 3600000).toFixed(2)); }
        try { await new Attendance({ user: emp._id, organization: org3._id, date: new Date(date.setHours(0,0,0,0)), checkIn, checkOut, status, workHours, markedBy: 'self' }).save(); org3AttCount++; } catch (_) {}
      }
    }
    await new Leave({ user: org3Emps[0]._id, leaveType: 'casual', startDate: new Date(currentYear, currentMonth, 10), endDate: new Date(currentYear, currentMonth, 10), totalDays: 1, reason: 'Personal work', status: 'approved', approvedBy: prof._id, organization: org3._id }).save();
    console.log(`✓ EduPrime Academy: ${org3HR.length + org3Emps.length} users, ${org3AttCount} attendance`);

    // ============================================================
    // ORGANIZATION 4: RetailMax Stores (Retail)
    // ============================================================
    console.log('\n🏢 [4/4] Creating RetailMax Stores...');
    const org4 = new Organization({
      name: 'RetailMax Stores', slug: 'retailmax-stores', email: 'admin@retailmax.com',
      phone: '+91-9876700001', address: 'Delhi, India', website: 'https://retailmax.com',
      industry: 'Retail', employeeCount: '51-200',
      subscription: { plan: 'professional', startDate: new Date(), endDate: new Date(new Date().setFullYear(currentYear + 1)), maxEmployees: 200 },
      settings: { fiscalYearStart: 4, workingDays: ['Mon','Tue','Wed','Thu','Fri','Sat'], shiftStartTime: '09:00', shiftEndTime: '21:00', lateThresholdMinutes: 15, currency: 'INR', dateFormat: 'DD/MM/YYYY' },
    });
    await org4.save();

    for (const d of [
      { name: 'Store Operations', code: 'OPS', description: 'Store Floor & Operations' },
      { name: 'Warehouse', code: 'WH', description: 'Inventory & Warehouse' },
      { name: 'Customer Service', code: 'CS', description: 'Customer Support' },
      { name: 'Finance', code: 'FIN', description: 'Billing & Finance' },
      { name: 'Human Resources', code: 'HR', description: 'HR & Administration' },
    ]) { await new Department({ ...d, organization: org4._id, isActive: true }).save(); }

    await new Shift({ name: 'Morning Shift', startTime: '09:00', endTime: '17:00', graceMinutes: 15, isDefault: true, organization: org4._id }).save();
    await new Shift({ name: 'Evening Shift', startTime: '13:00', endTime: '21:00', graceMinutes: 15, organization: org4._id }).save();

    const org4HR = [];
    const pm4 = new User({ employeeId: 'EMP0001', name: 'Pooja Agarwal', email: 'admin@retailmax.com', password: 'admin123', phone: '9876700001', designation: 'HR Manager', department: 'Human Resources', salary: 75000, role: 'hr', organization: org4._id, joiningDate: new Date('2019-04-01'), address: 'Delhi, India', status: 'active' });
    await pm4.save(); org4HR.push(pm4);
    org4.createdBy = pm4._id; await org4.save();

    const org4Emps = [];
    for (const d of [
      { employeeId: 'EMP0002', name: 'Raju Tiwari',  email: 'raju@retailmax.com',   password: 'employee123', phone: '9876700002', department: 'Store Operations', designation: 'Store Supervisor',    salary: 40000, joiningDate: new Date('2020-05-15') },
      { employeeId: 'EMP0003', name: 'Sonal Verma',  email: 'sonal@retailmax.com',  password: 'employee123', phone: '9876700003', department: 'Customer Service', designation: 'Customer Exec',       salary: 35000, joiningDate: new Date('2021-08-01') },
      { employeeId: 'EMP0004', name: 'Deepak Jain',  email: 'deepak@retailmax.com', password: 'employee123', phone: '9876700004', department: 'Warehouse',        designation: 'Warehouse Incharge',  salary: 38000, joiningDate: new Date('2021-03-20') },
      { employeeId: 'EMP0005', name: 'Kavita Yadav', email: 'kavita@retailmax.com', password: 'employee123', phone: '9876700005', department: 'Finance',          designation: 'Accounts Executive', salary: 45000, joiningDate: new Date('2022-06-01') },
      { employeeId: 'EMP0006', name: 'Mohit Sharma', email: 'mohit@retailmax.com',  password: 'employee123', phone: '9876700006', department: 'Store Operations', designation: 'Sales Associate',     salary: 30000, joiningDate: new Date('2023-01-15') },
    ]) { const u = new User({ ...d, role: 'employee', organization: org4._id, address: 'Delhi, India', status: 'active' }); await u.save(); org4Emps.push(u); }

    await new Holiday({ name: 'Republic Day',     date: new Date(currentYear, 0, 26), type: 'national', organization: org4._id }).save();
    await new Holiday({ name: 'Independence Day', date: new Date(currentYear, 7, 15), type: 'national', organization: org4._id }).save();
    await new Holiday({ name: 'Diwali',           date: new Date(currentYear, 10, 1), type: 'national', organization: org4._id }).save();
    await new Announcement({ title: 'New Incentive Policy', content: 'Top performers receive 5% bonus on monthly target completion.', priority: 'high', targetRoles: ['employee'], createdBy: pm4._id, organization: org4._id, isActive: true }).save();

    let org4AttCount = 0;
    for (const emp of org4Emps) {
      for (let i = 15; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth, new Date().getDate() - i);
        if (date.getDay() === 0) continue;
        const status = Math.random() > 0.1 ? 'present' : 'absent';
        let checkIn = null, checkOut = null, workHours = 0;
        if (status === 'present') { const ci = new Date(date); ci.setHours(9, Math.floor(Math.random() * 20), 0, 0); const co = new Date(ci); co.setHours(17, Math.floor(Math.random() * 30), 0, 0); checkIn = ci; checkOut = co; workHours = parseFloat(((co - ci) / 3600000).toFixed(2)); }
        try { await new Attendance({ user: emp._id, organization: org4._id, date: new Date(date.setHours(0,0,0,0)), checkIn, checkOut, status, workHours, markedBy: 'self' }).save(); org4AttCount++; } catch (_) {}
      }
    }

    await new Leave({ user: org4Emps[0]._id, leaveType: 'casual', startDate: new Date(currentYear, currentMonth, 8), endDate: new Date(currentYear, currentMonth, 9), totalDays: 2, reason: 'Festival', status: 'approved', approvedBy: pm4._id, organization: org4._id }).save();
    await new Leave({ user: org4Emps[1]._id, leaveType: 'sick', startDate: new Date(currentYear, currentMonth, 14), endDate: new Date(currentYear, currentMonth, 14), totalDays: 1, reason: 'Not well', status: 'pending', organization: org4._id }).save();

    let org4PayrollCount = 0;
    for (const emp of org4Emps) {
      const pmo = currentMonth - 1; const pyo = pmo < 0 ? currentYear - 1 : currentYear; const mo = pmo < 0 ? 12 + pmo : pmo;
      const net = emp.salary * 0.92;
      try { await new Payroll({ user: emp._id, organization: org4._id, month: mo + 1, year: pyo, baseSalary: emp.salary, deductions: { leave: 0, tax: parseFloat((emp.salary * 0.08).toFixed(2)), other: 0 }, bonuses: { performance: 0, festival: 0, other: 0 }, totalDeductions: parseFloat((emp.salary * 0.08).toFixed(2)), totalBonuses: 0, netSalary: parseFloat(net.toFixed(2)), paymentStatus: 'paid', paymentDate: new Date(pyo, mo, 28), generatedBy: pm4._id }).save(); org4PayrollCount++; } catch (_) {}
    }
    console.log(`✓ RetailMax Stores: ${org4HR.length + org4Emps.length} users, ${org4AttCount} attendance, ${org4PayrollCount} payroll`);

    // ==================== SUMMARY ====================
    console.log('\n✅ Multi-org seed data created successfully!\n');
    console.log('📊 Organizations Created:');
    console.log(`   1. TechCorp Solutions  — Technology  (${org1HR.length + org1Emps.length} employees)`);
    console.log(`   2. MediCare Hospital   — Healthcare  (${org2HR.length + org2Emps.length} employees)`);
    console.log(`   3. EduPrime Academy    — Education   (${org3HR.length + org3Emps.length} employees)`);
    console.log(`   4. RetailMax Stores    — Retail      (${org4HR.length + org4Emps.length} employees)`);
    console.log('\n🔐 Demo Credentials:');
    console.log('   Super Admin:         superadmin@hrms.com  / superadmin123');
    console.log('\n   --- TechCorp Solutions ---');
    console.log('   HR Admin:            admin@hrms.com       / admin123');
    console.log('   Employee:            rahul@hrms.com       / employee123');
    console.log('\n   --- MediCare Hospital ---');
    console.log('   HR Admin:            admin@medicare.com   / admin123');
    console.log('   Employee:            suresh@medicare.com  / employee123');
    console.log('\n   --- EduPrime Academy ---');
    console.log('   HR Admin:            admin@eduprime.com   / admin123');
    console.log('   Employee:            sudhir@eduprime.com  / employee123');
    console.log('\n   --- RetailMax Stores ---');
    console.log('   HR Admin:            admin@retailmax.com  / admin123');
    console.log('   Employee:            raju@retailmax.com   / employee123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
