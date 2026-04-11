import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: { _id: string; name: string; employeeId?: string };
  type: 'leave_applied' | 'leave_approved' | 'leave_rejected' | 'general';
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: (page?: number) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  totalPages: number;
  currentPage: number;
  socket: Socket | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Get socket URL from environment or derive from API base URL
const getSocketURL = (): string => {
  const envURL = import.meta.env.VITE_SOCKET_URL;
  if (envURL) return envURL;

  // Derive from API base URL — strip /api suffix to get the server origin
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) {
    try {
      const url = new URL(apiBase);
      return url.origin;
    } catch { /* invalid URL, fall through */ }
  }

  // Fallback: use current origin for production, localhost for dev
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }

  return 'http://localhost:5000';
};

const SOCKET_URL = getSocketURL();

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Connect socket when authenticated
  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { userId: user._id },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      secure: true,
      rejectUnauthorized: false,
      forceNew: false, // Reuse existing connection if available
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log(`✅ WebSocket Connected | Socket ID: ${newSocket.id}`);
    });

    newSocket.on('disconnect', (reason) => {
      console.log(`❌ WebSocket Disconnected | Reason: ${reason}`);
    });

    newSocket.on('connect_error', (error) => {
      console.error(`⚠️ WebSocket Connection Error:`, error.message);
    });

    newSocket.on('error', (error) => {
      console.error(`⚠️ WebSocket Socket Error:`, error);
    });

    newSocket.on('notification', (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
      // Toast popup
      toast(notif.title + '\n' + notif.message.substring(0, 80), {
        icon: notif.type === 'leave_approved' ? '✅' : notif.type === 'leave_rejected' ? '❌' : '🔔',
        duration: 5000,
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', fontSize: '13px', maxWidth: '340px' },
      });
      // Play notification sound
      try {
        const ctx = new AudioContext();
        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        // Two-tone chime: high then low
        [880, 660].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.connect(gainNode);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.2);
        });
      } catch {
        // Audio context blocked — silently skip
      }
      // Dispatch browser custom event so components (attendance, leaves) can react
      window.dispatchEvent(new CustomEvent('hrms:notification', { detail: notif }));
    });

    // Forward live data events as browser custom events so components subscribe independently
    newSocket.on('attendance_update', (payload: unknown) => {
      window.dispatchEvent(new CustomEvent('hrms:attendance_update', { detail: payload }));
    });

    newSocket.on('leave_update', (payload: unknown) => {
      window.dispatchEvent(new CustomEvent('hrms:leave_update', { detail: payload }));
    });

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, token]);

  const fetchNotifications = useCallback(
    async (page = 1) => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await api.get(`/notifications?page=${page}&limit=20`);
        if (page === 1) {
          setNotifications(res.data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...res.data.notifications]);
        }
        setUnreadCount(res.data.unreadCount);
        setTotalPages(res.data.pages);
        setCurrentPage(page);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // Initial fetch when user logs in
  useEffect(() => {
    if (user && token) {
      fetchNotifications(1);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?._id, token, fetchNotifications]);

  // Polling fallback: fetch new notifications every 15s
  // This ensures real-time feel even if WebSocket isn't connected (e.g. Cloud Run multi-instance)
  useEffect(() => {
    if (!user || !token) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get('/notifications?page=1&limit=20');
        const serverUnread = res.data.unreadCount;
        // Only update if there are new unread notifications we don't have
        if (serverUnread !== unreadCount) {
          const serverNotifs: Notification[] = res.data.notifications;
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n._id));
            const newOnes = serverNotifs.filter((n) => !existingIds.has(n._id));
            if (newOnes.length > 0) {
              // Play sound + toast for genuinely new notifications
              newOnes.forEach((notif) => {
                if (!notif.read) {
                  toast(notif.title + '\n' + notif.message.substring(0, 80), {
                    icon: notif.type === 'leave_approved' ? '✅' : notif.type === 'leave_rejected' ? '❌' : '🔔',
                    duration: 5000,
                    style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', fontSize: '13px', maxWidth: '340px' },
                  });
                }
              });
              // Play chime once for the batch
              try {
                const ctx = new AudioContext();
                const gainNode = ctx.createGain();
                gainNode.connect(ctx.destination);
                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
                [880, 660].forEach((freq, i) => {
                  const osc = ctx.createOscillator();
                  osc.connect(gainNode);
                  osc.type = 'sine';
                  osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
                  osc.start(ctx.currentTime + i * 0.15);
                  osc.stop(ctx.currentTime + i * 0.15 + 0.2);
                });
              } catch { /* audio blocked */ }

              return [...newOnes, ...prev];
            }
            return prev;
          });
          setUnreadCount(serverUnread);
        }
      } catch { /* silent */ }
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [user?._id, token, unreadCount]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const notif = notifications.find((n) => n._id === id);
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (notif && !notif.read) setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently fail
    }
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        totalPages,
        currentPage,
        socket,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
