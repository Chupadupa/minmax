// ── Solar System Bodies ──────────────────────────────────────────────────────
//
// Facts for the Sun, the planets, the dwarf planets and their best-known moons.
// Pure data and helpers, no React. Everything the toy *says* about a body lives
// here; what a body *looks like* lives in bodyLooks.js, and where it sits on
// the map in layout.js.
//
// Fields:
//   id         unique key (also the key for its look in bodyLooks.js)
//   name       display name
//   kind       "star" | "planet" | "dwarf" | "moon"
//   parent     id of what it goes round (null for the Sun)
//   radiusKm   mean radius
//   orbitKm    mean distance from its parent (semi-major axis)
//   orbitDays  one trip round its parent, in Earth days
//   dayHours   one spin, in hours (null when nobody knows yet)
//   tempC      average surface temperature, where known
//   moonCount  known moons (planets and dwarf planets only), as of MOONS_AS_OF
//   region     dwarf planets: "asteroid" | "kuiper" | "scattered"
//   candidate  dwarf planets most astronomers count but the IAU hasn't listed
//   fact       one fun sentence
//
// Sources: NASA planetary fact sheets; moon counts from the IAU Minor Planet
// Center (March 2026 announcement). Candidate dwarf planets have rougher numbers.

export const MOONS_AS_OF = "March 2026";
export const AU_KM = 149_597_870.7;
export const EARTH_RADIUS_KM = 6371;

const SUN = {
  id: "sun", name: "The Sun", kind: "star", parent: null,
  radiusKm: 695_700, dayHours: 601, tempC: 5500, moonCount: 0,
  fact: "The Sun is a star — a giant ball of glowing gas. More than a million Earths would fit inside it!",
};

const PLANETS = [
  {
    id: "mercury", name: "Mercury", kind: "planet", parent: "sun",
    radiusKm: 2439.7, orbitKm: 57_909_000, orbitDays: 87.97, dayHours: 1407.6, tempC: 167, moonCount: 0,
    fact: "Mercury is the smallest planet and the closest to the Sun. It whizzes all the way round the Sun in just 88 days!",
  },
  {
    id: "venus", name: "Venus", kind: "planet", parent: "sun",
    radiusKm: 6051.8, orbitKm: 108_209_000, orbitDays: 224.7, dayHours: 5832.5, tempC: 464, moonCount: 0,
    fact: "Venus is the hottest planet — hotter than an oven! It spins backwards, and one day on Venus lasts longer than its whole year.",
  },
  {
    id: "earth", name: "Earth", kind: "planet", parent: "sun",
    radiusKm: 6371, orbitKm: 149_598_000, orbitDays: 365.25, dayHours: 23.93, tempC: 15, moonCount: 1,
    fact: "Our home! Earth is the only place we know of with living things, and the only planet with oceans of liquid water.",
  },
  {
    id: "mars", name: "Mars", kind: "planet", parent: "sun",
    radiusKm: 3389.5, orbitKm: 227_939_000, orbitDays: 687, dayHours: 24.62, tempC: -65, moonCount: 2,
    fact: "The Red Planet is red because its soil is rusty. It has the tallest volcano in the Solar System, Olympus Mons — three times higher than Mount Everest.",
  },
  {
    id: "jupiter", name: "Jupiter", kind: "planet", parent: "sun",
    radiusKm: 69_911, orbitKm: 778_479_000, orbitDays: 4332.6, dayHours: 9.93, tempC: -110, moonCount: 101,
    fact: "Jupiter is the biggest planet — all the other planets would fit inside it! The Great Red Spot is a storm bigger than Earth that has been blowing for hundreds of years.",
  },
  {
    id: "saturn", name: "Saturn", kind: "planet", parent: "sun",
    radiusKm: 58_232, orbitKm: 1_432_041_000, orbitDays: 10_759, dayHours: 10.66, tempC: -140, moonCount: 285,
    fact: "Saturn's rings are made of billions of pieces of ice and rock. Saturn is so light that it would float in a bathtub — if you could find one big enough!",
  },
  {
    id: "uranus", name: "Uranus", kind: "planet", parent: "sun",
    radiusKm: 25_362, orbitKm: 2_867_043_000, orbitDays: 30_687, dayHours: 17.24, tempC: -195, moonCount: 28,
    fact: "Uranus spins on its side, so it rolls round the Sun like a ball. It is the coldest planet of all.",
  },
  {
    id: "neptune", name: "Neptune", kind: "planet", parent: "sun",
    radiusKm: 24_622, orbitKm: 4_514_953_000, orbitDays: 60_190, dayHours: 16.11, tempC: -200, moonCount: 16,
    fact: "Neptune has the fastest winds in the Solar System — over 2,000 km an hour! It takes 165 years to go round the Sun just once.",
  },
];

const DWARF_PLANETS = [
  {
    id: "ceres", name: "Ceres", kind: "dwarf", parent: "sun", region: "asteroid",
    radiusKm: 469.7, orbitKm: 413_690_000, orbitDays: 1680, dayHours: 9.07, tempC: -105, moonCount: 0,
    fact: "Ceres is the biggest thing in the asteroid belt. It has bright white spots of salt shining inside one of its craters.",
  },
  {
    id: "orcus", name: "Orcus", kind: "dwarf", parent: "sun", region: "kuiper", candidate: true,
    radiusKm: 455, orbitKm: 5_896_000_000, orbitDays: 89_900, dayHours: null, tempC: -230, moonCount: 1,
    fact: "Orcus is nicknamed the anti-Pluto — it has an orbit just like Pluto's, but it is always on the opposite side of the Sun.",
  },
  {
    id: "pluto", name: "Pluto", kind: "dwarf", parent: "sun", region: "kuiper",
    radiusKm: 1188.3, orbitKm: 5_906_440_000, orbitDays: 90_560, dayHours: 153.3, tempC: -229, moonCount: 5,
    fact: "Pluto was called the ninth planet until 2006. It has a big white heart on its surface, made of frozen nitrogen.",
  },
  {
    id: "haumea", name: "Haumea", kind: "dwarf", parent: "sun", region: "kuiper",
    radiusKm: 780, orbitKm: 6_452_000_000, orbitDays: 103_400, dayHours: 3.92, tempC: -241, moonCount: 2,
    fact: "Haumea spins so fast — once every 4 hours — that it has been stretched into an egg shape, about 2,000 km long but only 1,000 km thick. It even has a ring!",
  },
  {
    id: "quaoar", name: "Quaoar", kind: "dwarf", parent: "sun", region: "kuiper", candidate: true,
    radiusKm: 555, orbitKm: 6_537_000_000, orbitDays: 105_500, dayHours: 17.7, tempC: -230, moonCount: 1,
    fact: "Quaoar has two thin rings — much further out from it than anyone thought rings could be.",
  },
  {
    id: "makemake", name: "Makemake", kind: "dwarf", parent: "sun", region: "kuiper",
    radiusKm: 715, orbitKm: 6_847_000_000, orbitDays: 111_800, dayHours: 22.8, tempC: -239, moonCount: 1,
    fact: "Makemake is reddish-brown and covered in frozen methane. It is named after the creator god of the people of Easter Island.",
  },
  {
    id: "gonggong", name: "Gonggong", kind: "dwarf", parent: "sun", region: "scattered", candidate: true,
    radiusKm: 615, orbitKm: 10_070_000_000, orbitDays: 202_500, dayHours: 22.4, tempC: -243, moonCount: 1,
    fact: "Gonggong is named after a Chinese water god with a red face. Its name was chosen by a public vote in 2019.",
  },
  {
    id: "eris", name: "Eris", kind: "dwarf", parent: "sun", region: "scattered",
    radiusKm: 1163, orbitKm: 10_125_000_000, orbitDays: 204_200, dayHours: 378, tempC: -231, moonCount: 1,
    fact: "Eris is almost as big as Pluto but heavier. Finding it is what made astronomers invent the words “dwarf planet”!",
  },
  {
    id: "sedna", name: "Sedna", kind: "dwarf", parent: "sun", region: "scattered", candidate: true,
    radiusKm: 500, orbitKm: 75_700_000_000, orbitDays: 4_160_000, dayHours: 10.3, tempC: -240, moonCount: 0,
    fact: "Sedna is so far away that one trip round the Sun takes more than 11,000 years! It is one of the reddest things in the Solar System.",
  },
];

const MOONS = [
  // Earth
  {
    id: "moon", name: "The Moon", kind: "moon", parent: "earth",
    radiusKm: 1737.4, orbitKm: 384_400, orbitDays: 27.32, tempC: -20,
    fact: "The Moon is the only other world people have walked on. It is slowly drifting away from Earth — about 4 cm every year.",
  },
  // Mars
  {
    id: "phobos", name: "Phobos", kind: "moon", parent: "mars",
    radiusKm: 11.1, orbitKm: 9376, orbitDays: 0.319,
    fact: "Phobos zooms round Mars three times a day! It is slowly spiralling inwards and will one day break apart into a ring.",
  },
  {
    id: "deimos", name: "Deimos", kind: "moon", parent: "mars",
    radiusKm: 6.2, orbitKm: 23_460, orbitDays: 1.263,
    fact: "Deimos is tiny — only about 12 km across. From Mars it would look like a bright star in the sky.",
  },
  // Jupiter
  {
    id: "amalthea", name: "Amalthea", kind: "moon", parent: "jupiter",
    radiusKm: 83.5, orbitKm: 181_366, orbitDays: 0.498,
    fact: "Amalthea is a potato-shaped moon, and the reddest thing in the whole Solar System.",
  },
  {
    id: "io", name: "Io", kind: "moon", parent: "jupiter",
    radiusKm: 1821.6, orbitKm: 421_700, orbitDays: 1.769, tempC: -143,
    fact: "Io has hundreds of volcanoes — more than anywhere else in the Solar System. Its lava fountains shoot hundreds of km high.",
  },
  {
    id: "europa", name: "Europa", kind: "moon", parent: "jupiter",
    radiusKm: 1560.8, orbitKm: 671_034, orbitDays: 3.551, tempC: -160,
    fact: "Under Europa's cracked icy shell is a salty ocean with more water than all of Earth's oceans put together.",
  },
  {
    id: "ganymede", name: "Ganymede", kind: "moon", parent: "jupiter",
    radiusKm: 2634.1, orbitKm: 1_070_412, orbitDays: 7.155, tempC: -163,
    fact: "Ganymede is the biggest moon in the Solar System — it is even bigger than the planet Mercury!",
  },
  {
    id: "callisto", name: "Callisto", kind: "moon", parent: "jupiter",
    radiusKm: 2410.3, orbitKm: 1_882_709, orbitDays: 16.69, tempC: -139,
    fact: "Callisto is the most cratered world we know of. Its surface has hardly changed in 4 billion years.",
  },
  {
    id: "himalia", name: "Himalia", kind: "moon", parent: "jupiter",
    radiusKm: 85, orbitKm: 11_460_000, orbitDays: 250.6,
    fact: "Himalia is the biggest of Jupiter's many small, far-off moons — the rest are only a few km across.",
  },
  // Saturn
  {
    id: "mimas", name: "Mimas", kind: "moon", parent: "saturn",
    radiusKm: 198.2, orbitKm: 185_539, orbitDays: 0.942,
    fact: "Mimas has a crater so huge that it makes the whole moon look like the Death Star from Star Wars.",
  },
  {
    id: "enceladus", name: "Enceladus", kind: "moon", parent: "saturn",
    radiusKm: 252.1, orbitKm: 237_948, orbitDays: 1.37, tempC: -198,
    fact: "Enceladus shoots jets of water into space from cracks near its south pole. It is the shiniest world in the Solar System.",
  },
  {
    id: "tethys", name: "Tethys", kind: "moon", parent: "saturn",
    radiusKm: 531.1, orbitKm: 294_619, orbitDays: 1.888,
    fact: "Tethys is made almost entirely of ice. A giant canyon stretches three-quarters of the way round it.",
  },
  {
    id: "dione", name: "Dione", kind: "moon", parent: "saturn",
    radiusKm: 561.4, orbitKm: 377_396, orbitDays: 2.737,
    fact: "Dione has bright wispy streaks on one side — they are enormous cliffs of ice.",
  },
  {
    id: "rhea", name: "Rhea", kind: "moon", parent: "saturn",
    radiusKm: 763.8, orbitKm: 527_108, orbitDays: 4.518,
    fact: "Rhea is Saturn's second-biggest moon: a cold ball of ice covered in craters.",
  },
  {
    id: "titan", name: "Titan", kind: "moon", parent: "saturn",
    radiusKm: 2574.7, orbitKm: 1_221_870, orbitDays: 15.945, tempC: -179,
    fact: "Titan is the only moon with a thick atmosphere. It has rivers and lakes — but they are full of liquid methane, not water.",
  },
  {
    id: "hyperion", name: "Hyperion", kind: "moon", parent: "saturn",
    radiusKm: 135, orbitKm: 1_481_010, orbitDays: 21.28,
    fact: "Hyperion looks like a sponge and tumbles about as it orbits — nobody can predict which way it will be facing.",
  },
  {
    id: "iapetus", name: "Iapetus", kind: "moon", parent: "saturn",
    radiusKm: 734.5, orbitKm: 3_560_820, orbitDays: 79.32,
    fact: "Iapetus is two-toned: one side is bright white and the other is as dark as coal.",
  },
  {
    id: "phoebe", name: "Phoebe", kind: "moon", parent: "saturn",
    radiusKm: 106.5, orbitKm: 12_929_400, orbitDays: 550.6,
    fact: "Phoebe goes round Saturn backwards. It was probably captured from the Kuiper belt long ago.",
  },
  // Uranus
  {
    id: "puck", name: "Puck", kind: "moon", parent: "uranus",
    radiusKm: 81, orbitKm: 86_004, orbitDays: 0.762,
    fact: "Puck is named after the mischievous fairy in Shakespeare's play A Midsummer Night's Dream.",
  },
  {
    id: "miranda", name: "Miranda", kind: "moon", parent: "uranus",
    radiusKm: 235.8, orbitKm: 129_390, orbitDays: 1.413,
    fact: "Miranda has the tallest cliff in the Solar System, Verona Rupes — about 20 km high!",
  },
  {
    id: "ariel", name: "Ariel", kind: "moon", parent: "uranus",
    radiusKm: 578.9, orbitKm: 191_020, orbitDays: 2.52,
    fact: "Ariel is the brightest of Uranus's moons, criss-crossed with long valleys.",
  },
  {
    id: "umbriel", name: "Umbriel", kind: "moon", parent: "uranus",
    radiusKm: 584.7, orbitKm: 266_300, orbitDays: 4.144,
    fact: "Umbriel is the darkest of Uranus's big moons, with a mysterious bright ring near its edge.",
  },
  {
    id: "titania", name: "Titania", kind: "moon", parent: "uranus",
    radiusKm: 788.4, orbitKm: 435_910, orbitDays: 8.706,
    fact: "Titania is the biggest moon of Uranus. All of Uranus's moons are named after characters from Shakespeare and Pope.",
  },
  {
    id: "oberon", name: "Oberon", kind: "moon", parent: "uranus",
    radiusKm: 761.4, orbitKm: 583_520, orbitDays: 13.46,
    fact: "Oberon is the farthest out of Uranus's big moons, named after the king of the fairies.",
  },
  // Neptune
  {
    id: "proteus", name: "Proteus", kind: "moon", parent: "neptune",
    radiusKm: 210, orbitKm: 117_647, orbitDays: 1.122,
    fact: "Proteus is about as big as a moon can get without its own gravity squashing it into a ball.",
  },
  {
    id: "triton", name: "Triton", kind: "moon", parent: "neptune",
    radiusKm: 1353.4, orbitKm: 354_759, orbitDays: 5.877, tempC: -235,
    fact: "Triton goes round Neptune backwards and has geysers of nitrogen. It is one of the coldest places we know of.",
  },
  {
    id: "nereid", name: "Nereid", kind: "moon", parent: "neptune",
    radiusKm: 178, orbitKm: 5_513_800, orbitDays: 360.1,
    fact: "Nereid has one of the most stretched-out orbits of any moon — it swings far away from Neptune and back again.",
  },
  // Pluto
  {
    id: "charon", name: "Charon", kind: "moon", parent: "pluto",
    radiusKm: 606, orbitKm: 19_591, orbitDays: 6.387,
    fact: "Charon is half as wide as Pluto, so the two of them wobble round each other like a pair of dancers.",
  },
  {
    id: "styx", name: "Styx", kind: "moon", parent: "pluto",
    radiusKm: 8, orbitKm: 42_656, orbitDays: 20.16,
    fact: "Styx is Pluto's smallest moon, found in 2012 by the Hubble Space Telescope.",
  },
  {
    id: "nix", name: "Nix", kind: "moon", parent: "pluto",
    radiusKm: 19, orbitKm: 48_694, orbitDays: 24.85,
    fact: "Nix tumbles about chaotically as it orbits — it doesn't have a proper day at all.",
  },
  {
    id: "kerberos", name: "Kerberos", kind: "moon", parent: "pluto",
    radiusKm: 6, orbitKm: 57_783, orbitDays: 32.17,
    fact: "Kerberos is named after the three-headed dog that guards the underworld in Greek myths.",
  },
  {
    id: "hydra", name: "Hydra", kind: "moon", parent: "pluto",
    radiusKm: 19, orbitKm: 64_738, orbitDays: 38.2,
    fact: "Hydra is Pluto's outermost moon, named after the many-headed serpent.",
  },
  // Dwarf planets' moons
  {
    id: "vanth", name: "Vanth", kind: "moon", parent: "orcus",
    radiusKm: 221, orbitKm: 8999, orbitDays: 9.539,
    fact: "Vanth is a huge moon for a world the size of Orcus — nearly half as wide as Orcus itself.",
  },
  {
    id: "namaka", name: "Namaka", kind: "moon", parent: "haumea",
    radiusKm: 85, orbitKm: 25_657, orbitDays: 18.28,
    fact: "Namaka is named after a Hawaiian sea goddess, one of Haumea's daughters.",
  },
  {
    id: "hiiaka", name: "Hiʻiaka", kind: "moon", parent: "haumea",
    radiusKm: 155, orbitKm: 49_880, orbitDays: 49.12,
    fact: "Hiʻiaka is Haumea's bigger moon, named after the Hawaiian goddess of dance.",
  },
  {
    id: "weywot", name: "Weywot", kind: "moon", parent: "quaoar",
    radiusKm: 85, orbitKm: 13_289, orbitDays: 12.43,
    fact: "Weywot is named after the sky god of the Tongva people of California — the son of Quaoar.",
  },
  {
    id: "mk2", name: "MK2", kind: "moon", parent: "makemake",
    radiusKm: 87, orbitKm: 21_000, orbitDays: 12.4,
    fact: "Makemake's little moon is so dark and so new that it hasn't got a proper name yet — astronomers just call it MK2.",
  },
  {
    id: "xiangliu", name: "Xiangliu", kind: "moon", parent: "gonggong",
    radiusKm: 50, orbitKm: 24_021, orbitDays: 25.22,
    fact: "Xiangliu is named after a nine-headed snake monster from Chinese mythology.",
  },
  {
    id: "dysnomia", name: "Dysnomia", kind: "moon", parent: "eris",
    radiusKm: 307, orbitKm: 37_273, orbitDays: 15.79,
    fact: "Dysnomia is named after the daughter of Eris, the Greek goddess of trouble and strife.",
  },
];

export const BODIES = [SUN, ...PLANETS, ...DWARF_PLANETS, ...MOONS];

const BY_ID = Object.fromEntries(BODIES.map((b) => [b.id, b]));
const byDistance = (a, b) => a.orbitKm - b.orbitKm;

export function bodyById(id) {
  return BY_ID[id] ?? null;
}

// Everything that goes round the Sun, nearest first (planets and dwarf
// planets mixed, so Ceres sits between Mars and Jupiter).
export const SUN_ORBITERS = [...PLANETS, ...DWARF_PLANETS].sort(byDistance);

// The moons of a planet or dwarf planet, nearest first.
export function moonsOf(id) {
  return MOONS.filter((m) => m.parent === id).sort(byDistance);
}

// 1 for Mercury … 8 for Neptune; null for anything else.
export function planetNumber(body) {
  const i = PLANETS.indexOf(body);
  return i === -1 ? null : i + 1;
}

export const REGION_NAMES = {
  asteroid: "the asteroid belt",
  kuiper: "the Kuiper belt",
  scattered: "way out past the Kuiper belt",
};

export function ordinal(n) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}

// A one-line answer to "what is it?"
export function describe(body) {
  switch (body.kind) {
    case "star":
      return "Our star — everything else goes round it";
    case "planet":
      return `The ${ordinal(planetNumber(body))} planet from the Sun`;
    case "dwarf":
      return `A dwarf planet in ${REGION_NAMES[body.region]}`;
    case "moon": {
      const parent = bodyById(body.parent);
      const siblings = moonsOf(body.parent);
      const biggest = siblings.reduce((a, b) => (b.radiusKm > a.radiusKm ? b : a));
      if (siblings.length > 1 && biggest === body) return `The biggest moon of ${parent.name}`;
      return `A moon of ${parent.name}`;
    }
    default:
      return "";
  }
}

// ── Numbers ──────────────────────────────────────────────────────────────────

function trim(n, decimals) {
  return Number(n.toFixed(decimals));
}

export function formatNumber(n, useCommas = true) {
  return useCommas ? n.toLocaleString("en-US") : String(n);
}

// Sizes compared with Earth, e.g. "11× wider than Earth" or "Earth is 4× wider".
export function sizeVsEarth(radiusKm, useCommas = true) {
  const ratio = radiusKm / EARTH_RADIUS_KM;
  if (ratio >= 1.15) return `${formatNumber(trim(ratio, ratio < 10 ? 1 : 0), useCommas)}× wider than Earth`;
  if (ratio >= 0.87) return "About the same size as Earth";
  const inverse = 1 / ratio;
  return `Earth is ${formatNumber(trim(inverse, inverse < 10 ? 1 : 0), useCommas)}× wider`;
}

function plural(n, unit) {
  return `${n} ${unit}${n === "1" ? "" : "s"}`;
}

// Durations in the friendliest unit: hours, days or years.
export function formatDays(days, useCommas = true) {
  if (days < 1) return plural(formatNumber(trim(days * 24, 1), useCommas), "hour");
  if (days < 730) return plural(formatNumber(trim(days, days < 10 ? 1 : 0), useCommas), "day");
  const years = days / 365.25;
  return plural(formatNumber(trim(years, years < 10 ? 1 : 0), useCommas), "year");
}

export function formatHours(hours, useCommas = true) {
  if (hours < 48) return plural(formatNumber(trim(hours, 1), useCommas), "hour");
  return formatDays(hours / 24, useCommas);
}

export function formatAu(km) {
  const au = km / AU_KM;
  return `${trim(au, au < 10 ? 2 : au < 100 ? 1 : 0)} AU`;
}
