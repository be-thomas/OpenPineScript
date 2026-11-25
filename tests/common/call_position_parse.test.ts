/**
 * The position at the end of a call id is read without a backtracking regex:
 * a script importing a long chain of libraries produced an id that made
 * `(?:~L\d+:C\d+)*` throw "Stack overflow" (popular-author batch 2026-11-21).
 */
import { describe, it, expect } from "vitest";
import { parseCallPosition } from "../../runtime/v1/context";

describe("parseCallPosition", () => {
  it("reads a plain position", () => {
    const m = parseCallPosition("array.get@L45:C12")!;
    expect([m[1], m[2], m[3]]).toEqual(["45", "12", undefined]);
  });

  it("reads a library position", () => {
    const m = parseCallPosition("array.get@L4:C14@L")!;
    expect([m[1], m[2], m[3]]).toEqual(["4", "14", "L"]);
  });

  it("reads a chain of positions, the first being the call's own", () => {
    const m = parseCallPosition("f@L7:C2~L3:C1~L9:C9@lib")!;
    expect([m[1], m[2], m[3]]).toEqual(["7", "2", "lib"]);
  });

  it("finds nothing in an id without a position", () => {
    expect(parseCallPosition("plot")).toBeNull();
    expect(parseCallPosition("f@L7:C2~junk")).toBeNull();
  });

  it("survives a very long chain", () => {
    const chain = "~L12:C34".repeat(5_000_000)  // the old regex overflowed the stack at this length;
    const m = parseCallPosition(`call@L1:C2${chain}@lib`)!;
    expect([m[1], m[2], m[3]]).toEqual(["1", "2", "lib"]);
  });
});
