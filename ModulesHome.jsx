import { Link } from 'react-router-dom';
import { LogOut, Sparkles, ArrowRight } from 'lucide-react';
import { MODULES } from '../config/modules';
import useAuth from '../hooks/useAuth';

const ModulesHome = () => {
  const { user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="modules-home">
      <header className="modules-home-header">
        <div className="modules-home-brand">
          <div className="logo-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h1>AI Learning Assistant</h1>
            <p>Hello, {user?.name || 'Student'} — choose a module to get started</p>
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="btn-secondary modules-logout">
          <LogOut size={16} />
          Logout
        </button>
      </header>

      <section className="modules-grid">
        {MODULES.map((mod, index) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.id}
              to={mod.path}
              className={`module-card glass-card module-card--${mod.accent}`}
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <div className={`module-card-icon module-card-icon--${mod.accent}`}>
                <Icon size={28} />
              </div>
              <div className="module-card-body">
                <span className="module-card-number">Module {index + 1}</span>
                <h2>{mod.title}</h2>
                <p>{mod.description}</p>
              </div>
              <span className="module-card-open">
                Open module <ArrowRight size={16} />
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
};

export default ModulesHome;
