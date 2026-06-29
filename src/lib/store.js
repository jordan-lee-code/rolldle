import { writable } from 'svelte/store';
import { buildPuzzleForDay, todayNumber } from './daily.js';
import { load, save } from './persistence.js';

// One store holds the whole game. It starts on today's puzzle, restores any saved
// progress, walks the player through the rounds, and writes back to localStorage as it
// goes so a refresh mid-game never loses your place and you can't replay a day you've
// already finished. It can also switch to any earlier day so you can catch up on rolls
// you missed; the archive shares the exact same machinery, just for a different number.

// Build the full state for a given day: its puzzle, any answers already saved for it,
// and the phase to resume in. `freshPhase` is where a never-played day lands ('intro'
// for the very first visit, 'playing' when you pick a day from the archive on purpose).
function hydrate(n, freshPhase = 'intro') {
  const puzzle = buildPuzzleForDay(n);
  const saved = load();
  const rec = saved.results[n] ?? null;

  const answers = (rec?.guesses ?? []).map((choiceIndex, i) => {
    // Trust the correctness saved with a finished day, so changing how rounds are built
    // can never rewrite a result you've already seen; only recompute when it's missing.
    const stored = rec?.correct?.[i];
    const correct =
      typeof stored === 'boolean' ? stored : choiceIndex === puzzle.rounds[i].answerIndex;
    return { choiceIndex, correct };
  });

  const complete = Boolean(rec?.complete);
  return {
    puzzle,
    isToday: n === todayNumber(),
    seenHelp: saved.seenHelp,
    streak: saved.streak,
    answers,
    current: complete ? puzzle.rounds.length : answers.length,
    phase: complete ? 'done' : answers.length > 0 ? 'playing' : freshPhase,
  };
}

function createGame() {
  const { subscribe, update, set } = writable(hydrate(todayNumber()));

  // Persist the parts of a turn that must outlive a reload, layering them onto the
  // existing save so we never trample the player's wider history or streak.
  function persist(state, { finishing = false } = {}) {
    const data = load();
    const guesses = state.answers.map((a) => a.choiceIndex);
    const correct = state.answers.map((a) => a.correct);
    data.seenHelp = state.seenHelp;
    data.lastPlayedDay = state.puzzle.dayNumber;
    data.results[state.puzzle.dayNumber] = {
      guesses,
      correct,
      score: correct.filter(Boolean).length,
      complete: finishing,
    };
    // The streak only moves for the genuine daily puzzle, never for catching up on the
    // archive, so going back through old days can't inflate or break it.
    if (finishing && state.isToday) {
      data.streak = nextStreak(data.streak, state.puzzle.dayNumber);
      state.streak = data.streak;
    }
    save(data);
  }

  return {
    subscribe,
    start() {
      update((s) => (s.phase === 'intro' ? { ...s, phase: 'playing' } : s));
    },
    loadDay(n) {
      set(hydrate(n, 'playing'));
    },
    goToToday() {
      set(hydrate(todayNumber()));
    },
    markHelpSeen() {
      update((s) => {
        if (s.seenHelp) return s;
        const next = { ...s, seenHelp: true };
        persist(next);
        return next;
      });
    },
    answer(choiceIndex) {
      update((s) => {
        // Ignore input once this round is already answered or the day is done.
        if (s.phase === 'done' || s.current >= s.puzzle.rounds.length) return s;
        if (s.answers[s.current]) return s;

        const round = s.puzzle.rounds[s.current];
        const correct = choiceIndex === round.answerIndex;
        const answers = [...s.answers, { choiceIndex, correct }];
        const next = { ...s, answers };
        persist(next);
        return next;
      });
    },
    advance() {
      update((s) => {
        const atLast = s.current >= s.puzzle.rounds.length - 1;
        if (atLast) {
          const next = { ...s, current: s.puzzle.rounds.length, phase: 'done' };
          persist(next, { finishing: true });
          return next;
        }
        return { ...s, current: s.current + 1 };
      });
    },
    set,
  };
}

// Streak counts days played, kept warm rather than punishing: an unbroken run of daily
// visits builds it up, a missed day quietly starts it again at one. Replaying the same
// finished day leaves it untouched.
function nextStreak(streak, dayNumber) {
  let current;
  if (streak.lastDay === dayNumber) {
    current = streak.current; // already counted today
  } else if (streak.lastDay === dayNumber - 1) {
    current = streak.current + 1;
  } else {
    current = 1;
  }
  return {
    current,
    max: Math.max(streak.max ?? 0, current),
    lastDay: dayNumber,
  };
}

export const game = createGame();
