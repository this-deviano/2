let ctx;
function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function beep(freq, dur, type = 'sine', gain = 0.04) {
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  } catch { /* ignore */ }
}

export function soundMove() { beep(440, 0.08, 'triangle', 0.03); }
export function soundCapture() { beep(220, 0.12, 'square', 0.04); }
export function soundCheck() { beep(880, 0.16, 'sawtooth', 0.03); }
export function soundEnd() { beep(160, 0.4, 'sine', 0.05); }
