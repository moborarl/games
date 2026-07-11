let ctx: AudioContext | null = null;
let muted = false;
const STORAGE_KEY = 'kids-games-sound-muted';

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, startOffset: number, duration: number, type: OscillatorType, peak: number) {
  if (muted) return;
  const audioCtx = getCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const now = audioCtx.currentTime + startOffset;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function sweep(
  freqFrom: number,
  freqTo: number,
  startOffset: number,
  duration: number,
  type: OscillatorType,
  peak: number
) {
  if (muted) return;
  const audioCtx = getCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  const now = audioCtx.currentTime + startOffset;
  osc.frequency.setValueAtTime(freqFrom, now);
  osc.frequency.linearRampToValueAtTime(freqTo, now + duration);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function loadMutedPreference(): boolean {
  try {
    muted = localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    muted = false;
  }
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    // ignore storage errors (private browsing, etc.)
  }
}

export function playFlip() {
  tone(520, 0, 0.09, 'triangle', 0.12);
}

export function playMatch() {
  tone(660, 0, 0.12, 'sine', 0.16);
  tone(880, 0.09, 0.16, 'sine', 0.16);
}

export function playMismatch() {
  tone(220, 0, 0.2, 'sawtooth', 0.09);
}

export function playWin() {
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => tone(freq, i * 0.12, 0.28, 'sine', 0.18));
}

export function playSlide() {
  sweep(300, 620, 0, 0.14, 'triangle', 0.1);
}

export function playCrash() {
  tone(120, 0, 0.18, 'sawtooth', 0.12);
}

export function playLose() {
  tone(392, 0, 0.18, 'sine', 0.15);
  tone(311, 0.15, 0.18, 'sine', 0.15);
  tone(247, 0.3, 0.3, 'sine', 0.15);
}
