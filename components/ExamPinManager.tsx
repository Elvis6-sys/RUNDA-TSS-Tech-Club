/**
 * Exam PIN Manager
 *
 * Trainer-side component that generates a 6-digit session PIN and displays it
 * prominently before exam starts. The PIN is set in Electron and required to
 * exit exam mode.
 *
 * Usage:
 *   <ExamPinManager onPinSet={(pin) => console.log('PIN:', pin)} />
 */

'use client';

import { useState, useEffect } from 'react';
import { Shield, Copy, Check, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface ExamPinManagerProps {
  onPinSet?: (pin: string) => void;
  autoGenerate?: boolean;
}

export default function ExamPinManager({ onPinSet, autoGenerate = false }: ExamPinManagerProps) {
  const [pin, setPin] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(true);
  const [isElectron, setIsElectron] = useState(false);
  const [pinStatus, setPinStatus] = useState<'idle' | 'setting' | 'set' | 'error'>('idle');

  useEffect(() => {
    setIsElectron(!!window.electronAPI);
    if (autoGenerate && !pin) {
      generatePin();
    }
  }, [autoGenerate, pin]);

  const generatePin = () => {
    // Generate 6-digit PIN
    const newPin = Math.random().toString().slice(2, 8);
    setPin(newPin);
    setVisible(true);
    setCopied(false);
  };

  const setPinInElectron = async () => {
    if (!window.electronAPI || !pin) return;

    try {
      setPinStatus('setting');
      const result = await window.electronAPI.setAdminPin(pin);

      if (result.success) {
        setPinStatus('set');
        if (onPinSet) onPinSet(pin);
      } else {
        setPinStatus('error');
        console.error('Failed to set PIN:', result.error);
      }
    } catch (err) {
      setPinStatus('error');
      console.error('Error setting PIN:', err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleVisibility = () => {
    setVisible(!visible);
  };

  if (!isElectron) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <p className="text-sm text-slate-400">
          PIN management only available in Electron app
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-900/30 to-violet-900/30 border-2 border-blue-500/50 rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-blue-400" />
        <div>
          <h3 className="text-lg font-bold text-white">Exam Exit PIN</h3>
          <p className="text-sm text-slate-300">Required to exit secure exam mode</p>
        </div>
      </div>

      {/* PIN Display */}
      {pin ? (
        <div className="space-y-3">
          <div className="bg-slate-900 border-2 border-blue-500 rounded-xl p-6">
            <div className="text-center">
              <div className="text-sm text-slate-400 mb-2">Session PIN</div>
              <div className="flex items-center justify-center gap-2">
                {visible ? (
                  <div className="text-5xl font-mono font-bold text-blue-300 tracking-wider">
                    {pin.split('').map((digit, i) => (
                      <span key={i} className="inline-block w-12 text-center">
                        {digit}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-5xl font-mono font-bold text-slate-600 tracking-wider">
                    ••••••
                  </div>
                )}
                <button
                  onClick={toggleVisibility}
                  className="ml-2 p-2 hover:bg-slate-800 rounded-lg transition"
                  title={visible ? 'Hide PIN' : 'Show PIN'}
                >
                  {visible ? <EyeOff className="w-5 h-5 text-slate-400" /> : <Eye className="w-5 h-5 text-slate-400" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy PIN
                </>
              )}
            </button>

            <button
              onClick={generatePin}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              New
            </button>

            <button
              onClick={setPinInElectron}
              disabled={pinStatus === 'setting' || pinStatus === 'set'}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition text-sm font-medium ${
                pinStatus === 'set'
                  ? 'bg-emerald-500/20 text-emerald-300 cursor-not-allowed'
                  : pinStatus === 'error'
                  ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {pinStatus === 'setting' && 'Setting...'}
              {pinStatus === 'set' && (
                <>
                  <Check className="w-4 h-4" />
                  PIN Active
                </>
              )}
              {pinStatus === 'error' && 'Retry'}
              {pinStatus === 'idle' && 'Set PIN'}
            </button>
          </div>

          {/* Status messages */}
          {pinStatus === 'set' && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <p className="text-sm text-emerald-300">
                ✓ PIN is active for this exam session. Students will need this PIN to exit.
              </p>
            </div>
          )}

          {pinStatus === 'error' && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
              <p className="text-sm text-rose-300">
                ✗ Failed to set PIN. Check Electron console.
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-300 space-y-2">
            <p className="font-semibold text-white">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Generate a PIN (or use the auto-generated one)</li>
              <li>Click "Set PIN" to activate it in Electron</li>
              <li>Write down or copy the PIN (students will ask for it to exit)</li>
              <li>Start the exam</li>
            </ol>
            <p className="text-xs text-slate-500 mt-3">
              ⚠️ Important: This PIN expires when the exam session ends. You'll need a new PIN for the next exam.
            </p>
          </div>
        </div>
      ) : (
        <button
          onClick={generatePin}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition font-medium"
        >
          Generate PIN
        </button>
      )}
    </div>
  );
}
