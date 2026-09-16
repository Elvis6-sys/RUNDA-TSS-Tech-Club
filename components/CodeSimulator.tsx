"use client";

import { useState } from 'react';
import SimulationViewer from './SimulationViewer';
import { Code2, Terminal, Info } from 'lucide-react';

/**
 * CodeSimulator - Interactive code editor and execution environment
 * Supports C, Python, JavaScript, and more
 */

type CodeSimulatorProps = {
  language: 'c' | 'python' | 'javascript' | 'java' | 'solidity';
  title: string;
  moduleCode: string;
  activityId: string;
  description?: string;
  starterCode?: string;
  challenges?: string[];
  onComplete?: (score?: number) => void;
};

export default function CodeSimulator({
  language,
  title,
  moduleCode,
  activityId,
  description,
  starterCode,
  challenges,
  onComplete
}: CodeSimulatorProps) {
  const [showHints, setShowHints] = useState(false);

  // Map languages to simulator URLs
  const simulatorUrls: Record<string, string> = {
    'c': '/simulations/code/c-compiler.html',
    'python': '/simulations/code/python-interpreter.html',
    'javascript': '/simulations/code/js-console.html',
    'java': '/simulations/code/java-compiler.html',
    'solidity': '/simulations/code/solidity-editor.html'
  };

  const languageInfo: Record<string, { icon: string; color: string; description: string }> = {
    'c': {
      icon: '⚙️',
      color: 'blue',
      description: 'System programming language with manual memory management'
    },
    'python': {
      icon: '🐍',
      color: 'yellow',
      description: 'High-level interpreted language with simple syntax'
    },
    'javascript': {
      icon: '🌐',
      color: 'yellow',
      description: 'Dynamic language for web development'
    },
    'java': {
      icon: '☕',
      color: 'red',
      description: 'Object-oriented language for enterprise applications'
    },
    'solidity': {
      icon: '⛓️',
      color: 'purple',
      description: 'Smart contract language for Ethereum blockchain'
    }
  };

  const hints: Record<string, string[]> = {
    'c': [
      'Remember to include necessary headers (#include <stdio.h>)',
      'Always initialize variables before use',
      'Check pointer validity before dereferencing',
      'Free dynamically allocated memory',
      'Use proper format specifiers in printf/scanf'
    ],
    'python': [
      'Indentation matters - use 4 spaces',
      'Lists are mutable, tuples are immutable',
      'Use list comprehensions for concise code',
      'Remember to close files after opening',
      'Use try-except for error handling'
    ],
    'javascript': [
      'Use const by default, let when reassignment needed',
      'Arrow functions inherit "this" from parent scope',
      'Use === for strict equality comparison',
      'Async/await makes promises easier to work with',
      'Use template literals for string interpolation'
    ],
    'java': [
      'Every class needs a main method to run',
      'Remember public static void main(String[] args)',
      'Use proper access modifiers (private, public, protected)',
      'Catch specific exceptions, not just Exception',
      'Close resources in try-with-resources or finally block'
    ],
    'solidity': [
      'State variables are stored on blockchain (expensive)',
      'Use events to log important actions',
      'Check for reentrancy vulnerabilities',
      'Use SafeMath for arithmetic operations',
      'Test thoroughly - deployed contracts are immutable'
    ]
  };

  const info = languageInfo[language];

  return (
    <div className="space-y-4">
      {/* Language Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-${info.color}-500/20 rounded-lg`}>
            <Code2 className={`w-5 h-5 text-${info.color}-400`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{info.icon}</span>
              <p className="text-sm text-slate-400">{language.toUpperCase()} Playground</p>
            </div>
            <p className="text-xs text-slate-500">{info.description}</p>
          </div>
        </div>
        <button
          onClick={() => setShowHints(!showHints)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
        >
          <Info className="w-4 h-4" />
          {showHints ? 'Hide' : 'Show'} Hints
        </button>
      </div>

      {/* Hints Panel */}
      {showHints && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-green-400 mb-3">💡 Coding Tips</h4>
          <ul className="space-y-2 text-sm text-green-200">
            {hints[language]?.map((hint, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-green-400">•</span>
                <span>{hint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Challenges (if provided) */}
      {challenges && challenges.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-5 h-5 text-blue-400" />
            <h4 className="font-semibold text-white">Challenges</h4>
          </div>
          <ol className="space-y-2 text-sm text-slate-300">
            {challenges.map((challenge, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-blue-400 font-semibold">{index + 1}.</span>
                <span>{challenge}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Code Simulator */}
      <SimulationViewer
        src={`${simulatorUrls[language]}${starterCode ? `?code=${encodeURIComponent(starterCode)}` : ''}`}
        title={title}
        moduleCode={moduleCode}
        activityId={activityId}
        description={description}
        onComplete={onComplete}
        allowSave={true}
      />

      {/* Quick Reference */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-3">Quick Reference</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {language === 'c' && (
            <>
              <div>
                <p className="text-blue-400 font-mono mb-1">printf("Hello %d", x);</p>
                <p className="text-xs text-slate-400">Print formatted output</p>
              </div>
              <div>
                <p className="text-blue-400 font-mono mb-1">int *ptr = malloc(size);</p>
                <p className="text-xs text-slate-400">Dynamic memory allocation</p>
              </div>
              <div>
                <p className="text-blue-400 font-mono mb-1">for(int i=0; i&lt;n; i++)</p>
                <p className="text-xs text-slate-400">For loop</p>
              </div>
              <div>
                <p className="text-blue-400 font-mono mb-1">if(condition) {"{}"}</p>
                <p className="text-xs text-slate-400">Conditional statement</p>
              </div>
            </>
          )}
          {language === 'python' && (
            <>
              <div>
                <p className="text-blue-400 font-mono mb-1">print(f"Value: {"{x}"}")</p>
                <p className="text-xs text-slate-400">Formatted string</p>
              </div>
              <div>
                <p className="text-blue-400 font-mono mb-1">for i in range(10):</p>
                <p className="text-xs text-slate-400">For loop</p>
              </div>
              <div>
                <p className="text-blue-400 font-mono mb-1">list_comp = [x for x in arr]</p>
                <p className="text-xs text-slate-400">List comprehension</p>
              </div>
              <div>
                <p className="text-blue-400 font-mono mb-1">def function(param):</p>
                <p className="text-xs text-slate-400">Function definition</p>
              </div>
            </>
          )}
          {language === 'javascript' && (
            <>
              <div>
                <p className="text-blue-400 font-mono mb-1">const arr = [1, 2, 3];</p>
                <p className="text-xs text-slate-400">Array declaration</p>
              </div>
              <div>
                <p className="text-blue-400 font-mono mb-1">arr.map(x =&gt; x * 2)</p>
                <p className="text-xs text-slate-400">Array mapping</p>
              </div>
              <div>
                <p className="text-blue-400 font-mono mb-1">async function fetch()</p>
                <p className="text-xs text-slate-400">Async function</p>
              </div>
              <div>
                <p className="text-blue-400 font-mono mb-1">console.log(value)</p>
                <p className="text-xs text-slate-400">Console output</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
