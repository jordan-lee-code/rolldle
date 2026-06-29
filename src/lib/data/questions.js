// The authored pool of rounds. Each entry is one (region, canonical answer) with an
// optional pinned photo. The daily puzzle samples from this list deterministically
// (see daily.js) and draws a photo from the shared image pool for any question that
// doesn't pin its own.
//
// Adding a region is a one-liner. The smallest honest entry is a region and an answer:
//
//   roll({ region: 'Derby', answer: 'cob' })
//
// That question will show a roll from the pool and ask what they call it in Derby.
// Pin an `image` only when the specific bread matters, for a real stottie or a real bin
// lid, so the picture genuinely is that thing. Optional fields:
//   - prompt          overrides the auto "In <region>, what would you call this?"
//   - image / alt     a pinned photo in public/images and its description
//   - size            'small' | 'regular' | 'large' | 'huge' (see data/sizes.js), used
//                     with a pinned image so a big bread renders big
//   - elsewhere       the fond note revealed after answering
//   - alsoAcceptable  other names scored as correct where the region is honestly split
//
// Regional groundings come from the University of Manchester dialect maps
// (ourdialects.uk/maps/bread) and the YouGov survey on roll names. Pinned `image` paths
// are resolved through import.meta.env.BASE_URL at render time, so never hardcode a
// leading slash, or they break under the /rolldle/ subpath.
import { DEFAULT_SIZE } from './sizes.js';

function roll(entry) {
  if (!entry.region || !entry.answer) {
    throw new Error(`A roll needs at least a region and an answer: ${JSON.stringify(entry)}`);
  }
  const slug = entry.region.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    id: entry.id ?? `${slug}-${entry.answer}`,
    prompt: entry.prompt ?? `In ${entry.region}, what would you call this?`,
    elsewhere: entry.elsewhere ?? '',
    alsoAcceptable: entry.alsoAcceptable ?? [],
    // image / alt / size are left undefined unless pinned; the pool fills them in.
    size: entry.image ? (entry.size ?? DEFAULT_SIZE) : undefined,
    ...entry,
  };
}

export const QUESTIONS = [
  // Pinned: the specific bread is the point, so the photo really is one.
  roll({
    image: 'images/barm.jpg',
    alt: 'A soft, floury bread roll split and filled with a slice of black pudding, held in one hand',
    region: 'Bolton',
    answer: 'barm',
    size: 'regular',
    elsewhere:
      "A barm round here, short for barm cake, and a black pudding barm is breakfast sorted. Carry it to Newcastle and it becomes a stottie; over in Hull they'd call it a breadcake.",
  }),
  roll({
    image: 'images/stottie.jpg',
    alt: 'A large, flat, pale round of bread cut in half, sitting on a board',
    region: 'Newcastle',
    prompt: 'On Tyneside, what would you call this?',
    answer: 'stottie',
    size: 'huge',
    distinctive: true,
    elsewhere:
      "A stottie (or stotty cake) in the North East, flat and broad and traditionally big enough to share around. Almost nowhere else uses the word, which is rather the charm of it.",
  }),
  roll({
    image: 'images/binlid.jpg',
    alt: 'A large, round, floury-topped soft loaf-like roll on a wooden board',
    region: 'Liverpool',
    answer: 'binlid',
    size: 'large',
    distinctive: true,
    elsewhere:
      "A big flat one like this earns the name bin lid on Merseyside, for reasons the size makes obvious. An everyday one here is a batch, while just up the road in Bolton it's a barm.",
    alsoAcceptable: ['batch'],
  }),

  // Pooled: the name is just the local word for an ordinary roll, so any roll fits.
  roll({
    region: 'Nottingham',
    answer: 'cob',
    elsewhere:
      "Firmly a cob across the Midlands. Curiously, the Scottish Highlands say cob too, while most of the South would just shrug and say bread roll.",
  }),
  roll({
    region: 'Coventry',
    answer: 'batch',
    elsewhere:
      "A batch in Coventry, and oddly also in Liverpool, two little islands of the word with the rest of the country in between calling it something else entirely.",
  }),
  roll({
    region: 'Birmingham',
    answer: 'bap',
    elsewhere:
      "A bap across the West Midlands and into Staffordshire and North Wales. Soft, wide and forgiving, the bap is the diplomat of the bread basket.",
  }),
  roll({
    region: 'Leeds',
    answer: 'breadcake',
    elsewhere:
      "A breadcake in West Yorkshire and over in Hull. Cross the Pennines and you'll be handed a barm for the same thing.",
  }),
  roll({
    region: 'Kendal',
    prompt: 'In Cumbria, what would you call this?',
    answer: 'teacake',
    elsewhere:
      "A teacake through Cumbria and East Lancashire, with no currants in sight, which baffles the rest of the country where a teacake is the sweet, fruited one.",
  }),
  roll({
    region: 'Oldham',
    answer: 'muffin',
    elsewhere:
      "A muffin (an oven bottom muffin if you're being precise) around Oldham and Rochdale, one of the most tightly local words on the whole map.",
    alsoAcceptable: ['ovenbottom'],
  }),
  roll({
    region: 'London',
    answer: 'breadroll',
    elsewhere:
      "Plain old bread roll across the South East, the most common term in Britain overall, and the one most likely to keep the peace at a national level.",
    alsoAcceptable: ['roll'],
  }),
  roll({
    region: 'Glasgow',
    answer: 'roll',
    elsewhere:
      "Just a roll in Glasgow, the foundation of a proper roll and square sausage. Head north east toward Aberdeen and you'll meet its buttery cousin, the rowie.",
    alsoAcceptable: ['breadroll'],
  }),
];
