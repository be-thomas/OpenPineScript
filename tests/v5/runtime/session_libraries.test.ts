import { describe, it, expect } from "vitest";
import { Session, runScript } from "../../../runtime/v1";
import { letToVar } from "../../../runtime/v1/session";

const LIB = [
  '//@version=5',
  'library("Helpers")',
  'export double(float x) =>',
  '    x * 2',
].join("\n") + "\n";

const candles = (closes: number[]) =>
  closes.map((c, i) => ({ time: i, open: c, high: c + 1, low: c - 1, close: c, volume: 1 }));

describe("Session.compile with libraries", () => {
  it("compiles and runs a script that imports a library", () => {
    const s = new Session();
    const c = s.compile(
      '//@version=5\nindicator("t")\nimport me/Helpers/1 as h\nv = h.double(21.0)\nplot(v)\n',
      { libraries: { "me/Helpers/1": LIB } },
    );
    expect(c.errors).toEqual([]);
    expect(c.meta?.kind).toBe("indicator");

    const out = s.runHistory(candles([10]));
    expect(out.series.length).toBeGreaterThan(0);
  });

  it("reports an error when a needed library is not supplied", () => {
    const s = new Session();
    const c = s.compile(
      '//@version=5\nindicator("t")\nimport nobody/Missing/1 as m\nv = m.f(1)\nplot(v)\n',
    );
    expect(c.errors.length).toBeGreaterThan(0);
    expect(c.errors[0].message).toMatch(/nobody\/Missing\/1/);
  });

  it("passes libraries through to nested imports", () => {
    const base = '//@version=5\nlibrary("Base")\nexport triple(float x) =>\n    x * 3\n';
    const mid = '//@version=5\nlibrary("Mid")\nimport me/Base/1 as b\nexport six(float x) =>\n    b.triple(x) * 2\n';
    const s = new Session();
    const c = s.compile(
      '//@version=5\nindicator("t")\nimport me/Mid/1 as m\nv = m.six(5.0)\nplot(v)\n',
      { libraries: { "me/Base/1": base, "me/Mid/1": mid } },
    );
    expect(c.errors).toEqual([]);
  });
});

describe("library paths as TradingView writes them", () => {
  const host = (path: string) => `//@version=5\nindicator("t")\nimport ${path} as h\nplot(h.double(close))\n`;

  it("a username with - or . compiles under that exact path", () => {
    for (const path of ["S-Schmidt/Helpers/1", "harrell.jordon/Helpers/1", "relax-mop-straynow11/Helpers/1", "foo-1abc/Helpers/1", "1CG/Helpers/1"]) {
      const c = new Session().compile(host(path), { libraries: { [path]: LIB } });
      expect(c.errors, path).toEqual([]);
    }
  });

  it("whitespace inside the path is not part of the key", () => {
    const c = new Session().compile(host("me / Helpers / 1"), { libraries: { "me/Helpers/1": LIB } });
    expect(c.errors).toEqual([]);
  });

  it("libraries that import each other are named as a cycle", () => {
    const a = '//@version=5\nlibrary("A")\nimport me/B/1 as b\nexport f(float x) =>\n    b.g(x)\n';
    const b = '//@version=5\nlibrary("B")\nimport me/A/1 as a\nexport g(float x) =>\n    a.f(x)\n';
    const c = new Session().compile('//@version=5\nindicator("t")\nimport me/A/1 as a\nplot(a.f(close))\n', { libraries: { "me/A/1": a, "me/B/1": b } });
    expect(c.errors[0].message).toMatch(/libraries import each other in a cycle: me\/A\/1 → me\/B\/1 → me\/A\/1/);
  });

  it("a library that imports itself says so", () => {
    const self = '//@version=5\nlibrary("A")\nimport me/A/1 as a\nexport f(float x) =>\n    a.f(x)\n';
    const c = new Session().compile('//@version=5\nindicator("t")\nimport me/A/1 as a\nplot(a.f(close))\n', { libraries: { "me/A/1": self } });
    expect(c.errors[0].message).toMatch(/the library 'me\/A\/1' imports itself/);
  });

  it("an unknown version names no product", () => {
    const c = new Session().compile('//@version=7\nindicator("t")\nplot(close)\n');
    expect(c.errors[0].message).toMatch(/This engine knows versions/);
    expect(c.errors[0].message).not.toMatch(/OpenPineScript/);
  });

  it("a missing library's message names the library and no product", () => {
    const c = new Session().compile(host("nobody/Missing/1"));
    expect(c.errors[0].message).toMatch(/no source was supplied for the library 'nobody\/Missing\/1'/);
    expect(c.errors[0].message).not.toMatch(/OpenPineScript/);
  });

  it("runScript passes libraries through", () => {
    const out = runScript(host("me/Helpers/1"), { candles: candles([10, 11]), libraries: { "me/Helpers/1": LIB } });
    expect(out.errors).toEqual([]);
    expect(out.series.length).toBeGreaterThan(0);
  });
});

describe("letToVar", () => {
  it("rewrites declarations, not text", () => {
    expect(letToVar('let x = "let it be"; let y = \'let\'; // let me\n/* let */ let z = `let`'))
      .toBe('var x = "let it be"; var y = \'let\'; // let me\n/* let */ var z = `let`');
  });

  it("follows template literals through ${…}, and leaves $let and .let alone", () => {
    expect(letToVar('let a = `a${"`"}let`')).toBe('var a = `a${"`"}let`');
    expect(letToVar('let b = `x${ (() => { let q = 1; return q })() }let`')).toBe('var b = `x${ (() => { var q = 1; return q })() }let`');
    expect(letToVar('const $let = o.let; let $lib$let$f = 1; letter = 2')).toBe('const $let = o.let; var $lib$let$f = 1; letter = 2');
  });
});
