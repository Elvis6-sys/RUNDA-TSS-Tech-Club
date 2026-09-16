"use client";

import { useState } from "react";
import { X, Check, Upload, FileText } from "lucide-react";
import { parseQuestionsFromText, ParsedQuestion } from "@/lib/simple-question-parser";

type SimpleQuestionImporterProps = {
  onQuestionsImported: (questions: any[]) => void;
  onClose: () => void;
};

export default function SimpleQuestionImporter({ onQuestionsImported, onClose }: SimpleQuestionImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>('');
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.txt')) {
      alert('❌ Please select a .txt file');
      return;
    }

    setFile(selectedFile);
    const content = await selectedFile.text();
    setText(content);

    // Parse questions immediately
    const parsed = parseQuestionsFromText(content);
    console.log('🔍 Parsed questions:', parsed.map(q => ({ num: q.number, type: q.type, text: q.text.substring(0, 50) })));
    setQuestions(parsed);

    // Select all by default
    setSelectedQuestions(new Set(parsed.map((_, i) => i)));
  };

  const toggleQuestion = (index: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedQuestions(newSelected);
  };

  const handleImport = () => {
    const selected = questions.filter((_, i) => selectedQuestions.has(i));

    // Convert to quiz format
    const converted = selected.map(q => ({
      type: q.type,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer.length > 0 ? q.correctAnswer[0] : '',
      points: q.points,
      explanation: ''
    }));

    onQuestionsImported(converted);
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      mcq: '📝',
      truefalse: '✓✗',
      fillin: '_____',
      multiselect: '☑',
      matching: '🔗',
      ordering: '↕',
      short: '✍️',
      essay: '📄',
      code: '💻',
      fileupload: '📎',
      drawing: '🎨',
      audio: '🎙',
      video: '🎥'
    };
    return icons[type] || '❓';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mcq: 'Multiple Choice',
      truefalse: 'True/False',
      fillin: 'Fill in Blank',
      multiselect: 'Multi-select',
      matching: 'Matching',
      ordering: 'Ordering',
      short: 'Short Answer',
      essay: 'Essay',
      code: 'Code',
      fileupload: 'File Upload',
      drawing: 'Drawing',
      audio: 'Audio',
      video: 'Video'
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-white">📄 Import Questions from Text File</h2>
            <p className="text-sm text-slate-400 mt-1">Simple, fast, reliable - no AI needed!</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition text-2xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {questions.length === 0 ? (
            // Upload Area
            <div className="max-w-2xl mx-auto">
              <label className="block border-2 border-dashed border-blue-500/50 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <p className="text-lg font-bold text-white mb-2">Click to select .txt file</p>
                <p className="text-sm text-slate-400">Max 5MB</p>
              </label>

              <div className="mt-8 p-6 bg-slate-800/50 rounded-xl">
                <h3 className="text-sm font-bold text-white mb-3">📋 Required Format:</h3>
                <pre className="text-xs text-slate-300 bg-slate-900 p-4 rounded-lg overflow-x-auto">
                  {`1. What is 2+2? [5pts]
A) 3
B) 4 *
C) 5
D) 6

2. Python is compiled. [2pts]
True
False *

3. Explain OOP concepts. [10pts]`}
                </pre>
                <ul className="text-xs text-slate-400 mt-3 space-y-1 ml-4 list-disc">
                  <li>Number questions: 1., 2., 3.</li>
                  <li>Mark correct answer with *</li>
                  <li>Add points: [5pts] or (10 marks)</li>
                  <li>Use A), B), C), D) for options</li>
                </ul>
              </div>
            </div>
          ) : (
            // Questions Display
            <>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
                <div>
                  <p className="text-lg font-bold text-white">
                    ✅ Found {questions.length} Question{questions.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {selectedQuestions.size} selected • Select/deselect questions to import
                  </p>
                </div>
                <button
                  onClick={() => setQuestions([])}
                  className="text-sm px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition"
                >
                  ↺ Upload Different File
                </button>
              </div>

              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const isSelected = selectedQuestions.has(idx);

                  return (
                    <div
                      key={idx}
                      className={`border-2 rounded-xl p-5 transition cursor-pointer ${isSelected
                        ? 'border-blue-500 bg-blue-500/5'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                        }`}
                      onClick={() => toggleQuestion(idx)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                          }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>

                        {/* Question Content */}
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                              Q{q.number}
                            </span>
                            <span className="text-sm font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                              {getTypeIcon(q.type)} {getTypeLabel(q.type)}
                            </span>
                            <span className="text-sm text-slate-400">
                              {q.points} point{q.points !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Question Text */}
                          <p className="text-base text-white font-medium mb-3">{q.text}</p>

                          {/* Options */}
                          {q.options.length > 0 && (
                            <div className="space-y-2">
                              {q.options.map((opt, i) => {
                                const letter = opt.charAt(0);
                                const isCorrect = q.correctAnswer.includes(letter);

                                return (
                                  <div
                                    key={i}
                                    className={`px-3 py-2 rounded-lg text-sm ${isCorrect
                                      ? 'bg-green-500/20 text-green-300 font-semibold border border-green-500/30'
                                      : 'bg-slate-700/50 text-slate-300'
                                      }`}
                                  >
                                    {opt} {isCorrect && '✓'}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Correct Answer Display for all types */}
                          {q.correctAnswer.length > 0 && q.options.length === 0 && (
                            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                              <p className="text-xs text-green-400 font-semibold mb-1">✓ Expected Answer:</p>
                              <p className="text-sm text-green-300">{q.correctAnswer[0]}</p>
                            </div>
                          )}

                          {/* No answer provided note */}
                          {q.correctAnswer.length === 0 && q.options.length === 0 && !['fileupload', 'drawing', 'audio', 'video'].includes(q.type) && (
                            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                              <p className="text-xs text-yellow-400">
                                ⚠️ No answer provided - teacher can add it manually after import
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {questions.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-800/50">
            <p className="text-sm text-slate-300">
              Select the questions you want to import
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={selectedQuestions.size === 0}
                className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-500 hover:to-purple-500 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✅ Import {selectedQuestions.size} Question{selectedQuestions.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
