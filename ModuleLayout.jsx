import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft, LogOut, Sparkles } from 'lucide-react';
import { MODULES } from '../config/modules';
import useAuth from '../hooks/useAuth';

const ModuleLayout = () => {
  const location = useLocation();
  const currentModule = MODULES.find((m) => location.pathname.startsWith(m.path));
  const { user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="module-layout">
      <header className="module-topbar glass-panel">
        <Link to="/" className="module-back">
          <ArrowLeft size={18} />
          <span>All Modules</span>
        </Link>

        <div className="module-topbar-title">
          <Sparkles size={16} className="text-purple-400" />
          <span>{currentModule?.title || 'Module'}</span>
        </div>

        <div className="module-topbar-right">
          <span className="module-user-name">{user?.name || 'Student'}</span>
          <button type="button" onClick={handleLogout} className="btn-secondary module-logout-btn">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="module-content">
        <Outlet />
      </main>
    </div>
  );
};

export default ModuleLayout;
