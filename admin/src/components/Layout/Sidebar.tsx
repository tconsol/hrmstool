import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarOff,
  Wallet,
  UserCircle,
  Bell,
  CalendarDays,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const isHR = user?.role === 'hr';

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    };
  }, [isOpen]);

  const hrLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/employees', label: 'Employees', icon: Users },
    { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/leaves', label: 'Leave Requests', icon: CalendarOff },
    { to: '/payroll', label: 'Payroll', icon: Wallet },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
  ];

  const employeeLinks = [
    { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/my-attendance', label: 'My Attendance', icon: CalendarCheck },
    { to: '/my-leaves', label: 'My Leaves', icon: CalendarOff },
    { to: '/my-salary', label: 'My Salary', icon: Wallet },
    { to: '/profile', label: 'My Profile', icon: UserCircle },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
  ];

  const links = isHR ? hrLinks : employeeLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="modal-overlay z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-dark-800 border-r border-dark-700/50 z-50 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-dark-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">HR</span>
            </div>
            <span className="text-lg font-bold text-white">HRMS</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-dark-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-dark-700/50">
          <p className="text-sm font-medium text-white truncate">{user?.name}</p>
          <p className="text-xs text-dark-400 mt-0.5 capitalize">{user?.role} • {user?.department || 'N/A'}</p>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <link.icon size={20} />
              <span className="text-sm font-medium flex-1">{link.label}</span>
              {link.badge != null && link.badge > 0 && (
                <span className="ml-auto px-1.5 py-0.5 min-w-[20px] text-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {link.badge > 99 ? '99+' : link.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700/50">
          <p className="text-xs text-dark-500 text-center">HRMS v1.0.0</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

