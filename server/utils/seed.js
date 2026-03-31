const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await Payroll.deleteMany({});

    // ==================== USER DATA ====================
    console.log('📝 Creating users...');
    
    // Create HR Users
    const hrUsers = [];
    const hrData = [
      {
        employeeId: 'EMP0001',
        name: 'Rajesh Kumar',
        email: 'admin@hrms.com',
        password: 'admin123',
        phone: '9876543210',
        designation: 'HR Manager',
        salary: 85000,
      },
      {
        employeeId: 'EMP0002',
        name: 'Neha Singh',
        email: 'hr@hrms.com',
        password: 'hr123456',
        phone: '9876543220',
        designation: 'HR Executive',
        salary: 60000,
      },
    ];

    for (const data of hrData) {
      const user = new User({
        ...data,
        role: 'hr',
        department: 'Human Resources',
        joiningDate: new Date('2022-01-15'),
        address: 'Mumbai, India',
        status: 'active',
      });
      await user.save();
      hrUsers.push(user);
    }

    // Create Employees
    const employees = [];
    const employeeData = [
      {
        employeeId: 'EMP0003',
        name: 'Rahul Sharma',
        email: 'rahul@hrms.com',
        password: 'employee123',
        phone: '9876543211',
        department: 'Engineering',
        designation: 'Senior Developer',
        salary: 80000,
        joiningDate: new Date('2021-06-01'),
      },
      {
        employeeId: 'EMP0004',
        name: 'Priya Patel',
        email: 'priya@hrms.com',
        password: 'employee123',
        phone: '9876543212',
        department: 'Design',
        designation: 'UI/UX Designer',
        salary: 65000,
        joiningDate: new Date('2022-08-15'),
      },
      {
        employeeId: 'EMP0005',
        name: 'Amit Kumar',
        email: 'amit@hrms.com',
        password: 'employee123',
        phone: '9876543213',
        department: 'Engineering',
        designation: 'Backend Developer',
        salary: 75000,
        joiningDate: new Date('2022-01-10'),
      },
      {
        employeeId: 'EMP0006',
        name: 'Sneha Reddy',
        email: 'sneha@hrms.com',
        password: 'employee123',
        phone: '9876543214',
        department: 'Marketing',
        designation: 'Marketing Manager',
        salary: 70000,
        joiningDate: new Date('2021-03-01'),
      },
      {
        employeeId: 'EMP0007',
        name: 'Vikram Singh',
        email: 'vikram@hrms.com',
        password: 'employee123',
        phone: '9876543215',
        department: 'Engineering',
        designation: 'Frontend Developer',
        salary: 72000,
        joiningDate: new Date('2023-02-15'),
      },
      {
        employeeId: 'EMP0008',
        name: 'Anjali Gupta',
        email: 'anjali@hrms.com',
        password: 'employee123',
        phone: '9876543216',
        department: 'Finance',
        designation: 'Finance Analyst',
        salary: 60000,
        joiningDate: new Date('2023-07-10'),
      },
      {
        employeeId: 'EMP0009',
        name: 'Rohan Desai',
        email: 'rohan@hrms.com',
        password: 'employee123',
        phone: '9876543217',
        department: 'Sales',
        designation: 'Sales Executive',
        salary: 55000,
        joiningDate: new Date('2023-09-01'),
      },
      {
        employeeId: 'EMP0010',
        name: 'Divya Singh',
        email: 'divya@hrms.com',
        password: 'employee123',
        phone: '9876543218',
        department: 'Design',
        designation: 'Graphic Designer',
        salary: 50000,
        joiningDate: new Date('2024-01-15'),
      },
    ];

    for (const data of employeeData) {
      const user = new User({
        ...data,
        role: 'employee',
        address: 'India',
        status: 'active',
      });
      await user.save();
      employees.push(user);
    }

    console.log(`✓ Created ${hrUsers.length} HR users and ${employees.length} employees`);

    // ==================== ATTENDANCE DATA ====================
    console.log('📅 Creating attendance records...');
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let attendanceCount = 0;
    
    // Create attendance for all employees for past 30 days
    for (const emp of employees) {
      for (let i = 30; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth, now.getDate() - i);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const status = Math.random() > 0.15 ? (Math.random() > 0.1 ? 'present' : 'late') : 'absent';
        
        let checkIn = null;
        let checkOut = null;
        let workHours = 0;
        
        if (status !== 'absent') {
          const checkInTime = new Date(date);
          checkInTime.setHours(status === 'late' ? 9 + Math.floor(Math.random() * 2) : 9 + Math.floor(Math.random() * 30) / 60);
          checkInTime.setMinutes(Math.floor(Math.random() * 60));
          
          const checkOutTime = new Date(checkInTime);
          checkOutTime.setHours(checkInTime.getHours() + 8 + Math.floor(Math.random() * 2));
          checkOutTime.setMinutes(Math.floor(Math.random() * 60));
          
          checkIn = checkInTime;
          checkOut = checkOutTime;
          workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
        }
        
        const attendance = new Attendance({
          user: emp._id,
          date: new Date(date.setHours(0, 0, 0, 0)),
          checkIn,
          checkOut,
          status,
          workHours: parseFloat(workHours.toFixed(2)),
          markedBy: 'self',
        });
        
        try {
          await attendance.save();
          attendanceCount++;
        } catch (error) {
          // Skip duplicate entries for same day
        }
      }
    }
    
    console.log(`✓ Created ${attendanceCount} attendance records`);

    // ==================== LEAVE DATA ====================
    console.log('🏖️  Creating leave records...');
    
    let leaveCount = 0;
    
    // Create leaves for employees
    const leaveRequests = [
      {
        user: employees[0]._id,
        leaveType: 'casual',
        startDate: new Date(currentYear, currentMonth, 5),
        endDate: new Date(currentYear, currentMonth, 7),
        totalDays: 3,
        reason: 'Personal work',
        status: 'approved',
        approvedBy: hrUsers[0]._id,
      },
      {
        user: employees[1]._id,
        leaveType: 'sick',
        startDate: new Date(currentYear, currentMonth, 10),
        endDate: new Date(currentYear, currentMonth, 11),
        totalDays: 2,
        reason: 'Medical checkup',
        status: 'approved',
        approvedBy: hrUsers[0]._id,
      },
      {
        user: employees[2]._id,
        leaveType: 'paid',
        startDate: new Date(currentYear, currentMonth + 1, 1),
        endDate: new Date(currentYear, currentMonth + 1, 5),
        totalDays: 5,
        reason: 'Vacation',
        status: 'pending',
      },
      {
        user: employees[3]._id,
        leaveType: 'casual',
        startDate: new Date(currentYear, currentMonth, 15),
        endDate: new Date(currentYear, currentMonth, 15),
        totalDays: 1,
        reason: 'Family meeting',
        status: 'approved',
        approvedBy: hrUsers[0]._id,
      },
      {
        user: employees[4]._id,
        leaveType: 'sick',
        startDate: new Date(currentYear, currentMonth, 20),
        endDate: new Date(currentYear, currentMonth, 21),
        totalDays: 2,
        reason: 'Not feeling well',
        status: 'rejected',
        remarks: 'Insufficient documentation',
        approvedBy: hrUsers[1]._id,
      },
      {
        user: employees[5]._id,
        leaveType: 'casual',
        startDate: new Date(currentYear, currentMonth, 25),
        endDate: new Date(currentYear, currentMonth, 26),
        totalDays: 2,
        reason: 'Birthday celebration',
        status: 'pending',
      },
    ];
    
    for (const leave of leaveRequests) {
      const leaveRecord = new Leave(leave);
      await leaveRecord.save();
      leaveCount++;
      
      // Deduct from balance if approved
      if (leave.status === 'approved') {
        await User.findByIdAndUpdate(leave.user, {
          $inc: { [`leaveBalance.${leave.leaveType}`]: -leave.totalDays },
        });
      }
    }
    
    console.log(`✓ Created ${leaveCount} leave records`);

    // ==================== PAYROLL DATA ====================
    console.log('💰 Creating payroll records...');
    
    let payrollCount = 0;
    
    // Create payroll for current and previous month
    for (const emp of employees) {
      for (let monthOffset = 0; monthOffset <= 2; monthOffset++) {
        const payrollMonth = currentMonth - monthOffset;
        const payrollYear = payrollMonth < 0 ? currentYear - 1 : currentYear;
        const month = payrollMonth < 0 ? 12 + payrollMonth : payrollMonth;
        
        // Calculate deductions based on leaves
        const approvedLeaves = await Leave.find({
          user: emp._id,
          status: 'approved',
          startDate: { $gte: new Date(payrollYear, month - 1, 1) },
          endDate: { $lte: new Date(payrollYear, month, 0) },
        });
        
        const totalLeaveDays = approvedLeaves.reduce((sum, l) => sum + l.totalDays, 0);
        const perDaySalary = emp.salary / 30;
        const leaveDeduction = totalLeaveDays > 2 ? (totalLeaveDays - 2) * perDaySalary : 0;
        const taxDeduction = emp.salary > 50000 ? emp.salary * 0.1 : 0;
        const otherDeduction = Math.floor(Math.random() * 2000);
        
        const totalDeductions = leaveDeduction + taxDeduction + otherDeduction;
        const bonuses = monthOffset === 0 ? Math.floor(Math.random() * 5000) : 0;
        const netSalary = emp.salary - totalDeductions + bonuses;
        
        const payroll = new Payroll({
          user: emp._id,
          month: month + 1,
          year: payrollYear,
          baseSalary: emp.salary,
          deductions: {
            leave: parseFloat(leaveDeduction.toFixed(2)),
            tax: parseFloat(taxDeduction.toFixed(2)),
            other: otherDeduction,
          },
          bonuses: {
            performance: bonuses,
            festival: 0,
            other: 0,
          },
          totalDeductions: parseFloat(totalDeductions.toFixed(2)),
          totalBonuses: bonuses,
          netSalary: parseFloat(netSalary.toFixed(2)),
          paymentStatus: monthOffset === 0 ? 'pending' : 'paid',
          paymentDate: monthOffset === 0 ? null : new Date(payrollYear, month, 28),
          generatedBy: hrUsers[0]._id,
        });
        
        try {
          await payroll.save();
          payrollCount++;
        } catch (error) {
          // Skip duplicate payroll
        }
      }
    }
    
    console.log(`✓ Created ${payrollCount} payroll records`);

    // ==================== SUCCESS ====================
    console.log('\n✅ Seed data created successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • HR Users: ${hrUsers.length}`);
    console.log(`   • Employees: ${employees.length}`);
    console.log(`   • Attendance Records: ${attendanceCount}`);
    console.log(`   • Leave Requests: ${leaveCount}`);
    console.log(`   • Payroll Records: ${payrollCount}`);
    console.log('\n🔐 Demo Credentials:');
    console.log('   HR Admin:   admin@hrms.com / admin123');
    console.log('   Employee:   rahul@hrms.com / employee123');
    console.log('   Employee:   priya@hrms.com / employee123');
    console.log('   Employee:   amit@hrms.com / employee123');
    console.log('   Employee:   sneha@hrms.com / employee123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
