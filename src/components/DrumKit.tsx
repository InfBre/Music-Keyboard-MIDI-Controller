import React, { useState } from 'react';
import { KeyMapping } from '../types';
import { audioService } from '../audioEngine';
import { Sparkles, Dribbble, Compass } from 'lucide-react';

interface DrumKitProps {
  keyMappings: KeyMapping[];
  activeDrums: Set<string>;
  onTriggerDrum: (type: 'kick' | 'snare' | 'hihat' | 'clap' | 'crash' | 'tom') => void;
}

export default function DrumKit({
  keyMappings,
  activeDrums,
  onTriggerDrum,
}: DrumKitProps) {
  const [velocity, setVelocity] = useState<number>(0.85);

  const padsList = [
    { id: 'kick', name: 'Kick Drum', triggerKey: 'SPACE', keyCode: 'Space', soundType: 'kick' as const, color: 'bg-emerald-500', glowColor: 'rgba(16, 185, 129, 0.4)' },
    { id: 'snare', name: 'Snare Drum', triggerKey: 'Z', keyCode: 'KeyZ', soundType: 'snare' as const, color: 'bg-indigo-500', glowColor: 'rgba(99, 102, 241, 0.4)' },
    { id: 'hihat', name: 'Closed Hat', triggerKey: 'X', keyCode: 'KeyX', soundType: 'hihat' as const, color: 'bg-cyan-500', glowColor: 'rgba(6, 182, 212, 0.4)' },
    { id: 'clap', name: 'Hand Clap', triggerKey: 'B', keyCode: 'KeyB', soundType: 'clap' as const, color: 'bg-rose-500', glowColor: 'rgba(244, 63, 94, 0.4)' },
    { id: 'crash', name: 'Crash Cymbal', triggerKey: 'V', keyCode: 'KeyV', soundType: 'crash' as const, color: 'bg-amber-500', glowColor: 'rgba(245, 158, 11, 0.4)' },
    { id: 'tom', name: 'Synth Tom', triggerKey: 'C', keyCode: 'KeyC', soundType: 'tom' as const, color: 'bg-purple-500', glowColor: 'rgba(168, 85, 247, 0.4)' },
  ];

  const handlePadClick = (soundType: 'kick' | 'snare' | 'hihat' | 'clap' | 'crash' | 'tom') => {
    // Pass standard volume velocity to custom synthesize engine
    audioService.triggerDrum(soundType, velocity);
    onTriggerDrum(soundType);
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Visual Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-widest font-mono">MPC Sound Pads</h3>
        </div>
        
        {/* Dynamic Velocity Slider Accent */}
        <div className="flex items-center gap-3 bg-neutral-900 px-4 py-1.5 rounded-xl border border-neutral-800">
          <span className="text-[10px] font-mono font-bold text-neutral-400">VELOCITY: {Math.round(velocity * 100)}%</span>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={velocity}
            onChange={(e) => setVelocity(parseFloat(e.target.value))}
            className="w-20 accent-emerald-500 h-1 rounded-lg cursor-pointer bg-neutral-800"
          />
        </div>
      </div>

      {/* Grid of responsive sound pads */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-950 rounded-2xl border border-neutral-800 relative shadow-inner">
        {padsList.map((pad) => {
          const isTriggered = activeDrums.has(pad.id);
          
          // Look up current mapped key trigger dynamic from properties override
          const mapping = keyMappings.find(m => m.code === pad.keyCode);
          const activeLabel = mapping ? mapping.keyLabel.toUpperCase() : pad.triggerKey;

          return (
            <button
              key={pad.id}
              onClick={() => handlePadClick(pad.soundType)}
              className="relative aspect-square rounded-2xl border border-neutral-800 cursor-pointer overflow-hidden transition-all duration-75 flex flex-col items-center justify-between p-4 bg-neutral-900 hover:bg-neutral-850 group active:scale-95 shadow-lg select-none"
              style={{
                boxShadow: isTriggered 
                  ? `0 0 25px 3px ${pad.glowColor}, inset 0 0 15px ${pad.glowColor}` 
                  : 'none',
                borderColor: isTriggered ? 'rgba(255,255,255,0.4)' : ''
              }}
            >
              {/* Corner Ambient Glow Line */}
              <div className="absolute top-0 right-0 w-8 h-8 opacity-20 filter blur-sm group-hover:opacity-40 transition-opacity bg-white rounded-full translate-x-3 -translate-y-3" />

              {/* PC Key Cap circle styling */}
              <div className={`w-8 h-8 rounded-lg font-mono text-xs font-black flex items-center justify-center transition-all ${
                isTriggered
                  ? 'bg-white text-black shadow-lg scale-110'
                  : 'bg-neutral-950 border border-neutral-800 text-neutral-400'
              }`}>
                {activeLabel}
              </div>

              {/* Pad title and responsive active glow button layout */}
              <div className="flex flex-col items-center space-y-1 z-10 text-center">
                <span className={`text-[11px] font-bold tracking-wide uppercase transition-colors ${
                  isTriggered ? 'text-white' : 'text-neutral-300'
                }`}>
                  {pad.name}
                </span>
                <span className="text-[8px] font-mono text-neutral-500 font-bold">
                  GM Note {mapping ? mapping.midiNote : '36'}
                </span>
              </div>

              {/* Lower visual active led strip */}
              <div className="w-full h-1 rounded-full bg-neutral-950 overflow-hidden">
                <div className={`h-full transition-all duration-100 ${pad.color}`} style={{
                  width: isTriggered ? '100%' : '15%'
                }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
