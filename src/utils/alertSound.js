// Repeating alert sound for admin notifications (new orders / new chat messages).
//
// The previous behaviour was a single short "ding". Staff asked for the alert to
// keep ringing so it can't be missed: startAlert() repeats the chime every few
// seconds for up to ~1 minute, and stopAlert() silences it the moment the admin
// acknowledges (opens the relevant bell / marks read / clicks a notification).

let ctx = null;
let repeatTimer = null;
let stopTimer = null;

// ── Alerting state (so the UI can show a "stop sound" button while ringing) ──
let alerting = false;
const listeners = new Set();
function setAlerting(v) {
  if (v === alerting) return;
  alerting = v;
  listeners.forEach((fn) => { try { fn(v); } catch {} });
}
/** True while a repeating alert is ringing. */
export function isAlerting() { return alerting; }
/** Subscribe to alerting on/off changes. Returns an unsubscribe fn. */
export function subscribeAlerting(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getCtx() {
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  // Browsers suspend the context until a user gesture — resume on each use.
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// One chime = a short sequence of [frequency, startOffset(s), duration(s), peakGain]
const PATTERNS = {
  order: [
    [880, 0, 0.18, 0.45],
    [1100, 0.2, 0.24, 0.45],
  ],
  chat: [
    [1175, 0, 0.16, 0.38],
    [1568, 0.14, 0.22, 0.38],
  ],
};

function chime(kind) {
  try {
    const ac = getCtx();
    if (!ac) return;
    const t0 = ac.currentTime;
    const pattern = PATTERNS[kind] || PATTERNS.order;
    pattern.forEach(([freq, offset, dur, peak = 0.4]) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t0 + offset);
      gain.gain.setValueAtTime(0, t0 + offset);
      gain.gain.linearRampToValueAtTime(peak, t0 + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + offset + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(t0 + offset);
      osc.stop(t0 + offset + dur);
    });
  } catch {
    // Web Audio unavailable — silently skip
  }
}

/** Play the chime a single time (used as a soft cue when already on the page). */
export function playOnce(kind = 'order') {
  chime(kind);
}

/**
 * Start a repeating alert. Rings immediately, then repeats until acknowledged or
 * until `durationMs` elapses (default 60s). Calling it again restarts the timer.
 */
export function startAlert(kind = 'order', { durationMs = 60000, intervalMs = 2500 } = {}) {
  stopAlert();
  chime(kind);
  repeatTimer = setInterval(() => chime(kind), intervalMs);
  stopTimer = setTimeout(stopAlert, durationMs);
  setAlerting(true);
}

/** Silence the alert immediately. Safe to call when nothing is playing. */
export function stopAlert() {
  if (repeatTimer) {
    clearInterval(repeatTimer);
    repeatTimer = null;
  }
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  setAlerting(false);
}
