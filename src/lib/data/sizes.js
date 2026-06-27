// Rolls are not all the same size, and pretending they are flattens a lot of the
// fun. A stottie or a bin lid is made to be shared and genuinely dwarfs a dinner
// roll; a teacake up north is bigger than most people expect. So each question
// carries a `size`, and the round renders the photo at a matching scale against a
// constant board, the way the real thing would look if you set them side by side.
//
// `scale` is relative to an ordinary dinner roll at 1. `caption` is a fond little
// note shown under the photo so the size reads even on its own.
export const SIZES = {
  small: { scale: 0.8, caption: 'On the small side' },
  regular: { scale: 1, caption: 'About dinner-roll sized' },
  large: { scale: 1.45, caption: 'Bigger than you might expect' },
  huge: { scale: 2.1, caption: 'A proper big one, made to share' },
};

export const DEFAULT_SIZE = 'regular';

export function sizeFor(key) {
  return SIZES[key] ?? SIZES[DEFAULT_SIZE];
}
