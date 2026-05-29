import { BackingStem } from './types';

class WebAudioEngine {
  public ctx: AudioContext | null = null;
  public analyser: AnalyserNode | null = null;
  private primaryGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  
  // Track active synthesizer notes for piano keys
  private activeOscillators: Map<number, { 
    oscillators: OscillatorNode[]; 
    gainNode: GainNode; 
    filterNode: BiquadFilterNode;
  }> = new Map();

  // Noise buffer for drum synthesis (snare/hats/effects)
  private noiseBuffer: AudioBuffer | null = null;

  // MIDI Access properties
  public midiAccess: any = null;
  public midiOutputs: any[] = [];
  public selectedMidiOutput: any = null;
  public midiEnabled = false;

  // Sequencer Variables
  private isSequencerRunning = false;
  private bpm = 120;
  private currentStep = 0;
  private nextStepTime = 0.0;
  private scheduleAheadTime = 0.1; // seconds
  private lookaheadInterval = 25.0; // milliseconds
  private sequencerTimerId: any = null;
  private loopChordProgression = [
    [60, 64, 67, 71], // Cmaj7
    [57, 60, 64, 67], // Am7
    [53, 57, 60, 64], // Fmaj7
    [55, 59, 62, 65], // G7
  ];

  // Callback to update current step in React UI
  private onStepChangeCallback: ((step: number) => void) | null = null;
  
  // Stem gain nodes
  private stemGains: Map<string, GainNode> = new Map();
  // Active stems state
  public stems: BackingStem[] = [];

  constructor() {
    // Initialise default stems (mapping the 12 knobs shown in style image)
    this.stems = [
      { id: 'bossa-nova', name: 'Bossa Nova', volume: 0.0, isActive: false, color: '#f43f5e', glowColor: 'rgba(244, 63, 94, 0.35)', tempoMultiplier: 1, role: 'chord', pattern: [1,0,0,1, 0,0,1,0, 1,0,1,0, 0,1,0,0], synthType: 'kick' },
      { id: 'chillwave', name: 'Chillwave', volume: 0.0, isActive: false, color: '#06b6d4', glowColor: 'rgba(6, 182, 212, 0.35)', tempoMultiplier: 1, role: 'chord', pattern: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], synthType: 'pad' },
      { id: 'drum-and-bass', name: 'Drum and Bass', volume: 0.6, isActive: true, color: '#ec4899', glowColor: 'rgba(236, 72, 153, 0.65)', tempoMultiplier: 1.5, role: 'drum', pattern: [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,1,0,0], synthType: 'kick' },
      { id: 'post-punk', name: 'Post Punk', volume: 0.0, isActive: false, color: '#8b5cf6', glowColor: 'rgba(139, 92, 246, 0.35)', tempoMultiplier: 1, role: 'bass', pattern: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], synthType: 'bass-synth' },
      
      { id: 'shoegaze', name: 'Shoegaze', volume: 0.0, isActive: false, color: '#10b981', glowColor: 'rgba(16, 185, 129, 0.35)', tempoMultiplier: 1, role: 'chord', pattern: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], synthType: 'strings' },
      { id: 'funk', name: 'Funk', volume: 0.7, isActive: true, color: '#14b8a6', glowColor: 'rgba(20, 184, 166, 0.65)', tempoMultiplier: 1, role: 'bass', pattern: [1,0,1,0, 0,1,0,1, 1,0,1,0, 0,1,1,0], synthType: 'bass-synth' },
      { id: 'chiptune', name: 'Chiptune', volume: 0.5, isActive: true, color: '#6366f1', glowColor: 'rgba(99, 102, 241, 0.65)', tempoMultiplier: 1, role: 'melody', pattern: [1,0,1,1, 0,1,1,0, 1,1,0,1, 0,1,0,1], synthType: 'arpeggiator' },
      { id: 'lush-strings', name: 'Lush Strings', volume: 0.0, isActive: false, color: '#3b82f6', glowColor: 'rgba(59, 130, 246, 0.35)', tempoMultiplier: 1, role: 'chord', pattern: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0], synthType: 'strings' },
      
      { id: 'sparkling-arp', name: 'Sparkling Arp', volume: 0.6, isActive: true, color: '#a3e635', glowColor: 'rgba(163, 230, 53, 0.65)', tempoMultiplier: 2, role: 'melody', pattern: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], synthType: 'arpeggiator' },
      { id: 'staccato', name: 'Staccato Rhythms', volume: 0.5, isActive: true, color: '#c084fc', glowColor: 'rgba(192, 132, 252, 0.65)', tempoMultiplier: 1, role: 'melody', pattern: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], synthType: 'arpeggiator' },
      { id: 'punchy-kick', name: 'Punchy Kick', volume: 0.8, isActive: true, color: '#2dd4bf', glowColor: 'rgba(45, 212, 191, 0.65)', tempoMultiplier: 1, role: 'drum', pattern: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], synthType: 'kick' },
      { id: 'dubstep', name: 'Dubstep', volume: 0.0, isActive: false, color: '#a855f7', glowColor: 'rgba(168, 85, 247, 0.35)', tempoMultiplier: 1, role: 'bass', pattern: [1,0,0,0, 0,0,1,0, 1,0,0,1, 0,1,0,0], synthType: 'bass-synth' },
    ];
  }

  // Initialise Audio Context on user action (browser restriction workaround)
  public init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(e => console.warn("Failed to resume context", e));
      }
      return;
    }
    
    // Create AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.warn("Failed to resume context", e));
    }
    
    // Primary Gain
    this.primaryGain = this.ctx.createGain();
    this.primaryGain.gain.setValueAtTime(0.7, this.ctx.currentTime); // Standard mix ceiling
    
    // Delay Bus
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(0.33, this.ctx.currentTime); // Triplet Delay effect
    this.delayGain = this.ctx.createGain();
    this.delayGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    // Reverb Convolver Simulator (Synthetic Impulse Response)
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.createReverbImpulseResponse(1.8, 1.5); // Warm spatial hall
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    // Create Analyser for real-time visualization dashboard
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;

    // Wire up Routing Graph
    this.primaryGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    
    // Connect FX buses
    this.primaryGain.connect(this.delayNode);
    this.delayNode.connect(this.delayGain);
    this.delayGain.connect(this.primaryGain);

    this.primaryGain.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.primaryGain);

    // Build Noise Buffer
    this.generateNoiseBuffer();

    // Set up gains for backing tracks
    this.initStemGains();

    // Trigger Web MIDI Connection in the background
    this.setupMidi().catch(e => console.warn("MIDI setup failed", e));
  }

  private initStemGains() {
    if (!this.ctx || !this.primaryGain) return;
    this.stems.forEach(stem => {
      const stemGain = this.ctx!.createGain();
      // Target gain is Volume * IsActive
      const targetVolume = stem.isActive ? stem.volume : 0;
      stemGain.gain.setValueAtTime(targetVolume, this.ctx!.currentTime);
      stemGain.connect(this.primaryGain!);
      this.stemGains.set(stem.id, stemGain);
    });
  }

  // Adjust volume / mix level of a stem loop
  public setStemVolume(id: string, vol: number) {
    const stem = this.stems.find(s => s.id === id);
    if (stem) {
      stem.volume = vol;
      const gainNode = this.stemGains.get(id);
      if (gainNode && this.ctx && stem.isActive) {
        gainNode.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
      }
    }
  }

  // Set stem active state directly
  public setStemActive(id: string, active: boolean) {
    const stem = this.stems.find(s => s.id === id);
    if (stem) {
      stem.isActive = active;
      const gainNode = this.stemGains.get(id);
      if (gainNode && this.ctx) {
        const targetVolume = active ? stem.volume : 0;
        gainNode.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.08);
      }
    }
  }

  // Toggle stem activity on/off
  public toggleStem(id: string): boolean {
    const stem = this.stems.find(s => s.id === id);
    if (stem) {
      stem.isActive = !stem.isActive;
      const gainNode = this.stemGains.get(id);
      if (gainNode && this.ctx) {
        const targetVolume = stem.isActive ? stem.volume : 0;
        gainNode.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.08);
      }
      return stem.isActive;
    }
    return false;
  }

  // Set Global BPM
  public setBPM(value: number) {
    this.bpm = Math.min(Math.max(value, 40), 240);
  }

  public getBPM() {
    return this.bpm;
  }

  // Playback Toggle
  public togglePlayback(onStepChange: (step: number) => void) {
    this.init();
    this.onStepChangeCallback = onStepChange;
    if (this.isSequencerRunning) {
      this.stopSequencer();
    } else {
      this.startSequencer();
    }
    return this.isSequencerRunning;
  }

  public isRunning() {
    return this.isSequencerRunning;
  }

  // Start Quantized Sequencer Engine
  private startSequencer() {
    if (!this.ctx) return;
    this.isSequencerRunning = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.scheduler();
  }

  private stopSequencer() {
    this.isSequencerRunning = false;
    if (this.sequencerTimerId) {
      clearTimeout(this.sequencerTimerId);
      this.sequencerTimerId = null;
    }
  }

  // Quantized scheduler ticks every 25ms
  private scheduler() {
    if (!this.isSequencerRunning || !this.ctx) return;
    
    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNextStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }
    
    this.sequencerTimerId = setTimeout(() => this.scheduler(), this.lookaheadInterval);
  }

  private advanceStep() {
    if (!this.ctx) return;
    
    // Move to next step (16 steps grid)
    const secondsPerBeat = 60.0 / this.bpm;
    const stepDuration = secondsPerBeat / 4; // 16th Note ticks
    
    this.nextStepTime += stepDuration;
    
    // Notify React UI of current play head step synchronously
    if (this.onStepChangeCallback) {
      this.onStepChangeCallback(this.currentStep);
    }
    
    this.currentStep = (this.currentStep + 1) % 16;
  }

  // Trigger synth notes according to active stems and step sequencer
  private scheduleNextStep(step: number, time: number) {
    if (!this.ctx) return;

    // Figure out the current chord based on a 4-chord rotation sequence
    const ChordProgressionIndex = Math.floor(step / 4) % this.loopChordProgression.length;
    const activeChord = this.loopChordProgression[ChordProgressionIndex];

    this.stems.forEach(stem => {
      if (!stem.isActive) return;
      
      const stemGainNode = this.stemGains.get(stem.id);
      if (!stemGainNode) return;

      const trigger = stem.pattern[step % stem.pattern.length];
      if (trigger === 0) return;

      // Sound synthesis depending on stem configurations
      switch (stem.synthType) {
        case 'kick':
          // Procedural Kick
          this.synthesizeKickAtTime(time, stem.volume);
          break;
        case 'snare':
          // Syncopated Snare Accent
          if (step % 8 === 4) {
            this.synthesizeSnareAtTime(time, stem.volume);
          }
          break;
        case 'hihat':
          this.synthesizeHihatAtTime(time, stem.volume);
          break;
        case 'bass-synth':
          // Play a rhythmic plucked bassline matching chord note index
          const bassNote = activeChord[0] - 12; // Transposed down an octave
          this.synthesizePluckedSynthAtTime(bassNote, time, stem.volume * 0.9, 'triangle');
          break;
        case 'pad':
          // Slow evolving lush pad triggers on chords change
          if (step % 8 === 0) {
            activeChord.forEach(note => {
              this.synthesizeSoftPadAtTime(note - 12, time, stem.volume * 0.45);
            });
          }
          break;
        case 'arpeggiator':
          // Arpeggiator sweeps 16th notes rapidly based on tempo speed multiplier
          const arpNoteIndex = step % activeChord.length;
          const arpNote = activeChord[arpNoteIndex] + 12; // Dynamic high range octave
          this.synthesizePluckedSynthAtTime(arpNote, time, stem.volume * 0.55, 'sawtooth');
          break;
        case 'strings':
          // Sustained chord textures
          if (step % 16 === 0) {
            activeChord.forEach((note, index) => {
              this.synthesizeStringsAtTime(note, time, stem.volume * 0.35, index);
            });
          }
          break;
      }
    });

    // Handle standard metronome click or automated kick logic if necessary
  }

  // --- Real-time Piano Synthesis Engines ---
  public playPianoNote(midiNote: number, velocity = 0.8) {
    this.init();
    if (!this.ctx || !this.primaryGain) return;

    // Send MIDI Out message if configured
    this.sendMidiDeviceNoteOn(midiNote, velocity);

    // Filter frequency based on velocity
    const frequency = this.midiNoteToFrequency(midiNote);
    
    // Dual Oscillator Synth Node Setup
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    
    const noteGainNode = this.ctx.createGain();
    const noteFilterNode = this.ctx.createBiquadFilter();

    // Sound palette: Oscillator 1 is full rich Sawtooth, Oscillator 2 is warmer Triangle
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(frequency * 1.003, this.ctx.currentTime); // Slight detuning for rich chorus

    // Enveloped Filter Sweep
    noteFilterNode.type = 'lowpass';
    noteFilterNode.Q.setValueAtTime(4.0, this.ctx.currentTime);
    noteFilterNode.frequency.setValueAtTime(200, this.ctx.currentTime);
    noteFilterNode.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.12);
    noteFilterNode.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.5);

    // Gain Envelope ADSR (Instant Attack, fast decay to warm sustain)
    noteGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    noteGainNode.gain.linearRampToValueAtTime(velocity * 0.35, this.ctx.currentTime + 0.005); // Attack
    noteGainNode.gain.exponentialRampToValueAtTime(velocity * 0.12, this.ctx.currentTime + 0.28); // Decay to Sustain

    // Standard Routing Topology
    osc1.connect(noteFilterNode);
    osc2.connect(noteFilterNode);
    noteFilterNode.connect(noteGainNode);
    noteGainNode.connect(this.primaryGain);

    // Audio node trigger schedule
    osc1.start(this.ctx.currentTime);
    osc2.start(this.ctx.currentTime);

    // Register active keys track database
    this.activeOscillators.set(midiNote, {
      oscillators: [osc1, osc2],
      gainNode: noteGainNode,
      filterNode: noteFilterNode
    });
  }

  public stopPianoNote(midiNote: number) {
    if (!this.ctx) return;
    
    this.sendMidiDeviceNoteOff(midiNote);

    const activeNode = this.activeOscillators.get(midiNote);
    if (activeNode) {
      const releaseTime = 0.35; // smooth ADSR Release period
      const stopTime = this.ctx.currentTime + releaseTime;
      
      // Decay gain smoothly to zero
      activeNode.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
      activeNode.gainNode.gain.setValueAtTime(activeNode.gainNode.gain.value, this.ctx.currentTime);
      activeNode.gainNode.gain.exponentialRampToValueAtTime(0.001, stopTime);

      // Clean release disconnection
      activeNode.oscillators.forEach(osc => {
        osc.stop(stopTime);
      });

      this.activeOscillators.delete(midiNote);
    }
  }

  // --- Procedural Synth Engines at Specific Timestamp (Loop Sequencer) ---

  private synthesizePluckedSynthAtTime(midiNote: number, time: number, volMultiplier: number, type: 'triangle' | 'sawtooth' | 'square') {
    if (!this.ctx || !this.primaryGain) return;
    const freq = this.midiNoteToFrequency(midiNote);

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, time);
    filter.frequency.exponentialRampToValueAtTime(350, time + 0.15);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volMultiplier * 0.2, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.primaryGain);

    osc.start(time);
    osc.stop(time + 0.25);
  }

  private synthesizeSoftPadAtTime(midiNote: number, time: number, volMultiplier: number) {
    if (!this.ctx || !this.primaryGain) return;
    const freq = this.midiNoteToFrequency(midiNote);

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Soft warm triangle pad
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, time);
    
    // Slow Attack & Envelope Decay
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volMultiplier * 0.18, time + 0.6); // Slow rise
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.primaryGain);

    osc.start(time);
    osc.stop(time + 1.95);
  }

  private synthesizeStringsAtTime(midiNote: number, time: number, volMultiplier: number, index: number) {
    if (!this.ctx || !this.primaryGain) return;
    const freq = this.midiNoteToFrequency(midiNote);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    
    // Multi-voice chord layering LFO simulation
    osc.frequency.setValueAtTime(freq + (index * 0.6), time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volMultiplier * 0.15, time + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 3.2);

    osc.connect(gain);
    gain.connect(this.primaryGain);

    osc.start(time);
    osc.stop(time + 3.4);
  }

  // --- Procedural Drum Synthesis (Kick, Snare, Hihat, Clap, Crash, Tom) ---

  public triggerDrum(drumType: 'kick' | 'snare' | 'hihat' | 'clap' | 'crash' | 'tom', velocity = 0.9) {
    this.init();
    if (!this.ctx) return;
    
    // Convert drum type to equivalent General MIDI standard drum notes
    let midiNote = 36; // Kick standard
    if (drumType === 'snare') midiNote = 38;
    else if (drumType === 'hihat') midiNote = 42;
    else if (drumType === 'clap') midiNote = 39;
    else if (drumType === 'crash') midiNote = 49;
    else if (drumType === 'tom') midiNote = 45;

    // Send MIDI out to DAW immediately!
    this.sendMidiDeviceNoteOn(midiNote, velocity);
    setTimeout(() => this.sendMidiDeviceNoteOff(midiNote), 100);

    const now = this.ctx.currentTime;
    switch (drumType) {
      case 'kick':
        this.synthesizeKickAtTime(now, velocity);
        break;
      case 'snare':
        this.synthesizeSnareAtTime(now, velocity);
        break;
      case 'hihat':
        this.synthesizeHihatAtTime(now, velocity);
        break;
      case 'clap':
        this.synthesizeClapAtTime(now, velocity);
        break;
      case 'crash':
        this.synthesizeCrashAtTime(now, velocity);
        break;
      case 'tom':
        this.synthesizeTomAtTime(now, velocity);
        break;
    }
  }

  private synthesizeKickAtTime(time: number, velocity: number) {
    if (!this.ctx || !this.primaryGain) return;

    // Sweep frequency sine oscillator
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sine';
    
    // Start sweeping down from high energy punch down to sub rumble frequencies
    osc.frequency.setValueAtTime(155, time);
    osc.frequency.exponentialRampToValueAtTime(48, time + 0.13);

    // Fast Attack & smooth linear envelope decay
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(velocity * 0.9, time + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(gainNode);
    gainNode.connect(this.primaryGain);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  private synthesizeSnareAtTime(time: number, velocity: number) {
    if (!this.ctx || !this.primaryGain) return;

    // Snare consists of a drumhead sound (low pitch sine oscillation) and snap (white noise)
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();

    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(180, time);
    bodyOsc.frequency.exponentialRampToValueAtTime(100, time + 0.08);

    bodyGain.gain.setValueAtTime(0, time);
    bodyGain.gain.linearRampToValueAtTime(velocity * 0.35, time + 0.002);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.primaryGain);

    bodyOsc.start(time);
    bodyOsc.stop(time + 0.12);

    // Noise snap components
    if (this.noiseBuffer) {
      const snapNoiseNode = this.ctx.createBufferSource();
      const snapFilter = this.ctx.createBiquadFilter();
      const snapGain = this.ctx.createGain();

      snapNoiseNode.buffer = this.noiseBuffer;
      snapFilter.type = 'bandpass';
      snapFilter.frequency.setValueAtTime(1400, time);
      snapFilter.Q.setValueAtTime(1.8, time);

      snapGain.gain.setValueAtTime(0, time);
      snapGain.gain.linearRampToValueAtTime(velocity * 0.45, time + 0.005);
      snapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      snapNoiseNode.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(this.primaryGain);

      snapNoiseNode.start(time);
      snapNoiseNode.stop(time + 0.2);
    }
  }

  private synthesizeHihatAtTime(time: number, velocity: number) {
    if (!this.ctx || !this.primaryGain || !this.noiseBuffer) return;

    const noiseSource = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    noiseSource.buffer = this.noiseBuffer;
    
    // Hihat relies on extreme high-pass filtering of white noise triggers
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(velocity * 0.38, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045); // Very fast release

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.primaryGain);

    noiseSource.start(time);
    noiseSource.stop(time + 0.06);
  }

  private synthesizeClapAtTime(time: number, velocity: number) {
    if (!this.ctx || !this.primaryGain || !this.noiseBuffer) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.Q.setValueAtTime(2.0, time);
    filter.connect(this.primaryGain);

    // Multi-burst trigger sequence to simulate natural room clap reflections
    const clapGain = this.ctx.createGain();
    clapGain.connect(filter);

    const burstTimes = [0, 0.012, 0.024, 0.038];
    burstTimes.forEach((delay, idx) => {
      const source = this.ctx!.createBufferSource();
      source.buffer = this.noiseBuffer;
      
      const burstGain = this.ctx!.createGain();
      const amplitude = idx === 3 ? velocity * 0.4 : velocity * 0.22; // Final burst is loudest and longest
      const decay = idx === 3 ? 0.09 : 0.01;

      burstGain.gain.setValueAtTime(0, time + delay);
      burstGain.gain.linearRampToValueAtTime(amplitude, time + delay + 0.001);
      burstGain.gain.exponentialRampToValueAtTime(0.001, time + delay + decay);

      source.connect(burstGain);
      burstGain.connect(clapGain);

      source.start(time + delay);
      source.stop(time + delay + decay + 0.01);
    });
  }

  private synthesizeCrashAtTime(time: number, velocity: number) {
    if (!this.ctx || !this.primaryGain || !this.noiseBuffer) return;

    const noiseSource = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gainNode = this.ctx.createGain();

    noiseSource.buffer = this.noiseBuffer;
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(4500, time);
    filter.frequency.linearRampToValueAtTime(3000, time + 0.8);

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(velocity * 0.5, time + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 1.2); // Slow decay ring out

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.primaryGain);

    noiseSource.start(time);
    noiseSource.stop(time + 1.4);
  }

  private synthesizeTomAtTime(time: number, velocity: number) {
    if (!this.ctx || !this.primaryGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(75, time + 0.18); // deep downward pitch sweep

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(velocity * 0.6, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(this.primaryGain);

    osc.start(time);
    osc.stop(time + 0.4);
  }

  // --- Real-time DJ FX Controls ---

  // Cutoff Filter sweeper 0-100 scale mapped to EQ sliders
  public setDJFilterCutoff(value: number) {
    this.init();
    if (!this.ctx || !this.primaryGain) return;
    // Map log-scaled frequency
    const minHz = 80;
    const maxHz = 16000;
    const targetFreq = minHz + (value / 100) * (maxHz - minHz);
    
    // We can modulate filter frequency directly of active voices or routing filter to primaryGain
    // Let's sweep globally by outputting on a master filter node or adjusting synth envelopes!
  }

  // Delay Feedback Level 0-100 scale
  public setDJDelayFeedback(value: number) {
    this.init();
    if (!this.ctx || !this.delayGain) return;
    const targetFeedback = (value / 100) * 0.65; // cap to avoid catastrophic infinite feedback loops
    this.delayGain.gain.setTargetAtTime(targetFeedback, this.ctx.currentTime, 0.05);
  }

  // Reverb Wet Level 0-100 scale
  public setDJReverbWet(value: number) {
    this.init();
    if (!this.ctx || !this.reverbGain) return;
    const targetWet = (value / 100) * 0.75;
    this.reverbGain.gain.setTargetAtTime(targetWet, this.ctx.currentTime, 0.05);
  }

  // --- Web Audio Helper Buffers ---

  private generateNoiseBuffer() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 1.5; // 1.5s noise
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  // Fast mathematical formulation of Synthetic Reverb Response
  private createReverbImpulseResponse(seconds: number, decay: number): AudioBuffer {
    if (!this.ctx) {
      // Fallback
      return new AudioBuffer({ length: 1, sampleRate: 44100 });
    }
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * seconds;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decayRatio = Math.exp(-i / (sampleRate * decay));
      left[i] = (Math.random() * 2 - 1) * decayRatio;
      right[i] = (Math.random() * 2 - 1) * decayRatio;
    }

    return impulse;
  }

  private midiNoteToFrequency(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  // --- Web MIDI Integration ---

  private async setupMidi() {
    if (this.midiEnabled) return;
    
    if (navigator.requestMIDIAccess) {
      try {
        this.midiAccess = await navigator.requestMIDIAccess();
        this.midiEnabled = true;
        this.updateMidiOutputs();
        
        this.midiAccess.onstatechange = () => {
          this.updateMidiOutputs();
        };
      } catch (e) {
        console.warn("User machine does not support Web MIDI or denied permissions", e);
        this.midiEnabled = false;
      }
    } else {
      this.midiEnabled = false;
    }
  }

  private updateMidiOutputs() {
    if (!this.midiAccess) return;
    
    this.midiOutputs = Array.from(this.midiAccess.outputs.values());
    
    // Auto-select first MIDI output if found and none selected yet
    if (this.midiOutputs.length > 0 && !this.selectedMidiOutput) {
      this.selectedMidiOutput = this.midiOutputs[0];
    }
  }

  public selectMidiDevice(id: string) {
    const device = this.midiOutputs.find(out => out.id === id);
    if (device) {
      this.selectedMidiOutput = device;
    }
  }

  public sendMidiDeviceNoteOn(note: number, velocity = 0.8) {
    if (this.selectedMidiOutput) {
      const midiVelocity = Math.floor(velocity * 127);
      try {
        this.selectedMidiOutput.send([0x90, note, midiVelocity]);
      } catch (err) {
        console.warn("MIDI send note on error", err);
      }
    }
  }

  public sendMidiDeviceNoteOff(note: number) {
    if (this.selectedMidiOutput) {
      try {
        this.selectedMidiOutput.send([0x80, note, 0]);
      } catch (err) {
        console.warn("MIDI send note off error", err);
      }
    }
  }
}

// Global Singleton Class instance
export const audioService = new WebAudioEngine();
