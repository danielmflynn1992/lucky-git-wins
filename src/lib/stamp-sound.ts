/**
 * Synthesised foley for the confirmation sequence — no audio assets.
 * Paper slide, heavy wooden stamp thud, faint ink squelch.
 */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noise(ac: AudioContext, seconds: number) {
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * seconds), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  return src;
}

export function playPaperSlide() {
  const ac = audio();
  if (!ac) return;
  const src = noise(ac, 0.5);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(1200, ac.currentTime);
  bp.frequency.exponentialRampToValueAtTime(3400, ac.currentTime + 0.4);
  bp.Q.value = 0.8;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.09, ac.currentTime + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.5);
  src.connect(bp).connect(g).connect(ac.destination);
  src.start();
  src.stop(ac.currentTime + 0.5);
}

export function playStampThud() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  // Wooden body — low sine drop.
  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(190, t);
  osc.frequency.exponentialRampToValueAtTime(48, t + 0.16);
  const og = ac.createGain();
  og.gain.setValueAtTime(0.5, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  osc.connect(og).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.32);
  // Impact crack.
  const src = noise(ac, 0.12);
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1800;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.35, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  src.connect(lp).connect(g).connect(ac.destination);
  src.start(t);
  src.stop(t + 0.12);
}

export function playInkSquelch() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const src = noise(ac, 0.18);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(700, t);
  bp.frequency.exponentialRampToValueAtTime(240, t + 0.18);
  bp.Q.value = 3;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  src.connect(bp).connect(g).connect(ac.destination);
  src.start(t);
  src.stop(t + 0.2);
}
