/**
 * "Etc/UTC" is UTC, and is read as UTC without asking Intl.
 *
 * A host that follows the IANA database says "Etc/UTC" (Zeal Terminal does), and
 * that spelling used to take the slow path through Intl.DateTimeFormat on every
 * `timestamp()` / `time[j]`. The corpus's "Loop is too long" pages make 40M such
 * calls: ~90 s with "UTC", unbounded with "Etc/UTC".
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { utcFromZoned, zonedFields } from "../../../runtime/v1/zones";

afterEach(() => vi.restoreAllMocks());

describe("UTC spellings skip Intl", () => {
    for (const zone of ["UTC", "Etc/UTC", "etc/utc", "GMT", "Etc/GMT", "UCT", "Zulu", "Z", undefined]) {
        it(`${zone} is the identity both ways and builds no formatter`, () => {
            const spy = vi.spyOn(Intl, "DateTimeFormat");
            const t = Date.UTC(2024, 0, 1, 12, 30);
            expect(utcFromZoned(2024, 1, 1, 12, 30, 0, zone)).toBe(t);
            expect(zonedFields(t, zone)).toBe(t);
            expect(spy).not.toHaveBeenCalled();
        });
    }

    it("a real zone still converts", () => {
        expect(utcFromZoned(2024, 1, 1, 12, 0, 0, "America/New_York")).toBe(Date.UTC(2024, 0, 1, 17, 0));
    });
});
