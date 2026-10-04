// ── Exoplanets ───────────────────────────────────────────────────────────────
//
// Other stars and the planets that go round them: a hand-picked couple of
// dozen systems with the most memorable worlds, nearest first. Pure data and
// helpers, no React. What a world *looks like* lives in exoLooks.js, and where
// it sits on the map in exoLayout.js.
//
// Stars:
//   id, name, say?   display name and, where the name trips up the speech button,
//                    how to say it
//   kind             "star"
//   starType         "red dwarf" | "orange star" | "yellow star" | "white star" |
//                    "blue-white star" | "pulsar" | "double star"
//   distanceLy       light-years from us
//   radiusSun        radius compared with the Sun
//   tempK            surface temperature in kelvin
//   planetCount      known planets, as of PLANETS_AS_OF
//   link             the Sun only: where its planets live
//   fact             one fun sentence
//
// Planets:
//   id, name, say?, kind "planet", parent (star id)
//   radiusEarth      radius compared with Earth (null when only the weight is known)
//   massEarth        mass compared with Earth (null when only the size is known)
//   orbitDays        one trip round the star, in Earth days
//   tempC            rough temperature, where anyone has a decent guess
//   type             "rocky" | "tiny" | "super-Earth" | "mini-Neptune" | "water world" |
//                    "lava world" | "gas giant" | "hot Jupiter"
//   habitable        true if it sits where liquid water could exist
//   found, foundBy   discovery year and how
//   fact             one fun sentence
//
// Sources: NASA Exoplanet Archive (6,080 confirmed planets as of January 2026),
// IAU NameExoWorlds for the proper names.

import { trimTo, formatNumber, formatDays } from "../shared/formatUtils.js";

export const PLANETS_AS_OF = "January 2026";
export const KNOWN_EXOPLANETS = 6080;
export const LIGHT_YEAR_KM = 9_460_730_000_000;
export const SUN_RADIUS_KM = 695_700;
export const EARTH_RADIUS_KM = 6371;

const KEPLER = "by the Kepler Space Telescope";
const TESS = "by the TESS space telescope";
const GROUND = "by telescopes on Earth, watching the star wobble";
const TRANSIT = "by telescopes on Earth, watching the star dim";

export const STARS = [
  {
    id: "sun", name: "The Sun", kind: "star", starType: "yellow star",
    distanceLy: 0, radiusSun: 1, tempK: 5772, planetCount: 8, link: "../solar-system/",
    fact: "Our own star! You know its eight planets already — they have a map of their own.",
  },
  {
    id: "proxima", name: "Proxima Centauri", say: "Proxima Sen-tor-eye", kind: "star", starType: "red dwarf",
    distanceLy: 4.24, radiusSun: 0.154, tempK: 3042, planetCount: 2,
    fact: "The closest star to the Sun — but still so far that a space probe like Voyager would take 70,000 years to get there. It is a tiny red dwarf, too faint to see without a telescope.",
  },
  {
    id: "barnard", name: "Barnard's Star", kind: "star", starType: "red dwarf",
    distanceLy: 5.96, radiusSun: 0.187, tempK: 3195, planetCount: 4,
    fact: "Barnard's Star zips across our sky faster than any other star. Its four tiny planets were finally confirmed in 2025, after astronomers looked for a hundred years.",
  },
  {
    id: "ran", name: "Ran", kind: "star", starType: "orange star",
    distanceLy: 10.5, radiusSun: 0.74, tempK: 5084, planetCount: 1,
    fact: "Ran is a young orange star with two rings of dust and rock round it, like our asteroid and Kuiper belts. It is named after a Norse sea goddess; its old name is Epsilon Eridani.",
  },
  {
    id: "teegarden", name: "Teegarden's Star", kind: "star", starType: "red dwarf",
    distanceLy: 12.5, radiusSun: 0.107, tempK: 2904, planetCount: 3,
    fact: "Teegarden's Star is so small and faint that nobody noticed it until 2003, even though it is one of our nearest neighbours.",
  },
  {
    id: "trappist1", name: "TRAPPIST-1", say: "Trappist one", kind: "star", starType: "red dwarf",
    distanceLy: 40.7, radiusSun: 0.121, tempK: 2566, planetCount: 7,
    fact: "TRAPPIST-1 is only a bit bigger than Jupiter, and its seven planets huddle so close that all of them would fit inside Mercury's orbit. From one, you could see the others as big as our Moon!",
  },
  {
    id: "copernicus", name: "Copernicus", say: "Ko-per-ni-kus", kind: "star", starType: "yellow star",
    distanceLy: 41, radiusSun: 0.94, tempK: 5172, planetCount: 5,
    fact: "Copernicus (also called 55 Cancri) has five planets with proper names chosen by a public vote in 2015 — Galileo, Brahe, Lipperhey, Harriot and Janssen, all famous astronomers and telescope makers.",
  },
  {
    id: "gj1214", name: "GJ 1214", say: "G J twelve fourteen", kind: "star", starType: "red dwarf",
    distanceLy: 47.8, radiusSun: 0.215, tempK: 3250, planetCount: 1,
    fact: "GJ 1214 is a small red star whose planet was found by a set of little telescopes no bigger than the kind you might have in a garden.",
  },
  {
    id: "helvetios", name: "Helvetios", say: "Hel-vee-shee-oss", kind: "star", starType: "yellow star",
    distanceLy: 50.6, radiusSun: 1.27, tempK: 5768, planetCount: 1,
    fact: "Helvetios (also called 51 Pegasi) is a star like our Sun, only a little older. On a dark night you can just see it with your own eyes, in the constellation Pegasus.",
  },
  {
    id: "hd189733", name: "HD 189733", say: "H D one eight nine seven three three", kind: "star", starType: "orange star",
    distanceLy: 64.5, radiusSun: 0.76, tempK: 4875, planetCount: 1,
    fact: "HD 189733 is an orange star with a planet that astronomers have studied more than almost any other — because it crosses in front of its star every two days.",
  },
  {
    id: "toi700", name: "TOI-700", say: "Toy seven hundred", kind: "star", starType: "red dwarf",
    distanceLy: 101, radiusSun: 0.42, tempK: 3480, planetCount: 4,
    fact: "TOI-700 is a calm little red star — no big flares — with two Earth-sized planets in its just-right zone.",
  },
  {
    id: "k218", name: "K2-18", say: "K two eighteen", kind: "star", starType: "red dwarf",
    distanceLy: 124, radiusSun: 0.44, tempK: 3457, planetCount: 2,
    fact: "In 2019, K2-18's planet b became the first planet in a just-right zone found to have water vapour in its air.",
  },
  {
    id: "hd209458", name: "HD 209458", say: "H D two oh nine four five eight", kind: "star", starType: "yellow star",
    distanceLy: 159, radiusSun: 1.2, tempK: 6071, planetCount: 1,
    fact: "HD 209458 is a Sun-like star whose planet, Osiris, was the first ever seen crossing in front of its star.",
  },
  {
    id: "kepler16", name: "Kepler-16", say: "Kepler sixteen", kind: "star", starType: "double star",
    distanceLy: 245, radiusSun: 0.65, tempK: 4450, planetCount: 1,
    fact: "Kepler-16 is two stars going round each other — an orange one and a little red one. Its planet has two suns in its sky, just like Tatooine in Star Wars.",
  },
  {
    id: "kepler186", name: "Kepler-186", say: "Kepler one eighty-six", kind: "star", starType: "red dwarf",
    distanceLy: 579, radiusSun: 0.52, tempK: 3755, planetCount: 5,
    fact: "Kepler-186 is a red dwarf nearly 600 light-years away. The light we see from it tonight left the star when knights were still jousting.",
  },
  {
    id: "kepler22", name: "Kepler-22", say: "Kepler twenty-two", kind: "star", starType: "yellow star",
    distanceLy: 635, radiusSun: 0.98, tempK: 5518, planetCount: 1,
    fact: "Kepler-22 is a star a lot like the Sun, with a planet in its just-right zone that might be covered in ocean.",
  },
  {
    id: "wasp76", name: "WASP-76", say: "Wasp seventy-six", kind: "star", starType: "white star",
    distanceLy: 640, radiusSun: 1.73, tempK: 6250, planetCount: 1,
    fact: "WASP-76 is a big white star, hotter than the Sun, with a planet where it rains iron.",
  },
  {
    id: "kelt9", name: "KELT-9", say: "Kelt nine", kind: "star", starType: "blue-white star",
    distanceLy: 670, radiusSun: 2.36, tempK: 10170, planetCount: 1,
    fact: "KELT-9 is a huge blue-white star, nearly twice as hot as the Sun. Its planet is the hottest one anyone has found.",
  },
  {
    id: "tres2", name: "TrES-2", say: "Tress two", kind: "star", starType: "yellow star",
    distanceLy: 750, radiusSun: 1.0, tempK: 5850, planetCount: 1,
    fact: "TrES-2 is a Sun-like star with the darkest planet known going round it.",
  },
  {
    id: "wasp12", name: "WASP-12", say: "Wasp twelve", kind: "star", starType: "yellow star",
    distanceLy: 1410, radiusSun: 1.6, tempK: 6300, planetCount: 1,
    fact: "WASP-12 is a star that is slowly eating its own planet.",
  },
  {
    id: "kepler452", name: "Kepler-452", say: "Kepler four fifty-two", kind: "star", starType: "yellow star",
    distanceLy: 1800, radiusSun: 1.11, tempK: 5757, planetCount: 1,
    fact: "Kepler-452 is almost a twin of our Sun — just a bit older and a bit bigger.",
  },
  {
    id: "lich", name: "Lich", say: "Litch", kind: "star", starType: "pulsar",
    distanceLy: 2300, radiusSun: 0.000014, tempK: 1_000_000, planetCount: 3,
    fact: "Lich is a dead star called a pulsar: only 20 km across but heavier than the Sun, spinning 161 times every second and flashing like a lighthouse. Its planets were the very first exoplanets ever found, in 1992.",
  },
  {
    id: "kepler90", name: "Kepler-90", say: "Kepler ninety", kind: "star", starType: "yellow star",
    distanceLy: 2840, radiusSun: 1.2, tempK: 6080, planetCount: 8,
    fact: "Kepler-90 has eight planets, exactly like our Sun — the only other star we know with that many. The eighth, Kepler-90i, was found in 2017 by a computer that had been taught to spot planets.",
  },
];

export const PLANETS = [
  // Proxima Centauri
  {
    id: "proxima-b", name: "Proxima b", kind: "planet", parent: "proxima",
    radiusEarth: null, massEarth: 1.07, orbitDays: 11.19, tempC: -39, type: "rocky", habitable: true,
    found: 2016, foundBy: GROUND,
    fact: "Proxima b is the closest planet to our Solar System. It sits where water could be liquid — but its star throws out huge flares, so it might be a hard place to live.",
  },
  {
    id: "proxima-d", name: "Proxima d", kind: "planet", parent: "proxima",
    radiusEarth: null, massEarth: 0.26, orbitDays: 5.12, tempC: 87, type: "tiny",
    found: 2022, foundBy: GROUND,
    fact: "Proxima d is one of the lightest planets ever found — only a quarter of Earth's weight — and whizzes round its star in just 5 days.",
  },
  // Barnard's Star
  {
    id: "barnard-d", name: "Barnard d", kind: "planet", parent: "barnard",
    radiusEarth: null, massEarth: 0.26, orbitDays: 2.34, type: "tiny",
    found: 2025, foundBy: GROUND,
    fact: "Barnard d is the closest in of the four, racing round its star in a little over two days.",
  },
  {
    id: "barnard-b", name: "Barnard b", kind: "planet", parent: "barnard",
    radiusEarth: null, massEarth: 0.37, orbitDays: 3.15, type: "tiny",
    found: 2024, foundBy: GROUND,
    fact: "Barnard b was the first of its star's planets to be confirmed, in 2024 — far too hot for water, with a year of just 3 days.",
  },
  {
    id: "barnard-c", name: "Barnard c", kind: "planet", parent: "barnard",
    radiusEarth: null, massEarth: 0.34, orbitDays: 4.12, type: "tiny",
    found: 2025, foundBy: GROUND,
    fact: "Barnard c weighs about a third as much as Earth.",
  },
  {
    id: "barnard-e", name: "Barnard e", kind: "planet", parent: "barnard",
    radiusEarth: null, massEarth: 0.19, orbitDays: 6.74, type: "tiny",
    found: 2025, foundBy: GROUND,
    fact: "Barnard e is the lightest planet ever found by watching a star wobble — less than a fifth of Earth's weight.",
  },
  // Ran
  {
    id: "aegir", name: "Ægir", say: "Ay-geer", kind: "planet", parent: "ran",
    radiusEarth: null, massEarth: 210, orbitDays: 2690, tempC: -170, type: "gas giant",
    found: 2000, foundBy: GROUND,
    fact: "Ægir is the closest big Jupiter-like planet to us. It is named after a Norse sea giant — Ran's husband.",
  },
  // Teegarden's Star
  {
    id: "teegarden-b", name: "Teegarden b", kind: "planet", parent: "teegarden",
    radiusEarth: null, massEarth: 1.1, orbitDays: 4.91, type: "rocky", habitable: true,
    found: 2019, foundBy: GROUND,
    fact: "Teegarden b weighs about the same as Earth and sits right where water could be liquid.",
  },
  {
    id: "teegarden-c", name: "Teegarden c", kind: "planet", parent: "teegarden",
    radiusEarth: null, massEarth: 1.1, orbitDays: 11.4, type: "rocky", habitable: true,
    found: 2019, foundBy: GROUND,
    fact: "Teegarden c is a second Earth-weight world, a little further out and colder.",
  },
  {
    id: "teegarden-d", name: "Teegarden d", kind: "planet", parent: "teegarden",
    radiusEarth: null, massEarth: 0.82, orbitDays: 26.1, type: "rocky",
    found: 2024, foundBy: GROUND,
    fact: "Teegarden d was found in 2024 — the third planet round this tiny, dim star.",
  },
  // TRAPPIST-1
  {
    id: "trappist1-b", name: "TRAPPIST-1 b", say: "Trappist one b", kind: "planet", parent: "trappist1",
    radiusEarth: 1.12, massEarth: 1.37, orbitDays: 1.51, tempC: 125, type: "rocky",
    found: 2016, foundBy: "by the TRAPPIST telescope in Chile",
    fact: "TRAPPIST-1 b is the closest in. The James Webb telescope found it has no air at all — just hot, bare rock.",
  },
  {
    id: "trappist1-c", name: "TRAPPIST-1 c", say: "Trappist one c", kind: "planet", parent: "trappist1",
    radiusEarth: 1.10, massEarth: 1.31, orbitDays: 2.42, tempC: 69, type: "rocky",
    found: 2016, foundBy: "by the TRAPPIST telescope in Chile",
    fact: "TRAPPIST-1 c is about the size of Earth and a bit heavier, with a year that lasts two and a half days.",
  },
  {
    id: "trappist1-d", name: "TRAPPIST-1 d", say: "Trappist one d", kind: "planet", parent: "trappist1",
    radiusEarth: 0.79, massEarth: 0.39, orbitDays: 4.05, tempC: 15, type: "rocky", habitable: true,
    found: 2016, foundBy: "by the Spitzer Space Telescope",
    fact: "TRAPPIST-1 d is the smallest of the seven, and about as warm as Earth on average.",
  },
  {
    id: "trappist1-e", name: "TRAPPIST-1 e", say: "Trappist one e", kind: "planet", parent: "trappist1",
    radiusEarth: 0.92, massEarth: 0.69, orbitDays: 6.10, tempC: -22, type: "rocky", habitable: true,
    found: 2017, foundBy: "by the Spitzer Space Telescope",
    fact: "TRAPPIST-1 e is the one astronomers think is most likely to have oceans. The James Webb telescope is checking its air right now.",
  },
  {
    id: "trappist1-f", name: "TRAPPIST-1 f", say: "Trappist one f", kind: "planet", parent: "trappist1",
    radiusEarth: 1.05, massEarth: 1.04, orbitDays: 9.21, tempC: -54, type: "rocky", habitable: true,
    found: 2017, foundBy: "by the Spitzer Space Telescope",
    fact: "TRAPPIST-1 f is almost exactly Earth-sized, but colder — it might be an icy world.",
  },
  {
    id: "trappist1-g", name: "TRAPPIST-1 g", say: "Trappist one g", kind: "planet", parent: "trappist1",
    radiusEarth: 1.13, massEarth: 1.32, orbitDays: 12.35, tempC: -75, type: "rocky", habitable: true,
    found: 2017, foundBy: "by the Spitzer Space Telescope",
    fact: "TRAPPIST-1 g is the biggest of the seven, a little wider than Earth.",
  },
  {
    id: "trappist1-h", name: "TRAPPIST-1 h", say: "Trappist one h", kind: "planet", parent: "trappist1",
    radiusEarth: 0.76, massEarth: 0.33, orbitDays: 18.77, tempC: -104, type: "rocky",
    found: 2017, foundBy: "by the Spitzer Space Telescope",
    fact: "TRAPPIST-1 h is the farthest out — and even it is closer to its star than Mercury is to the Sun.",
  },
  // Copernicus (55 Cancri)
  {
    id: "janssen", name: "Janssen", say: "Yan-sen", kind: "planet", parent: "copernicus",
    radiusEarth: 1.88, massEarth: 7.99, orbitDays: 0.737, tempC: 1700, type: "lava world",
    found: 2004, foundBy: GROUND,
    fact: "A year on Janssen lasts just 18 hours! Its day side is an ocean of melted rock, and it may rain lava there.",
  },
  {
    id: "galileo", name: "Galileo", kind: "planet", parent: "copernicus",
    radiusEarth: null, massEarth: 264, orbitDays: 14.65, type: "hot Jupiter",
    found: 1996, foundBy: GROUND,
    fact: "Galileo was one of the very first exoplanets ever found, in 1996 — a giant nearly as heavy as Jupiter, with a year of two weeks.",
  },
  {
    id: "brahe", name: "Brahe", say: "Brah-hee", kind: "planet", parent: "copernicus",
    radiusEarth: null, massEarth: 54, orbitDays: 44.4, type: "gas giant",
    found: 2002, foundBy: GROUND,
    fact: "Brahe is a gas planet about as heavy as Saturn, named after Tycho Brahe, who measured the stars before telescopes existed.",
  },
  {
    id: "harriot", name: "Harriot", kind: "planet", parent: "copernicus",
    radiusEarth: null, massEarth: 47, orbitDays: 262, type: "gas giant",
    found: 2007, foundBy: GROUND,
    fact: "Harriot sits in the just-right zone — but it's a gas giant, so any oceans would have to be on its moons.",
  },
  {
    id: "lipperhey", name: "Lipperhey", say: "Lipper-hay", kind: "planet", parent: "copernicus",
    radiusEarth: null, massEarth: 1240, orbitDays: 5170, type: "gas giant",
    found: 2002, foundBy: GROUND,
    fact: "Lipperhey is nearly four times heavier than Jupiter and takes 14 years to go round. Hans Lipperhey built one of the first telescopes.",
  },
  // GJ 1214
  {
    id: "gj1214-b", name: "GJ 1214 b", say: "G J twelve fourteen b", kind: "planet", parent: "gj1214",
    radiusEarth: 2.74, massEarth: 8.17, orbitDays: 1.58, tempC: 280, type: "water world",
    found: 2009, foundBy: TRANSIT,
    fact: "GJ 1214 b is a steamy world wrapped in thick haze. It may be mostly water — so hot and squashed that it's strange kinds of ice and steam at the same time.",
  },
  // Helvetios (51 Pegasi)
  {
    id: "dimidium", name: "Dimidium", say: "Dim-id-ee-um", kind: "planet", parent: "helvetios",
    radiusEarth: null, massEarth: 146, orbitDays: 4.23, tempC: 1000, type: "hot Jupiter",
    found: 1995, foundBy: GROUND,
    fact: "Dimidium was the first planet ever found round a star like the Sun, in 1995 — its discoverers won the Nobel Prize. It's a giant so close to its star that a year lasts 4 days.",
  },
  // HD 189733
  {
    id: "hd189733-b", name: "HD 189733 b", say: "H D one eight nine seven three three b", kind: "planet", parent: "hd189733",
    radiusEarth: 12.7, massEarth: 360, orbitDays: 2.22, tempC: 930, type: "hot Jupiter",
    found: 2005, foundBy: TRANSIT,
    fact: "HD 189733 b is deep blue like Earth from space — but its sky is blue because it rains glass, sideways, in winds of 8,000 km an hour. It smells of rotten eggs, too!",
  },
  // TOI-700
  {
    id: "toi700-b", name: "TOI-700 b", say: "Toy seven hundred b", kind: "planet", parent: "toi700",
    radiusEarth: 0.91, massEarth: null, orbitDays: 9.98, tempC: 140, type: "rocky",
    found: 2020, foundBy: TESS,
    fact: "TOI-700 b is a little smaller than Earth and too close to its star to be anything but hot.",
  },
  {
    id: "toi700-c", name: "TOI-700 c", say: "Toy seven hundred c", kind: "planet", parent: "toi700",
    radiusEarth: 2.63, massEarth: null, orbitDays: 16.05, tempC: 83, type: "mini-Neptune",
    found: 2020, foundBy: TESS,
    fact: "TOI-700 c is the odd one out — more than twice as wide as Earth, with a thick, puffy sky.",
  },
  {
    id: "toi700-e", name: "TOI-700 e", say: "Toy seven hundred e", kind: "planet", parent: "toi700",
    radiusEarth: 0.95, massEarth: null, orbitDays: 27.8, tempC: 20, type: "rocky", habitable: true,
    found: 2023, foundBy: TESS,
    fact: "TOI-700 e, found in 2023, is a touch smaller than Earth and squeezes in between planets c and d.",
  },
  {
    id: "toi700-d", name: "TOI-700 d", say: "Toy seven hundred d", kind: "planet", parent: "toi700",
    radiusEarth: 1.07, massEarth: null, orbitDays: 37.4, tempC: -4, type: "rocky", habitable: true,
    found: 2020, foundBy: TESS,
    fact: "TOI-700 d was the first Earth-sized planet in a just-right zone found by the TESS telescope.",
  },
  // K2-18
  {
    id: "k218-c", name: "K2-18 c", say: "K two eighteen c", kind: "planet", parent: "k218",
    radiusEarth: null, massEarth: 5.6, orbitDays: 8.99, type: "super-Earth",
    found: 2017, foundBy: GROUND,
    fact: "K2-18 c is a heavy rocky world close in to its star, found by the wobble it gives the star.",
  },
  {
    id: "k218-b", name: "K2-18 b", say: "K two eighteen b", kind: "planet", parent: "k218",
    radiusEarth: 2.61, massEarth: 8.63, orbitDays: 32.9, tempC: -8, type: "water world", habitable: true,
    found: 2015, foundBy: KEPLER,
    fact: "K2-18 b may be a Hycean world: a deep ocean under a thick hydrogen sky. In 2023 the James Webb telescope found carbon dioxide and methane in its air.",
  },
  // HD 209458
  {
    id: "osiris", name: "Osiris", say: "Oh-sy-ris", kind: "planet", parent: "hd209458",
    radiusEarth: 15.5, massEarth: 220, orbitDays: 3.52, tempC: 1100, type: "hot Jupiter",
    found: 1999, foundBy: TRANSIT,
    fact: "Osiris was the first planet ever seen crossing in front of its star, in 1999. It is so hot that its air is boiling off into space, streaming behind it like a comet's tail.",
  },
  // Kepler-16
  {
    id: "kepler16-b", name: "Kepler-16 b", say: "Kepler sixteen b", kind: "planet", parent: "kepler16",
    radiusEarth: 8.4, massEarth: 106, orbitDays: 229, tempC: -100, type: "gas giant",
    found: 2011, foundBy: KEPLER,
    fact: "Kepler-16 b was the first planet found going round two stars at once. It's about the size of Saturn and freezing cold — double sunsets, but no beach weather.",
  },
  // Kepler-186
  {
    id: "kepler186-b", name: "Kepler-186 b", say: "Kepler one eighty-six b", kind: "planet", parent: "kepler186",
    radiusEarth: 1.07, massEarth: null, orbitDays: 3.89, type: "rocky",
    found: 2014, foundBy: KEPLER,
    fact: "Kepler-186 b is the closest in of five, a scorched Earth-sized world.",
  },
  {
    id: "kepler186-c", name: "Kepler-186 c", say: "Kepler one eighty-six c", kind: "planet", parent: "kepler186",
    radiusEarth: 1.25, massEarth: null, orbitDays: 7.27, type: "rocky",
    found: 2014, foundBy: KEPLER,
    fact: "Kepler-186 c is a quarter wider than Earth, with a year of just a week.",
  },
  {
    id: "kepler186-d", name: "Kepler-186 d", say: "Kepler one eighty-six d", kind: "planet", parent: "kepler186",
    radiusEarth: 1.40, massEarth: null, orbitDays: 13.34, type: "super-Earth",
    found: 2014, foundBy: KEPLER,
    fact: "Kepler-186 d is the biggest of the five, almost one and a half times as wide as Earth.",
  },
  {
    id: "kepler186-e", name: "Kepler-186 e", say: "Kepler one eighty-six e", kind: "planet", parent: "kepler186",
    radiusEarth: 1.27, massEarth: null, orbitDays: 22.41, type: "rocky",
    found: 2014, foundBy: KEPLER,
    fact: "Kepler-186 e is just inside the just-right zone — probably a little too warm.",
  },
  {
    id: "kepler186-f", name: "Kepler-186 f", say: "Kepler one eighty-six f", kind: "planet", parent: "kepler186",
    radiusEarth: 1.17, massEarth: null, orbitDays: 129.9, tempC: -85, type: "rocky", habitable: true,
    found: 2014, foundBy: KEPLER,
    fact: "Kepler-186 f was the first Earth-sized planet found in another star's just-right zone. Its star is red, so any plants there might be dark red or black!",
  },
  // Kepler-22
  {
    id: "kepler22-b", name: "Kepler-22 b", say: "Kepler twenty-two b", kind: "planet", parent: "kepler22",
    radiusEarth: 2.4, massEarth: null, orbitDays: 289.9, tempC: -11, type: "water world", habitable: true,
    found: 2011, foundBy: KEPLER,
    fact: "Kepler-22 b was the first planet found in the just-right zone of a Sun-like star. Nobody knows yet if it's rocky or a world of water.",
  },
  // WASP-76
  {
    id: "wasp76-b", name: "WASP-76 b", say: "Wasp seventy-six b", kind: "planet", parent: "wasp76",
    radiusEarth: 20.5, massEarth: 292, orbitDays: 1.81, tempC: 2200, type: "hot Jupiter",
    found: 2013, foundBy: TRANSIT,
    fact: "On WASP-76 b the day side is so hot that iron turns to vapour. Winds blow it round to the night side, where it cools and falls as rain made of iron.",
  },
  // KELT-9
  {
    id: "kelt9-b", name: "KELT-9 b", say: "Kelt nine b", kind: "planet", parent: "kelt9",
    radiusEarth: 21.2, massEarth: 915, orbitDays: 1.48, tempC: 4300, type: "hot Jupiter",
    found: 2017, foundBy: TRANSIT,
    fact: "KELT-9 b is hotter than some stars — over 4,000 °C on its day side. The metals in its air get torn apart into single atoms.",
  },
  // TrES-2
  {
    id: "tres2-b", name: "TrES-2 b", say: "Tress two b", kind: "planet", parent: "tres2",
    radiusEarth: 14.2, massEarth: 381, orbitDays: 2.47, tempC: 1100, type: "hot Jupiter",
    found: 2006, foundBy: TRANSIT,
    fact: "TrES-2 b is the darkest planet known — blacker than coal. It bounces back less than 1% of the light that hits it, with just a faint red glow from its own heat.",
  },
  // WASP-12
  {
    id: "wasp12-b", name: "WASP-12 b", say: "Wasp twelve b", kind: "planet", parent: "wasp12",
    radiusEarth: 21.3, massEarth: 467, orbitDays: 1.09, tempC: 2200, type: "hot Jupiter",
    found: 2008, foundBy: TRANSIT,
    fact: "WASP-12 b is so close to its star that it has been stretched into an egg shape, and the star is slowly eating it. In a few million years it will be gone.",
  },
  // Kepler-452
  {
    id: "kepler452-b", name: "Kepler-452 b", say: "Kepler four fifty-two b", kind: "planet", parent: "kepler452",
    radiusEarth: 1.63, massEarth: null, orbitDays: 384.8, tempC: -8, type: "super-Earth", habitable: true,
    found: 2015, foundBy: KEPLER,
    fact: "Kepler-452 b is called Earth's cousin: a year there lasts 385 days, round a star just like ours. It is 1.6 times wider than Earth.",
  },
  // Lich
  {
    id: "draugr", name: "Draugr", say: "Drow-gur", kind: "planet", parent: "lich",
    radiusEarth: null, massEarth: 0.02, orbitDays: 25.3, type: "tiny",
    found: 1994, foundBy: "by the Arecibo radio dish, timing the pulsar's flashes",
    fact: "Draugr is the lightest planet known — only twice as heavy as our Moon. A draugr is an undead creature from old Norse tales.",
  },
  {
    id: "poltergeist", name: "Poltergeist", kind: "planet", parent: "lich",
    radiusEarth: null, massEarth: 4.3, orbitDays: 66.5, type: "super-Earth",
    found: 1992, foundBy: "by the Arecibo radio dish, timing the pulsar's flashes",
    fact: "Poltergeist and Phobetor were the first planets ever found outside the Solar System, in 1992 — round a dead star nobody expected to have any.",
  },
  {
    id: "phobetor", name: "Phobetor", say: "Fo-bee-tor", kind: "planet", parent: "lich",
    radiusEarth: null, massEarth: 3.9, orbitDays: 98.2, type: "super-Earth",
    found: 1992, foundBy: "by the Arecibo radio dish, timing the pulsar's flashes",
    fact: "Phobetor is named after a Greek god of nightmares — a fitting name for a world bathed in a pulsar's deadly beams.",
  },
  // Kepler-90
  {
    id: "kepler90-b", name: "Kepler-90 b", say: "Kepler ninety b", kind: "planet", parent: "kepler90",
    radiusEarth: 1.31, massEarth: null, orbitDays: 7.01, type: "rocky",
    found: 2013, foundBy: KEPLER,
    fact: "Kepler-90 b is the innermost of eight, with a year of one week.",
  },
  {
    id: "kepler90-c", name: "Kepler-90 c", say: "Kepler ninety c", kind: "planet", parent: "kepler90",
    radiusEarth: 1.19, massEarth: null, orbitDays: 8.72, type: "rocky",
    found: 2013, foundBy: KEPLER,
    fact: "Kepler-90 c is a bit bigger than Earth, baking close to its star.",
  },
  {
    id: "kepler90-i", name: "Kepler-90 i", say: "Kepler ninety i", kind: "planet", parent: "kepler90",
    radiusEarth: 1.32, massEarth: null, orbitDays: 14.45, type: "rocky",
    found: 2017, foundBy: "by a computer that was taught to spot planets in Kepler's data",
    fact: "Kepler-90 i was the eighth planet found here — by a computer program that learned to find the tiny dips a planet makes in its star's light.",
  },
  {
    id: "kepler90-d", name: "Kepler-90 d", say: "Kepler ninety d", kind: "planet", parent: "kepler90",
    radiusEarth: 2.87, massEarth: null, orbitDays: 59.7, type: "mini-Neptune",
    found: 2013, foundBy: KEPLER,
    fact: "Kepler-90 d is nearly three times as wide as Earth, with a thick puffy sky.",
  },
  {
    id: "kepler90-e", name: "Kepler-90 e", say: "Kepler ninety e", kind: "planet", parent: "kepler90",
    radiusEarth: 2.66, massEarth: null, orbitDays: 91.9, type: "mini-Neptune",
    found: 2013, foundBy: KEPLER,
    fact: "Kepler-90 e goes round its star in about three months.",
  },
  {
    id: "kepler90-f", name: "Kepler-90 f", say: "Kepler ninety f", kind: "planet", parent: "kepler90",
    radiusEarth: 2.88, massEarth: null, orbitDays: 124.9, type: "mini-Neptune",
    found: 2013, foundBy: KEPLER,
    fact: "Kepler-90 f is the third of three mini-Neptunes in a row.",
  },
  {
    id: "kepler90-g", name: "Kepler-90 g", say: "Kepler ninety g", kind: "planet", parent: "kepler90",
    radiusEarth: 8.13, massEarth: null, orbitDays: 210.6, type: "gas giant",
    found: 2013, foundBy: KEPLER,
    fact: "Kepler-90 g is a gas giant about the size of Saturn.",
  },
  {
    id: "kepler90-h", name: "Kepler-90 h", say: "Kepler ninety h", kind: "planet", parent: "kepler90",
    radiusEarth: 11.3, massEarth: null, orbitDays: 331.6, type: "gas giant",
    found: 2013, foundBy: KEPLER,
    fact: "Kepler-90 h is the outermost: a Jupiter-sized giant with a year almost as long as ours. All eight planets would fit inside Earth's orbit!",
  },
];

export const WORLDS = [...STARS, ...PLANETS];
const BY_ID = Object.fromEntries(WORLDS.map((w) => [w.id, w]));

export function worldById(id) {
  return BY_ID[id] ?? null;
}

// Stars nearest first; a star's planets nearest it first.
export const STARS_BY_DISTANCE = [...STARS].sort((a, b) => a.distanceLy - b.distanceLy);

export function planetsOf(starId) {
  return PLANETS.filter((p) => p.parent === starId).sort((a, b) => a.orbitDays - b.orbitDays);
}

// The map chips are small: a long catalog name ("TRAPPIST-1 e") shows as just
// its letter, since the star's name sits right beside it.
export function shortName(planet) {
  if (planet.name.length <= 10) return planet.name;
  const m = planet.name.match(/ ([a-z])$/);
  return m ? m[1] : planet.name;
}

export const TYPE_NAMES = {
  rocky: "A rocky planet",
  tiny: "A tiny rocky planet",
  "super-Earth": "A super-Earth: a big rocky planet",
  "mini-Neptune": "A mini-Neptune: small, with a thick sky",
  "water world": "A water world",
  "lava world": "A lava world",
  "gas giant": "A gas giant, like Jupiter",
  "hot Jupiter": "A hot Jupiter: a giant right next to its star",
};

const STAR_TYPE_NAMES = {
  "red dwarf": "A small, cool red dwarf star",
  "orange star": "An orange star, a bit cooler than the Sun",
  "yellow star": "A yellow star like the Sun",
  "white star": "A white star, hotter than the Sun",
  "blue-white star": "A huge, blazing blue-white star",
  pulsar: "A pulsar: a tiny, spinning dead star",
  "double star": "Two stars going round each other",
};

export function describe(world) {
  if (world.kind === "star") {
    if (world.id === "sun") return "Our own star, with the planets you know";
    return `${STAR_TYPE_NAMES[world.starType]}, ${formatLightYears(world.distanceLy)} away`;
  }
  return `${TYPE_NAMES[world.type]}, round ${worldById(world.parent).name}`;
}

// ── Numbers ──────────────────────────────────────────────────────────────────

export function formatLightYears(ly, useCommas = true) {
  const n = ly < 10 ? trimTo(ly, 1) : Math.round(ly);
  return `${formatNumber(n, useCommas)} light-year${n === 1 ? "" : "s"}`;
}

// "light takes 40 years to get here"
export function lightTravel(ly) {
  if (ly === 0) return "its light takes 8 minutes to reach us";
  const years = ly < 10 ? trimTo(ly, 1) : Math.round(ly);
  return `its light takes ${formatNumber(years)} years to reach us`;
}

export function sizeVsEarth(radiusEarth, useCommas = true) {
  if (radiusEarth >= 1.15) return `${formatNumber(trimTo(radiusEarth, radiusEarth < 10 ? 1 : 0), useCommas)}× wider than Earth`;
  if (radiusEarth >= 0.87) return "About the same size as Earth";
  return `Earth is ${formatNumber(trimTo(1 / radiusEarth, 1), useCommas)}× wider`;
}

export function massVsEarth(massEarth, useCommas = true) {
  if (massEarth >= 1.15) return `${formatNumber(trimTo(massEarth, massEarth < 10 ? 1 : 0), useCommas)}× heavier than Earth`;
  if (massEarth >= 0.87) return "About as heavy as Earth";
  return `Earth is ${formatNumber(trimTo(1 / massEarth, 1), useCommas)}× heavier`;
}

export function sizeVsSun(radiusSun, useCommas = true) {
  if (radiusSun >= 1.15) return `${formatNumber(trimTo(radiusSun, 1), useCommas)}× wider than the Sun`;
  if (radiusSun >= 0.87) return "About the size of the Sun";
  const inverse = 1 / radiusSun;
  return `The Sun is ${formatNumber(trimTo(inverse, inverse < 10 ? 1 : 0), useCommas)}× wider`;
}

// A radius to draw a planet with when only its weight is known.
export function guessRadiusEarth(planet) {
  if (planet.radiusEarth) return planet.radiusEarth;
  const m = planet.massEarth;
  if (m > 100) return 11;
  if (m > 20) return 5;
  return Math.pow(m, 0.27);
}

export { formatDays };
