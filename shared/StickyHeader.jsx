// ── Sticky Header ────────────────────────────────────────────────────────────
//
// Consistent sticky header for all toys. Stays pinned at the top of the
// viewport when the page scrolls, with a frosted-glass background and
// drop shadow so it floats over content.
//
// Usage:
//   <StickyHeader
//     title="Big Number Namer"
//     subtitle="How many zeros?"
//     onGearClick={() => setShowSettings(true)}  // optional
//     titleStyle={{ fontSize: 26 }}              // optional
//   />

export function StickyHeader({ title, subtitle, titleStyle, onGearClick }) {
  return (
    <div className="sticky-header">
      <div className="page-header">
        <a href="../" className="back-btn" aria-label="Back to home">⬅️</a>
        {onGearClick && (
          <button className="gear-btn" onClick={onGearClick} aria-label="Settings">⚙</button>
        )}
        <h1 className="gradient-text" style={titleStyle}>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
