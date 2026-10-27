import type { Cue } from './cues';

/** The four descending bass notes of the original march (F, E♭, D♭, C). */
export const MARCH_NOTES = [87.31, 77.78, 69.3, 65.41] as const;

type AudioCtor = typeof AudioContext;

function audioCtor(): AudioCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * Tiny Web Audio synth for the classic effects — no samples, no dependencies.
 * The AudioContext is created lazily on the first user gesture (`unlock`)
 * and every call is a silent no-op where Web Audio is missing (tests, old
 * browsers) or the sound is switched off.
 */
export class InvadersSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private ufo: { osc: OscillatorNode; lfo: OscillatorNode; gain: GainNode } | null = null;
  private enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  /** Call from a user gesture (start / resume) so browsers allow audio. */
  unlock(): void {
    this.context();
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.setUfo(false);
  }

  private context(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const Ctor = audioCtor();
      if (!Ctor) return null;
      try {
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.35;
        this.master.connect(this.ctx.destination);
      } catch {
        this.ctx = null;
        return null;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined);
    return this.ctx;
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noise) {
      const len = Math.floor(ctx.sampleRate * 0.8);
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      let seed = 12345;
      for (let i = 0; i < len; i += 1) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        data[i] = (seed / 0x3fffffff) - 1;
      }
    }
    return this.noise;
  }

  private tone(type: OscillatorType, from: number, to: number, duration: number, volume: number): void {
    const ctx = this.context();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + duration);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  private burst(duration: number, volume: number, cutoff: number): void {
    const ctx = this.context();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t);
    src.stop(t + duration + 0.02);
  }

  play(cue: Cue): void {
    switch (cue.kind) {
      case 'march':
        this.tone('square', MARCH_NOTES[cue.note % 4], MARCH_NOTES[cue.note % 4] * 0.94, 0.09, 0.5);
        break;
      case 'shoot':
        this.tone('square', 1400, 240, 0.12, 0.12);
        break;
      case 'alienHit':
        this.burst(0.18, 0.45, 2400);
        break;
      case 'ufoHit':
        this.tone('sawtooth', 300, 1200, 0.25, 0.18);
        this.burst(0.3, 0.3, 1600);
        break;
      case 'playerHit':
        this.burst(0.75, 0.6, 1400);
        break;
      case 'extraLife':
        this.tone('triangle', 660, 1320, 0.3, 0.25);
        break;
    }
  }

  /** The UFO's warbling drone while it crosses the screen. */
  setUfo(on: boolean): void {
    if (!on) {
      if (this.ufo) {
        const { osc, lfo, gain } = this.ufo;
        this.ufo = null;
        try {
          gain.disconnect();
          osc.stop();
          lfo.stop();
        } catch {
          /* already stopped */
        }
      }
      return;
    }
    if (this.ufo) return;
    const ctx = this.context();
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 520;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 7;
    const depth = ctx.createGain();
    depth.gain.value = 160;
    lfo.connect(depth).connect(osc.frequency);
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    osc.connect(gain).connect(this.master);
    osc.start();
    lfo.start();
    this.ufo = { osc, lfo, gain };
  }

  dispose(): void {
    this.setUfo(false);
    const ctx = this.ctx;
    this.ctx = null;
    this.master = null;
    if (ctx) void ctx.close().catch(() => undefined);
  }
}
