// Sources candidate roll photos from Wikimedia Commons, where every file carries a
// known open licence and a named author we can credit. It downloads thumbnails into a
// staging folder along with a manifest of attributions, so the photos can be eyeballed
// and chosen before any are wired into the game. Nothing here is committed blindly:
// the point is real photos with honest provenance.
//
// Usage: node scripts/source-images.mjs <staging-dir>
import { mkdirSync, writeFileSync } from 'node:fs';

const UA = 'RolldleBot/0.1 (bread-roll naming game; jordan@lee-it.co.uk)';
const API = 'https://commons.wikimedia.org/w/api.php';
const outDir = process.argv[2];
if (!outDir) throw new Error('pass a staging directory');
mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Categories give curated, correctly-identified images; searches catch the rest.
const CATEGORIES = [
  'Baps',
  'Bread rolls',
  'Stottie cake',
  'Barm cakes',
  'Buns (food)',
  'Kaiser rolls',
];
const SEARCHES = [
  ['cob bread roll', 4],
  ['crusty white bread roll', 4],
  ['soft white bread roll plate', 4],
  ['dinner roll bread', 3],
  ['Yorkshire breadcake', 3],
  ['oven bottom muffin bread', 3],
];

const stripHtml = (s) => (s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 52);

const OK_LICENCE = /^(cc0|cc-by|cc by|pd|public domain|cc-pd)/i;

async function imageinfoFor(titles) {
  if (titles.length === 0) return [];
  const url = new URL(API);
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    titles: titles.join('|'),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: '900',
  });
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const data = await res.json();
  return Object.values(data?.query?.pages ?? {});
}

async function categoryMembers(cat, limit = 12) {
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

async function download(url, path) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(path, buf);
      return buf.length;
    }
    if (res.status === 429) {
      await sleep(2500 * (attempt + 1)); // back off and retry
      continue;
    }
    throw new Error(`status ${res.status}`);
  }
  throw new Error('rate-limited after retries');
}

// Gather a deduped set of file titles, tagged with where they came from.
const titleSource = new Map();
for (const cat of CATEGORIES) {
  try {
    for (const t of await categoryMembers(cat)) if (!titleSource.has(t)) titleSource.set(t, cat);
  } catch (err) {
    console.log(`! category ${cat}: ${err.message}`);
  }
  await sleep(400);
}
for (const [term, limit] of SEARCHES) {
  try {
    for (const t of await searchTitles(term, limit)) if (!titleSource.has(t)) titleSource.set(t, term);
  } catch (err) {
    console.log(`! search ${term}: ${err.message}`);
  }
  await sleep(400);
}

const titles = [...titleSource.keys()];
console.log(`gathered ${titles.length} unique file titles`);

const manifest = [];
// imageinfo in batches of 25
for (let i = 0; i < titles.length; i += 25) {
  const pages = await imageinfoFor(titles.slice(i, i + 25));
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const meta = info.extmetadata ?? {};
    const licence = stripHtml(meta.LicenseShortName?.value) || 'unknown';
    if (!OK_LICENCE.test(licence)) continue;
    if (!/^image\/(jpeg|png)$/.test(info.mime ?? '')) continue;

    const ext = info.mime === 'image/png' ? 'png' : 'jpg';
    const slug = `${slugify(page.title.replace(/^File:/, ''))}.${ext}`;
    try {
      const bytes = await download(info.thumburl, `${outDir}/${slug}`);
      manifest.push({
        file: slug,
        source: titleSource.get(page.title) ?? '',
        title: page.title,
        pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
        author: stripHtml(meta.Artist?.value) || 'Unknown',
        licence,
        licenceUrl: meta.LicenseUrl?.value ?? '',
        description: stripHtml(meta.ImageDescription?.value).slice(0, 160),
        bytes,
      });
      console.log(`✓ ${slug}  [${licence}]  <- ${titleSource.get(page.title)}`);
    } catch (err) {
      console.log(`! ${page.title}: ${err.message}`);
    }
    await sleep(1100); // be gentle, avoid 429
  }
}

writeFileSync(`${outDir}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`\n${manifest.length} candidates saved to ${outDir}`);
