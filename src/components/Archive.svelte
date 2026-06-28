<script>
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';
  import { load } from '../lib/persistence.js';
  import { todayNumber, dateLabelForDay, ROUNDS_PER_DAY } from '../lib/daily.js';

  const dispatch = createEventDispatcher();

  // Read the saved history once when the archive opens, so each row reflects whatever
  // you've finished, half-played, or never started. Newest day first, back to day zero.
  const today = todayNumber();
  const results = load().results;

  const days = [];
  for (let n = today; n >= 0; n--) {
    const rec = results[n] ?? null;
    days.push({
      n,
      label: dateLabelForDay(n),
      isToday: n === today,
      complete: Boolean(rec?.complete),
      started: Boolean(rec?.guesses?.length) && !rec?.complete,
      score: rec?.score ?? null,
    });
  }

  const done = days.filter((d) => d.complete).length;

  function pick(n) {
    dispatch('select', n);
  }
</script>

<Modal title="Roll archive" on:close>
  <p class="intro">
    Every day Rolldle has run is here, so you can go back and catch up on the rolls you
    missed. You've finished {done} of {days.length}. Only today's roll counts towards your
    streak; the rest are just for the joy of it.
  </p>

  <ul class="days">
    {#each days as d (d.n)}
      <li>
        <button
          type="button"
          class="day"
          class:complete={d.complete}
          on:click={() => pick(d.n)}
        >
          <span class="meta">
            <span class="no">No.&nbsp;{d.n}{#if d.isToday}<span class="badge">Today</span>{/if}</span>
            <span class="date">{d.label}</span>
          </span>
          <span class="status">
            {#if d.complete}
              <span class="score">{d.score}/{ROUNDS_PER_DAY}</span>
              <span class="tick" aria-hidden="true">✓</span>
            {:else if d.started}
              <span class="resume">Resume</span>
            {:else}
              <span class="play">Play</span>
            {/if}
          </span>
        </button>
      </li>
    {/each}
  </ul>
</Modal>

<style>
  .intro {
    color: var(--ink-soft);
    font-size: 0.92rem;
    margin-bottom: 1rem;
  }
  .days {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .day {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.7rem 0.9rem;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  .day.complete {
    border-color: var(--correct);
  }
  .day:hover {
    border-color: var(--crust);
  }
  .meta {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .no {
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .badge {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #fff;
    background: var(--crust);
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
  }
  .date {
    color: var(--ink-soft);
    font-size: 0.82rem;
  }
  .status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .score {
    font-weight: 800;
    font-size: 1.05rem;
  }
  .tick {
    color: var(--correct);
    font-weight: 800;
  }
  .resume,
  .play {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--crust);
  }
</style>
