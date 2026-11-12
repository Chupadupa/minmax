import { useState, useRef, useEffect } from "react";

// ── Visits ───────────────────────────────────────────────────────────────────
// For toys where you tap things to open them: which one is open, which have been
// opened so far, and a toast the first time a whole set has been visited.
//
//   const MILESTONES = [
//     { key: "planets", ids: PLANET_IDS, text: "🎉 You've visited all 8 planets!" },
//   ];
//   const { selectedId, pick, close, toast } = useVisits(MILESTONES);
//
// `pick(id)` opens one (and counts it as visited); `close()` shuts it. `toast`
// is the milestone text to show, or null — each milestone is announced once,
// and when one visit finishes several, the last in the list wins.

const TOAST_MS = 3500;

export function useVisits(milestones) {
  const [selectedId, setSelectedId] = useState(null);
  const [visited, setVisited] = useState(() => new Set());
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const announced = useRef(new Set());

  const pick = (id) => {
    setSelectedId(id);
    setVisited((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  };

  useEffect(() => {
    for (const { key, ids, text } of milestones) {
      if (announced.current.has(key) || !ids.every((id) => visited.has(id))) continue;
      announced.current.add(key);
      clearTimeout(toastTimer.current);
      setToast(text);
      toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
    }
  }, [visited, milestones]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  return { selectedId, pick, close: () => setSelectedId(null), toast };
}
