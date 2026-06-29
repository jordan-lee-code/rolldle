<script>
  import { createEventDispatcher } from 'svelte';

  export let dayNumber;
  export let isToday = true;
  export let dateLabel = '';
  export let endless = false;
  const dispatch = createEventDispatcher();
</script>

<header class="site">
  <div class="title">
    <span class="loaf" aria-hidden="true">🍞</span>
    <div>
      <h1>Rolldle</h1>
      <p class="sub">
        No.&nbsp;{dayNumber} · {isToday ? 'what do you call a bread roll?' : dateLabel}
      </p>
    </div>
  </div>
  <nav>
    {#if !endless}
      <button
        type="button"
        class="pill"
        on:click={() => dispatch('endless')}
        aria-label="Endless practice"
        title="Endless practice">∞</button
      >
    {/if}
    <button
      type="button"
      class="pill"
      on:click={() => dispatch('archive')}
      aria-label="Roll archive"
      title="Roll archive">🗓</button
    >
    <button
      type="button"
      class="pill"
      on:click={() => dispatch('help')}
      aria-label="How to play"
      title="How to play">?</button
    >
    <button
      type="button"
      class="pill"
      on:click={() => dispatch('credits')}
      aria-label="Image credits"
      title="Image credits">©</button
    >
  </nav>
</header>

<style>
  .site {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.9rem 0;
    border-bottom: 1px solid var(--line);
  }
  .title {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .loaf {
    font-size: 1.8rem;
  }
  h1 {
    font-size: 1.5rem;
    letter-spacing: -0.01em;
  }
  .sub {
    color: var(--ink-soft);
    font-size: 0.82rem;
  }
  nav {
    display: flex;
    gap: 0.4rem;
  }
  .pill {
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 50%;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink-soft);
    font-weight: 700;
  }
</style>
