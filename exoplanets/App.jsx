import { useState, useRef, useEffect, useMemo } from "react";
import {
  WORLDS, STARS_BY_DISTANCE, worldById, planetsOf, describe,
  formatLightYears, lightTravel, sizeVsEarth, massVsEarth, sizeVsSun, formatDays,
  KNOWN_EXOPLANETS, PLANETS_AS_OF, LIGHT_YEAR_KM, SUN_RADIUS_KM, EARTH_RADIUS_KM,
} from "./exoplanets.js";
import { formatNumber, trimTo } from "../shared/formatUtils.js";
import { layoutStars } from "./exoLayout.js";
import { lookFor } from "./exoLooks.js";
import { StarMap } from "./StarMap.jsx";
import { BodyPicture } from "../shared/BodyPicture.jsx";
import { accentColor } from "../shared/bodyArt.js";
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

const STAR_IDS = STARS_BY_DISTANCE.map((s) => s.id);
const TRAPPIST_IDS = planetsOf("trappist1").map((p) => p.id);
const LICH_IDS = planetsOf("lich").map((p) => p.id);
const KEPLER90_IDS = planetsOf("kepler90").map((p) => p.id);
const TOAST_MS = 3500;

// ── Fact Chips ───────────────────────────────────────────────────────────────

function roundSig(x, sig = 3) {
  if (x === 0) return 0;
  const p = Math.pow(10, Math.floor(Math.log10(x)) - sig + 1);
  return Math.round(x / p) * p;
}

function formatTemp(tempC, commas) {
  return `${tempC < 0 ? "−" : ""}${formatNumber(Math.abs(tempC), commas)} °C`;
}

function tempNote(tempC) {
  if (tempC >= 3000) return "hotter than some stars";
  if (tempC >= 1000) return "hot enough to melt rock";
  if (tempC >= 300) return "hot enough to melt lead";
  if (tempC >= 100) return "hotter than boiling water";
  if (tempC > 30) return "a very hot day";
  if (tempC >= 0) return "just right for us";
  if (tempC > -100) return "colder than a freezer";
  return "colder than anywhere on Earth";
}

function factsFor(world, commas) {
  const km = (v) => `${formatNumber(Math.round(v), commas)} km`;
  const farNote = (ly) => (ly === 0 ? lightTravel(0) : `about ${km(roundSig(ly * LIGHT_YEAR_KM))}`);

  if (world.kind === "star") {
    const isSun = world.id === "sun";
    return [
      { label: "How wide", value: km(world.radiusSun * SUN_RADIUS_KM * 2), note: isSun ? "109× wider than Earth" : sizeVsSun(world.radiusSun, commas) },
      { label: "How hot", value: formatTemp(roundSig(Math.round(world.tempK - 273)), commas), note: world.starType === "pulsar" ? "and that's the cool part" : "on the surface" },
      { label: "How far", value: isSun ? "Right here" : formatLightYears(world.distanceLy, commas), note: farNote(world.distanceLy) },
      { label: "Planets", value: formatNumber(world.planetCount, commas), note: world.id === "sun" ? "and you know them all" : "found so far" },
    ];
  }

  const star = worldById(world.parent);
  const chips = [];
  if (world.radiusEarth) {
    chips.push({ label: "How wide", value: km(world.radiusEarth * EARTH_RADIUS_KM * 2), note: sizeVsEarth(world.radiusEarth, commas) });
  } else {
    const m = world.massEarth;
    chips.push({ label: "How heavy", value: `${formatNumber(trimTo(m, m < 10 ? 2 : 0), commas)}× Earth`, note: m < 0.87 ? massVsEarth(m, commas) : "nobody has measured its width yet" });
  }
  chips.push({ label: "A year", value: formatDays(world.orbitDays, commas), note: `one trip round ${star.name}` });
  if (world.tempC != null) chips.push({ label: "Temperature", value: formatTemp(world.tempC, commas), note: tempNote(world.tempC) });
  chips.push({ label: "How far", value: formatLightYears(star.distanceLy, commas), note: lightTravel(star.distanceLy) });
  chips.push({ label: "Found in", value: String(world.found), note: world.foundBy });
  return chips;
}

// ── Close-Up Overlay ─────────────────────────────────────────────────────────

function WorldOverlay({ world, siblings, useCommas, speech, onPick, onClose }) {
  const isStar = world.kind === "star";
  const accent = accentColor(lookFor(world.id));
  const parent = isStar ? null : worldById(world.parent);
  const planets = isStar ? planetsOf(world.id) : [];
  const index = siblings.findIndex((w) => w.id === world.id);
  const prev = siblings[index - 1];
  const next = siblings[index + 1];
  const chips = factsFor(world, useCommas);
  const picSize = isStar ? 136 : 150;

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div key={world.id} className="body-panel" onClick={(e) => e.stopPropagation()}>
        <div style={styles.panelTop}>
          <button className="toy-btn panel-btn" onClick={() => (parent ? onPick(parent.id) : onClose())}>
            ← {parent ? parent.name : "Star map"}
          </button>
          <button className="toy-btn panel-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {!isStar && <div className="guess-ribbon">🎨 Nobody has seen it — this is an artist's guess!</div>}

        <div style={styles.stage}>
          <button
            className="toy-btn nav-btn" disabled={!prev}
            onClick={() => prev && onPick(prev.id)} aria-label={prev ? `Previous: ${prev.name}` : "No previous"}
          >
            ◀
          </button>
          <div className="panel-pic" style={{ width: picSize, height: picSize }}>
            <BodyPicture look={lookFor(world.id)} size={picSize} />
          </div>
          <button
            className="toy-btn nav-btn" disabled={!next}
            onClick={() => next && onPick(next.id)} aria-label={next ? `Next: ${next.name}` : "No next"}
          >
            ▶
          </button>
        </div>

        <div style={styles.nameRow}>
          <span className="panel-name" style={{ color: accent }}>{world.name}</span>
          {speech.available && (
            <button
              className="toy-btn speak-btn"
              onClick={() => speech.speak(world.say ?? world.name)}
              aria-label={`Say ${world.name}`}
              style={{ animation: speech.speaking ? "speakPulse 0.8s ease-in-out infinite" : "none" }}
            >
              🔊
            </button>
          )}
        </div>
        <div className="panel-kind">{describe(world)}</div>
        {world.habitable && <div className="water-badge">💧 Could have liquid water</div>}

        <div style={styles.chips}>
          {chips.map((chip) => (
            <div key={chip.label} style={styles.chip}>
              <div style={styles.chipLabel}>{chip.label}</div>
              <div style={styles.chipValue}>{chip.value}</div>
              {chip.note && <div style={styles.chipNote}>{chip.note}</div>}
            </div>
          ))}
        </div>

        <div className="panel-fact">{world.fact}</div>

        {isStar && world.link && (
          <a className="toy-btn visit-link" href={world.link}>🪐 Visit the Solar System ➜</a>
        )}

        {planets.length > 0 && (
          <div style={styles.planets}>
            <div style={styles.planetsTitle}>{planets.length === 1 ? "Its planet" : `Its ${planets.length} planets`}</div>
            <div className="planets-row">
              {planets.map((p) => (
                <button key={p.id} className="world-chip" onClick={() => onPick(p.id)}>
                  <span className="world-chip-pic"><BodyPicture look={lookFor(p.id)} size={34} /></span>
                  <span className="world-chip-name">{p.name}</span>
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

function ExoSettings({ show, onClose, settings, update }) {
  const toggle = (key, label, hint) => (
    <div style={{ marginTop: 14 }}>
      <SettingsToggle checked={settings[key]} onChange={() => update(key, !settings[key])} label={label} hint={hint} />
    </div>
  );

  return (
    <SettingsOverlay show={show} onClose={onClose}>
      <div style={{ marginTop: -14 }}>
        {toggle("showNames", "Show names on the map", "Turn off to play a guessing game — tap to find out!")}
        {toggle("waterMarks", "Mark the just-right planets", "💧 on the planets where water could be liquid")}
        {toggle("realSizes", "Real sizes", "Stars are enormous and planets are specks — even the big ones")}
        {toggle("useCommas", "Show commas in numbers", `e.g. ${settings.useCommas ? "40,100,000,000,000" : "40100000000000"} → ${settings.useCommas ? "40100000000000" : "40,100,000,000,000"}`)}
      </div>

      <SettingsDivider />
      <SettingsSection title="What's What">
        <SettingsAboutText>
          An <b>exoplanet</b> is a planet that goes round a different star, not our Sun. The first
          ones were found in 1992; now more than {formatNumber(KNOWN_EXOPLANETS)} are known
          (as of {PLANETS_AS_OF}), and astronomers find more every week.
        </SettingsAboutText>
        <SettingsAboutText>
          A <b>light-year</b> is how far light travels in one year — about
          {" "}{formatNumber(roundSig(LIGHT_YEAR_KM, 3))} km. Light is the fastest thing there is,
          and it still takes more than 4 years to reach us from the nearest star.
        </SettingsAboutText>
        <SettingsAboutText>
          The <b>just-right zone</b> is the band round a star where a planet is not too hot and
          not too cold for liquid water. 💧 marks the planets that sit in it. Being in the zone
          doesn't mean a planet has water — just that it could.
        </SettingsAboutText>
        <SettingsAboutText>
          <b>How do we find them?</b> Mostly by watching a star get a tiny bit dimmer when a
          planet passes in front of it (the Kepler and TESS space telescopes), or by watching a
          star wobble as its planet tugs on it. We hardly ever see the planet itself.
        </SettingsAboutText>
        <SettingsAboutText>
          That's why every planet picture here is a <b>guess</b>: nobody has seen any of these
          worlds up close. The looks are made up from what we know about each one's size, weight
          and heat.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="About">
        <SettingsAboutText>
          Made for my son, who loves numbers — and now {STARS_BY_DISTANCE.length - 1} other
          stars and {WORLDS.filter((w) => w.kind === "planet").length} of their planets, from a
          pebble twice the weight of our Moon to a giant hotter than some stars.
        </SettingsAboutText>
      </SettingsSection>

      <SettingsDivider />
      <SettingsSection title="Credits">
        <SettingsAboutText>
          Sizes, weights, orbits and distances from the{" "}
          <SettingsLink href="https://exoplanetarchive.ipac.caltech.edu/">NASA Exoplanet Archive</SettingsLink>;
          proper names like Dimidium and Janssen from the IAU's NameExoWorlds votes.
        </SettingsAboutText>
      </SettingsSection>
    </SettingsOverlay>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  showNames: true,
  waterMarks: true,
  realSizes: false,
  useCommas: true,
};

export default function Exoplanets() {
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

  const layout = useMemo(
    () => layoutStars(STARS_BY_DISTANCE, { width, realSizes: settings.realSizes }),
    [width, settings.realSizes]
  );

  const selected = selectedId ? worldById(selectedId) : null;

  // ◀ ▶ hop from star to star, or from planet to planet round the same star.
  const siblings = useMemo(() => {
    if (!selected) return [];
    return selected.kind === "star" ? STARS_BY_DISTANCE : planetsOf(selected.parent);
  }, [selected]);

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
    check("first", ["dimidium"], "🏆 The first planet found round a star like the Sun — 1995!");
    check("lich", LICH_IDS, "👻 The very first exoplanets, found in 1992!");
    check("trappist", TRAPPIST_IDS, "🪐 All seven TRAPPIST-1 planets!");
    check("kepler90", KEPLER90_IDS, "8️⃣ Eight planets — just like home!");
    check("stars", STAR_IDS, "🌟 You've hopped to every star!");
    check("everything", WORLDS.map((w) => w.id), "🌌 You've seen every single world!");
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
        @keyframes twinkle {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .star-map {
          position: relative; overflow: hidden;
          border-radius: 20px;
          background: rgba(0,0,0,0.18);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
        }
        .map-backdrop { position: absolute; inset: 0; pointer-events: none; }
        .map-star {
          position: absolute; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 1px;
          background: none; border: none; padding: 0; cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.15s ease;
        }
        .map-star:active { transform: translateX(-50%) scale(0.9); }
        .map-pic {
          position: relative; display: flex; align-items: center; justify-content: center;
          overflow: visible;
        }
        .map-label {
          font-family: var(--font-heading); font-weight: 600; font-size: 13px; line-height: 1.15;
          color: rgba(255,255,255,0.9); white-space: nowrap; max-width: 118px;
          overflow: hidden; text-overflow: ellipsis;
          text-shadow: 0 1px 3px rgba(0,0,0,0.6);
        }
        .map-label-hidden { color: rgba(255,255,255,0.4); }
        .map-distance {
          font-family: var(--font-body); font-size: 10.5px; color: rgba(255,255,255,0.5);
          white-space: nowrap;
        }
        .planet-row {
          position: absolute; transform: translateY(-50%);
          display: flex; flex-wrap: wrap; align-content: center;
        }
        .planet-chip {
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
          background: none; border: none; padding: 0; cursor: pointer;
          -webkit-tap-highlight-color: transparent; text-decoration: none;
          transition: transform 0.15s ease;
        }
        .planet-chip:active { transform: scale(0.88); }
        .chip-pic {
          position: relative; width: 100%; display: flex; align-items: center; justify-content: center;
          overflow: visible;
        }
        .chip-water { position: absolute; right: 2px; top: -4px; font-size: 11px; line-height: 1; }
        .chip-name {
          font-family: var(--font-heading); font-weight: 600; font-size: 9px; line-height: 1.1;
          color: rgba(255,255,255,0.85); white-space: nowrap; max-width: 100%;
          overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 2px rgba(0,0,0,0.6);
        }
        .chip-letter { font-size: 13px; }
        .link-chip {
          width: 118px !important; height: 50px !important; border-radius: 14px;
          background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(168,85,247,0.35));
          border: 1px solid rgba(255,255,255,0.18) !important;
        }
        .link-chip .chip-name { font-size: 11px; color: #fff; }
        .link-chip-icon { font-size: 20px; line-height: 1; }
        .map-footer {
          font-family: var(--font-body); font-size: 13px; color: rgba(255,255,255,0.5);
          text-align: center; margin-top: 14px; padding: 0 12px; max-width: 400px;
          position: relative; z-index: 1;
        }
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
          position: relative; z-index: 2; /* above a star's glow and beams */
        }
        .nav-btn {
          width: 40px; height: 40px; border-radius: 50%; font-size: 15px; flex-shrink: 0;
          background: rgba(52,48,112,0.92); border: 1px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.85);
          position: relative; z-index: 2;
        }
        .nav-btn[disabled] { opacity: 0.2; }
        .guess-ribbon {
          font-family: var(--font-body); font-size: 12px; color: rgba(255,255,255,0.75);
          background: rgba(255,255,255,0.08); border: 1px dashed rgba(255,255,255,0.3);
          border-radius: 999px; padding: 4px 12px; margin-top: 8px; text-align: center;
        }
        .panel-pic {
          display: flex; align-items: center; justify-content: center; overflow: visible;
          animation: bodyReveal 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
          filter: drop-shadow(0 8px 24px rgba(0,0,0,0.5));
        }
        .panel-name {
          font-family: var(--font-heading); font-size: 32px; font-weight: 700; line-height: 1.1;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4); text-align: center;
        }
        .speak-btn {
          width: 36px; height: 36px; border-radius: 50%; font-size: 17px; flex-shrink: 0;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.12);
        }
        .panel-kind {
          font-family: var(--font-body); font-size: 15px; color: rgba(255,255,255,0.65);
          text-align: center; margin-top: 2px;
        }
        .water-badge {
          margin-top: 8px; font-family: var(--font-heading); font-weight: 600; font-size: 13px;
          color: #9ad8ff; background: rgba(58,143,222,0.18); border: 1px solid rgba(58,143,222,0.45);
          border-radius: 999px; padding: 4px 12px;
        }
        .panel-fact {
          font-family: var(--font-body); font-size: 14px; line-height: 1.45;
          color: rgba(255,255,255,0.85); text-align: center;
          background: rgba(255,208,48,0.08); border: 1px solid rgba(255,208,48,0.25);
          border-radius: 14px; padding: 10px 12px; margin-top: 12px; width: 100%;
        }
        .visit-link {
          margin-top: 12px; padding: 12px 20px; border-radius: 14px; font-size: 16px;
          background: linear-gradient(135deg, #6366f1, #a855f7); text-decoration: none;
          box-shadow: 0 6px 18px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .planets-row {
          display: flex; gap: 8px; overflow-x: auto; width: 100%;
          padding: 4px 2px 6px; -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .planets-row::-webkit-scrollbar { display: none; }
        .world-chip {
          flex-shrink: 0; width: 86px; display: flex; flex-direction: column; align-items: center; gap: 4px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px; padding: 8px 4px 6px; cursor: pointer;
          transition: transform 0.15s ease;
        }
        .world-chip:active { transform: scale(0.92); }
        .world-chip-pic { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; overflow: visible; }
        .world-chip-name {
          font-family: var(--font-heading); font-weight: 600; font-size: 11px;
          color: rgba(255,255,255,0.85); white-space: nowrap; max-width: 100%;
          overflow: hidden; text-overflow: ellipsis;
        }
      `}</style>

      <BackgroundDots count={30} />

      <StickyHeader
        title="Exoplanets"
        subtitle="Hop from star to star!"
        onGearClick={() => setShowSettings(true)}
      />

      <ExoSettings
        show={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        update={update}
      />

      <div ref={mapRef} style={styles.mapWrap}>
        <StarMap
          layout={layout}
          width={width}
          showNames={settings.showNames}
          waterMarks={settings.waterMarks}
          onPick={pick}
        />
      </div>
      <div className="map-footer">
        …and that's just a few of them. Astronomers have found {formatNumber(KNOWN_EXOPLANETS, settings.useCommas)} planets
        round other stars so far, and the count goes up every week!
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
        <WorldOverlay
          world={selected}
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
  planets: {
    width: "100%", marginTop: 12,
  },
  planetsTitle: {
    fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: 1.5,
    textTransform: "uppercase", color: "rgba(255,255,255,0.45)",
    marginBottom: 4, textAlign: "center",
  },
};
