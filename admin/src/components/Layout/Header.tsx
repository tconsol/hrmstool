import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications, Notification } from '../../context/NotificationContext';
import {
  Menu,
  LogOut,
  Bell,
  UserCircle,
  Settings,
  ChevronDown,
  CheckCheck,
  Trash2,
  BellRing,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  onMenuToggle: () => void;
}

const typeStyles: Record<Notification['type'], { dot: string; icon: string }> = {
  leave_applied: { dot: 'bg-blue-500', icon: '📋' },
  leave_approved: { dot: 'bg-emerald-500', icon: '✅' },
  leave_rejected: { dot: 'bg-red-500', icon: '❌' },
  general: { dot: 'bg-brand-500', icon: '🔔' },
};

const Header = ({ onMenuToggle }: HeaderProps) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotifClick = (notif: Notification) => {
    if (!notif.read) markAsRead(notif._id);
    if (notif.type === 'leave_applied') navigate('/leaves');
    else if (notif.type === 'leave_approved' || notif.type === 'leave_rejected')
      navigate('/my-leaves');
  };

  const previewNotifs = notifications.slice(0, 5);

  return (
    <header className="h-16 bg-dark-800/80 backdrop-blur-xl border-b border-dark-700/50 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-dark-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-dark-700/50"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 className="text-xs font-medium text-dark-400">Welcome back</h2>
          <h1 className="text-sm font-semibold text-white leading-tight">{user?.name}</h1>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">

        {/* ── Notification Bell ── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((o) => !o); setUserOpen(false); }}
            className="relative p-2.5 text-dark-400 hover:text-white hover:bg-dark-700/60 rounded-xl transition-all"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-dark-800 border border-dark-700/60 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50">
              {/* Header bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700/50">
                <div className="flex items-center gap-2">
                  <BellRing size={16} className="text-brand-400" />
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-brand-500/20 text-brand-400 text-xs font-semibold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-dark-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                      title="Mark all as read"
                    >
                      <CheckCheck size={13} />
                      <span>All read</span>
                    </button>
                  )}
                  <button
                    onClick={() => { navigate('/notifications'); setNotifOpen(false); }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-dark-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-all"
                  >
                    <ExternalLink size={13} />
                    <span>View all</span>
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                {previewNotifs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-dark-400">
                    <Bell size={32} className="mb-3 opacity-40" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  previewNotifs.map((notif) => {
                    const style = typeStyles[notif.type] ?? typeStyles.general;
                    return (
                      <div
                        key={notif._id}
                        className={`group flex items-start gap-3 px-4 py-3.5 border-b border-dark-700/30 cursor-pointer transition-colors ${
                          notif.read
                            ? 'hover:bg-dark-700/30'
                            : 'bg-dark-700/20 hover:bg-dark-700/40'
                        }`}
                        onClick={() => { handleNotifClick(notif); setNotifOpen(false); }}
                      >
                        {/* Type icon */}
                        <div className="relative flex-shrink-0 mt-0.5">
                          <div className="w-9 h-9 rounded-xl bg-dark-700/60 flex items-center justify-center text-base">
                            {style.icon}
                          </div>
                          {!notif.read && (
                            <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 ${style.dot} rounded-full border-2 border-dark-800`} />
                          )}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${notif.read ? 'text-dark-300' : 'text-white'}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-dark-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-dark-500 mt-1">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </p>
                        </div>

                        {/* Delete btn */}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 5 && (
                <div className="px-4 py-2.5 border-t border-dark-700/50">
                  <button
                    onClick={() => { navigate('/notifications'); setNotifOpen(false); }}
                    className="w-full text-xs text-center text-brand-400 hover:text-brand-300 transition-colors py-1"
                  >
                    See all {notifications.length} notifications →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── User dropdown ── */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setUserOpen((o) => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-dark-700/60 transition-all text-dark-300 hover:text-white"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                {user?.name}
              </p>
              <p className="text-[10px] text-dark-400 capitalize">
                {typeof user?.organization === 'object' && user?.organization
                  ? (user.organization as any).name
                  : user?.role}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`text-dark-500 transition-transform duration-200 ${userOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* User dropdown menu */}
          {userOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-dark-800 border border-dark-700/60 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50">
              {/* Profile summary */}
              <div className="px-4 py-3.5 border-b border-dark-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white font-bold">
                    {user?.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-dark-400 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-1.5">
                <button
                  onClick={() => { navigate('/profile'); setUserOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-dark-300 hover:text-white hover:bg-dark-700/60 transition-all"
                >
                  <UserCircle size={16} className="text-dark-400" />
                  My Profile
                </button>
                <button
                  onClick={() => { navigate('/notifications'); setUserOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-dark-300 hover:text-white hover:bg-dark-700/60 transition-all"
                >
                  <Bell size={16} className="text-dark-400" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { navigate('/profile'); setUserOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-dark-300 hover:text-white hover:bg-dark-700/60 transition-all"
                >
                  <Settings size={16} className="text-dark-400" />
                  Settings
                </button>
              </div>

              {/* Logout */}
              <div className="p-1.5 border-t border-dark-700/50">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

