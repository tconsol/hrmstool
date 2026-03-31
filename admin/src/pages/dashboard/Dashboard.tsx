import { useAuth } from '../../context/AuthContext';
import HRDashboard from './HRDashboard';
import EmployeeDashboard from './EmployeeDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  return user?.role === 'hr' ? <HRDashboard /> : <EmployeeDashboard />;
};

export default Dashboard;
