<script>
  import Modal from './Modal.svelte';
  import { ROUNDS_PER_DAY } from '../lib/daily.js';
</script>

<Modal title="How to play" on:close>
  <p>
    Britain cannot agree on what to call a bread roll, and that disagreement is the
    whole game. Each day you get {ROUNDS_PER_DAY} rounds.
  </p>
  <ol>
    <li>Most rounds show a roll and tell you where you're standing; pick the name a local would use.</li>
    <li>
      Some rounds flip it around: you're given the name and asked where in Britain
      you'd hear it, or shown a distinctive bread to identify with no clue at all.
    </li>
    <li>
      A couple are pure word games: spot the name we invented among the real ones, or
      pick the one the country uses more often.
    </li>
    <li>
      After each guess you'll find out a little more, because half the joy is in the
      argument.
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
