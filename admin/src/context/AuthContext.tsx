import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User } from '../types';

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
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('hrms_token');
        localStorage.removeItem('hrms_user');
        setLoading(false);
        return;
      }
      setToken(savedToken);
      setUser(parsedUser);
      
      // Validate that user still exists in database
      api.get('/auth/me')
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
          console.log('User validation failed:', error);
          localStorage.removeItem('hrms_token');
          localStorage.removeItem('hrms_user');
          setToken(null);
          setUser(null);
        });
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: authToken, user: authUser } = response.data;

    localStorage.setItem('hrms_token', authToken);
    localStorage.setItem('hrms_user', JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);

    // Immediately fetch fresh user data with signed URLs for profile picture
    try {
      const { data: freshUser } = await api.get('/auth/me');
      localStorage.setItem('hrms_user', JSON.stringify(freshUser));
      setUser(freshUser);
      console.log('✅ Profile data fetched immediately after login');
    } catch (error) {
      console.error('Failed to fetch fresh user data after login:', error);
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

    // For super admin, fetch fresh data might not apply, but keeping consistent
    try {
      const { data: freshUser } = await api.get('/auth/me');
      localStorage.setItem('hrms_user', JSON.stringify(freshUser));
      setUser(freshUser);
      console.log('✅ Profile data fetched for super admin');
    } catch (error) {
      // Super admin endpoint might not have /auth/me, continue with initial data
      console.log('Note: Could not refresh super admin profile data');
    }
  };

  const register = async (data: { orgName: string; name: string; email: string; password: string; phone?: string; industry?: string }) => {
    const response = await api.post('/auth/register', data);
    return { organizationId: response.data.organizationId, email: response.data.email };
  };

  const logout = () => {
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_user');
    setToken(null);
    setUser(null);
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
