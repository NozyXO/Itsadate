import { useEffect, useRef, useState } from "react";

const TAUNTS = [
  "No",
  "Nope!",
  "Can't catch me!",
  "Too slow!",
  "Hehe~",
  "Try again!",
  "Not this one!",
  "Over here!",
  "Almost!",
  "Pick the other ☕",
  "I'm speed.",
  "Never!",
];

interface Props {
  onDodge: (count: number) => void;
}

/**
 * The "No" button. It lives in-flow next to "Yes", but the moment the
 * cursor (or a finger) gets close it leaps to a random spot on screen.
 */
export default function RunawayNo({ onDodge }: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState<{ dx: number; dy: number; r: number } | null>(null);
  const [tauntIdx, setTauntIdx] = useState(0);
  const dodges = useRef(0);
  const lastFlee = useRef(0);

  const flee = (cx: number, cy: number) => {
    const btn = btnRef.current;
    if (!btn) return;
    const now = performance.now();
    if (now - lastFlee.current < 180) return; // debounce rapid mousemove
    lastFlee.current = now;

    const rect = btn.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const pad = 14;

    // sample a few targets, prefer ones far from the cursor
    let tx = 0;
    let ty = 0;
    for (let i = 0; i < 14; i++) {
      tx = pad + Math.random() * (window.innerWidth - w - pad * 2);
      ty = pad + Math.random() * (window.innerHeight - h - pad * 2);
      const d = Math.hypot(tx + w / 2 - cx, ty + h / 2 - cy);
      if (d > 240) break;
    }

    setOffset({
      dx: tx - rect.left,
      dy: ty - rect.top,
      r: Math.random() * 22 - 11,
    });

    dodges.current += 1;
    setTauntIdx((i) => (i + 1) % TAUNTS.length);
    onDodge(dodges.current);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const bx = rect.left + rect.width / 2;
      const by = rect.top + rect.height / 2;
      const near = Math.hypot(e.clientX - bx, e.clientY - by) < (offset ? 95 : 115);
      if (near) flee(e.clientX, e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [offset]);

  return (
    <div className="relative h-[54px] w-[122px]" aria-hidden="false">
      {/* ghost slot keeps layout stable while the button is on the run */}
      <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-cocoa/25" />
      <button
        ref={btnRef}
        type="button"
        aria-label="No (good luck clicking it)"
        onClick={(e) => flee(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) flee(t.clientX, t.clientY);
        }}
        className={`absolute inset-0 rounded-full border-[3px] border-cocoa bg-paper font-display text-lg font-semibold text-cocoa ${
          offset ? "runaway-transition z-50 shadow-pop" : "shadow-pop-sm"
        }`}
        style={
          offset
            ? { transform: `translate(${offset.dx}px, ${offset.dy}px) rotate(${offset.r}deg)` }
            : undefined
        }
      >
        {TAUNTS[tauntIdx]}
      </button>
    </div>
  );
}
