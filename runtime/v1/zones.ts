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

/** The fields an instant shows in `zone`, read back as if they were UTC. */
function asIfUtc(ms: number, zone: string): number {
    try {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: zone, hour12: false,
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
        }).formatToParts(new Date(ms));
        const get = (t: string) => Number(parts.find(p => p.type === t)?.value ?? 0);
        // `hour12: false` renders midnight as 24 in some ICU versions.
        return Date.UTC(get("year"), get("month") - 1, get("day"),
                        get("hour") % 24, get("minute"), get("second"));
    } catch {
        return ms;   // an unknown zone reads as UTC rather than as an error
    }
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
    if (!zone || /^(UTC|GMT)$/i.test(zone.trim())) return naive;

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
    if (!zone || /^(UTC|GMT)$/i.test(zone.trim())) return ms;

    // ICU knows "America/New_York" and not "UTC+4"; the offset forms are read
    // by the same parser `utcFromZoned` uses, so the two stay in step.
    const fixed = fixedOffsetMinutes(zone);
    if (fixed !== null) return ms + fixed * 60000;

    return asIfUtc(ms, zone);
}
