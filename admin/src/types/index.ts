export interface User {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: 'hr' | 'manager' | 'ceo' | 'employee';
  department: string;
  designation: string;
  salary: number;
  ctc: {
    annualCTC: number;
    basic: number;
    hra: number;
    specialAllowance: number;
    conveyanceAllowance: number;
    medicalAllowance: number;
    lta: number;
    epfEmployer: number;
    gratuity: number;
    insurance: number;
    variablePay: number;
    foodCoupons: number;
    transportAllowance: number;
    internetReimbursement: number;
  };
  joiningDate: string;
  address: string;
  avatar: string;
  status: 'active' | 'inactive';
  leaveBalance: {
    casual: number;
    sick: number;
    paid: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  _id: string;
  user: User | string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'not-marked';
  workHours: number;
  notes: string;
  markedBy: 'self' | 'hr';
}

export interface Leave {
  _id: string;
  user: User | string;
  leaveType: 'casual' | 'sick' | 'paid';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: User | string | null;
  remarks: string;
  createdAt: string;
}

export interface Payroll {
  _id: string;
  user: User | string;
  month: number;
  year: number;
  baseSalary: number;
  deductions: {
    leave: number;
    tax: number;
    other: number;
  };
  bonuses: {
    performance: number;
    festival: number;
    other: number;
  };
  totalDeductions: number;
  totalBonuses: number;
  netSalary: number;
  paymentStatus: 'pending' | 'paid' | 'hold';
  paymentDate: string | null;
  payslipPath: string;
  createdAt: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  payrollTotal: number;
  payrollCount: number;
}

export interface EmployeeDashboard {
  todayAttendance: Attendance | null;
  leaveBalance: { casual: number; sick: number; paid: number };
  monthAttendance: number;
  recentLeaves: Leave[];
  latestPayroll: Payroll | null;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pages: number;
  [key: string]: T[] | number;
}
