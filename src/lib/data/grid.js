// The grid puzzle: sixteen British places, four to a group, each group being the
// places that reach for the same name for a bread roll. It's a Connections-style aside
// rather than part of the daily, and the regional groupings come from the same dialect
// maps as the rest of the game. They're drawn confidently but kept humble in the reveal,
// because the edges of these regions are exactly where the friendly arguments live.
//
// One curated board for now. If more groups are authored later, a weekly rotation could
// pick four at a time; until then it's an always-open bonus rather than a pretend weekly.
export const GRID_GROUPS = [
  {
    key: 'barm',
    name: 'Barm',
    region: 'the North West',
    places: ['Bolton', 'Manchester', 'Wigan', 'Bury'],
  },
  {
    key: 'cob',
    name: 'Cob',
    region: 'the East Midlands',
    places: ['Nottingham', 'Derby', 'Leicester', 'Lincoln'],
  },
  {
    key: 'breadcake',
    name: 'Breadcake',
    region: 'Yorkshire',
    places: ['Leeds', 'Bradford', 'Wakefield', 'Hull'],
  },
  {
    key: 'breadroll',
    name: 'Bread roll',
    region: 'the South East',
    places: ['London', 'Brighton', 'Reading', 'Guildford'],
  },
];

export const GRID_PLACES = GRID_GROUPS.flatMap((g) => g.places);

// Place -> the index of its group, for colouring tiles and scoring a guess.
export const GROUP_OF = Object.fromEntries(
  GRID_GROUPS.flatMap((g, i) => g.places.map((p) => [p, i])),
);
