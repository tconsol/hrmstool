import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import SuperAdminLayout from './components/Layout/SuperAdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/dashboard/Dashboard';
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeForm from './pages/employees/EmployeeForm';
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
import OrganizationSettings from './pages/organization/OrganizationSettings';

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
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
                  <EmployeeList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/add"
              element={
                <ProtectedRoute roles={['hr']}>
                  <EmployeeForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/edit/:id"
              element={
                <ProtectedRoute roles={['hr']}>
                  <EmployeeForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id/documents"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <EmployeeDocuments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <AttendanceDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaves"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <LeaveRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <PayrollDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute roles={['hr']}>
                  <DocumentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents/create"
              element={
                <ProtectedRoute roles={['hr']}>
                  <DocumentCreate />
                </ProtectedRoute>
              }
            />

            {/* New Feature Routes (hr, ceo) */}
            <Route
              path="/departments"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <DepartmentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/designations"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <DesignationList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/holidays"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <HolidayList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <AnnouncementList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute roles={['hr', 'manager', 'ceo']}>
                  <ExpenseManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shifts"
              element={
                <ProtectedRoute roles={['hr']}>
                  <ShiftList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets"
              element={
                <ProtectedRoute roles={['hr']}>
                  <AssetList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organization"
              element={
                <ProtectedRoute roles={['hr', 'ceo']}>
                  <OrganizationSettings />
                </ProtectedRoute>
              }
            />

            {/* Employee Routes */}
            <Route path="/my-attendance" element={<MyAttendance />} />
            <Route path="/my-leaves" element={<MyLeaves />} />
            <Route path="/my-salary" element={<MySalary />} />
            <Route path="/my-expenses" element={<MyExpenses />} />
            <Route path="/my-assets" element={<MyAssets />} />
            <Route path="/training" element={<TrainingList />} />
            <Route path="/profile" element={<MyProfile />} />

            {/* Notifications — all roles */}
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Calendar — all roles, HR can edit */}
            <Route path="/calendar" element={<CompanyCalendar />} />
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
  );
}

export default App;
