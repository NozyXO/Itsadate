import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import Penguin from "./Penguin";
import { CalendarIcon, ClockIcon, CoffeeIcon, MapPinIcon, XIcon } from "./icons";

export interface DatePlan {
  date: string; // yyyy-mm-dd
  time: string; // HH:MM
  gcalUrl: string;
}

const CONFETTI_COLORS = ["#f26d8d", "#ffc53d", "#2e9e8f", "#a9dbf2", "#fff6e6", "#ff9e4f"];

function todayStr() {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function defaultTime() {
  const h = Math.min(23, new Date().getHours() + 2);
  return `${`${h}`.padStart(2, "0")}:00`;
}

function toGcalStamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function buildGcalUrl(date: string, time: string) {
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Coffee date with Pip the Penguin ☕🐧",
    dates: `${toGcalStamp(start)}/${toGcalStamp(end)}`,
    details:
      "You said YES! Pip is already practicing latte art and reserving the comfiest seat. Bring your favorite mug. ☕💛",
    location: "The Cosy Bean Café — corner table by the window",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function burst() {
  confetti({ particleCount: 90, spread: 80, origin: { y: 0.65 }, colors: CONFETTI_COLORS, zIndex: 200 });
  window.setTimeout(
    () => confetti({ particleCount: 55, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: CONFETTI_COLORS, zIndex: 200 }),
    160,
  );
  window.setTimeout(
    () => confetti({ particleCount: 55, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: CONFETTI_COLORS, zIndex: 200 }),
    320,
  );
}

export default function InviteModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (plan: DatePlan) => void;
}) {
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(defaultTime);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open) burst();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const confirm = () => {
    if (!date || !time) {
      setError(true);
      window.setTimeout(() => setError(false), 600);
      return;
    }
    const gcalUrl = buildGcalUrl(date, time);
    window.open(gcalUrl, "_blank", "noopener,noreferrer");
    burst();
    onConfirm({ date, time, gcalUrl });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Pick a time for your coffee date">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-cocoa/45"
      />
      <div
        className={`anim-pop relative w-full max-w-md rounded-[2rem] border-4 border-cocoa bg-paper shadow-chunky ${
          error ? "anim-shake" : ""
        }`}
      >
        {/* confetti flag strip */}
        <div className="flex justify-center gap-2 pt-4">
          {["#f26d8d", "#ffc53d", "#2e9e8f", "#a9dbf2", "#ff9e4f", "#f26d8d", "#ffc53d"].map((c, i) => (
            <span
              key={i}
              className="inline-block h-4 w-3 rounded-b-md border-2 border-cocoa"
              style={{ background: c, transform: `rotate(${i % 2 ? 6 : -6}deg) translateY(${i % 2 ? 2 : 0}px)` }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close popup"
          className="btn-push absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full border-[3px] border-cocoa bg-mint text-cocoa shadow-pop-sm"
        >
          <XIcon size={18} />
        </button>

        <div className="flex flex-col items-center px-7 pt-2 pb-7 text-center">
          <div className="-mb-2 w-36">
            <Penguin mood="party" className="w-full" />
          </div>

          <h2 className="font-display text-[1.9rem] leading-tight font-semibold text-cocoa">
            Yay! It&rsquo;s a date!
          </h2>
          <p className="mt-1 max-w-xs text-[15px] font-semibold text-cocoa-soft">
            Pip is doing a happy dance. Pick a day and time — the first cocoa is on Pip.
          </p>

          <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block rounded-2xl border-[3px] border-cocoa bg-mint p-3 text-left shadow-pop-sm">
              <span className="flex items-center gap-1.5 font-display text-sm font-semibold text-cocoa">
                <CalendarIcon size={16} /> Pick a day
              </span>
              <input
                type="date"
                value={date}
                min={todayStr()}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border-[3px] border-cocoa bg-paper px-3 py-2 font-body text-[15px] font-bold text-cocoa outline-none focus:border-teal"
              />
            </label>
            <label className="block rounded-2xl border-[3px] border-cocoa bg-mint p-3 text-left shadow-pop-sm">
              <span className="flex items-center gap-1.5 font-display text-sm font-semibold text-cocoa">
                <ClockIcon size={16} /> Pick a time
              </span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1.5 w-full rounded-xl border-[3px] border-cocoa bg-paper px-3 py-2 font-body text-[15px] font-bold text-cocoa outline-none focus:border-teal"
              />
            </label>
          </div>

          <div className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-[3px] border-dashed border-cocoa/30 bg-cream px-3 py-2 text-[13px] font-bold text-cocoa-soft">
            <MapPinIcon size={15} />
            The Cosy Bean Café — corner table by the window
          </div>

          {error && (
            <p className="mt-2 font-display text-sm font-semibold text-berry-deep">
              Pip needs both a day and a time!
            </p>
          )}

          <button
            type="button"
            onClick={confirm}
            className="btn-push mt-5 flex w-full items-center justify-center gap-2 rounded-full border-4 border-cocoa bg-sun px-6 py-3.5 font-display text-xl font-semibold text-cocoa shadow-pop"
          >
            <CoffeeIcon size={20} />
            Confirm &amp; save to Google Calendar
          </button>
          <p className="mt-2.5 text-[12.5px] font-bold text-cocoa-soft">
            Confirming opens Google Calendar with your coffee date pre-filled ✏️
          </p>
        </div>
      </div>
    </div>
  );
}
