import { useRef, useCallback, useMemo } from "react";
import {
  minuteAngle,
  hourAngle,
  pointerToAngle,
} from "./clockUtils.js";
import { getNumberBlockStyle } from "../shared/numberblockColors.js";

// ── Constants ────────────────────────────────────────────────────────────────

const SVG_SIZE = 300;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const CLOCK_R = 130;

const MINUTE_HAND_COLOR = "#3A8FDE";
const HOUR_HAND_COLOR = "#E41E20";
const SECOND_HAND_COLOR = "#FF8C1A";
const CENTER_DOT_COLOR = "#FFD030";

// Build hour→style map using getNumberBlockStyle for proper decade colors
const HOUR_STYLES = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => [i + 1, getNumberBlockStyle(i + 1)])
);

// ── Analog Clock ─────────────────────────────────────────────────────────────

export function AnalogClock({ hours, minutes, seconds, dragging, onDragStart, onDragMove, onDragEnd, style: svgStyle }) {
  const svgRef = useRef(null);

  const hAngle = hourAngle(hours, minutes);
  const mAngle = minuteAngle(minutes);

  const getSvgPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: CX, y: CY };
    const rect = svg.getBoundingClientRect();
    const scaleX = SVG_SIZE / rect.width;
    const scaleY = SVG_SIZE / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = useCallback((hand, e) => {
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);
    const pt = getSvgPoint(e);
    onDragStart(hand, pointerToAngle(CX, CY, pt.x, pt.y));
  }, [getSvgPoint, onDragStart]);

  const handlePointerMove = useCallback((e) => {
    if (!dragging) return;
    const pt = getSvgPoint(e);
    onDragMove(pointerToAngle(CX, CY, pt.x, pt.y));
  }, [dragging, getSvgPoint, onDragMove]);

  const handlePointerUp = useCallback(() => {
    if (dragging) onDragEnd();
  }, [dragging, onDragEnd]);

  // Hour markers and numbers
  const hourMarkers = useMemo(() => {
    const items = [];
    for (let h = 1; h <= 12; h++) {
      const angle = (h * 30 - 90) * (Math.PI / 180);
      const numR = CLOCK_R - 22;
      const dotR = CLOCK_R - 4;
      items.push(
        <circle
          key={`dot-${h}`}
          cx={CX + dotR * Math.cos(angle)}
          cy={CY + dotR * Math.sin(angle)}
          r={4}
          fill={HOUR_STYLES[h].background}
          stroke={HOUR_STYLES[h].border || "none"}
          strokeWidth={HOUR_STYLES[h].border ? 1.5 : 0}
          opacity={0.8}
        />,
        <text
          key={`num-${h}`}
          x={CX + numR * Math.cos(angle)}
          y={CY + numR * Math.sin(angle)}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.85)"
          fontSize={16}
          fontWeight={600}
          fontFamily="var(--font-heading)"
        >
          {h}
        </text>
      );
    }
    return items;
  }, []);

  // Minute tick marks
  const minuteTicks = useMemo(() => {
    const items = [];
    for (let m = 0; m < 60; m++) {
      if (m % 5 === 0) continue; // skip hour positions
      const angle = (m * 6 - 90) * (Math.PI / 180);
      const r1 = CLOCK_R - 2;
      const r2 = CLOCK_R + 2;
      items.push(
        <line
          key={`tick-${m}`}
          x1={CX + r1 * Math.cos(angle)}
          y1={CY + r1 * Math.sin(angle)}
          x2={CX + r2 * Math.cos(angle)}
          y2={CY + r2 * Math.sin(angle)}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
          strokeLinecap="round"
        />
      );
    }
    return items;
  }, []);

  // Hand endpoints
  const minuteLen = CLOCK_R - 30;
  const hourLen = CLOCK_R - 55;
  const mRad = ((mAngle - 90) * Math.PI) / 180;
  const hRad = ((hAngle - 90) * Math.PI) / 180;
  const mEnd = { x: CX + minuteLen * Math.cos(mRad), y: CY + minuteLen * Math.sin(mRad) };
  const hEnd = { x: CX + hourLen * Math.cos(hRad), y: CY + hourLen * Math.sin(hRad) };
  // Hour hand hit area starts offset from center so near-center grabs favor minute hand
  const hHitStart = { x: CX + 22 * Math.cos(hRad), y: CY + 22 * Math.sin(hRad) };

  // Second hand endpoint (longest, thinnest)
  const secondLen = CLOCK_R - 5;
  const secondTailLen = 18;
  const sAngle = (seconds * 6) % 360;
  const sRad = ((sAngle - 90) * Math.PI) / 180;
  const sEnd = { x: CX + secondLen * Math.cos(sRad), y: CY + secondLen * Math.sin(sRad) };
  const sTail = { x: CX - secondTailLen * Math.cos(sRad), y: CY - secondTailLen * Math.sin(sRad) };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      style={svgStyle}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Clock face */}
      <circle cx={CX} cy={CY} r={CLOCK_R + 8} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} />
      <circle cx={CX} cy={CY} r={CLOCK_R + 6} fill="var(--glass-bg)" />

      {/* Ticks and markers */}
      {minuteTicks}
      {hourMarkers}

      {/* Hour hand (shorter, thicker) */}
      <line
        x1={CX} y1={CY} x2={hEnd.x} y2={hEnd.y}
        stroke={HOUR_HAND_COLOR}
        strokeWidth={7}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
      />

      {/* Minute hand (longer, thinner) */}
      <line
        x1={CX} y1={CY} x2={mEnd.x} y2={mEnd.y}
        stroke={MINUTE_HAND_COLOR}
        strokeWidth={4.5}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
      />

      {/* Second hand (longest, thinnest — no hit area, not selectable) */}
      <line
        x1={sTail.x} y1={sTail.y} x2={sEnd.x} y2={sEnd.y}
        stroke={SECOND_HAND_COLOR}
        strokeWidth={1.5}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}
      />

      {/* Hit areas — hour hand on top so it wins when overlapping,
           but offset from center so middle-area grabs favor minute */}
      <line
        x1={CX} y1={CY} x2={mEnd.x} y2={mEnd.y}
        stroke="transparent"
        strokeWidth={28}
        strokeLinecap="round"
        style={{ cursor: "grab", touchAction: "none" }}
        onPointerDown={(e) => handlePointerDown("minute", e)}
      />
      <line
        x1={hHitStart.x} y1={hHitStart.y}
        x2={hEnd.x} y2={hEnd.y}
        stroke="transparent"
        strokeWidth={30}
        strokeLinecap="round"
        style={{ cursor: "grab", touchAction: "none" }}
        onPointerDown={(e) => handlePointerDown("hour", e)}
      />

      {/* Center dot */}
      <circle cx={CX} cy={CY} r={7} fill={CENTER_DOT_COLOR} />
      <circle cx={CX} cy={CY} r={3.5} fill="rgba(0,0,0,0.3)" />

      {/* Handle circles — visible knobs at hand endpoints */}
      <circle cx={hEnd.x} cy={hEnd.y} r={6} fill={HOUR_HAND_COLOR} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }} />
      <circle cx={mEnd.x} cy={mEnd.y} r={5.5} fill={MINUTE_HAND_COLOR} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }} />
      <circle cx={sEnd.x} cy={sEnd.y} r={4.5} fill={SECOND_HAND_COLOR} stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }} />

      {/* Circle hit areas — on top of everything for click priority */}
      <circle cx={hEnd.x} cy={hEnd.y} r={14} fill="transparent" style={{ cursor: "grab", touchAction: "none" }} onPointerDown={(e) => handlePointerDown("hour", e)} />
      <circle cx={mEnd.x} cy={mEnd.y} r={13} fill="transparent" style={{ cursor: "grab", touchAction: "none" }} onPointerDown={(e) => handlePointerDown("minute", e)} />
      <circle cx={sEnd.x} cy={sEnd.y} r={11} fill="transparent" style={{ cursor: "grab", touchAction: "none" }} onPointerDown={(e) => handlePointerDown("second", e)} />
    </svg>
  );
}
