import React, { useState, useEffect } from 'react';
import { KeyMapping, MidiDevice } from '../types';
import { audioService } from '../audioEngine';
import { X, Usb, Cpu, Zap, RotateCcw } from 'lucide-react';

interface MidiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyMappings: KeyMapping[];
  onUpdateMappings: (mappings: KeyMapping[]) => void;
}

export default function MidiConfigModal({
  isOpen,
  onClose,
  keyMappings,
  onUpdateMappings,
}: MidiConfigModalProps) {
  const [availableDevices, setAvailableDevices] = useState<MidiDevice[]>([]);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState<string>('');
  const [midiSupported, setMidiSupported] = useState<boolean>(false);
  const [activeEditingKey, setActiveEditingKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch devices
      setMidiSupported(audioService.midiEnabled);
      const devices = audioService.midiOutputs.map((out: any) => ({
        id: out.id,
        name: out.name,
        manufacturer: out.manufacturer || 'Generic',
      }));
      setAvailableDevices(devices);
      if (audioService.selectedMidiOutput) {
        setSelectedDeviceIndex(audioService.selectedMidiOutput.id);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDeviceIndex(val);
    audioService.selectMidiDevice(val);
  };

  const handleMidiNoteChange = (code: string, newNote: number) => {
    const nextMapped = keyMappings.map((k) => {
      if (k.code === code) {
        // Clamp MIDI values between 0 and 127
        const clampedNote = Math.min(Math.max(newNote, 0), 127);
        // Note names mapping helper
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(clampedNote / 12) - 1;
        const nameIdx = clampedNote % 12;
        const updatedName = k.type === 'piano' ? `${noteNames[nameIdx]}${octave}` : k.name;
        
        return {
          ...k,
          midiNote: clampedNote,
          name: updatedName,
        };
      }
      return k;
    });
    onUpdateMappings(nextMapped);
  };

  const resetToDefault = () => {
    // Standard initialization mapping trigger
    const defaultMappings: KeyMapping[] = [
      { code: 'KeyA', keyLabel: 'A', midiNote: 60, name: 'C4', type: 'piano' },
      { code: 'KeyW', keyLabel: 'W', midiNote: 61, name: 'C#4', type: 'piano' },
      { code: 'KeyS', keyLabel: 'S', midiNote: 62, name: 'D4', type: 'piano' },
      { code: 'KeyE', keyLabel: 'E', midiNote: 63, name: 'D#4', type: 'piano' },
      { code: 'KeyD', keyLabel: 'D', midiNote: 64, name: 'E4', type: 'piano' },
      { code: 'KeyF', keyLabel: 'F', midiNote: 65, name: 'F4', type: 'piano' },
      { code: 'KeyT', keyLabel: 'T', midiNote: 66, name: 'F#4', type: 'piano' },
      { code: 'KeyG', keyLabel: 'G', midiNote: 67, name: 'G4', type: 'piano' },
      { code: 'KeyY', keyLabel: 'Y', midiNote: 68, name: 'G#4', type: 'piano' },
      { code: 'KeyH', keyLabel: 'H', midiNote: 69, name: 'A4', type: 'piano' },
      { code: 'KeyU', keyLabel: 'U', midiNote: 70, name: 'A#4', type: 'piano' },
      { code: 'KeyJ', keyLabel: 'J', midiNote: 71, name: 'B4', type: 'piano' },
      { code: 'KeyK', keyLabel: 'K', midiNote: 72, name: 'C5', type: 'piano' },
      { code: 'KeyO', keyLabel: 'O', midiNote: 73, name: 'C#5', type: 'piano' },
      { code: 'KeyL', keyLabel: 'L', midiNote: 74, name: 'D5', type: 'piano' },
      { code: 'KeyP', keyLabel: 'P', midiNote: 75, name: 'D#5', type: 'piano' },
      { code: 'Semicolon', keyLabel: ';', midiNote: 76, name: 'E5', type: 'piano' },
      // Drums Mappings
      { code: 'Space', keyLabel: 'Space', midiNote: 36, name: 'Kick', type: 'drum' },
      { code: 'KeyZ', keyLabel: 'Z', midiNote: 38, name: 'Snare', type: 'drum' },
      { code: 'KeyX', keyLabel: 'X', midiNote: 42, name: 'Closed HH', type: 'drum' },
      { code: 'KeyC', keyLabel: 'C', midiNote: 46, name: 'Open HH', type: 'drum' },
      { code: 'KeyV', keyLabel: 'V', midiNote: 49, name: 'Crash Cymbal', type: 'drum' },
      { code: 'KeyB', keyLabel: 'B', midiNote: 39, name: 'Clap Effect', type: 'drum' },
    ];
    onUpdateMappings(defaultMappings);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div 
        id="midi-config-modal-panel"
        className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
      >
        {/* Purple neon heading accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-indigo-500 to-cyan-500" />
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Usb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">MIDI Mapping Controller & Settings</h2>
              <p className="text-xs text-neutral-400">Routes real-time physical triggers directly to DAW plugins</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Hardware Connection Section */}
          <div className="bg-neutral-950/60 p-5 rounded-2xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Selected DAW Port (MIDI Output)
              </label>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 rounded-full border border-neutral-800 text-[10px] uppercase font-mono tracking-wider font-bold">
                <span className={`w-2 h-2 rounded-full ${midiSupported ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {midiSupported ? 'WebMIDI Enabled' : 'Not Supported'}
              </div>
            </div>

            {midiSupported ? (
              <div className="space-y-3">
                <select
                  value={selectedDeviceIndex}
                  onChange={handleDeviceChange}
                  className="w-full px-4 py-3 bg-neutral-900 text-neutral-100 rounded-xl border border-neutral-800 text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {availableDevices.length === 0 ? (
                    <option value="">No Active MIDI Devices Connected</option>
                  ) : (
                    availableDevices.map((dev) => (
                      <option key={dev.id} value={dev.id}>
                        {dev.name} {dev.manufacturer ? `(${dev.manufacturer})` : ''}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[11px] text-neutral-500 italic">
                  Tip: Open a virtual midi bus utility (e.g., loopMIDI for Windows or IAC Driver on macOS) to route keys straight into FL Studio, Ableton, or Logic Pro.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-amber-500/5 col-span-2 border border-amber-500/15 rounded-xl text-xs text-amber-200/80 leading-relaxed">
                Your current browser does not have Web MIDI permission or support. You can still compose using the gorgeous high-fidelity built-in synthesizer!
              </div>
            )}
          </div>

          {/* Mapping Grid Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Physical Keyboard MIDI Note Matrix
              </h3>
              <button
                onClick={resetToDefault}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/5 hover:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/10 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
            </div>

            {/* Key list */}
            <div className="grid grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
              {keyMappings.map((map) => (
                <div 
                  key={map.code}
                  className="flex items-center justify-between p-3.5 bg-neutral-900/40 hover:bg-neutral-900 rounded-xl border border-neutral-800/80 transition-all gap-4"
                >
                  <div className="flex items-center gap-3">
                    {/* PC Key Caps Style */}
                    <div className="min-w-[42px] h-9 px-1 bg-neutral-800 border-b-2 border-neutral-700 hover:border-b-0 rounded-lg flex items-center justify-center font-mono text-sm text-neutral-100 shadow-inner font-bold uppercase select-none">
                      {map.keyLabel}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-300">{map.name}</div>
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{map.type} Mapping</div>
                    </div>
                  </div>

                  {/* Note editor control */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMidiNoteChange(map.code, map.midiNote - 1)}
                      className="w-7 h-7 bg-neutral-800 border border-neutral-700 rounded-lg flex items-center justify-center text-xs text-neutral-100 hover:bg-neutral-700 cursor-pointer select-none"
                    >
                      -
                    </button>
                    <div className="w-9 text-center font-mono text-xs text-white font-semibold">
                      {map.midiNote}
                    </div>
                    <button
                      onClick={() => handleMidiNoteChange(map.code, map.midiNote + 1)}
                      className="w-7 h-7 bg-neutral-800 border border-neutral-700 rounded-lg flex items-center justify-center text-xs text-neutral-100 hover:bg-neutral-700 cursor-pointer select-none"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-neutral-950/60 border-t border-neutral-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/20 active:scale-95"
          >
            Save Matrix Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
