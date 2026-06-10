import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const QuickLinkCard = ({
  to,
  title,
  description,
  icon: Icon,
  accent = 'purple',
  stat,
  statLabel,
}) => {
  const accentClass = `quick-card--${accent}`;

  return (
    <Link to={to} className={`quick-card glass-card ${accentClass}`}>
      <div className="quick-card-top">
        <div className={`quick-card-icon ${accentClass}`}>
          {Icon && <Icon size={22} />}
        </div>
        {stat != null && (
          <div className="quick-card-stat">
            <span className="quick-card-stat-value">{stat}</span>
            {statLabel && <span className="quick-card-stat-label">{statLabel}</span>}
          </div>
        )}
      </div>
      <h3 className="quick-card-title">{title}</h3>
      <p className="quick-card-desc">{description}</p>
      <span className="quick-card-cta">
        Open <ArrowRight size={14} />
      </span>
    </Link>
  );
};

export default QuickLinkCard;
