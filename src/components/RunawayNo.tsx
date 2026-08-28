import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

type Spot = { x: number; y: number; r: number };

/**
 * The "No" button. It rests in a dashed slot next to "Yes", but the moment
 * the cursor (or a finger) gets close it leaps to another spot on screen.
 * It renders through a portal with position:fixed, so it can never be
 * clipped by ancestors, hidden by scrolling, or pushed off-screen.
 */
export default function RunawayNo({ onDodge }: Props) {
  const slotRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [spot, setSpot] = useState<Spot | null>(null);
  const [count, setCount] = useState(0);
  const [tauntIdx, setTauntIdx] = useState(0);
  const fled = useRef(false);
  const lastFlee = useRef(0);

  const btnSize = () => {
    const b = btnRef.current;
    return b ? { w: b.offsetWidth, h: b.offsetHeight } : { w: 140, h: 54 };
  };

  const clamp = (x: number, y: number) => {
    const { w, h } = btnSize();
    const pad = 10;
    return {
      x: Math.min(Math.max(x, pad), Math.max(pad, window.innerWidth - w - pad)),
      y: Math.min(Math.max(y, pad), Math.max(pad, window.innerHeight - h - pad)),
    };
  };

  const syncToSlot = () => {
    if (fled.current) return;
    const s = slotRef.current;
    if (!s) return;
    const r = s.getBoundingClientRect();
    setSpot({ x: r.left, y: r.top, r: 0 });
  };

  // Rest on top of the dashed slot before the first escape. The speech card
  // pops in with a scale animation, which skews the very first measurement —
  // so re-sync a few times once the entrance animation has settled.
  useLayoutEffect(() => {
    syncToSlot();
    const timers = [700, 1500, 2600].map((ms) => window.setTimeout(syncToSlot, ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flee = (cx: number, cy: number) => {
    if (!btnRef.current) return;
    const now = performance.now();
    if (now - lastFlee.current < 150) return; // debounce rapid pointer events
    lastFlee.current = now;
    fled.current = true;

    const { w, h } = btnSize();
    const pad = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // sample targets, keep the one farthest from the pointer
    let best: Spot = { x: pad, y: pad, r: 0 };
    let bestD = -1;
    for (let i = 0; i < 16; i++) {
      const x = pad + Math.random() * Math.max(1, vw - w - pad * 2);
      const y = pad + Math.random() * Math.max(1, vh - h - pad * 2);
      const d = Math.hypot(x + w / 2 - cx, y + h / 2 - cy);
      if (d > bestD) bestD = d, best = { x, y, r: Math.random() * 22 - 11 };
      if (d > 240) break;
    }

    setSpot(best);
    setCount((c) => c + 1);
    setTauntIdx((i) => (i + 1) % TAUNTS.length);
    onDodge(count + 1);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const b = btnRef.current;
      if (!b) return;
      const rect = b.getBoundingClientRect();
      const bx = rect.left + rect.width / 2;
      const by = rect.top + rect.height / 2;
      const near = Math.hypot(e.clientX - bx, e.clientY - by) < (fled.current ? 105 : 125);
      if (near) flee(e.clientX, e.clientY);
    };
    const onResize = () => {
      if (!fled.current) syncToSlot();
      else setSpot((s) => (s ? { ...clamp(s.x, s.y), r: s.r } : s));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  });

  return (
    <>
      {/* dashed slot keeps layout stable and marks where "No" used to live */}
      <div
        ref={slotRef}
        aria-hidden="true"
        className="h-[54px] w-[132px] rounded-full border-[3px] border-dashed border-cocoa/25 sm:w-[150px]"
      />
      {createPortal(
        <button
          ref={btnRef}
          type="button"
          aria-label="No (good luck clicking it)"
          onMouseEnter={(e) => flee(e.clientX, e.clientY)}
          onClick={(e) =>
            flee(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2)
          }
          onTouchStart={(e) => {
            const t = e.touches[0];
            if (t) flee(t.clientX, t.clientY);
          }}
          className={`runaway-transition fixed left-0 top-0 z-50 grid h-[54px] min-w-[132px] place-items-center rounded-full border-[3px] border-cocoa bg-paper px-5 font-display text-[15px] font-semibold whitespace-nowrap text-cocoa select-none ${
            count > 0 ? "shadow-pop" : "shadow-pop-sm"
          }`}
          style={{
            touchAction: "manipulation",
            willChange: "transform",
            transform: spot
              ? `translate(${spot.x}px, ${spot.y}px) rotate(${spot.r}deg)`
              : "translate(-999px, -999px)",
          }}
        >
          {TAUNTS[tauntIdx]}
        </button>,
        document.body,
      )}
    </>
  );
}
