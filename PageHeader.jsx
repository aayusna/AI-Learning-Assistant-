import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const PageHeader = ({ title, description, icon: Icon, breadcrumbs = [] }) => {
  return (
    <header className="page-header">
      {breadcrumbs.length > 0 && (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/" className="breadcrumb-link">
            <Home size={14} />
            <span>Home</span>
          </Link>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.label} className="breadcrumb-segment">
              <ChevronRight size={14} className="breadcrumb-chevron" />
              {crumb.to ? (
                <Link to={crumb.to} className="breadcrumb-link">
                  {crumb.label}
                </Link>
              ) : (
                <span className="breadcrumb-current">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="page-header-main">
        {Icon && (
          <div className="page-header-icon">
            <Icon size={26} />
          </div>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
