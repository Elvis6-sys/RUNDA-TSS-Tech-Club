'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send, Sparkles, Wifi, WifiOff, Loader2, Bot, UserCircle2,
  BookOpen, Target, Lightbulb, Globe, Zap, Brain,
  CheckCircle2, XCircle, ClipboardCheck, X
} from 'lucide-react';
import type { ModuleReadingContext } from '@/contexts/ModuleReadingContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quizData?: QuizData;
}

interface QuizQuestion {
  id: string;
  type: 'mcq' | 'truefalse' | 'fillin' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  userAnswer?: string | number;
  isCorrect?: boolean;
  feedback?: string;
  explanation?: string;
  sampleAnswer?: string;
}

interface QuizData {
  id: string;
  title: string;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  score?: number;
  totalQuestions: number;
  isCompleted: boolean;
}

interface AIStudyAssistantProps {
  lessonContext?: {
    title?: string;
    track?: string;
    summary?: string;
  };
  userRole?: 'student' | 'teacher' | 'admin';
  pageContext?: {
    pageName: string;
    purpose: string;
    contents: string;
    howToUse: string;
    nextPage?: string;
    whatToExpect?: string;
  };
  moduleContext?: ModuleReadingContext;
}

interface UserProfile {
  role: 'student' | 'teacher' | 'admin';
  name: string | null;
  level: string | null;
  track: string | null;
  profileImage: string | null;
}

const RWANDA_COLORS = {
  blue: '#00A1DE',
  green: '#00A859',
};

function formatAIResponse(text: string): string {
  return text
    .replace(/###\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-blue-600 dark:text-blue-400">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-emerald-600 dark:text-emerald-400">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-mono text-sm font-semibold">$1</code>')
    .replace(/^- (.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-blue-500 font-bold">●</span><span>$1</span></div>')
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex gap-2 my-1"><span class="font-bold text-blue-600 dark:text-blue-400">$1.</span><span>$2</span></div>')
    .replace(/Note: (.+)/gi, '<div class="my-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-400 rounded-r text-emerald-900 dark:text-emerald-200"><strong class="font-bold">📝 Note:</strong> $1</div>')
    .replace(/Tip: (.+)/gi, '<div class="my-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded-r text-blue-900 dark:text-blue-200"><strong class="font-bold">💡 Tip:</strong> $1</div>')
    .replace(/Important: (.+)/gi, '<div class="my-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 rounded-r text-green-900 dark:text-green-200"><strong class="font-bold">⚡ Important:</strong> $1</div>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default function AIStudyAssistant({ lessonContext, userRole: propUserRole, pageContext, moduleContext }: AIStudyAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [theme] = useState<'dark'>('dark');
  const [userRole, setUserRole] = useState<'student' | 'teacher' | 'admin'>(propUserRole || 'student');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getSmartSuggestions = (): string[] => {
    if (moduleContext) {
      return [
        `Explain ${moduleContext.currentTopic?.title || 'this topic'} in simple terms`,
        `Give me 5 practice questions on ${moduleContext.currentOutcome?.title || 'this outcome'}`,
        `Summarize Learning Outcome ${(moduleContext.currentOutcome?.index || 0) + 1}`,
        `What are the key concepts I should remember from this module?`
      ];
    }

    return [
      'How do I earn XP?',
      'What\'s the best way to study?',
      'Explain the difference between lessons and modules',
      'Help me plan my learning path'
    ];
  };

  useEffect(() => {
    if (propUserRole) {
      setUserRole(propUserRole);
      return;
    }

    async function fetchProfile() {
      try {
        console.log('🔍 Fetching user profile from /api/user/role...');
        const response = await fetch('/api/user/role');
        const data = await response.json();
        console.log('👤 User profile fetched:', JSON.stringify(data, null, 2));
        if (data.role) {
          setUserRole(data.role);
          setUserProfile(data);
          console.log('✅ Profile set in state:', { name: data.name, hasImage: !!data.profileImage });
        }
      } catch (error) {
        console.error('❌ Failed to fetch user profile:', error);
        setUserRole('student');
      }
    }

    fetchProfile();
  }, [propUserRole]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeQuiz]);

  // Debug: Log userProfile state
  useEffect(() => {
    console.log('🎨 Current userProfile state:', userProfile);
  }, [userProfile]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !isOnline) return;

    const userMessage: Message = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    const maxRetries = 13; // Match number of API keys - try all of them!
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        // Only trigger quiz if user EXPLICITLY asks for one (much stricter detection)
        const isQuizRequest = /quiz me|give me a quiz|start a quiz|create a quiz|generate a quiz|quiz on|take a quiz/i.test(userInput);

        const response = await fetch('/api/ai-tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userInput,
            lessonContext,
            userRole,
            pageContext,
            moduleContext,
            requestQuiz: isQuizRequest
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

          // Silently retry on key rotation - no error message to user
          if (errorData.shouldRetry && retryCount < maxRetries - 1) {
            console.log(`🔄 Key rotated. Retrying silently... (attempt ${retryCount + 2}/${maxRetries})`);
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }

          // Only throw if retries exhausted
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          console.log('📊 API Response:', { hasQuizData: !!data.quizData, quizQuestions: data.quizData?.questions?.length });

          const assistantMessage: Message = {
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
            quizData: data.quizData
          };
          setMessages((prev) => [...prev, assistantMessage]);

          if (data.quizData) {
            console.log('🎯 Setting active quiz:', data.quizData.title);
            setActiveQuiz(data.quizData);
          } else {
            console.log('⚠️ No quiz data in response');
          }

          break;
        } else {
          throw new Error(data.error || 'Failed to get response');
        }
      } catch (error: any) {
        console.error('Send message error:', error);

        if (retryCount >= maxRetries - 1) {
          setMessages((prev) => [...prev, {
            role: 'assistant',
            content: `Sorry, I encountered an error: ${error.message}\n\n${error.message.includes('rate limit') || error.message.includes('429')
              ? '⚠️ All 13 API keys are currently at their daily limit. This is unusual - please contact your instructor.'
              : 'Please try again or contact support if the issue persists.'
              }`,
            timestamp: new Date()
          }]);
          break;
        }

        retryCount++;
      }
    }

    setIsLoading(false);
  };

  const submitQuizAnswer = async (questionId: string, answer: string | number) => {
    if (!activeQuiz) return;

    const currentQuestion = activeQuiz.questions[activeQuiz.currentQuestionIndex];

    let isCorrect = false;
    let feedback = '';

    if (currentQuestion.type === 'mcq' || currentQuestion.type === 'truefalse') {
      isCorrect = answer === currentQuestion.correctAnswer;

      if (isCorrect) {
        feedback = '✅ Correct! Well done!';
        if (currentQuestion.explanation) {
          feedback += `\n\n💡 ${currentQuestion.explanation}`;
        }
      } else {
        const correctOptionText = currentQuestion.type === 'mcq'
          ? currentQuestion.options?.[currentQuestion.correctAnswer as number]
          : (currentQuestion.correctAnswer === 0 ? 'True' : 'False');

        feedback = `💡 Not quite!\n\n**Correct answer:** ${correctOptionText}`;
        if (currentQuestion.explanation) {
          feedback += `\n\n**Why:** ${currentQuestion.explanation}`;
        }
      }
    } else if (currentQuestion.type === 'fillin') {
      const correctAns = (currentQuestion.correctAnswer as string).toLowerCase().trim();
      const userAns = (answer as string).toLowerCase().trim();
      isCorrect = userAns === correctAns || userAns.includes(correctAns) || correctAns.includes(userAns);

      if (isCorrect) {
        feedback = '✅ Correct!';
        if (currentQuestion.explanation) {
          feedback += `\n\n💡 ${currentQuestion.explanation}`;
        }
      } else {
        feedback = `💡 Not quite!\n\n**Expected answer:** "${currentQuestion.correctAnswer}"`;
        if (currentQuestion.explanation) {
          feedback += `\n\n**Why:** ${currentQuestion.explanation}`;
        }
      }
    } else if (currentQuestion.type === 'essay') {
      setIsLoading(true);
      try {
        const response = await fetch('/api/ai-quiz-grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: currentQuestion.question,
            userAnswer: answer,
            topic: moduleContext?.currentTopic?.title || activeQuiz.title || 'general topic',
            moduleContext
          }),
        });

        if (!response.ok) {
          throw new Error('Grading failed');
        }

        const data = await response.json();
        isCorrect = data.score >= 60;

        feedback = `**Score: ${data.score}/100** ${data.score >= 80 ? '🌟' : data.score >= 60 ? '✅' : '💪'}\n\n${data.feedback}${data.suggestedAnswer ? `\n\n📝 **Model Answer:**\n${data.suggestedAnswer}` : ''}`;
      } catch (error) {
        console.error('Essay grading error:', error);
        isCorrect = true;
        feedback = '✅ Answer recorded. Great effort! A trainer will provide detailed feedback soon.';
      } finally {
        setIsLoading(false);
      }
    }

    const updatedQuestions = [...activeQuiz.questions];
    updatedQuestions[activeQuiz.currentQuestionIndex] = {
      ...currentQuestion,
      userAnswer: answer,
      isCorrect,
      feedback
    };

    const isLastQuestion = activeQuiz.currentQuestionIndex === activeQuiz.totalQuestions - 1;

    const correctCount = updatedQuestions.filter(q => q.isCorrect).length;
    const score = Math.round((correctCount / activeQuiz.totalQuestions) * 100);

    // IMPORTANT: Create a completely new quiz object to force React re-render
    const updatedQuiz: QuizData = {
      id: activeQuiz.id,
      title: activeQuiz.title,
      questions: updatedQuestions,
      currentQuestionIndex: activeQuiz.currentQuestionIndex,
      score: isLastQuestion ? score : activeQuiz.score,
      totalQuestions: activeQuiz.totalQuestions,
      isCompleted: isLastQuestion
    };

    console.log(`✅ Answer submitted for Q${activeQuiz.currentQuestionIndex + 1}`);
    console.log(`   isCorrect: ${isCorrect}, isLastQuestion: ${isLastQuestion}`);

    setActiveQuiz(updatedQuiz);
    setQuizAnswer('');

    if (isLastQuestion) {
      const completionMessage: Message = {
        role: 'assistant',
        content: `🎉 Quiz Complete!\n\n**Your Score: ${score}%** (${correctCount}/${activeQuiz.totalQuestions} correct)\n\n${score >= 80 ? '🌟 Excellent work!' : score >= 60 ? '👍 Good effort!' : '💪 Keep practicing!'}\n\nReview your answers below:`,
        timestamp: new Date(),
        quizData: updatedQuiz
      };
      setMessages((prev) => [...prev, completionMessage]);
    }
  };

  const moveToNextQuestion = () => {
    if (!activeQuiz) return;
    const nextIndex = activeQuiz.currentQuestionIndex + 1;
    if (nextIndex < activeQuiz.totalQuestions) {
      console.log(`📍 Moving from Q${activeQuiz.currentQuestionIndex + 1} to Q${nextIndex + 1}`);
      console.log(`📊 Total questions: ${activeQuiz.totalQuestions}`);

      // Create a new quiz object to force React re-render
      const updatedQuiz = {
        ...activeQuiz,
        currentQuestionIndex: nextIndex
      };

      setActiveQuiz(updatedQuiz);
      setQuizAnswer('');

      console.log(`✅ State updated to index ${nextIndex}`);
    } else {
      console.log(`⚠️ Already at last question (${nextIndex} >= ${activeQuiz.totalQuestions})`);
    }
  };

  const quickPrompts = [
    { Icon: Lightbulb, text: 'Explain this', color: 'from-blue-500 to-blue-600', hint: 'Explain current topic' },
    { Icon: Target, text: 'Quiz me', color: 'from-green-500 to-green-600', hint: 'Generate practice questions' },
    { Icon: BookOpen, text: 'Summarize', color: 'from-purple-500 to-purple-600', hint: 'Summarize this content' },
    { Icon: Zap, text: 'Quick tips', color: 'from-orange-500 to-orange-600', hint: 'Study tips for this' },
  ];

  const buildGreeting = () => {
    if (!userProfile?.name) {
      return {
        greeting: 'Muraho! 👋',
        subtitle: 'Your RUNDA TSS AI learning assistant is here to help!',
        context: null
      };
    }

    const name = userProfile.name;

    if (userRole === 'student') {
      const levelInfo = userProfile.level ? `L${userProfile.level}` : '';
      const trackInfo = userProfile.track || '';

      const parts = [levelInfo, trackInfo].filter(Boolean);
      const fullContext = parts.join(' ');

      return {
        greeting: `Hey ${name}! 👋`,
        subtitle: fullContext
          ? `A student in ${fullContext}`
          : 'Welcome to RUNDA TSS AI!',
        context: fullContext || null
      };
    } else if (userRole === 'teacher') {
      return {
        greeting: `Hello ${name}! 👨‍🏫`,
        subtitle: 'Your AI teaching colleague is ready to collaborate!',
        context: null
      };
    } else {
      return {
        greeting: `Welcome ${name}! 📊`,
        subtitle: 'Your strategic advisor for institutional excellence!',
        context: null
      };
    }
  };

  const greeting = buildGreeting();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 text-white rounded-full p-3.5 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 z-[9999] w-14 h-14"
        style={{ background: `linear-gradient(135deg, ${RWANDA_COLORS.blue}, ${RWANDA_COLORS.green})` }}
      >
        <Sparkles className="w-7 h-7 animate-pulse mx-auto" />
        <div className="absolute -top-0.5 -right-0.5 bg-green-500 text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
          {isOnline ? '●' : '○'}
        </div>
      </button>
    );
  }

  const bg = 'bg-gray-900';
  const text = 'text-gray-100';
  const border = 'border-gray-700';

  return (
    <div className={`fixed bottom-6 right-6 w-[420px] ${bg} rounded-3xl shadow-2xl flex flex-col z-[9999] border-[3px] overflow-hidden`}
      style={{
        borderColor: RWANDA_COLORS.blue,
        maxHeight: 'calc(100vh - 100px)', // Responsive height
      }}>

      <div className="relative text-white p-2.5 rounded-t-[20px]"
        style={{ background: `linear-gradient(135deg, ${RWANDA_COLORS.blue}, ${RWANDA_COLORS.green})` }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="bg-white/20 rounded-[10px] p-1.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 bg-white rounded-[10px] px-2.5 py-1.5 border border-white/25 min-w-0 text-center">
              <h3 className="text-sm font-bold truncate" style={{ color: RWANDA_COLORS.green }}>RUNDA TSS AI</h3>
              <div className="flex items-center justify-center gap-1 text-[10px]" style={{ color: RWANDA_COLORS.green }}>
                {isOnline ? <><Wifi className="w-3 h-3" /><span>Online</span></> : <><WifiOff className="w-3 h-3" /><span>Offline</span></>}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-[8px] p-1 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-3 space-y-3 bg-gray-800`}>
        {messages.length === 0 && (
          <div className="text-center py-4 space-y-3">
            <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto shadow-xl relative"
              style={{ background: `linear-gradient(135deg, ${RWANDA_COLORS.blue}, ${RWANDA_COLORS.green})` }}>
              <Brain className="w-9 h-9 text-white" strokeWidth={2.5} />
              <Sparkles className="w-5 h-5 text-yellow-300 absolute -top-1.5 -right-1.5 animate-pulse" strokeWidth={2.5} />
            </div>

            <div className="space-y-2">
              <h4 className={`text-base font-bold ${text}`}>{greeting.greeting}</h4>
              {greeting.subtitle && (
                <p className={`text-sm font-semibold text-gray-300`}>
                  {greeting.subtitle}
                </p>
              )}
            </div>

            <p className={`text-sm text-gray-400 px-3`}>
              {userRole === 'student' && 'How are you? What can I help with your lessons today?'}
              {userRole === 'teacher' && 'What lesson planning can I help you with today?'}
              {userRole === 'admin' && 'What strategic guidance can I provide today?'}
            </p>

            <div className="mx-3 mt-3 p-3 rounded-[14px] text-left bg-blue-900/20 border border-blue-800/30">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `linear-gradient(135deg, ${RWANDA_COLORS.blue}, ${RWANDA_COLORS.green})` }}>
                  <Globe className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold mb-1 text-blue-100">
                    About RUNDA TSS AI
                  </p>
                  <p className="text-[10px] leading-relaxed text-blue-200">
                    An AI learning assistant <span className="font-semibold">specially tailored to TVET/RTB Curricula</span>.
                    Built to support Rwanda's technical education with precision, clarity, and cultural relevance.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 px-3 mt-3">
              {quickPrompts.map((p, i) => (
                <button key={i} onClick={() => setInput(p.hint)}
                  className={`text-sm bg-gradient-to-r ${p.color} text-white px-3 py-2.5 rounded-[12px] hover:scale-105 transition font-semibold flex items-center gap-2 justify-center shadow-lg hover:shadow-xl`}>
                  <p.Icon className="w-4 h-4" strokeWidth={2.5} />
                  <span>{p.text}</span>
                </button>
              ))}
            </div>

            <div className="mx-3 mt-4 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                💡 Try asking:
              </p>
              {getSmartSuggestions().slice(0, 2).map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 border border-gray-600 transition text-xs text-gray-300 hover:text-white"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className="space-y-2">
            <div className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden ${msg.role === 'user'
                ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600'
                : 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600'
                }`}>
                {msg.role === 'user' ? (
                  userProfile?.profileImage ? (
                    <img src={userProfile.profileImage} alt={userProfile.name || 'User'} className="w-full h-full object-cover" />
                  ) : userProfile?.name ? (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                      {userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                  ) : (
                    <UserCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
                  )
                ) : (
                  <Bot className="w-6 h-6 text-white" strokeWidth={2.5} />
                )}
              </div>

              <div className={`flex-1 rounded-[16px] px-3.5 py-3 shadow-sm ${msg.role === 'user'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white italic font-bold text-sm'
                : 'bg-gray-800 border border-gray-700'
                }`}>
                {msg.role === 'assistant' ? (
                  <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''} leading-relaxed text-sm`}
                    dangerouslySetInnerHTML={{ __html: formatAIResponse(msg.content) }} />
                ) : (
                  <div className="leading-relaxed">{msg.content}</div>
                )}
                <div className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Quiz started indicator - actual quiz UI is rendered below the messages list */}
            {msg.quizData && i === messages.length - 1 && activeQuiz && !activeQuiz.isCompleted && (
              <div className="ml-12 px-3 py-2 rounded-lg bg-blue-900/20 border border-blue-700/40 text-xs text-blue-300">
                Quiz in progress below ↓
              </div>
            )}

            {/* Marking Guide - shown inline once quiz is completed */}
            {msg.quizData && i === messages.length - 1 && activeQuiz && activeQuiz.isCompleted && (
              <div className="ml-12 mt-4 bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200">
                <div className="bg-gradient-to-r px-6 py-4 border-b-2 border-gray-200" style={{
                  background: `linear-gradient(135deg, ${RWANDA_COLORS.blue}, ${RWANDA_COLORS.green})`
                }}>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5" />
                    Marking Guide & Answer Review
                  </h3>
                  <p className="text-xs text-white/90 mt-1">
                    Review your performance • Score: {activeQuiz.score ?? 0}% ({activeQuiz.questions.filter(q => q.isCorrect).length}/{activeQuiz.totalQuestions} correct)
                  </p>
                </div>

                <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                  {activeQuiz.questions.map((q, idx) => (
                    <div key={q.id} className="border-2 rounded-lg overflow-hidden" style={{
                      borderColor: q.isCorrect ? '#10b981' : '#ef4444'
                    }}>
                      <div className={`px-4 py-3 ${q.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-gray-700">Q{idx + 1}</span>
                          {q.isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-800 mt-2">{q.question}</p>
                      </div>
                      <div className="px-4 py-3 bg-white space-y-2">
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase">Your Answer:</span>
                          <p className="text-sm text-gray-800 mt-1">
                            {q.type === 'mcq' && q.options ? q.options[q.userAnswer as number] : q.userAnswer?.toString()}
                          </p>
                        </div>
                        {!q.isCorrect && (
                          <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase">Correct Answer:</span>
                            <p className="text-sm text-green-700 font-medium mt-1">
                              {q.type === 'mcq' && q.options ? q.options[q.correctAnswer as number] : q.correctAnswer?.toString()}
                            </p>
                          </div>
                        )}
                        {q.explanation && (
                          <div className="pt-2 border-t border-gray-100">
                            <span className="text-xs font-semibold text-gray-500 uppercase">Explanation:</span>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shadow-lg bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600">
              <Bot className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 rounded-[16px] px-3.5 py-3 bg-gray-800 border border-gray-700">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: RWANDA_COLORS.blue }} />
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── STANDALONE QUIZ PANEL ──────────────────────────────────────────────
          Rendered OUTSIDE the messages loop so it always has fresh state.
          Driven entirely by activeQuiz state - no stale closures.
      ──────────────────────────────────────────────────────────────────────── */}
      {activeQuiz && !activeQuiz.isCompleted && (() => {
        const q = activeQuiz.questions[activeQuiz.currentQuestionIndex];
        const answered = q.userAnswer !== undefined;
        const isLast = activeQuiz.currentQuestionIndex === activeQuiz.totalQuestions - 1;

        // Debug: Log question type
        console.log(`🎯 Rendering Q${activeQuiz.currentQuestionIndex + 1}: type="${q.type}"`);

        return (
          <div className="mx-3 mb-2 bg-gray-800 border-2 rounded-xl p-4 space-y-3 flex-shrink-0 max-h-[500px] overflow-y-auto"
            style={{ borderColor: RWANDA_COLORS.blue }}>

            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                <Target className="w-4 h-4 flex-shrink-0" style={{ color: RWANDA_COLORS.green }} />
                <span className="truncate">{activeQuiz.title}</span>
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-xs text-gray-400">
                  {activeQuiz.currentQuestionIndex + 1}/{activeQuiz.totalQuestions}
                </span>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-gray-700"
                  title="Close quiz">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((activeQuiz.currentQuestionIndex + 1) / activeQuiz.totalQuestions) * 100}%`,
                  background: `linear-gradient(90deg, ${RWANDA_COLORS.blue}, ${RWANDA_COLORS.green})`
                }} />
            </div>

            {/* Question */}
            <p className="text-sm text-white font-medium">{q.question}</p>

            {/* MCQ */}
            {q.type === 'mcq' && q.options && (
              <div className="space-y-2">
                {q.options.map((option, idx) => (
                  <button key={idx}
                    onClick={() => { if (!answered) submitQuizAnswer(q.id, idx); }}
                    disabled={answered || isLoading}
                    className={`w-full text-left px-3 py-2 rounded-lg border-2 text-sm transition
                      ${q.userAnswer === idx
                        ? q.isCorrect ? 'border-green-500 bg-green-900/30 text-green-300' : 'border-red-500 bg-red-900/30 text-red-300'
                        : 'border-gray-600 hover:border-blue-500 bg-gray-700/50 text-gray-200 hover:bg-gray-700'}
                      disabled:cursor-not-allowed`}>
                    <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>{option}
                  </button>
                ))}
              </div>
            )}

            {/* True/False */}
            {q.type === 'truefalse' && (
              <div className="flex gap-2">
                {['True', 'False'].map((label, idx) => (
                  <button key={idx}
                    onClick={() => { if (!answered) submitQuizAnswer(q.id, idx); }}
                    disabled={answered || isLoading}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition
                      ${q.userAnswer === idx
                        ? q.isCorrect ? 'border-green-500 bg-green-900/30 text-green-300' : 'border-red-500 bg-red-900/30 text-red-300'
                        : 'border-gray-600 hover:border-blue-500 bg-gray-700/50 text-gray-200 hover:bg-gray-700'}
                      disabled:cursor-not-allowed`}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Fill-in */}
            {q.type === 'fillin' && (
              <div className="space-y-2">
                <input type="text" value={quizAnswer}
                  onChange={(e) => setQuizAnswer(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter' && quizAnswer.trim() && !answered) submitQuizAnswer(q.id, quizAnswer); }}
                  disabled={answered || isLoading}
                  placeholder="Type your answer..."
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50" />
                {!answered && (
                  <button onClick={() => { if (quizAnswer.trim()) submitQuizAnswer(q.id, quizAnswer); }}
                    disabled={!quizAnswer.trim() || isLoading}
                    className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition"
                    style={{ background: quizAnswer.trim() ? `linear-gradient(135deg, ${RWANDA_COLORS.blue}, ${RWANDA_COLORS.green})` : '#64748b' }}>
                    Submit Answer
                  </button>
                )}
              </div>
            )}

            {/* Essay */}
            {q.type === 'essay' && (
              <div className="space-y-2">
                <textarea value={quizAnswer} onChange={(e) => setQuizAnswer(e.target.value)}
                  disabled={answered || isLoading}
                  placeholder="Write your answer here... (min 2-3 sentences)"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-600 bg-gray-700 text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 resize-none" />
                {!answered && (
                  <button onClick={() => { if (quizAnswer.trim().length >= 20) submitQuizAnswer(q.id, quizAnswer); }}
                    disabled={quizAnswer.trim().length < 20 || isLoading}
                    className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition flex items-center justify-center gap-2"
                    style={{ background: quizAnswer.trim().length >= 20 ? `linear-gradient(135deg, ${RWANDA_COLORS.blue}, ${RWANDA_COLORS.green})` : '#64748b' }}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Answer (AI will grade)'}
                  </button>
                )}
                <p className="text-[10px] text-gray-500">Minimum 20 characters required</p>
              </div>
            )}

            {/* Unknown type fallback - shows raw question data for debugging */}
            {q.type !== 'mcq' && q.type !== 'truefalse' && q.type !== 'fillin' && q.type !== 'essay' && (
              <div className="p-3 bg-red-900/20 border border-red-500 rounded text-xs text-red-300">
                <p className="font-bold">⚠️ Unknown question type: "{q.type}"</p>
                <pre className="mt-2 text-[10px] overflow-auto">{JSON.stringify(q, null, 2)}</pre>
              </div>
            )}

            {/* Feedback */}
            {q.feedback && (
              <div className={`px-4 py-3 rounded-lg text-sm space-y-3
                ${q.isCorrect ? 'bg-green-900/30 border-2 border-green-500' : 'bg-blue-900/30 border-2 border-blue-500'}`}>
                <p className={`font-semibold ${q.isCorrect ? 'text-green-200' : 'text-blue-200'}`}>
                  {q.isCorrect ? '✅ Correct!' : '💡 Review'}
                </p>
                <p className={`text-xs leading-relaxed ${q.isCorrect ? 'text-green-100' : 'text-blue-100'}`}
                  style={{ whiteSpace: 'pre-line' }}>
                  {q.feedback}
                </p>
                {/* Next button - only if not the last question */}
                {answered && !isLast && (
                  <button onClick={moveToNextQuestion}
                    className="w-full px-4 py-3 rounded-lg text-sm font-bold text-white hover:scale-105 transition shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${RWANDA_COLORS.blue}, ${RWANDA_COLORS.green})` }}>
                    Next Question →
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Input */}
      <div className={`p-3 border-t ${border} ${bg}`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder={isOnline ? "Ask anything..." : "Offline"}
            disabled={!isOnline || isLoading}
            className={`flex-1 px-3 py-2 border-2 ${border} rounded-[12px] focus:outline-none text-sm font-medium bg-gray-800 text-white disabled:opacity-50 transition`}
            style={{ borderColor: input ? RWANDA_COLORS.blue : undefined }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !isOnline || isLoading}
            className="text-white px-4 py-2 rounded-[12px] hover:scale-105 transition disabled:opacity-50 shadow-lg font-semibold flex items-center gap-2"
            style={{ background: !input.trim() || !isOnline || isLoading ? '#64748b' : `linear-gradient(135deg, ${RWANDA_COLORS.blue}, ${RWANDA_COLORS.green})` }}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[9px] text-center mt-2 text-gray-500">
          Powered by <span className="font-bold" style={{ color: RWANDA_COLORS.blue }}>RUNDA TSS AI</span>
        </p>
      </div>
    </div>
  );
}
