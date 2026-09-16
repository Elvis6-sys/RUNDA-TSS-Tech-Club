"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

type ParsedQuestion = {
  type: string;
  text: string;
  options?: string[];
  correctAnswer?: any;
  points?: number;
  explanation?: string;
  imageContext?: string;
};

type QuestionImporterProps = {
  onQuestionsImported: (questions: ParsedQuestion[]) => void;
  onClose: () => void;
};

export default function QuestionImporter({ onQuestionsImported, onClose }: QuestionImporterProps) {
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [originalText, setOriginalText] = useState<string>('');
  const [showOriginalText, setShowOriginalText] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);
    setUploading(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Read file content to display and save filename
      const fileText = await file.text();
      setOriginalText(fileText);
      setUploadedFileName(file.name);

      setProgress(30);
      setParsing(true);

      const response = await fetch('/api/ai/parse-questions', {
        method: 'POST',
        body: formData,
      });

      setProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse questions');
      }

      const data = await response.json();
      setProgress(100);

      console.log('📦 API Response:', JSON.stringify(data).substring(0, 200));
      console.log('✅ Questions parsed:', data.questions?.length || 0);
      console.log('🔍 Success flag:', data.success);
      console.log('🔍 Has questions:', !!data.questions);
      console.log('🔍 Questions length:', data.questions?.length);

      // TEMPORARY DEBUG ALERT
      if (!data.success || !data.questions || data.questions.length === 0) {
        alert(`DEBUG INFO:\nSuccess: ${data.success}\nHas questions: ${!!data.questions}\nLength: ${data.questions?.length || 0}\nError: ${data.error || 'none'}`);
      }

      if (data.success && data.questions && data.questions.length > 0) {
        console.log('✅ SUCCESS PATH - Setting parsed questions');
        setParsedQuestions(data.questions || []);
        setMetadata({ fileName: uploadedFileName, fileSize: file.size });
        setError(null);
      } else {
        // AI parsing failed but we have the original text
        console.log('❌ ERROR PATH - No questions or failed');
        console.log('Error from API:', data.error);
        setError(data.error || 'AI failed to parse questions, but you can view the original text below and create questions manually.');
        setParsedQuestions([]);
      }

    } catch (err: any) {
      console.error('❌ Upload error:', err);
      setError(err.message || 'Failed to upload and parse document. You can still view the original text below.');
    } finally {
      setUploading(false);
      setParsing(false);
      setTimeout(() => setProgress(0), 500);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  });

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mcq: '📝 Multiple Choice',
      truefalse: '✓✗ True/False',
      fillin: '_____ Fill in the Blank',
      multiselect: '☑ Multi-select',
      matching: '🔗 Matching',
      ordering: '↕ Ordering',
      shortanswer: '✍ Short Answer',
      essay: '📄 Essay',
      code: '💻 Code',
      fileupload: '📎 File Upload',
      drawing: '🎨 Drawing',
      audio: '🎙 Audio',
      video: '🎥 Video'
    };
    return labels[type.toLowerCase()] || type;
  };

  const handleImport = () => {
    onQuestionsImported(parsedQuestions);
  };

  const handleRemoveQuestion = (index: number) => {
    setParsedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditQuestion = (index: number, field: keyof ParsedQuestion, value: any) => {
    setParsedQuestions(prev => prev.map((q, i) =>
      i === index ? { ...q, [field]: value } : q
    ));
  };

  const handleEditOption = (qIndex: number, optIndex: number, value: string) => {
    setParsedQuestions(prev => prev.map((q, i) => {
      if (i === qIndex && q.options) {
        const newOptions = [...q.options];
        newOptions[optIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleAddOption = (qIndex: number) => {
    setParsedQuestions(prev => prev.map((q, i) => {
      if (i === qIndex) {
        const newOptions = [...(q.options || []), ''];
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    setParsedQuestions(prev => prev.map((q, i) => {
      if (i === qIndex && q.options) {
        const newOptions = q.options.filter((_, idx) => idx !== optIndex);
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const questionTypes = [
    { value: 'multiple_choice', label: '📝 Multiple Choice' },
    { value: 'true_false', label: '✓✗ True/False' },
    { value: 'fill_blank', label: '_____ Fill in Blank' },
    { value: 'multi_select', label: '☑ Multi-select' },
    { value: 'matching', label: '🔗 Matching' },
    { value: 'ordering', label: '↕ Ordering' },
    { value: 'short_answer', label: '✍ Short Answer' },
    { value: 'essay', label: '📄 Essay' },
    { value: 'code', label: '💻 Code' },
    { value: 'file_upload', label: '📎 File Upload' },
    { value: 'drawing', label: '🎨 Drawing' },
    { value: 'audio', label: '🎙 Audio' },
    { value: 'video', label: '🎥 Video' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">🤖 AI Question Importer</h2>
            <p className="text-sm text-slate-400 mt-0.5">Upload a document and AI will extract questions</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {parsedQuestions.length === 0 && !originalText ? (
            <>
              {/* Upload Area */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${isDragActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                  }`}
              >
                <input {...getInputProps()} />
                <div className="text-6xl mb-4">📄</div>
                {uploading ? (
                  <>
                    <p className="text-lg font-semibold text-white mb-2">
                      {parsing ? '🤖 AI is analyzing your document...' : '📤 Uploading...'}
                    </p>
                    <div className="w-full max-w-md mx-auto bg-slate-700 rounded-full h-3 mb-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-400">{progress}% complete</p>
                  </>
                ) : isDragActive ? (
                  <p className="text-lg font-semibold text-blue-400">Drop the file here...</p>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-white mb-2">
                      Drop your .txt file here or click to browse
                    </p>
                    <p className="text-sm text-slate-400">
                      Text files only (.txt, max 5MB)
                    </p>
                    <p className="text-xs text-amber-400 mt-2">
                      💡 For images/complex questions, create them manually
                    </p>
                  </>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm font-bold mb-2">❌ {error}</p>
                  <details className="mt-2">
                    <summary className="text-xs text-red-300 cursor-pointer hover:text-red-200">
                      🔍 Debug Info (click to expand)
                    </summary>
                    <pre className="text-xs text-red-200 mt-2 bg-red-900/20 p-2 rounded overflow-auto">
                      {JSON.stringify({
                        hasOriginalText: !!originalText,
                        originalTextLength: originalText?.length || 0
                      }, null, 2)}
                    </pre>
                  </details>
                </div>
              )}

              {/* Instructions */}
              <div className="mt-6 bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-sm font-bold text-white mb-2">📖 How it works:</h3>
                <ol className="text-sm text-slate-300 space-y-1 ml-4 list-decimal">
                  <li>Upload a document containing questions</li>
                  <li>AI analyzes and categorizes each question (13 types supported)</li>
                  <li>Review extracted questions</li>
                  <li>Import to your quiz</li>
                </ol>

                <h3 className="text-sm font-bold text-white mb-2 mt-4">✨ Supported Question Types:</h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <div>📝 Multiple Choice</div>
                  <div>✓✗ True/False</div>
                  <div>_____ Fill in the Blank</div>
                  <div>☑ Multi-select</div>
                  <div>🔗 Matching</div>
                  <div>↕ Ordering</div>
                  <div>✍ Short Answer</div>
                  <div>📄 Essay</div>
                  <div>💻 Code</div>
                  <div>📎 File Upload</div>
                  <div>🎨 Drawing</div>
                  <div>🎙 Audio</div>
                  <div>🎥 Video</div>
                </div>
              </div>
            </>
          ) : parsedQuestions.length === 0 && originalText ? (
            <>
              {/* AI Parsing Failed - Show Original Text */}
              <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-400 mb-2">AI Parsing Failed</h3>
                    <p className="text-sm text-amber-200 mb-3">
                      {error || 'The AI could not automatically extract questions from your file.'}
                    </p>
                    <p className="text-sm text-slate-300">
                      <strong>Don't worry!</strong> You can:
                    </p>
                    <ul className="text-sm text-slate-300 mt-2 space-y-1 ml-4 list-disc">
                      <li>View your original text below</li>
                      <li>Copy it and simplify the formatting</li>
                      <li>Re-upload with simpler format</li>
                      <li>Or create questions manually in the quiz editor</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Show Original Text */}
              <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    📄 Your Uploaded Text File
                    <span className="text-xs text-slate-400 font-normal">
                      ({originalText.length} characters)
                    </span>
                  </h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(originalText);
                      alert('📋 Copied to clipboard!');
                    }}
                    className="text-xs px-3 py-1.5 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition font-semibold"
                  >
                    📋 Copy All Text
                  </button>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto border border-slate-700">
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {originalText}
                  </pre>
                </div>
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                  <p className="text-xs text-blue-300 font-semibold mb-2">💡 Tips to fix:</p>
                  <ul className="text-xs text-slate-300 space-y-1 ml-4 list-disc">
                    <li>Simplify formatting (remove special characters)</li>
                    <li>Ensure questions are numbered (1., 2., 3.)</li>
                    <li>Mark correct answers with * clearly</li>
                    <li>Add point values like [5pts] or (10 marks)</li>
                    <li>Use blank lines to separate questions</li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setParsedQuestions([]);
                    setOriginalText('');
                    setError(null);
                  }}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition"
                >
                  ↺ Try Another File
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-slate-600 rounded-lg hover:bg-slate-500 transition"
                >
                  Create Manually Instead
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Results Header */}
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-white">
                      ✅ {parsedQuestions.length} Question{parsedQuestions.length !== 1 ? 's' : ''} Extracted
                    </p>
                    {metadata && (
                      <p className="text-sm text-slate-400 mt-1">
                        From: {metadata.fileName} ({(metadata.fileSize / 1024).toFixed(2)} KB)
                        {metadata.imagesFound > 0 && ` • ${metadata.imagesFound} image(s) found`}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowOriginalText(!showOriginalText)}
                      className="text-sm px-3 py-1.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition"
                    >
                      {showOriginalText ? '📋 Hide Original' : '📄 Show Original Text'}
                    </button>
                    <button
                      onClick={() => setParsedQuestions([])}
                      className="text-sm px-3 py-1.5 rounded bg-slate-600 text-slate-300 hover:bg-slate-500 transition"
                    >
                      ↺ Upload Another
                    </button>
                  </div>
                </div>
              </div>

              {/* Original Text Display */}
              {showOriginalText && originalText && (
                <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      📄 Original Text File Content
                      <span className="text-xs text-slate-400 font-normal">
                        ({originalText.length} characters)
                      </span>
                    </h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(originalText);
                        alert('📋 Copied to clipboard!');
                      }}
                      className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto border border-slate-700">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                      {originalText}
                    </pre>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 italic">
                    💡 Compare this with extracted questions below to verify accuracy
                  </p>
                </div>
              )}

              {/* Extracted Questions Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  🤖 AI Extracted Questions
                  <span className="text-xs text-emerald-400 font-normal">
                    ({parsedQuestions.length} questions)
                  </span>
                </h3>
                <span className="text-xs text-slate-400">
                  Click ✏️ Edit to modify any question
                </span>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {parsedQuestions.map((q, idx) => {
                  const isEditing = editingIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition"
                    >
                      {/* Question Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                            Q{idx + 1}
                          </span>
                          {isEditing ? (
                            <select
                              value={q.type}
                              onChange={(e) => handleEditQuestion(idx, 'type', e.target.value)}
                              className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              {questionTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                              {getQuestionTypeLabel(q.type)}
                            </span>
                          )}
                          {isEditing ? (
                            <input
                              type="number"
                              value={q.points || 1}
                              onChange={(e) => handleEditQuestion(idx, 'points', parseInt(e.target.value) || 1)}
                              className="w-16 text-xs bg-slate-700 text-white px-2 py-1 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">
                              {q.points || 1} point{(q.points || 1) !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingIndex(isEditing ? null : idx)}
                            className={`text-xs px-3 py-1 rounded transition ${isEditing
                              ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                              : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                              }`}
                            title={isEditing ? "Save" : "Edit"}
                          >
                            {isEditing ? '✓ Save' : '✏️ Edit'}
                          </button>
                          <button
                            onClick={() => handleRemoveQuestion(idx)}
                            className="text-xs px-3 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                            title="Remove question"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>

                      {/* Question Text */}
                      {isEditing ? (
                        <textarea
                          value={q.text}
                          onChange={(e) => handleEditQuestion(idx, 'text', e.target.value)}
                          className="w-full text-sm text-white bg-slate-700 px-3 py-2 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                          rows={3}
                          placeholder="Question text..."
                        />
                      ) : (
                        <p className="text-sm text-white mb-2">{q.text}</p>
                      )}

                      {/* Options (for MCQ, True/False, Multi-select) */}
                      {q.options && q.options.length > 0 && (
                        <div className="space-y-2 mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400 font-semibold">Options:</span>
                            {isEditing && (
                              <button
                                onClick={() => handleAddOption(idx)}
                                className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 transition"
                              >
                                + Add Option
                              </button>
                            )}
                          </div>
                          {q.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-mono">
                                {String.fromCharCode(65 + i)})
                              </span>
                              {isEditing ? (
                                <>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleEditOption(idx, i, e.target.value)}
                                    className="flex-1 text-xs text-white bg-slate-700 px-2 py-1 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                  />
                                  <button
                                    onClick={() => handleRemoveOption(idx, i)}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                    title="Remove option"
                                  >
                                    ✕
                                  </button>
                                </>
                              ) : (
                                <div
                                  className={`flex-1 text-xs px-2 py-1 rounded ${q.correctAnswer === String.fromCharCode(65 + i) ||
                                    (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(String.fromCharCode(65 + i)))
                                    ? 'bg-green-500/20 text-green-300 font-semibold'
                                    : 'bg-slate-700/50 text-slate-300'
                                    }`}
                                >
                                  {opt}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Correct Answer */}
                      {isEditing && (q.type === 'multiple_choice' || q.type === 'true_false' || q.type === 'multi_select') && (
                        <div className="mt-3">
                          <label className="text-xs text-slate-400 font-semibold block mb-1">
                            Correct Answer{q.type === 'multi_select' ? 's' : ''} (e.g., A or A,C,D):
                          </label>
                          <input
                            type="text"
                            value={Array.isArray(q.correctAnswer) ? q.correctAnswer.join(',') : q.correctAnswer || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleEditQuestion(idx, 'correctAnswer',
                                q.type === 'multi_select' ? value.split(',').map(s => s.trim()) : value
                              );
                            }}
                            className="w-full text-xs text-white bg-slate-700 px-2 py-1 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., B or A,C,D"
                          />
                        </div>
                      )}

                      {/* Explanation */}
                      {isEditing && (
                        <div className="mt-3">
                          <label className="text-xs text-slate-400 font-semibold block mb-1">
                            Explanation (optional):
                          </label>
                          <textarea
                            value={q.explanation || ''}
                            onChange={(e) => handleEditQuestion(idx, 'explanation', e.target.value)}
                            className="w-full text-xs text-white bg-slate-700 px-2 py-1 rounded border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            placeholder="Why is this the correct answer?"
                          />
                        </div>
                      )}

                      {!isEditing && q.explanation && (
                        <p className="text-xs text-slate-400 italic mt-2">💡 {q.explanation}</p>
                      )}

                      {!isEditing && q.imageContext && (
                        <p className="text-xs text-amber-400 mt-2">🖼️ {q.imageContext}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {parsedQuestions.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-800/50">
            <div className="flex-1">
              <p className="text-sm text-slate-300 font-semibold">
                ✏️ Click "Edit" to fix AI mistakes or modify any question
              </p>
              <p className="text-xs text-slate-400 mt-1">
                You can change question text, options, correct answers, points, and question types
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-500 hover:to-purple-500 transition shadow-lg"
              >
                ✅ Import {parsedQuestions.length} Question{parsedQuestions.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
