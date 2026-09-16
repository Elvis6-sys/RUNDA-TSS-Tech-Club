"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, AlertTriangle, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import QuestionRenderer from './QuestionRenderer';

/**
 * EntranceTestInterface - Lockdown test UI with timer
 * Supports all 13 question types
 */

type EntranceTestInterfaceProps = {
  testData: {
    id: string;
    trade: string;
    level: string;
    duration: number; // minutes
    passingScore: number;
    totalQuestions: number;
    totalPoints: number;
    questions: any[];
  };
  onComplete: () => void;
};

export default function EntranceTestInterface({ testData, onComplete }: EntranceTestInterfaceProps) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(testData.duration * 60); // seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const startTimeRef = useRef(Date.now());

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Prevent page refresh/navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionIndex: number, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestion < testData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleAutoSubmit = async () => {
    console.log('⏰ Time expired - auto-submitting...');
    await submitTest(true);
  };

  const handleManualSubmit = () => {
    setShowSubmitConfirm(true);
  };

  const submitTest = async (autoSubmitted: boolean = false) => {
    setIsSubmitting(true);

    try {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

      const res = await fetch('/api/entrance-test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: testData.id,
          answers,
          duration,
          autoSubmitted
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Submission failed: ${data.error}`);
        setIsSubmitting(false);
        return;
      }

      // Success - redirect
      onComplete();
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit test. Please try again.');
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = testData.totalQuestions - answeredCount;
  const progress = (answeredCount / testData.totalQuestions) * 100;

  const currentQ = testData.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      {/* Header - Fixed */}
      <div className="bg-slate-800 border-b border-slate-700 rounded-t-xl px-6 py-4 mb-4 sticky top-0 z-50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Entrance Test</h1>
            <p className="text-sm text-slate-400">
              {testData.trade.replace(/-/g, ' ').toUpperCase()} - Level {testData.level.replace('l', '')}
            </p>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            timeRemaining < 300 ? 'bg-red-500/20 border border-red-500' : 'bg-blue-500/20 border border-blue-500'
          }`}>
            <Clock className={`w-5 h-5 ${timeRemaining < 300 ? 'text-red-400' : 'text-blue-400'}`} />
            <span className={`font-mono text-lg font-bold ${
              timeRemaining < 300 ? 'text-red-400' : 'text-white'
            }`}>
              {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Progress */}
          <div className="hidden md:block">
            <div className="text-sm text-slate-400 mb-1">
              Progress: {answeredCount} / {testData.totalQuestions}
            </div>
            <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-4">
          {/* Question Header */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-700">
            <div>
              <span className="text-sm text-slate-400">Question {currentQuestion + 1} of {testData.totalQuestions}</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded font-medium">
                  {currentQ.type.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400">{currentQ.points} points</span>
              </div>
            </div>
            {answers[currentQuestion] !== undefined && (
              <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded">
                ✓ Answered
              </span>
            )}
          </div>

          {/* Question Renderer */}
          <QuestionRenderer
            question={currentQ}
            questionIndex={currentQuestion}
            answer={answers[currentQuestion]}
            onAnswerChange={(answer) => handleAnswerChange(currentQuestion, answer)}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="flex-1 flex justify-center">
            {/* Question Navigator */}
            <div className="flex flex-wrap gap-2 justify-center">
              {testData.questions.slice(0, 10).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-10 h-10 rounded-lg font-semibold text-sm transition ${
                    index === currentQuestion
                      ? 'bg-blue-600 text-white'
                      : answers[index] !== undefined
                      ? 'bg-green-600/20 text-green-400 border border-green-600'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              {testData.questions.length > 10 && (
                <span className="w-10 h-10 flex items-center justify-center text-slate-500">...</span>
              )}
            </div>
          </div>

          {currentQuestion === testData.questions.length - 1 ? (
            <button
              onClick={handleManualSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              Submit Test
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Warning if unanswered */}
        {unansweredCount > 0 && currentQuestion === testData.questions.length - 1 && (
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-semibold">
                {unansweredCount} question{unansweredCount > 1 ? 's' : ''} unanswered
              </p>
              <p className="text-yellow-400/80 text-sm mt-1">
                You can still submit, but unanswered questions will receive 0 points.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold text-white">Submit Test?</h2>
            <div className="space-y-2 text-sm text-slate-300">
              <p>• Answered: {answeredCount} / {testData.totalQuestions}</p>
              <p>• Time remaining: {formatTime(timeRemaining)}</p>
              {unansweredCount > 0 && (
                <p className="text-yellow-400">• {unansweredCount} question(s) unanswered</p>
              )}
            </div>
            <p className="text-slate-400 text-sm">
              Once submitted, you cannot change your answers.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  submitTest(false);
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
