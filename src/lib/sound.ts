// Tiny Web Audio synth — no audio files needed.
let ctx: AudioContext | null = null;
let enabled = true;

function ac() {
  if (typeof window === "undefined" || !enabled) return null;
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.12, delay = 0, slideTo?: number) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur: number, vol = 0.08, freq = 1200, delay = 0) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  s.connect(f).connect(g).connect(c.destination);
  s.start(t);
}

export const sound = {
  isEnabled: () => enabled,
  setEnabled(v: boolean) { enabled = v; },
  click() { tone(900, 0.05, "square", 0.05); },
  spin() { noise(0.35, 0.1, 600); tone(180, 0.3, "sawtooth", 0.04, 0, 420); },
  reelStop(i: number) { tone(140 + i * 18, 0.09, "triangle", 0.18); noise(0.06, 0.06, 2500); },
  scatter() { tone(1200, 0.25, "sine", 0.12); tone(1800, 0.3, "sine", 0.08, 0.06); },
  tension() { tone(220, 1.1, "sawtooth", 0.05, 0, 880); tone(330, 1.1, "triangle", 0.04, 0, 1320); },
  win() { [523, 659, 784].forEach((f, i) => tone(f, 0.18, "triangle", 0.1, i * 0.07)); },
  tick() { tone(1500 + Math.random() * 400, 0.04, "square", 0.03); },
  bigWin() { [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.4, "sawtooth", 0.07, i * 0.1)); },
  bonus() { [440, 554, 659, 880, 1108].forEach((f, i) => tone(f, 0.3, "square", 0.06, i * 0.09)); },
  vault() { tone(55, 1.6, "sawtooth", 0.15, 0, 40); noise(1.4, 0.1, 300); tone(880, 0.6, "sine", 0.08, 1.5, 1760); },
  error() { tone(160, 0.2, "square", 0.08, 0, 90); },
  notify() { tone(1320, 0.08, "sine", 0.08); tone(1760, 0.1, "sine", 0.06, 0.08); },
};
