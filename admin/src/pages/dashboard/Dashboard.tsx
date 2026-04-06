import { useAuth } from '../../context/AuthContext';
import HRDashboard from './HRDashboard';
import EmployeeDashboard from './EmployeeDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  return ['hr', 'manager', 'ceo'].includes(user?.role ?? '') ? <HRDashboard /> : <EmployeeDashboard />;
};

export default Dashboard;
