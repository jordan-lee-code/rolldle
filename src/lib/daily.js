// The spine of the game. Everything a player sees on a given day is derived purely
// from the date, so every player worldwide gets the same rounds with no backend and
// nothing stored. Build and verify this first; the rest hangs off it.
import { QUESTIONS } from './data/questions.js';
import { POOL } from './data/pool.js';
import { shuffle } from './shuffle.js';
import {
  buildNameRound,
  buildPlaceRound,
  buildIdentifyRound,
  buildImpostorRound,
  buildNationalRound,
} from './rounds.js';

// The day the game began counting from. Day 0 is this date; today is the number of
// whole days since. Chosen as Rolldle's launch date.
const EPOCH = Date.UTC(2026, 5, 1); // 1 June 2026
const DAY_MS = 86_400_000;

export const ROUNDS_PER_DAY = 5;

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

// The day's mix of round kinds, chosen deterministically so it varies day to day while
// always staying valid. The first slot is a familiar "name it" round to open on solid
// ground; the rest are drawn from a shuffled bag under gentle caps, so no single day is
// all impostor rounds or leans too hard on any one kind. Identify rounds only appear
// when there's a distinctive bread to use; anything that can't be placed falls back to a
// name round, which always works.
function dayKinds(rng, distinctiveCount) {
  const caps = {
    name: ROUNDS_PER_DAY,
    place: 2,
    impostor: 1,
    identify: distinctiveCount > 0 ? 1 : 0,
    national: 1,
  };
  const bag = shuffle(['place', 'place', 'impostor', 'identify', 'national', 'name', 'name', 'name'], rng);
  const counts = { name: 1 };
  const kinds = ['name'];
  for (const kind of bag) {
    if (kinds.length >= ROUNDS_PER_DAY) break;
    if ((counts[kind] ?? 0) >= caps[kind]) continue;
    kinds.push(kind);
    counts[kind] = (counts[kind] ?? 0) + 1;
  }
  while (kinds.length < ROUNDS_PER_DAY) kinds.push('name');
  return [kinds[0], ...shuffle(kinds.slice(1), rng)];
}

// Build the whole puzzle for a given day. All randomness comes from one rng advanced in
// a fixed order, so the same day number always reproduces exactly the same puzzle. The
// day is a mix of round kinds (see rounds.js): naming a roll, placing a name on the map,
// identifying a distinctive bread on sight, spotting an invented name, and the national
// face-off. Region-based rounds each take a distinct question; the rest are vocabulary
// rounds that need no photo.
export function buildPuzzleForDay(n) {
  const rng = rngForDay(n);
  const questions = shuffle([...QUESTIONS], rng);
  const distinctive = questions.filter((q) => q.distinctive);
  const kinds = dayKinds(rng, distinctive.length);

  const poolShuffled = shuffle([...POOL], rng);
  let pi = 0;
  const nextPool = () => poolShuffled[pi++ % poolShuffled.length];

  // One shared "used" set keeps a given question (and so a given bread) from showing up
  // twice in the same day. Identify rounds reserve their distinctive question up front so
  // an earlier name or place round can't quietly use it first.
  const used = new Set();
  const take = (pool) => {
    for (const q of pool) {
      if (!used.has(q.id)) {
        used.add(q.id);
        return q;
      }
    }
    return pool[0];
  };
  const reservedIdentify = kinds.filter((k) => k === 'identify').map(() => take(distinctive));
  let ri = 0;

  const rounds = kinds.map((kind) => {
    switch (kind) {
      case 'place':
        return buildPlaceRound(take(questions), rng, nextPool, questions);
      case 'identify':
        return buildIdentifyRound(reservedIdentify[ri++] ?? take(distinctive), rng);
      case 'impostor':
        return buildImpostorRound(rng);
      case 'national':
        return buildNationalRound(rng);
      default:
        return buildNameRound(take(questions), rng, nextPool);
    }
  });

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

// One standalone round for endless practice mode, seeded by a single number so a run is
// reproducible from its seed but every round looks fresh. Unlike the daily puzzle there's
// no within-day dedup to honour, so each round picks its own kind and question cleanly.
const ENDLESS_KINDS = ['name', 'name', 'place', 'identify', 'impostor', 'national'];
export function buildEndlessRound(seed) {
  const rng = mulberry32(fnv1a('rolldle-endless-' + seed));
  const questions = shuffle([...QUESTIONS], rng);
  const distinctive = questions.filter((q) => q.distinctive);
  const poolShuffled = shuffle([...POOL], rng);
  let pi = 0;
  const nextPool = () => poolShuffled[pi++ % poolShuffled.length];

  const kind = ENDLESS_KINDS[Math.floor(rng() * ENDLESS_KINDS.length)];
  switch (kind) {
    case 'place':
      return buildPlaceRound(questions[0], rng, nextPool, questions);
    case 'identify':
      return buildIdentifyRound(distinctive[0], rng);
    case 'impostor':
      return buildImpostorRound(rng);
    case 'national':
      return buildNationalRound(rng);
    default:
      return buildNameRound(questions[0], rng, nextPool);
  }
}

// Milliseconds until the next local midnight, for the "come back tomorrow" countdown.
export function msUntilTomorrow(date = new Date()) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return next.getTime() - date.getTime();
}
