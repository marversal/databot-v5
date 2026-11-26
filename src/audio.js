let ac = null, master = null, vol = 0.5, muted = false;
function ensure() {
  if (ac) return true;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
  ac = new AC(); master = ac.createGain(); master.gain.value = muted ? 0 : vol; master.connect(ac.destination); return true;
}
export const Audio8 = {
  unlock() { if (ensure() && ac.state === 'suspended') ac.resume(); },
  setVolume(v) { vol = Math.max(0, Math.min(1, v)); if (master) master.gain.value = muted ? 0 : vol; },
  get volume() { return vol; },
  toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : vol; return muted; },
  get muted() { return muted; },
  tone(freq, dur, type = 'square', slide = 0, gain = 0.15, delay = 0) {
    if (!ac || ac.state !== 'running') return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  },
  play(name) {
    const T = this.tone.bind(this);
    switch (name) {
      case 'jump': T(260, 0.14, 'square', 320); break;
      case 'land': T(110, 0.07, 'triangle', -50, 0.2); break;
      case 'pickup': T(520, 0.07); T(780, 0.09, 'square', 0, 0.15, 0.07); break;
      case 'deliver': T(330, 0.09); T(440, 0.09, 'square', 0, 0.15, 0.09); T(660, 0.16, 'square', 0, 0.15, 0.18); break;
      case 'process': T(90, 0.3, 'sawtooth', 60, 0.18); break;
      case 'detect': T(880, 0.12); T(660, 0.12, 'square', 0, 0.15, 0.14); T(880, 0.12, 'square', 0, 0.15, 0.28); break;
      case 'target': T(1200, 0.05, 'sine', 0, 0.08); break;
      case 'laser': T(1400, 0.3, 'sawtooth', -1200, 0.2); break;
      case 'stun': T(160, 0.35, 'sawtooth', -100, 0.22); T(90, 0.3, 'square', 0, 0.15, 0.1); break;
      case 'phase': T(220, 0.15); T(330, 0.15, 'square', 0, 0.15, 0.15); T(440, 0.3, 'square', 0, 0.15, 0.3); break;
      case 'gameover': T(440, 0.2); T(330, 0.2, 'square', 0, 0.15, 0.2); T(220, 0.2, 'square', 0, 0.15, 0.4); T(110, 0.5, 'sawtooth', 0, 0.15, 0.6); break;
      case 'start': case 'replay': T(330, 0.08); T(495, 0.08, 'square', 0, 0.15, 0.08); T(660, 0.16, 'square', 0, 0.15, 0.16); break;
      case 'step': T(70, 0.04, 'triangle', 0, 0.08); break;
    }
  },
};
