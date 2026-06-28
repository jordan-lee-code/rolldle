import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Served from the root of its own custom domain (rolldle.co.uk), so the base is '/'.
// The domain is pinned by public/CNAME and by the repo's Pages settings. If you ever
// serve it back under a subpath (e.g. <user>.github.io/rolldle/), set base to '/rolldle/'.
export default defineConfig({
  plugins: [svelte()],
  base: '/',
});
