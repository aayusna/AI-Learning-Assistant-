import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Map, Brain, Sparkles } from 'lucide-react';
import api from '../utils/api';

const features = [
  { icon: Brain, title: 'My Dashboard', desc: 'Progress & activity overview' },
  { icon: BookOpen, title: 'Document Chat', desc: 'Ask AI about your PDFs & notes' },
  { icon: BookOpen, title: 'Quiz & Study Tools', desc: 'Quizzes, summaries & notes' },
  { icon: FileText, title: 'Resume Analyzer', desc: 'ATS score & keyword tips' },
  { icon: Map, title: 'Career Roadmap', desc: 'Learning plan & interviews' },
];

const Login = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const [isLogin, setIsLogin] = useState(window.location.pathname === '/login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { email, password }
        : { name, email, password };

      const response = await api.post(endpoint, payload);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (err) {
      console.error(err);
      const fallback = 'Authentication failed. Please try again.';
      const message = err.response?.data?.detail || err.message || fallback;
      if (message === 'Network error or server is unavailable') {
        setError(
          'Network error. Please refresh the page or try again later.'
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page-bg" />

      <div className="login-layout">
        <section className="login-showcase">
          <div className="login-showcase-header">
            <div className="logo-icon login-logo">
              <Sparkles size={22} />
            </div>
            <div>
              <h1>AI Learning Assistant</h1>
              <p>One connected platform for studying, resumes, and career growth.</p>
            </div>
          </div>

          <div className="login-features">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="login-feature-card glass-card">
                  <Icon size={20} className="text-purple-400" />
                  <div>
                    <strong>{f.title}</strong>
                    <span>{f.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="login-flow-hint">
            Sign in → pick one of 5 modules → each opens its own dedicated page.
          </p>
        </section>

        <div className="glass-panel login-form-panel">
          <div className="text-center mb-8">
            <h2 className="login-form-title">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-slate-400 mt-2 text-sm">
              {isLogin
                ? 'Continue where you left off'
                : 'Start your personalized learning journey'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          {token && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg text-center">
              Signed in as {currentUser?.name || currentUser?.email}.
              <button
                type="button"
                onClick={() => navigate('/')}
                className="ml-2 underline"
              >
                Go to app
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                className="glass-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                className="glass-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Get Started'
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            
<button
  type="button"
  onClick={() => {
    setError('');
    if (isLogin) {
      // If we are currently on login, force the UI to switch to signup state
      setIsLogin(false);
    } else {
      // If we are on signup, force the UI to switch to login state
      setIsLogin(true);
    }
  }}
  className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
>
  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
