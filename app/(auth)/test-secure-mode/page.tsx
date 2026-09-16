import SecureExamDetector from '@/components/SecureExamDetector';

export default function TestSecureModePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <SecureExamDetector
        assessmentType="quiz"
        assessmentTitle="Test Quiz"
        nodeId="test-123"
        trackId="test-track"
        autoActivate={true}
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold">🔒 Secure Mode Test Page</h1>
        
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">What Should Happen:</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>Window should go FULLSCREEN immediately</li>
            <li>Red banner should appear at top</li>
            <li>Try pressing <kbd className="px-2 py-1 bg-slate-700 rounded">Esc</kbd> - nothing should happen</li>
            <li>Try <kbd className="px-2 py-1 bg-slate-700 rounded">Alt+F4</kbd> - nothing should happen</li>
            <li>Try <kbd className="px-2 py-1 bg-slate-700 rounded">Ctrl+C</kbd> - nothing should happen</li>
          </ul>
        </div>

        <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">🧪 Test Instructions:</h2>
          <ol className="space-y-3 list-decimal list-inside">
            <li>Open browser console (Press F12 - this should still work initially)</li>
            <li>Look for message: <code className="bg-slate-800 px-2 py-1 rounded">🔒 SecureExamDetector: Activating Secure Exam Mode</code></li>
            <li>Check if window went fullscreen</li>
            <li>Try typing in this text box: <input type="text" className="ml-2 px-3 py-1 bg-slate-700 rounded" placeholder="Type here..." /></li>
            <li>Typing should work, but shortcuts should not</li>
          </ol>
        </div>

        <div className="bg-green-900/50 border border-green-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">✅ What SHOULD Work:</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>Typing letters (a-z)</li>
            <li>Typing numbers (0-9)</li>
            <li>Enter key</li>
            <li>Backspace</li>
            <li>Space bar</li>
            <li>Tab key</li>
            <li>Arrow keys</li>
          </ul>
        </div>

        <div className="bg-red-900/50 border border-red-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">❌ What Should NOT Work:</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>Esc (exit fullscreen)</li>
            <li>Alt+F4 (close window)</li>
            <li>Ctrl+C (copy)</li>
            <li>Ctrl+V (paste)</li>
            <li>Ctrl+Z (undo)</li>
            <li>Alt+Tab (switch apps)</li>
            <li>F1-F12 keys</li>
            <li>Ctrl+R or F5 (refresh)</li>
          </ul>
        </div>

        <div className="text-center text-slate-400 mt-12">
          <p>If this page opened in a regular browser (not Tauri app), secure mode will NOT work.</p>
          <p className="mt-2">You must be in the <strong>Tauri desktop application</strong> for this to function.</p>
        </div>
      </div>
    </div>
  );
}
