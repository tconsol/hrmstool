// Feature key → route path mapping for sidebar/route gating
// Must stay in sync with server/config/features.js

export const FEATURE_ROUTE_MAP: Record<string, string[]> = {
  dashboard: ['/dashboard'],
  employees: ['/employees', '/employees/add', '/employees/edit'],
  attendance: ['/attendance', '/my-attendance'],
  leaves: ['/leaves', '/my-leaves'],
  payroll: ['/payroll', '/my-salary'],
  documents: ['/documents', '/documents/create'],
  departments: ['/departments'],
  designations: ['/designations'],
  holidays: ['/holidays'],
  announcements: ['/announcements'],
  expenses: ['/expenses', '/my-expenses'],
  shifts: ['/shifts'],
  assets: ['/assets', '/my-assets'],
  training: ['/training'],
  calendar: ['/calendar'],
  notifications: ['/notifications'],
  organization: ['/organization'],
  profile: ['/profile'],
};

// Sidebar link path → feature key (reverse mapping)
export const ROUTE_FEATURE_MAP: Record<string, string> = {};
for (const [feature, routes] of Object.entries(FEATURE_ROUTE_MAP)) {
  for (const route of routes) {
    ROUTE_FEATURE_MAP[route] = feature;
  }
}
