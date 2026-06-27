import { writable } from 'svelte/store';
import { buildPuzzle, isCorrect } from './daily.js';
import { load, save } from './persistence.js';

// One store holds the whole game. It builds today's puzzle, restores any saved
// progress, walks the player through the rounds, and writes back to localStorage as
// it goes so a refresh mid-game never loses your place and you can't replay a day
// you've already finished.

function createGame() {
  const puzzle = buildPuzzle();
  const saved = load();
  const today = saved.results[puzzle.dayNumber] ?? null;

  // Replay the saved guesses for today (if any) back into in-memory answers.
  const answers = (today?.guesses ?? []).map((choiceIndex, i) => {
    const round = puzzle.rounds[i];
    return {
      choiceIndex,
      correct: isCorrect(round.question, round.choices[choiceIndex]),
    };
  });

  const complete = Boolean(today?.complete);
  const initial = {
    puzzle,
    seenHelp: saved.seenHelp,
    streak: saved.streak,
    answers,
    current: complete ? puzzle.rounds.length : answers.length,
    phase: complete ? 'done' : answers.length > 0 ? 'playing' : 'intro',
  };

  const { subscribe, update, set } = writable(initial);

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
    if (finishing) {
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
        const correct = isCorrect(round.question, round.choices[choiceIndex]);
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

// Streak counts days played, kept warm rather than punishing: an unbroken run of
// daily visits builds it up, a missed day quietly starts it again at one. Replaying
// the same finished day leaves it untouched.
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
