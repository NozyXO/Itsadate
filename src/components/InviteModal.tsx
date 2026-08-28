import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import Penguin from "./Penguin";
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CoffeeIcon,
  MapPinIcon,
  SearchIcon,
  XIcon,
} from "./icons";

export interface DatePlan {
  date: string; // yyyy-mm-dd
  time: string; // HH:MM
  place: string;
  gcalUrl: string;
}

type Geo = { lat: number; lon: number };

type PlaceResult = {
  id: string;
  name: string;
  detail: string;
  lat?: number;
  lon?: number;
  nearby?: boolean;
  dist?: number; // km from the user, when known
};

type SearchStatus = "idle" | "searching" | "done" | "error";
type LocState = "idle" | "locating" | "on" | "off";

const CONFETTI_COLORS = ["#f26d8d", "#ffc53d", "#2e9e8f", "#a9dbf2", "#fff6e6", "#ff9e4f"];
const CAFE_RX = /caf(e|é|è)|coffee|kaffee|espresso|roaster/i;

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

function buildGcalUrl(date: string, time: string, place: string) {
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Coffee date with Swaraaa the Penguin ☕🐧",
    dates: `${toGcalStamp(start)}/${toGcalStamp(end)}`,
    details:
      "You said YES! Swaraaa is already practicing latte art and reserving the comfiest seat. Bring your favorite mug. ☕💛",
    location: place || "Somewhere cosy ☕",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ---------- geo helpers ---------- */

function haversineKm(a: Geo, b: Geo) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function fmtDist(km: number) {
  return km < 1 ? `${Math.max(1, Math.round(km * 1000))} m` : `${km.toFixed(1)} km`;
}

/* ---------- place search: OpenStreetMap text index + real café POIs ---------- */

function formatDetail(raw: Record<string, unknown>): string {
  const a = (raw.address ?? {}) as Record<string, string | undefined>;
  const parts = [
    a.road,
    a.suburb || a.neighbourhood || a.quarter,
    a.city || a.town || a.village || a.county,
    a.country,
  ].filter(Boolean) as string[];
  const seen = new Set<string>();
  return parts
    .filter((p) => {
      const k = p.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 3)
    .join(", ");
}

/** Global text search (Nominatim). Biased toward the user when we know where they are. */
async function searchPlaces(q: string, loc: Geo | null, signal: AbortSignal): Promise<PlaceResult[]> {
  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "8",
    addressdetails: "1",
    "accept-language": "en",
    q,
  });
  if (loc) {
    const d = 0.35; // ~35 km box
    params.set("viewbox", `${loc.lon - d},${loc.lat + d},${loc.lon + d},${loc.lat - d}`);
    params.set("bounded", "0");
  }
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("search failed");
  const data = (await res.json()) as Array<Record<string, unknown>>;
  return data.map((r, i) => ({
    id: `n-${String(r.place_id ?? "x")}-${i}`,
    name: String(r.name || String(r.display_name ?? q).split(",")[0] || q),
    detail: formatDetail(r) || String(r.display_name ?? ""),
    lat: Number(r.lat),
    lon: Number(r.lon),
  }));
}

/** Actual café / coffee-shop points on the map around the user (Overpass API). */
async function cafesNearby(loc: Geo, signal: AbortSignal): Promise<PlaceResult[]> {
  const q = `[out:json][timeout:8];(node["amenity"~"^(cafe|coffee_shop)$"](around:2500,${loc.lat},${loc.lon});way["amenity"~"^(cafe|coffee_shop)$"](around:2500,${loc.lat},${loc.lon}););out center tags 40;`;
  const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) throw new Error("overpass failed");
  const data = (await res.json()) as {
    elements?: Array<{
      type: string;
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };
  return (data.elements ?? [])
    .filter((e) => e.tags?.name)
    .map((e) => {
      const lat = e.lat ?? e.center?.lat;
      const lon = e.lon ?? e.center?.lon;
      const t = e.tags ?? {};
      const street = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ");
      const detail = [street, t["addr:city"] || t["addr:town"] || t["addr:suburb"], t.cuisine]
        .filter(Boolean)
        .join(", ");
      return { id: `o-${e.type}-${e.id}`, name: t.name!, detail, lat, lon, nearby: true };
    });
}

/** Merge both sources, dedupe by name, closest first when the user's spot is known. */
async function findPlaces(q: string, loc: Geo | null, signal: AbortSignal): Promise<PlaceResult[]> {
  const [cafes, text] = await Promise.allSettled([
    loc && CAFE_RX.test(q) ? cafesNearby(loc, signal) : Promise.resolve([] as PlaceResult[]),
    searchPlaces(q, loc, signal),
  ]);

  const merged: PlaceResult[] = [];
  const seen = new Set<string>();
  const push = (r: PlaceResult) => {
    const key = r.name.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    const dist =
      loc && Number.isFinite(r.lat) && Number.isFinite(r.lon)
        ? haversineKm(loc, { lat: r.lat as number, lon: r.lon as number })
        : undefined;
    merged.push({ ...r, dist });
  };
  if (cafes.status === "fulfilled") cafes.value.forEach(push);
  if (text.status === "fulfilled") text.value.forEach(push);
  return merged.sort((a, b) => (a.dist ?? 1e9) - (b.dist ?? 1e9));
}

/* ---------- confetti ---------- */

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

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`anim-spin ${className} text-cocoa-soft`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [listOpen, setListOpen] = useState(false);
  const [chosen, setChosen] = useState<PlaceResult | null>(null);
  const [error, setError] = useState(false);
  const [loc, setLoc] = useState<Geo | null>(null);
  const [locState, setLocState] = useState<LocState>("idle");
  const [refresh, setRefresh] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimer = useRef(0);

  useEffect(() => {
    if (open) burst();
  }, [open]);

  // fresh place search every time the popup opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setChosen(null);
      setResults([]);
      setStatus("idle");
      setListOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (listOpen) setListOpen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, listOpen, onClose]);

  useEffect(() => () => window.clearTimeout(blurTimer.current), []);

  // debounced place lookup — re-runs when location arrives or a refresh is forced
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setListOpen(false);
      setStatus("idle");
      return;
    }
    const ctrl = new AbortController();
    setStatus("searching");
    const t = window.setTimeout(async () => {
      try {
        const found = await findPlaces(q, loc, ctrl.signal);
        setResults(found);
        setStatus("done");
        setListOpen(found.length > 0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
          setListOpen(false);
          setStatus("error");
        }
      }
    }, 320);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [query, loc, refresh]);

  if (!open) return null;

  const requestLoc = () => {
    if (locState === "locating") return;
    if (!("geolocation" in navigator)) {
      setLocState("off");
      return;
    }
    setLocState("locating");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLoc({ lat: p.coords.latitude, lon: p.coords.longitude });
        setLocState("on");
      },
      () => setLocState("off"),
      { timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  };

  const nearbyCafes = () => {
    setChosen(null);
    setListOpen(false);
    setQuery("cafe");
    setRefresh((r) => r + 1);
    if (!loc) requestLoc();
    window.setTimeout(() => inputRef.current?.focus(), 60);
  };

  const pick = (r: PlaceResult) => {
    setChosen(r);
    setQuery(r.name);
    setResults([]);
    setListOpen(false);
    setStatus("idle");
  };

  const clearPlace = () => {
    setChosen(null);
    setQuery("");
    setResults([]);
    setListOpen(false);
    setStatus("idle");
    inputRef.current?.focus();
  };

  const placeLabel = chosen
    ? `${chosen.name}${chosen.detail ? ", " + chosen.detail : ""}`
    : query.trim();

  const confirm = () => {
    if (!date || !time || !placeLabel) {
      setError(true);
      window.setTimeout(() => setError(false), 650);
      return;
    }
    const gcalUrl = buildGcalUrl(date, time, placeLabel);
    window.open(gcalUrl, "_blank", "noopener,noreferrer");
    burst();
    onConfirm({ date, time, place: placeLabel, gcalUrl });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Pick a time and place for your coffee date">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-cocoa/45"
      />
      <div
        className={`anim-pop relative max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-[2rem] border-4 border-cocoa bg-paper shadow-chunky ${
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

        <div className="flex flex-col items-center px-5 pt-2 pb-6 text-center sm:px-7 sm:pb-7">
          <div className="-mb-2 w-28 sm:w-36">
            <Penguin mood="party" className="w-full" />
          </div>

          <h2 className="font-display text-2xl leading-tight font-semibold text-cocoa sm:text-[1.9rem]">
            Yay! It&rsquo;s a date!
          </h2>
          <p className="mt-1 max-w-xs text-[15px] font-semibold text-cocoa-soft">
            Swaraaa is doing a happy dance. Pick a day, a time and a place — the first cocoa is on Swaraaa.
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
                className="mt-1.5 w-full rounded-xl border-[3px] border-cocoa bg-paper px-3 py-2.5 font-body text-base font-bold text-cocoa outline-none focus:border-teal"
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
                className="mt-1.5 w-full rounded-xl border-[3px] border-cocoa bg-paper px-3 py-2.5 font-body text-base font-bold text-cocoa outline-none focus:border-teal"
              />
            </label>
          </div>

          {/* place picker */}
          <div className="mt-3 w-full rounded-2xl border-[3px] border-cocoa bg-mint p-3 text-left shadow-pop-sm">
            <div className="flex items-center gap-1.5">
              <label htmlFor="place-input" className="flex items-center gap-1.5 font-display text-sm font-semibold text-cocoa">
                <MapPinIcon size={16} /> Pick a place
              </label>
              <button
                type="button"
                onClick={requestLoc}
                className={`btn-push ml-auto flex items-center gap-1 rounded-full border-2 px-2 py-0.5 font-display text-[11px] font-semibold ${
                  locState === "on"
                    ? "border-teal bg-teal text-paper"
                    : "border-cocoa bg-paper text-cocoa shadow-pop-sm"
                }`}
              >
                {locState === "locating" ? <Spinner className="h-3 w-3" /> : <MapPinIcon size={11} />}
                {locState === "on" ? "Near you ✓" : locState === "off" ? "No location" : "Near me"}
              </button>
            </div>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-cocoa-soft">
                <SearchIcon size={15} />
              </span>
              <input
                id="place-input"
                ref={inputRef}
                type="text"
                autoComplete="off"
                value={query}
                placeholder="Type a café, restaurant or address…"
                onChange={(e) => {
                  setQuery(e.target.value);
                  setChosen(null);
                  setListOpen(false);
                }}
                onFocus={() => {
                  if (results.length) setListOpen(true);
                }}
                onBlur={() => {
                  blurTimer.current = window.setTimeout(() => setListOpen(false), 150);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && listOpen && results.length) {
                    e.preventDefault();
                    pick(results[0]);
                  }
                }}
                className="w-full rounded-xl border-[3px] border-cocoa bg-paper py-2.5 pr-10 pl-9 font-body text-base font-bold text-cocoa outline-none focus:border-teal"
              />
              {chosen ? (
                <button
                  type="button"
                  onClick={clearPlace}
                  aria-label="Clear place"
                  className="btn-push absolute top-1/2 right-2.5 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full border-2 border-cocoa bg-teal text-paper"
                >
                  <XIcon size={12} />
                </button>
              ) : (
                status === "searching" && (
                  <span className="absolute top-1/2 right-3 -translate-y-1/2">
                    <Spinner />
                  </span>
                )
              )}

              {/* live results */}
              {listOpen && results.length > 0 && (
                <ul className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-56 overflow-y-auto rounded-xl border-[3px] border-cocoa bg-paper text-left shadow-chunky">
                  {results.map((r, i) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          pick(r);
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-cream focus:bg-cream ${
                          i > 0 ? "border-t-2 border-cocoa/10" : ""
                        }`}
                      >
                        <MapPinIcon size={15} className="shrink-0 text-berry" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-[14.5px] font-semibold text-cocoa">
                            {r.name}
                          </span>
                          <span className="block truncate text-[12px] font-bold text-cocoa-soft">
                            {r.detail}
                          </span>
                        </span>
                        {(r.nearby || r.dist != null) && (
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            {r.nearby && (
                              <span className="rounded-full border-2 border-teal/50 bg-mint px-1.5 py-px font-display text-[10px] font-semibold text-teal-deep">
                                café
                              </span>
                            )}
                            {r.dist != null && (
                              <span className="font-display text-[10.5px] font-semibold text-cocoa-soft">
                                {fmtDist(r.dist)}
                              </span>
                            )}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!chosen && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={nearbyCafes}
                  className="btn-push flex items-center gap-1 rounded-full border-2 border-cocoa bg-sun px-2.5 py-1 font-display text-[11.5px] font-semibold text-cocoa shadow-pop-sm"
                >
                  <CoffeeIcon size={12} />
                  Cafés near me
                </button>
                {locState !== "on" && (
                  <span className="text-[11px] font-bold text-cocoa-soft">
                    ← pulls real coffee spots from the map
                  </span>
                )}
              </div>
            )}

            {chosen ? (
              <p className="mt-2 flex items-start gap-1.5 rounded-lg border-[3px] border-teal/40 bg-paper px-2.5 py-1.5 text-[12.5px] font-bold text-cocoa">
                <span className="mt-px grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-teal text-paper">
                  <CheckIcon size={11} />
                </span>
                <span className="min-w-0">
                  {chosen.name}
                  <span className="text-cocoa-soft"> · {chosen.detail}</span>
                </span>
              </p>
            ) : (
              <p className="mt-1.5 px-0.5 text-[11.5px] font-bold text-cocoa-soft">
                {status === "searching" && "Sniffing out places…"}
                {status === "error" && "Couldn't reach the map — you can still just type a place."}
                {status === "done" &&
                  results.length === 0 &&
                  `No matches for "${query.trim()}" — try adding your city, or keep it as-is.`}
                {status === "idle" &&
                  locState === "on" &&
                  "Searching near you — add a city name for far-away spots ☕"}
                {status === "idle" &&
                  locState !== "on" &&
                  "Map data via OpenStreetMap. Spot missing? Add your city — e.g. “Kaffeine London”."}
              </p>
            )}
          </div>

          {error && (
            <p className="mt-2 font-display text-sm font-semibold text-berry-deep">
              Swaraaa needs a day, a time and a place!
            </p>
          )}

          <button
            type="button"
            onClick={confirm}
            className="btn-push mt-4 flex w-full items-center justify-center gap-2 rounded-full border-4 border-cocoa bg-sun px-5 py-3 font-display text-lg font-semibold text-cocoa shadow-pop sm:mt-5 sm:px-6 sm:py-3.5 sm:text-xl"
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
