<script>
  import { onMount } from 'svelte';
  import Header from './components/Header.svelte';
  import HowToPlay from './components/HowToPlay.svelte';
  import Credits from './components/Credits.svelte';
  import RoundCard from './components/RoundCard.svelte';
  import ResultGrid from './components/ResultGrid.svelte';
  import { game } from './lib/store.js';
  import { ROUNDS_PER_DAY } from './lib/daily.js';

  let showHelp = false;
  let showCredits = false;

  $: ({ puzzle, phase, current, answers, streak, seenHelp } = $game);
  $: round = puzzle.rounds[current];
  $: currentAnswer = answers[current] ?? null;

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
    on:help={() => (showHelp = true)}
    on:credits={() => (showCredits = true)}
  />

  {#if phase === 'intro'}
    <section class="intro">
      <p class="lead">
        {ROUNDS_PER_DAY} rolls, {ROUNDS_PER_DAY} corners of Britain, and one daily argument
        about what to call them.
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
    <ResultGrid {puzzle} {answers} {streak} />
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

<style>
  main {
    max-width: 30rem;
    margin: 0 auto;
    padding: 0 1rem 2rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
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
  footer {
    margin-top: auto;
    padding-top: 1.5rem;
    border-top: 1px solid var(--line);
    color: var(--ink-soft);
    font-size: 0.78rem;
    text-align: center;
  }
</style>
