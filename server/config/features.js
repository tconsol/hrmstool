/**
 * Master list of all features in the HRMS platform.
 * Each key is the feature code stored in Organization.enabledFeatures.
 * 
 * Routes and sidebar items reference these keys to decide visibility.
 */
const FEATURES = {
  dashboard:      { label: 'Dashboard',       description: 'Employee & management dashboards',    default: true  },
  employees:      { label: 'Employees',        description: 'Employee management & profiles',      default: true  },
  attendance:     { label: 'Attendance',        description: 'Check-in / check-out & tracking',     default: true  },
  leaves:         { label: 'Leaves',            description: 'Leave requests & approvals',          default: true  },
  payroll:        { label: 'Payroll',           description: 'Salary processing & payslips',        default: false },
  documents:      { label: 'Documents',         description: 'Offer letters, experience letters',   default: false },
  departments:    { label: 'Departments',       description: 'Department management',               default: true  },
  designations:   { label: 'Designations',      description: 'Designation / role management',       default: true  },
  holidays:       { label: 'Holidays',          description: 'Holiday calendar management',         default: true  },
  announcements:  { label: 'Announcements',     description: 'Company-wide announcements',          default: true  },
  expenses:       { label: 'Expenses',          description: 'Expense claims & approvals',          default: false },
  shifts:         { label: 'Shifts',            description: 'Shift scheduling',                    default: false },
  assets:         { label: 'Assets',            description: 'Asset allocation & tracking',         default: false },
  training:       { label: 'Training',          description: 'Training programs & tracking',        default: false },
  calendar:       { label: 'Calendar',          description: 'Company events calendar',             default: true  },
  notifications:  { label: 'Notifications',     description: 'Notifications centre',                default: true  },
  organization:   { label: 'Organization',      description: 'Organization settings & locations',   default: true  },
  profile:        { label: 'Profile',           description: 'Employee profile management',         default: true  },
};

/** All feature keys */
const ALL_FEATURE_KEYS = Object.keys(FEATURES);

/** Default feature keys for new organizations */
const DEFAULT_FEATURES = ALL_FEATURE_KEYS.filter(k => FEATURES[k].default);

module.exports = { FEATURES, ALL_FEATURE_KEYS, DEFAULT_FEATURES };
