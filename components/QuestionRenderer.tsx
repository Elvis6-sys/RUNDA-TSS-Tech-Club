"use client";

import { useState, useRef } from 'react';
import { Upload, Mic, Video, Pencil, Code } from 'lucide-react';

/**
 * QuestionRenderer - Renders all 13 question types
 * Types: mcq, truefalse, fillin, multiselect, matching, ordering, 
 *        short, essay, code, fileupload, drawing, audio, video
 */

type QuestionRendererProps = {
  question: any;
  questionIndex: number;
  answer: any;
  onAnswerChange: (answer: any) => void;
};

export default function QuestionRenderer({
  question,
  questionIndex,
  answer,
  onAnswerChange
}: QuestionRendererProps) {
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [recordingVideo, setRecordingVideo] = useState(false);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. MULTIPLE CHOICE (MCQ)
  // ═══════════════════════════════════════════════════════════════════════════
  if (question.type === 'mcq') {
    return (
      <div className="space-y-4">
        <p className="text-lg text-white font-medium mb-4">{question.question}</p>
        <div className="space-y-3">
          {question.options?.map((option: string, index: number) => (
            <label
              key={index}
              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                answer === option
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
              }`}
            >
              <input
                type="radio"
                name={`q-${questionIndex}`}
                value={option}
                checked={answer === option}
                onChange={(e) => onAnswerChange(e.target.value)}
                className="mt-1 w-4 h-4 text-blue-600"
              />
              <span className="text-white flex-1">{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. TRUE/FALSE
  // ═══════════════════════════════════════════════════════════════════════════
  if (question.type === 'truefalse') {
    return (
      <div className="space-y-4">
        <p className="text-lg text-white font-medium mb-4">{question.question}</p>
        <div className="flex gap-4">
          {['True', 'False'].map((option) => (
            <label
              key={option}
              className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                answer === option
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
              }`}
            >
              <input
                type="radio"
                name={`q-${questionIndex}`}
                value={option}
                checked={answer === option}
                onChange={(e) => onAnswerChange(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-white font-semibold">{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. FILL IN THE BLANK
  // ═══════════════════════════════════════════════════════════════════════════
  if (question.type === 'fillin') {
    return (
      <div className="space-y-4">
        <p className="text-lg text-white font-medium mb-4">{question.question}</p>
        <input
          type="text"
          value={answer || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type your answer here..."
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. MULTI-SELECT (Multiple correct answers)
  // ═══════════════════════════════════════════════════════════════════════════
  if (question.type === 'multiselect') {
    const selectedAnswers = answer || [];
    
    const toggleOption = (option: string) => {
      if (selectedAnswers.includes(option)) {
        onAnswerChange(selectedAnswers.filter((a: string) => a !== option));
      } else {
        onAnswerChange([...selectedAnswers, option]);
      }
    };

    return (
      <div className="space-y-4">
        <p className="text-lg text-white font-medium mb-2">{question.question}</p>
        <p className="text-sm text-slate-400 mb-4">Select all that apply</p>
        <div className="space-y-3">
          {question.options?.map((option: string, index: number) => (
            <label
              key={index}
              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                selectedAnswers.includes(option)
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedAnswers.includes(option)}
                onChange={() => toggleOption(option)}
                className="mt-1 w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-white flex-1">{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. MATCHING (Pair items)
  // ═══════════════════════════════════════════════════════════════════════════
  if (question.type === 'matching') {
    const pairs = question.pairs || [];
    const matches = answer || {};

    return (
      <div className="space-y-4">
        <p className="text-lg text-white font-medium mb-4">{question.question}</p>
        <p className="text-sm text-slate-400 mb-4">Match each item on the left with one on the right</p>
        <div className="space-y-3">
          {pairs.map((pair: { left: string; options: string[] }, index: number) => (
            <div key={index} className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
              <p className="text-white mb-3">{pair.left}</p>
              <select
                value={matches[pair.left] || ''}
                onChange={(e) => onAnswerChange({ ...matches, [pair.left]: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Select match --</option>
                {pair.options.map((opt: string, i: number) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. ORDERING (Arrange in sequence)
  // ═══════════════════════════════════════════════════════════════════════════
  if (question.type === 'ordering') {
    const items = question.items || [];
    const orderedItems = answer || items;

    const moveItem = (fromIndex: number, toIndex: number) => {
      const newOrder = [...orderedItems];
      const [movedItem] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, movedItem);
      onAnswerChange(newOrder);
    };

    return (
      <div className="space-y-4">
        <p className="text-lg text-white font-medium mb-4">{question.question}</p>
        <p className="text-sm text-slate-400 mb-4">Arrange in correct order</p>
        <div className="space-y-2">
          {orderedItems.map((item: string, index: number) => (
            <div key={index} className="flex items-center gap-3 bg-slate-700/30 border border-slate-600 rounded-lg p-4">
              <span className="text-slate-400 font-mono">{index + 1}.</span>
              <span className="text-white flex-1">{item}</span>
              <div className="flex gap-2">
                {index > 0 && (
                  <button
                    onClick={() => moveItem(index, index - 1)}
                    className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm"
                  >
                    ↑
                  </button>
                )}
                {index < orderedItems.length - 1 && (
                  <button
                    onClick={() => moveItem(index, index + 1)}
                    className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm"
                  >
                    ↓
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. SHORT ANSWER
  // ═══════════════════════════════════════════════════════════════════════════
  if (question.type === 'short') {
    return (
      <div className="space-y-4">
        <p className="text-lg text-white font-medium mb-4">{question.question}</p>
        <textarea
          value={answer || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Write your answer here (2-3 sentences)..."
          rows={4}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. ESSAY (Long answer)
  // ═══════════════════════════════════════════════════════════════════════════
  if (question.type === 'essay') {
    return (
      <div className="space-y-4">
        <p className="text-lg text-white font-medium mb-4">{question.question}</p>
        <textarea
          value={answer || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Write your detailed answer here..."
          rows={10}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
        />
        <p className="text-sm text-slate-400">
          Characters: {(answer || '').length} | Words: {(answer || '').split(/\s+/).filter(Boolean).length}
        </p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. CODE (Programming question)
  // ═══════════════════════════════════════════════════════════════════════════
  if (question.type === 'code') {
    return (
      <div className="space-y-4">
        <p className="text-lg text-white font-medium mb-4">{question.question}</p>
        <div className="relative">
          <Code className="absolute top-3 left-3 w-5 h-5 text-slate-400" />
          <textarea
            value={answer || ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Write your code here..."
            rows={12}
            className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-green-400 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none font-mono text-sm"
          />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. FILE UPLOAD
  // ═══════════════════════════════════════════════════════════════════════════
  if (question.type === 'fileupload') {
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          onAnswerChange({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileData: reader.result
          });
        };
        reader.readAsDataURL(file);
      }
    };

    return (
      <div className="space-y-4">
        <p className="text-lg text-white font-medium mb-4">{question.question}</p>
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            id={`file-${questionIndex}`}
            accept=".pdf,.doc,.docx,.txt,.jpg,.png"
          />
          <label
            htmlFor={`file-${questionIndex}`}
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition"
          >
            Choose File
          </label>
          {answer?.fileName && (
            <p className="mt-4 text-green-400">
              ✓ Uploaded: {answer.fileName} ({(answer.fileSize / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. DRAWING (Canvas-based)
  // ═══════════════════════════════════════════════════════════════════════════
  if (question.type === 'drawing') {
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
      setIsDrawing(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    };

    const stopDrawing = () => {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        onAnswerChange(canvas.toDataURL());
      }
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onAnswerChange(null);
    };

    return (
      <div className="space-y-4">
        <p className="text-lg text-white font-medium mb-4">{question.question}</p>
        <div className="space-y-3">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full border-2 border-slate-600 rounded-lg bg-white cursor-crosshair"
          />
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            Clear Drawing
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. AUDIO RECORDING
  // ═══════════════════════════════════════════════════════════════════════════
  if (question.type === 'audio') {
    const startAudioRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onload = () => {
            onAnswerChange(reader.result);
          };
          reader.readAsDataURL(blob);
          stream.getTracks().forEach(track => track.stop());
        };

        audioRecorderRef.current = recorder;
        recorder.start();
        setRecordingAudio(true);
      } catch (err) {
        alert('Microphone access denied');
      }
    };

    const stopAudioRecording = () => {
      audioRecorderRef.current?.stop();
      setRecordingAudio(false);
    };

    return (
      <div className="space-y-4">
        <p className="text-lg text-white font-medium mb-4">{question.question}</p>
        <div className="border-2 border-slate-600 rounded-lg p-8 text-center">
          <Mic className={`w-12 h-12 mx-auto mb-4 ${recordingAudio ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
          {!answer ? (
            recordingAudio ? (
              <button
                onClick={stopAudioRecording}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Stop Recording
              </button>
            ) : (
              <button
                onClick={startAudioRecording}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Start Recording
              </button>
            )
          ) : (
            <div>
              <p className="text-green-400 mb-4">✓ Audio recorded</p>
              <button
                onClick={() => onAnswerChange(null)}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Re-record
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. VIDEO RECORDING
  // ═══════════════════════════════════════════════════════════════════════════
  if (question.type === 'video') {
    const startVideoRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const reader = new FileReader();
          reader.onload = () => {
            onAnswerChange(reader.result);
          };
          reader.readAsDataURL(blob);
          stream.getTracks().forEach(track => track.stop());
        };

        videoRecorderRef.current = recorder;
        recorder.start();
        setRecordingVideo(true);
      } catch (err) {
        alert('Camera access denied');
      }
    };

    const stopVideoRecording = () => {
      videoRecorderRef.current?.stop();
      setRecordingVideo(false);
    };

    return (
      <div className="space-y-4">
        <p className="text-lg text-white font-medium mb-4">{question.question}</p>
        <div className="border-2 border-slate-600 rounded-lg p-8 text-center">
          <Video className={`w-12 h-12 mx-auto mb-4 ${recordingVideo ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
          {!answer ? (
            recordingVideo ? (
              <button
                onClick={stopVideoRecording}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Stop Recording
              </button>
            ) : (
              <button
                onClick={startVideoRecording}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Start Recording
              </button>
            )
          ) : (
            <div>
              <p className="text-green-400 mb-4">✓ Video recorded</p>
              <button
                onClick={() => onAnswerChange(null)}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Re-record
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback for unknown types
  return (
    <div className="space-y-4">
      <p className="text-lg text-white font-medium mb-4">{question.question}</p>
      <p className="text-red-400">Question type "{question.type}" not supported</p>
    </div>
  );
}
