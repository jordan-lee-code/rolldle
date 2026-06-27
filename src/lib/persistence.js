// A thin, forgiving wrapper around localStorage. Everything is kept under one
// versioned key so the whole save is read and written as a single object, and every
// access is guarded: Safari's private mode throws on write, and a player should be
// able to play happily even when nothing can be saved. When storage is unavailable
// we quietly fall back to an in-memory copy for the session.
const KEY = 'rolldle:v1';
const VERSION = 1;

function emptyState() {
  return {
    version: VERSION,
    seenHelp: false,
    lastPlayedDay: null,
    results: {}, // dayNumber -> { guesses, correct, score, complete }
    streak: { current: 0, max: 0, lastDay: null },
  };
}

let memoryFallback = null;

function readRaw() {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return memoryFallback;
  }
}

export function load() {
  const stored = readRaw();
  if (!stored || stored.version !== VERSION) {
    // No save yet, or a future/older schema we don't understand. Start clean rather
    // than guessing at a migration we haven't written.
    return emptyState();
  }
  return { ...emptyState(), ...stored };
}

export function save(state) {
  memoryFallback = state;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage is full or blocked (private mode). We've kept the in-memory copy, so
    // the current session still behaves; it simply won't survive a reload.
  }
}
