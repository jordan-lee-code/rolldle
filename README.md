# Rolldle

A small daily game about the many British names for a bread roll. You're shown a
roll and told where in the country you're standing, and you pick the name a local
would actually use. A barm in Bolton is a batch in Coventry is a stottie on Tyneside,
and the gentle argument about which is right is the whole point.

Everyone playing on a given day gets the same five rolls, deterministically chosen
from the date, so you can share a row of squares without spoiling anyone's go. There
is no backend; it's a static site built with Vite and Svelte.

## Running it locally

```
npm install
npm run dev                       # play through it on the printed localhost URL
npm run build && npm run preview  # check the production build and the /rolldle/ base path
```

## Adding a region

This is genuinely a one-liner. Add an entry to `src/lib/data/questions.js` using the
`roll()` helper; the smallest honest entry is a region and the answer:

```js
roll({ region: 'Derby', answer: 'cob' })
```

That round will show a roll from the shared image pool and ask what they call it in
Derby. The prompt is filled in for you, and the four multiple-choice options are
generated automatically from the wider list of names, so you never invent wrong
answers. Worth adding when they earn their place:

- `elsewhere` — the fond note revealed after the guess.
- `alsoAcceptable: ['roll']` — other names scored as correct where a region is honestly
  split, so a local is never punished for being right.
- `image` / `alt` / `size` — pin a specific photo only when the bread itself matters (a
  real stottie, a real bin lid). Drop the file into `public/images/`, and use `size`
  (`small` | `regular` | `large` | `huge`, see `src/lib/data/sizes.js`) so a big bread
  renders big. Pinned photos that need crediting go in `src/lib/data/credits.js`.

The answer must be one of the keys in `src/lib/data/names.js`; add a new name there if
you need one. That single list is also where the distractors come from, so adding a
name quietly enriches every round.

## The image pool

Most rounds draw their photo from a local asset store in `public/images/pool/` — about
a hundred roll photos, listed in `src/lib/data/pool.js`. Because the regional names are
just local words for an ordinary roll, any roll photo is an honest fit, so the daily
puzzle pairs a pool image with each region deterministically. A handful of breads where
the shape genuinely matters (a real stottie, a real bin lid) pin their own verified
photo in `public/images/` instead.

The pool is built by `scripts/fetch-pool.mjs`, which gathers images from across many
Wikimedia Commons categories and contributors under open licences, filters out scene
photos, and writes full provenance to `public/images/pool/manifest.json`. Most images
are CC0 or public domain and need no attribution; any that do are flagged in that
manifest, so the credit lives with the code while the game itself stays uncluttered.
Re-run it any time to refresh or grow the pool:

```
node scripts/fetch-pool.mjs 100
```

A couple of honest limits worth knowing. Openverse would widen the sources further, but
its API now sits behind a Cloudflare challenge that blocks automated use; a Pexels,
Pixabay, or Unsplash API key would be the way to pull uniform, attribution-free studio
photos at scale. And when you pin a photo to a specific bread, the identification has to
be true: if it's labelled a stottie or a bin lid, it needs to genuinely be one. Filled
rolls are fine, as long as the roll itself is the right thing.

## Deploying to GitHub Pages

The repo ships with `.github/workflows/deploy.yml`, which builds on every push to
`main` and publishes to Pages. In the repository settings, set Pages → Source to
"GitHub Actions" once, and it looks after itself from there.

The site lives at its own domain, **rolldle.co.uk**, served from the root, so `base`
in `vite.config.js` is `/`. The custom domain is pinned two ways so a deploy never
drops it: the `public/CNAME` file (which ends up in the build output) and the repo's
Pages settings. The empty `public/.nojekyll` file stops Pages running Jekyll over the
built output.

The domain needs DNS records at the registrar: four `A` records for the apex pointing
at GitHub Pages (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
`185.199.111.153`), the matching `AAAA` records (`2606:50c0:8000::153` through
`...8003::153`), and a `CNAME` on `www` pointing to `jordan-lee-code.github.io`.
