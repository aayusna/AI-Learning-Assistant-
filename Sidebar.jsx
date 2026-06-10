import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  Map,
  LogOut,
  Sparkles,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, description: 'Overview & activity' },
  { name: 'Study Assistant', path: '/study', icon: BookOpen, description: 'Chat, quiz, notes' },
  { name: 'Resume Analyzer', path: '/resume', icon: FileText, description: 'ATS score & tips' },
  { name: 'Career Roadmap', path: '/career', icon: Map, description: 'Roadmap & interviews' },
];

const Sidebar = () => {
  const location = useLocation();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <aside className="sidebar glass-panel">
      <Link to="/" className="sidebar-header">
        <div className="logo-icon">
          <Sparkles size={18} />
        </div>
        <div>
          <h2>Learning Assistant</h2>
          <span className="sidebar-tagline">AI study & career hub</span>
        </div>
      </Link>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={item.description}
            >
              <span className="nav-icon">
                <Icon size={20} />
              </span>
              <span className="nav-text">
                <span className="nav-label">{item.name}</span>
                <span className="nav-sublabel">{item.description}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-user glass-card">
        <div className="sidebar-user-avatar">
          {(user?.name || 'S').charAt(0).toUpperCase()}
        </div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{user?.name || 'Student'}</p>
          <p className="sidebar-user-email">{user?.email || 'Logged in'}</p>
        </div>
      </div>

      <div className="sidebar-footer">
        <button
          type="button"
          onClick={handleLogout}
          className="nav-item logout-btn"
        >
          <span className="nav-icon">
            <LogOut size={20} />
          </span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
