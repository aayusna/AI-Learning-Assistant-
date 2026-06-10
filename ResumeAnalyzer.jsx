import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, CheckCircle, XCircle, 
  Award, ListFilter, AlertCircle, RefreshCw, Map, BookOpen, ArrowRight
} from 'lucide-react';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import AIBanner from '../components/AIBanner';

const ResumeAnalyzer = () => {
  const [result, setResult] = useState(null);
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file || loading) return;

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('target_role', targetRole.trim());

    try {
      const response = await api.post('/api/resume/analyze', formData);
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || err.message || 'An error occurred during resume analysis.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="Resume Analyzer"
        description="Upload your resume for ATS scoring, keyword analysis, and AI-powered improvement tips."
        icon={FileText}
        breadcrumbs={[{ label: 'Resume Analyzer' }]}
      />

      {result?.ai_powered === false && <AIBanner powered={false} />}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {!result ? (
        <form onSubmit={handleAnalyze} className="glass-panel p-8 max-w-2xl space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Upload Resume (PDF, DOCX, TXT)</label>
            <div className="border-2 border-dashed border-slate-700/60 rounded-xl p-8 text-center hover:border-purple-500/60 transition-all bg-slate-950/20 group">
              <input 
                type="file" 
                id="resume" 
                className="hidden" 
                accept=".pdf,.docx,.doc,.txt" 
                onChange={handleFileChange}
                required 
              />
              <label htmlFor="resume" className="cursor-pointer flex flex-col items-center gap-3">
                <div className="bg-purple-500/10 text-purple-400 p-4 rounded-full group-hover:scale-105 transition-transform">
                  <FileText size={28} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">
                    {file ? file.name : 'Select resume file'}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">Supported formats: PDF, DOCX, TXT (Max 10MB)</p>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Target Job Title</label>
            <input 
              type="text" 
              className="glass-input w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-purple-500" 
              placeholder="e.g. Software Engineer, Frontend Developer" 
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-bold shadow-lg"
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" /> Scanning Resume Structure & AI Suggestions...
              </>
            ) : (
              'Analyze Resume'
            )}
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Scores and Section Status */}
          <div className="space-y-6">
            
            {/* Score Card */}
            <div className="glass-panel p-6 text-center flex flex-col items-center justify-center space-y-4">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider m-0">ATS Score</h2>
              
              <div className="relative flex items-center justify-center">
                {/* Outer ring */}
                <div className="w-40 h-40 rounded-full border-[10px] border-slate-800 flex items-center justify-center">
                  <span className="text-4xl font-extrabold text-white">{result.ats_score}%</span>
                </div>
                {/* Semi-glow highlight */}
                <div className={`absolute inset-0 rounded-full blur-xl opacity-10 ${
                  result.ats_score >= 80 ? 'bg-emerald-500' : result.ats_score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}></div>
              </div>

              <p className={`text-sm font-semibold ${
                result.ats_score >= 80 ? 'text-emerald-400' : result.ats_score >= 50 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {result.ats_score >= 80 ? 'Great job! Strong ATS alignment.' : result.ats_score >= 50 ? 'Fair, but requires optimizations.' : 'Critical changes recommended.'}
              </p>
              
              <div className="w-full pt-4 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
                <span>Word Count: {result.word_count || 0}</span>
                <span>Role: {result.target_role || targetRole || 'General'}</span>
              </div>
            </div>

            {/* Structure Checks Card */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">Structure & Sections</h3>
              
              <div className="space-y-3.5">
                {[
                  { name: 'Contact Information', status: result.has_contact_info },
                  { name: 'Education History', status: result.has_education },
                  { name: 'Work Experience', status: result.has_experience },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 font-medium">{item.name}</span>
                    {item.status ? (
                      <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle size={14} /> Found
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded-full">
                        <XCircle size={14} /> Missing
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Column 2 & 3: Keywords & AI Feedback */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Keywords Analysis */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 m-0">
                <ListFilter size={20} className="text-purple-400" /> Keyword & Tech Skills Analysis
              </h3>
              
              <div className="space-y-4">
                {/* Matched */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Matched Core Keywords</h4>
                  {result.matched_keywords && result.matched_keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.matched_keywords.map((kw, idx) => (
                        <span key={idx} className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No matched key software terms detected.</p>
                  )}
                </div>

                {/* Missing */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Recommended Keywords Gaps</h4>
                  {result.missing_keywords && result.missing_keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.missing_keywords.map((kw, idx) => (
                        <span key={idx} className="text-xs font-semibold bg-slate-900 text-slate-400 border border-slate-800 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                          {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-emerald-400 italic">Excellent! You have hit all target software requirements.</p>
                  )}
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 m-0">
                <Award size={20} className="text-sky-400" /> AI Improvement Suggestions
              </h3>
              
              <div className="space-y-3">
                {result.suggestions && result.suggestions.length > 0 ? (
                  result.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="flex gap-3.5 items-start p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl">
                      <div className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-xs font-bold mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed m-0">{suggestion}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic">No custom recommendations generated.</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-4 pt-2">
              <button 
                type="button"
                className="btn-secondary flex items-center gap-2 py-2.5 px-6 font-semibold"
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  setTargetRole('');
                }}
              >
                Analyze Another Resume
              </button>

              <div className="flex flex-wrap gap-3">
                <Link to="/career" className="btn-primary text-sm py-2.5 px-5 inline-flex items-center gap-2">
                  Build career roadmap <ArrowRight size={14} />
                </Link>
                <Link to="/study-tools?tab=quiz" className="btn-secondary text-sm py-2.5 px-5 inline-flex items-center gap-2">
                  <BookOpen size={14} /> Practice with quiz
                </Link>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzer;
