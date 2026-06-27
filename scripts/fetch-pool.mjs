// Builds the local image pool: a hundred or so bread-roll photos from Wikimedia
// Commons, gathered across many categories so they come from a wide spread of
// contributors. Open licences only. Images that are CC0 or public domain need no
// credit at all; for the rest we keep a full provenance manifest in the repo, so the
// app stays uncluttered while the attribution still exists honestly on disk.
//
// Openverse would add even more sources, but its API now sits behind a Cloudflare
// challenge that blocks automated use; a Pexels/Pixabay/Unsplash key would be the way
// to widen the net further.
//
// Usage: node scripts/fetch-pool.mjs [target-count]
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const UA = 'RolldleBot/0.1 (bread-roll naming game; jordan@lee-it.co.uk)';
const API = 'https://commons.wikimedia.org/w/api.php';
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const poolDir = join(root, 'public', 'images', 'pool');
const TARGET = Number(process.argv[2] ?? 100);

rmSync(poolDir, { recursive: true, force: true });
mkdirSync(poolDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s) => (s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// Categories chosen to surface bread rolls in their many forms and from many hands.
// We take a capped slice from each so no single category dominates the pool. Scene-
// heavy categories (sandwiches, barbecues, shopfronts) are deliberately left out.
const CATEGORIES = [
  'Bread rolls',
  'Buns (food)',
  'Baps',
  'Bridge rolls',
  'Kaiser rolls',
  'Submarine rolls',
  'Dinner rolls',
  'Bread rolls of Germany',
  'Bread rolls of the United Kingdom',
  'Bread rolls of Sweden',
  'Brötchen',
  'Semmel',
  'Soft white bread',
  'Poppy seed rolls',
  'Sesame seed rolls',
  'Pretzel rolls',
  'Milk rolls',
  'Stottie cake',
  'Barm cakes',
];
const SEARCHES = [
  'bread roll plate',
  'floury bap bread',
  'crusty bread roll',
  'soft dinner roll',
  'seeded bread roll',
  'white bread bun',
  'bread roll bakery',
  'round bread roll',
  'kaiser roll bread',
  'pretzel roll bread',
  'sourdough bread roll',
  'wholemeal bread roll',
  'poppy seed roll bread',
  'sesame seed roll bread',
  'brioche bun bread',
  'ciabatta roll bread',
  'milk roll bread',
  'rustic bread roll',
];
const PER_CATEGORY = 20;

// Crude but cheap title filtering: keep things that read as a roll, drop obvious
// scene photos (a barbecue, a market stall, a shopfront) that categories drag in.
const MUST_MATCH = /(roll|bun|bap|br[oö]tchen|semmel|cob|barm|stott|teacake|bread)/i;
const MUST_NOT = /(grill|barbecue|bbq|market|stall|shop|store|buffet|sandwich|burger|hot dog|hotdog|factory|production|machine|vending|sign|menu|street|restaurant|cafe|plate of food|breakfast table)/i;
const titleOk = (title) => {
  const t = title.replace(/^File:/, '').replace(/\.[^.]+$/, '');
  return MUST_MATCH.test(t) && !MUST_NOT.test(t);
};

const NO_CREDIT = /^(cc0|public domain|pd|cc-pd)/i;
const OK_LICENCE = /^(cc0|cc-by|cc by|pd|public domain)/i;

async function categoryMembers(cat, limit) {
  const url = new URL(API);
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'categorymembers',
    cmtitle: `Category:${cat}`,
    cmtype: 'file',
    cmlimit: String(limit),
  });
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const data = await res.json();
  return (data?.query?.categorymembers ?? []).map((m) => m.title);
}

async function searchTitles(term, limit) {
  const url = new URL(API);
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    list: 'search',
    srsearch: `filetype:bitmap ${term}`,
    srnamespace: '6',
    srlimit: String(limit),
  });
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const data = await res.json();
  return (data?.query?.search ?? []).map((m) => m.title);
}

async function imageinfo(titles) {
  const url = new URL(API);
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: titles.join('|'),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: '800',
  });
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const data = await res.json();
  return Object.values(data?.query?.pages ?? {});
}

async function download(url, path) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) }).catch(
      () => null,
    );
    if (res?.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 6000) throw new Error('too small');
      writeFileSync(path, buf);
      return buf.length;
    }
    if (res?.status === 429) {
      await sleep(2500 * (attempt + 1));
      continue;
    }
    if (attempt === 3) throw new Error(`status ${res?.status ?? 'network'}`);
    await sleep(800);
  }
}

// Gather candidate titles, capped per category, deduped and title-filtered.
const titles = new Set();
for (const cat of CATEGORIES) {
  try {
    const members = (await categoryMembers(cat, PER_CATEGORY)).filter(titleOk);
    members.forEach((t) => titles.add(t));
    console.log(`  cat ${cat}: +${members.length}`);
  } catch (err) {
    console.log(`! category ${cat}: ${err.message}`);
  }
  await sleep(400);
}
for (const term of SEARCHES) {
  try {
    const found = (await searchTitles(term, 25)).filter(titleOk);
    found.forEach((t) => titles.add(t));
    console.log(`  search ${term}: +${found.length}`);
  } catch (err) {
    console.log(`! search ${term}: ${err.message}`);
  }
  await sleep(400);
}
const titleList = [...titles];
console.log(`gathered ${titleList.length} unique file titles after filtering`);

const pool = [];
const manifest = [];
let creditFree = 0;

outer: for (let i = 0; i < titleList.length; i += 20) {
  const pages = await imageinfo(titleList.slice(i, i + 20));
  for (const page of pages) {
    if (pool.length >= TARGET) break outer;
    const info = page.imageinfo?.[0];
    if (!info) continue;
    if (!/^image\/(jpeg|png)$/.test(info.mime ?? '')) continue;
    const meta = info.extmetadata ?? {};
    const licence = strip(meta.LicenseShortName?.value) || 'unknown';
    if (!OK_LICENCE.test(licence)) continue;

    const file = `${String(pool.length).padStart(3, '0')}.${info.mime === 'image/png' ? 'png' : 'jpg'}`;
    try {
      await download(info.thumburl, join(poolDir, file));
    } catch (err) {
      console.log(`! ${page.title}: ${err.message}`);
      continue;
    }
    const noCredit = NO_CREDIT.test(licence);
    if (noCredit) creditFree++;
    const alt = strip(meta.ObjectName?.value) || page.title.replace(/^File:/, '').replace(/\.[^.]+$/, '');
    pool.push({ file: `images/pool/${file}`, alt });
    manifest.push({
      file,
      title: page.title,
      pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
      author: strip(meta.Artist?.value) || 'Unknown',
      licence,
      licenceUrl: meta.LicenseUrl?.value ?? '',
      creditRequired: !noCredit,
    });
    console.log(`✓ ${file}  [${licence}]${noCredit ? '' : '  (credit kept)'}`);
    await sleep(700);
  }
}

const poolJs =
  '// Generated by scripts/fetch-pool.mjs — the local image pool the daily puzzle draws\n' +
  '// from. Provenance for every image is in public/images/pool/manifest.json. Most are\n' +
  '// CC0 / public domain; any that require credit are flagged there. Re-run to refresh.\n' +
  `export const POOL = ${JSON.stringify(pool, null, 2)};\n`;
writeFileSync(join(root, 'src', 'lib', 'data', 'pool.js'), poolJs);
writeFileSync(join(poolDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\n${pool.length} images saved (${creditFree} need no credit, ${pool.length - creditFree} credited in manifest).`);
