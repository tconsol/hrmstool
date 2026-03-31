import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/dashboard/Dashboard';
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeForm from './pages/employees/EmployeeForm';
import AttendanceDashboard from './pages/attendance/AttendanceDashboard';
import MyAttendance from './pages/attendance/MyAttendance';
import LeaveRequests from './pages/leaves/LeaveRequests';
import MyLeaves from './pages/leaves/MyLeaves';
import PayrollDashboard from './pages/payroll/PayrollDashboard';
import MySalary from './pages/payroll/MySalary';
import MyProfile from './pages/profile/MyProfile';
import NotificationsPage from './pages/notifications/NotificationsPage';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />

            {/* HR Routes */}
            <Route
              path="/employees"
              element={
                <ProtectedRoute roles={['hr']}>
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
              path="/attendance"
              element={
                <ProtectedRoute roles={['hr']}>
                  <AttendanceDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaves"
              element={
                <ProtectedRoute roles={['hr']}>
                  <LeaveRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <ProtectedRoute roles={['hr']}>
                  <PayrollDashboard />
                </ProtectedRoute>
              }
            />

            {/* Employee Routes */}
            <Route path="/my-attendance" element={<MyAttendance />} />
            <Route path="/my-leaves" element={<MyLeaves />} />
            <Route path="/my-salary" element={<MySalary />} />
            <Route path="/profile" element={<MyProfile />} />

            {/* Notifications — all roles */}
            <Route path="/notifications" element={<NotificationsPage />} />
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
