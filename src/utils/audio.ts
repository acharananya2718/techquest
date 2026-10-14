class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('tech_quest_audio') : null;
    this.enabled = saved !== 'false';
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tech_quest_audio', String(this.enabled));
    }
    if (this.enabled) {
      this.playKeystroke();
    }
    return this.enabled;
  }

  public playBeep(freq: number = 880) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {
      // ignore
    }
  }

  public playKeystroke() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // ignore
    }
  }

  public playAccessGranted() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.08, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch {
      // ignore
    }
  }

  public playAccessDenied() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.3);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // ignore
    }
  }

  public playCountdownTick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // ignore
    }
  }

  public playVaultUnlock() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Low sub bass surge
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(65, now);
      sub.frequency.exponentialRampToValueAtTime(130, now + 0.8);
      subGain.gain.setValueAtTime(0.2, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 1.2);

      // High cyber fanfare
      const fanfare = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      fanfare.forEach((f, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + 0.2 + idx * 0.1);
        gain.gain.setValueAtTime(0.06, now + 0.2 + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + idx * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + 0.2 + idx * 0.1);
        osc.stop(now + 0.2 + idx * 0.1 + 0.4);
      });
    } catch {
      // ignore
    }
  }

  // --- Haunted Mystery House 3D Sound Effects ---

  public playFootstep() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(75 + Math.random() * 20, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // ignore
    }
  }

  public playUnlock() {
    this.playChestUnlock();
  }

  public playDoorCreak() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.4);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.9);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.95);
    } catch {
      // ignore
    }
  }

  public playKeyPickup() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [1480, 2220, 2960].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.06, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.35);
      });
    } catch {
      // ignore
    }
  }

  public playPaperRustle() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(2.0, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    } catch {
      // ignore
    }
  }

  public playChestUnlock() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Tumbler click 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(320, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.06);

      // Tumbler click 2
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(480, now + 0.12);
      gain2.gain.setValueAtTime(0.09, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.22);

      // Deep resonance latch release
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(140, now + 0.24);
      sub.frequency.exponentialRampToValueAtTime(60, now + 0.6);
      subGain.gain.setValueAtTime(0.12, now + 0.24);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);
      sub.start(now + 0.24);
      sub.stop(now + 0.7);
    } catch {
      // ignore
    }
  }

  public playEerieChime() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const chords = [392.00, 493.88, 587.33, 739.99]; // G4, B4, D5, F#5 (mysterious major 7th)
      chords.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.06, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.9);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.9);
      });
    } catch {
      // ignore
    }
  }

  public playFlagFanfare() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Majestic victory brass fanfare
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.12, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.7);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.7);
      });
    } catch {
      // ignore
    }
  }

  public playAlarmSiren() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.35);
      osc.frequency.linearRampToValueAtTime(600, now + 0.7);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.75);
    } catch {
      // ignore
    }
  }

  public playHydraulicDepressurize() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // White noise buffer for steam / air pressure hiss
      const bufferSize = this.ctx.sampleRate * 0.6;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.55);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);

      // Low mechanical thud
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(95, now);
      thud.frequency.exponentialRampToValueAtTime(35, now + 0.3);
      thudGain.gain.setValueAtTime(0.15, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      thud.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thud.start(now);
      thud.stop(now + 0.35);
    } catch {
      // ignore
    }
  }

  public playRelayClick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(820, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // ignore
    }
  }

  public playPhaseSync() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Triple synchronized tone chord (C5, G5, C6)
      [523.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.09, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.6);
      });
    } catch {
      // ignore
    }
  }

  private ambienceNodes: { stop: () => void } | null = null;

  public startEerieAmbience() {
    if (!this.enabled || this.ambienceNodes) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // 1. Low industrial sub-drone (flickering generators)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const droneGain = this.ctx.createGain();
      const droneFilter = this.ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(54, now);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(56.5, now);

      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(140, now);

      droneGain.gain.setValueAtTime(0.001, now);
      droneGain.gain.linearRampToValueAtTime(0.035, now + 1.5);

      osc1.connect(droneFilter);
      osc2.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);

      // 2. Vinyl crackle & pipe drip hiss buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Mostly silence with random crackles
        if (Math.random() < 0.003) {
          output[i] = (Math.random() * 2 - 1) * 0.4;
        } else {
          output[i] = (Math.random() * 2 - 1) * 0.015;
        }
      }
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1800, now);
      noiseFilter.Q.setValueAtTime(3.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.02, now + 1.0);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noiseSource.start(now);

      this.ambienceNodes = {
        stop: () => {
          try {
            const stopTime = (this.ctx?.currentTime || 0) + 0.5;
            droneGain.gain.linearRampToValueAtTime(0.0001, stopTime);
            noiseGain.gain.linearRampToValueAtTime(0.0001, stopTime);
            setTimeout(() => {
              try {
                osc1.stop();
                osc2.stop();
                noiseSource.stop();
              } catch {}
            }, 600);
          } catch {}
          this.ambienceNodes = null;
        },
      };
    } catch {
      // ignore
    }
  }

  public stopEerieAmbience() {
    if (this.ambienceNodes) {
      this.ambienceNodes.stop();
      this.ambienceNodes = null;
    }
  }
}

export const sound = new SoundSynthesizer();
