import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import api from '../services/api';
import { User } from '../types';
import { clearAuthCache, bustCache, shouldBustCache, createDebouncedActivityHandler } from '../utils/cacheManager';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  superAdminLogin: (email: string, password: string) => Promise<void>;
  register: (data: { orgName: string; name: string; email: string; password: string; phone?: string; industry?: string }) => Promise<{ organizationId: string; email: string }>;
  logout: () => void;
  loading: boolean;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Set up inactivity timer (1 hour)
   */
  const setupInactivityTimer = () => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    const INACTIVITY_TIME = 60 * 60 * 1000; // 1 hour in milliseconds

    inactivityTimerRef.current = setTimeout(() => {
      logoutWithCacheClear();
      alert('Your session has expired due to inactivity. Please login again.');
    }, INACTIVITY_TIME);
  };

  /**
   * Reset inactivity timer on user activity
   */
  const resetInactivityTimer = () => {
    if (token && user) {
      setupInactivityTimer();
    }
  };

  /**
   * Logout with cache clearing
   */
  const logoutWithCacheClear = async () => {
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_user');
    setToken(null);
    setUser(null);

    // Clear caches
    await clearAuthCache();
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('hrms_token');
    const savedUser = localStorage.getItem('hrms_user');

    // Clear invalid data if it exists
    if (savedUser === 'undefined' || savedUser === 'null' || !savedUser) {
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
      setLoading(false);
      return;
    }

    if (savedToken && savedUser) {
      let parsedUser;
      try {
        parsedUser = JSON.parse(savedUser);
      } catch (error) {
        localStorage.removeItem('hrms_token');
        localStorage.removeItem('hrms_user');
        setLoading(false);
        return;
      }
      setToken(savedToken);
      setUser(parsedUser);
      
      // Setup inactivity timer for logged-in user
      setupInactivityTimer();
      
      // Validate that user still exists in database
      const endpoint = parsedUser.role === 'superadmin' ? '/superadmin/me' : '/auth/me';
      api.get(endpoint)
        .then(({ data }) => {
          if (data && data._id) {
            localStorage.setItem('hrms_user', JSON.stringify(data));
            setUser(data);
          } else {
            // User not found, clear session
            localStorage.removeItem('hrms_token');
            localStorage.removeItem('hrms_user');
            setToken(null);
            setUser(null);
          }
        })
        .catch((error) => {
          // User validation failed (deleted from DB, token expired, etc)
          localStorage.removeItem('hrms_token');
          localStorage.removeItem('hrms_user');
          setToken(null);
          setUser(null);
        });
    }
    setLoading(false);

    // Setup activity listeners for inactivity tracking (debounced)
    const debouncedActivityHandler = createDebouncedActivityHandler(resetInactivityTimer, 1000);
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach((event) => {
      window.addEventListener(event, debouncedActivityHandler, true);
    });

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, debouncedActivityHandler, true);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: authToken, user: authUser } = response.data;

    localStorage.setItem('hrms_token', authToken);
    localStorage.setItem('hrms_user', JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);

    // Setup inactivity timer for new session
    setupInactivityTimer();

    // Bust cache to ensure fresh feature data from latest deployment
    await bustCache();
    // Immediately fetch fresh user data with signed URLs for profile picture
    try {
      const { data: freshUser } = await api.get('/auth/me');
      localStorage.setItem('hrms_user', JSON.stringify(freshUser));
      setUser(freshUser);
    } catch (error) {
      // User state already set, continue with initial login data
    }
  };

  const superAdminLogin = async (email: string, password: string) => {
    const response = await api.post('/superadmin/login', { email, password });
    const { token: authToken, user: authUser } = response.data;

    localStorage.setItem('hrms_token', authToken);
    localStorage.setItem('hrms_user', JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);

    // Setup inactivity timer for new session
    setupInactivityTimer();

    // Bust cache to ensure fresh feature data from latest deployment
    await bustCache();
    // Fetch fresh super admin data
    try {
      const { data: freshUser } = await api.get('/superadmin/me');
      localStorage.setItem('hrms_user', JSON.stringify(freshUser));
      setUser(freshUser);
    } catch (error) {
      // Super admin data already set, continue with initial data
    }
  };

  const register = async (data: { orgName: string; name: string; email: string; password: string; phone?: string; industry?: string }) => {
    const response = await api.post('/auth/register', data);
    return { organizationId: response.data.organizationId, email: response.data.email };
  };

  const logout = async () => {
    await logoutWithCacheClear();
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('hrms_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, superAdminLogin, register, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
