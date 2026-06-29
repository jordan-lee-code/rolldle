// The controlled vocabulary of roll names. Every multiple-choice option, whether
// it is the right answer or a distractor, is drawn from this single universe, so
// the choices always feel like plausible siblings rather than obvious throwaways.
//
// `label` is what the player sees on the button. Keep the keys short and stable,
// because they are referenced by `answer` in questions.js and stored in saved games.
//
// `rank` is national popularity from the YouGov survey of what Britain calls a bread
// roll, lower being more widely used. It drives the "which does the country use more"
// round, so only names with a meaningful national showing carry one; the tightly local
// words (scuffler, bin lid, oven bottom) are left without, because comparing their
// national share would be a coin toss rather than a question.
export const NAMES = {
  barm: { label: 'Barm', rank: 5 },
  cob: { label: 'Cob', rank: 3 },
  bap: { label: 'Bap', rank: 4 },
  batch: { label: 'Batch', rank: 6 },
  teacake: { label: 'Teacake', rank: 8 },
  breadcake: { label: 'Breadcake', rank: 9 },
  stottie: { label: 'Stottie', rank: 10 },
  muffin: { label: 'Muffin', rank: 7 },
  bun: { label: 'Bun' },
  breadroll: { label: 'Bread roll', rank: 1 },
  roll: { label: 'Roll', rank: 2 },
  scuffler: { label: 'Scuffler' },
  binlid: { label: 'Bin lid' },
  ovenbottom: { label: 'Oven bottom' },
};

// The order to fall back on when we need a stable list (e.g. for tests).
export const NAME_KEYS = Object.keys(NAMES);

// Names that carry a national popularity figure, for the face-off round.
export const RANKED_KEYS = NAME_KEYS.filter((key) => NAMES[key].rank != null);

// Invented names for the "spot the impostor" round. None of these is a real regional
// word for a roll anywhere in Britain; they only have to sound as though they might be.
// The reveal always owns up to which one we made up, so nobody leaves misinformed.
export const FAKE_NAMES = [
  'Floom',
  'Snudge',
  'Brundle',
  'Glubbin',
  'Crottle',
  'Pobbin',
  'Wuffler',
  'Wadgeon',
];

export function nameLabel(key) {
  return NAMES[key]?.label ?? key;
}
