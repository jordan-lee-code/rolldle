// The round builders, one per kind. Each takes a seeded rng and returns a fully
// self-describing round: its prompt, its choices as display labels, the index of the
// right one, an optional photo, and the fond note to reveal afterwards. Keeping the
// rounds self-contained means the components never have to know which kind they're
// showing, and the day builder in daily.js can mix kinds freely.
//
// The kinds:
//   name      the original, a roll and a place, name what a local would call it
//   place     the inverse, given the name, say where in Britain you'd hear it
//   identify  a visually distinctive bread with no regional clue, name it on sight
//   impostor  four names, three real and one we invented, find the fake
//   national  two names, pick the one Britain uses more often
import { shuffle } from './shuffle.js';
import { NAMES, NAME_KEYS, RANKED_KEYS, FAKE_NAMES, nameLabel } from './data/names.js';

export const CHOICES_PER_ROUND = 4;

// Choices for a name-style round: the answer plus distractors drawn from the wider
// vocabulary, never the answer's own acceptable alternates, so two buttons are never
// both right. Returned as name keys with the index of the correct one.
function nameChoiceKeys(question, rng) {
  const excluded = new Set([question.answer, ...(question.alsoAcceptable ?? [])]);
  const distractors = shuffle(
    NAME_KEYS.filter((key) => !excluded.has(key)),
    rng,
  ).slice(0, CHOICES_PER_ROUND - 1);
  const keys = shuffle([question.answer, ...distractors], rng);
  return { keys, answerIndex: keys.indexOf(question.answer) };
}

// A pinned photo when the question has one, otherwise the next roll from the shared pool.
function imageFor(question, nextPool) {
  if (question.image) return { image: question.image, alt: question.alt, size: question.size };
  const picked = nextPool();
  return { image: picked.file, alt: picked.alt, size: 'regular' };
}

export function buildNameRound(question, rng, nextPool) {
  const { keys, answerIndex } = nameChoiceKeys(question, rng);
  return {
    kind: 'name',
    prompt: question.prompt,
    ...imageFor(question, nextPool),
    choices: keys.map(nameLabel),
    answerIndex,
    reveal: question.elsewhere ?? '',
  };
}

export function buildIdentifyRound(question, rng) {
  const { keys, answerIndex } = nameChoiceKeys(question, rng);
  return {
    kind: 'identify',
    prompt: 'No regional clues this time. What is this bread?',
    image: question.image,
    alt: question.alt,
    size: question.size,
    choices: keys.map(nameLabel),
    answerIndex,
    reveal: question.elsewhere ?? '',
  };
}

export function buildPlaceRound(question, rng, nextPool, questions) {
  const correct = question.region;
  const ineligible = new Set([question.answer, ...(question.alsoAcceptable ?? [])]);
  const seen = new Set([correct]);
  const distractors = [];
  for (const q of shuffle([...questions], rng)) {
    if (seen.has(q.region) || ineligible.has(q.answer)) continue;
    seen.add(q.region);
    distractors.push(q.region);
    if (distractors.length === CHOICES_PER_ROUND - 1) break;
  }
  const choices = shuffle([correct, ...distractors], rng);
  return {
    kind: 'place',
    prompt: `Somewhere in Britain, this is a ${nameLabel(question.answer).toLowerCase()}. Where are you?`,
    ...imageFor(question, nextPool),
    choices,
    answerIndex: choices.indexOf(correct),
    reveal: question.elsewhere ?? '',
  };
}

export function buildImpostorRound(rng) {
  const reals = shuffle([...NAME_KEYS], rng)
    .slice(0, CHOICES_PER_ROUND - 1)
    .map(nameLabel);
  const fake = shuffle([...FAKE_NAMES], rng)[0];
  const choices = shuffle([...reals, fake], rng);
  return {
    kind: 'impostor',
    prompt: 'Three of these are genuine British names for a bread roll. Which one did we invent?',
    choices,
    answerIndex: choices.indexOf(fake),
    reveal: `${fake} is the one we made up. The other three are all real somewhere: ${reals.join(', ')}.`,
  };
}

export function buildNationalRound(rng) {
  const [a, b] = shuffle([...RANKED_KEYS], rng).slice(0, 2);
  const winner = NAMES[a].rank < NAMES[b].rank ? a : b;
  const loser = winner === a ? b : a;
  const choices = shuffle([nameLabel(a), nameLabel(b)], rng);
  return {
    kind: 'national',
    prompt: 'Which of these does Britain reach for more often?',
    choices,
    answerIndex: choices.indexOf(nameLabel(winner)),
    reveal: `${nameLabel(winner)} is the more widespread of the two, with ${nameLabel(
      loser,
    ).toLowerCase()} the more local taste, going by the YouGov survey of what the country calls a roll.`,
  };
}
