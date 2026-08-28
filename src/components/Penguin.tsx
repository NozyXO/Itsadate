export type PenguinMood = "idle" | "worried" | "happy" | "party";

const COCOA = "#43302b";
const BODY = "#3e4a68";
const BELLY = "#fff6e6";
const BEAK = "#ff9e4f";
const BLUSH = "#f8a8be";
const SCARF = "#f26d8d";
const SUN = "#ffc53d";

/**
 * Pip — a chibi penguin holding a steaming coffee cup.
 * Moods: idle (round blinky eyes), worried (wide eyes + sweat drop),
 * happy (closed smiley eyes), party (flippers up + sparkles).
 */
export default function Penguin({
  mood,
  className = "",
}: {
  mood: PenguinMood;
  className?: string;
}) {
  const party = mood === "party";
  const happy = mood === "happy" || party;
  const worried = mood === "worried";

  return (
    <svg
      viewBox="0 0 260 280"
      className={className}
      role="img"
      aria-label={
        party
          ? "Pip the penguin celebrating with a coffee cup raised high"
          : worried
            ? "Pip the penguin looking nervous while holding a coffee cup"
            : "Pip the penguin holding a steaming coffee cup"
      }
    >
      {/* ground shadow */}
      <ellipse cx="130" cy="264" rx="72" ry="12" fill={COCOA} opacity="0.12" />

      <g className="anim-bob">
        {/* feet */}
        <ellipse cx="98" cy="250" rx="21" ry="12" fill={BEAK} stroke={COCOA} strokeWidth="5" />
        <ellipse cx="162" cy="250" rx="21" ry="12" fill={BEAK} stroke={COCOA} strokeWidth="5" />

        {/* body */}
        <ellipse cx="130" cy="158" rx="88" ry="98" fill={BODY} stroke={COCOA} strokeWidth="6" />
        {/* belly */}
        <ellipse cx="130" cy="178" rx="59" ry="72" fill={BELLY} stroke={COCOA} strokeWidth="5" />

        {/* head tuft */}
        <path d="M118 62 q3 -16 15 -19" fill="none" stroke={COCOA} strokeWidth="5" strokeLinecap="round" />
        <path d="M136 62 q2 -11 11 -14" fill="none" stroke={COCOA} strokeWidth="5" strokeLinecap="round" />

        {/* left flipper */}
        <ellipse
          cx="48"
          cy={party ? 128 : 172}
          rx="18"
          ry="38"
          fill={BODY}
          stroke={COCOA}
          strokeWidth="6"
          transform={party ? "rotate(38 48 128)" : "rotate(16 48 172)"}
          style={{ transition: "all .4s cubic-bezier(.2,.9,.3,1.2)" }}
        />

        {/* ---------- face ---------- */}
        {happy ? (
          <g stroke={COCOA} strokeWidth="6" strokeLinecap="round" fill="none">
            <path d="M96 118 q9 -13 18 0" />
            <path d="M146 118 q9 -13 18 0" />
          </g>
        ) : worried ? (
          <g className="blink">
            <circle cx="104" cy="116" r="13" fill="#fff" stroke={COCOA} strokeWidth="5" />
            <circle cx="156" cy="116" r="13" fill="#fff" stroke={COCOA} strokeWidth="5" />
            <circle cx="106" cy="119" r="5" fill={COCOA} />
            <circle cx="154" cy="119" r="5" fill={COCOA} />
            <circle cx="108" cy="114" r="2" fill="#fff" />
            <circle cx="156" cy="114" r="2" fill="#fff" />
          </g>
        ) : (
          <g className="blink">
            <circle cx="104" cy="116" r="9.5" fill={COCOA} />
            <circle cx="156" cy="116" r="9.5" fill={COCOA} />
            <circle cx="107.5" cy="112.5" r="3.2" fill="#fff" />
            <circle cx="159.5" cy="112.5" r="3.2" fill="#fff" />
          </g>
        )}

        {/* blush */}
        <ellipse
          cx="84"
          cy="138"
          rx={happy ? 14 : 12}
          ry={happy ? 8.5 : 7}
          fill={BLUSH}
          opacity="0.9"
          style={{ transition: "all .3s ease" }}
        />
        <ellipse
          cx="176"
          cy="138"
          rx={happy ? 14 : 12}
          ry={happy ? 8.5 : 7}
          fill={BLUSH}
          opacity="0.9"
          style={{ transition: "all .3s ease" }}
        />

        {/* beak */}
        {party ? (
          <g>
            <path d="M130 124 L116 136 Q130 146 144 136 Z" fill={BEAK} stroke={COCOA} strokeWidth="5" strokeLinejoin="round" />
            <path d="M121 140 Q130 152 139 140 Q130 144 121 140 Z" fill="#a34a2a" stroke={COCOA} strokeWidth="4" strokeLinejoin="round" />
          </g>
        ) : (
          <path d="M130 124 L117 136 Q130 145 143 136 Z" fill={BEAK} stroke={COCOA} strokeWidth="5" strokeLinejoin="round" />
        )}

        {/* sweat drop when worried */}
        {worried && (
          <path
            d="M186 84 q10 14 0 22 q-10 -8 0 -22 Z"
            fill="#a9dbf2"
            stroke={COCOA}
            strokeWidth="4"
            strokeLinejoin="round"
          />
        )}

        {/* scarf */}
        <rect x="70" y="196" width="120" height="27" rx="13.5" fill={SCARF} stroke={COCOA} strokeWidth="5" />
        <rect x="92" y="196" width="11" height="27" fill={SUN} />
        <rect x="118" y="196" width="11" height="27" fill={SUN} />
        <rect x="144" y="196" width="11" height="27" fill={SUN} />
        <rect x="150" y="218" width="27" height="42" rx="13" fill={SCARF} stroke={COCOA} strokeWidth="5" />
        <rect x="150" y="234" width="27" height="10" fill={SUN} />

        {/* ---------- right flipper + coffee cup ---------- */}
        <g
          style={{
            transition: "transform .45s cubic-bezier(.2,.9,.3,1.25)",
            transform: party ? "rotate(-30deg)" : "rotate(0deg)",
            transformOrigin: "204px 150px",
            transformBox: "view-box",
          }}
        >
          <ellipse
            cx="212"
            cy="152"
            rx="18"
            ry="37"
            fill={BODY}
            stroke={COCOA}
            strokeWidth="6"
            transform="rotate(-26 212 152)"
          />
          <g transform="translate(196 74)">
            {/* steam */}
            <path className="steam" d="M10 -6 q-5 -8 0 -15 q5 -7 0 -14" fill="none" stroke="#7fb6d9" strokeWidth="4.5" strokeLinecap="round" />
            <path className="steam" style={{ animationDelay: "0.6s" }} d="M24 -10 q-5 -8 0 -15 q5 -7 0 -14" fill="none" stroke="#7fb6d9" strokeWidth="4.5" strokeLinecap="round" />
            <path className="steam" style={{ animationDelay: "1.2s" }} d="M38 -6 q-5 -8 0 -15 q5 -7 0 -14" fill="none" stroke="#7fb6d9" strokeWidth="4.5" strokeLinecap="round" />
            {/* handle */}
            <path d="M44 16 q19 7 0 26" fill="none" stroke={COCOA} strokeWidth="5.5" strokeLinecap="round" />
            {/* cup */}
            <rect x="0" y="6" width="44" height="38" rx="10" fill="#fff" stroke={COCOA} strokeWidth="5" />
            <ellipse cx="22" cy="9" rx="19" ry="6.5" fill="#8a5a3b" stroke={COCOA} strokeWidth="4.5" />
            {/* heart on cup */}
            <path
              d="M22 33 c-5 -4 -9 -6.5 -9 -10 a4.6 4.6 0 0 1 9 -2 a4.6 4.6 0 0 1 9 2 c0 3.5 -4 6 -9 10 Z"
              fill={SCARF}
              stroke={COCOA}
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>
        </g>

        {/* party sparkles */}
        {party && (
          <g fill={SUN} stroke={COCOA} strokeWidth="2.5" strokeLinejoin="round">
            <path className="anim-twinkle" style={{ ["--dur" as string]: "1.8s" }} d="M40 66 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 Z" />
            <path className="anim-twinkle" style={{ ["--dur" as string]: "2.3s", animationDelay: "0.4s" }} d="M226 46 l3.5 8 8 3.5 -8 3.5 -3.5 8 -3.5 -8 -8 -3.5 8 -3.5 Z" />
            <path className="anim-twinkle" style={{ ["--dur" as string]: "2s", animationDelay: "0.8s" }} d="M26 150 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" />
          </g>
        )}
      </g>
    </svg>
  );
}
