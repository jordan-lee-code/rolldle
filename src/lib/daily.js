// The spine of the game. Everything a player sees on a given day is derived purely
// from the date, so every player worldwide gets the same rounds with no backend and
// nothing stored. Build and verify this first; the rest hangs off it.
import { QUESTIONS } from './data/questions.js';
import { NAME_KEYS } from './data/names.js';
import { POOL } from './data/pool.js';

// The day the game began counting from. Day 0 is this date; today is the number of
// whole days since. Chosen as Rolldle's launch date.
const EPOCH = Date.UTC(2026, 5, 1); // 1 June 2026
const DAY_MS = 86_400_000;

export const ROUNDS_PER_DAY = 5;
export const CHOICES_PER_ROUND = 4;

// The puzzle follows the player's own calendar day, so it flips at their local
// midnight the way Wordle does. We normalise to the local date and then measure in
// UTC midnights, which keeps the arithmetic an exact integer and sidesteps the
// daylight-saving off-by-one you get from dividing a raw timestamp.
export function dayNumber(date = new Date()) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const utcMidnight = Date.UTC(local.getFullYear(), local.getMonth(), local.getDate());
  return Math.floor((utcMidnight - EPOCH) / DAY_MS);
}

// Today's day number, the highest day a player can reach.
export function todayNumber() {
  return dayNumber();
}

// The calendar date a given day number falls on, for displaying archived days.
export function dateForDay(n) {
  return new Date(EPOCH + n * DAY_MS);
}

export function dateLabelForDay(n) {
  return dateForDay(n).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

// FNV-1a string hash, used to turn a day number into a well-spread seed so that
// consecutive days look unrelated rather than marching through the pool in order.
function fnv1a(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32: a tiny, fast, deterministic PRNG returning floats in [0, 1).
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngForDay(n) {
  return mulberry32(fnv1a('rolldle-' + n));
}

// In-place Fisher-Yates shuffle driven by a supplied rng, so the result is fully
// reproducible for a given seed. Returns the same array for convenience.
function shuffle(array, rng) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Build the four choices for a round: the answer plus three distractors drawn from
// the wider vocabulary, never including the answer or any of its acceptable
// alternates (so we don't accidentally offer two correct buttons).
function buildChoices(question, rng) {
  const excluded = new Set([question.answer, ...(question.alsoAcceptable ?? [])]);
  const distractors = shuffle(
    NAME_KEYS.filter((key) => !excluded.has(key)),
    rng,
  ).slice(0, CHOICES_PER_ROUND - 1);

  const choices = shuffle([question.answer, ...distractors], rng);
  return {
    choices,
    answerIndex: choices.indexOf(question.answer),
  };
}

// Build the whole puzzle for a given day. All randomness comes from one rng advanced
// in a fixed order (pick rounds, build each round's choices, then draw the photos), so
// the same day number always reproduces exactly the same puzzle.
//
// Most rounds draw their photo from the shared image pool: the regional names are just
// local words for an ordinary roll, so any roll photo is an honest fit. A few questions
// pin a specific, verified photo (a real stottie, a real bin lid) where the identity of
// the bread genuinely matters; those keep their own image, alt text and size.
export function buildPuzzleForDay(n) {
  const rng = rngForDay(n);

  const rounds = shuffle([...QUESTIONS], rng)
    .slice(0, ROUNDS_PER_DAY)
    .map((question) => ({ question, ...buildChoices(question, rng) }));

  const poolShuffled = shuffle([...POOL], rng);
  let next = 0;
  for (const round of rounds) {
    const { question } = round;
    if (question.image) {
      round.image = question.image;
      round.alt = question.alt;
      round.size = question.size;
    } else {
      const picked = poolShuffled[next++ % poolShuffled.length];
      round.image = picked.file;
      round.alt = picked.alt;
      round.size = 'regular';
    }
  }

  return {
    dayNumber: n,
    dateISO: dateForDay(n).toISOString().slice(0, 10),
    rounds,
  };
}

// Build the puzzle for a calendar date (today by default). A thin wrapper over
// buildPuzzleForDay so the same rounds can be rebuilt for any past day in the archive.
export function buildPuzzle(date = new Date()) {
  return buildPuzzleForDay(dayNumber(date));
}

// Whether a chosen name counts as correct for a round, honouring the small set of
// defensible regional alternates so a local is never punished for being right.
export function isCorrect(question, chosenKey) {
  return chosenKey === question.answer || (question.alsoAcceptable ?? []).includes(chosenKey);
}

// Milliseconds until the next local midnight, for the "come back tomorrow" countdown.
export function msUntilTomorrow(date = new Date()) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return next.getTime() - date.getTime();
}
