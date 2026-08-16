// Repeating alert sound for admin notifications (new orders / new chat messages).
//
// The previous behaviour was a single short "ding". Staff asked for the alert to
// keep ringing so it can't be missed: startAlert() repeats the chime every few
// seconds for up to ~1 minute, and stopAlert() silences it the moment the admin
// acknowledges (opens the relevant bell / marks read / clicks a notification).
//
// Browsers refuse to start an AudioContext until the user has interacted with
// the page, and a panel left open on a counter gets no interaction at all — so
// the first order of a shift used to ring into the void. Two things guard
// against that: installAudioUnlock() warms the context on the first gesture,
// and every play path awaits resume() before scheduling notes (scheduling
// against a suspended context's frozen clock is what produced silent or
// clipped chimes).

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

// ── Blocked state (browser won't let us play until the user interacts) ────────
let blocked = false;
const blockedListeners = new Set();
function setBlocked(v) {
  if (v === blocked) return;
  blocked = v;
  blockedListeners.forEach((fn) => { try { fn(v); } catch {} });
}
/** True when the browser is holding the audio context suspended. */
export function isSoundBlocked() { return blocked; }
/** Subscribe to blocked on/off changes. Returns an unsubscribe fn. */
export function subscribeSoundBlocked(fn) {
  blockedListeners.add(fn);
  return () => blockedListeners.delete(fn);
}

function createCtx() {
  if (ctx) return ctx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  ctx = new Ctx();
  return ctx;
}

/**
 * Get a running context, waiting for resume() to actually finish.
 * Returns null when audio is unavailable or the browser still refuses.
 */
async function getRunningCtx() {
  const ac = createCtx();
  if (!ac) return null;

  if (ac.state === 'suspended') {
    try {
      await ac.resume();
    } catch {
      // Refused — needs a user gesture first.
    }
  }

  const ok = ac.state === 'running';
  setBlocked(!ok);
  return ok ? ac : null;
}

/**
 * Warm up audio on the user's first gesture, which is the only moment the
 * browser lets us. Call once when the panel mounts; the listeners remove
 * themselves as soon as the context is running.
 */
export function installAudioUnlock() {
  const events = ['pointerdown', 'keydown', 'touchstart'];

  const onGesture = async () => {
    const ac = await getRunningCtx();
    if (!ac) return; // still refused — keep listening for the next gesture

    // A silent blip finishes the unlock on stricter engines (older Safari).
    try {
      const buf = ac.createBuffer(1, 1, 22050);
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.connect(ac.destination);
      src.start(0);
    } catch {}

    events.forEach((e) => document.removeEventListener(e, onGesture));
  };

  events.forEach((e) => document.addEventListener(e, onGesture, { passive: true }));

  // Also report the current state so the UI can prompt right away.
  getRunningCtx();
}

/** Ask the browser for audio again — call it from a click handler. */
export async function unlockSound() {
  const ac = await getRunningCtx();
  if (ac) chime('order');
  return !!ac;
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

async function chime(kind) {
  try {
    const ac = await getRunningCtx();
    if (!ac) return;
    // Read the clock only once the context is running — a suspended context's
    // currentTime does not advance, so notes scheduled off it never sound.
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
  } catch (err) {
    // Never let a failed chime break the caller — but leave a trace, silence
    // with no explanation is exactly what made this hard to diagnose before.
    console.warn('[alertSound] chime failed:', err);
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
