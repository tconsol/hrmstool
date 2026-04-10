import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  superAdminLogin: (email: string, password: string) => Promise<void>;
  register: (data: { orgName: string; name: string; email: string; password: string; phone?: string; industry?: string }) => Promise<void>;
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

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Fetch fresh user data with populated department/designation
      api.get('/auth/me').then(({ data }) => {
        if (data && data._id) {
          localStorage.setItem('hrms_user', JSON.stringify(data));
          setUser(data);
        }
      }).catch(() => {});
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
  };

  const superAdminLogin = async (email: string, password: string) => {
    const response = await api.post('/superadmin/login', { email, password });
    const { token: authToken, user: authUser } = response.data;

    localStorage.setItem('hrms_token', authToken);
    localStorage.setItem('hrms_user', JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);
  };

  const register = async (data: { orgName: string; name: string; email: string; password: string; phone?: string; industry?: string }) => {
    const response = await api.post('/auth/register', data);
    const { token: authToken, user: authUser } = response.data;

    localStorage.setItem('hrms_token', authToken);
    localStorage.setItem('hrms_user', JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);
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
