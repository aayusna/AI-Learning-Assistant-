import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const steps = [
  { label: 'Dashboard', path: '/' },
  { label: 'Study', path: '/study' },
  { label: 'Resume', path: '/resume' },
  { label: 'Career', path: '/career' },
];

const WorkflowStrip = () => {
  const location = useLocation();

  return (
    <div className="workflow-strip">
      {steps.map((step, index) => {
        const isActive =
          step.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(step.path);

        return (
          <span key={step.path} className="flex items-center gap-2">
            {index > 0 && <ChevronRight size={12} className="workflow-arrow" />}
            <Link
              to={step.path}
              className={`workflow-step ${isActive ? 'active' : ''}`}
            >
              {step.label}
            </Link>
          </span>
        );
      })}
    </div>
  );
};

export default WorkflowStrip;
