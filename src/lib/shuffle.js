// In-place Fisher-Yates shuffle driven by a supplied rng, so the result is fully
// reproducible for a given seed. Returns the same array for convenience. Lives on its
// own so both the day builder and the round builders can share it without either
// importing the other.
export function shuffle(array, rng) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
