import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Upload, Send, FileText, Sparkles, Brain, ListChecks, BookOpen, 
  HelpCircle, AlertCircle, CheckCircle2, ChevronRight, RefreshCw
} from 'lucide-react';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import AIBanner from '../components/AIBanner';

const TAB_CONFIG = {
  chat: { id: 'chat', label: 'Document Chat', icon: Sparkles },
  summarize: { id: 'summarize', label: 'Summarize', icon: BookOpen },
  quiz: { id: 'quiz', label: 'Quiz', icon: ListChecks },
  notes: { id: 'notes', label: 'Notes', icon: FileText },
};

const QUICK_PROMPTS = [
  {
    id: 'summarize',
    label: 'Summarize document',
    prompt: 'Summarize the uploaded document in a clear and concise way.',
  },
  {
    id: 'simple',
    label: 'Explain simply',
    prompt: 'Explain the uploaded document in simple terms, as if I were a beginner.',
  },
  {
    id: 'keypoints',
    label: 'List key points',
    prompt: 'List the main key points from the uploaded document.',
  },
  {
    id: 'example',
    label: 'Give an example',
    prompt: 'Give a practical example based on the uploaded document content.',
  },
];

const StudyAssistant = ({ variant = 'full' }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const allowedTabs =
    variant === 'chat'
      ? ['chat']
      : variant === 'tools'
        ? ['summarize', 'quiz', 'notes']
        : ['chat', 'summarize', 'quiz', 'notes'];

  const defaultTab = allowedTabs[0];
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl && allowedTabs.includes(tabFromUrl) ? tabFromUrl : defaultTab;
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = tabFromUrl && allowedTabs.includes(tabFromUrl) ? tabFromUrl : defaultTab;
    setActiveTab(tab);
  }, [tabFromUrl, variant]);

  const switchTab = (tabId) => {
    if (!allowedTabs.includes(tabId)) return;
    setActiveTab(tabId);
    if (variant === 'tools' || variant === 'full') {
      setSearchParams({ tab: tabId });
    }
    setError('');
  };

  const pageMeta = {
    chat: {
      title: 'Document Chat',
      description: 'Upload study material and ask AI questions grounded in your documents.',
      breadcrumb: 'Document Chat',
    },
    tools: {
      title: 'Quiz & Study Tools',
      description: 'Summarize text, generate MCQ quizzes, and create structured study notes.',
      breadcrumb: 'Quiz & Study Tools',
    },
    full: {
      title: 'AI Study Assistant',
      description: 'Upload materials, ask doubts, summarize, and generate quizzes.',
      breadcrumb: 'Study Assistant',
    },
  }[variant];
  
  // Chat state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [chat, setChat] = useState([
    { role: 'ai', text: 'Hello! Upload a syllabus, lecture notes, or PDF document to start studying and asking doubts.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Summarize state
  const [sumText, setSumText] = useState('');
  const [sumLength, setSumLength] = useState('medium');
  const [sumResult, setSumResult] = useState(null);
  const [sumLoading, setSumLoading] = useState(false);

  // Quiz state
  const [quizTopic, setQuizTopic] = useState('');
  const [quizCount, setQuizCount] = useState(5);
  const [quizDiff, setQuizDiff] = useState('medium');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({}); // questionIndex -> selectedIndex
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  // Notes state
  const [notesTopic, setNotesTopic] = useState('');
  const [notesResult, setNotesResult] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);

  // Global Error
  const [error, setError] = useState('');
  const [aiOffline, setAiOffline] = useState(false);

  // Handle Document Upload
  const sendChatMessage = async (messageText) => {
    if (!messageText.trim() || chatLoading) return;

    setChatInput('');
    setChat(prev => [...prev, { role: 'user', text: messageText }]);
    setChatLoading(true);
    setError('');

    try {
      const response = await api.post('/api/chat/ask', {
        message: messageText,
        session_id: sessionId,
        mode: 'study',
      });

      setSessionId(response.data.session_id);
      setAiOffline(response.data.ai_powered === false);
      setChat(prev => [
        ...prev,
        {
          role: 'ai',
          text: response.data.reply,
          sources: response.data.sources,
        },
      ]);
    } catch (err) {
      console.error(err);
      setError('Failed to get response from AI. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post('/api/chat/upload-document', formData);
      setFile(selectedFile);
      setChat(prev => [
        ...prev,
        {
          role: 'ai',
          text: `Successfully processed "${selectedFile.name}" (${response.data.word_count} words). Use the quick actions below or ask any question about it.`,
        },
      ]);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      if (!err.response) {
        setError(
          'A network error occurred. Please refresh the page or try again later.'
        );
      } else if (err.response.status === 401) {
        setError('Unauthorized. Please log in again and retry uploading your document.');
      } else if (detail) {
        setError(detail);
      } else {
        setError(err.message || 'Failed to upload document.');
      }
    } finally {
      setUploading(false);
    }
  };

  // Handle Chat Question
  const handleSendChat = async (e) => {
    e.preventDefault();
    await sendChatMessage(chatInput);
  };

  const handleQuickPrompt = async (prompt) => {
    await sendChatMessage(prompt);
  };

  // Handle Summarize
  const handleSummarize = async (e) => {
    e.preventDefault();
    if (!sumText.trim() || sumLoading) return;

    setSumLoading(true);
    setSumResult(null);
    setError('');

    try {
      const response = await api.post('/api/study/summarize', {
        text: sumText,
        length: sumLength
      });
      setSumResult(response.data);
      setAiOffline(response.data.ai_powered === false);
    } catch (err) {
      console.error(err);
      setError('Summarization failed. Make sure your input text is at least 50 characters.');
    } finally {
      setSumLoading(false);
    }
  };

  // Handle Quiz Generation
  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (!quizTopic.trim() || quizLoading) return;

    setQuizLoading(true);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setError('');

    try {
      const response = await api.post('/api/study/generate-quiz', {
        topic: quizTopic,
        num_questions: Number(quizCount),
        difficulty: quizDiff
      });
      setQuizQuestions(response.data.questions || []);
      setAiOffline(response.data.ai_powered === false);
    } catch (err) {
      console.error(err);
      setError('Could not generate quiz. Please try a different topic.');
    } finally {
      setQuizLoading(false);
    }
  };

  // Handle Notes Generation
  const handleGenerateNotes = async (e) => {
    e.preventDefault();
    if (!notesTopic.trim() || notesLoading) return;

    setNotesLoading(true);
    setNotesResult('');
    setError('');

    try {
      const response = await api.post(`/api/study/generate-notes?topic=${encodeURIComponent(notesTopic)}`);
      setNotesResult(response.data.notes);
      setAiOffline(response.data.ai_powered === false);
    } catch (err) {
      console.error(err);
      setError('Could not generate notes. Please try again.');
    } finally {
      setNotesLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto module-page-inner flex flex-col">
      <PageHeader
        title={pageMeta.title}
        description={pageMeta.description}
        icon={Brain}
        breadcrumbs={[{ label: pageMeta.breadcrumb }]}
      />

      {allowedTabs.length > 1 && (
      <div className="flex border-b border-slate-800 shrink-0 gap-2 overflow-x-auto">
        {allowedTabs.map((tabId) => {
          const tab = TAB_CONFIG[tabId];
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2 shrink-0">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        
        {/* TAB 1: RAG CHAT */}
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {!file ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="upload-area glass-panel p-12 text-center border-dashed border-2 border-slate-700/60 max-w-xl w-full hover:border-purple-500/60 transition-all group duration-300">
                  <input type="file" id="file" hidden onChange={handleUpload} accept=".pdf,.docx,.txt" />
                  <label htmlFor="file" className="cursor-pointer flex flex-col items-center gap-4">
                    <div className="bg-purple-500/15 text-purple-400 p-5 rounded-full shadow-lg group-hover:scale-105 transition-transform duration-300">
                      {uploading ? (
                        <RefreshCw size={36} className="animate-spin" />
                      ) : (
                        <Upload size={36} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {uploading ? 'Processing study material...' : 'Upload Academic Material'}
                      </h3>
                      <p className="text-slate-400 text-sm">Drag and drop or click to upload PDF, DOCX, or TXT</p>
                    </div>
                    <span className="text-xs text-slate-500 mt-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                      Max file size: 10MB
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col glass-panel overflow-hidden">
                {/* Header */}
                <div className="flex flex-col gap-4 px-6 py-4 bg-slate-900 border-b border-slate-800">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <FileText className="text-sky-400" size={20} />
                      <span className="text-white font-bold">{file.name}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setFile(null);
                        setChat([{ role: 'ai', text: 'Hello! Upload a syllabus, lecture notes, or PDF document to start studying and asking doubts.' }]);
                        setSessionId(null);
                      }} 
                      className="text-xs text-red-400 hover:text-red-300 font-semibold px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/15 transition-all"
                    >
                      Remove File
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleQuickPrompt(action.prompt)}
                        disabled={chatLoading}
                        className="text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/80 text-slate-200 hover:bg-purple-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/20">
                  {chat.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-4 rounded-2xl max-w-[80%] leading-relaxed text-sm ${
                        msg.role === 'user' 
                          ? 'bg-purple-600 text-white rounded-tr-none shadow-md' 
                          : 'bg-slate-900/80 text-slate-200 border border-slate-800 rounded-tl-none'
                      }`}>
                        {msg.text}
                        
                        {/* Source grounding indicator */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
                            <p className="font-semibold text-sky-400">Grounded reference context:</p>
                            {msg.sources.map((src, sIdx) => (
                              <p key={sIdx} className="bg-slate-950/50 p-2 rounded text-slate-300 border border-slate-800 italic">
                                "...{src.length > 120 ? src.slice(0, 120) + '...' : src}..."
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm italic">
                      <span className="w-5 h-5 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></span>
                      AI is studying the document to answer...
                    </div>
                  )}
                </div>

                {/* Input box */}
                <form onSubmit={handleSendChat} className="p-4 border-t border-slate-800 bg-slate-900/60 flex gap-3">
                  <input
                    type="text"
                    className="glass-input flex-1 py-2.5 px-4 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
                    placeholder="Ask a question about this document..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                  />
                  <button type="submit" disabled={chatLoading} className="btn-primary flex items-center gap-2 py-2 px-5 text-sm">
                    <Send size={16} /> Send
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SUMMARIZER */}
        {activeTab === 'summarize' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1">
            <div className="glass-panel p-6 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen size={20} className="text-purple-400" /> Study Material Summarizer
              </h2>
              <form onSubmit={handleSummarize} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paste Study Text</label>
                  <textarea
                    rows={12}
                    className="glass-input w-full bg-slate-950/40 border border-slate-800 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 text-sm font-sans"
                    placeholder="Paste textbook sections, notes, or articles here (Min 50 chars)..."
                    value={sumText}
                    onChange={e => setSumText(e.target.value)}
                    required
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Length:</span>
                    <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                      {['short', 'medium', 'detailed'].map(len => (
                        <button
                          type="button"
                          key={len}
                          onClick={() => setSumLength(len)}
                          className={`px-3 py-1 rounded text-xs font-semibold uppercase transition-colors ${
                            sumLength === len ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {len}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button type="submit" disabled={sumLoading} className="btn-primary py-2 px-6 flex items-center gap-2 text-sm">
                    {sumLoading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Summarizing...
                      </>
                    ) : (
                      'Summarize'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Results display */}
            <div className="glass-panel p-6 space-y-6 flex flex-col justify-between">
              {sumLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3">
                  <span className="w-8 h-8 border-3 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></span>
                  <p className="text-slate-400 text-sm italic">Synthesizing detailed study content...</p>
                </div>
              ) : sumResult ? (
                <div className="space-y-5 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-bold text-white pb-3 border-b border-slate-800">Generated Summary</h3>
                    {!sumResult.ai_powered && (
                      <span className="text-xs uppercase tracking-wider text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                        Offline fallback
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-purple-400 tracking-wider mb-1.5">Overview</h4>
                      <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
                        {sumResult.summary}
                      </p>
                    </div>

                    {sumResult.key_points && sumResult.key_points.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase text-sky-400 tracking-wider mb-2">Key Highlights</h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                          {sumResult.key_points.map((point, idx) => (
                            <li key={idx} className="flex gap-2.5 items-start">
                              <span className="text-purple-400 mt-1"><ChevronRight size={14} /></span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 text-center">
                  <HelpCircle size={48} className="opacity-20 mb-3" />
                  <p className="max-w-xs text-sm">Summarize text to display details, outline bullet points, and word counts here.</p>
                </div>
              )}

              {sumResult && (
                <div className="pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-400 font-medium">
                  <span>Input Word Count: {sumResult.word_count || 0}</span>
                  <span>Summarized successfully</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: QUIZ GENERATOR */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            {quizQuestions.length === 0 ? (
              <div className="glass-panel p-8 max-w-xl mx-auto space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ListChecks size={22} className="text-purple-400" /> AI Quiz Generator
                </h2>
                <form onSubmit={handleGenerateQuiz} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Quiz Topic / Lecture Theme</label>
                    <input
                      type="text"
                      className="glass-input w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-purple-500"
                      placeholder="e.g. Operating Systems Processes, React State Hooks..."
                      value={quizTopic}
                      onChange={e => setQuizTopic(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase">Number of Questions</label>
                      <select
                        className="glass-input w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none"
                        value={quizCount}
                        onChange={e => setQuizCount(e.target.value)}
                      >
                        {[3, 5, 10, 15].map(cnt => (
                          <option key={cnt} value={cnt} className="bg-slate-950">{cnt} Questions</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase">Difficulty</label>
                      <select
                        className="glass-input w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none"
                        value={quizDiff}
                        onChange={e => setQuizDiff(e.target.value)}
                      >
                        <option value="easy" className="bg-slate-950">Easy</option>
                        <option value="medium" className="bg-slate-950">Medium</option>
                        <option value="hard" className="bg-slate-950">Hard</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" disabled={quizLoading} className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-bold shadow-lg">
                    {quizLoading ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" /> Structuring Quiz Questions...
                      </>
                    ) : (
                      'Generate Custom MCQ Quiz'
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center glass-panel px-6 py-4">
                  <div>
                    <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Quiz Active</span>
                    <h3 className="text-xl font-bold text-white">{quizTopic}</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setQuizQuestions([]);
                      setQuizAnswers({});
                      setQuizSubmitted(false);
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded"
                  >
                    Reset Quiz
                  </button>
                </div>

                {/* Questions list */}
                <div className="space-y-6">
                  {quizQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="glass-panel p-6 space-y-4">
                      <h4 className="font-bold text-white text-base">
                        Question {qIdx + 1}: {q.question}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = quizAnswers[qIdx] === oIdx;
                          const showResult = quizSubmitted;
                          const isCorrect = oIdx === q.correct_index;
                          
                          let optStyle = 'border-slate-800 bg-slate-950/20 text-slate-300 hover:border-slate-700';
                          if (isSelected) {
                            optStyle = 'border-purple-500 bg-purple-500/10 text-purple-300';
                          }
                          if (showResult) {
                            if (isCorrect) {
                              optStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-300';
                            } else if (isSelected) {
                              optStyle = 'border-red-500 bg-red-500/10 text-red-300';
                            } else {
                              optStyle = 'border-slate-800/40 bg-slate-950/5 text-slate-500 opacity-60 pointer-events-none';
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={quizSubmitted}
                              onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                              className={`text-left p-3.5 border rounded-xl text-sm font-medium transition-all flex items-center justify-between ${optStyle}`}
                            >
                              <span>{opt}</span>
                              {showResult && isCorrect && <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />}
                              {showResult && isSelected && !isCorrect && <XCircle size={16} className="text-red-400 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation displayed when quiz submitted */}
                      {quizSubmitted && (
                        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-sm text-slate-400 leading-relaxed">
                          <strong className="text-slate-300 flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wider">
                            Explanation:
                          </strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Submission button */}
                {!quizSubmitted && (
                  <button 
                    onClick={() => setQuizSubmitted(true)}
                    disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                    className="w-full btn-primary py-3.5 text-base font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Answers & Get Results
                  </button>
                )}

                {/* Score Summary */}
                {quizSubmitted && (
                  <div className="glass-panel p-6 text-center space-y-3">
                    <h3 className="text-2xl font-extrabold text-white">Quiz Score</h3>
                    <p className="text-slate-400">
                      You answered <strong className="text-purple-400 text-lg">{
                        quizQuestions.reduce((acc, q, idx) => acc + (quizAnswers[idx] === q.correct_index ? 1 : 0), 0)
                      }</strong> out of <strong className="text-white text-lg">{quizQuestions.length}</strong> questions correctly!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: NOTES GENERATOR */}
        {activeTab === 'notes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-1 h-full">
            <div className="glass-panel p-6 space-y-4 h-fit">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText size={20} className="text-purple-400" /> Notes Generator
              </h2>
              <form onSubmit={handleGenerateNotes} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Input Target Topic</label>
                  <input
                    type="text"
                    className="glass-input w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-purple-500"
                    placeholder="e.g. Relational vs NoSQL DBs, DNS Resolution Flow..."
                    value={notesTopic}
                    onChange={e => setNotesTopic(e.target.value)}
                    required
                  />
                </div>
                
                <button type="submit" disabled={notesLoading} className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-semibold">
                  {notesLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Structuring Notes...
                    </>
                  ) : (
                    'Generate Study Notes'
                  )}
                </button>
              </form>
            </div>

            {/* Results display */}
            <div className="glass-panel p-6 lg:col-span-2 space-y-4 flex flex-col min-h-[300px]">
              <h3 className="text-lg font-bold text-white pb-3 border-b border-slate-800">Generated Study Notes</h3>
              
              {notesLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3">
                  <span className="w-8 h-8 border-3 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></span>
                  <p className="text-slate-400 text-sm italic">Organizing learning structures and definitions...</p>
                </div>
              ) : notesResult ? (
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="prose prose-invert max-w-none text-slate-300 space-y-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {notesResult}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 text-center">
                  <HelpCircle size={48} className="opacity-20 mb-3" />
                  <p className="max-w-xs text-sm">Enter a topic to generate structured study notes, concepts, and definitions.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Supporting component for incorrect option icon
const XCircle = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

export default StudyAssistant;
