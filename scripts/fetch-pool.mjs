// Builds the local image pool: bread-roll photos from Wikimedia Commons, gathered
// across many categories, languages and searches so they come from a wide spread of
// contributors. Open licences only. CC0 and public-domain images need no attribution;
// for the rest we keep full provenance in public/images/pool/manifest.json.
//
// This casts a deliberately wide net and downloads more than the target, because a
// visual review afterwards prunes anything that isn't a genuine photograph of a roll
// (scenes, paintings, machinery, sliced-bread sandwiches). Title filtering here only
// trims the obvious noise; eyes do the rest.
//
// Usage: node scripts/fetch-pool.mjs [download-target]
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const UA = 'RolldleBot/0.1 (bread-roll naming game; jordan@lee-it.co.uk)';
const API = 'https://commons.wikimedia.org/w/api.php';
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const poolDir = join(root, 'public', 'images', 'pool');
const TARGET = Number(process.argv[2] ?? 380);

rmSync(poolDir, { recursive: true, force: true });
mkdirSync(poolDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s) => (s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

// Categories spanning the roll's many regional and national forms.
const CATEGORIES = [
  'Bread rolls',
  'Buns (food)',
  'Baps',
  'Bridge rolls',
  'Kaiser rolls',
  'Submarine rolls',
  'Dinner rolls',
  'Soft white bread',
  'Poppy seed rolls',
  'Sesame seed rolls',
  'Milk rolls',
  'Stottie cake',
  'Barm cakes',
  'Brötchen',
  'Semmel',
  'Schrippe',
  'Bread rolls of Germany',
  'Bread rolls of Austria',
  'Bread rolls of Switzerland',
  'Bread rolls of Sweden',
  'Bread rolls of Denmark',
  'Bread rolls of Finland',
  'Bread rolls of Poland',
  'Bread rolls of the United Kingdom',
  'Bread rolls of the United States',
  'Hard rolls',
  'Wholemeal bread rolls',
  'Rye bread rolls',
  'Pretzel rolls',
  'Hot dog buns',
  'Hamburger buns',
  'Burger buns',
  'Filled rolls',
  'Crusty rolls',
];
const PER_CATEGORY = 40;

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
  'milk roll bread',
  'rustic bread roll',
  'crusty white roll',
  'soft floury roll',
  'bread bun close up',
  'morning roll scotland',
  'bap filled roll',
  'sub roll bread',
  'ciabatta roll',
  'wheat dinner roll',
  'bakery bread roll fresh',
];
const PER_SEARCH = 60;

// Keep things that read as a roll; drop obvious scenes and non-photographs early.
const MUST_MATCH = /(roll|bun|bap|br[oö]tchen|semmel|schrippe|weck|cob|barm|stott|teacake|bread)/i;
const MUST_NOT =
  /(boat|ship|submarine|warship|navy|aircraft|plane|train|car\b|vehicle|building|factory|machine|parking|ticket|concert|band|festival|cosplay|costume|portrait|landscape|street|shop|store|market|stall|museum|\bmap\b|sign|menu|logo|diagram|chart|painting|illustration|drawing|sketch|still life|still-life|engraving|woodcut|child|children|crowd|people|woman|\bman\b|portrait|statue|coat of arms)/i;
const titleOk = (title) => {
  const t = title.replace(/^File:/, '').replace(/\.[^.]+$/, '');
  return MUST_MATCH.test(t) && !MUST_NOT.test(t);
};

async function apiGet(params) {
  const url = new URL(API);
  url.search = new URLSearchParams({ format: 'json', ...params });
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`api ${res.status}`);
  return res.json();
}

async function categoryMembers(cat, cap) {
  const titles = [];
  let cmcontinue;
  do {
    const data = await apiGet({
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${cat}`,
      cmtype: 'file',
      cmlimit: '50',
      ...(cmcontinue ? { cmcontinue } : {}),
    });
    for (const m of data?.query?.categorymembers ?? []) titles.push(m.title);
    cmcontinue = data?.continue?.cmcontinue;
    await sleep(250);
  } while (cmcontinue && titles.length < cap);
  return titles.slice(0, cap);
}

async function searchTitles(term, cap) {
  const titles = [];
  let offset = 0;
  while (titles.length < cap) {
    const data = await apiGet({
      action: 'query',
      list: 'search',
      srsearch: `filetype:bitmap ${term}`,
      srnamespace: '6',
      srlimit: '50',
      sroffset: String(offset),
    });
    const hits = data?.query?.search ?? [];
    for (const m of hits) titles.push(m.title);
    if (!data?.continue?.sroffset) break;
    offset = data.continue.sroffset;
    await sleep(250);
  }
  return titles.slice(0, cap);
}

async function imageinfo(titles) {
  const data = await apiGet({
    action: 'query',
    titles: titles.join('|'),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: '800',
  });
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

const NO_CREDIT = /^(cc0|public domain|pd|cc-pd)/i;
const OK_LICENCE = /^(cc0|cc-by|cc by|pd|public domain)/i;

// Gather candidate titles.
const titles = new Set();
for (const cat of CATEGORIES) {
  try {
    const members = (await categoryMembers(cat, PER_CATEGORY)).filter(titleOk);
    members.forEach((t) => titles.add(t));
    console.log(`  cat ${cat}: +${members.length} (total ${titles.size})`);
  } catch (err) {
    console.log(`! category ${cat}: ${err.message}`);
  }
}
for (const term of SEARCHES) {
  try {
    const found = (await searchTitles(term, PER_SEARCH)).filter(titleOk);
    found.forEach((t) => titles.add(t));
    console.log(`  search ${term}: +${found.length} (total ${titles.size})`);
  } catch (err) {
    console.log(`! search ${term}: ${err.message}`);
  }
}
const titleList = [...titles];
console.log(`gathered ${titleList.length} unique candidate titles after title filter`);

const pool = [];
const manifest = [];
let creditFree = 0;

outer: for (let i = 0; i < titleList.length; i += 25) {
  let pages;
  try {
    pages = await imageinfo(titleList.slice(i, i + 25));
  } catch (err) {
    console.log(`! imageinfo batch ${i}: ${err.message}`);
    continue;
  }
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
    if (pool.length % 25 === 0) console.log(`  downloaded ${pool.length}/${TARGET}`);
    await sleep(650);
  }
}

const poolJs =
  '// Generated by scripts/fetch-pool.mjs, then pruned of non-roll images and paintings\n' +
  '// after a visual review. The local image pool the daily puzzle draws from. Provenance\n' +
  '// is in public/images/pool/manifest.json. Most images are CC0 / public domain.\n' +
  `export const POOL = ${JSON.stringify(pool, null, 2)};\n`;
writeFileSync(join(root, 'src', 'lib', 'data', 'pool.js'), poolJs);
writeFileSync(join(poolDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\n${pool.length} images downloaded (${creditFree} need no credit). Now compress and review.`);
