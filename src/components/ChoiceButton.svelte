<script>
  // state: 'idle' | 'chosen-correct' | 'chosen-wrong' | 'reveal-correct' | 'muted'
  export let label;
  export let state = 'idle';
  export let disabled = false;
  export let shortcut = null;

  $: marker =
    state === 'reveal-correct' || state === 'chosen-correct'
      ? { glyph: '✓', word: 'correct answer' }
      : state === 'chosen-wrong'
        ? { glyph: '✗', word: 'your answer, not the local word' }
        : null;
</script>

<button
  type="button"
  class="choice {state}"
  {disabled}
  on:click
>
  {#if shortcut}<span class="key" aria-hidden="true">{shortcut}</span>{/if}
  <span class="label">{label}</span>
  {#if marker}
    <span class="marker" aria-hidden="true">{marker.glyph}</span>
    <span class="visually-hidden">({marker.word})</span>
  {/if}
</button>

<style>
  .choice {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
    min-height: 3rem;
    padding: 0.7rem 0.9rem;
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--ink);
    font-size: 1.05rem;
    font-weight: 600;
    text-align: left;
    transition: border-color 0.12s ease, background 0.12s ease, transform 0.06s ease;
  }
  .choice:not(:disabled):hover {
    border-color: var(--crust);
  }
  .choice:not(:disabled):active {
    transform: translateY(1px);
  }
  .key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 6px;
    background: var(--board);
    color: var(--ink-soft);
    font-size: 0.8rem;
    font-weight: 700;
    flex: none;
  }
  .label {
    flex: 1;
  }
  .marker {
    flex: none;
    font-size: 1.25rem;
    font-weight: 800;
    line-height: 1;
  }
  .choice:disabled {
    cursor: default;
  }
  .muted {
    opacity: 0.5;
  }
  .chosen-correct,
  .reveal-correct {
    border-color: var(--correct);
    background: var(--correct-soft);
    opacity: 1;
  }
  .chosen-correct .marker,
  .reveal-correct .marker {
    color: var(--correct);
  }
  .chosen-wrong {
    border-color: var(--wrong);
    background: var(--wrong-soft);
    opacity: 1;
  }
  .chosen-wrong .marker {
    color: var(--wrong);
  }
</style>
