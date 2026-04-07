export interface Organization {
  _id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  website: string;
  industry: string;
  employeeCount: string;
  subscription: {
    plan: string;
    startDate: string;
    endDate: string;
    maxEmployees: number;
  };
  settings: {
    fiscalYearStart: number;
    workingDays: string[];
    shiftStartTime: string;
    shiftEndTime: string;
    lateThresholdMinutes: number;
    currency: string;
    dateFormat: string;
    leavePolicy: {
      casual: number;
      sick: number;
      paid: number;
    };
  };
  isActive: boolean;
  createdAt: string;
}

export interface User {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: 'hr' | 'manager' | 'ceo' | 'employee' | 'superadmin';
  department: string | { _id: string; name: string; code?: string };
  designation: string | { _id: string; name: string; code?: string; level?: string };
  salary: number;
  organization: Organization | string;
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

export interface Department {
  _id: string;
  name: string;
  code: string;
  description: string;
  head: User | string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Holiday {
  _id: string;
  name: string;
  date: string;
  type: 'national' | 'company' | 'optional';
  description: string;
  createdAt: string;
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetRoles: string[];
  isActive: boolean;
  expiresAt: string | null;
  createdBy: User | string;
  createdAt: string;
}

export interface Expense {
  _id: string;
  employee: User | string;
  category: 'travel' | 'food' | 'equipment' | 'office_supplies' | 'training' | 'internet' | 'phone' | 'other';
  amount: number;
  description: string;
  receipt: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  approvedBy: User | string | null;
  remarks: string;
  createdAt: string;
}

export interface Shift {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  isDefault: boolean;
  createdAt: string;
}

export interface Asset {
  _id: string;
  name: string;
  type: 'laptop' | 'phone' | 'monitor' | 'keyboard' | 'mouse' | 'headset' | 'chair' | 'desk' | 'id_card' | 'other';
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseCost: number;
  warrantyExpiry: string;
  assignedTo: User | string | null;
  assignedDate: string | null;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  notes: string;
  createdAt: string;
}

export interface Training {
  _id: string;
  title: string;
  description: string;
  type: 'online' | 'classroom' | 'workshop' | 'certification' | 'onboarding';
  trainer: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  participants: Array<{
    user: User | string;
    status: 'enrolled' | 'completed' | 'dropped';
    enrolledAt: string;
  }>;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdBy: User | string;
  createdAt: string;
}

export interface Designation {
  _id: string;
  name: string;
  code: string;
  description: string;
  level: 'entry' | 'junior' | 'senior' | 'lead' | 'manager' | 'executive';
  organization: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
