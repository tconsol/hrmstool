import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTheme } from '../../context/ThemeContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme } = useTheme();

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--theme-bg)' }}
    >
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main
          className="flex-1 overflow-y-auto p-4 lg:p-6"
          style={{ backgroundColor: 'var(--theme-bg)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
