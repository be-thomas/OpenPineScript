/**
 * `zonedFields` reads a zone's offset once per quarter hour instead of
 * formatting every instant. It must give what formatting every instant gives,
 * across daylight-saving transitions, half-hour and 45-minute zones, and
 * sub-second times.
 */
import { describe, it, expect, vi } from "vitest";
import { zonedFields } from "../../../runtime/v1/zones";

/** The slow way, written independently: format the instant in the zone and read it back as UTC. */
const formats = new Map<string, Intl.DateTimeFormat>();
function reference(ms: number, zone: string): number {
  if (!formats.has(zone)) {
    formats.set(zone, new Intl.DateTimeFormat("en-US", {
      timeZone: zone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }));
  }
  const parts = formats.get(zone)!.formatToParts(new Date(ms));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
}

const ZONES = ["America/New_York", "Europe/London", "Asia/Kolkata", "Australia/Lord_Howe", "Asia/Kathmandu", "Pacific/Chatham"];
const MIN = 60_000;

describe("zonedFields offset cache", () => {
  it("matches formatting every instant, 2023-2026, sampled", () => {
    const from = Date.UTC(2023, 0, 1), to = Date.UTC(2026, 0, 1);
    for (const zone of ZONES) {
      for (let t = from; t < to; t += 37 * MIN + 1234) {
        if (zonedFields(t, zone) !== reference(t, zone)) throw new Error(`${zone} @ ${new Date(t).toISOString()}`);
      }
    }
  });

  it("matches minute by minute around daylight-saving transitions", () => {
    const windows: Array<[number, number]> = [
      [Date.UTC(2024, 2, 9), Date.UTC(2024, 2, 11)],      // US spring forward
      [Date.UTC(2024, 9, 31), Date.UTC(2024, 10, 4)],     // US fall back
      [Date.UTC(2024, 2, 30), Date.UTC(2024, 3, 1)],      // Europe spring forward
      [Date.UTC(2024, 3, 6), Date.UTC(2024, 3, 8)],       // Lord Howe fall back (30 min)
      [Date.UTC(2024, 8, 28), Date.UTC(2024, 8, 30)],     // Chatham spring forward (45 min zone)
    ];
    for (const zone of ZONES) {
      for (const [a, b] of windows) {
        for (let t = a; t < b; t += MIN) {
          if (zonedFields(t, zone) !== reference(t, zone)) throw new Error(`${zone} @ ${new Date(t).toISOString()}`);
        }
      }
    }
  });

  it("drops the sub-second part, as formatting does", () => {
    const t = Date.UTC(2024, 5, 3, 14, 7, 9, 876);
    expect(zonedFields(t, "America/New_York")).toBe(reference(t, "America/New_York"));
    expect(zonedFields(t, "America/New_York") % 1000).toBe(0);
  });

  it("reads an unknown zone as UTC and instants before 1970 the slow way", () => {
    expect(zonedFields(123456789, "Not/AZone")).toBe(123456789);
    const old = Date.UTC(1965, 6, 1, 12, 30, 15);
    expect(zonedFields(old, "America/New_York")).toBe(reference(old, "America/New_York"));
  });

  it("formats a few times per hour of bars, not once per bar", () => {
    const spy = vi.spyOn(Intl.DateTimeFormat.prototype, "formatToParts");
    const from = Date.UTC(2024, 5, 3, 0, 0);
    for (let i = 0; i < 1440; i++) zonedFields(from + i * MIN, "Asia/Tokyo");
    // 96 quarter hours, two reads each, and one more the first time round.
    expect(spy.mock.calls.length).toBeLessThanOrEqual(2 * 96 + 2);
    spy.mockRestore();
  });
});
