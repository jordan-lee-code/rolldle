// The controlled vocabulary of roll names. Every multiple-choice option, whether
// it is the right answer or a distractor, is drawn from this single universe, so
// the choices always feel like plausible siblings rather than obvious throwaways.
//
// `label` is what the player sees on the button. Keep the keys short and stable —
// they are referenced by `answer` in questions.js and stored in saved games.
export const NAMES = {
  barm: { label: 'Barm' },
  cob: { label: 'Cob' },
  bap: { label: 'Bap' },
  batch: { label: 'Batch' },
  teacake: { label: 'Teacake' },
  breadcake: { label: 'Breadcake' },
  stottie: { label: 'Stottie' },
  muffin: { label: 'Muffin' },
  bun: { label: 'Bun' },
  breadroll: { label: 'Bread roll' },
  roll: { label: 'Roll' },
  scuffler: { label: 'Scuffler' },
  binlid: { label: 'Bin lid' },
  ovenbottom: { label: 'Oven bottom' },
};

// The order to fall back on when we need a stable list (e.g. for tests).
export const NAME_KEYS = Object.keys(NAMES);

export function nameLabel(key) {
  return NAMES[key]?.label ?? key;
}
