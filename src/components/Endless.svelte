<script>
  import { createEventDispatcher } from 'svelte';
  import RoundCard from './RoundCard.svelte';
  import { buildEndlessRound } from '../lib/daily.js';
  import { load, save } from '../lib/persistence.js';

  const dispatch = createEventDispatcher();

  // Endless is the companion to the daily and the archive: no streak, no date, just one
  // round after another until you slip. A run is reproducible from its seed, but the seed
  // itself is picked freshly each time so no two runs feel the same.
  let best = load().endlessBest ?? 0;
  let base = freshSeed();
  let index = 0;
  let runLength = 0;
  let round = buildEndlessRound(`${base}-${index}`);
  let answer = null;
  let over = false;

  function freshSeed() {
    return Math.floor(Math.random() * 1_000_000_000);
  }

  function onAnswer(choiceIndex) {
    if (answer) return;
    const correct = choiceIndex === round.answerIndex;
    answer = { choiceIndex, correct };
    if (correct) runLength += 1;
  }

  function onNext() {
    if (answer?.correct) {
      index += 1;
      round = buildEndlessRound(`${base}-${index}`);
      answer = null;
      return;
    }
    // A wrong answer ends the run. Record the best before showing the tally.
    if (runLength > best) {
      best = runLength;
      const data = load();
      data.endlessBest = best;
      save(data);
    }
    over = true;
  }

  function again() {
    base = freshSeed();
    index = 0;
    runLength = 0;
    round = buildEndlessRound(`${base}-${index}`);
    answer = null;
    over = false;
  }
</script>

{#if over}
  <section class="over">
    <p class="tally">{runLength} <span>in a row</span></p>
    <p class="blurb">
      {#if runLength === 0}
        The first one got you. The map is a confusing place; it happens to everyone.
      {:else if runLength >= best}
        A new best run. You really do know your rolls.
      {:else}
        A good run. Your best stands at {best}.
      {/if}
    </p>
    <div class="actions">
      <button type="button" class="primary" on:click={again}>Go again</button>
      <button type="button" class="ghost" on:click={() => dispatch('close')}>
        Back to today's roll
      </button>
    </div>
  </section>
{:else}
  <RoundCard
    {round}
    {answer}
    roundNumber={runLength + 1}
    total={0}
    isLast={Boolean(answer) && !answer.correct}
    progressLabel={`Endless · ${runLength} so far${best ? ` · best ${best}` : ''}`}
    on:answer={(e) => onAnswer(e.detail)}
    on:next={onNext}
  />
{/if}

<style>
  .over {
    text-align: center;
    padding: 2.5rem 0;
  }
  .tally {
    font-size: 3.5rem;
    font-weight: 800;
    line-height: 1;
  }
  .tally span {
    display: block;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink-soft);
    margin-top: 0.4rem;
  }
  .blurb {
    color: var(--ink-soft);
    margin: 1.25rem 0 1.75rem;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .primary {
    border: none;
    background: var(--crust);
    color: #fff;
    padding: 0.9rem;
    border-radius: var(--radius);
    font-weight: 700;
    font-size: 1.05rem;
    cursor: pointer;
  }
  .primary:hover {
    background: var(--crust-dark);
  }
  .ghost {
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink);
    padding: 0.75rem;
    border-radius: var(--radius);
    font-weight: 600;
    cursor: pointer;
  }
</style>
