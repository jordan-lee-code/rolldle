<script>
  import Modal from './Modal.svelte';
  import { POOL } from '../lib/data/pool.js';
  import { CREDITS } from '../lib/data/credits.js';

  const pinned = Object.values(CREDITS);
</script>

<Modal title="About the photos" on:close>
  <p>
    The {POOL.length} roll photos come from contributors to Wikimedia Commons, under open
    licences. Most are public domain or CC0 and ask for nothing in return; where a
    licence does ask for credit, the photographer is recorded in the project's image
    manifest, so the attribution lives with the code even though the game stays
    uncluttered.
  </p>
  <p>
    A few breads are shown with specific, verified photos, and those folk deserve a
    name here:
  </p>
  <ul>
    {#each pinned as c}
      <li>
        <strong>{c.title}</strong>, by {c.author},
        <a href={c.licenseUrl} target="_blank" rel="noopener">{c.license}</a>
      </li>
    {/each}
  </ul>
  <p class="aside">With thanks to everyone who photographs their lunch.</p>
</Modal>

<style>
  p {
    margin-bottom: 0.85rem;
  }
  ul {
    list-style: none;
    margin: 0 0 0.85rem;
    padding: 0;
  }
  li {
    padding: 0.5rem 0;
    border-top: 1px solid var(--line);
    font-size: 0.92rem;
  }
  a {
    color: var(--focus);
  }
  .aside {
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
</style>
