"use client";

import { useState } from 'react';
import SimulationViewer from './SimulationViewer';
import { Zap, Info } from 'lucide-react';

/**
 * CircuitSimulator - Electronic circuit simulation component
 * For digital electronics, logic gates, circuit design
 */

type CircuitSimulatorProps = {
  circuitType: 'logic-gates' | 'analog' | 'digital' | 'power';
  title: string;
  moduleCode: string;
  activityId: string;
  description?: string;
  onComplete?: (score?: number) => void;
};

export default function CircuitSimulator({
  circuitType,
  title,
  moduleCode,
  activityId,
  description,
  onComplete
}: CircuitSimulatorProps) {
  const [showInstructions, setShowInstructions] = useState(true);

  // Map circuit types to simulation URLs
  const simulationUrls: Record<string, string> = {
    'logic-gates': '/simulations/circuit/logic-gates.html',
    'analog': '/simulations/circuit/analog-circuits.html',
    'digital': '/simulations/circuit/digital-circuits.html',
    'power': '/simulations/circuit/power-circuits.html'
  };

  const instructions: Record<string, string[]> = {
    'logic-gates': [
      'Drag logic gate components from the toolbar onto the canvas',
      'Connect gates by clicking output and then input pins',
      'Toggle input switches to test your circuit',
      'Observe LED outputs to verify logic behavior',
      'Use the truth table view to analyze results'
    ],
    'analog': [
      'Select components: resistors, capacitors, op-amps, etc.',
      'Place components on the breadboard',
      'Wire connections between component pins',
      'Set component values using the properties panel',
      'Run simulation to see voltage and current readings'
    ],
    'digital': [
      'Build combinational or sequential circuits',
      'Use flip-flops, counters, multiplexers',
      'Apply clock signals for sequential logic',
      'Test with various input combinations',
      'Export your design as a schematic'
    ],
    'power': [
      'Design power supply circuits',
      'Add transformers, rectifiers, filters',
      'Configure load resistances',
      'Measure output voltage and ripple',
      'Optimize for efficiency'
    ]
  };

  return (
    <div className="space-y-4">
      {/* Circuit Type Badge */}
      <div className="flex items-center gap-2">
        <div className="p-2 bg-yellow-500/20 rounded-lg">
          <Zap className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <p className="text-sm text-slate-400">Circuit Simulator</p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">{circuitType.replace(/-/g, ' ')}</p>
        </div>
      </div>

      {/* Instructions Collapsible */}
      {showInstructions && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              <h4 className="font-semibold text-white">How to Use</h4>
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              className="text-sm text-slate-400 hover:text-white"
            >
              Hide
            </button>
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            {instructions[circuitType]?.map((instruction, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-blue-400">{index + 1}.</span>
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!showInstructions && (
        <button
          onClick={() => setShowInstructions(true)}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Show Instructions
        </button>
      )}

      {/* Simulation Viewer */}
      <SimulationViewer
        src={simulationUrls[circuitType]}
        title={title}
        moduleCode={moduleCode}
        activityId={activityId}
        description={description}
        onComplete={onComplete}
        allowSave={true}
      />

      {/* Component Reference */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-3">Component Reference</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {circuitType === 'logic-gates' && (
            <>
              <div className="bg-slate-900 p-3 rounded">
                <p className="text-white font-medium">AND</p>
                <p className="text-xs text-slate-400">Output 1 if all inputs 1</p>
              </div>
              <div className="bg-slate-900 p-3 rounded">
                <p className="text-white font-medium">OR</p>
                <p className="text-xs text-slate-400">Output 1 if any input 1</p>
              </div>
              <div className="bg-slate-900 p-3 rounded">
                <p className="text-white font-medium">NOT</p>
                <p className="text-xs text-slate-400">Inverts input</p>
              </div>
              <div className="bg-slate-900 p-3 rounded">
                <p className="text-white font-medium">XOR</p>
                <p className="text-xs text-slate-400">Output 1 if inputs differ</p>
              </div>
            </>
          )}
          {circuitType === 'analog' && (
            <>
              <div className="bg-slate-900 p-3 rounded">
                <p className="text-white font-medium">Resistor</p>
                <p className="text-xs text-slate-400">Limits current flow</p>
              </div>
              <div className="bg-slate-900 p-3 rounded">
                <p className="text-white font-medium">Capacitor</p>
                <p className="text-xs text-slate-400">Stores charge</p>
              </div>
              <div className="bg-slate-900 p-3 rounded">
                <p className="text-white font-medium">Inductor</p>
                <p className="text-xs text-slate-400">Stores energy in field</p>
              </div>
              <div className="bg-slate-900 p-3 rounded">
                <p className="text-white font-medium">Op-Amp</p>
                <p className="text-xs text-slate-400">Amplifies signals</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
