<script>
  export let round;
  export let answer; // the player's { choiceIndex, correct }

  $: correctLabel = round.choices[round.answerIndex];
  $: chosenLabel = round.choices[answer.choiceIndex];

  // The verdict reads differently per kind: a roll name wants the indefinite article and
  // lower case ("a barm it is"), a place name stays as it is ("Newcastle it is"), and the
  // impostor and face-off rounds talk about the choice rather than the bread.
  $: verdict = phrase(round.kind, answer.correct, correctLabel, chosenLabel);

  function lower(label) {
    return label.toLowerCase();
  }

  function phrase(kind, correct, right, chosen) {
    switch (kind) {
      case 'place':
        return correct
          ? `Yes, ${right} it is.`
          : `You said ${chosen}; it's ${right}.`;
      case 'impostor':
        return correct
          ? `Right, ${chosen} is the one we invented.`
          : `${chosen} is real; the invented one is ${right}.`;
      case 'national':
        return correct
          ? `Right, ${right} is the more common.`
          : `Actually ${lower(right)} edges out ${lower(chosen)} across the country.`;
      case 'identify':
      case 'name':
      default:
        return correct
          ? `Spot on, a ${lower(right)} it is.`
          : `You said ${lower(chosen)}; it's a ${lower(right)}.`;
    }
  }
</script>

<div class="reveal" class:correct={answer.correct}>
  <p class="verdict">{verdict}</p>
  {#if round.reveal}
    <p class="elsewhere">{round.reveal}</p>
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
