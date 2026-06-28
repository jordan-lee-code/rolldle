<script>
  import { onMount } from 'svelte';
  import { resultGrid, shareResult } from '../lib/share.js';
  import { msUntilTomorrow } from '../lib/daily.js';
  import { KOFI_URL } from '../lib/kofi.js';

  export let puzzle;
  export let answers;
  export let streak;

  $: score = answers.filter((a) => a.correct).length;
  $: total = answers.length;
  $: gridText = resultGrid(puzzle, answers);

  let toast = '';
  let countdown = '';

  async function onShare() {
    const result = await shareResult(gridText);
    if (result === 'copied') toast = 'Copied to your clipboard';
    else if (result === 'shared') toast = 'Shared';
    else if (result === 'manual') toast = 'Copy the text below to share';
    if (toast) setTimeout(() => (toast = ''), 2500);
  }

  function format(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  }

  onMount(() => {
    const tick = () => (countdown = format(msUntilTomorrow()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  });

  const lines = {
    5: 'A clean sweep. You could run a bakery.',
    4: 'Nearly the lot — a fine showing.',
    3: 'A respectable haul.',
    2: 'A couple landed. The map is a confusing place.',
    1: 'One on the board. Tomorrow is another batch.',
    0: 'A blank today, but no roll left unloved.',
  };
</script>

<section class="result">
  <p class="score">{score} <span>/ {total}</span></p>
  <p class="blurb">{lines[score] ?? ''}</p>

  <div
    class="grid"
    aria-label={`Score ${score} out of ${total}`}
  >
    {#each answers as a}
      <span class="tile" class:correct={a.correct} aria-hidden="true">
        {a.correct ? '🟩' : '⬛'}
      </span>
    {/each}
  </div>

  <div class="streak">
    <span>Streak <strong>{streak.current}</strong></span>
    <span>Best <strong>{streak.max}</strong></span>
  </div>

  <button class="share" type="button" on:click={onShare}>Share your result</button>
  {#if toast}<p class="toast" role="status">{toast}</p>{/if}

  <details class="manual">
    <summary>Copy as text</summary>
    <textarea readonly rows="3">{gridText}</textarea>
  </details>

  <aside class="kofi">
    <p>
      Rolldle is free, and made for the love of a daft argument about bread. If it
      brightened your morning, you're warmly welcome to buy me a cup of tea.
    </p>
    <a class="kofi-btn" href={KOFI_URL} target="_blank" rel="noopener">
      <span aria-hidden="true">☕</span> Support me on Ko-fi
    </a>
  </aside>

  <p class="tomorrow">Fresh rolls in <strong>{countdown}</strong></p>
</section>

<style>
  .result {
    text-align: center;
    padding: 1.5rem 0 2rem;
  }
  .score {
    font-size: 3rem;
    font-weight: 800;
    line-height: 1;
  }
  .score span {
    font-size: 1.4rem;
    color: var(--ink-soft);
    font-weight: 600;
  }
  .blurb {
    color: var(--ink-soft);
    margin: 0.5rem 0 1.25rem;
  }
  .grid {
    font-size: 2rem;
    letter-spacing: 0.15rem;
    margin-bottom: 1.25rem;
  }
  .streak {
    display: flex;
    justify-content: center;
    gap: 2rem;
    color: var(--ink-soft);
    margin-bottom: 1.25rem;
  }
  .streak strong {
    color: var(--ink);
    font-size: 1.1rem;
  }
  .share {
    width: 100%;
    border: none;
    background: var(--correct);
    color: #fff;
    padding: 0.9rem;
    border-radius: var(--radius);
    font-weight: 700;
    font-size: 1.05rem;
  }
  .toast {
    margin-top: 0.6rem;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  .manual {
    margin-top: 1rem;
    text-align: left;
  }
  .manual summary {
    cursor: pointer;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  textarea {
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.6rem;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    color: var(--ink);
    font-family: inherit;
    resize: none;
  }
  .kofi {
    margin-top: 1.75rem;
    padding: 1.1rem 1rem;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
  }
  .kofi p {
    color: var(--ink-soft);
    font-size: 0.92rem;
    margin-bottom: 0.9rem;
  }
  .kofi-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.2rem;
    border-radius: var(--radius);
    background: var(--crust);
    color: #fff;
    font-weight: 700;
    text-decoration: none;
  }
  .kofi-btn:hover {
    background: var(--crust-dark);
  }
  .tomorrow {
    margin-top: 1.5rem;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
</style>
