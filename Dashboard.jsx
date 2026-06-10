import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Target,
  Activity,
  Clock,
  ShieldAlert,
  Map,
  Brain,
  ArrowRight,
} from 'lucide-react';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import QuickLinkCard from '../components/QuickLinkCard';
import { MODULES } from '../config/modules';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, historyRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/dashboard/history'),
        ]);
        setStats(statsRes.data);
        setHistory(historyRes.data.history || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard. Please sign in again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Loading your learning hub...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 text-center max-w-lg mx-auto my-12 border border-red-500/20">
        <ShieldAlert size={32} className="text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Could not load dashboard</h3>
        <p className="text-slate-400 mb-6">{error}</p>
        <button type="button" onClick={() => window.location.reload()} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${stats?.name || 'Student'}!`}
        description="Track your learning progress. Open any module from the home screen."
        icon={Brain}
        breadcrumbs={[{ label: 'My Dashboard' }]}
      />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-heading m-0">Other modules</h2>
          <Link to="/" className="text-sm font-semibold text-purple-400 hover:text-purple-300">
            ← All modules
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {MODULES.filter((m) => m.id !== 'dashboard').map((mod) => (
            <QuickLinkCard
              key={mod.id}
              to={mod.path}
              title={mod.title}
              description={mod.description}
              icon={mod.icon}
              accent={mod.accent}
              stat={
                mod.id === 'document-chat'
                  ? stats?.documents_uploaded ?? 0
                  : mod.id === 'study-tools'
                    ? stats?.quizzes_taken ?? 0
                    : mod.id === 'resume' && stats?.resume_score != null
                      ? `${Math.round(stats.resume_score)}%`
                      : undefined
              }
              statLabel={
                mod.id === 'document-chat' ? 'docs' : mod.id === 'study-tools' ? 'quizzes' : mod.id === 'resume' ? 'ATS' : undefined
              }
            />
          ))}
        </div>
      </section>

      <div className="stat-grid">
        <div className="glass-card stat-pill">
          <div className="bg-purple-500/10 text-purple-400 p-3 rounded-xl">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="stat-pill-value">{stats?.documents_uploaded || 0}</div>
            <div className="stat-pill-label">Documents studied</div>
          </div>
        </div>
        <div className="glass-card stat-pill">
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl">
            <Target size={24} />
          </div>
          <div>
            <div className="stat-pill-value">{stats?.quizzes_taken || 0}</div>
            <div className="stat-pill-label">Quizzes completed</div>
          </div>
        </div>
        <div className="glass-card stat-pill">
          <div className="bg-sky-500/10 text-sky-400 p-3 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-pill-value">
              {stats?.resume_score != null ? `${Math.round(stats.resume_score)}%` : 'N/A'}
            </div>
            <div className="stat-pill-label">Resume ATS score</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-purple-400" />
              <h2 className="section-heading m-0">Recent activity</h2>
            </div>
            <Link to="/document-chat" className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1">
              Go to Document Chat <ArrowRight size={12} />
            </Link>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Clock size={36} className="mx-auto mb-3 opacity-30" />
              <p className="mb-4">No activity yet. Start your learning journey!</p>
              <Link to="/document-chat" className="btn-primary inline-flex items-center gap-2 text-sm">
                Upload study material
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, index) => (
                <div key={index} className="activity-row glass-card p-4">
                  <div>
                    <span className="activity-badge">{item.mode || 'study'} mode</span>
                    <p className="activity-message">
                      <strong>{item.role}:</strong>{' '}
                      {item.message?.length > 80
                        ? `${item.message.slice(0, 80)}…`
                        : item.message}
                    </p>
                  </div>
                  <time className="activity-time">
                    {item.sent_at
                      ? new Date(item.sent_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </time>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel p-6 space-y-4">
          <h2 className="section-heading m-0">Suggested next steps</h2>

          <Link to="/document-chat" className="next-step-card">
            <BookOpen size={18} className="text-purple-400" />
            <div>
              <strong>Document Chat</strong>
              <span>Upload notes and ask questions</span>
            </div>
            <ArrowRight size={16} />
          </Link>

          <Link to="/study-tools" className="next-step-card">
            <Target size={18} className="text-emerald-400" />
            <div>
              <strong>Quiz & Study Tools</strong>
              <span>Generate quizzes and notes</span>
            </div>
            <ArrowRight size={16} />
          </Link>

          <Link to="/resume" className="next-step-card">
            <FileText size={18} className="text-sky-400" />
            <div>
              <strong>Improve resume</strong>
              <span>Boost ATS compatibility</span>
            </div>
            <ArrowRight size={16} />
          </Link>

          <Link to="/career" className="next-step-card">
            <Map size={18} className="text-amber-400" />
            <div>
              <strong>Plan your career</strong>
              <span>Roadmap + mock interviews</span>
            </div>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
