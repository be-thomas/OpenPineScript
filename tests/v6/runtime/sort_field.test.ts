/**
 * `sort_field` — sorting (April 2026) and binary search (August 2026) over
 * collections of user-defined objects.
 */
import { describe, it, expect } from "vitest";
import { value } from "../helpers";
import { attempt } from "../../../test-utils/common/transpileAs";

const H6 = '//@version=6\nindicator("t")\n';
const TYPE =
  "type Req\n    float price\n    string name\n    int timestamp\n" +
  'a = array.from(Req.new(3.0, "c", 20), Req.new(1.0, "a", 30), Req.new(2.0, "b", 10))\n';
const field = (f: string) => `x = str.tostring(a.get(0).${f}) + str.tostring(a.get(1).${f}) + str.tostring(a.get(2).${f})\n`;

describe("array.sort with sort_field", () => {
  it("defaults to the first field", () => {
    expect(value(H6 + TYPE + "array.sort(a)\n" + field("price"), "x")).toBe("123");
  });

  it("takes a field name", () => {
    expect(value(H6 + TYPE + 'a.sort(sort_field = "timestamp")\n' + field("timestamp"), "x")).toBe("102030");
  });

  it("takes a field index, and sorts strings", () => {
    expect(value(H6 + TYPE + "a.sort(order.descending, sort_field = 1)\n" + field("name"), "x")).toBe("cba");
  });

  it("rejects a name the type does not have", () => {
    expect(() => value(H6 + TYPE + 'a.sort(sort_field = "nope")\nx = 1\n', "x")).toThrow(/does not name a field of 'Req'/);
  });

  it("leaves plain number arrays sorting as before", () => {
    expect(value(H6 + "b = array.from(3, 10, 2)\nb.sort()\nx = str.tostring(b)\n", "x")).toBe("[2, 3, 10]");
  });
});

describe("array.sort_indices", () => {
  it("gives the order without moving anything", () => {
    const src = H6 + TYPE + 'i = a.sort_indices(sort_field = "timestamp")\nx = str.tostring(i) + a.get(0).name\n';
    expect(value(src, "x")).toBe("[2, 0, 1]c");
  });
});

describe("binary search with sort_field", () => {
  const SORTED = H6 + TYPE + 'a.sort(sort_field = "timestamp")\n';

  it("finds a field value", () => {
    expect(value(SORTED + 'x = a.binary_search(20, sort_field = "timestamp")\n', "x")).toBe(1);
    expect(value(SORTED + 'x = a.binary_search(25, sort_field = "timestamp")\n', "x")).toBe(-1);
  });

  it("leftmost and rightmost bracket a missing value", () => {
    expect(value(SORTED + 'x = a.binary_search_leftmost(25, sort_field = "timestamp")\n', "x")).toBe(1);
    expect(value(SORTED + 'x = a.binary_search_rightmost(25, sort_field = "timestamp")\n', "x")).toBe(2);
  });

  it("leftmost and rightmost pick their end of a run of duplicates", () => {
    const src = H6 + "b = array.from(1, 2, 2, 2, 3)\n";
    expect(value(src + "x = b.binary_search_leftmost(2)\n", "x")).toBe(1);
    expect(value(src + "x = b.binary_search_rightmost(2)\n", "x")).toBe(3);
  });
});

describe("matrix.sort with sort_field", () => {
  it("sorts rows by the column's object field", () => {
    const src = H6 +
      "type P\n    float v\n" +
      "m = matrix.new<P>(3, 1)\nm.set(0, 0, P.new(3))\nm.set(1, 0, P.new(1))\nm.set(2, 0, P.new(2))\n" +
      "m.sort(0)\nx = str.tostring(m.get(0, 0).v) + str.tostring(m.get(1, 0).v) + str.tostring(m.get(2, 0).v)\n";
    expect(value(src, "x")).toBe("123");
  });
});

describe("at v5", () => {
  it("sort_indices and the leftmost/rightmost searches exist, without sort_field", () => {
    // They are v5 built-ins (conformance/common/v5_gaps_golden.test.ts); only
    // the `sort_field` parameter is v6.
    const H5 = '//@version=5\nindicator("t")\n';
    for (const f of ["array.sort_indices(b)", "array.binary_search_leftmost(b, 1)", "array.binary_search_rightmost(b, 1)"]) {
      expect(attempt(5, H5 + `b = array.from(1, 2)\nx = ${f}\n`).ok, f).toBe(true);
    }
  });
});
