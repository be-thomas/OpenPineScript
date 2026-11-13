/**
 * v6 libraries: exported constants (June 2025), and libraries read by the
 * grammar of the version they declare.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v6";
import { attempt } from "../../../test-utils/common/transpileAs";

const CONSTS = [
  "//@version=6",
  'library("Consts")',
  "export const int LEN = 14",
  "export const string NAME = \"fast\"",
  "export const color HOT = #FF0000",
  "export double(float x) => x * 2",
].join("\n") + "\n";

/** Compiles `body` as a v6 indicator against `libraries` and runs one bar. */
function run(body: string, libraries: Record<string, string>) {
  const src = '//@version=6\nindicator("t")\n' + body;
  const { js, profile } = compileScript(src, { libraries });
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  ctx.setBar(0, 10, 12, 9, 11, 100);
  exec();
  return (name: string) => ctx.vars.get(`opsv2_${name}`)?.valueOf();
}

describe("export const", () => {
  it("is readable as alias.NAME, alongside the library's functions", () => {
    const read = run(
      "import me/Consts/1 as c\na = c.LEN\nb = c.NAME\nd = c.double(c.LEN)\ne = c.HOT\n",
      { "me/Consts/1": CONSTS },
    );
    expect([read("a"), read("b"), read("d"), read("e")]).toEqual([14, "fast", 28, "#FF0000"]);
  });

  it("must be const", () => {
    const lib = '//@version=6\nlibrary("L")\nexport int LEN = 14\nexport f() => 1\n';
    expect(() => compileScript('//@version=6\nindicator("t")\nimport me/L/1 as l\nx = l.LEN\n',
      { libraries: { "me/L/1": lib } })).toThrow(/only as 'export const <type> LEN/);
  });

  it("must be one of the five types", () => {
    const lib = '//@version=6\nlibrary("L")\nexport const array<int> XS = array.from(1)\nexport f() => 1\n';
    expect(() => compileScript('//@version=6\nindicator("t")\nimport me/L/1 as l\nx = l.f()\n',
      { libraries: { "me/L/1": lib } })).toThrow(/int, float, bool, color or string/);
  });

  it("is only allowed in a library", () => {
    const r = attempt(6, '//@version=6\nindicator("t")\nexport const int LEN = 14\n');
    expect(r.ok).toBe(false);
  });

  it("does not parse in a v5 library", () => {
    const lib = CONSTS.replace("//@version=6", "//@version=5");
    expect(() => compileScript('//@version=5\nindicator("t")\nimport me/Consts/1 as c\nx = c.double(1)\n',
      { libraries: { "me/Consts/1": lib } })).toThrow(/parsing the library/);
  });
});

describe("a v6 script importing a v5 library", () => {
  it("reads the library with v5's grammar, where `once` is an ordinary name", () => {
    const v5lib = [
      "//@version=5",
      'library("Old")',
      "export f(float x) =>",
      "    once = x + 1",
      "    once",
    ].join("\n") + "\n";
    const read = run("import me/Old/1 as o\nx = o.f(1)\n", { "me/Old/1": v5lib });
    expect(read("x")).toBe(2);
  });
});
