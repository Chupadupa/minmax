import { useState, useRef, useEffect, useMemo } from "react";
import {
  BODIES, SUN_ORBITERS, NOTABLE_ASTEROIDS, bodyById, moonsOf, planetNumber, describe, ordinal,
  sizeVsEarth, formatNumber, formatDays, formatHours, formatAu, MOONS_AS_OF,
} from "./bodies.js";
import { layoutMap } from "./layout.js";
import { lookFor } from "./bodyLooks.js";
import { BodyPicture } from "../shared/BodyPicture.jsx";
import { accentColor } from "../shared/bodyArt.js";
import { SolarMap } from "./SolarMap.jsx";
import { NB_SOLID } from "../shared/numberblockColors.js";
import { BackgroundDots } from "../shared/BackgroundDots.jsx";
import { StickyHeader } from "../shared/StickyHeader.jsx";
import {
  SettingsOverlay, SettingsToggle, SettingsDivider,
  SettingsSection, SettingsAboutText, SettingsLink,
} from "../shared/SettingsOverlay.jsx";
import { Toast } from "../shared/Toast.jsx";
import { useScrollLock } from "../shared/useScrollLock.js";
import { useSpeech } from "../shared/useSpeech.js";
import { useElementWidth } from "../shared/useElementWidth.js";

const SUN = bodyById("sun");
const PLANET_IDS = SUN_ORBITERS.filter((b) => b.kind === "planet").map((b) => b.id);
const OFFICIAL_DWARF_IDS = SUN_ORBITERS.filter((b) => b.kind === "dwarf" && !b.candidate).map((b) => b.id);
const GALILEAN_IDS = ["io", "europa", "ganymede", "callisto"];
const ASTEROID_IDS = NOTABLE_ASTEROIDS.map((b) => b.id);
const MOON_ORBIT_KM = 384_400;
const TOAST_MS = 3500;

// ── Fact Chips ───────────────────────────────────────────────────────────────
//
// The numbers shown under a body's name: label, big value, small note.

function formatTemp(tempC, commas) {
  const sign = tempC < 0 ? "−" : "";
  return `${sign}${formatNumber(Math.abs(tempC), commas)} °C`;
}

function tempNote(tempC) {
  if (tempC > 1000) return "that's a star for you";
  if (tempC >= 100) return "hotter than boiling water";
  if (tempC > 30) return "a very hot day";
  if (tempC >= 0) return "just right for us";
  if (tempC > -100) return "colder than a freezer";
  return "colder than anywhere on Earth";
}

function factsFor(body, commas) {
  const km = (v) => `${formatNumber(v < 10 ? Number(v.toFixed(1)) : Math.round(v), commas)} km`;
  const ratio = (v, decimals) => formatNumber(Number(v.toFixed(decimals)), commas);
  const chips = [{ label: "How wide", value: km(body.radiusKm * 2), note: sizeVsEarth(body.radiusKm, commas) }];

  if (body.kind === "star") {
    chips.push({ label: "How hot", value: formatTemp(body.tempC, commas), note: "on the surface" });
    chips.push({ label: "A day", value: formatHours(body.dayHours, commas), note: "one spin, at its middle" });
    chips.push({ label: "How old", value: `${formatNumber(4_600_000_000, commas)} years`, note: "and only halfway through" });
    chips.push({ label: "Planets", value: "8", note: "plus dwarf planets and moons" });
    return chips;
  }

  const parent = bodyById(body.parent);
  if (parent.kind === "star") {
    chips.push({ label: "From the Sun", value: km(body.orbitKm), note: formatAu(body.orbitKm) });
    chips.push({ label: "A year", value: formatDays(body.orbitDays, commas), note: "one trip round the Sun" });
  } else {
    // Compared with how far our Moon is from Earth
    const vsMoon = body.orbitKm / MOON_ORBIT_KM;
    const moonNote = body.id === "moon"
      ? "about 30 Earths in a row"
      : vsMoon >= 0.95
        ? `${ratio(vsMoon, vsMoon < 10 ? 1 : 0)}× our Moon's distance`
        : `${ratio(1 / vsMoon, 1 / vsMoon < 10 ? 1 : 0)}× closer than our Moon`;
    chips.push({ label: `From ${parent.name}`, value: km(body.orbitKm), note: moonNote });
    chips.push({ label: "One lap", value: formatDays(body.orbitDays, commas), note: `once round ${parent.name}` });
  }
  if (body.dayHours != null) {
    chips.push({ label: "A day", value: formatHours(body.dayHours, commas), note: "one spin" });
  }
  if (body.tempC != null) {
    chips.push({ label: "Temperature", value: formatTemp(body.tempC, commas), note: tempNote(body.tempC) });
  }
  if (body.kind !== "moon") {
    const n = body.moonCount;
    chips.push({ label: "Moons", value: formatNumber(n, commas), note: n === 0 ? "none at all" : n === 1 ? "just the one" : "known so far" });
  }
  return chips;
}

function moonsTitle(body, moons) {
  const n = body.moonCount;
  if (n <= moons.length) return n === 1 ? "Its moon" : `Its ${n} moons`;
  return `${formatNumber(n)} known moons — the ${moons.length} biggest`;
}

// ── Close-Up Overlay ─────────────────────────────────────────────────────────

function KindLine({ body }) {
  const n = planetNumber(body);
  if (!n) return <>{describe(body)}</>;
  const color = n === 7 ? "#9B59B6" : NB_SOLID[String(n)];
  return (
    <>
      The <span style={{ color, fontWeight: 700 }}>{ordinal(n)}</span> planet from the Sun
    </>
  );
}

function BodyOverlay({ body, siblings, useCommas, speech, onPick, onClose }) {
  const accent = accentColor(lookFor(body.id));
  const parent = body.parent ? bodyById(body.parent) : null;
  const moons = moonsOf(body.id);
  const index = siblings.findIndex((b) => b.id === body.id);
  const prev = siblings[index - 1];
  const next = siblings[index + 1];
  const chips = factsFor(body, useCommas);
  const backToParent = parent && parent.kind !== "star";
  const picSize = body.kind === "moon" ? 136 : 150;

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div key={body.id} className="body-panel" onClick={(e) => e.stopPropagation()}>
        <div style={styles.panelTop}>
          <button className="toy-btn panel-btn" onClick={() => (backToParent ? onPick(parent.id) : onClose())}>
            ← {backToParent ? parent.name : "Solar System"}
          </button>
          <button className="toy-btn panel-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={styles.stage}>
          <button
            className="toy-btn nav-btn" disabled={!prev}
            onClick={() => prev && onPick(prev.id)} aria-label={prev ? `Previous: ${prev.name}` : "No previous"}
          >
            ◀
          </button>
          <div className="panel-pic" style={{ width: picSize, height: picSize }}>
            <BodyPicture look={lookFor(body.id)} size={picSize} />
          </div>
          <button
            className="toy-btn nav-btn" disabled={!next}
            onClick={() => next && onPick(next.id)} aria-label={next ? `Next: ${next.name}` : "No next"}
          >
            ▶
          </button>
        </div>

        <div style={styles.nameRow}>
          <span className="panel-name" style={{ color: accent }}>{body.name}</span>
          {speech.available && (
            <button
              className="toy-btn speak-btn"
              onClick={() => speech.speak(body.say ?? body.name)}
              aria-label={`Say ${body.name}`}
              style={{ animation: speech.speaking ? "speakPulse 0.8s ease-in-out infinite" : "none" }}
            >
              🔊
            </button>
          )}
        </div>
        <div className="panel-kind"><KindLine body={body} /></div>

        <div style={styles.chips}>
          {chips.map((chip) => (
            <div key={chip.label} style={styles.chip}>
              <div style={styles.chipLabel}>{chip.label}</div>
              <div style={styles.chipValue}>{chip.value}</div>
              {chip.note && <div style={styles.chipNote}>{chip.note}</div>}
            </div>
          ))}
        </div>

        <div className="panel-fact">{body.fact}</div>

        {moons.length > 0 && (
          <div style={styles.moons}>
            <div style={styles.moonsTitle}>{moonsTitle(body, moons)}</div>
            <div className="moons-row">
              {moons.map((m) => (
                <button key={m.id} className="moon-chip" onClick={() => onPick(m.id)}>
                  <span className="moon-chip-pic"><BodyPicture look={lookFor(m.id)} size={34} /></span>
                  <span className="moon-chip-name">{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────

function SolarSettings({ show, onClose, settings, update }) {
  const toggle = (key, label, hint) => (
    <div style={{ marginTop: 14 }}>
      <SettingsToggle checked={settings[key]} onChange={() => update(key, !settings[key])} label={label} hint={hint} />
    </div>
  );

  return (
    <SettingsOverlay show={show} onClose={onClose}>
      <div style={{ marginTop: -14 }}>
        {toggle("showNames", "Show names on the map", "Turn off to play a guessing game — tap to find out!")}
        {toggle("numberPlanets", "Number the planets", "1st to 8th from the Sun, in Numberblocks colors")}
        {toggle("showDwarfs", "Show the dwarf planets", "Ceres, Pluto, Haumea, Makemake and Eris")}
        {settings.showDwarfs && toggle("showCandidates", "Show dwarf planet candidates", "Orcus, Quaoar, Gonggong and Sedna — most astronomers count them too")}
        {toggle("realSizes", "Real sizes", "Everything shrinks next to Jupiter — and the Sun is enormous")}
        {toggle("realDistances", "Real distances", "Space is mostly empty: keep scrolling to reach Neptune!")}
        {toggle("useCommas", "Show commas in numbers", `e.g. ${settings.useCommas ? "778,479,000" : "778479000"} → ${settings.useCommas ? "778479000" : "778,479,000"}`)}
      </div>

      <SettingsDivider />
      <SettingsSection title="What's What">
        <SettingsAboutText>
          A <b>planet</b> goes round the Sun, is big enough that its own gravity has squeezed it
          into a ball, and has swept its path clear of everything else. There are eight.
        </SettingsAboutText>
        <SettingsAboutText>
          A <b>dwarf planet</b> is round too, but shares its neighbourhood with lots of other
          things. Pluto became one in 2006, when astronomers wrote down the rules. Five are
          official, and a few more are probably dwarf planets as well.
        </SettingsAboutText>
        <SettingsAboutText>
          An <b>asteroid</b> is a lump of rock or metal too small for gravity to squeeze into a
          ball. Millions of them live in the asteroid belt between Mars and Jupiter; the biggest
          few are in here.
        </SettingsAboutText>
        <SettingsAboutText>
          A <b>moon</b> goes round a planet, dwarf planet or asteroid instead of the Sun. Astronomers find
          new tiny ones all the time, so the counts here are from {MOONS_AS_OF}.
        </SettingsAboutText>
        <SettingsAboutText>
          <b>1 AU</b> (one astronomical unit) is the distance from the Sun to Earth — about
          150 million km. Neptune is 30 AU away.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="About">
        <SettingsAboutText>
          Made for my son, who loves numbers — and now the eight planets, nine dwarf planets,
          six asteroids and {BODIES.filter((b) => b.kind === "moon").length} moons in here, from
          the biggest (Ganymede) to a pebble just 1.4 km across.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="Credits">
        <SettingsAboutText>
          Sizes, distances and temperatures from{" "}
          <SettingsLink href="https://science.nasa.gov/solar-system/">NASA's solar system pages</SettingsLink>
          {" "}and planetary fact sheets; moon counts from the IAU Minor Planet Center.
        </SettingsAboutText>
        <SettingsAboutText>
          Planet numbers use the{" "}
          <span style={{ color: "#E41E20" }}>N</span>
          <span style={{ color: "#FF8C1A" }}>u</span>
          <span style={{ color: "#FFD030" }}>m</span>
          <span style={{ color: "#4AAF4E" }}>b</span>
          <span style={{ color: "#3A8FDE" }}>e</span>
          <span style={{ color: "#9B59B6" }}>r</span>
          <span style={{ color: "#F472B6" }}>b</span>
          <span style={{ color: "#8E8E93" }}>l</span>
          <span style={{ color: "#E41E20" }}>o</span>
          <span style={{ color: "#FF8C1A" }}>c</span>
          <span style={{ color: "#FFD030" }}>k</span>
          <span style={{ color: "#4AAF4E" }}>s</span>
          {" "}colors.
        </SettingsAboutText>
      </SettingsSection>
    </SettingsOverlay>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  showNames: true,
  numberPlanets: true,
  showDwarfs: true,
  showCandidates: true,
  realSizes: false,
  realDistances: false,
  useCommas: true,
};

export default function SolarSystem() {
  const [selectedId, setSelectedId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [visited, setVisited] = useState(() => new Set());
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const milestonesFired = useRef(new Set());
  const mapRef = useRef(null);
  const width = useElementWidth(mapRef);
  const speech = useSpeech({ lang: "en" });
  useScrollLock(!!selectedId);

  const update = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  const orbiters = useMemo(
    () => SUN_ORBITERS.filter((b) =>
      b.kind === "planet" || (settings.showDwarfs && (!b.candidate || settings.showCandidates))
    ),
    [settings.showDwarfs, settings.showCandidates]
  );

  const layout = useMemo(
    () => layoutMap(orbiters, SUN, NOTABLE_ASTEROIDS, { width, realSizes: settings.realSizes, realDistances: settings.realDistances }),
    [orbiters, width, settings.realSizes, settings.realDistances]
  );

  const selected = selectedId ? bodyById(selectedId) : null;

  // ◀ ▶ flip through whatever the body shares its orbit with: the Sun and its
  // orbiters, the asteroids of the belt, or the moons of the same world.
  const siblings = useMemo(() => {
    if (!selected) return [];
    if (selected.kind === "moon") return moonsOf(selected.parent);
    if (selected.kind === "asteroid") return NOTABLE_ASTEROIDS;
    return [SUN, ...orbiters];
  }, [selected, orbiters]);

  const showToast = (text) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  };

  const pick = (id) => {
    setSelectedId(id);
    setVisited((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  };

  // Milestones, each announced once
  useEffect(() => {
    const check = (key, ids, text) => {
      if (milestonesFired.current.has(key) || !ids.every((id) => visited.has(id))) return;
      milestonesFired.current.add(key);
      showToast(text);
    };
    check("galilean", GALILEAN_IDS, "🔭 Galileo's four moons — found in 1610!");
    check("planets", PLANET_IDS, "🎉 You've visited all 8 planets!");
    check("dwarfs", OFFICIAL_DWARF_IDS, "🏆 All five dwarf planets!");
    check("asteroids", ASTEROID_IDS, "🪨 Every asteroid in the belt!");
    check("everything", BODIES.map((b) => b.id), "🌌 You've seen every single one!");
  }, [visited]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  return (
    <div className="toy-container">
      <style>{`
        @keyframes factPop {
          0% { transform: translateX(-50%) scale(0.7); opacity: 0; }
          60% { transform: translateX(-50%) scale(1.05); }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes factOut {
          0% { transform: translateX(-50%) scale(1); opacity: 1; }
          100% { transform: translateX(-50%) scale(0.7); opacity: 0; }
        }
        @keyframes bodyReveal {
          0% { transform: scale(0.4); opacity: 0; }
          60% { transform: scale(1.06); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes speakPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .solar-map {
          position: relative; overflow: hidden;
          border-radius: 20px;
          background: rgba(0,0,0,0.18);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
        }
        .map-backdrop { position: absolute; inset: 0; pointer-events: none; }
        .map-belt-label, .map-tick-label, .map-gap-label {
          font-family: var(--font-body); font-size: 11px; letter-spacing: 1.5px;
          text-transform: uppercase; fill: rgba(255,255,255,0.4);
        }
        .map-gap-label { text-transform: none; letter-spacing: 0.5px; font-size: 13px; }
        .map-body {
          position: absolute; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          background: none; border: none; padding: 0; cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.15s ease;
        }
        .map-body:active { transform: translateX(-50%) scale(0.9); }
        .map-pic {
          position: relative; display: flex; align-items: center; justify-content: center;
          overflow: visible;
        }
        .map-dwarf-ring {
          position: absolute; border-radius: 50%;
          border: 1.5px dashed rgba(255,255,255,0.35);
          min-width: 30px; min-height: 30px;
        }
        .map-number {
          position: absolute; width: 18px; height: 18px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-heading); font-weight: 700; font-size: 11px; color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          box-shadow: 0 1px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3);
        }
        .map-label {
          font-family: var(--font-heading); font-weight: 600; font-size: 14px;
          color: rgba(255,255,255,0.9); white-space: nowrap;
          text-shadow: 0 1px 3px rgba(0,0,0,0.6);
        }
        .map-label-hidden { color: rgba(255,255,255,0.4); }
        .moon-row {
          position: absolute; transform: translateY(-50%);
          display: flex; flex-wrap: wrap; align-content: center;
        }
        .moon-dot, .belt-chip {
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
          background: none; border: none; padding: 0; cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.15s ease;
        }
        .moon-dot:active, .belt-chip:active { transform: scale(0.88); }
        .belt-chip {
          position: absolute; width: 56px; height: 40px;
          transform: translate(-50%, -50%);
        }
        .belt-chip:active { transform: translate(-50%, -50%) scale(0.88); }
        .chip-pic {
          height: 26px; width: 100%; display: flex; align-items: center; justify-content: center;
          overflow: visible;
        }
        .chip-name {
          font-family: var(--font-heading); font-weight: 600; font-size: 8.5px; line-height: 1.1; letter-spacing: -0.2px;
          color: rgba(255,255,255,0.85); white-space: nowrap; max-width: 100%;
          overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 2px rgba(0,0,0,0.6);
        }
        .map-link {
          position: absolute; left: 12px; right: 12px; height: 64px;
          display: flex; align-items: center; gap: 12px; padding: 0 16px;
          border-radius: 18px; text-decoration: none; color: #fff;
          background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(168,85,247,0.35));
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
          transition: transform 0.15s ease;
        }
        .map-link:active { transform: scale(0.97); }
        .map-link-stars { font-size: 26px; line-height: 1; }
        .map-link > span:nth-child(2) { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .map-link-title { font-family: var(--font-heading); font-weight: 700; font-size: 17px; }
        .map-link-sub { font-family: var(--font-body); font-size: 13px; color: rgba(255,255,255,0.7); }
        .map-link-arrow { font-size: 20px; color: rgba(255,255,255,0.7); }
        .overlay-backdrop {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.72);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 12px; cursor: pointer;
          animation: fadeIn 0.2s ease-out;
          overscroll-behavior: contain;
        }
        .body-panel {
          cursor: default; width: 100%; max-width: 380px;
          max-height: calc(100dvh - 24px); max-height: calc(var(--app-height, 100dvh) - 24px);
          overflow-y: auto; -webkit-overflow-scrolling: touch;
          background: linear-gradient(160deg, rgba(27,20,100,0.96) 0%, rgba(36,36,62,0.96) 100%);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          padding: 14px 16px 18px;
          display: flex; flex-direction: column; align-items: center;
          animation: popIn 0.3s ease-out;
        }
        .panel-btn {
          background: rgba(52,48,112,0.92); border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 600;
          padding: 8px 14px; border-radius: 12px; min-height: 36px;
          position: relative; z-index: 2; /* above the Sun's glow */
        }
        .nav-btn {
          width: 40px; height: 40px; border-radius: 50%; font-size: 15px; flex-shrink: 0;
          background: rgba(52,48,112,0.92); border: 1px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.85);
          position: relative; z-index: 2; /* above any rings that reach this far */
        }
        .nav-btn[disabled] { opacity: 0.2; }
        .panel-pic {
          display: flex; align-items: center; justify-content: center; overflow: visible;
          animation: bodyReveal 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
          filter: drop-shadow(0 8px 24px rgba(0,0,0,0.5));
        }
        .panel-name {
          font-family: var(--font-heading); font-size: 36px; font-weight: 700; line-height: 1.1;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .speak-btn {
          width: 36px; height: 36px; border-radius: 50%; font-size: 17px;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.12);
        }
        .panel-kind {
          font-family: var(--font-body); font-size: 15px; color: rgba(255,255,255,0.65);
          text-align: center; margin-top: 2px;
        }
        .panel-fact {
          font-family: var(--font-body); font-size: 14px; line-height: 1.45;
          color: rgba(255,255,255,0.85); text-align: center;
          background: rgba(255,208,48,0.08); border: 1px solid rgba(255,208,48,0.25);
          border-radius: 14px; padding: 10px 12px; margin-top: 12px; width: 100%;
        }
        .moons-row {
          display: flex; gap: 8px; overflow-x: auto; width: 100%;
          padding: 4px 2px 6px; -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .moons-row::-webkit-scrollbar { display: none; }
        .moon-chip {
          flex-shrink: 0; width: 80px; display: flex; flex-direction: column; align-items: center; gap: 4px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px; padding: 8px 4px 6px; cursor: pointer;
          transition: transform 0.15s ease;
        }
        .moon-chip:active { transform: scale(0.92); }
        .moon-chip-pic { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; overflow: visible; }
        .moon-chip-name {
          font-family: var(--font-heading); font-weight: 600; font-size: 11.5px;
          color: rgba(255,255,255,0.85); white-space: nowrap; max-width: 100%;
          overflow: hidden; text-overflow: ellipsis;
        }
      `}</style>

      <BackgroundDots count={24} />

      <StickyHeader
        title="Solar System"
        subtitle="Tap a world to see it up close!"
        onGearClick={() => setShowSettings(true)}
      />

      <SolarSettings
        show={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        update={update}
      />

      <div ref={mapRef} style={styles.mapWrap}>
        <SolarMap
          layout={layout}
          width={width}
          showNames={settings.showNames}
          numberPlanets={settings.numberPlanets}
          onPick={pick}
        />
      </div>

      <div style={styles.toastAnchor}>
        <Toast
          text={toast}
          variant="info"
          position="top"
          enterAnimation="factPop 0.35s ease-out forwards"
          exitAnimation="factOut 0.35s ease-in forwards"
        />
      </div>

      {selected && (
        <BodyOverlay
          body={selected}
          siblings={siblings}
          useCommas={settings.useCommas}
          speech={speech}
          onPick={pick}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  mapWrap: {
    width: "100%", maxWidth: 400,
    position: "relative", zIndex: 1,
  },
  toastAnchor: {
    position: "fixed", left: 0, right: 0,
    top: "calc(var(--safe-top) + 100px)",
    height: 0, zIndex: 200, pointerEvents: "none",
  },
  panelTop: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    width: "100%", marginBottom: 6,
  },
  stage: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    width: "100%", gap: 8, minHeight: 150,
  },
  nameRow: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    marginTop: 12, maxWidth: "100%",
  },
  chips: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
    width: "100%", marginTop: 12,
  },
  chip: {
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14, padding: "8px 10px", minWidth: 0,
  },
  chipLabel: {
    fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 1.5,
    textTransform: "uppercase", color: "rgba(255,255,255,0.45)",
  },
  chipValue: {
    fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17,
    color: "#fff", marginTop: 2, lineHeight: 1.2, overflowWrap: "anywhere",
  },
  chipNote: {
    fontFamily: "var(--font-body)", fontSize: 11, lineHeight: 1.3,
    color: "rgba(255,255,255,0.55)", marginTop: 2,
  },
  moons: {
    width: "100%", marginTop: 12,
  },
  moonsTitle: {
    fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: 1.5,
    textTransform: "uppercase", color: "rgba(255,255,255,0.45)",
    marginBottom: 4, textAlign: "center",
  },
};
