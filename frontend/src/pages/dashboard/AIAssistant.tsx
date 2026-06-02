import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, BookOpen, HelpCircle, GraduationCap, PenTool,
  CheckCircle2, AlertCircle, Award, RefreshCcw, ArrowRight,
  BookOpenCheck, Lightbulb, Check, X, ClipboardList, Target
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { api } from '@/lib/api';

type Tab = 'explain' | 'quiz' | 'lesson-plan' | 'evaluate';

interface ExplainResult {
  explanation: string;
  analogy: string;
  summary: string;
  keyTakeaways: string[];
}

interface QuizQuestion {
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizResult {
  title: string;
  questions: QuizQuestion[];
}

interface LessonPlanResult {
  title: string;
  objectives: string[];
  outline: {
    timeframe: string;
    activity: string;
    description: string;
  }[];
  homework: string;
}

interface EvaluationResult {
  grade: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState<Tab>('explain');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Explain Topic State
  const [explainTopicInput, setExplainTopicInput] = useState('');
  const [explainDepth, setExplainDepth] = useState<'brief' | 'detailed'>('brief');
  const [explainResult, setExplainResult] = useState<ExplainResult | null>(null);

  // 2. Quiz Generator State
  const [quizTopic, setQuizTopic] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [quizCount, setQuizCount] = useState(5);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // 3. Lesson Plan State
  const [lessonSubject, setLessonSubject] = useState('');
  const [lessonTopic, setLessonTopic] = useState('');
  const [lessonSyllabus, setLessonSyllabus] = useState('');
  const [lessonDuration, setLessonDuration] = useState(60);
  const [lessonResult, setLessonResult] = useState<LessonPlanResult | null>(null);

  // 4. Answer Evaluation State
  const [evalQuestion, setEvalQuestion] = useState('');
  const [evalStudentAnswer, setEvalStudentAnswer] = useState('');
  const [evalCriteria, setEvalCriteria] = useState('');
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);

  const handleExplainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explainTopicInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/ai/explain', {
        topic: explainTopicInput,
        depth: explainDepth
      });
      setExplainResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to explain topic. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTopic.trim()) return;
    setLoading(true);
    setError(null);
    setQuizSubmitted(false);
    setUserAnswers({});
    try {
      const res = await api.post('/ai/quiz', {
        topic: quizTopic,
        difficulty: quizDifficulty,
        count: Number(quizCount)
      });
      setQuizResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonSubject.trim() || !lessonTopic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/ai/lesson-plan', {
        subject: lessonSubject,
        topic: lessonTopic,
        syllabus: lessonSyllabus,
        targetDurationMinutes: Number(lessonDuration)
      });
      setLessonResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate lesson plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalQuestion.trim() || !evalStudentAnswer.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/ai/evaluate', {
        questionPrompt: evalQuestion,
        studentAnswer: evalStudentAnswer,
        sampleSolution: evalCriteria || undefined
      });
      setEvalResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to evaluate answer.');
    } finally {
      setLoading(false);
    }
  };

  const getQuizScore = () => {
    if (!quizResult) return { score: 0, percentage: 0 };
    let correctCount = 0;
    quizResult.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });
    return {
      score: correctCount,
      percentage: Math.round((correctCount / quizResult.questions.length) * 100)
    };
  };

  return (
    <DashboardLayout>
      <div className="py-8 px-6 max-w-7xl mx-auto min-h-screen t-bg-base">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-violet-400 font-medium mb-1.5">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span>AI Learning Assistants</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-bone-50 tracking-tight">
              Scholr Study Intelligence
            </h1>
            <p className="text-bone-400 mt-1 max-w-2xl">
              Elevate your understanding with AI tools designed to explain hard concepts, generate custom quizzes, and grade practice answers.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b t-border mb-8 overflow-x-auto scrollbar-none gap-2">
          {[
            { id: 'explain', label: 'Explain Topic', icon: BookOpen },
            { id: 'quiz', label: 'AI Quiz Builder', icon: HelpCircle },
            { id: 'lesson-plan', label: 'Teacher Lesson Planner', icon: GraduationCap },
            { id: 'evaluate', label: 'Descriptive Evaluator', icon: PenTool },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as Tab);
                  setError(null);
                }}
                className={`flex items-center gap-2.5 px-5 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                  active
                    ? 'border-violet-500 text-violet-400 bg-violet-500/5'
                    : 'border-transparent text-bone-400 hover:text-bone-200 hover:bg-white/[0.02]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-violet-400' : 'text-bone-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left / Input form panel */}
          <div className="lg:col-span-5 bg-white/[0.02] border t-border rounded-2xl p-6 backdrop-blur-xl">
            <AnimatePresence mode="wait">
              {activeTab === 'explain' && (
                <motion.form
                  key="explain"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleExplainSubmit}
                  className="space-y-5"
                >
                  <h3 className="text-lg font-semibold text-bone-100 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-violet-400" />
                    Concept Explainer
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-bone-400 mb-1.5">
                      What concept do you want to learn?
                    </label>
                    <input
                      type="text"
                      value={explainTopicInput}
                      onChange={(e) => setExplainTopicInput(e.target.value)}
                      placeholder="e.g. Backpropagation in neural networks"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border t-border text-bone-50 placeholder-bone-500 focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/80 transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-bone-400 mb-1.5">
                      Explanation Depth
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'brief', label: 'Quick Summary' },
                        { id: 'detailed', label: 'Detailed Breakdown' },
                      ].map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setExplainDepth(d.id as any)}
                          className={`py-2.5 rounded-xl border text-xs font-medium transition-all ${
                            explainDepth === d.id
                              ? 'bg-violet-500/10 border-violet-500/80 text-violet-400 font-semibold'
                              : 'bg-transparent border-white/5 text-bone-300 hover:border-white/10'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !explainTopicInput.trim()}
                    className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? (
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Explain Concept</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}

              {activeTab === 'quiz' && (
                <motion.form
                  key="quiz"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleQuizSubmit}
                  className="space-y-5"
                >
                  <h3 className="text-lg font-semibold text-bone-100 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-violet-400" />
                    Interactive Quiz Generator
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-bone-400 mb-1.5">
                      Quiz Topic
                    </label>
                    <input
                      type="text"
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                      placeholder="e.g. Cell Division or Indian Polity UPSC"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border t-border text-bone-50 placeholder-bone-500 focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/80 transition-all text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-bone-400 mb-1.5">
                        Difficulty
                      </label>
                      <select
                        value={quizDifficulty}
                        onChange={(e) => setQuizDifficulty(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border t-border text-bone-200 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                      >
                        <option value="EASY" className="bg-zinc-900">Easy</option>
                        <option value="MEDIUM" className="bg-zinc-900">Medium</option>
                        <option value="HARD" className="bg-zinc-900">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-bone-400 mb-1.5">
                        Number of Qs
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={quizCount}
                        onChange={(e) => setQuizCount(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border t-border text-bone-50 focus:outline-none focus:border-violet-500/80 transition-all text-sm"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !quizTopic.trim()}
                    className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? (
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Generate Quiz</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}

              {activeTab === 'lesson-plan' && (
                <motion.form
                  key="lesson"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleLessonPlanSubmit}
                  className="space-y-5"
                >
                  <h3 className="text-lg font-semibold text-bone-100 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-violet-400" />
                    AI Syllabus Planner
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-bone-400 mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={lessonSubject}
                        onChange={(e) => setLessonSubject(e.target.value)}
                        placeholder="e.g. Physics"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border t-border text-bone-50 placeholder-bone-500 focus:outline-none focus:border-violet-500/80 transition-all text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-bone-400 mb-1.5">
                        Duration (mins)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="240"
                        value={lessonDuration}
                        onChange={(e) => setLessonDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border t-border text-bone-50 focus:outline-none focus:border-violet-500/80 transition-all text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-bone-400 mb-1.5">
                      Topic Title
                    </label>
                    <input
                      type="text"
                      value={lessonTopic}
                      onChange={(e) => setLessonTopic(e.target.value)}
                      placeholder="e.g. Thermodynamics First Law"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border t-border text-bone-50 placeholder-bone-500 focus:outline-none focus:border-violet-500/80 transition-all text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-bone-400 mb-1.5">
                      Syllabus Details / Specific Board
                    </label>
                    <textarea
                      value={lessonSyllabus}
                      onChange={(e) => setLessonSyllabus(e.target.value)}
                      placeholder="e.g. CBSE Grade 11 Physics, focus on work, heat, and internal energy diagrams."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border t-border text-bone-50 placeholder-bone-500 focus:outline-none focus:border-violet-500/80 transition-all text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !lessonSubject.trim() || !lessonTopic.trim()}
                    className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? (
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Generate Lesson Plan</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}

              {activeTab === 'evaluate' && (
                <motion.form
                  key="evaluate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleEvaluationSubmit}
                  className="space-y-5"
                >
                  <h3 className="text-lg font-semibold text-bone-100 flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-violet-400" />
                    Answer Grader & Evaluator
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-bone-400 mb-1.5">
                      Question / Essay Prompt
                    </label>
                    <textarea
                      value={evalQuestion}
                      onChange={(e) => setEvalQuestion(e.target.value)}
                      placeholder="Paste the question or assignment prompt here..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border t-border text-bone-50 placeholder-bone-500 focus:outline-none focus:border-violet-500/80 transition-all text-sm resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-bone-400 mb-1.5">
                      Your Written Answer
                    </label>
                    <textarea
                      value={evalStudentAnswer}
                      onChange={(e) => setEvalStudentAnswer(e.target.value)}
                      placeholder="Type or paste your descriptive answer here..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border t-border text-bone-50 placeholder-bone-500 focus:outline-none focus:border-violet-500/80 transition-all text-sm resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-bone-400 mb-1.5">
                      Grading Criteria / Sample Solution (Optional)
                    </label>
                    <textarea
                      value={evalCriteria}
                      onChange={(e) => setEvalCriteria(e.target.value)}
                      placeholder="e.g. Needs to mention 3 key points: A, B, and C..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border t-border text-bone-50 placeholder-bone-500 focus:outline-none focus:border-violet-500/80 transition-all text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !evalQuestion.trim() || !evalStudentAnswer.trim()}
                    className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? (
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Grade Answer</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Right / Results display panel */}
          <div className="lg:col-span-7 space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-dashed t-border rounded-2xl">
                <RefreshCcw className="w-10 h-10 text-violet-500 animate-spin mb-4" />
                <p className="text-bone-300 font-medium animate-pulse text-sm">Consulting Scholr AI Brain...</p>
                <p className="text-bone-500 text-xs mt-1">This might take up to a few seconds</p>
              </div>
            )}

            {!loading && !error && (
              <div className="min-h-[300px]">
                {/* Explain Results */}
                {activeTab === 'explain' && (
                  <div>
                    {explainResult ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                      >
                        {/* Summary Card */}
                        <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30">
                          <div className="flex items-center gap-2.5 mb-2">
                            <Lightbulb className="w-5 h-5 text-violet-400" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">Quick Summary</span>
                          </div>
                          <p className="text-bone-100 text-base leading-relaxed font-medium">
                            {explainResult.summary}
                          </p>
                        </div>

                        {/* Detailed Breakdown */}
                        <div className="bg-white/[0.02] border t-border rounded-2xl p-6">
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-bone-400 mb-3 flex items-center gap-2">
                            <BookOpenCheck className="w-4 h-4 text-violet-400" />
                            Explanation
                          </h4>
                          <div className="text-bone-200 text-sm leading-relaxed space-y-3 whitespace-pre-line">
                            {explainResult.explanation}
                          </div>
                        </div>

                        {/* Analogy */}
                        <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Real-Life Analogy
                          </h4>
                          <p className="text-bone-100 text-sm leading-relaxed italic">
                            "{explainResult.analogy}"
                          </p>
                        </div>

                        {/* Key Takeaways */}
                        {explainResult.keyTakeaways && explainResult.keyTakeaways.length > 0 && (
                          <div className="bg-white/[0.02] border t-border rounded-2xl p-6">
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-bone-400 mb-3">
                              Key Takeaways
                            </h4>
                            <ul className="space-y-2.5">
                              {explainResult.keyTakeaways.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2.5 text-sm text-bone-200">
                                  <Check className="w-4.5 h-4.5 text-violet-400 flex-shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <PlaceholderCard icon={BookOpen} title="Welcome to Concept Explainer" desc="Type in a query on the left to get a structured explanation, analogies, and key takeaways." />
                    )}
                  </div>
                )}

                {/* Quiz Results */}
                {activeTab === 'quiz' && (
                  <div>
                    {quizResult ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center justify-between border-b t-border pb-4">
                          <h4 className="text-lg font-bold text-bone-100">{quizResult.title}</h4>
                          {quizSubmitted && (
                            <span className="text-xs px-3 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-400 font-semibold">
                              Score: {getQuizScore().score}/{quizResult.questions.length} ({getQuizScore().percentage}%)
                            </span>
                          )}
                        </div>

                        <div className="space-y-5">
                          {quizResult.questions.map((q, qIdx) => {
                            const isCorrect = userAnswers[qIdx] === q.correctAnswer;
                            return (
                              <div key={qIdx} className="p-5 rounded-xl bg-white/[0.02] border t-border space-y-3.5">
                                <p className="text-sm font-medium text-bone-100">
                                  {qIdx + 1}. {q.prompt}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                  {q.options.map((opt, oIdx) => {
                                    const selected = userAnswers[qIdx] === opt;
                                    let btnStyle = "bg-white/[0.02] border-white/5 text-bone-300 hover:bg-white/[0.04]";
                                    if (selected) btnStyle = "bg-violet-500/10 border-violet-500 text-violet-400";
                                    if (quizSubmitted) {
                                      if (opt === q.correctAnswer) {
                                        btnStyle = "bg-emerald-500/10 border-emerald-500/80 text-emerald-400 font-semibold";
                                      } else if (selected && !isCorrect) {
                                        btnStyle = "bg-red-500/10 border-red-500/80 text-red-400";
                                      } else {
                                        btnStyle = "opacity-60 bg-white/[0.01] border-white/5 text-bone-400";
                                      }
                                    }
                                    return (
                                      <button
                                        key={oIdx}
                                        type="button"
                                        disabled={quizSubmitted}
                                        onClick={() => setUserAnswers(prev => ({ ...prev, [qIdx]: opt }))}
                                        className={`px-4 py-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                                      >
                                        <span>{opt}</span>
                                        {quizSubmitted && opt === q.correctAnswer && <Check className="w-4 h-4 text-emerald-400" />}
                                        {quizSubmitted && selected && !isCorrect && <X className="w-4 h-4 text-red-400" />}
                                      </button>
                                    );
                                  })}
                                </div>

                                {quizSubmitted && (
                                  <div className="pt-2 text-xs text-bone-400 border-t border-white/5">
                                    <span className="font-semibold text-violet-400 block mb-1">Explanation:</span>
                                    {q.explanation}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {!quizSubmitted ? (
                          <button
                            onClick={() => setQuizSubmitted(true)}
                            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                          >
                            <BookOpenCheck className="w-4 h-4" />
                            Submit Quiz Answers
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setQuizSubmitted(false);
                              setUserAnswers({});
                              setQuizResult(null);
                            }}
                            className="w-full bg-white/[0.04] border t-border text-bone-300 hover:bg-white/[0.08] font-medium py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                          >
                            <RefreshCcw className="w-4 h-4" />
                            Build a New Quiz
                          </button>
                        )}
                      </motion.div>
                    ) : (
                      <PlaceholderCard icon={HelpCircle} title="Create Practice Quiz" desc="Enter a subject/topic, set difficulty, and get a set of instant-feedback test questions." />
                    )}
                  </div>
                )}

                {/* Lesson Plan Results */}
                {activeTab === 'lesson-plan' && (
                  <div>
                    {lessonResult ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                        <div className="p-6 rounded-2xl bg-white/[0.02] border t-border">
                          <h4 className="text-xl font-bold text-violet-400 mb-4">{lessonResult.title}</h4>

                          <div className="mb-6">
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-bone-400 mb-2.5">Learning Objectives</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {lessonResult.objectives.map((obj, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs text-bone-200">
                                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                                  <span>{obj}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mb-6">
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-bone-400 mb-3">Outline & Timeframes</h5>
                            <div className="space-y-3">
                              {lessonResult.outline.map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                                  <div className="text-xs font-bold text-violet-400 bg-violet-500/10 h-fit px-2 py-1 rounded">
                                    {item.timeframe}
                                  </div>
                                  <div className="flex-1">
                                    <h6 className="text-xs font-bold text-bone-100">{item.activity}</h6>
                                    <p className="text-xs text-bone-300 mt-1">{item.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-bone-400 mb-2">Suggested Homework</h5>
                            <p className="text-xs text-bone-200 leading-relaxed bg-violet-500/5 p-4 rounded-xl border border-violet-500/10">
                              {lessonResult.homework}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <PlaceholderCard icon={GraduationCap} title="Syllabus & Lesson Planner" desc="Input subject, topics, target syllabus details and generate a step-by-step lecture outline." />
                    )}
                  </div>
                )}

                {/* Evaluation Results */}
                {activeTab === 'evaluate' && (
                  <div>
                    {evalResult ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                        {/* Score Gauge */}
                        <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-violet-300 block mb-1">Evaluation Score</span>
                            <span className="text-sm text-bone-300">Graded according to requirements</span>
                          </div>
                          <div className="flex items-baseline gap-1 bg-violet-500/15 border border-violet-500/30 px-5 py-3 rounded-2xl">
                            <span className="text-3xl font-extrabold text-violet-400">{evalResult.grade}</span>
                            <span className="text-xs text-bone-400">/ 10</span>
                          </div>
                        </div>

                        {/* Feedback Details */}
                        <div className="bg-white/[0.02] border t-border rounded-2xl p-6">
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-bone-400 mb-3 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-violet-400" />
                            General Feedback
                          </h4>
                          <p className="text-bone-200 text-sm leading-relaxed whitespace-pre-line">
                            {evalResult.feedback}
                          </p>
                        </div>

                        {/* Strengths & Improvements */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                              <CheckCircle2 className="w-4.5 h-4.5" />
                              Key Strengths
                            </h4>
                            <ul className="space-y-2">
                              {evalResult.strengths.map((str, idx) => (
                                <li key={idx} className="text-xs text-bone-200 flex items-start gap-2">
                                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                  <span>{str}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-5 rounded-2xl bg-violet-500/5 border border-violet-500/20">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300 mb-3 flex items-center gap-2">
                              <Award className="w-4.5 h-4.5 animate-pulse" />
                              Suggested Improvements
                            </h4>
                            <ul className="space-y-2">
                              {evalResult.improvements.map((imp, idx) => (
                                <li key={idx} className="text-xs text-bone-200 flex items-start gap-2">
                                  <ArrowRight className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                                  <span>{imp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <PlaceholderCard icon={PenTool} title="Answer Grader" desc="Submit a question prompt and your written answer to get an objective grade, structured review, and remedial steps." />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

interface PlaceholderProps {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
}

function PlaceholderCard({ icon: Icon, title, desc }: PlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 bg-white/[0.01] border border-dashed t-border rounded-2xl p-6">
      <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 border border-violet-500/20">
        <Icon className="w-6 h-6 text-violet-400" />
      </div>
      <h4 className="text-sm font-semibold text-bone-100">{title}</h4>
      <p className="text-xs text-bone-400 mt-2 max-w-sm leading-relaxed">{desc}</p>
    </div>
  );
}
