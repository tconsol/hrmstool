import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useState, useEffect, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Briefcase,
  User,
  Building2,
  CalendarHeart,
  Megaphone,
  Receipt,
  Clock,
  Monitor,
  GraduationCap,
  Settings,
  Search,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface LinkItem {
  to: string;
  label: string;
  icon: any;
  badge?: number;
}

interface LinkGroup {
  label: string;
  icon: any;
  links: LinkItem[];
}

type SidebarItem = LinkItem | LinkGroup;

function isGroup(item: SidebarItem): item is LinkGroup {
  return 'links' in item;
}

const Sidebar = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const isManagement = ['hr', 'manager', 'ceo'].includes(user?.role ?? '');
  const isHROnly = user?.role === 'hr';
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ 'My Space': true });
  const [search, setSearch] = useState('');

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

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

  const hrItems: SidebarItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      label: 'Management',
      icon: Briefcase,
      links: [
        { to: '/employees', label: 'Employees', icon: Users },
        { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
        { to: '/leaves', label: 'Leave Requests', icon: CalendarOff },
        { to: '/payroll', label: 'Payroll', icon: Wallet },
        { to: '/documents', label: 'Documents', icon: FileText },
        { to: '/departments', label: 'Departments', icon: Building2 },
        { to: '/designations', label: 'Designations', icon: Layers },
        { to: '/holidays', label: 'Holidays', icon: CalendarHeart },
        { to: '/announcements', label: 'Announcements', icon: Megaphone },
        { to: '/expenses', label: 'Expenses', icon: Receipt },
        { to: '/shifts', label: 'Shifts', icon: Clock },
        { to: '/assets', label: 'Assets', icon: Monitor },
        { to: '/training', label: 'Training', icon: GraduationCap },
      ],
    },
    {
      label: 'My Space',
      icon: User,
      links: [
        { to: '/my-attendance', label: 'My Attendance', icon: CalendarCheck },
        { to: '/my-leaves', label: 'My Leaves', icon: CalendarOff },
        { to: '/my-salary', label: 'My Salary', icon: Wallet },
        { to: '/my-expenses', label: 'My Expenses', icon: Receipt },
        { to: '/my-assets', label: 'My Assets', icon: Monitor },
        { to: '/profile', label: 'My Profile', icon: UserCircle },
      ],
    },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { to: '/organization', label: 'Organization', icon: Settings },
  ];

  const managerItems: SidebarItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      label: 'Management',
      icon: Briefcase,
      links: [
        { to: '/employees', label: 'Employees', icon: Users },
        { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
        { to: '/leaves', label: 'Leave Requests', icon: CalendarOff },
        { to: '/payroll', label: 'Payroll', icon: Wallet },
        { to: '/departments', label: 'Departments', icon: Building2 },
        { to: '/designations', label: 'Designations', icon: Layers },
        { to: '/holidays', label: 'Holidays', icon: CalendarHeart },
        { to: '/announcements', label: 'Announcements', icon: Megaphone },
        { to: '/expenses', label: 'Expenses', icon: Receipt },
        { to: '/training', label: 'Training', icon: GraduationCap },
      ],
    },
    {
      label: 'My Space',
      icon: User,
      links: [
        { to: '/my-attendance', label: 'My Attendance', icon: CalendarCheck },
        { to: '/my-leaves', label: 'My Leaves', icon: CalendarOff },
        { to: '/my-salary', label: 'My Salary', icon: Wallet },
        { to: '/my-expenses', label: 'My Expenses', icon: Receipt },
        { to: '/my-assets', label: 'My Assets', icon: Monitor },
        { to: '/profile', label: 'My Profile', icon: UserCircle },
      ],
    },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
  ];

  const employeeItems: SidebarItem[] = [
    { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    {
      label: 'My Space',
      icon: User,
      links: [
        { to: '/my-attendance', label: 'My Attendance', icon: CalendarCheck },
        { to: '/my-leaves', label: 'My Leaves', icon: CalendarOff },
        { to: '/my-salary', label: 'My Salary', icon: Wallet },
        { to: '/my-expenses', label: 'My Expenses', icon: Receipt },
        { to: '/my-assets', label: 'My Assets', icon: Monitor },
        { to: '/profile', label: 'My Profile', icon: UserCircle },
      ],
    },
    { to: '/training', label: 'Training', icon: GraduationCap },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
  ];

  let items: SidebarItem[] = employeeItems;
  if (user?.role === 'hr') items = hrItems;
  else if (isManagement) items = managerItems;

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    const result: SidebarItem[] = [];
    for (const item of items) {
      if (isGroup(item)) {
        const matched = item.links.filter(l => l.label.toLowerCase().includes(q));
        if (matched.length > 0) result.push({ ...item, links: matched });
      } else {
        if ((item as LinkItem).label.toLowerCase().includes(q)) result.push(item);
      }
    }
    return result;
  }, [items, search]);

  const renderLink = (link: LinkItem, indent = false) => (
    <NavLink
      key={link.to}
      to={link.to}
      onClick={onClose}
      className={({ isActive }) =>
        `sidebar-link ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center p-3' : ''} ${indent && !isCollapsed ? 'pl-10' : ''}`
      }
      title={isCollapsed ? link.label : undefined}
    >
      <link.icon size={18} />
      {!isCollapsed && <span className="text-sm font-medium flex-1">{link.label}</span>}
      {!isCollapsed && link.badge != null && link.badge > 0 && (
        <span className="ml-auto px-1.5 py-0.5 min-w-[20px] text-center bg-red-500 text-white text-[10px] font-bold rounded-full">
          {link.badge > 99 ? '99+' : link.badge}
        </span>
      )}
    </NavLink>
  );

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
        className={`fixed top-0 left-0 h-full bg-dark-800 border-r border-dark-700/50 z-50 
        transform transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto 
        ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-dark-700/50 flex-shrink-0">
          <div className={`flex items-center ${isCollapsed ? 'flex-col' : 'gap-3'}`}>
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">HR</span>
            </div>
            {!isCollapsed && <span className="text-lg font-bold text-white">HRMS</span>}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-white transition-colors"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-1 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={14} />
              <input
                type="text"
                placeholder="Search menu..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-dark-700/50 border border-dark-600/50 rounded-lg text-gray-300 placeholder-dark-500 focus:outline-none focus:border-brand-500/50"
              />
            </div>
          </div>
        )}

        {/* Navigation — scrollable */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'px-2 py-4' : 'px-3 py-4'} space-y-1`}>
          {filteredItems.map((item, idx) => {
            if (isGroup(item)) {
              const expanded = openGroups[item.label] ?? false;
              if (isCollapsed) {
                // In collapsed mode, show sub-links as individual icons
                return item.links.map(link => renderLink(link));
              }
              return (
                <div key={item.label}>
                  {idx > 0 && <div className="my-2 border-t border-dark-700/40" />}
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className="sidebar-link w-full justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-dark-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${expanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    {item.links.map(link => renderLink(link, true))}
                  </div>
                </div>
              );
            }
            return renderLink(item as LinkItem);
          })}
        </nav>

        {/* Bottom section */}
        <div className={`flex-shrink-0 p-4 border-t border-dark-700/50 ${isCollapsed ? 'text-center' : ''}`}>
          <p className="text-xs text-dark-500 text-center">{isCollapsed ? 'v1' : 'HRMS v1.0.0'}</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

