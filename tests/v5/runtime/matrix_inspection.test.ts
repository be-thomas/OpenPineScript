/**
 * The `matrix.is_*()` family, `matrix.reverse()`, and the two limits the
 * Matrices page states.
 *
 * SOURCING. Each predicate's meaning is the line TradingView's own `inspect()`
 * example prints when it is true:
 *
 *   is_binary        "Contains only 1s and 0s."
 *   is_triangular    "Contains only 0s above and/or below its main diagonal."
 *   is_diagonal      "Only has nonzero values in its main diagonal."
 *   is_antidiagonal  "Only has nonzero values in its main antidiagonal."
 *   is_symmetric     "Equals its transpose."
 *   is_antisymmetric "Equals the negative of its transpose."
 *   is_identity      "Is the identity matrix."
 *
 * `matrix.reverse()` "moves the references of an m-by-n matrix id at the i-th
 * row and j-th column to the m - 1 - i row and n - 1 - j column".
 *
 * The limits:
 *
 *   "The row/column index must be 0 <= from_row/column < to_row/column …
 *    Otherwise, the script will raise a runtime error."
 *   "The total number of elements in a matrix … cannot exceed 100,000."
 *
 * `matrix.is_stochastic()` is deliberately absent — see the note in
 * runtime/v1/stdlib/matrix.ts. The manual lists it and never says which
 * convention it means.
 */
import { describe, it, expect } from "vitest";
import { HEAD, value, build } from "../helpers";

/** `matrix.new<float>()` then one `add_col` per column — the manual's shape. */
const rows = (...cols: number[][]) =>
  "m = matrix.new<float>()\n" +
  cols.map((c, i) => `m.add_col(${i}, array.from(${c.map(x => x.toFixed(1)).join(", ")}))\n`).join("");

describe("an EMPTY matrix takes its shape from the first column", () => {
  // `matrix.new<float>()` followed by `add_col` is how four of TradingView's
  // own examples build a matrix, and requiring the rows to exist first rejected
  // every one of them: "column has 2 elements, matrix has 0 rows".
  it("two 2-element columns make a 2x2", () => {
    const src = HEAD + rows([1, 3], [2, 4]) + "r = m.rows()\nc = m.columns()\n";
    expect(value(src, "r")).toBe(2);
    expect(value(src, "c")).toBe(2);
  });

  it("the elements land where the manual says", () => {
    const src = HEAD + rows([1, 3], [2, 4]) + "a = m.get(0, 1)\nb = m.get(1, 0)\n";
    expect(value(src, "a")).toBe(2);
    expect(value(src, "b")).toBe(3);
  });

  it("add_row already did this, and still does", () => {
    const src = HEAD +
      "m = matrix.new<float>()\nm.add_row(0, array.from(1.0, 2.0, 3.0))\nc = m.columns()\n";
    expect(value(src, "c")).toBe(3);
  });

  it("a column of the wrong length is still refused once the shape is fixed", () => {
    // TradingView's `v5-language-matrices-37`: "Raises a runtime error because
    // `m` has 2 rows, not 3."
    const src = HEAD + rows([1, 2]) + "m.add_col(1, array.from(1.0, 2.0, 3.0))\n";
    expect(() => build(src).exec()).toThrow(/has 3 elements, matrix has 2 rows/);
  });
});

describe("the is_* predicates", () => {
  const IDENTITY = rows([1, 0], [0, 1]);
  const CASES: Array<[string, string, boolean]> = [
    ["is_binary", IDENTITY, true],
    ["is_binary", rows([1, 2], [0, 1]), false],
    ["is_identity", IDENTITY, true],
    ["is_identity", rows([1, 0], [0, 2]), false],
    ["is_diagonal", rows([5, 0], [0, 7]), true],
    ["is_diagonal", rows([5, 1], [0, 7]), false],
    ["is_antidiagonal", rows([0, 1], [2, 0]), true],
    ["is_antidiagonal", rows([1, 1], [2, 0]), false],
    ["is_symmetric", rows([1, 2], [2, 3]), true],
    ["is_symmetric", rows([1, 9], [2, 3]), false],
    ["is_antisymmetric", rows([0, -2], [2, 0]), true],
    ["is_antisymmetric", rows([1, 2], [2, 0]), false],
    ["is_triangular", rows([1, 0], [2, 3]), true],
    ["is_triangular", rows([1, 4], [2, 3]), false],
  ];

  for (const [fn, body, expected] of CASES) {
    it(`${fn} is ${expected} for that matrix`, () => {
      expect(value(HEAD + body + `x = m.${fn}()\n`, "x")).toBe(expected);
    });
  }

  it("a non-square matrix is none of the square-only ones", () => {
    const src = HEAD + rows([0, 0, 0], [0, 0, 0]) +
      "a = m.is_identity()\nb = m.is_symmetric()\nc = m.is_diagonal()\n";
    expect([value(src, "a"), value(src, "b"), value(src, "c")]).toEqual([false, false, false]);
  });

  it("...but is_binary does not need one", () => {
    expect(value(HEAD + rows([0, 1, 0], [1, 0, 1]) + "x = m.is_binary()\n", "x")).toBe(true);
  });
});

describe("matrix.reverse", () => {
  it("moves (i, j) to (m-1-i, n-1-j)", () => {
    const src = HEAD + rows([1, 3], [2, 4]) + "m.reverse()\n" +
      "a = m.get(0, 0)\nb = m.get(1, 1)\n";
    // The 2x2 is [[1,2],[3,4]]; reversed it is [[4,3],[2,1]].
    expect(value(src, "a")).toBe(4);
    expect(value(src, "b")).toBe(1);
  });

  it("is in place and returns nothing to depend on", () => {
    const src = HEAD + rows([1, 3], [2, 4]) + "m.reverse()\nm.reverse()\nx = m.get(0, 0)\n";
    expect(value(src, "x")).toBe(1);
  });
});

describe("the documented limits raise where TradingView says they do", () => {
  it("submatrix with from_row == to_row", () => {
    // "`from_row` can't equal `to_row`." It used to return an EMPTY matrix and
    // let the script die two lines later on `mSub.get(0, 0)` — the right script
    // rejected for the wrong reason, at the wrong line.
    const src = HEAD + "m = matrix.new<float>(4, 4, 1.0)\ns = m.submatrix(from_row = 2, to_row = 2)\n";
    expect(() => build(src).exec()).toThrow(/submatrix: row range 2\.\.2 is invalid/);
  });

  it("submatrix with a to_column past the width", () => {
    // "The `to_column` index is invalid on this line. The max value is 3."
    const src = HEAD + "m = matrix.new<float>(2, 3, 0.0)\ns = m.submatrix(from_column = 1, to_column = 4)\n";
    expect(() => build(src).exec()).toThrow(/submatrix: column range 1\.\.4 is invalid/);
  });

  it("a valid range still works", () => {
    const src = HEAD + "m = matrix.new<float>(4, 4, 1.0)\ns = m.submatrix(0, 2, 0, 2)\nx = s.rows()\n";
    expect(value(src, "x")).toBe(2);
  });

  it("more than 100,000 elements", () => {
    const src = HEAD + "m = matrix.new<float>(1000, 101, 1.0)\n";
    expect(() => build(src).exec()).toThrow(/too large.*maximum is 100000/);
  });

  it("...and 100,000 exactly is fine", () => {
    expect(value(HEAD + "m = matrix.new<float>(1000, 100, 1.0)\nx = m.elements_count()\n", "x"))
      .toBe(100000);
  });
});
