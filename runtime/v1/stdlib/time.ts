import { Context } from "../context";

/**
 * time.ts - Pine Script v2 Time Functions and Variables
 *
 * ── Every accessor below reads UTC, deliberately ────────────────────────────
 *
 * These previously used the LOCAL-timezone getters (`getFullYear`, `getDay`,
 * `getHours`, …), which made the engine's answers depend on the machine it ran
 * on AND contradicted the rest of the engine:
 *
 *   - `timestamp(y, m, d, …)` builds a UTC instant via Date.UTC
 *   - `time(resolution, session)` compares in UTC
 *   - the multi-timeframe resampler buckets by UTC day/week/month
 *
 * so `year(timestamp(2020, 1, 1))` returned 2019 anywhere west of Greenwich,
 * and `dayofweek()` was off by a day for half the world. Reading UTC throughout
 * makes the engine self-consistent and its output reproducible.
 *
 * This is NOT the same thing as matching TradingView exactly. TradingView
 * evaluates calendar values in the EXCHANGE's timezone, and this engine has no
 * exchange calendar. The supported way to model that is to feed bar timestamps
 * already shifted to the exchange timezone — which only works because these
 * accessors read UTC rather than the host's zone.
 */
const parts = {
    /**
     * Returns the year for the given timestamp.
     * @param {number} t - UNIX timestamp in milliseconds.
     * @returns {number} The full year (e.g., 2026).
     */
    "year": (t: number): number => new Date(t).getUTCFullYear(),

    /**
     * Returns the month for the given timestamp.
     * In Pine Script, months are 1-indexed (January = 1, December = 12).
     * @param {number} t - UNIX timestamp in milliseconds.
     * @returns {number} The month of the year (1-12).
     */
    "month": (t: number): number => new Date(t).getUTCMonth() + 1,

    /**
     * Returns the ISO week of the year for the given timestamp.
     * @param {number} t - UNIX timestamp in milliseconds.
     * @returns {number} The week number (1-53).
     */
    "weekofyear": (t: number): number => {
        const date = new Date(t);
        date.setUTCHours(0, 0, 0, 0);
        // Thursday in the current week decides the year.
        date.setUTCDate(date.getUTCDate() + 3 - (date.getUTCDay() + 6) % 7);
        // January 4 is always in week 1.
        const week1 = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
        // Adjust to Thursday in week 1 and count the weeks between.
        return 1 + Math.round(
            ((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getUTCDay() + 6) % 7) / 7,
        );
    },

    /**
     * Returns the day of the month for the given timestamp.
     * @param {number} t - UNIX timestamp in milliseconds.
     * @returns {number} The day of the month (1-31).
     */
    "dayofmonth": (t: number): number => new Date(t).getUTCDate(),
    
    /**
     * Returns the day of the week for the given timestamp.
     * In Pine Script, Sunday is 1, Monday is 2, ..., Saturday is 7.
     * @param {number} t - UNIX timestamp in milliseconds.
     * @returns {number} The day of the week (1-7).
     */
    "dayofweek": (t: number): number => new Date(t).getUTCDay() + 1,
    
    /**
     * Returns the hour for the given timestamp in 24-hour format.
     * @param {number} t - UNIX timestamp in milliseconds.
     * @returns {number} The hour of the day (0-23).
     */
    "hour": (t: number): number => new Date(t).getUTCHours(),
    
    /**
     * Returns the minute for the given timestamp.
     * @param {number} t - UNIX timestamp in milliseconds.
     * @returns {number} The minute of the hour (0-59).
     */
    "minute": (t: number): number => new Date(t).getUTCMinutes(),
    
    /**
     * Returns the second for the given timestamp.
     * @param {number} t - UNIX timestamp in milliseconds.
     * @returns {number} The second of the minute (0-59).
     */
    "second": (t: number): number => new Date(t).getUTCSeconds(),

};

// No `export default`. This file used to end `export default time;` back when
// `time` named the accessor map above. Renaming that map to `parts` — needed to
// free the bare "time" registry key for the `time(resolution, session)` function
// declared below — silently repointed the default export at that function
// instead. Nothing imported it (the generator reads NAMED exports), so it was
// dead rather than broken, but it read as if it exported the accessors.
//
// The map's own "time" entry went with it. Pine's bare `time` variable never
// reached it either: initializeSandbox binds `opsv2_time` straight to the
// Context series, so a bare `time` resolves there and only `time(...)` calls go
// through the registry.

/**
 * Constructs a UNIX timestamp (ms) from calendar components (UTC).
 * Pine months are 1-indexed (January = 1); JS Date.UTC expects 0-indexed.
 *
 * Declared at top level, not as a member of the `time` object: Pine spells this
 * as a global `timestamp(...)`, and the registry generator only hoists top-level
 * exports to unprefixed keys. As an object member it generated
 * "time.timestamp", which no Pine source can reach.
 *
 * @returns {number} UNIX timestamp in milliseconds.
 */
export function timestamp(
    year: number,
    month: number,
    day: number,
    hour: number = 0,
    minute: number = 0,
    second: number = 0
): number {
    return Date.UTC(
        Number(year), Number(month) - 1, Number(day),
        Number(hour), Number(minute), Number(second),
    );
}

// --- Bare global spellings (v1-v3) ---
//
// Pine v1-v3 spell these as globals: `month(time)`, `dayofweek(time)`.
// The registry generator only hoists TOP-LEVEL exports to unprefixed keys, so
// as members of the `time` object they were reachable only as `parts.month`,
// which no Pine source writes.
//
// Declared as functions, not `const` aliases: the generator classifies an
// exported const as a VALUE, and the call path then refuses to invoke it
// ("'month' is a value, not a function").
export function year(t: number): number { return parts.year(t); }
export function month(t: number): number { return parts.month(t); }
export function dayofmonth(t: number): number { return parts.dayofmonth(t); }
export function dayofweek(t: number): number { return parts.dayofweek(t); }
export function hour(t: number): number { return parts.hour(t); }
export function minute(t: number): number { return parts.minute(t); }
export function second(t: number): number { return parts.second(t); }
export function weekofyear(t: number): number { return parts.weekofyear(t); }

// ─── time(resolution, session) ──────────────────────────────────────────────

/**
 * Parses a Pine session specification into minute-of-day ranges and a day mask.
 *
 * Format: `"HHMM-HHMM"`, optionally several ranges separated by commas, and
 * optionally a day mask after a colon where 1 = Sunday … 7 = Saturday:
 *
 *     "0930-1600"            regular US cash session
 *     "0930-1600:23456"      the same, weekdays only
 *     "1700-2400,0000-1600"  a session that spans midnight, written as two
 *
 * A range whose end is not after its start (e.g. "2100-0400") wraps midnight
 * and is treated as two ranges.
 */
function parseSession(spec: string): { ranges: Array<[number, number]>; days: Set<number> | null } {
    const [rangePart, dayPart] = String(spec).split(":");
    const ranges: Array<[number, number]> = [];

    for (const chunk of rangePart.split(",")) {
        const m = /^\s*(\d{3,4})\s*-\s*(\d{3,4})\s*$/.exec(chunk);
        if (!m) continue;
        const toMin = (v: string) => {
            const n = v.padStart(4, "0");
            return parseInt(n.slice(0, 2), 10) * 60 + parseInt(n.slice(2), 10);
        };
        const start = toMin(m[1]);
        const end = toMin(m[2]);
        if (end > start) ranges.push([start, end]);
        else ranges.push([start, 1440], [0, end]); // wraps midnight
    }

    const days = dayPart
        ? new Set(dayPart.trim().split("").map(Number).filter(n => n >= 1 && n <= 7))
        : null;
    return { ranges, days };
}

/**
 * `time(resolution)` / `time(resolution, session)`.
 *
 * With one argument, the current bar's UNIX time. With a session, the bar's
 * time when it falls INSIDE that session and `na` otherwise — which is how
 * pre-v4 scripts express "only trade the cash session".
 *
 * ⚠ TIMEZONE. TradingView evaluates the session in the EXCHANGE's timezone.
 * This engine has no exchange calendar, so it evaluates in UTC. For a symbol
 * whose exchange is not UTC the session boundaries are shifted, and a script
 * that filters on them will differ from TradingView. Supplying bar timestamps
 * pre-shifted to the exchange timezone makes the two agree. Documented rather
 * than silently approximated — see dev-docs/04-skipped-restrictions.md.
 *
 * The `resolution` argument is accepted and ignored: honouring it means
 * re-aggregating the chart into that timeframe, which is the same missing
 * engine that blocks `heikinashi()`.
 *
 * @returns {series float} The bar's UNIX time in ms, or na.
 */
export function time(ctx: any, _resolution?: any, session?: any): number {
    const unwrap = (x: any) => (x != null && typeof x.valueOf === "function" ? x.valueOf() : x);
    const t = Number(unwrap(ctx?.vars?.get?.("opsv2_time")) ?? NaN);
    if (!Number.isFinite(t)) return NaN;
    if (session == null) return t;

    const { ranges, days } = parseSession(String(unwrap(session)));
    if (ranges.length === 0) return t; // unparseable spec: do not silently filter

    const d = new Date(t);
    if (days && !days.has(d.getUTCDay() + 1)) return NaN; // Pine: 1 = Sunday
    const minuteOfDay = d.getUTCHours() * 60 + d.getUTCMinutes();

    return ranges.some(([a, b]) => minuteOfDay >= a && minuteOfDay < b) ? t : NaN;
}
