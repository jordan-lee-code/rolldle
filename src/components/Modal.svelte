<script>
  import { createEventDispatcher, onMount } from 'svelte';

  export let title = '';
  const dispatch = createEventDispatcher();

  let dialog;
  let previouslyFocused;

  function close() {
    dispatch('close');
  }

  function onBackdropClick(event) {
    // Only a click on the backdrop itself dismisses; clicks inside the dialog don't.
    if (event.target === event.currentTarget) close();
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab' || !dialog) return;
    // Keep focus inside the dialog while it's open.
    const focusable = dialog.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  onMount(() => {
    previouslyFocused = document.activeElement;
    const target = dialog?.querySelector('[data-autofocus]') ?? dialog;
    target?.focus();
    return () => previouslyFocused?.focus?.();
  });
</script>

<svelte:window on:keydown={onKeydown} />

<!-- The backdrop closes on click; all keyboard control (Esc, focus trap) lives on
     the window handler above, so the dialog stays fully keyboard-accessible. -->
<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="backdrop" on:click={onBackdropClick}>
  <div
    class="dialog"
    role="dialog"
    aria-modal="true"
    aria-label={title}
    bind:this={dialog}
    tabindex="-1"
  >
    <header>
      <h2>{title}</h2>
      <button class="close" type="button" on:click={close} aria-label="Close">×</button>
    </header>
    <div class="body">
      <slot />
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(40, 28, 12, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    z-index: 50;
    animation: fade 0.15s ease;
  }
  .dialog {
    background: var(--surface);
    color: var(--ink);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    max-width: 32rem;
    width: 100%;
    max-height: 90vh;
    overflow: auto;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem 0.5rem;
  }
  h2 {
    font-size: 1.2rem;
  }
  .close {
    border: none;
    background: transparent;
    color: var(--ink-soft);
    font-size: 1.6rem;
    line-height: 1;
    padding: 0.2rem 0.5rem;
    border-radius: 8px;
  }
  .body {
    padding: 0.25rem 1.25rem 1.25rem;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
