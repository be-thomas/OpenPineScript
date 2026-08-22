/**
 * The v5 namespaces that are genuinely new code rather than aliases:
 * `str.*`, `log.*`, `matrix.*`, `map.*`, the four new `math.*` members, and
 * `runtime.error`.
 *
 * `str.tostring`'s number formatting gets the most attention here, and not for
 * its own sake: every golden-data harness emits its columns as
 * `str.tostring(v, "#.##########")`, so a formatter that disagrees with
 * TradingView's turns every parity comparison into a test of the formatter.
 */
import { describe, it, expect } from "vitest";
import { HEAD, build, value } from "../helpers";
import { str } from "../../../runtime/v1/stdlib/str";

describe("str.tostring formatting", () => {
  it("trims optional digits — '#' is an OPTIONAL digit", () => {
    expect(str.tostring(1.5, "#.##")).toBe("1.5");
    expect(str.tostring(1.5, "#.##########")).toBe("1.5");
    expect(str.tostring(2, "#.##")).toBe("2");
  });

  it("keeps required digits — '0' is a REQUIRED digit", () => {
    expect(str.tostring(1.5, "0.00")).toBe("1.50");
    expect(str.tostring(2, "0.00")).toBe("2.00");
  });

  it("'#' alone is an integer, which is how timestamps are logged", () => {
    expect(str.tostring(1420156800000, "#")).toBe("1420156800000");
    expect(str.tostring(1.7, "#")).toBe("2");
  });

  it("pads the integer side to its required width", () => {
    expect(str.tostring(7, "00")).toBe("07");
  });

  it("rounds rather than truncating", () => {
    // 1.005 is deliberately avoided: it has no exact binary representation, so
    // every language rounds it down and a test on it measures IEEE-754 rather
    // than this formatter.
    expect(str.tostring(1.006, "#.##")).toBe("1.01");
    expect(str.tostring(1.004, "#.##")).toBe("1");
  });

  it("keeps the sign", () => {
    expect(str.tostring(-1.5, "#.##")).toBe("-1.5");
  });

  it("renders na as NaN, which is what the golden loader parses", () => {
    expect(str.tostring(NaN, "#.##")).toBe("NaN");
    expect(str.tostring(NaN)).toBe("NaN");
  });

  it("without a format it is the inherited v1–v4 tostring behaviour", () => {
    expect(str.tostring(1.5)).toBe("1.5");
    expect(str.tostring(true)).toBe("true");
    expect(str.tostring("x")).toBe("x");
  });

  it("renders an array", () => {
    expect(str.tostring([1, 2, 3])).toBe("[1, 2, 3]");
  });
});

describe("str — the rest of the namespace", () => {
  it("tonumber parses, and gives na for a non-number", () => {
    expect(str.tonumber("3.5")).toBe(3.5);
    expect(Number.isNaN(str.tonumber("abc"))).toBe(true);
    expect(Number.isNaN(str.tonumber(""))).toBe(true);
  });

  it("format substitutes positional placeholders", () => {
    expect(str.format("{0} and {1}", "a", "b")).toBe("a and b");
  });

  it("format honours a per-placeholder number format", () => {
    expect(str.format("{0, number, #.##}", 1.234)).toBe("1.23");
  });

  it("format leaves an out-of-range placeholder alone rather than printing undefined", () => {
    expect(str.format("{0} {5}", "a")).toBe("a {5}");
  });

  it("inspection and transformation", () => {
    expect(str.length("abcd")).toBe(4);
    expect(str.contains("abcd", "bc")).toBe(true);
    expect(str.startswith("abcd", "ab")).toBe(true);
    expect(str.endswith("abcd", "cd")).toBe(true);
    expect(str.upper("ab")).toBe("AB");
    expect(str.lower("AB")).toBe("ab");
    expect(str.substring("abcdef", 1, 3)).toBe("bc");
    expect(str.substring("abcdef", 4)).toBe("ef");
    expect(str.replace_all("a-b-c", "-", "+")).toBe("a+b+c");
    expect(str.split("a,b,c", ",")).toEqual(["a", "b", "c"]);
    expect(str.repeat("ab", 3, "-")).toBe("ab-ab-ab");
  });

  it("pos returns na rather than -1 when the needle is absent", () => {
    expect(str.pos("abc", "b")).toBe(1);
    expect(Number.isNaN(str.pos("abc", "z"))).toBe(true);
  });

  it("works through a compiled script", () => {
    expect(value(`${HEAD}s = str.format("{0}-{1}", "a", 2)\n`, "s")).toBe("a-2");
  });
});

describe("string concatenation with '+'", () => {
  // `+` used to coerce both sides with Number(), so every string sum was NaN.
  // Invisible before v5 because nothing built strings; central now.
  it("concatenates two strings", () => {
    expect(value(`${HEAD}s = "a" + "b"\n`, "s")).toBe("ab");
  });

  it("concatenates a string with a rendered number", () => {
    expect(value(`${HEAD}s = "n=" + str.tostring(close, "#.#")\n`, "s")).toBe("n=11");
  });

  it("still adds numbers", () => {
    expect(value(`${HEAD}x = 2 + 3\n`, "x")).toBe(5);
  });

  it("chains, which is how a CSV row is built", () => {
    expect(value(`${HEAD}s = "a" + "," + "b" + "," + "c"\n`, "s")).toBe("a,b,c");
  });
});

describe("log", () => {
  it("records a line per bar, with its bar and time", () => {
    const { ctx, exec } = build(`${HEAD}log.info("bar " + str.tostring(bar_index, "#"))\n`);
    for (let i = 0; i < 3; i++) {
      ctx.setBar(i * 1000, 10, 12, 9, 11, 100);
      exec();
      ctx.finalizeBar();
    }
    expect(ctx.logs.map(l => l.message)).toEqual(["bar 0", "bar 1", "bar 2"]);
    expect(ctx.logs[1]).toMatchObject({ level: "info", bar: 1, time: 1000 });
  });

  it("carries the level", () => {
    const { ctx, exec } = build(`${HEAD}log.warning("w")\nlog.error("e")\n`);
    ctx.setBar(0, 10, 12, 9, 11, 100);
    exec();
    expect(ctx.logs.map(l => l.level)).toEqual(["warning", "error"]);
  });

  it("accepts the format-string overload", () => {
    const { ctx, exec } = build(`${HEAD}log.info("{0}/{1}", 1, 2)\n`);
    ctx.setBar(0, 10, 12, 9, 11, 100);
    exec();
    expect(ctx.logs[0].message).toBe("1/2");
  });

  it("a second pass does not inherit the first's lines", () => {
    const { ctx, exec } = build(`${HEAD}log.info("x")\n`);
    ctx.setBar(0, 10, 12, 9, 11, 100);
    exec();
    ctx.reset();
    expect(ctx.logs).toEqual([]);
  });

  it("barstate.isfirst gates the header line, which is what harnesses rely on", () => {
    const { ctx, exec } = build(`${HEAD}if barstate.isfirst\n    log.info("HEAD")\nlog.info("row")\n`);
    for (let i = 0; i < 3; i++) {
      ctx.setBar(i, 10, 12, 9, 11, 100);
      exec();
      ctx.finalizeBar();
    }
    expect(ctx.logs.filter(l => l.message === "HEAD").length).toBe(1);
    expect(ctx.logs.filter(l => l.message === "row").length).toBe(3);
  });
});

describe("map", () => {
  it("put / get / size", () => {
    const src = `${HEAD}m = map.new<string, float>()\nmap.put(m, "a", 1.5)\nv = map.get(m, "a")\nn = map.size(m)\n`;
    expect(value(src, "v")).toBe(1.5);
    expect(value(src, "n")).toBe(1);
  });

  it("a missing key is na, not an error", () => {
    const src = `${HEAD}m = map.new<string, float>()\nv = map.get(m, "nope")\n`;
    expect(Number.isNaN(value(src, "v"))).toBe(true);
  });

  it("put returns the PREVIOUS value, which is how a first write is detected", () => {
    const src = `${HEAD}m = map.new<string, int>()\nmap.put(m, "k", 1)\nprev = map.put(m, "k", 2)\n`;
    expect(value(src, "prev")).toBe(1);
  });

  it("contains / remove / clear", () => {
    const src = `${HEAD}m = map.new<string, int>()\nmap.put(m, "k", 1)\n` +
      `had = map.contains(m, "k") ? 1 : 0\nmap.remove(m, "k")\nleft = map.size(m)\n`;
    expect(value(src, "had")).toBe(1);
    expect(value(src, "left")).toBe(0);
  });

  it("keys and values come back in insertion order", () => {
    const src = `${HEAD}m = map.new<string, int>()\n` +
      `map.put(m, "b", 2)\nmap.put(m, "a", 1)\n` +
      `ks = array.join(map.keys(m), ",")\nvs = array.join(map.values(m), ",")\n`;
    expect(value(src, "ks")).toBe("b,a");
    expect(value(src, "vs")).toBe("2,1");
  });

  it("a re-put does not move the key to the end", () => {
    const src = `${HEAD}m = map.new<string, int>()\n` +
      `map.put(m, "a", 1)\nmap.put(m, "b", 2)\nmap.put(m, "a", 9)\n` +
      `ks = array.join(map.keys(m), ",")\n`;
    expect(value(src, "ks")).toBe("a,b");
  });

  it("a `var` map persists across bars", () => {
    const { ctx, exec } = build(`${HEAD}var m = map.new<string, int>()\nmap.put(m, str.tostring(bar_index, "#"), 1)\nn = map.size(m)\n`);
    const sizes: any[] = [];
    for (let i = 0; i < 3; i++) {
      ctx.setBar(i, 10, 12, 9, 11, 100);
      exec();
      sizes.push(ctx.vars.get("opsv2_n")?.valueOf());
      ctx.finalizeBar();
    }
    expect(sizes).toEqual([1, 2, 3]);
  });

  it("map.* is refused at v4", () => {
    expect(() => build('//@version=4\nstudy("t")\nm = map.new(1)\n'))
      .toThrow(/'map\.new' is not available in Pine Script v4/);
  });
});

describe("matrix", () => {
  const NEW = `${HEAD}m = matrix.new<float>(2, 3, 0.0)\n`;

  it("new / rows / columns / elements_count", () => {
    expect(value(NEW + "r = matrix.rows(m)\n", "r")).toBe(2);
    expect(value(NEW + "c = matrix.columns(m)\n", "c")).toBe(3);
    expect(value(NEW + "n = matrix.elements_count(m)\n", "n")).toBe(6);
  });

  it("get / set", () => {
    expect(value(NEW + "matrix.set(m, 1, 2, 9.0)\nv = matrix.get(m, 1, 2)\n", "v")).toBe(9);
  });

  it("an out-of-range index is an error, not a silent na", () => {
    expect(() => value(NEW + "v = matrix.get(m, 5, 0)\n", "v"))
      .toThrow(/row 5 is out of bounds/);
  });

  it("row and col return COPIES, so mutating them cannot reach back", () => {
    const src = NEW + "r = matrix.row(m, 0)\narray.set(r, 0, 7.0)\nv = matrix.get(m, 0, 0)\n";
    expect(value(src, "v")).toBe(0);
  });

  it("transpose", () => {
    const src = `${HEAD}m = matrix.new<float>(2, 3, 1.0)\nt = matrix.transpose(m)\n` +
      "r = matrix.rows(t)\nc = matrix.columns(t)\n";
    expect(value(src, "r")).toBe(3);
    expect(value(src, "c")).toBe(2);
  });

  it("add_row rejects a row of the wrong width", () => {
    const src = NEW + "bad = array.new<float>(2)\nmatrix.add_row(m, 0, bad)\nv = 1\n";
    expect(() => value(src, "v"))
      .toThrow(/matrix\.add_row: row has 2 elements, matrix has 3 columns/);
  });

  it("matrix multiplication", () => {
    // [[1,2],[3,4]] × [[1,0],[0,1]] = itself.
    const src = `${HEAD}a = matrix.new<float>(2, 2, 0.0)\n` +
      "matrix.set(a, 0, 0, 1.0)\nmatrix.set(a, 0, 1, 2.0)\n" +
      "matrix.set(a, 1, 0, 3.0)\nmatrix.set(a, 1, 1, 4.0)\n" +
      "i = matrix.new<float>(2, 2, 0.0)\nmatrix.set(i, 0, 0, 1.0)\nmatrix.set(i, 1, 1, 1.0)\n" +
      "p = matrix.mult(a, i)\nv = matrix.get(p, 1, 0)\n";
    expect(value(src, "v")).toBe(3);
  });

  it("mismatched shapes are refused", () => {
    const src = `${HEAD}a = matrix.new<float>(2, 3, 1.0)\nb = matrix.new<float>(2, 2, 1.0)\n` +
      "p = matrix.mult(a, b)\nv = 1\n";
    expect(() => value(src, "v")).toThrow(/cannot multiply 2x3 by 2x2/);
  });

  it("determinant and inverse", () => {
    // [[4,7],[2,6]] has det 10 and inverse [[0.6,-0.7],[-0.2,0.4]].
    const base = `${HEAD}a = matrix.new<float>(2, 2, 0.0)\n` +
      "matrix.set(a, 0, 0, 4.0)\nmatrix.set(a, 0, 1, 7.0)\n" +
      "matrix.set(a, 1, 0, 2.0)\nmatrix.set(a, 1, 1, 6.0)\n";
    expect(value(base + "d = matrix.det(a)\n", "d")).toBeCloseTo(10, 10);
    expect(value(base + "i = matrix.inv(a)\nv = matrix.get(i, 0, 0)\n", "v")).toBeCloseTo(0.6, 10);
  });

  it("a singular matrix inverts to na rather than to infinities", () => {
    const src = `${HEAD}a = matrix.new<float>(2, 2, 1.0)\ni = matrix.inv(a)\nv = matrix.get(i, 0, 0)\n`;
    expect(Number.isNaN(value(src, "v"))).toBe(true);
  });

  it("aggregates skip na", () => {
    const src = `${HEAD}a = matrix.new<float>(2, 2, na)\nmatrix.set(a, 0, 0, 4.0)\n` +
      "mx = matrix.max(a)\navg = matrix.avg(a)\n";
    expect(value(src, "mx")).toBe(4);
    expect(value(src, "avg")).toBe(4);
  });

  it("matrix.* is refused at v4", () => {
    expect(() => build('//@version=4\nstudy("t")\nm = matrix.new(1, 1)\n'))
      .toThrow(/'matrix\.new' is not available in Pine Script v4/);
  });
});

describe("the v5-only math members", () => {
  it("todegrees / toradians", () => {
    expect(value(`${HEAD}d = math.todegrees(3.141592653589793)\n`, "d")).toBeCloseTo(180, 10);
    expect(value(`${HEAD}r = math.toradians(180)\n`, "r")).toBeCloseTo(Math.PI, 10);
  });

  it("round_to_mintick uses the Context's tick size", () => {
    const { ctx, exec } = build(`${HEAD}x = math.round_to_mintick(10.017)\n`);
    ctx.mintick = 0.01;
    ctx.setBar(0, 10, 12, 9, 11, 100);
    exec();
    expect(ctx.vars.get("opsv2_x")?.valueOf()).toBeCloseTo(10.02, 10);
  });

  it("random stays within its bounds", () => {
    const { ctx, exec } = build(`${HEAD}r = math.random(5, 6)\n`);
    for (let i = 0; i < 20; i++) {
      ctx.setBar(i, 10, 12, 9, 11, 100);
      exec();
      const r = ctx.vars.get("opsv2_r")?.valueOf();
      expect(r).toBeGreaterThanOrEqual(5);
      expect(r).toBeLessThan(6);
      ctx.finalizeBar();
    }
  });
});

describe("runtime.error", () => {
  it("halts the script with the author's message", () => {
    const { ctx, exec } = build(`${HEAD}if close > 0\n    runtime.error("bad input")\n`);
    ctx.setBar(0, 10, 12, 9, 11, 100);
    expect(() => exec()).toThrow(/bad input/);
  });
});
