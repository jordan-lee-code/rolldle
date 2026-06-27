import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// base is the repo name so the built site works at https://<user>.github.io/rolldle/.
// Set this to '/' if you later serve rolldle from the root of a custom domain.
export default defineConfig({
  plugins: [svelte()],
  base: '/rolldle/',
});
