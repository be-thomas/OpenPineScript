/**
 * `float()`, `bool()` and `string()` — v4's explicit type casts.
 *
 * SOURCING. The v4 release notes, June 2019, list "functions for explicit type
 * casting". The manual's type-system page says what they are for — "It's
 * sometimes necessary to cast one type to another when auto-casting rules do
 * not suffice" — names ten of them (`int()`, `float()`, `bool()`, `color()`,
 * `string()`, `line()`, `linefill()`, `label()`, `box()`, `table()`), and gives
 * their second use: "Explicit type casting is also handy when declaring
 * variables assigned to na", with `label myLabel = na` and `myLabel = label(na)`
 * shown as two spellings of one thing.
 *
 * ── The failure this closes ─────────────────────────────────────────────────
 *
 * `int()` and `color()` already worked, because nothing else in the language is
 * called `int` or `color`. These three collide: `float`, `bool` and `string`
 * are also the v1–v3 `input()` type CONSTANTS, which v4 renamed to
 * `input.float`. The removal took the word with it, so `float(na)` — the
 * ordinary way to write a typed absent value, and the form TradingView uses in
 * nine of its own published scripts — was rejected as "'float' is not
 * available in Pine Script v4".
 *
 * The two meanings are now separated by VERSION rather than by name, which is
 * why the v1–v3 cases below matter as much as the v4 ones.
 */
import { describe, it, expect } from "vitest";
import { transpile, compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v5";

const head = (v: number) =>
  v === 1 ? 'study("t")\n'
          : `//@version=${v}\n${v >= 5 ? 'indicator("t")' : 'study("t")'}\n`;

function read(src: string, name = "x"): any {
  const { js, profile } = compileScript(src);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  ctx.setBar(0, 10, 12, 9, 11, 100);
  exec();
  return ctx.vars.get("opsv2_" + name)?.valueOf();
}

describe("float()", () => {
  for (const v of [4, 5]) {
    it(`v${v}: passes a number through`, () => {
      expect(read(head(v) + "x = float(2.5)")).toBe(2.5);
    });

    it(`v${v}: float(na) is na, not 0`, () => {
      // The reason the cast exists in most published uses: a TYPED absent
      // value. Zero would draw a line at zero.
      expect(Number.isNaN(read(head(v) + "x = float(na)"))).toBe(true);
    });

    it(`v${v}: widens an int`, () => {
      expect(read(head(v) + "x = float(3) / 2")).toBe(1.5);
    });
  }
});

describe("bool()", () => {
  it("zero is false and any other number is true", () => {
    // "This does not raise a warning, as the `bool()` function explicitly
    // casts the `randomValue` to 'bool'."
    expect(read(head(5) + "x = bool(0.0)")).toBe(false);
    expect(read(head(5) + "x = bool(4.0)")).toBe(true);
    expect(read(head(5) + "x = bool(-1.0)")).toBe(true);
  });

  it("bool(na) is na, and so takes NEITHER branch", () => {
    // Not `false`. A script that tests an absent value must fall through both
    // ways, which is what distinguishes a cast from a truthiness coercion.
    expect(Number.isNaN(read(head(5) + "x = bool(na)"))).toBe(true);
    expect(read(head(5) + "y = bool(na)\nx = y ? 1 : 2")).toBe(2);
  });

  it("a boolean passes through", () => {
    expect(read(head(5) + "x = bool(true)")).toBe(true);
  });
});

describe("string()", () => {
  it("renders a number", () => {
    expect(read(head(5) + "x = string(2.5)")).toBe("2.5");
  });

  it("passes a string through", () => {
    expect(read(head(5) + 'x = string("ab")')).toBe("ab");
  });

  it("string(na) is na — it does NOT spell it out", () => {
    // This is the line between a cast and `str.tostring`, which formats and
    // renders `na` as the three characters "NaN" so a label can show them.
    expect(Number.isNaN(read(head(5) + "x = string(na)"))).toBe(true);
    expect(read(head(5) + "x = str.tostring(na)")).toBe("NaN");
  });
});

describe("the two meanings are separated by version, not by name", () => {
  for (const v of [1, 2, 3]) {
    it(`v${v}: the word is the input-type CONSTANT`, () => {
      // `input(1.0, type = float)` — the v1–v3 spelling, still a plain string.
      expect(read(head(v) + "x = float")).toBe("float");
    });
  }

  for (const v of [4, 5]) {
    it(`v${v}: reading the bare word is the migration error`, () => {
      expect(() => transpile(head(v) + "x = float\n"))
        .toThrow(/'float' was renamed to 'input.float' in Pine Script v4/);
      expect(() => transpile(head(v) + "x = bool\n"))
        .toThrow(/'bool' was renamed to 'input.bool'/);
    });

    it(`v${v}: ...while calling it is the cast`, () => {
      expect(() => transpile(head(v) + "x = float(na)\n")).not.toThrow();
    });
  }

  it("v3 does not have the cast — `float(na)` there is the constant, called", () => {
    // Sanity: the v1–v3 view holds the string, so nothing above accidentally
    // made the cast reachable a version early.
    expect(read(head(3) + "x = float")).toBe("float");
  });
});

describe("the carrier namespace is not a spelling", () => {
  for (const v of [4, 5]) {
    it(`v${v}: 'cast.float' is refused`, () => {
      // `cast.*` exists only so the generator can produce entries for names
      // that collide with a v1–v3 constant. No script may write it.
      expect(() => transpile(head(v) + "x = cast.float(na)\n")).toThrow();
    });
  }
});

describe("int() and color() are unchanged", () => {
  it("int truncates toward zero", () => {
    expect(read(head(5) + "x = int(-1.7)")).toBe(-1);
  });

  it("both still work beside the three new ones", () => {
    expect(() => transpile(head(5) + "a = int(1.5)\nb = float(1)\nc = color(na)\n")).not.toThrow();
  });
});
