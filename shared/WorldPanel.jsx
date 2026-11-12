import { BodyPicture } from "./BodyPicture.jsx";
import { accentColor } from "./bodyArt.js";

// ── World Panel ──────────────────────────────────────────────────────────────
// The close-up the space toys open when a world is tapped: the world big, with
// ◀ ▶ to its neighbors, its name (and a 🔊 button), what it is, fact chips, a
// fun fact, and a row of the worlds that go round it.
//
//   <WorldPanel
//     world={body} lookFor={lookFor} siblings={siblings}
//     back={parent} homeLabel="Solar System"
//     kind={describe(body)} chips={factsFor(body)}
//     related={{ title: "Its 2 moons", items: moons }}
//     speech={speech} onPick={pick} onClose={close}
//   />
//
// world      { id, name, say?, fact } — `say` is a spelling for text-to-speech
// lookFor    the toy's id → look function, for the pictures
// siblings   the worlds ◀ ▶ step through, in order
// back       the world the top-left button climbs up to; without one it reads
//            "← {homeLabel}" and closes the panel
// kind       the line under the name; `ribbon` (above the picture), `badge`
//            (under the kind line) and `extra` (under the fact) are optional
// chips      [{ label, value, note? }]
// related    { title, items, chipWidth?, nameSize? } — tappable worlds; leave it
//            out (or falsy) when there are none
// speech     from useSpeech
// onPick(id) opens another world; onClose() shuts the panel
// picSize, nameSize   the picture's diameter and the name's font size, in px

export function WorldPanel({
  world, lookFor, siblings, back, homeLabel,
  kind, ribbon, badge, chips, extra, related,
  speech, onPick, onClose,
  picSize = 150, nameSize = 36,
}) {
  const look = lookFor(world.id);
  const index = siblings.findIndex((w) => w.id === world.id);
  const prev = siblings[index - 1];
  const next = siblings[index + 1];

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <style>{PANEL_CSS}</style>
      <div key={world.id} className="body-panel" onClick={(e) => e.stopPropagation()}>
        <div style={styles.top}>
          <button className="toy-btn panel-btn" onClick={() => (back ? onPick(back.id) : onClose())}>
            ← {back ? back.name : homeLabel}
          </button>
          <button className="toy-btn panel-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {ribbon}

        <div style={styles.stage}>
          <button
            className="toy-btn nav-btn" disabled={!prev}
            onClick={() => prev && onPick(prev.id)} aria-label={prev ? `Previous: ${prev.name}` : "No previous"}
          >
            ◀
          </button>
          <div className="panel-pic" style={{ width: picSize, height: picSize }}>
            <BodyPicture look={look} size={picSize} />
          </div>
          <button
            className="toy-btn nav-btn" disabled={!next}
            onClick={() => next && onPick(next.id)} aria-label={next ? `Next: ${next.name}` : "No next"}
          >
            ▶
          </button>
        </div>

        <div style={styles.nameRow}>
          <span className="panel-name" style={{ color: accentColor(look), fontSize: nameSize }}>{world.name}</span>
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
        <div className="panel-kind">{kind}</div>
        {badge}

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

        {extra}

        {related && (
          <div style={styles.related}>
            <div style={styles.relatedTitle}>{related.title}</div>
            <div className="related-row">
              {related.items.map((item) => (
                <button
                  key={item.id} className="related-chip"
                  style={{ width: related.chipWidth ?? 80 }} onClick={() => onPick(item.id)}
                >
                  <span className="related-chip-pic"><BodyPicture look={lookFor(item.id)} size={34} /></span>
                  <span className="related-chip-name" style={{ fontSize: related.nameSize ?? 11.5 }}>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

// Classes rather than inline styles where a rule needs :active, [disabled] or
// a scrollbar pseudo-element — or is animated.
const PANEL_CSS = `
  @keyframes bodyReveal {
    0% { transform: scale(0.4); opacity: 0; }
    60% { transform: scale(1.06); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes speakPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
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
    position: relative; z-index: 2; /* above any rings that reach this far */
  }
  .nav-btn[disabled] { opacity: 0.2; }
  .panel-pic {
    display: flex; align-items: center; justify-content: center; overflow: visible;
    animation: bodyReveal 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
    filter: drop-shadow(0 8px 24px rgba(0,0,0,0.5));
  }
  .panel-name {
    font-family: var(--font-heading); font-weight: 700; line-height: 1.1;
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
  .panel-fact {
    font-family: var(--font-body); font-size: 14px; line-height: 1.45;
    color: rgba(255,255,255,0.85); text-align: center;
    background: rgba(255,208,48,0.08); border: 1px solid rgba(255,208,48,0.25);
    border-radius: 14px; padding: 10px 12px; margin-top: 12px; width: 100%;
  }
  .related-row {
    display: flex; gap: 8px; overflow-x: auto; width: 100%;
    padding: 4px 2px 6px; -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .related-row::-webkit-scrollbar { display: none; }
  .related-chip {
    flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 4px;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px; padding: 8px 4px 6px; cursor: pointer;
    transition: transform 0.15s ease;
  }
  .related-chip:active { transform: scale(0.92); }
  .related-chip-pic { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; overflow: visible; }
  .related-chip-name {
    font-family: var(--font-heading); font-weight: 600;
    color: rgba(255,255,255,0.85); white-space: nowrap; max-width: 100%;
    overflow: hidden; text-overflow: ellipsis;
  }
`;

const styles = {
  top: {
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
  related: {
    width: "100%", marginTop: 12,
  },
  relatedTitle: {
    fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: 1.5,
    textTransform: "uppercase", color: "rgba(255,255,255,0.45)",
    marginBottom: 4, textAlign: "center",
  },
};
