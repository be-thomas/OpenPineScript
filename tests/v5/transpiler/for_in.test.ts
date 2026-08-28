/**
 * v5 `for … in`.
 *
 * SOURCING. From the manual's Loops page, verbatim:
 *
 *   "[variables = | :=] for item in collection_id
 *        statements | continue | break
 *        return_expression"
 *
 *   "[variables = | :=] for [index, item] in collection_id"
 *
 * and on what the two variables hold:
 *
 *   arrays   "item ... holds sequential values or references from the
 *             specified collection_id"; index is its position
 *   matrices "the item represents a row array retrieved in sequence"; index is
 *            "the row's position within the matrix"
 *   maps     "the loop must use the second form"; "the index contains the key,
 *            and item contains the associated value"
 *
 * and on size:
 *
 *   "When a for…in loop changes the size of a collection during an iteration,
 *    the loop's header uses the updated size to control subsequent iterations."
 *
 *   "Attempting to add or remove a map's key-value pairs while looping through
 *    it with this structure typically causes a runtime error."
 *
 * Every claim above has a test below. It is not implemented in v1–v4: `for … in`
 * does not appear in the v4 release notes or in any of the 148 v4 examples
 * vendored from the manual, and `in` is a v5 reserved word.
 */
import { describe, it, expect } from "vitest";
import { transpile } from "../../../transpiler/common";
import { HEAD, value, build } from "../helpers";

describe("arrays iterate element-wise", () => {
  it("the single-variable form binds the ELEMENT", () => {
    const src = HEAD + "xs = array.from(1, 2, 3, 4)\ns = 0.0\nfor v in xs\n    s += v\n";
    expect(value(src, "s")).toBe(10);
  });

  it("the two-variable form binds [index, element]", () => {
    // 0*10 + 1*20 + 2*30. Getting the pair backwards gives 0*0+20*1+30*2=80
    // by coincidence for some inputs, so the weights here are distinct.
    const src = HEAD + "xs = array.from(10, 20, 30)\ns = 0.0\nfor [i, v] in xs\n    s += i * v\n";
    expect(value(src, "s")).toBe(0 + 20 + 60);
  });

  it("visits in order, starting at the first element", () => {
    const src = HEAD + 'xs = array.from("a", "b", "c")\nout = ""\nfor v in xs\n    out += v\n';
    expect(value(src, "out")).toBe("abc");
  });

  it("an empty collection runs the body zero times", () => {
    const src = HEAD + "xs = array.new<float>(0)\nn = 0.0\nfor v in xs\n    n += 1\n";
    expect(value(src, "n")).toBe(0);
  });
});

describe("matrices iterate row-wise", () => {
  it("the item is a ROW, not a cell", () => {
    // 2 rows of 2 → array.size(row) is 2 each time, so 4 in total. If the loop
    // yielded cells instead, `array.size` would throw on a number.
    const src = HEAD + "m = matrix.new<float>(2, 2, 3)\nn = 0.0\nfor row in m\n    n += array.size(row)\n";
    expect(value(src, "n")).toBe(4);
  });

  it("the index is the row's position", () => {
    const src = HEAD + "m = matrix.new<float>(3, 2, 1)\ns = 0.0\nfor [i, row] in m\n    s += i\n";
    expect(value(src, "s")).toBe(0 + 1 + 2);
  });

  it("nests, so the rows can be iterated in turn", () => {
    const src = HEAD +
      "m = matrix.new<float>(2, 3, 2)\ns = 0.0\nfor row in m\n    for v in row\n        s += v\n";
    expect(value(src, "s")).toBe(12);
  });
});

describe("maps iterate pair-wise", () => {
  const MAP = HEAD +
    'm = map.new<string, float>()\n' +
    'map.put(m, "a", 1)\n' +
    'map.put(m, "b", 2)\n' +
    'map.put(m, "c", 4)\n';

  it("index is the KEY and item is the VALUE", () => {
    expect(value(MAP + 'k = ""\nfor [key, v] in m\n    k += key\n', "k")).toBe("abc");
    expect(value(MAP + "s = 0.0\nfor [key, v] in m\n    s += v\n", "s")).toBe(7);
  });

  it("the single-variable form is refused, as the manual requires", () => {
    // "the loop must use the second form with both index and item".
    // Silently binding the value would be worse than an error: the script
    // would run and quietly iterate something it did not ask for.
    expect(() => value(MAP + "n = 0.0\nfor v in m\n    n += 1\n", "n"))
      .toThrow(/needs two loop variables/);
  });

  it("adding a pair mid-loop is a runtime error", () => {
    const src = MAP + 'n = 0.0\nfor [key, v] in m\n    map.put(m, key + "!", v)\n    n += 1\n';
    expect(() => value(src, "n")).toThrow(/changed size during iteration/);
  });
});

describe("the header re-reads the size, for arrays and matrices", () => {
  it("a push inside the loop lengthens the iteration", () => {
    // "the loop's header uses the updated size to control subsequent
    // iterations". Starting from one element and pushing until size 4, a
    // snapshot-based loop would run once; a live one runs four times.
    const src = HEAD +
      "xs = array.from(1)\n" +
      "n = 0.0\n" +
      "for v in xs\n" +
      "    n += 1\n" +
      "    if array.size(xs) < 4\n" +
      "        array.push(xs, 1)\n";
    expect(value(src, "n")).toBe(4);
  });

  it("a pop inside the loop shortens it", () => {
    const src = HEAD +
      "xs = array.from(1, 2, 3, 4, 5, 6)\n" +
      "n = 0.0\n" +
      "for v in xs\n" +
      "    n += 1\n" +
      "    array.pop(xs)\n";
    // Each pass consumes one from the front (the cursor) and one from the back.
    expect(value(src, "n")).toBe(3);
  });
});

describe("break and continue", () => {
  it("break stops the loop where it stands", () => {
    const src = HEAD +
      "xs = array.from(1, 2, 3, 4, 5)\n" +
      "found = -1.0\n" +
      "for [i, v] in xs\n" +
      "    if v == 3\n" +
      "        found := i\n" +
      "        break\n";
    expect(value(src, "found")).toBe(2);
  });

  it("continue skips the rest of the iteration only", () => {
    const src = HEAD +
      "xs = array.from(1, 2, 3, 4)\n" +
      "s = 0.0\n" +
      "for v in xs\n" +
      "    if v % 2 == 0\n" +
      "        continue\n" +
      "    s += v\n";
    expect(value(src, "s")).toBe(1 + 3);
  });
});

describe("it is an EXPRESSION", () => {
  it("evaluates to the last value its body produced", () => {
    // "[variables = | :=] for item in collection_id ... return_expression"
    const src = HEAD + "xs = array.from(1, 2, 3)\nlast = for v in xs\n    v * 2\n";
    expect(value(src, "last")).toBe(6);
  });

  it("is na when the body never ran", () => {
    const src = HEAD + "xs = array.new<float>(0)\nlast = for v in xs\n    v\n";
    expect(Number.isNaN(value(src, "last"))).toBe(true);
  });

  it("can be the body of a user function", () => {
    const src = HEAD +
      "total(xs) =>\n" +
      "    s = 0.0\n" +
      "    for v in xs\n" +
      "        s += v\n" +
      "    s\n" +
      "r = total(array.from(5, 6, 7))\n";
    expect(value(src, "r")).toBe(18);
  });
});

describe("the collection has to be one", () => {
  it("a number is refused by name rather than iterated as nothing", () => {
    const src = HEAD + "n = 0.0\nfor v in close\n    n += 1\n";
    expect(() => value(src, "n")).toThrow(/expected an array, matrix or map/);
  });
});

describe("it is a v5 addition", () => {
  for (const version of [1, 2, 3, 4]) {
    it(`v${version} does not accept it`, () => {
      const head = version === 1 ? 'study("t")\n' : `//@version=${version}\nstudy("t")\n`;
      // Before v5, `in` is an ordinary identifier, so `for v in xs` is two
      // names where the grammar wants `=` — a parse error, not a guard.
      expect(() => transpile(head + "s = 0.0\nfor v in xs\n    s := s + 1\n"))
        .toThrow(/parsing failed/);
    });
  }

  it("the numeric `for` still works alongside it", () => {
    const src = HEAD + "s = 0.0\nfor i = 0 to 4\n    s += i\n";
    expect(value(src, "s")).toBe(10);
  });

  it("emits a real for-of, so break is legal JavaScript", () => {
    const { js } = build(HEAD + "xs = array.from(1)\nfor v in xs\n    break\n");
    expect(js).toContain("ctx.forIn(");
    expect(js).toContain("for (const ");
  });
});
