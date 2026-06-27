// The shareable result. It gives away only how you did, never which answers were
// right, so passing it to a friend doesn't spoil their go. The numeric score sits
// alongside the tiles so the result still reads for anyone who can't tell the
// colours apart.
const SITE = 'rolldle';

export function resultGrid(puzzle, answers) {
  const score = answers.filter((a) => a.correct).length;
  const tiles = answers.map((a) => (a.correct ? '🟩' : '⬛')).join('');
  return `Rolldle #${puzzle.dayNumber}  ${score}/${answers.length}\n${tiles}\n🍞 ${SITE}`;
}

// Share via the platform sheet on mobile, fall back to the clipboard on desktop, and
// let the caller offer a manual copy if neither is available. Both APIs need a secure
// context and a user gesture, so always call this straight from a click handler.
export async function shareResult(text) {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
      // Otherwise fall through and try the clipboard.
    }
  }
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      // Fall through to manual.
    }
  }
  return 'manual';
}
