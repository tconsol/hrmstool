import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, Bell, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header = ({ onMenuToggle }: HeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-dark-800/80 backdrop-blur-xl border-b border-dark-700/50 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-dark-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-dark-700/50"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 className="text-sm font-medium text-dark-300">
            Welcome back,
          </h2>
          <h1 className="text-base font-semibold text-white -mt-0.5">
            {user?.name}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 text-dark-400 hover:text-white hover:bg-dark-700/50 rounded-lg transition-all relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="p-2 text-dark-400 hover:text-white hover:bg-dark-700/50 rounded-lg transition-all"
        >
          <UserCircle size={20} />
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all ml-1"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline text-sm">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
