import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ConfirmProvider } from './context/ConfirmContext';
import ProtectedRoute from './components/ProtectedRoute';
import FeatureGate from './components/FeatureGate';
import Layout from './components/Layout/Layout';
import SuperAdminLayout from './components/Layout/SuperAdminLayout';
import ScrollToTop from './components/ScrollToTop';
import Landing from './pages/Landing';
import About from './pages/About';
import PricingDetail from './pages/PricingDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ForgotUsername from './pages/ForgotUsername';
import Dashboard from './pages/dashboard/Dashboard';
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeForm from './pages/employees/EmployeeForm';
import EmployeeDetail from './pages/employees/EmployeeDetail';
import EmployeeDocuments from './pages/employees/EmployeeDocuments';
import AttendanceDashboard from './pages/attendance/AttendanceDashboard';
import MyAttendance from './pages/attendance/MyAttendance';
import LeaveRequests from './pages/leaves/LeaveRequests';
import MyLeaves from './pages/leaves/MyLeaves';
import PayrollDashboard from './pages/payroll/PayrollDashboard';
import MySalary from './pages/payroll/MySalary';
import MyProfile from './pages/profile/MyProfile';
import NotificationsPage from './pages/notifications/NotificationsPage';
import CompanyCalendar from './pages/calendar/CompanyCalendar';
import DocumentList from './pages/documents/DocumentList';
import DocumentCreate from './pages/documents/DocumentCreate';
import DepartmentList from './pages/departments/DepartmentList';
import DesignationList from './pages/designations/DesignationList';
import HolidayList from './pages/holidays/HolidayList';
import AnnouncementList from './pages/announcements/AnnouncementList';
import MyExpenses from './pages/expenses/MyExpenses';
import ExpenseManagement from './pages/expenses/ExpenseManagement';
import ShiftList from './pages/shifts/ShiftList';
import AssetList from './pages/assets/AssetList';
import MyAssets from './pages/assets/MyAssets';
import TrainingList from './pages/training/TrainingList';
import TrainingDetail from './pages/training/TrainingDetail';
import OrganizationSettings from './pages/organization/OrganizationSettings';
import InvoiceList from './pages/invoices/InvoiceList';

// Super Admin Pages
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import OrganizationManagement from './pages/superadmin/OrganizationManagement';
import SubscriptionManagement from './pages/superadmin/SubscriptionManagement';
import RevenueDashboard from './pages/superadmin/RevenueDashboard';
import AuditLog from './pages/superadmin/AuditLog';
import SystemSettings from './pages/superadmin/SystemSettings';

function App() {
  return (
    <ThemeProvider>
    <ConfirmProvider>
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/about" element={<About />} />
            <Route path="/pricing/:tierId" element={<PricingDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-username" element={<ForgotUsername />} />
            <Route path="/superadmin/login" element={<SuperAdminLogin />} />

          {/* Super Admin Routes */}
          <Route
            element={
              <ProtectedRoute roles={['superadmin']}>
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/superadmin/organizations" element={<OrganizationManagement />} />
            <Route path="/superadmin/subscriptions" element={<SubscriptionManagement />} />
            <Route path="/superadmin/revenue" element={<RevenueDashboard />} />
            <Route path="/superadmin/audit-log" element={<AuditLog />} />
            <Route path="/superadmin/settings" element={<SystemSettings />} />
          </Route>

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Management Routes (hr, manager, ceo) */}
            <Route
              path="/employees"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <FeatureGate feature="employees"><EmployeeList /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/add"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <FeatureGate feature="employees"><EmployeeForm /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/edit/:id"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <FeatureGate feature="employees"><EmployeeForm /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo', 'employee']}>
                  <FeatureGate feature="employees"><EmployeeDetail /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id/documents"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <FeatureGate feature="employees"><EmployeeDocuments /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <FeatureGate feature="attendance"><AttendanceDashboard /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaves"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <FeatureGate feature="leaves"><LeaveRequests /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <FeatureGate feature="payroll"><PayrollDashboard /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <FeatureGate feature="documents"><DocumentList /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents/create"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <FeatureGate feature="documents"><DocumentCreate /></FeatureGate>
                </ProtectedRoute>
              }
            />

            {/* New Feature Routes (hr, ceo) */}
            <Route
              path="/departments"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <FeatureGate feature="departments"><DepartmentList /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/designations"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <FeatureGate feature="designations"><DesignationList /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/holidays"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <FeatureGate feature="holidays"><HolidayList /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <FeatureGate feature="announcements"><AnnouncementList /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <FeatureGate feature="expenses"><ExpenseManagement /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/shifts"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <FeatureGate feature="shifts"><ShiftList /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <FeatureGate feature="assets"><AssetList /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/organization"
              element={
                <ProtectedRoute roles={['ceo']}>
                  <FeatureGate feature="organization"><OrganizationSettings /></FeatureGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute roles={['manager', 'ceo']}>
                  <FeatureGate feature="invoices"><InvoiceList /></FeatureGate>
                </ProtectedRoute>
              }
            />

            {/* Employee Routes */}
            <Route path="/my-attendance" element={<FeatureGate feature="attendance"><MyAttendance /></FeatureGate>} />
            <Route path="/my-leaves" element={<FeatureGate feature="leaves"><MyLeaves /></FeatureGate>} />
            <Route path="/my-salary" element={<FeatureGate feature="payroll"><MySalary /></FeatureGate>} />
            <Route path="/my-expenses" element={<FeatureGate feature="expenses"><MyExpenses /></FeatureGate>} />
            <Route path="/my-assets" element={<FeatureGate feature="assets"><MyAssets /></FeatureGate>} />
            <Route path="/training" element={<FeatureGate feature="training"><TrainingList /></FeatureGate>} />
            <Route path="/training/:id" element={<FeatureGate feature="training"><TrainingDetail /></FeatureGate>} />
            <Route path="/profile" element={<MyProfile />} />

            {/* Notifications — all roles */}
            <Route path="/notifications" element={<FeatureGate feature="notifications"><NotificationsPage /></FeatureGate>} />

            {/* Calendar — all roles, HR can edit */}
            <Route path="/calendar" element={<FeatureGate feature="calendar"><CompanyCalendar /></FeatureGate>} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </NotificationProvider>
    </AuthProvider>
    </ConfirmProvider>
    </ThemeProvider>
  );
}

export default App;
