import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Map, ArrowRight, AlertCircle, RefreshCw, Award, 
  CheckCircle2, Milestone, HelpCircle as QuestionIcon, FileText, BookOpen
} from 'lucide-react';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import AIBanner from '../components/AIBanner';

const CareerRoadmap = () => {
  const [activeSubTab, setActiveSubTab] = useState('roadmap'); // 'roadmap' | 'interview'
  
  // Roadmap form states
  const [skillsInput, setSkillsInput] = useState('');
  const [interests, setInterests] = useState('');
  const [expYears, setExpYears] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiOffline, setAiOffline] = useState(false);

  // Generated Roadmap results
  const [roadmapData, setRoadmapData] = useState(null);

  // Interview Prep states
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [revealedHints, setRevealedHints] = useState({}); // questionIndex -> bool
  const [answers, setAnswers] = useState({}); // questionIndex -> string

  // Placement Tips states
  const [tips, setTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(false);

  // Generate Career Roadmap
  const handleGenerateRoadmap = async (e) => {
    e.preventDefault();
    if (!skillsInput.trim() || loading) return;

    setLoading(true);
    setError('');
    setRoadmapData(null);
    setQuestions([]);
    setTips([]);

    const skillsArray = skillsInput.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const response = await api.post('/api/career/roadmap', {
        skills: skillsArray,
        interests: interests,
        experience_years: Number(expYears)
      });
      setRoadmapData(response.data);
      setAiOffline(response.data.ai_powered === false);
      
      // Auto-trigger placement tips
      fetchPlacementTips(response.data.recommended_path, skillsArray);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to generate learning roadmap.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Placement Tips
  const fetchPlacementTips = async (path, skills) => {
    try {
      setTipsLoading(true);
      const response = await api.post(`/api/career/placement-tips?career_path=${encodeURIComponent(path)}`, skills);
      setTips(response.data.tips || []);
    } catch (err) {
      console.error('Failed to load placement tips', err);
    } finally {
      setTipsLoading(false);
    }
  };

  // Generate Interview Questions
  const handleGenerateInterview = async () => {
    if (!roadmapData) return;
    setQuestionsLoading(true);
    setError('');
    setQuestions([]);
    setRevealedHints({});
    setAnswers({});

    const skillsArray = skillsInput.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const response = await api.post(
        `/api/career/interview-questions?role=${encodeURIComponent(roadmapData.recommended_path)}&difficulty=${difficulty}`,
        skillsArray
      );
      setQuestions(response.data.questions || []);
    } catch (err) {
      console.error(err);
      setError('Could not generate mock interview questions.');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const toggleHint = (idx) => {
    setRevealedHints(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Career Guidance"
        description="Get a personalized learning roadmap, skill gap analysis, and mock interview preparation."
        icon={Map}
        breadcrumbs={[{ label: 'Career Roadmap' }]}
      />

      {aiOffline && <AIBanner powered={false} />}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {!roadmapData ? (
        <form onSubmit={handleGenerateRoadmap} className="glass-panel p-8 max-w-2xl space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Current Skills</label>
            <input 
              type="text" 
              className="glass-input w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-purple-500" 
              placeholder="e.g. HTML, CSS, basic JavaScript, React, Python"
              value={skillsInput}
              onChange={e => setSkillsInput(e.target.value)}
              required 
            />
            <p className="text-xs text-slate-500">Provide comma-separated values (e.g. Python, SQL, C++)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Interests / Focus Area</label>
              <input 
                type="text" 
                className="glass-input w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-purple-500" 
                placeholder="e.g. Web Apps, Data Engineering"
                value={interests}
                onChange={e => setInterests(e.target.value)}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Prior Experience (Years)</label>
              <input 
                type="number" 
                min={0}
                className="glass-input w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-purple-500" 
                value={expYears}
                onChange={e => setExpYears(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-bold shadow-lg"
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" /> Analyzing Skill Overlaps & Roadmaps...
              </>
            ) : (
              'Generate Career Roadmap'
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-8">
          
          {/* Sub Navigation */}
          <div className="flex border-b border-slate-800 gap-2">
            <button
              onClick={() => setActiveSubTab('roadmap')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all ${
                activeSubTab === 'roadmap'
                  ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Milestone size={16} /> Learning Roadmap
            </button>
            
            <button
              onClick={() => setActiveSubTab('interview')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all ${
                activeSubTab === 'interview'
                  ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <QuestionIcon size={16} /> Placement & Interview Prep
            </button>

            <button
              onClick={() => {
                setRoadmapData(null);
                setQuestions([]);
                setTips([]);
              }}
              className="ml-auto text-xs text-red-400 font-semibold px-3 py-1.5 rounded hover:bg-slate-800 transition-all border border-slate-800"
            >
              Reset Roadmap
            </button>
          </div>

          {/* SUBTAB 1: TIMELINE & DETAILS */}
          {activeSubTab === 'roadmap' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Timeline (Left) */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 m-0">
                  <Milestone size={20} className="text-purple-400" /> Week-by-Week Milestones
                </h3>

                {roadmapData.learning_roadmap && roadmapData.learning_roadmap.length > 0 ? (
                  <div className="space-y-4">
                    {roadmapData.learning_roadmap.map((item, idx) => (
                      <div key={idx} className="glass-card p-5 flex gap-5 hover:translate-y-0 hover:bg-slate-800/10 transition-colors">
                        <div className="min-w-[100px] text-sm font-bold text-purple-400 uppercase tracking-wider pt-0.5">
                          {item.week}
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <h4 className="text-base font-bold text-white m-0">{item.topic}</h4>
                          <p className="text-slate-400 text-sm leading-relaxed m-0">{item.resource}</p>
                        </div>
                        <div className="self-center text-slate-500 hover:text-purple-400 transition-colors">
                          <ArrowRight size={20} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No structured timeline generated.</p>
                )}
              </div>

              {/* Path matching info (Right) */}
              <div className="space-y-6">
                
                {/* Insights Panel */}
                <div className="glass-panel p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 m-0">AI Career Insights</h3>
                  
                  <div className="space-y-3.5">
                    <div>
                      <span className="text-xs text-slate-500 uppercase font-semibold">Recommended Career Path</span>
                      <p className="text-lg font-extrabold text-white mt-0.5">{roadmapData.recommended_path}</p>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 uppercase font-semibold">Estimated Study Duration</span>
                      <p className="text-lg font-extrabold text-purple-400 mt-0.5">{roadmapData.estimated_weeks} Weeks</p>
                    </div>
                  </div>
                </div>

                {/* Skill Gaps */}
                <div className="glass-panel p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 m-0">Identify Skill Gaps</h3>
                  
                  {roadmapData.skill_gaps && roadmapData.skill_gaps.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {roadmapData.skill_gaps.map((gap, idx) => (
                        <span key={idx} className="text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                          {gap}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-2 rounded-lg">
                      <CheckCircle2 size={16} /> Fully ready for this role!
                    </div>
                  )}
                </div>

                {/* Certifications */}
                <div className="glass-panel p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 m-0">Recommended Certifications</h3>
                  
                  {roadmapData.certifications && roadmapData.certifications.length > 0 ? (
                    <div className="space-y-3">
                      {roadmapData.certifications.map((cert, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start text-xs text-slate-300 font-medium">
                          <span className="text-sky-400 mt-0.5"><Award size={14} /></span>
                          <span>{cert}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No certificates recommended.</p>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* SUBTAB 2: INTERVIEW PREP & TIPS */}
          {activeSubTab === 'interview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Interview Qs Generator (Left 2/3) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Trigger card */}
                {questions.length === 0 ? (
                  <div className="glass-panel p-8 space-y-5 max-w-xl">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 m-0">
                      <QuestionIcon size={22} className="text-sky-400" /> AI Interview Prep Coach
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Generate a mock interview panel customized to the **{roadmapData.recommended_path}** path and your current skills.
                    </p>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase">Question Difficulty</label>
                      <select 
                        className="glass-input w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none"
                        value={difficulty}
                        onChange={e => setDifficulty(e.target.value)}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <button 
                      onClick={handleGenerateInterview}
                      disabled={questionsLoading}
                      className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-bold shadow-lg"
                    >
                      {questionsLoading ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" /> Structuring Interview Questions...
                        </>
                      ) : (
                        'Generate 8 Custom Questions'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center glass-panel px-6 py-4">
                      <div>
                        <span className="text-xs font-semibold text-sky-400 uppercase">Mock Interview Panel</span>
                        <h4 className="text-lg font-bold text-white m-0">Difficulty: {difficulty.toUpperCase()}</h4>
                      </div>
                      <button 
                        onClick={() => setQuestions([])}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 bg-slate-800 px-3 py-1.5 rounded"
                      >
                        Reset Coach
                      </button>
                    </div>

                    <div className="space-y-4">
                      {questions.map((q, idx) => (
                        <div key={idx} className="glass-panel p-5 space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <span className="capitalize text-xs font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              {q.type} Question
                            </span>
                            <button
                              onClick={() => toggleHint(idx)}
                              className="text-xs font-semibold text-sky-400 hover:text-sky-300 underline bg-none border-none cursor-pointer"
                            >
                              {revealedHints[idx] ? 'Hide Hint' : 'Show Answer Hint'}
                            </button>
                          </div>
                          
                          <h4 className="text-base font-bold text-white m-0 leading-relaxed">
                            {idx + 1}. {q.question}
                          </h4>

                          {revealedHints[idx] && (
                            <div className="p-3 bg-sky-500/5 border border-sky-500/10 rounded-lg text-xs text-sky-300 leading-relaxed">
                              <strong>Hint:</strong> {q.hint}
                            </div>
                          )}

                          <textarea
                            rows={3}
                            className="glass-input w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 text-sm focus:outline-none focus:border-purple-500"
                            placeholder="Draft your answer outline here..."
                            value={answers[idx] || ''}
                            onChange={e => setAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Placement Tips Dashboard (Right 1/3) */}
              <div className="space-y-6">
                <div className="glass-panel p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 m-0">Placement Prep Tips</h3>
                  
                  {tipsLoading ? (
                    <div className="flex items-center gap-2 text-slate-500 text-xs italic py-4">
                      <span className="w-4 h-4 border-2 border-slate-500/20 border-t-slate-500 rounded-full animate-spin"></span>
                      Evaluating placement guidelines...
                    </div>
                  ) : tips.length > 0 ? (
                    <div className="space-y-4">
                      {tips.map((tip, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start text-xs text-slate-300 leading-relaxed">
                          <span className="text-purple-400 mt-0.5"><CheckCircle2 size={14} /></span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No placement tips available.</p>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {roadmapData && (
        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800">
          <Link to="/resume" className="btn-secondary text-sm py-2 px-4 inline-flex items-center gap-2">
            <FileText size={14} /> Optimize resume
          </Link>
          <Link to="/study-tools?tab=quiz" className="btn-secondary text-sm py-2 px-4 inline-flex items-center gap-2">
            <BookOpen size={14} /> Practice skills
          </Link>
          <Link to="/" className="btn-secondary text-sm py-2 px-4 inline-flex items-center gap-2">
            Back to dashboard
          </Link>
        </div>
      )}
    </div>
  );
};

export default CareerRoadmap;
