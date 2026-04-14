import { useState } from 'react';
import { useNotifications, Notification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  ChevronRight,
  Loader2,
  Filter,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

type FilterType = 'all' | 'unread';

const typeConfig: Record<
  Notification['type'],
  { label: string; icon: string; color: string; bg: string; dot: string }
> = {
  leave_applied: {
    label: 'Leave Applied',
    icon: '📋',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    dot: 'bg-blue-500',
  },
  leave_approved: {
    label: 'Leave Approved',
    icon: '✅',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    dot: 'bg-emerald-500',
  },
  leave_rejected: {
    label: 'Leave Rejected',
    icon: '❌',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    dot: 'bg-red-500',
  },
  general: {
    label: 'General',
    icon: '🔔',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
    dot: 'bg-brand-500',
  },
};

const filterTabs: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
];

const NotificationsPage = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    totalPages,
    currentPage,
  } = useNotifications();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true; // 'all'
  });

  const handleClick = (notif: Notification) => {
    if (!notif.read) markAsRead(notif._id);
    if (notif.type === 'leave_applied') navigate('/leaves');
    else if (notif.type === 'leave_approved' || notif.type === 'leave_rejected')
      navigate('/my-leaves');
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center">
            <BellRing size={20} className="text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            <p className="text-xs text-dark-400 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-dark-700/60 hover:bg-dark-700 border border-dark-600/60 text-sm text-dark-300 hover:text-white rounded-xl transition-all"
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1.5 custom-scrollbar">
        <Filter size={14} className="text-dark-500 flex-shrink-0 mr-1" />
        {filterTabs.map((tab) => {
          const count =
            tab.key === 'unread'
              ? unreadCount
              : notifications.length;

          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                filter === tab.key
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-dark-700/50 text-dark-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    filter === tab.key ? 'bg-white/20' : 'bg-dark-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications list */}
      {loading && notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="text-brand-400 animate-spin mb-3" />
          <p className="text-dark-400 text-sm">Loading notifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-dark-400">
          <Bell size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium text-dark-300">No notifications</p>
          <p className="text-sm mt-1">
            {filter !== 'all' ? 'No notifications match this filter.' : "You're all caught up!"}
          </p>
        </div>
      ) : (
        <div className="space-y-0 bg-dark-800 border border-dark-700/50 rounded-2xl overflow-hidden">
          {filtered.map((notif, idx) => {
            const cfg = typeConfig[notif.type] ?? typeConfig.general;
            return (
              <div
                key={notif._id}
                className={`group relative flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors border-b border-dark-700/40 last:border-0 ${
                  notif.read
                    ? 'hover:bg-dark-700/20'
                    : 'bg-brand-500/[0.04] hover:bg-brand-500/[0.08]'
                }`}
                onClick={() => handleClick(notif)}
              >
                {/* Unread bar */}
                {!notif.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-500 rounded-r-full" />
                )}

                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center text-lg relative`}
                  >
                    {cfg.icon}
                    {!notif.read && (
                      <span
                        className={`absolute -top-1 -right-1 w-3 h-3 ${cfg.dot} rounded-full border-2 border-dark-800`}
                      />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm font-semibold leading-snug ${
                        notif.read ? 'text-dark-300' : 'text-white'
                      }`}
                    >
                      {notif.title}
                    </p>
                    <span className="flex-shrink-0 text-[10px] text-dark-500 mt-0.5">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-dark-400 mt-1 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-dark-600">
                      {format(new Date(notif.createdAt), 'dd MMM yyyy, h:mm a')}
                    </span>
                    {notif.sender && (
                      <span className="text-[10px] text-dark-500">
                        from {notif.sender.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                      className="p-1.5 text-dark-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                      title="Mark as read"
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                    className="p-1.5 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={14} className="text-dark-600" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {currentPage < totalPages && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => fetchNotifications(currentPage + 1)}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-dark-700/60 hover:bg-dark-700 border border-dark-600/60 text-sm text-dark-300 hover:text-white rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Load more
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
