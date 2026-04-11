import { useAuth } from '../../context/AuthContext';
import HRDashboard from './HRDashboard';
import ManagerDashboard from './ManagerDashboard';
import CEODashboard from './CEODashboard';
import EmployeeDashboard from './EmployeeDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (user?.role === 'ceo') {
    return <CEODashboard />;
  }
  if (user?.role === 'manager') {
    return <ManagerDashboard />;
  }
  if (user?.role === 'hr') {
    return <HRDashboard />;
  }
  return <EmployeeDashboard />;
};

export default Dashboard;
