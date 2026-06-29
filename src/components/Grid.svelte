<script>
  import { createEventDispatcher } from 'svelte';
  import { GRID_GROUPS, GRID_PLACES, GROUP_OF } from '../lib/data/grid.js';
  import { shareResult } from '../lib/share.js';

  const dispatch = createEventDispatcher();
  const EMOJI = ['🟨', '🟩', '🟦', '🟪'];

  let tiles = shuffled();
  let selected = [];
  let solved = []; // group indices solved correctly, in order
  let history = []; // each guess as four group indices, for the shareable grid
  let mistakes = 0;
  let phase = 'playing'; // 'playing' | 'won' | 'lost'
  let message = '';
  let messageTimer;

  $: notSolved = [0, 1, 2, 3].filter((i) => !solved.includes(i));
  // While playing, only correctly solved groups show as banners. Once the run ends, the
  // rest are revealed too, so a lost board still teaches you the groupings you missed.
  $: banners = phase === 'lost' ? [...solved, ...notSolved] : solved;
  $: remaining = tiles.filter((p) => !solved.includes(GROUP_OF[p]));
  $: canSubmit = selected.length === 4 && phase === 'playing';

  function shuffled() {
    const a = [...GRID_PLACES];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function flash(text) {
    message = text;
    clearTimeout(messageTimer);
    if (text) messageTimer = setTimeout(() => (message = ''), 1800);
  }

  function toggle(place) {
    if (phase !== 'playing') return;
    if (selected.includes(place)) {
      selected = selected.filter((p) => p !== place);
    } else if (selected.length < 4) {
      selected = [...selected, place];
    }
  }

  function submit() {
    if (!canSubmit) return;
    history = [...history, selected.map((p) => GROUP_OF[p])];

    const counts = {};
    for (const p of selected) counts[GROUP_OF[p]] = (counts[GROUP_OF[p]] ?? 0) + 1;
    const exact = Object.keys(counts).find((i) => counts[i] === 4);

    if (exact !== undefined && !solved.includes(Number(exact))) {
      solved = [...solved, Number(exact)];
      selected = [];
      flash('');
      if (solved.length === 4) phase = 'won';
      return;
    }

    mistakes += 1;
    const closest = Math.max(...Object.values(counts));
    flash(closest === 3 ? 'So close, just one away.' : 'Not a group.');
    if (mistakes >= 4) {
      phase = 'lost';
      selected = [];
    }
  }

  function again() {
    tiles = shuffled();
    selected = [];
    solved = [];
    history = [];
    mistakes = 0;
    phase = 'playing';
    flash('');
  }

  let toast = '';
  async function onShare() {
    const rows = history.map((g) => g.map((i) => EMOJI[i]).join('')).join('\n');
    const head =
      phase === 'won'
        ? `Rolldle Grid  ${mistakes} ${mistakes === 1 ? 'slip' : 'slips'}`
        : 'Rolldle Grid  unsolved';
    const result = await shareResult(`${head}\n${rows}\n🍞 rolldle.co.uk`);
    toast = result === 'shared' ? 'Shared' : result === 'copied' ? 'Copied to your clipboard' : '';
    if (toast) setTimeout(() => (toast = ''), 2500);
  }
</script>

<section class="grid-game">
  <header class="intro">
    <h2>The grid</h2>
    <p>
      Sixteen places, four to a group, each group being the towns and cities that call a
      roll the same thing. Find all four. You've four slips to spare.
    </p>
  </header>

  {#if banners.length}
    <div class="solved">
      {#each banners as gi (gi)}
        <div class="band g{gi}" class:missed={phase === 'lost' && !solved.includes(gi)}>
          <strong>{GRID_GROUPS[gi].name}</strong>
          <span>{GRID_GROUPS[gi].region}: {GRID_GROUPS[gi].places.join(', ')}</span>
        </div>
      {/each}
    </div>
  {/if}

  {#if phase === 'playing'}
    <div class="board">
      {#each remaining as place (place)}
        <button
          type="button"
          class="tile"
          class:picked={selected.includes(place)}
          on:click={() => toggle(place)}
        >
          {place}
        </button>
      {/each}
    </div>

    <div class="mistakes" aria-label={`${mistakes} of 4 slips used`}>
      <span>Slips</span>
      {#each [0, 1, 2, 3] as i}
        <span class="dot" class:used={i < mistakes} aria-hidden="true"></span>
      {/each}
    </div>

    <p class="message" aria-live="polite">{message}</p>

    <div class="controls">
      <button type="button" class="ghost" on:click={() => (selected = [])} disabled={!selected.length}>
        Clear
      </button>
      <button type="button" class="primary" on:click={submit} disabled={!canSubmit}>Submit</button>
    </div>
  {:else}
    <div class="end">
      <p class="verdict">
        {#if phase === 'won'}
          {mistakes === 0 ? 'A clean board. Beautifully done.' : `Solved, with ${mistakes} ${mistakes === 1 ? 'slip' : 'slips'} to spare a blush.`}
        {:else}
          The board got the better of you this time. Here's how it all sat.
        {/if}
      </p>
      <button type="button" class="primary" on:click={onShare}>Share the grid</button>
      {#if toast}<p class="toast" role="status">{toast}</p>{/if}
      <div class="controls">
        <button type="button" class="ghost" on:click={again}>New board</button>
        <button type="button" class="ghost" on:click={() => dispatch('close')}>Back to today</button>
      </div>
    </div>
  {/if}
</section>

<style>
  .grid-game {
    padding: 1rem 0 2rem;
  }
  .intro h2 {
    font-size: 1.4rem;
  }
  .intro p {
    color: var(--ink-soft);
    font-size: 0.95rem;
    margin: 0.4rem 0 1rem;
  }
  .solved {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 0.6rem;
  }
  .band {
    border-radius: 10px;
    padding: 0.55rem 0.75rem;
    text-align: center;
    color: #1c1407;
  }
  .band strong {
    display: block;
    font-size: 1rem;
  }
  .band span {
    font-size: 0.82rem;
    opacity: 0.85;
  }
  .band.missed {
    opacity: 0.7;
    outline: 2px dashed rgba(0, 0, 0, 0.25);
  }
  .g0 {
    background: #f1c84b;
  }
  .g1 {
    background: #a7c957;
  }
  .g2 {
    background: #7ab8e0;
  }
  .g3 {
    background: #c2a7e0;
  }
  .board {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.4rem;
  }
  .tile {
    aspect-ratio: 4 / 3;
    min-height: 3.5rem;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    color: var(--ink);
    font-weight: 700;
    font-size: 0.78rem;
    padding: 0.2rem;
    cursor: pointer;
    word-break: break-word;
  }
  .tile.picked {
    background: var(--crust);
    color: #fff;
    border-color: var(--crust);
  }
  .mistakes {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    margin: 1rem 0 0.25rem;
    color: var(--ink-soft);
    font-size: 0.85rem;
  }
  .dot {
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
    background: var(--line);
  }
  .dot.used {
    background: var(--wrong, #c0492f);
  }
  .message {
    text-align: center;
    min-height: 1.2rem;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  .controls {
    display: flex;
    gap: 0.6rem;
    margin-top: 0.5rem;
  }
  .controls button {
    flex: 1;
    padding: 0.8rem;
    border-radius: var(--radius);
    font-weight: 700;
    cursor: pointer;
  }
  .primary {
    width: 100%;
    border: none;
    background: var(--crust);
    color: #fff;
    padding: 0.85rem;
    border-radius: var(--radius);
    font-weight: 700;
    font-size: 1.02rem;
    cursor: pointer;
  }
  .primary:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .ghost {
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink);
  }
  .ghost:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .end {
    text-align: center;
  }
  .verdict {
    margin: 0.5rem 0 1.25rem;
    color: var(--ink-soft);
  }
  .toast {
    margin-top: 0.6rem;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
</style>
