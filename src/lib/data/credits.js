// Attribution for the handful of pinned, verified photos shown for specific breads
// (a real barm, a real stottie, a real bin lid). These are featured prominently, so we
// name the photographers in the app's About panel.
//
// The wider image pool lives in public/images/pool/, and its full provenance is in
// public/images/pool/manifest.json. Those images are mostly CC0 / public domain and
// need no credit; any that do are flagged in that manifest.
export const CREDITS = {
  'barm.jpg': {
    title: 'Barm cake with black pudding',
    author: 'Wendy Mann',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Barm_cake_with_black_pudding.jpg',
  },
  'stottie.jpg': {
    title: 'Stotty cake',
    author: 'Mariegriffiths',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Stotty1.JPG',
  },
  'binlid.jpg': {
    title: 'Belfast bap',
    author: '159753 (Wikimedia Commons)',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Belfast_Bap.jpg',
  },
};

export function creditFor(filename) {
  return CREDITS[filename] ?? null;
}
