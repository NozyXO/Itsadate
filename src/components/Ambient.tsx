const BEANS = [
  { left: "6%", top: "16%", tilt: -24, dur: "5.5s", size: 30 },
  { left: "14%", top: "64%", tilt: 18, dur: "7s", size: 24 },
  { left: "88%", top: "52%", tilt: -12, dur: "6.2s", size: 28 },
  { left: "78%", top: "14%", tilt: 30, dur: "5s", size: 22 },
  { left: "48%", top: "8%", tilt: 8, dur: "6.8s", size: 24 },
  { left: "94%", top: "80%", tilt: -30, dur: "7.4s", size: 26 },
  { left: "3%", top: "82%", tilt: 12, dur: "6.4s", size: 22 },
];

const HEARTS = [
  { left: "22%", top: "12%", color: "#f26d8d", dur: "5.8s", size: 20 },
  { left: "70%", top: "68%", color: "#2e9e8f", dur: "6.6s", size: 16 },
  { left: "34%", top: "76%", color: "#f0a62a", dur: "7.2s", size: 18 },
  { left: "82%", top: "30%", color: "#f26d8d", dur: "5.2s", size: 14 },
];

function Bean({ size, tilt }: { size: number; tilt: number }) {
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 30 39">
      <g transform={`rotate(${tilt} 15 19)`}>
        <ellipse cx="15" cy="19" rx="12" ry="17" fill="#8a5a3b" stroke="#43302b" strokeWidth="3.5" />
        <path d="M15 4 q-6 8 0 15 q6 7 0 15" fill="none" stroke="#43302b" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function Heart({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 20.5C6.5 16 3 13 3 9.2 3 6.6 5 4.5 7.5 4.5c1.8 0 3.4 1 4.5 2.6 1.1-1.6 2.7-2.6 4.5-2.6C19 4.5 21 6.6 21 9.2c0 3.8-3.5 6.8-9 11.3Z"
        fill={color}
        stroke="#43302b"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Cloud({ width, top, left, dur, opacity = 1 }: { width: number; top: string; left: string; dur: string; opacity?: number }) {
  return (
    <svg
      width={width}
      viewBox="0 0 200 80"
      className="anim-drift absolute"
      style={{ top, left, ["--dur" as string]: dur, opacity }}
    >
      <path
        d="M40 62 a22 22 0 0 1 8 -42 a28 28 0 0 1 52 -8 a24 24 0 0 1 40 16 a18 18 0 0 1 10 34 Z"
        fill="#fffdf8"
        stroke="#43302b"
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Sun() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="absolute -top-6 -right-6 md:top-4 md:right-8">
      <g className="anim-spin-slow">
        {Array.from({ length: 8 }).map((_, i) => (
          <rect
            key={i}
            x="56"
            y="2"
            width="8"
            height="20"
            rx="4"
            fill="#ffc53d"
            stroke="#43302b"
            strokeWidth="3"
            transform={`rotate(${i * 45} 60 60)`}
          />
        ))}
      </g>
      <circle cx="60" cy="60" r="30" fill="#ffc53d" stroke="#43302b" strokeWidth="5" />
      <circle cx="50" cy="56" r="3.4" fill="#43302b" />
      <circle cx="70" cy="56" r="3.4" fill="#43302b" />
      <path d="M50 68 q10 8 20 0" fill="none" stroke="#43302b" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="44" cy="64" r="4.5" fill="#f8a8be" opacity="0.9" />
      <circle cx="76" cy="64" r="4.5" fill="#f8a8be" opacity="0.9" />
    </svg>
  );
}

function Hills() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0">
      <svg viewBox="0 0 1440 170" preserveAspectRatio="none" className="block h-28 w-full md:h-40">
        <path d="M0 90 Q 240 10 480 70 T 960 60 T 1440 80 L1440 170 L0 170 Z" fill="#cde7d8" />
        <path d="M0 130 Q 300 60 720 110 T 1440 120 L1440 170 L0 170 Z" fill="#b9deca" />
      </svg>
      {/* tiny meadow flowers pinned over the hills */}
      <div className="absolute inset-x-0 bottom-2 flex justify-around px-6 md:bottom-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <svg key={i} width="18" height="22" viewBox="0 0 18 22" className={i % 2 ? "translate-y-1" : ""}>
            <line x1="9" y1="12" x2="9" y2="21" stroke="#1f7f73" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="9" cy="7" r="5.5" fill={i % 3 === 0 ? "#f26d8d" : i % 3 === 1 ? "#ffc53d" : "#fffdf8"} stroke="#43302b" strokeWidth="2.2" />
            <circle cx="9" cy="7" r="1.8" fill="#43302b" />
          </svg>
        ))}
      </div>
    </div>
  );
}

/** Floating rising hearts shown after the date is confirmed */
export function RisingHearts() {
  const items = Array.from({ length: 14 }).map((_, i) => ({
    left: `${(i * 7.3 + 4) % 96}%`,
    delay: `${(i * 0.55) % 4}s`,
    dur: `${5.5 + (i % 4) * 1.3}s`,
    size: 13 + (i % 4) * 5,
    color: ["#f26d8d", "#ffc53d", "#2e9e8f", "#ff9e4f"][i % 4],
  }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((h, i) => (
        <div
          key={i}
          className="anim-rise absolute bottom-0"
          style={{ left: h.left, animationDelay: h.delay, ["--dur" as string]: h.dur }}
        >
          <Heart size={h.size} color={h.color} />
        </div>
      ))}
    </div>
  );
}

export default function Ambient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <Sun />
      <Cloud width={170} top="9%" left="4%" dur="26s" />
      <Cloud width={130} top="22%" left="60%" dur="34s" opacity={0.85} />
      <Cloud width={100} top="48%" left="12%" dur="30s" opacity={0.7} />
      {BEANS.map((b, i) => (
        <div
          key={`bean-${i}`}
          className="anim-floaty absolute"
          style={{ left: b.left, top: b.top, ["--dur" as string]: b.dur, ["--tilt" as string]: `${b.tilt}deg` }}
        >
          <Bean size={b.size} tilt={b.tilt} />
        </div>
      ))}
      {HEARTS.map((h, i) => (
        <div
          key={`heart-${i}`}
          className="anim-floaty absolute"
          style={{ left: h.left, top: h.top, ["--dur" as string]: h.dur, animationDelay: `${i * 0.7}s` }}
        >
          <Heart size={h.size} color={h.color} />
        </div>
      ))}
      <Hills />
    </div>
  );
}
