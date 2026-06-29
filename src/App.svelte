<script>
  import { onMount } from 'svelte';
  import Header from './components/Header.svelte';
  import HowToPlay from './components/HowToPlay.svelte';
  import Credits from './components/Credits.svelte';
  import Archive from './components/Archive.svelte';
  import Endless from './components/Endless.svelte';
  import RoundCard from './components/RoundCard.svelte';
  import ResultGrid from './components/ResultGrid.svelte';
  import { game } from './lib/store.js';
  import { ROUNDS_PER_DAY, dateLabelForDay } from './lib/daily.js';
  import { KOFI_URL } from './lib/kofi.js';

  let showHelp = false;
  let showCredits = false;
  let showArchive = false;
  let endless = false;

  $: ({ puzzle, phase, current, answers, streak, seenHelp, isToday } = $game);
  $: round = puzzle.rounds[current];
  $: currentAnswer = answers[current] ?? null;
  $: dateLabel = dateLabelForDay(puzzle.dayNumber);

  function openDay(n) {
    showArchive = false;
    game.loadDay(n);
  }

  function goToToday() {
    game.goToToday();
  }

  onMount(() => {
    // Greet first-timers with the rules; everyone else goes straight to the rolls.
    if (!seenHelp) showHelp = true;
  });

  function dismissHelp() {
    showHelp = false;
    game.markHelpSeen();
  }
</script>

<main>
  <Header
    dayNumber={puzzle.dayNumber}
    {isToday}
    {dateLabel}
    {endless}
    on:endless={() => (endless = true)}
    on:archive={() => (showArchive = true)}
    on:help={() => (showHelp = true)}
    on:credits={() => (showCredits = true)}
  />

  {#if endless}
    <Endless on:close={() => (endless = false)} />
  {:else}
  {#if !isToday && phase !== 'done'}
    <button class="back-today" type="button" on:click={goToToday}>← Back to today's roll</button>
  {/if}

  {#if phase === 'intro'}
    <section class="intro">
      <p class="lead">
        {ROUNDS_PER_DAY} rounds, a country that can't agree on what to call a bread roll,
        and one daily argument about it.
      </p>
      <button class="play" type="button" on:click={() => game.start()}>Play today's rolls</button>
    </section>
  {:else if phase === 'playing' && round}
    <RoundCard
      {round}
      answer={currentAnswer}
      roundNumber={current + 1}
      total={puzzle.rounds.length}
      isLast={current === puzzle.rounds.length - 1}
      on:answer={(e) => game.answer(e.detail)}
      on:next={() => game.advance()}
    />
  {:else if phase === 'done'}
    <ResultGrid
      {puzzle}
      {answers}
      {streak}
      {isToday}
      on:today={goToToday}
      on:archive={() => (showArchive = true)}
      on:endless={() => (endless = true)}
    />
  {/if}
  {/if}

  <footer>
    <p>A fond poke at British bread. Names from regional dialect surveys.</p>
  </footer>
</main>

{#if showHelp}
  <HowToPlay on:close={dismissHelp} on:click={dismissHelp} />
{/if}
{#if showCredits}
  <Credits on:close={() => (showCredits = false)} />
{/if}
{#if showArchive}
  <Archive on:select={(e) => openDay(e.detail)} on:close={() => (showArchive = false)} />
{/if}

<a
  class="kofi-float"
  href={KOFI_URL}
  target="_blank"
  rel="noopener"
  aria-label="Support Rolldle on Ko-fi"
>
  <span aria-hidden="true">☕</span> Ko-fi
</a>

<style>
  main {
    max-width: 30rem;
    margin: 0 auto;
    padding: 0 1rem 2rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .back-today {
    align-self: flex-start;
    margin-top: 0.75rem;
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink-soft);
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
  }
  .back-today:hover {
    color: var(--ink);
    border-color: var(--crust);
  }
  .intro {
    text-align: center;
    padding: 2.5rem 0;
    flex: 1;
  }
  .lead {
    font-size: 1.25rem;
    color: var(--ink-soft);
    margin-bottom: 1.75rem;
  }
  .play {
    border: none;
    background: var(--crust);
    color: #fff;
    padding: 0.9rem 1.6rem;
    border-radius: var(--radius);
    font-weight: 700;
    font-size: 1.1rem;
  }
  .kofi-float {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 40;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 0.95rem;
    border-radius: 999px;
    background: var(--crust);
    color: #fff;
    font-weight: 700;
    font-size: 0.92rem;
    text-decoration: none;
    box-shadow: var(--shadow);
    border: 1px solid rgba(0, 0, 0, 0.12);
  }
  .kofi-float:hover {
    background: var(--crust-dark);
  }
  footer {
    margin-top: auto;
    padding-top: 1.5rem;
    border-top: 1px solid var(--line);
    color: var(--ink-soft);
    font-size: 0.78rem;
    text-align: center;
  }
</style>
