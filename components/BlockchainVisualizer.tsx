"use client";

import { useState } from 'react';
import VRViewer from './VRViewer';
import { Boxes, Info, Eye } from 'lucide-react';

/**
 * BlockchainVisualizer - 3D/VR blockchain visualization
 * Interactive blockchain explorer with VR support
 */

type BlockchainVisualizerProps = {
  title: string;
  moduleCode: string;
  activityId: string;
  description?: string;
  visualizationType?: 'chain' | 'network' | 'transaction' | 'smartcontract';
  onComplete?: () => void;
};

export default function BlockchainVisualizer({
  title,
  moduleCode,
  activityId,
  description,
  visualizationType = 'chain',
  onComplete
}: BlockchainVisualizerProps) {
  const [showGuide, setShowGuide] = useState(true);

  const visualizationInfo: Record<string, { icon: string; description: string; features: string[] }> = {
    'chain': {
      icon: '⛓️',
      description: 'Visualize blockchain structure with linked blocks',
      features: [
        'See blocks connected in chronological order',
        'Inspect block headers and transaction data',
        'Understand hash linking between blocks',
        'Observe mining and consensus processes'
      ]
    },
    'network': {
      icon: '🌐',
      description: 'Explore peer-to-peer network topology',
      features: [
        'View nodes and their connections',
        'Watch transaction propagation',
        'See consensus mechanisms in action',
        'Understand network decentralization'
      ]
    },
    'transaction': {
      icon: '💸',
      description: 'Follow cryptocurrency transactions',
      features: [
        'Trace transactions from sender to receiver',
        'See UTXO model in action',
        'Understand transaction fees',
        'Explore transaction pools (mempool)'
      ]
    },
    'smartcontract': {
      icon: '📜',
      description: 'Visualize smart contract execution',
      features: [
        'See contract deployment process',
        'Watch function calls and state changes',
        'Understand gas consumption',
        'Explore contract interactions'
      ]
    }
  };

  const info = visualizationInfo[visualizationType];

  const vrUrl = `/content/SWDBF501/vr/blockchain-explorer.html?type=${visualizationType}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Boxes className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{info.icon}</span>
              <p className="text-sm text-slate-400">Blockchain Visualization</p>
            </div>
            <p className="text-xs text-slate-500">{info.description}</p>
          </div>
        </div>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
        >
          <Info className="w-4 h-4" />
          {showGuide ? 'Hide' : 'Show'} Guide
        </button>
      </div>

      {/* Guide Panel */}
      {showGuide && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-5 h-5 text-purple-400" />
            <h4 className="font-semibold text-purple-300">Visualization Features</h4>
          </div>
          <ul className="space-y-2 text-sm text-purple-100">
            {info.features.map((feature, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-purple-400">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-purple-500/20">
            <p className="text-xs text-purple-200">
              <strong>Navigation:</strong> Use your mouse to rotate the view, scroll to zoom. 
              In VR mode, use your controllers to interact with blockchain elements.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Concepts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-3">Key Concepts</h4>
          <div className="space-y-3 text-sm">
            {visualizationType === 'chain' && (
              <>
                <div>
                  <p className="text-blue-400 font-semibold">Block Header</p>
                  <p className="text-xs text-slate-400">Contains metadata: hash, previous hash, timestamp, nonce</p>
                </div>
                <div>
                  <p className="text-green-400 font-semibold">Merkle Root</p>
                  <p className="text-xs text-slate-400">Hash of all transactions in the block</p>
                </div>
                <div>
                  <p className="text-yellow-400 font-semibold">Proof of Work</p>
                  <p className="text-xs text-slate-400">Mining process to find valid nonce</p>
                </div>
              </>
            )}
            {visualizationType === 'network' && (
              <>
                <div>
                  <p className="text-blue-400 font-semibold">Nodes</p>
                  <p className="text-xs text-slate-400">Computers running blockchain software</p>
                </div>
                <div>
                  <p className="text-green-400 font-semibold">Peers</p>
                  <p className="text-xs text-slate-400">Connected nodes sharing data</p>
                </div>
                <div>
                  <p className="text-yellow-400 font-semibold">Consensus</p>
                  <p className="text-xs text-slate-400">Agreement mechanism for valid blocks</p>
                </div>
              </>
            )}
            {visualizationType === 'transaction' && (
              <>
                <div>
                  <p className="text-blue-400 font-semibold">Inputs</p>
                  <p className="text-xs text-slate-400">References to previous outputs (UTXOs)</p>
                </div>
                <div>
                  <p className="text-green-400 font-semibold">Outputs</p>
                  <p className="text-xs text-slate-400">New UTXOs created for recipients</p>
                </div>
                <div>
                  <p className="text-yellow-400 font-semibold">Signatures</p>
                  <p className="text-xs text-slate-400">Cryptographic proof of ownership</p>
                </div>
              </>
            )}
            {visualizationType === 'smartcontract' && (
              <>
                <div>
                  <p className="text-blue-400 font-semibold">Bytecode</p>
                  <p className="text-xs text-slate-400">Compiled contract code on blockchain</p>
                </div>
                <div>
                  <p className="text-green-400 font-semibold">ABI</p>
                  <p className="text-xs text-slate-400">Application Binary Interface for interaction</p>
                </div>
                <div>
                  <p className="text-yellow-400 font-semibold">Gas</p>
                  <p className="text-xs text-slate-400">Computational cost for execution</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-3">Learning Objectives</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="text-green-400">✓</span>
              <span>Understand blockchain data structure</span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-400">✓</span>
              <span>Visualize decentralization</span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-400">✓</span>
              <span>Explore cryptographic linking</span>
            </li>
            <li className="flex gap-2">
              <span className="text-green-400">✓</span>
              <span>Observe consensus mechanisms</span>
            </li>
          </ul>
        </div>
      </div>

      {/* VR Viewer */}
      <VRViewer
        src={vrUrl}
        title={title}
        moduleCode={moduleCode}
        activityId={activityId}
        onComplete={onComplete}
        requiresVR={false}
      />

      {/* Additional Resources */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="font-semibold text-blue-300 mb-2">💡 Pro Tip</h4>
        <p className="text-sm text-blue-100">
          This visualization is interactive! Click on blocks, transactions, or nodes to see detailed information. 
          Try the VR mode for an immersive experience walking through the blockchain structure.
        </p>
      </div>
    </div>
  );
}
