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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

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
    });

    newSocket.on('notification', (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
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
