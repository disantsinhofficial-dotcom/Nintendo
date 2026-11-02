/**
 * Audio Synthesizer mimicking Nintendo GameCube Macronix DSP and Wii Sound Architecture.
 * Synthesizes audio natively using Web Audio API.
 */
class EmulatorAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private dspMode: 'HLE' | 'LLE' = 'HLE';

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setDspMode(mode: 'HLE' | 'LLE') {
    this.dspMode = mode;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.4, this.ctx.currentTime);
    }
  }

  /**
   * Synthesizes the iconic GameCube boot chime:
   * Rolling marimba xylophone notes followed by the brassy chord and final metallic "ding"!
   */
  public playGameCubeBootSound() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [
      { f: 523.25, time: 0.05 }, // C5
      { f: 587.33, time: 0.15 }, // D5
      { f: 659.25, time: 0.25 }, // E5
      { f: 783.99, time: 0.35 }, // G5
      { f: 880.00, time: 0.45 }, // A5
      { f: 1046.50, time: 0.55 }, // C6
      { f: 1174.66, time: 0.65 }, // D6
      { f: 1318.51, time: 0.75 }, // E6
      { f: 1567.98, time: 0.85 }, // G6
    ];

    // Rolling wooden marimba pings
    notes.forEach((n) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t + n.time);

      gain.gain.setValueAtTime(0, t + n.time);
      gain.gain.linearRampToValueAtTime(0.3, t + n.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.time + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + n.time);
      osc.stop(t + n.time + 0.16);
    });

    // Final signature dramatic "DING!" chime at 1.1s
    const dingTime = t + 1.1;
    const dingFrequencies = [2093.00, 2637.02, 3135.96]; // C7 major triad
    dingFrequencies.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, dingTime);

      gain.gain.setValueAtTime(0, dingTime);
      gain.gain.linearRampToValueAtTime(0.25, dingTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, dingTime + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(dingTime);
      osc.stop(dingTime + 1.9);
    });
  }

  /**
   * Synthesizes the smooth Nintendo Wii Disc Channel opening chime & confirmation
   */
  public playWiiBootSound() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Ambient whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.4);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.85);

    // Wii modern two-tone chime
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      const t2 = this.ctx.currentTime;
      [659.25, 987.77].forEach((f, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, t2 + idx * 0.12);
        g.gain.setValueAtTime(0.3, t2 + idx * 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, t2 + idx * 0.12 + 0.6);
        o.connect(g);
        g.connect(this.masterGain);
        o.start(t2 + idx * 0.12);
        o.stop(t2 + idx * 0.12 + 0.65);
      });
    }, 350);
  }

  /**
   * Sound effect: button press / UI click
   */
  public playButtonSound() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.05);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * Game sound effect: sword slash or action
   */
  public playActionSound(type: 'slash' | 'boost' | 'hit' | 'score' | 'pause') {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    if (type === 'slash') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.15);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.16);
    } else if (type === 'boost') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.linearRampToValueAtTime(960, t + 0.3);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.36);
    } else if (type === 'hit') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.21);
    } else if (type === 'score') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + i * 0.08);
        gain.gain.setValueAtTime(0.2, t + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.26);
      });
    } else if (type === 'pause') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(330, t + 0.08);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.23);
    }
  }
}

export const emulatorAudio = new EmulatorAudioEngine();
