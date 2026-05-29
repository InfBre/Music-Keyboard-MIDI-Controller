import React, { useState, useEffect, useCallback, useRef } from 'react';
import { KeyMapping, BackingStem } from './types';
import { audioService } from './audioEngine';
import Knob from './components/Knob';
import InstrumentKeyboard from './components/InstrumentKeyboard';
import DrumKit from './components/DrumKit';
import Visualizer from './components/Visualizer';
import MidiConfigModal from './components/MidiConfigModal';
import { 
  Play, 
  Pause, 
  HelpCircle, 
  Sliders, 
  Music,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [initFinished, setInitFinished] = useState(false);
  const [isMidiModalOpen, setIsMidiModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [activeStep, setActiveStep] = useState(0);

  // FX Parameters
  const [delayFeedback, setDelayFeedback] = useState(35);
  const [reverbWet, setReverbWet] = useState(30);

  // Keys active indicator registers
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());
  const [activeDrums, setActiveDrums] = useState<Set<string>>(new Set());

  // Interactive documentation toggle
  const [showHelp, setShowHelp] = useState(true);

  // Key Mappings State
  const [keyMappings, setKeyMappings] = useState<KeyMapping[]>([
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
    // MPC Sound Pads
    { code: 'Space', keyLabel: 'Space', midiNote: 36, name: 'Kick', type: 'drum' },
    { code: 'KeyZ', keyLabel: 'Z', midiNote: 38, name: 'Snare', type: 'drum' },
    { code: 'KeyX', keyLabel: 'X', midiNote: 42, name: 'Closed HH', type: 'drum' },
    { code: 'KeyC', keyLabel: 'C', midiNote: 46, name: 'Open HH', type: 'drum' },
    { code: 'KeyV', keyLabel: 'V', midiNote: 49, name: 'Crash Cymbal', type: 'drum' },
    { code: 'KeyB', keyLabel: 'B', midiNote: 39, name: 'Clap Effect', type: 'drum' },
  ]);

  // Backing Stems List matched precisely to style reference
  const [stems, setStems] = useState<BackingStem[]>([
    { id: 'bossa-nova', name: 'Bossa Nova', volume: 0.15, isActive: false, color: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.45)', tempoMultiplier: 1, role: 'chord', pattern: [1,0,0,1, 0,0,1,0, 1,0,1,0, 0,1,0,0], synthType: 'kick' },
    { id: 'chillwave', name: 'Chillwave', volume: 0.45, isActive: false, color: '#06b6d4', glowColor: 'rgba(6, 182, 212, 0.45)', tempoMultiplier: 1, role: 'chord', pattern: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], synthType: 'pad' },
    { id: 'drum-and-bass', name: 'Drum & Bass', volume: 0.65, isActive: true, color: '#ec4899', glowColor: 'rgba(236, 72, 153, 0.7)', tempoMultiplier: 1.5, role: 'drum', pattern: [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,1,0,0], synthType: 'kick' },
    { id: 'post-punk', name: 'Post Punk', volume: 0.2, isActive: false, color: '#a855f7', glowColor: 'rgba(168, 85, 247, 0.45)', tempoMultiplier: 1, role: 'bass', pattern: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], synthType: 'bass-synth' },
    
    { id: 'shoegaze', name: 'Shoegaze', volume: 0.35, isActive: false, color: '#10b981', glowColor: 'rgba(16, 185, 129, 0.45)', tempoMultiplier: 1, role: 'chord', pattern: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], synthType: 'strings' },
    { id: 'funk', name: 'Funk', volume: 0.7, isActive: true, color: '#14b8a6', glowColor: 'rgba(20, 184, 166, 0.7)', tempoMultiplier: 1, role: 'bass', pattern: [1,0,1,0, 0,1,0,1, 1,0,1,0, 0,1,1,0], synthType: 'bass-synth' },
    { id: 'chiptune', name: 'Chiptune', volume: 0.4, isActive: false, color: '#6366f1', glowColor: 'rgba(99, 102, 241, 0.45)', tempoMultiplier: 1, role: 'melody', pattern: [1,0,1,1, 0,1,1,0, 1,1,0,1, 0,1,0,1], synthType: 'arpeggiator' },
    { id: 'lush-strings', name: 'Lush Strings', volume: 0.15, isActive: false, color: '#3b82f6', glowColor: 'rgba(59, 130, 246, 0.45)', tempoMultiplier: 1, role: 'chord', pattern: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], synthType: 'strings' },
    
    { id: 'sparkling-arp', name: 'Sparkling Arp', volume: 0.6, isActive: true, color: '#a3e635', glowColor: 'rgba(163, 230, 53, 0.7)', tempoMultiplier: 2, role: 'melody', pattern: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], synthType: 'arpeggiator' },
    { id: 'staccato', name: 'Staccatos', volume: 0.5, isActive: false, color: '#c084fc', glowColor: 'rgba(192, 132, 252, 0.45)', tempoMultiplier: 1, role: 'melody', pattern: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], synthType: 'arpeggiator' },
    { id: 'punchy-kick', name: 'Punchy Kick', volume: 0.75, isActive: true, color: '#2dd4bf', glowColor: 'rgba(45, 212, 191, 0.7)', tempoMultiplier: 1, role: 'drum', pattern: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], synthType: 'kick' },
    { id: 'dubstep', name: 'Dubstep', volume: 0.1, isActive: false, color: '#ea580c', glowColor: 'rgba(234, 88, 12, 0.45)', tempoMultiplier: 1, role: 'bass', pattern: [1,0,0,0, 0,0,1,0, 1,0,0,1, 0,1,0,0], synthType: 'bass-synth' },
  ]);

  // Lazy Initialization triggered on first mouse click/tap anywhere
  const triggerLazyInit = () => {
    if (!initFinished) {
      audioService.init();
      // Sync defaults
      audioService.setBPM(bpm);
      audioService.setDJDelayFeedback(delayFeedback);
      audioService.setDJReverbWet(reverbWet);
      
      // Setup default active stems loop
      stems.forEach(s => {
        audioService.setStemVolume(s.id, s.volume);
        if (s.isActive !== audioService.stems.find(x => x.id === s.id)?.isActive) {
          audioService.toggleStem(s.id);
        }
      });
      setInitFinished(true);
    }
  };

  // 12 Knobs Volume Multiplier change
  const handleStemVolumeChange = (id: string, newVol: number) => {
    triggerLazyInit();
    setStems(prev => prev.map(s => {
      if (s.id === id) {
        audioService.setStemVolume(id, newVol);
        
        let nextActiveState = s.isActive;
        // Dragging the volume up automatically turns the stem ON so they can immediately hear it and see its neon color!
        if (newVol > 0.02 && !s.isActive) {
          audioService.setStemActive(id, true);
          nextActiveState = true;
        } else if (newVol <= 0.01 && s.isActive) {
          // Dragging to absolute zero turns the stem OFF
          audioService.setStemActive(id, false);
          nextActiveState = false;
        }
        
        return { ...s, volume: newVol, isActive: nextActiveState };
      }
      return s;
    }));
  };

  // 12 Knobs Stem Loop Toggle Trigger
  const handleStemToggleActive = (id: string) => {
    triggerLazyInit();
    setStems(prev => prev.map(s => {
      if (s.id === id) {
        const nextActiveState = !s.isActive;
        audioService.setStemActive(id, nextActiveState);
        return { ...s, isActive: nextActiveState };
      }
      return s;
    }));
  };

  // Keyboard note handler abstractions
  const handleNoteOn = useCallback((note: number) => {
    triggerLazyInit();
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.add(note);
      return next;
    });
    audioService.playPianoNote(note);
  }, [initFinished]);

  const handleNoteOff = useCallback((note: number) => {
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
    audioService.stopPianoNote(note);
  }, []);

  const handleTriggerDrum = useCallback((id: string) => {
    triggerLazyInit();
    setActiveDrums(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      setActiveDrums(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 120);
  }, [initFinished]);

  // Master BPM Speed Controller
  const handleBPMChange = (newBpm: number) => {
    const clamped = Math.min(Math.max(newBpm, 40), 240);
    setBpm(clamped);
    audioService.setBPM(clamped);
  };

  // Master Delay FX
  const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setDelayFeedback(val);
    audioService.setDJDelayFeedback(val);
  };

  // Master Reverb FX
  const handleReverbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setReverbWet(val);
    audioService.setDJReverbWet(val);
  };

  // Sequencer Play / Pause toggle
  const handlePlaybackToggle = () => {
    triggerLazyInit();
    const isNowRunning = audioService.togglePlayback((step: number) => {
      setActiveStep(step);
    });
    setIsPlaying(isNowRunning);
  };

  // Keyboard Event Management (Hook layout)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid spacebar page scroll
      if (e.code === 'Space') {
        e.preventDefault();
      }

      if (e.repeat) return; // ignore repeats

      const mapping = keyMappings.find(m => m.code === e.code);
      if (mapping) {
        triggerLazyInit(); // Initialize audio context on keyboard triggering!
        if (mapping.type === 'piano') {
          handleNoteOn(mapping.midiNote);
        } else {
          // Play drum synthesiser stem
          const drumType = mapping.name.toLowerCase().replace(' ', '');
          let drumKey: 'kick' | 'snare' | 'hihat' | 'clap' | 'crash' | 'tom' = 'kick';
          
          if (mapping.name === 'Kick') drumKey = 'kick';
          else if (mapping.name === 'Snare') drumKey = 'snare';
          else if (mapping.name === 'Closed HH') drumKey = 'hihat';
          else if (mapping.name === 'Open HH') drumKey = 'tom';
          else if (mapping.name === 'Crash Cymbal') drumKey = 'crash';
          else if (mapping.name === 'Clap Effect') drumKey = 'clap';

          audioService.triggerDrum(drumKey);
          handleTriggerDrum(drumKey);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const mapping = keyMappings.find(m => m.code === e.code);
      if (mapping && mapping.type === 'piano') {
        handleNoteOff(mapping.midiNote);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyMappings, handleNoteOn, handleNoteOff, handleTriggerDrum]);

  return (
    <div className="min-h-screen bg-[#070707] text-[#ebebeb] flex flex-col font-sans select-none overflow-x-hidden pb-12">
      
      {/* Top Header Bar */}
      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-pink-500/20 to-cyan-500/20 border border-indigo-500/30 rounded-xl">
            <Music className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider uppercase bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
              VIBEKEYBOARD & MIDI CONTROLLER
            </h1>
            <p className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">
              Pro Synthesis Engine &bull; Interactive Knobs Sequencer
            </p>
          </div>
        </div>

        {/* MIDI Activation Toggle Button (Style matched top-left button in ref image) */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMidiModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono font-black text-xs cursor-pointer active:scale-95 transition-all shadow-[0_0_15px_rgba(99,102,241,0.15)] uppercase flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            MIDI Map
          </button>
          
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="Toggle Quick Guide"
          >
            <HelpCircle className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Studio Workspace Bento Grid */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Lazy Init Intercept Screen (If user hasn't clicked and wants to play right away) */}
        {!initFinished && (
          <div 
            onClick={triggerLazyInit}
            className="lg:col-span-12 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-505/20 cursor-pointer p-4 rounded-2xl flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <div className="text-left">
                <span className="text-xs font-bold text-cyan-200">Audio Synthesis Engine Offline</span>
                <p className="text-[10px] text-neutral-400">Click anywhere to start the local synthesizers and MIDI devices mapping stream.</p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/20">
              Initialize Context
            </span>
          </div>
        )}

        {/* Column Left: Stems Knobs Grid (Perfect replicate of reference style image!) */}
        <section className="lg:col-span-7 bg-neutral-950 rounded-3xl border border-neutral-900 p-6 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle grid light decor */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-pink-500/5 to-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Knobs Section Title */}
          <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4.5 h-4.5 text-pink-500" />
              <span className="text-xs font-black uppercase tracking-widest text-neutral-400 font-mono">
                Accompaniment Stem Controller & Filters
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase mr-1">Ticking Step</span>
              <div className="flex gap-1">
                {Array.from({ length: 16 }).map((_, step) => (
                  <div
                    key={step}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-75 ${
                      isPlaying && activeStep === step
                        ? 'bg-emerald-400 scale-125'
                        : 'bg-neutral-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Knobs 4x3 Studio Console Grid layout */}
          <div className="grid grid-cols-4 gap-x-2 gap-y-6 pt-2">
            {stems.map((stem) => (
              <Knob
                key={stem.id}
                id={stem.id}
                name={stem.name}
                value={stem.volume}
                isActive={stem.isActive}
                color={stem.color}
                glowColor={stem.glowColor}
                onValueChange={(val) => handleStemVolumeChange(stem.id, val)}
                onToggleActive={() => handleStemToggleActive(stem.id)}
              />
            ))}
          </div>

          {/* Lower Grid Control: Large Sync Playback Button & Master Tempo (styled like bottom of ref image) */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-4 border-t border-neutral-900 gap-4">
            
            {/* Master BPM Section */}
            <div className="flex items-center gap-3 bg-neutral-900/60 p-2.5 rounded-2xl border border-neutral-850 w-full md:w-auto">
              <div className="text-left px-2">
                <span className="text-[9px] font-mono uppercase font-black text-neutral-500">Master Tempo</span>
                <div className="text-lg font-mono font-black text-white">{bpm} BPM</div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleBPMChange(bpm + 5)}
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-xs text-white rounded-md font-mono cursor-pointer"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleBPMChange(bpm - 5)}
                  className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-xs text-white rounded-md font-mono cursor-pointer"
                >
                  ▼
                </button>
              </div>
              <input
                type="range"
                min="40"
                max="240"
                value={bpm}
                onChange={(e) => handleBPMChange(parseInt(e.target.value))}
                className="w-24 accent-pink-500 h-1 rounded-lg cursor-pointer bg-neutral-800 ml-2 hidden sm:block"
              />
            </div>

            {/* Central Round Sequencer Trigger (Matches pause play button at bottom of ref image) */}
            <div className="flex items-center justify-center">
              <button
                onClick={handlePlaybackToggle}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 relative ${
                  isPlaying
                    ? 'bg-neutral-100 hover:bg-white text-black shadow-white/10'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                }`}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current stroke-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current stroke-current ml-1" />
                )}
                {/* Micro-led running light */}
                <span className={`absolute -top-1 right-2 w-3 h-3 rounded-full border border-neutral-950 ${
                  isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`} />
              </button>
            </div>

            {/* EQ Sculpt Space (Delay/Reverb Wet) */}
            <div className="flex items-center gap-6 bg-neutral-900/40 p-2.5 rounded-2xl border border-neutral-850/60 w-full md:w-auto text-[11px] font-mono">
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] text-neutral-500 font-bold uppercase">Delay Wet: {delayFeedback}%</span>
                <input
                  type="range"
                  min="0"
                  max="85"
                  value={delayFeedback}
                  onChange={handleDelayChange}
                  className="w-20 accent-indigo-500 h-1 bg-neutral-850 cursor-pointer rounded-lg"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] text-neutral-500 font-bold uppercase">Reverb Hall: {reverbWet}%</span>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={reverbWet}
                  onChange={handleReverbChange}
                  className="w-20 accent-purple-500 h-1 bg-neutral-850 cursor-pointer rounded-lg"
                />
              </div>
            </div>

          </div>
        </section>

        {/* Column Right: Sound Visualizer, Mapped Keyboard, and Drum pads */}
        <section className="lg:col-span-5 space-y-6 flex flex-col h-full">
          
          {/* Real-time Oscilloscope Analytics block */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-4 shadow-xl">
            <Visualizer />
          </div>

          {/* Drum Kit pads section */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-5 shadow-xl">
            <DrumKit 
              keyMappings={keyMappings} 
              activeDrums={activeDrums}
              onTriggerDrum={handleTriggerDrum}
            />
          </div>

          {/* Piano synth keys */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-5 shadow-xl flex-1 flex flex-col justify-between">
            <InstrumentKeyboard 
              keyMappings={keyMappings}
              activeKeys={activeKeys}
              onNoteOn={handleNoteOn}
              onNoteOff={handleNoteOff}
            />
          </div>
          
        </section>

        {/* Floating Quick Guide Section */}
        {showHelp && (
          <section className="lg:col-span-12 bg-neutral-950/60 p-5 rounded-3xl border border-neutral-850/80 mt-2">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-widest font-mono mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Quick Composer Keyboard Manual
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-neutral-400 leading-relaxed font-mono">
              <div>
                <span className="text-white font-bold">1. Piano Keys (ASDFRow)</span>
                <p className="mt-1">Play white piano keys using <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-bold text-[10px] text-indigo-300 border border-neutral-700">A</kbd> to <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-bold text-[10px] text-indigo-300 border border-neutral-700">;</kbd></p>
              </div>
              <div>
                <span className="text-white font-bold">2. Piano Accidentals (WETYRow)</span>
                <p className="mt-1">Accidental black piano keys map to upper row keys: <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-bold text-[10px] text-pink-300 border border-neutral-700">W</kbd> <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-bold text-[10px] text-pink-300 border border-neutral-700">E</kbd> <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-bold text-[10px] text-pink-300 border border-neutral-700">T</kbd> <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-bold text-[10px] text-pink-300 border border-neutral-700">Y</kbd> <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-bold text-[10px] text-pink-300 border border-neutral-700">U</kbd> <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-bold text-[10px] text-pink-300 border border-neutral-700">O</kbd> <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-bold text-[10px] text-pink-300 border border-neutral-700">P</kbd></p>
              </div>
              <div>
                <span className="text-white font-bold">3. Drum Pads triggers</span>
                <p className="mt-1">Trigger Snare using <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-bold text-[10px] border border-neutral-700">Z</kbd>, Hihats with <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-bold text-[10px] border border-neutral-700">X</kbd>, Tom with <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-bold text-[10px] border border-neutral-700">C</kbd>, Crash <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-bold text-[10px] border border-neutral-700">V</kbd>, Clap <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-bold text-[10px] border border-neutral-700">B</kbd>. Trigger the Kick using <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-bold text-[10px] border border-neutral-700">Spacebar</kbd>!</p>
              </div>
              <div>
                <span className="text-white font-bold">4. Accompaniment stems</span>
                <p className="mt-1">Click a dial loop knob to toggle stem sequencer layers (Bossa, Drum & Bass, Funk). Drag up/down on dials to alter mixing levels and filter cutoffs!</p>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* Web MIDI Mapping Configuration Modal Popup */}
      <MidiConfigModal
        isOpen={isMidiModalOpen}
        onClose={() => setIsMidiModalOpen(false)}
        keyMappings={keyMappings}
        onUpdateMappings={(updated) => setKeyMappings(updated)}
      />

    </div>
  );
}
