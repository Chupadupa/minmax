// ── Settings Overlay ──────────────────────────────────────────────────────────
//
// Shared modal shell for toy settings. Pass toy-specific content as children.
// Also exports helper sub-components: SettingsToggle, SettingsDivider,
// SettingsSection, and SettingsLink.

import { useScrollLock } from "./useScrollLock.js";

// ── Main Overlay ─────────────────────────────────────────────────────────────

export function SettingsOverlay({ show, onClose, title = "Settings", children }) {
  useScrollLock(show);
  if (!show) return null;

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.panel} onClick={(e) => e.stopPropagation()}>
        <button style={S.closeBtn} onClick={onClose}>✕</button>
        <h2 style={S.heading}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

// ── Toggle Checkbox ──────────────────────────────────────────────────────────

export function SettingsToggle({ checked, onChange, label, hint }) {
  return (
    <>
      <label style={S.toggle}>
        <div
          style={{
            ...S.checkbox,
            background: checked ? "#4AAF4E" : "rgba(255,255,255,0.15)",
            borderColor: checked ? "#4AAF4E" : "rgba(255,255,255,0.25)",
          }}
          onClick={onChange}
        >
          {checked && <span style={S.checkmark}>✓</span>}
        </div>
        <span style={S.toggleLabel}>{label}</span>
      </label>
      {hint && <p style={S.toggleHint}>{hint}</p>}
    </>
  );
}

// ── Divider ──────────────────────────────────────────────────────────────────

export function SettingsDivider() {
  return <div style={S.divider} />;
}

// ── Section ──────────────────────────────────────────────────────────────────

export function SettingsSection({ title, children }) {
  return (
    <>
      <h3 style={S.subheading}>{title}</h3>
      {children}
    </>
  );
}

// ── Link ─────────────────────────────────────────────────────────────────────

export function SettingsLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={S.link}
    >
      {children}
    </a>
  );
}

// ── About Text ───────────────────────────────────────────────────────────────

export function SettingsAboutText({ children }) {
  return <p style={S.aboutText}>{children}</p>;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const S = {
  backdrop: {
    position: "fixed", inset: 0, zIndex: 100,
    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20,
    animation: "fadeIn 0.2s ease-out",
  },
  panel: {
    background: "linear-gradient(160deg, #1B1464 0%, #302B63 100%)",
    borderRadius: 24, padding: "28px 24px",
    width: "100%", maxWidth: 360,
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    position: "relative",
    maxHeight: "85vh", overflowY: "auto",
    fontFamily: "var(--font-heading)", color: "#fff",
    animation: "popIn 0.3s ease-out",
  },
  closeBtn: {
    position: "absolute", top: 16, right: 16,
    background: "rgba(255,255,255,0.1)", border: "none",
    color: "rgba(255,255,255,0.7)", fontSize: 16,
    width: 32, height: 32, borderRadius: 10,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-heading)",
  },
  heading: {
    fontSize: 22, fontWeight: 700, margin: "0 0 20px",
    background: "linear-gradient(135deg, #FF8C1A, #FFD030, #4AAF4E, #3A8FDE)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  toggle: {
    display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
  },
  checkbox: {
    width: 28, height: 28, borderRadius: 8,
    border: "2px solid", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "all 0.15s ease",
  },
  checkmark: {
    color: "#fff", fontSize: 16, fontWeight: 700,
  },
  toggleLabel: {
    fontSize: 15, color: "rgba(255,255,255,0.85)",
    fontFamily: "var(--font-body)",
  },
  toggleHint: {
    fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "6px 0 0 40px",
    fontFamily: "var(--font-body)",
  },
  divider: {
    height: 1, background: "rgba(255,255,255,0.08)",
    margin: "20px 0",
  },
  subheading: {
    fontSize: 16, fontWeight: 600, margin: "0 0 8px",
    color: "rgba(255,255,255,0.7)",
  },
  aboutText: {
    fontSize: 14, lineHeight: 1.6, margin: "0 0 10px",
    color: "rgba(255,255,255,0.55)",
    fontFamily: "var(--font-body)",
  },
  link: {
    color: "#48DBFB", textDecoration: "none",
    borderBottom: "1px solid rgba(72,219,251,0.3)",
  },
};
