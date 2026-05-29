export interface KeyMapping {
  code: string;       // KeyboardEvent.code (e.g., "KeyA")
  keyLabel: string;   // Visual label (e.g., "A")
  midiNote: number;   // MIDI note number (60 = C4)
  name: string;       // Note/Pad name (e.g., "C4", "Kick")
  type: 'piano' | 'drum';
}

export interface BackingStem {
  id: string;
  name: string;
  volume: number;      // 0.0 to 1.0
  isActive: boolean;
  color: string;       // e.g., "rgba(244, 63, 94, 0.82)" (magenta, cyan, etc)
  glowColor: string;   // e.g., "shadow-[0_0_25px_rgba(...)]"
  tempoMultiplier: number;
  role: 'drum' | 'bass' | 'chord' | 'melody' | 'fx';
  // Sequencing info for real-time synthesis
  pattern: number[];  // Array of 16 steps (velocities/triggers)
  synthType: 'kick' | 'snare' | 'hihat' | 'bass-synth' | 'pad' | 'arpeggiator' | 'strings';
}

export interface DrumPad {
  id: string;
  name: string;
  triggerKey: string; // The physical key letter used (e.g., "Q", "Space")
  keyCode: string;    // e.g., "KeyQ", "Space"
  midiNote: number;   // e.g., 36 for kick
  color: string;      // Tailind color classes
  soundType: 'kick' | 'snare' | 'hihat' | 'clap' | 'crash' | 'tom';
}

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer?: string;
}
