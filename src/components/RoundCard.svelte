<script>
  import { createEventDispatcher } from 'svelte';
  import ChoiceButton from './ChoiceButton.svelte';
  import Reveal from './Reveal.svelte';
  import { sizeFor } from '../lib/data/sizes.js';

  export let round;
  export let answer = null; // { choiceIndex, correct } once answered, else null
  export let roundNumber; // 1-based
  export let total;
  export let isLast;

  const dispatch = createEventDispatcher();
  const base = import.meta.env.BASE_URL;

  $: answered = answer != null;
  // Word rounds (spot the impostor, the national face-off) carry no photo, so the board
  // only shows when there's an image to put on it.
  $: hasImage = Boolean(round.image);
  $: size = sizeFor(round.size);
  // The photo dominates the screen (a regular roll fills about two thirds of it), and
  // size scales from there against a constant board: a stottie fills it edge to edge, a
  // small roll sits modestly in the middle. The caption only shows when the size is
  // worth remarking on, so ordinary rolls aren't labelled every round.
  $: widthPct = Math.min(100, size.scale * 86);
  $: showCaption = round.size && round.size !== 'regular';

  // Computed as a reactive statement (not a function call in the template) so Svelte
  // tracks `answer` as a dependency and recolours the buttons the moment it changes.
  $: states = round.choices.map((_, i) => {
    if (answer == null) return 'idle';
    if (i === round.answerIndex) return 'reveal-correct';
    if (i === answer.choiceIndex) return 'chosen-wrong';
    return 'muted';
  });

  function pick(i) {
    if (!answered) dispatch('answer', i);
  }

  function onKeydown(event) {
    if (answered) return;
    const n = Number(event.key);
    if (Number.isInteger(n) && n >= 1 && n <= round.choices.length) {
      pick(n - 1);
    }
  }
</script>

<svelte:window on:keydown={onKeydown} />

<section class="round">
  <p class="progress">Roll {roundNumber} of {total}</p>

  {#if hasImage}
    <figure>
      <div class="board">
        <img src={`${base}${round.image}`} alt={round.alt} style={`width:${widthPct}%`} />
      </div>
      {#if showCaption}<figcaption>{size.caption}</figcaption>{/if}
    </figure>
  {/if}

  <h2 class="prompt" class:wordy={!hasImage}>{round.prompt}</h2>

  <div class="choices">
    {#each round.choices as choice, i}
      <ChoiceButton
        label={choice}
        shortcut={i + 1}
        state={states[i]}
        disabled={answered}
        on:click={() => pick(i)}
      />
    {/each}
  </div>

  <p class="live" aria-live="polite">
    {#if answered}
      {answer.correct ? 'Correct.' : 'Not quite.'}
    {/if}
  </p>

  {#if answered}
    <Reveal {round} {answer} />
    <button class="next" type="button" on:click={() => dispatch('next')}>
      {isLast ? 'See your result' : 'Next roll'} →
    </button>
  {/if}
</section>

<style>
  .round {
    padding: 1.25rem 0 2rem;
  }
  .progress {
    color: var(--ink-soft);
    font-size: 0.85rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  figure {
    margin: 0.75rem 0 1rem;
  }
  .board {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 220px;
    max-height: 66vh;
    padding: 0.5rem;
    background: var(--board);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: hidden;
  }
  .board img {
    height: auto;
    max-height: 64vh;
    object-fit: contain;
    border-radius: 8px;
  }
  figcaption {
    text-align: center;
    color: var(--ink-soft);
    font-size: 0.85rem;
    margin-top: 0.5rem;
    font-style: italic;
  }
  .prompt {
    font-size: 1.3rem;
    margin: 0.5rem 0 1rem;
    text-align: center;
  }
  /* With no photo above it, the question carries the round, so it gets a little more
     room and weight to fill the space the board would have taken. */
  .prompt.wordy {
    font-size: 1.45rem;
    margin: 1.75rem 0 1.5rem;
  }
  .choices {
    display: grid;
    gap: 0.6rem;
  }
  .live {
    min-height: 0;
  }
  .next {
    margin-top: 1rem;
    width: 100%;
    border: none;
    background: var(--crust);
    color: #fff;
    padding: 0.85rem;
    border-radius: var(--radius);
    font-weight: 700;
    font-size: 1.05rem;
  }
  @media (min-width: 520px) {
    .choices {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
