<script>
  import Modal from './Modal.svelte';
  import { ROUNDS_PER_DAY } from '../lib/daily.js';
</script>

<Modal title="How to play" on:close>
  <p>
    Britain cannot agree on what to call a bread roll, and that disagreement is the
    whole game. Each day you get {ROUNDS_PER_DAY} rolls to name.
  </p>
  <ol>
    <li>You're shown a roll and told where in the country you're standing.</li>
    <li>Pick the name a local would actually use from the four on offer.</li>
    <li>
      After each guess you'll find out what the same roll is called elsewhere, because
      half the joy is in the argument.
    </li>
  </ol>
  <p>
    Everyone playing today gets the same rolls, so you can share your row of squares
    without giving the answers away. Come back tomorrow for a fresh batch.
  </p>
  <p class="aside">
    Sizes are real, by the way. A stottie or a teacake is made to be shared and dwarfs
    an ordinary dinner roll, and the pictures keep that to scale.
  </p>
  <button class="ok" type="button" data-autofocus on:click>Right, let's go</button>
</Modal>

<style>
  p {
    margin-bottom: 0.85rem;
  }
  ol {
    margin: 0 0 0.85rem;
    padding-left: 1.2rem;
  }
  li {
    margin-bottom: 0.4rem;
  }
  .aside {
    color: var(--ink-soft);
    font-size: 0.95rem;
  }
  .ok {
    margin-top: 0.5rem;
    width: 100%;
    border: none;
    background: var(--crust);
    color: #fff;
    padding: 0.8rem;
    border-radius: var(--radius);
    font-weight: 600;
  }
</style>
