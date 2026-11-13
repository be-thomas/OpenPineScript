/**
 * Named time zones, without a time-zone database.
 *
 * `Intl.DateTimeFormat` already carries one, so the offset of a zone at a given
 * instant can be recovered by formatting that instant IN the zone and reading
 * the result back as if it were UTC: the difference is the offset. That handles
 * daylight saving without a table, because ICU already knows.
 *
 * Not in runtime/v1/stdlib/, where every exported name would become a Pine
 * built-in — see the header of ./timeframes.ts for the same reason.
 */

/**
 * One formatter per zone. Building an `Intl.DateTimeFormat` costs far more
 * than using one, and a script that reads `hour` or `time("..", tz)` does it
 * on every bar: on 110,000 bars it was 40% of the run.
 */
const formatters = new Map<string, Intl.DateTimeFormat | null>();

function formatterFor(zone: string): Intl.DateTimeFormat | null {
    let f = formatters.get(zone);
    if (f === undefined) {
        try {
            f = new Intl.DateTimeFormat("en-US", {
                timeZone: zone, hour12: false,
                year: "numeric", month: "2-digit", day: "2-digit",
                hour: "2-digit", minute: "2-digit", second: "2-digit",
            });
        } catch {
            f = null;   // an unknown zone
        }
        formatters.set(zone, f);
    }
    return f;
}

/** The fields an instant shows in `zone`, read back as if they were UTC. */
function formatAsIfUtc(ms: number, zone: string): number {
    try {
        const f = formatterFor(zone);
        if (!f) return ms;   // an unknown zone reads as UTC rather than as an error
        const parts = f.formatToParts(new Date(ms));
        const get = (t: string) => Number(parts.find(p => p.type === t)?.value ?? 0);
        // `hour12: false` renders midnight as 24 in some ICU versions.
        return Date.UTC(get("year"), get("month") - 1, get("day"),
                        get("hour") % 24, get("minute"), get("second"));
    } catch {
        return ms;
    }
}

/**
 * A zone's offset is constant between transitions, and every transition since
 * 1970 falls on a quarter-hour boundary of UTC. So the offset is read once per
 * quarter hour (at both ends, and cached only if they agree) and the rest of
 * that block is arithmetic. Anything else takes the formatter, as before.
 */
const BLOCK_MS = 15 * 60 * 1000;
const offsets = new Map<string, Map<number, number>>();

function asIfUtc(ms: number, zone: string): number {
    if (!(ms >= 0 && ms < 8.64e15 - BLOCK_MS) || !formatterFor(zone)) return formatAsIfUtc(ms, zone);

    let zoneOffsets = offsets.get(zone);
    if (!zoneOffsets) offsets.set(zone, zoneOffsets = new Map());
    const block = Math.floor(ms / BLOCK_MS);
    let offset = zoneOffsets.get(block);
    if (offset === undefined) {
        const start = block * BLOCK_MS, last = start + BLOCK_MS - 1000;
        const a = formatAsIfUtc(start, zone) - start;
        if (a !== formatAsIfUtc(last, zone) - last) return formatAsIfUtc(ms, zone);
        if (zoneOffsets.size > 200_000) zoneOffsets.clear();
        zoneOffsets.set(block, offset = a);
    }
    // The formatter reads whole seconds, so the fraction is dropped, as it was.
    return Math.floor(ms / 1000) * 1000 + offset;
}

/**
 * Pine's time zone spellings.
 *
 * "UTC" and "GMT" with an optional signed offset — `"UTC+4"`, `"UTC-5"`,
 * `"GMT+0530"` — alongside IANA names like `"America/New_York"`. ICU knows the
 * second kind and not the first, so the offset forms are read here.
 */
function fixedOffsetMinutes(zone: string): number | null {
    const m = /^(?:UTC|GMT)([+-])?(\d{1,2})?:?(\d{2})?$/i.exec(zone.trim());
    if (!m) return null;
    const sign = m[1] === "-" ? -1 : 1;
    const hours = m[2] === undefined ? 0 : Number(m[2]);
    // "UTC+0530" — four digits with no colon are hours and minutes.
    const rawMinutes = m[3] !== undefined ? Number(m[3]) : 0;
    return sign * (hours * 60 + rawMinutes);
}

/**
 * Spellings of UTC itself, which need no conversion at all. "Etc/UTC" is what
 * a host that follows the IANA database names UTC; left out of this fast path
 * it went through `Intl` on every call, and a script that calls `timestamp()`
 * or `time[j]` in a loop (the corpus's "Loop is too long" pages, 40M calls)
 * went from ~90 s to not finishing.
 */
function isUtc(zone: string | undefined): boolean {
    return !zone || /^(?:ETC\/)?(?:UTC|GMT|UCT|ZULU)$|^Z$/i.test(zone.trim());
}

/**
 * The UTC instant of a wall-clock reading in `zone`.
 *
 * The inverse of `asIfUtc`, and iterated once: the offset that applies is the
 * one at the ANSWER, not at the guess, and near a daylight-saving boundary
 * those differ by an hour. One correction is enough for every real zone.
 */
export function utcFromZoned(
    year: number, month: number, day: number,
    hour: number, minute: number, second: number,
    zone: string | undefined,
): number {
    const naive = Date.UTC(year, month - 1, day, hour, minute, second);
    if (isUtc(zone)) return naive;

    const fixed = fixedOffsetMinutes(zone);
    if (fixed !== null) return naive - fixed * 60000;

    let answer = naive - (asIfUtc(naive, zone) - naive);
    answer = naive - (asIfUtc(answer, zone) - answer);
    return answer;
}

/**
 * An instant re-expressed so its UTC fields ARE the wall clock in `zone`.
 *
 * The forward direction of `utcFromZoned`, and the one the calendar accessors
 * need: `hour(t, "America/New_York")` wants the hour a New York clock shows at
 * `t`, which is `new Date(zonedFields(t, "America/New_York")).getUTCHours()`.
 *
 * The result is NOT a real instant and must not be compared with one. It exists
 * to be read field by field.
 */
export function zonedFields(ms: number, zone: string | undefined): number {
    if (!Number.isFinite(ms)) return NaN;
    if (isUtc(zone)) return ms;

    // ICU knows "America/New_York" and not "UTC+4"; the offset forms are read
    // by the same parser `utcFromZoned` uses, so the two stay in step.
    const fixed = fixedOffsetMinutes(zone);
    if (fixed !== null) return ms + fixed * 60000;

    return asIfUtc(ms, zone);
}
