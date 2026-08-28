import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import Penguin, { type PenguinMood } from "./components/Penguin";
import RunawayNo from "./components/RunawayNo";
import InviteModal, { type DatePlan } from "./components/InviteModal";
import Ambient, { RisingHearts } from "./components/Ambient";
import {
  ArrowUpRightIcon,
  CalendarIcon,
  ClockIcon,
  CoffeeIcon,
  HeartIcon,
  MapPinIcon,
  RotateIcon,
  SparkleIcon,
} from "./components/icons";

const QUESTION =
  "Hi! I'm Swaraaa. I saved you a seat and a fresh cup… would you like to have coffee with me?";

function useTypewriter(text: string, speed = 32, startDelay = 500) {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    let i = 0;
    let iv = 0;
    const to = window.setTimeout(() => {
      iv = window.setInterval(() => {
        i += 1;
        setOut(text.slice(0, i));
        if (i >= text.length) window.clearInterval(iv);
      }, speed);
    }, startDelay);
    return () => {
      window.clearTimeout(to);
      window.clearInterval(iv);
    };
  }, [text, speed, startDelay]);
  return out;
}

function dodgeComment(n: number) {
  if (n >= 20) return "Okay, this is just cardio now.";
  if (n >= 15) return "The No button filed a complaint.";
  if (n >= 10) return "Destiny says Yes.";
  if (n >= 6) return "Swaraaa politely suggests the other button.";
  if (n >= 3) return "It really doesn't want to be picked.";
  return "The No button is a little shy.";
}

function yesLabel(n: number) {
  if (n >= 7) return "YES!!! ☕";
  if (n >= 3) return "Yes!! ☕";
  return "Yes!";
}

export default function App() {
  const [phase, setPhase] = useState<"asking" | "confirmed">("asking");
  const [modalOpen, setModalOpen] = useState(false);
  const [dodges, setDodges] = useState(0);
  const [mood, setMood] = useState<PenguinMood>("idle");
  const [wiggleKey, setWiggleKey] = useState(0);
  const [round, setRound] = useState(0);
  const [plan, setPlan] = useState<DatePlan | null>(null);
  const moodTimer = useRef(0);

  const typed = useTypewriter(QUESTION);

  useEffect(() => () => window.clearTimeout(moodTimer.current), []);

  const handleDodge = (n: number) => {
    setDodges(n);
    setWiggleKey((k) => k + 1);
    setMood("worried");
    window.clearTimeout(moodTimer.current);
    moodTimer.current = window.setTimeout(() => setMood("idle"), 1100);
  };

  const handleYes = () => {
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: ["#f26d8d", "#ffc53d", "#2e9e8f", "#fff6e6"], zIndex: 80 });
    setModalOpen(true);
  };

  const handleConfirm = (p: DatePlan) => {
    setPlan(p);
    setModalOpen(false);
    setPhase("confirmed");
    setMood("party");
  };

  const reset = () => {
    setPhase("asking");
    setDodges(0);
    setPlan(null);
    setMood("idle");
    setRound((r) => r + 1);
  };

  const planDate = plan ? new Date(`${plan.date}T${plan.time}:00`) : null;

  return (
    <div className="dotty-bg relative min-h-[100dvh] overflow-hidden bg-mint font-body text-cocoa">
      <Ambient />
      {phase === "confirmed" && <RisingHearts />}

      {/* header */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 md:p-6">
        <div className="anim-pop flex items-center gap-2.5 rounded-full border-[3px] border-cocoa bg-paper py-1.5 pr-5 pl-1.5 shadow-pop-sm">
          <span className="grid h-9 w-9 place-items-center rounded-full border-[3px] border-cocoa bg-sun">
            <CoffeeIcon size={17} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">café swaraaa</span>
        </div>
        <div
          className="anim-pop hidden items-center gap-1.5 rounded-full border-[3px] border-cocoa bg-berry px-4 py-2 font-display text-sm font-semibold text-paper shadow-pop-sm sm:flex"
          style={{ animationDelay: "0.15s" }}
        >
          <SparkleIcon size={14} />
          fresh brews · bold questions
        </div>
      </header>

      {/* ---------- asking scene ---------- */}
      {phase === "asking" && (
        <main key={round} className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 pt-20 pb-28 sm:pt-24 sm:pb-32">
          <div className="flex w-full max-w-4xl flex-col items-center gap-4 lg:flex-row lg:gap-14">
            {/* Pip */}
            <div
              key={wiggleKey}
              className={`anim-pop relative z-[6] -mb-7 w-40 shrink-0 sm:-mb-9 sm:w-56 lg:mb-0 lg:w-80 ${wiggleKey ? "anim-wiggle-once" : ""}`}
            >
              <Penguin mood={mood} className="w-full" />
            </div>

            {/* speech bubble */}
            <div
              className="anim-pop relative w-full max-w-xl rounded-[2.2rem] border-4 border-cocoa bg-paper p-5 shadow-chunky sm:p-6 md:p-8"
              style={{ animationDelay: "0.18s" }}
            >
              {/* tail */}
              <span className="absolute top-1/2 -left-[15px] hidden h-7 w-7 -translate-y-1/2 rotate-45 border-b-4 border-l-4 border-cocoa bg-paper lg:block" />

              <span className="inline-flex items-center gap-1.5 rounded-full border-[3px] border-cocoa bg-sky px-3.5 py-1 font-display text-[10px] font-semibold tracking-[0.08em] text-cocoa uppercase sm:text-[11px] sm:tracking-[0.14em]">
                <SparkleIcon size={13} />
                an extremely important question
              </span>

              <h1 className="mt-3.5 min-h-[8.75rem] font-display text-[1.45rem] leading-snug font-semibold sm:min-h-[7.5rem] sm:text-[1.75rem] lg:text-[1.95rem]">
                {typed}
                <span className="caret ml-0.5 inline-block h-[0.9em] w-[3px] translate-y-[0.12em] rounded-full bg-berry" />
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-4">
                <div style={{ transform: `scale(${1 + Math.min(dodges, 12) * 0.045})`, transition: "transform .35s cubic-bezier(.2,.9,.3,1.3)" }} className="origin-left">
                  <button
                    type="button"
                    onClick={handleYes}
                    onMouseEnter={() => setMood("happy")}
                    onMouseLeave={() => setMood((m) => (m === "happy" ? "idle" : m))}
                    className="btn-push flex items-center gap-2 rounded-full border-4 border-cocoa bg-sun px-6 py-2.5 font-display text-lg font-semibold whitespace-nowrap text-cocoa shadow-pop sm:px-8 sm:py-3 sm:text-xl"
                  >
                    <CoffeeIcon size={20} />
                    {yesLabel(dodges)}
                  </button>
                </div>

                {!modalOpen && <RunawayNo onDodge={handleDodge} />}
              </div>

              <p className="mt-3.5 text-[12.5px] font-bold text-cocoa-soft sm:mt-4 sm:text-[13px]">
                psst — choose wisely. Swaraaa has been rehearsing this all morning.
              </p>
            </div>
          </div>
        </main>
      )}

      {/* ---------- confirmed scene ---------- */}
      {phase === "confirmed" && plan && planDate && (
        <main className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-4 pt-20 pb-24 text-center sm:pt-24 sm:pb-28">
          <div className="anim-pop w-48 sm:w-60">
            <Penguin mood="party" className="w-full" />
          </div>

          <h1 className="anim-pop mt-2 font-display text-4xl font-semibold tracking-tight sm:text-6xl" style={{ animationDelay: "0.12s" }}>
            It&rsquo;s a date!
          </h1>
          <svg viewBox="0 0 220 14" className="squiggle anim-pop mx-auto mt-1 w-52 sm:w-64" style={{ animationDelay: "0.2s" }} aria-hidden="true">
            <path d="M4 9 q 20 -8 40 0 t 40 0 t 40 0 t 40 0 t 40 0" fill="none" stroke="#f26d8d" strokeWidth="6" strokeLinecap="round" />
          </svg>
          <p className="anim-pop mt-3 max-w-sm text-[15px] font-bold text-cocoa-soft" style={{ animationDelay: "0.26s" }}>
            Swaraaa already put the kettle on and is practicing latte art in your honor.
          </p>

          <div className="anim-pop mt-6 flex items-center gap-4 rounded-3xl border-4 border-cocoa bg-paper p-5 text-left shadow-chunky" style={{ animationDelay: "0.34s" }}>
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-[3px] border-cocoa bg-sun">
              <CalendarIcon size={24} />
            </span>
            <div>
              <p className="font-display text-xl leading-tight font-semibold">
                {planDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-cocoa-soft">
                <ClockIcon size={14} />
                {planDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                <span className="mx-1 inline-block h-1 w-1 rounded-full bg-cocoa-soft" />
                <MapPinIcon size={14} />
                The Cosy Bean Café
              </p>
            </div>
          </div>

          <p className="anim-pop mt-4 max-w-sm text-[13px] font-bold text-cocoa-soft" style={{ animationDelay: "0.4s" }}>
            A Google Calendar tab just opened with your invite. If it didn&rsquo;t pop up:
          </p>

          <div className="anim-pop mt-3 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "0.46s" }}>
            <a
              href={plan.gcalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-push flex items-center gap-2 rounded-full border-4 border-cocoa bg-teal px-6 py-2.5 font-display text-lg font-semibold text-paper shadow-pop"
            >
              Open Google Calendar
              <ArrowUpRightIcon size={18} />
            </a>
            <button
              type="button"
              onClick={reset}
              className="btn-push flex items-center gap-2 rounded-full border-[3px] border-cocoa bg-paper px-5 py-2.5 font-display text-base font-semibold text-cocoa shadow-pop-sm"
            >
              <RotateIcon size={16} />
              Plan another coffee
            </button>
          </div>

          <p className="anim-pop mt-6 flex items-center gap-1.5 font-display text-sm font-semibold text-berry-deep" style={{ animationDelay: "0.52s" }}>
            <HeartIcon size={15} className="fill-berry" />
            see you soon — don&rsquo;t be late, the foam won&rsquo;t wait
          </p>
        </main>
      )}

      {/* footer chips */}
      <footer className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 p-4 md:p-6">
        {phase === "asking" && dodges > 0 ? (
          <div
            key={dodges}
            className="anim-pop flex items-center gap-2 rounded-full border-[3px] border-cocoa bg-paper px-4 py-2 font-display text-sm font-semibold shadow-pop-sm"
            aria-live="polite"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-cocoa bg-berry font-display text-[11px] text-paper">
              {dodges}
            </span>
            escape {dodges === 1 ? "attempt" : "attempts"} — {dodgeComment(dodges)}
          </div>
        ) : (
          <div className="hidden items-center gap-1.5 rounded-full border-[3px] border-cocoa bg-paper px-4 py-2 font-display text-sm font-semibold shadow-pop-sm sm:flex">
            <CoffeeIcon size={15} />
            est. today · one table, two mugs
          </div>
        )}
        <div className="ml-auto hidden items-center gap-1.5 rounded-full border-[3px] border-cocoa bg-paper px-4 py-2 font-display text-sm font-semibold shadow-pop-sm md:flex">
          brewed with <HeartIcon size={13} className="fill-berry text-berry" /> by swaraaa
        </div>
      </footer>

      <InviteModal open={modalOpen} onClose={() => setModalOpen(false)} onConfirm={handleConfirm} />
    </div>
  );
}
