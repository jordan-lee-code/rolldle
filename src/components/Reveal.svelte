<script>
  import { NAMES } from '../lib/data/names.js';

  export let round;
  export let answer; // the player's { choiceIndex, correct }

  $: question = round.question;
  $: chosenKey = round.choices[answer.choiceIndex];
  $: correctLabel = NAMES[question.answer]?.label ?? question.answer;
  $: chosenLabel = NAMES[chosenKey]?.label ?? chosenKey;
</script>

<div class="reveal" class:correct={answer.correct}>
  <p class="verdict">
    {#if answer.correct}
      Spot on — a <strong>{correctLabel.toLowerCase()}</strong> it is.
    {:else}
      You said <strong>{chosenLabel.toLowerCase()}</strong>; round there it's a
      <strong>{correctLabel.toLowerCase()}</strong>.
    {/if}
  </p>
  {#if question.elsewhere}
    <p class="elsewhere">{question.elsewhere}</p>
  {/if}
</div>

<style>
  .reveal {
    margin-top: 1rem;
    padding: 0.9rem 1rem;
    border-radius: var(--radius);
    background: var(--wrong-soft);
    border: 1px solid var(--line);
  }
  .reveal.correct {
    background: var(--correct-soft);
  }
  .verdict {
    font-weight: 600;
    margin-bottom: 0.4rem;
  }
  .elsewhere {
    color: var(--ink-soft);
    font-size: 0.95rem;
  }
</style>
