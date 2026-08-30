/**
 * `year`, `month`, `weekofyear`, `dayofmonth`, `dayofweek`, `hour`, `minute`,
 * `second` — each of them a VARIABLE and a FUNCTION.
 *
 * SOURCING. The manual's Time page:
 *
 *   "The `year`, `month`, `weekofyear`, `dayofmonth`, `dayofweek`, `hour`,
 *    `minute`, and `second` variables hold *calendar-based* 'int' values
 *    calculated from the current bar's *opening time*, expressed in the
 *    exchange time zone. These variables reference the same values that
 *    calendar-based functions return when they use the default `timezone`
 *    argument and `time` as the `time` argument."
 *
 * and, for the function form, "functionName(time, timezone) → series int".
 *
 * ── The failure this closes ─────────────────────────────────────────────────
 *
 * All eight were declared `year(t: number)` and carried no `@getter`, so a bare
 * read emitted the FUNCTION OBJECT. `year > 2014` compared a function to an
 * integer — false on every bar — and TradingView's own
 *
 *     if year > 2014
 *         strategy.entry("LE", strategy.long)
 *
 * never entered, on a dataset running from 2015 to 2017. Fourteen of the
 * manual's strategy examples produced no trade at all for this reason, and 53
 * corpus scripts read one of these names bare.
 *
 * Nothing reported it. A built-in that exists is not an undeclared read, and
 * comparing a function to a number is legal JavaScript that is simply always
 * false — which is why the tests below read VALUES rather than assert that the
 * names compile.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v1";

/** One bar at `t`, returning what the script bound to `x`. */
function read(body: string, t: number, version = 5, tune?: (c: Context) => void): any {
  const head = version === 1 ? 'study("t")\n'
             : `//@version=${version}\n${version === 5 ? 'indicator("t")' : 'study("t")'}\n`;
  const { js, profile } = compileScript(head + body);
  const ctx = new Context(profile);
  tune?.(ctx);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  ctx.setBar(t, 10, 12, 9, 11, 100);
  exec();
  ctx.finalizeBar();
  return ctx.vars.get("opsv2_x")?.valueOf();
}

/** Tuesday 17 February 2015, 13:45:30 UTC — every field distinct. */
const T = Date.UTC(2015, 1, 17, 13, 45, 30);

const FIELDS: Array<[string, number]> = [
  ["year", 2015],
  ["month", 2],
  ["dayofmonth", 17],
  ["dayofweek", 3],      // Pine counts Sunday as 1, so Tuesday is 3
  ["hour", 13],
  ["minute", 45],
  ["second", 30],
  ["weekofyear", 8],
];

describe("read bare, each one is the current bar's value", () => {
  for (const [name, expected] of FIELDS) {
    it(`${name} is ${expected}`, () => {
      expect(read(`x = ${name}\n`, T)).toBe(expected);
    });
  }

  it("...a NUMBER, not the function object", () => {
    // The exact shape of the defect: the read succeeded and produced something
    // that is not a number, so every comparison against it was false.
    for (const [name] of FIELDS) {
      expect(typeof read(`x = ${name}\n`, T), name).toBe("number");
    }
  });

  it("so a comparison against it decides a branch", () => {
    expect(read("x = year > 2014 ? 1 : 0\n", T)).toBe(1);
    expect(read("x = year > 2020 ? 1 : 0\n", T)).toBe(0);
  });

  it("and arithmetic on it is finite", () => {
    expect(read("x = year * 2\n", T)).toBe(4030);
  });

  it("history applies, because it is a series", () => {
    const { js, profile } = compileScript('//@version=5\nindicator("t")\nx = dayofmonth[1]\n');
    const ctx = new Context(profile);
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    for (const day of [17, 18, 19]) {
      ctx.setBar(Date.UTC(2015, 1, day), 10, 12, 9, 11, 100);
      exec();
      ctx.finalizeBar();
    }
    expect(ctx.vars.get("opsv2_x")?.valueOf()).toBe(18);
  });
});

describe("called with a time, each one reads THAT instant", () => {
  for (const [name, expected] of FIELDS) {
    it(`${name}(t)`, () => {
      // The bar is a different day, so a wrong answer cannot come from the bar.
      expect(read(`x = ${name}(${T})\n`, Date.UTC(2020, 6, 1))).toBe(expected);
    });
  }

  it("a call with NO argument is the bar's own time", () => {
    // `dayofmonth()` appears twice in the corpus, and it is the same value the
    // bare variable has: "the default `timezone` argument and `time` as the
    // `time` argument".
    expect(read("x = dayofmonth()\n", T)).toBe(read("x = dayofmonth\n", T));
    expect(read("x = dayofmonth()\n", T)).toBe(17);
  });

  it("na in, na out", () => {
    expect(Number.isNaN(read("x = year(na)\n", T))).toBe(true);
  });
});

describe("the timezone argument", () => {
  // 17 February 2015 13:45 UTC is 08:45 in New York (UTC-5 in February).
  it("an IANA name shifts the hour", () => {
    expect(read(`x = hour(${T}, "America/New_York")\n`, T)).toBe(8);
  });

  it("a UTC offset does too", () => {
    expect(read(`x = hour(${T}, "UTC+4")\n`, T)).toBe(17);
    expect(read(`x = hour(${T}, "UTC-4")\n`, T)).toBe(9);
  });

  it("...and can carry the date across midnight with it", () => {
    const late = Date.UTC(2015, 1, 17, 23, 30);
    expect(read(`x = dayofmonth(${late}, "UTC+4")\n`, T)).toBe(18);
    expect(read(`x = dayofmonth(${late}, "UTC-4")\n`, T)).toBe(17);
  });

  it("omitted, it is the exchange's — which defaults to UTC", () => {
    expect(read(`x = hour(${T})\n`, T)).toBe(13);
  });

  it("an unknown zone reads as UTC rather than raising", () => {
    expect(read(`x = hour(${T}, "Nowhere/Atall")\n`, T)).toBe(13);
  });

  it("binds by keyword as well as by position", () => {
    expect(read(`x = hour(time = ${T}, timezone = "UTC+4")\n`, T)).toBe(17);
  });
});

describe("every version has them", () => {
  // Not a v4 or v5 addition: `year`, `month` and the rest are v1 spellings, and
  // the corpus reads them bare at every version from 2 up.
  for (const version of [1, 2, 3, 4, 5]) {
    it(`v${version} reads year as a number`, () => {
      expect(read("x = year\n", T, version)).toBe(2015);
    });
  }
});

describe("a script may bind one of these names itself", () => {
  it("its own binding wins over the getter", () => {
    // The getter rewrites a read into `ctx.call(id, opsv2_hour)`. If the script
    // declared `hour`, that call would reach a number rather than the accessor.
    expect(read("hour = 3\nx = hour * 2\n", T)).toBe(6);
  });

  it("a parameter named like one, too", () => {
    // `timestamp(year = 2021, …)` is the corpus case: the keyword NAME is a
    // parameter, and rewriting it produced `{ ctx.call(…): 2021 }` — not
    // JavaScript at all.
    expect(read('x = timestamp(timezone = "UTC+4", year = 2021, month = 1, day = 1)\n', T))
      .toBe(Date.UTC(2020, 11, 31, 20));
  });
});
