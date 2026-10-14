// ============================================================================
// TECH QUEST: ROUND 2 — PURE WEB AUDIO SYNTHESIZER
// ============================================================================
// Zero external mp3/wav files; 100% procedural Web Audio synthesis for:
// - Footsteps (synchronized with WASD)
// - Ambient claustrophobic drone & hum
// - Wooden drawer sliding friction
// - Paper note rustling
// - Metal unbolt clunks & clicks
// - Keypad beeps & error buzz
// - Electric sparks
// - Victory fanfare
// ============================================================================

class EscapeAudioEngine {
  private ctx: AudioContext | null = null;
  private ambientDroneGain: GainNode | null = null;
  private isMuted: boolean = false;
  private lastFootstepTime: number = 0;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ambientDroneGain && this.ctx) {
      this.ambientDroneGain.gain.setValueAtTime(muted ? 0 : 0.08, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // 1. Footstep sound (procedural low frequency noise thud)
  public playFootstep() {
    if (this.isMuted) return;
    const now = Date.now();
    if (now - this.lastFootstepTime < 320) return; // rate limit footsteps
    this.lastFootstepTime = now;

    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(90 + Math.random() * 20, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch {}
  }

  // 2. Ambient Claustrophobic Drone
  public startAmbientDrone() {
    if (this.ambientDroneGain) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(58.5, this.ctx.currentTime); // dissonant beat freq

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(160, this.ctx.currentTime);

      gain.gain.setValueAtTime(this.isMuted ? 0 : 0.06, this.ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();

      this.ambientDroneGain = gain;
    } catch {}
  }

  public stopAmbientDrone() {
    if (this.ambientDroneGain && this.ctx) {
      try {
        this.ambientDroneGain.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch {}
      this.ambientDroneGain = null;
    }
  }

  // 3. Wooden Drawer Slide Friction
  public playDrawerSlide() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.7));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.25);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {}
  }

  // 4. Paper Rustle
  public playPaperRustle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {}
  }

  // 5. Metallic Unbolt / Latch Clunk
  public playUnboltClunk() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch {}
  }

  // 6. Keypad Beep
  public playKeypadBeep(freq: number = 880) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {}
  }

  // 7. Error Buzz
  public playErrorBuzz() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch {}
  }

  // 8. Electric Spark Crackle
  public playElectricSpark() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() > 0.85 ? Math.random() * 2 - 1 : 0;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);

      noise.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {}
  }

  // 9. Victory Fanfare
  public playVictoryFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.15);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.15 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.15);
        osc.stop(this.ctx!.currentTime + idx * 0.15 + 0.45);
      });
    } catch {}
  }

  // 10. Physical Object Impact Sound (Metal, Wood, Paper, Glass)
  public playImpact(material: 'metal' | 'wood' | 'paper' | 'glass' = 'metal', intensity: number = 0.5) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const clampedVol = Math.min(Math.max(intensity, 0.1), 0.8) * 0.35;
      if (material === 'metal') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + Math.random() * 200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(clampedVol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.19);
      } else if (material === 'wood') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160 + Math.random() * 40, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(clampedVol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.13);
      } else if (material === 'glass') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400 + Math.random() * 300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(clampedVol * 0.7, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.23);
      } else {
        this.playPaperRustle();
      }
    } catch {}
  }

  // 11. Throw Whoosh
  public playThrowWhoosh() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.21);
    } catch {}
  }

  // 12. Dial / Rotary Lock Click
  public playDialTick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.045);
    } catch {}
  }

  // 13. Grab / Pick-Up Object Sound
  public playGrab() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(480, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {}
  }

  // 14. Drop Object Sound
  public playDrop() {
    this.playImpact('wood', 0.4);
  }

  // 15. Flashlight / UV toggle
  public playFlashlightToggle() {
    this.playKeypadBeep(1200);
  }
}

export const escapeAudio = new EscapeAudioEngine();
