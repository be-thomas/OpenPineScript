import { specSeconds, periodEnd as resolutionEnd } from "../timeframes";
import { Context } from "../context";
import { utcFromZoned, zonedFields } from "../zones";

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
 * `timestamp(...)` — a UNIX timestamp in milliseconds, in all three spellings.
 *
 * SOURCING. TradingView's `v5-concepts-time-20` demonstrates every one, and
 * annotates each with the zone it is read in:
 *
 *     timestamp("2021-01-01")                          // "in the UTC+0 time zone"
 *     timestamp(2021, 1, 1, 0, 0)                      // "in the exchange time zone"
 *     timestamp("America/New_York", 2021, 1, 1, 0, 0)  // in the named zone
 *     timestamp("UTC0", 2021, 1, 1, 0, 0)              // in "UTC0" (UTC+0)
 *
 * ── What this used to be ────────────────────────────────────────────────────
 *
 * Only the middle one, and always in UTC. The date-STRING form returned
 * `Date.UTC(Number("2021-01-01"), …)` — NaN — so `input.time(timestamp(
 * "2021-01-01"))` was `na` and every plot gated on it drew nothing. The
 * timezone form had no parameter to bind to, so the zone was dropped and the
 * answer came back in UTC, silently off by up to half a day.
 *
 * Declared at top level, not as a member of the `time` object: Pine spells this
 * as a global `timestamp(...)`, and the registry generator only hoists top-level
 * exports to unprefixed keys. As an object member it generated
 * "time.timestamp", which no Pine source can reach.
 *
 * The parameters are named for BOTH shapes, because the keyword form has to
 * bind: `timestamp(timezone = "UTC+4", year = 2021, …)` and
 * `timestamp(year = 2021, …)` are the same function. Which shape a positional
 * call is in is decided by whether the first argument is a string.
 *
 * @returns {number} UNIX timestamp in milliseconds, or na.
 */
export function timestamp(
    ctx: Context,
    timezone?: any,
    year?: any,
    month?: any,
    day?: any,
    hour?: any,
    minute?: any,
    second?: any,
    dateString?: any,
): number {
    const u = (x: any) => (x !== null && x !== undefined && typeof x.valueOf === "function"
        ? x.valueOf() : x);
    const num = (x: any, fallback = 0) => {
        const v = Number(u(x));
        return Number.isFinite(v) ? v : fallback;
    };

    const first = u(timezone);
    const explicitString = u(dateString);

    // `timestamp("2021-01-01")` — a date string and nothing else. Parsed by the
    // platform, which handles the ISO and RFC forms the manual's examples use
    // ("2021-01-01", "3 Apr 2022 20:00 -0400"). A date-only ISO string is UTC
    // midnight, which is what the page's own comment says it should be.
    const asString = explicitString !== undefined ? explicitString
        : (typeof first === "string" && u(year) === undefined ? first : undefined);
    if (asString !== undefined) {
        const parsed = new Date(String(asString)).getTime();
        return Number.isFinite(parsed) ? parsed : NaN;
    }

    // A leading STRING is a time zone; otherwise the calendar fields start at
    // the first argument and the zone is the exchange's.
    const zoned = typeof first === "string";
    const zone = zoned ? String(first) : ctx.timezone;
    const f = zoned
        ? [year, month, day, hour, minute, second]
        : [timezone, year, month, day, hour, minute];

    return utcFromZoned(
        num(f[0]), num(f[1], 1), num(f[2], 1), num(f[3]), num(f[4]), num(f[5]), zone,
    );
}

// --- The calendar accessors, in both of their spellings ---
//
// SOURCING. The manual's Time page, on the variables:
//
//   "The `year`, `month`, `weekofyear`, `dayofmonth`, `dayofweek`, `hour`,
//    `minute`, and `second` variables hold *calendar-based* 'int' values
//    calculated from the current bar's *opening time*, expressed in the
//    exchange time zone. These variables reference the same values that
//    calendar-based functions return when they use the default `timezone`
//    argument and `time` as the `time` argument."
//
// and on the functions: "functionName(time, timezone) -> series int", where
// `timezone` "determines the time zone of the returned value".
//
// One implementation serves both spellings, which is what that last sentence
// says: the VARIABLE is the FUNCTION called with the bar's own time.
//
// ── The failure this closes ─────────────────────────────────────────────────
//
// These were declared `year(t: number)` and carried no `@getter`, so a BARE
// read of one emitted the FUNCTION OBJECT rather than a number. `year > 2014`
// compared a function to an integer — false on every bar — and
//
//     if year > 2014
//         strategy.entry("LE", strategy.long)
//
// which is TradingView's own `v3-essential-strategies-13` on a dataset that
// spans 2015 to 2017, never entered. Fourteen of the manual's strategy
// examples were silent for exactly this reason, and 53 corpus scripts read one
// of these names bare. Nothing reported it: a built-in that exists is not an
// undeclared read, and comparing a function to a number is legal JavaScript.
//
// The zero-argument form `dayofmonth()` appears twice in the corpus and falls
// out of the same signature.
//
// Declared as functions rather than `const` aliases: the generator classifies
// an exported const as a VALUE, and the call path then refuses to invoke it
// ("'month' is a value, not a function"). Declared at top level rather than as
// members of `parts`: only top-level exports are hoisted to the unprefixed
// registry keys that Pine sources actually write.

/**
 * One accessor, for the bar's own opening time or an explicit one, in `zone`.
 *
 * `ctx.timezone` is the exchange's and defaults to "UTC" — see this file's
 * header on why every accessor reads UTC rather than the host's zone.
 */
function calendar(ctx: Context, field: keyof typeof parts, time: any, timezone: any): number {
    const u = (x: any) => (x !== null && x !== undefined && typeof x.valueOf === "function"
        ? x.valueOf() : x);
    const raw = u(time);
    const at = raw === undefined || raw === null ? Number(ctx?.time) : Number(raw);
    if (!Number.isFinite(at)) return NaN;

    const zone = u(timezone);
    const named = zone === undefined || zone === null ? ctx?.timezone : String(zone);
    return parts[field](zonedFields(at, named));
}

/**
 * `year` / `year(time, timezone)` — the four-digit year.
 * @getter
 * @returns {series int} The year of `time` in `timezone`.
 */
export function year(ctx: Context, time?: any, timezone?: any): number {
    return calendar(ctx, "year", time, timezone);
}

/**
 * `month` / `month(time, timezone)` — 1 for January, 12 for December.
 * @getter
 * @returns {series int} The month of `time` in `timezone`.
 */
export function month(ctx: Context, time?: any, timezone?: any): number {
    return calendar(ctx, "month", time, timezone);
}

/**
 * `dayofmonth` / `dayofmonth(time, timezone)` — 1 to 31.
 * @getter
 * @returns {series int} The day of the month of `time` in `timezone`.
 */
export function dayofmonth(ctx: Context, time?: any, timezone?: any): number {
    return calendar(ctx, "dayofmonth", time, timezone);
}

/**
 * `dayofweek` / `dayofweek(time, timezone)` — Sunday is 1, Saturday is 7.
 * @getter
 * @returns {series int} The day of the week of `time` in `timezone`.
 */
export function dayofweek(ctx: Context, time?: any, timezone?: any): number {
    return calendar(ctx, "dayofweek", time, timezone);
}

/**
 * `hour` / `hour(time, timezone)` — 0 to 23.
 * @getter
 * @returns {series int} The hour of `time` in `timezone`.
 */
export function hour(ctx: Context, time?: any, timezone?: any): number {
    return calendar(ctx, "hour", time, timezone);
}

/**
 * `minute` / `minute(time, timezone)` — 0 to 59.
 * @getter
 * @returns {series int} The minute of `time` in `timezone`.
 */
export function minute(ctx: Context, time?: any, timezone?: any): number {
    return calendar(ctx, "minute", time, timezone);
}

/**
 * `second` / `second(time, timezone)` — 0 to 59.
 * @getter
 * @returns {series int} The second of `time` in `timezone`.
 */
export function second(ctx: Context, time?: any, timezone?: any): number {
    return calendar(ctx, "second", time, timezone);
}

/**
 * `weekofyear` / `weekofyear(time, timezone)` — the ISO week, 1 to 53.
 * @getter
 * @returns {series int} The week of the year of `time` in `timezone`.
 */
export function weekofyear(ctx: Context, time?: any, timezone?: any): number {
    return calendar(ctx, "weekofyear", time, timezone);
}

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
 * TIMEZONE. The session window, and its day mask, are evaluated in the
 * `timezone` argument when one is given, otherwise in the symbol's exchange
 * timezone (`ctx.timezone`, which a host sets with `Session.setChart`; "UTC"
 * until it does). Evidence: TradingView's Pine Logs for the ICT Silver Bullet
 * script (conformance/v5/parity/harness_ict_silver_bullet.BTCUSDT.5.csv) show
 * "0300-0400" in "America/New_York" opening at 07:00 UTC on 2026-10-05 (EDT,
 * UTC-4); evaluated in UTC it opened at 03:00. Daylight saving follows the
 * zone, so the same window opens at 08:00 UTC in winter. An unknown zone name
 * reads as UTC, as for `hour()` and the other calendar accessors.
 *
 * The `resolution` argument is accepted and ignored: honouring it means
 * re-aggregating the chart into that timeframe, which is the same missing
 * engine that blocks `heikinashi()`.
 *
 * ⚠ THE DEFAULT SESSION IS NOT APPLIED. Omitting `session` returns the bar
 * time unfiltered. TradingView instead applies the SYMBOL's session, and the
 * v4 → v5 guide records its literal fallback widening from `"23456"` (Mon-Fri)
 * to `"1234567"` (Sun-Sat) — a difference this engine therefore does not model.
 *
 * Applying either literal was tried and reverted. It needs the same exchange
 * calendar the timezone note above is missing, and Mon-Fri broke a published
 * script in the corpus outright: sunday.pine marks Sunday opens by testing
 * `dayofweek(time('D'))`, and a weekday mask makes that `na` on every bar it
 * exists to find. See the note in transpiler/common/profiles/index.ts.
 *
 * @returns {series float} The bar's UNIX time in ms, or na.
 */
export function time(
    ctx: any, _resolution?: any, session?: any,
    timezone?: any, bars_back?: any, timeframe_bars_back?: any,
): number {
    const unwrap = (x: any) => (x != null && typeof x.valueOf === "function" ? x.valueOf() : x);
    // TradingView's order is (timeframe, session, timezone, bars_back,
    // timeframe_bars_back), and the last must stay last: put third, a v5
    // script's positional `timezone` was read as a bar offset and the result
    // was na on every bar. `timezone` places the SESSION window (below).
    // `bars_back` arrived in v5; earlier versions record it the same way.
    if ((ctx?.profile?.version ?? 1) < 5 && ctx?.keywordArguments?.has?.("bars_back")) {
        ctx.droppedArguments?.add?.("time(bars_back)");
    }

    // `bars_back` (v5): "the timestamp from the bar N bars back", or for a
    // negative N the expected time of a future bar. Applied first; the
    // release notes say `timeframe_bars_back` then steps from its result.
    const barTime = barsBack(ctx, bars_back);
    if (!Number.isFinite(barTime)) return NaN;
    let t = barTime;

    // An empty timeframe is Pine's spelling of "the chart's".
    const chart = String(ctx?.resolution ?? "");
    const written = _resolution == null ? "" : String(unwrap(_resolution) ?? "");
    const spec = written.trim() === "" ? chart : written;

    if (_resolution != null && alignsHere(ctx, barTime, spec, chart)) {
        // An unparseable timeframe — "1T", a range chart — leaves the bar's
        // time as it is. It never turns a valid time into na.
        const aligned = resolutionStart(t, spec);
        if (Number.isFinite(aligned)) t = aligned;
    }

    // v6, October 2025: `timeframe_bars_back` — "the bar offset on the
    // `timeframe` argument's timeframe". It steps from the aligned start.
    if (timeframe_bars_back != null) {
        t = stepTimeframeBars(t, spec, Number(unwrap(timeframe_bars_back)));
        if (!Number.isFinite(t)) return NaN;
    }

    if (session == null) return t;

    const { ranges, days } = parseSession(String(unwrap(session)));
    if (ranges.length === 0) return t; // unparseable spec: do not silently filter

    // The session is a filter on the BAR, whatever time is returned for it,
    // read on the wall clock of `timezone` (else the exchange's).
    const zoneArg = unwrap(timezone);
    const zone = zoneArg == null || zoneArg === "" ? ctx?.timezone : String(zoneArg);
    const d = new Date(zonedFields(barTime, zone));
    if (days && !days.has(d.getUTCDay() + 1)) return NaN; // Pine: 1 = Sunday
    const minuteOfDay = d.getUTCHours() * 60 + d.getUTCMinutes();

    return ranges.some(([a, b]) => minuteOfDay >= a && minuteOfDay < b) ? t : NaN;
}

/**
 * The time of the bar `bars_back` bars from this one, on the chart's own
 * timeframe — this bar's when it is not given.
 *
 * A v5 parameter (honoured from v5; v1–v4 have no such argument). Past bars
 * are read from the bars actually seen, so a gap in the data is respected; a
 * future bar is the expected time, stepped forward one chart period at a time.
 */
function barsBack(ctx: any, bars_back: any): number {
    const unwrap = (x: any) => (x != null && typeof x.valueOf === "function" ? x.valueOf() : x);
    const now = Number(unwrap(ctx?.vars?.get?.("opsv2_time")) ?? NaN);
    const n = bars_back == null ? 0 : Math.trunc(Number(unwrap(bars_back)));
    if (n === 0 || !Number.isFinite(n) || (ctx?.profile?.version ?? 1) < 5) return now;
    if (n > 0) {
        const at = ctx?.barTimes?.[ctx.currentBarIndex - n];
        return typeof at === "number" ? at : NaN;
    }
    let t = now;
    for (let i = 0; i < -n && Number.isFinite(t); i++) t = resolutionEnd(t, String(ctx?.resolution ?? ""));
    return t;
}

/**
 * Does `time(spec)` align to the start of `spec`'s bar here?
 *
 * Only where TradingView's log shows it does. That log
 * (conformance/common/v5_gaps_golden.test.ts) is a 24/7 market on the UTC
 * calendar, the one case where a timeframe's bars and the UTC grid coincide.
 * So alignment needs all three:
 *
 *   - a timeframe HIGHER than the chart's: `time(timeframe.period)` is the
 *     bar's own open on every market, and rounding it moved a 09:15 IST
 *     hourly bar to 09:00;
 *   - an exchange timezone the host declares as UTC;
 *   - chart bars that sit on the UTC grid of their own timeframe — a US daily
 *     bar stamped 14:30Z does not, and is left alone.
 *
 * Anywhere else this engine keeps its earlier answer, the bar's own time,
 * rather than guess at an exchange's session anchor it is not told.
 */
function alignsHere(ctx: any, barTime: number, spec: string, chart: string): boolean {
    if (!ctx?.profile?.defaults?.alignsTimeframe) return false;
    const want = specSeconds(spec), have = specSeconds(chart);
    if (!(want > have)) return false;
    const tz = String(ctx?.timezone ?? "UTC").toUpperCase();
    if (tz !== "UTC" && tz !== "ETC/UTC" && tz !== "GMT" && tz !== "ETC/GMT") return false;
    return resolutionStart(barTime, chart) === barTime;
}


/**
 * The opening time of the `spec`-timeframe period containing `t`.
 *
 * UTC-anchored, as everything in this file is: minutes and seconds count from
 * the epoch, days from UTC midnight, weeks from Monday, months from the 1st.
 * TradingView anchors intraday periods to the SESSION start instead, which
 * agrees with this for any period that divides an hour and for a session
 * opening on the hour — and differs, for example, for "240" on a 09:30 open.
 */
function resolutionStart(t: number, resolution: string): number {
    const spec = String(resolution ?? "").trim().toUpperCase();
    const m = /^(\d*)([SDWM]?)$/.exec(spec);
    if (!m) return NaN;
    const count = m[1] === "" ? 1 : parseInt(m[1], 10);
    const unit = m[2];
    if (!Number.isFinite(count) || count <= 0) return NaN;

    if (unit === "" || unit === "S") {
        const span = count * (unit === "S" ? 1_000 : 60_000);
        return Math.floor(t / span) * span;
    }
    const d = new Date(t);
    const midnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    if (unit === "D") {
        const days = Math.floor(midnight / 86_400_000);
        return (days - (days % count)) * 86_400_000;
    }
    if (unit === "W") {
        // Weeks counted from the Monday before the epoch (1970-01-01 was a
        // Thursday), so "2W" groups pairs of weeks rather than ignoring its 2.
        const WEEK = 7 * 86_400_000, MONDAY = 3 * 86_400_000;
        const index = Math.floor((midnight + MONDAY) / WEEK);
        return (index - (((index % count) + count) % count)) * WEEK - MONDAY;
    }
    const monthIndex = d.getUTCFullYear() * 12 + d.getUTCMonth();
    const aligned = monthIndex - (monthIndex % count);
    return Date.UTC(Math.floor(aligned / 12), aligned % 12, 1);
}

/**
 * `timeframe_bars_back` (v6, October 2025): the opening time of the period
 * `n` bars of the `resolution` timeframe away from the one containing `t`.
 * "Positive values go back in time; negative values give the expected time of
 * a future bar."
 *
 * Aligns first, so it is correct whether or not the caller already did.
 */
function stepTimeframeBars(t: number, resolution: string, n: number): number {
    const start = resolutionStart(t, resolution);
    if (!Number.isFinite(start) || !Number.isFinite(n)) return NaN;
    const steps = Math.trunc(n);
    if (steps === 0) return start;

    // Arithmetic, not a loop: the offset is a script value, and stepping one
    // period at a time made `timeframe_bars_back = 50000000` on "1" take
    // seconds per bar. Every unit is a fixed span on the UTC calendar except
    // the month, which is stepped by month index instead.
    const spec = String(resolution ?? "").trim().toUpperCase();
    const m = /^(\d*)([SDWM]?)$/.exec(spec)!;
    const count = m[1] === "" ? 1 : parseInt(m[1], 10);
    const unit = m[2];
    if (unit === "M") {
        const d = new Date(start);
        const index = d.getUTCFullYear() * 12 + d.getUTCMonth() - steps * count;
        return Date.UTC(Math.floor(index / 12), ((index % 12) + 12) % 12, 1);
    }
    const span = unit === "S" ? 1_000 : unit === "" ? 60_000 : unit === "D" ? 86_400_000 : 7 * 86_400_000;
    return start - steps * count * span;
}

/**
 * `time_close(resolution, session, timezone)` — the bar's CLOSING time.
 *
 * Added in Pine v4. Where `time` is the instant a bar opened, this is the
 * instant it closes, which is what a script needs to place a drawing at the
 * right-hand edge of the current bar rather than its left.
 *
 * It is derived from the chart's resolution rather than read from the data,
 * because the closing time of the bar being evaluated is the OPENING time of a
 * bar that has not arrived yet — on the last bar there is no next bar to read.
 *
 * `session` filters exactly as it does for `time()`, in the same timezone
 * (the `timezone` argument, else the exchange's).
 *
 * Marked `@getter` because Pine documents it as "both a variable and a
 * function": bare `time_close` must read as the current bar's closing time,
 * while `time_close("D")` still resolves through the ordinary call path. `time`
 * itself does not need the tag only because the runtime binds an `opsv2_time`
 * SERIES into the sandbox for the bare form to find; there is no such series
 * here, and without the tag `plot(time_close)` plotted the function object,
 * which reads as `na`.
 *
 * @getter
 * @returns {series float} The bar's closing UNIX time in ms, or na.
 */
export function time_close(
    ctx: any, resolution?: any, session?: any,
    timezone?: any, bars_back?: any, timeframe_bars_back?: any,
): number {
    const open = time(ctx, resolution, session, timezone, bars_back, timeframe_bars_back);
    if (!Number.isFinite(open)) return NaN;

    const unwrap = (x: any) => (x != null && typeof x.valueOf === "function" ? x.valueOf() : x);
    // "" is the chart's timeframe, as in `time()`; read as a spec it was one
    // minute, and `time_close("")` on a daily chart was the open plus 60 s.
    const written = resolution == null ? "" : String(unwrap(resolution) ?? "");
    const spec = written.trim() === "" ? ctx?.resolution : written;
    return resolutionEnd(open, String(spec));
}

/**
 * `time_tradingday` — the start of the trading day the bar belongs to.
 *
 * Added in Pine v4 (February 2021): "the beginning time of the trading day the
 * current bar belongs to". The v5 manual states it as the 00:00 UTC start of
 * the last trading day in the bar's final session.
 *
 * With no exchange calendar this is UTC midnight of the bar's own day — exact
 * for a symbol whose session does not straddle midnight, and shifted for one
 * that does. Same limitation, and same remedy, as the rest of this file:
 * supply bar timestamps already shifted to the exchange timezone.
 *
 * @getter
 * @returns {series float} UNIX time of the trading day's start, in ms.
 */
export function time_tradingday(ctx: any): number {
    const t = Number(ctx?.time ?? NaN);
    if (!Number.isFinite(t)) return NaN;
    const d = new Date(t);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
