import React from 'react';
import { KeyMapping } from '../types';

interface InstrumentKeyboardProps {
  keyMappings: KeyMapping[];
  activeKeys: Set<number>;
  onNoteOn: (note: number) => void;
  onNoteOff: (note: number) => void;
}

export default function InstrumentKeyboard({
  keyMappings,
  activeKeys,
  onNoteOn,
  onNoteOff,
}: InstrumentKeyboardProps) {
  
  // Natural layout notes spanning C4 (60) to E5 (76)
  const pianoKeys = [
    { note: 60, isBlack: false, name: 'C4', keyLabel: 'A' },
    { note: 61, isBlack: true, name: 'C#4', keyLabel: 'W' },
    { note: 62, isBlack: false, name: 'D4', keyLabel: 'S' },
    { note: 63, isBlack: true, name: 'D#4', keyLabel: 'E' },
    { note: 64, isBlack: false, name: 'E4', keyLabel: 'D' },
    { note: 65, isBlack: false, name: 'F4', keyLabel: 'F' },
    { note: 66, isBlack: true, name: 'F#4', keyLabel: 'T' },
    { note: 67, isBlack: false, name: 'G4', keyLabel: 'G' },
    { note: 68, isBlack: true, name: 'G#4', keyLabel: 'Y' },
    { note: 69, isBlack: false, name: 'A4', keyLabel: 'H' },
    { note: 70, isBlack: true, name: 'A#4', keyLabel: 'U' },
    { note: 71, isBlack: false, name: 'B4', keyLabel: 'J' },
    { note: 72, isBlack: false, name: 'C5', keyLabel: 'K' },
    { note: 73, isBlack: true, name: 'C#5', keyLabel: 'O' },
    { note: 74, isBlack: false, name: 'D5', keyLabel: 'L' },
    { note: 75, isBlack: true, name: 'D#5', keyLabel: 'P' },
    { note: 76, isBlack: false, name: 'E5', keyLabel: ';' },
  ];

  const handleMouseDown = (note: number) => {
    onNoteOn(note);
  };

  const handleMouseEnter = (e: React.MouseEvent, note: number) => {
    // If the mouse was already held down, support dragging triggers
    if (e.buttons === 1) {
      onNoteOn(note);
    }
  };

  const handleMouseLeaveOrUp = (note: number) => {
    onNoteOff(note);
  };

  // Divide into natural white keys vs black keys for proper musical rendering overlapping
  const whiteKeys = pianoKeys.filter(k => !k.isBlack);
  const blackKeys = pianoKeys.filter(k => k.isBlack);

  return (
    <div className="w-full flex flex-col space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-widest font-mono">Piano Synthesizer Keyboard</h3>
        </div>
        <p className="text-[10px] text-neutral-500 font-mono">
          Play with PC keys, click keys, or slide across keys
        </p>
      </div>

      {/* Visual Keyboard Wrapper */}
      <div className="relative h-60 bg-neutral-950 p-2 rounded-2xl border border-neutral-800 shadow-inner flex overflow-hidden select-none">
        {/* Render White Keys */}
        <div className="flex-1 flex gap-1 h-full z-10">
          {whiteKeys.map((key) => {
            const isPlaying = activeKeys.has(key.note);
            const mapping = keyMappings.find(m => m.midiNote === key.note);
            const mappedLabel = mapping ? mapping.keyLabel : key.keyLabel;

            return (
              <div
                key={key.note}
                id={`white-key-${key.note}`}
                onMouseDown={() => handleMouseDown(key.note)}
                onMouseEnter={(e) => handleMouseEnter(e, key.note)}
                onMouseUp={() => handleMouseLeaveOrUp(key.note)}
                onMouseLeave={() => handleMouseLeaveOrUp(key.note)}
                className={`flex-1 flex flex-col justify-end items-center pb-5 rounded-md border border-neutral-300/10 cursor-pointer select-none transition-all duration-75 relative ${
                  isPlaying
                    ? 'bg-gradient-to-t from-indigo-500 via-indigo-600 to-indigo-400 h-[99%] shadow-lg shadow-indigo-500/20 text-white'
                    : 'bg-gradient-to-b from-neutral-100 to-white hover:from-neutral-200 hover:to-neutral-50 text-neutral-800 shadow-sm active:h-[99%]'
                }`}
              >
                {/* Visual tactile bottom border */}
                <div className={`absolute bottom-0 inset-x-0 h-1.5 rounded-b-md ${
                  isPlaying ? 'bg-indigo-300' : 'bg-neutral-300'
                }`} />

                {/* Keyboard Character Indicator */}
                <div className={`w-6 h-6 rounded-md font-mono text-[10px] font-bold flex items-center justify-center shadow-inner ${
                  isPlaying 
                    ? 'bg-indigo-700/60 text-white border border-indigo-400/20' 
                    : 'bg-neutral-150 border border-neutral-250 text-neutral-500'
                }`}>
                  {mappedLabel}
                </div>

                {/* Note Label */}
                <span className="text-[9px] font-bold mt-1.5 font-mono uppercase tracking-wider opacity-60">
                  {key.name}
                </span>
                
                {/* Active glow dot */}
                {isPlaying && (
                  <span className="absolute top-4 w-2 h-2 rounded-full bg-white shadow-[0_0_12px_#fff]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Render Black Keys Overlaid (Absolute positioning offset) */}
        {blackKeys.map((key) => {
          const isPlaying = activeKeys.has(key.note);
          const mapping = keyMappings.find(m => m.midiNote === key.note);
          const mappedLabel = mapping ? mapping.keyLabel : key.keyLabel;

          // Align black keys accurately above their neighboring white keys splits
          let offsetLeftClass = '';
          if (key.note === 61) offsetLeftClass = 'left-[7.4%]';   // C#4
          else if (key.note === 63) offsetLeftClass = 'left-[17.4%]'; // D#4
          else if (key.note === 66) offsetLeftClass = 'left-[37.4%]'; // F#4
          else if (key.note === 68) offsetLeftClass = 'left-[47.4%]'; // G#4
          else if (key.note === 70) offsetLeftClass = 'left-[57.4%]'; // A#4
          else if (key.note === 73) offsetLeftClass = 'left-[77.4%]'; // C#5
          else if (key.note === 75) offsetLeftClass = 'left-[87.4%]'; // D#5

          return (
            <div
              key={key.note}
              id={`black-key-${key.note}`}
              onMouseDown={() => handleMouseDown(key.note)}
              onMouseEnter={(e) => handleMouseEnter(e, key.note)}
              onMouseUp={() => handleMouseLeaveOrUp(key.note)}
              onMouseLeave={() => handleMouseLeaveOrUp(key.note)}
              style={{ width: '4.8%' }}
              className={`absolute h-34 rounded-b-lg border border-neutral-900/60 cursor-pointer select-none z-20 flex flex-col justify-end items-center pb-3 shadow-md transition-all duration-75 ${offsetLeftClass} ${
                isPlaying
                  ? 'bg-gradient-to-t from-pink-500 via-pink-600 to-pink-400 text-white shadow-lg shadow-pink-500/20'
                  : 'bg-gradient-to-b from-neutral-850 to-neutral-950 hover:from-neutral-800 hover:to-neutral-900 text-neutral-400 active:h-33'
              }`}
            >
              {/* PC Keycaps */}
              <div className={`w-5 h-5 rounded-md font-mono text-[9px] font-black flex items-center justify-center shadow-inner ${
                isPlaying 
                  ? 'bg-pink-700/50 text-white' 
                  : 'bg-neutral-800 text-neutral-500'
              }`}>
                {mappedLabel}
              </div>

              {/* Note Tag */}
              <span className="text-[8px] font-bold mt-1 font-mono uppercase tracking-wider opacity-60">
                {key.name}
              </span>

              {/* Glowing active notch */}
              {isPlaying && (
                <span className="absolute top-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#fff]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
