import { describe, it, expect } from "vitest";
import { importsOf, requiredLibraries } from "../../transpiler/common/libraries";

/** `import` exists only at v5: a host script without the annotation is v1. */
const V5 = '//@version=5\nindicator("t")\n';

describe("importsOf", () => {
  it("extracts a single import path", () => {
    expect(importsOf(V5 + 'import alice/RSI/1 as rsi\nplot(close)\n'))
      .toEqual(["alice/RSI/1"]);
  });

  it("extracts multiple imports in order", () => {
    const src = [
      '//@version=5',
      'indicator("t")',
      'import alice/A/1 as a',
      'import bob/B/2 as b',
      'plot(close)',
    ].join("\n");
    expect(importsOf(src)).toEqual(["alice/A/1", "bob/B/2"]);
  });

  it("deduplicates repeated paths", () => {
    const src = V5 + "import me/Lib/1 as a\nimport me/Lib/1 as b\n";
    expect(importsOf(src)).toEqual(["me/Lib/1"]);
  });

  it("ignores imports inside a line comment", () => {
    expect(importsOf("// import me/Lib/1 as l\nplot(close)\n")).toEqual([]);
  });

  it("ignores imports after an inline comment", () => {
    expect(importsOf("x = 1 // import me/Lib/1 as l\n")).toEqual([]);
  });

  it("does not ignore a // inside a string", () => {
    expect(importsOf(V5 + 'import me/Lib/1 as l\ns = "not // a comment"\n'))
      .toEqual(["me/Lib/1"]);
  });

  it("reports a path of any shape, as the compiler would ask for it", () => {
    expect(importsOf(V5 + "import foo/bar as x\n")).toEqual(["foo/bar"]);
    expect(importsOf(V5 + "import me/Helpers/1/2 as h\n")).toEqual(["me/Helpers/1/2"]);
  });

  it("drops whitespace inside a path, as the compiler's getText() does", () => {
    expect(importsOf(V5 + "import me / Helpers / 1 as h\n")).toEqual(["me/Helpers/1"]);
  });

  it("keeps - and . in a username", () => {
    expect(importsOf(V5 + "import S-Schmidt/DivHK_Core/2 as d\nimport harrell.jordon/EdgeStats/1 as e\n"))
      .toEqual(["S-Schmidt/DivHK_Core/2", "harrell.jordon/EdgeStats/1"]);
  });

  it("keeps username parts that start with digits", () => {
    expect(importsOf(V5 + "import foo-1abc/X/1 as x\nimport relax-mop-2fast/Y/1 as y\nimport 1CG/Z/4 as z\n"))
      .toEqual(["foo-1abc/X/1", "relax-mop-2fast/Y/1", "1CG/Z/4"]);
  });

  it("takes the version the host forces instead of the annotation", () => {
    expect(importsOf("import a/X/1 as x\n", { version: 5 })).toEqual(["a/X/1"]);
    expect(importsOf(V5 + "import a/X/1 as x\n", { version: 4 })).toEqual([]);
    expect(requiredLibraries("import a/X/1 as x\n", {}, { version: 5 })).toEqual(["a/X/1"]);
  });

  it("does not need to parse a source with no import in it", () => {
    expect(importsOf(V5 + 'plot(close) // imports nothing, "important"\n')).toEqual([]);
  });

  it("is empty for v1-v4 scripts, which cannot import", () => {
    expect(importsOf("//@version=4\nstudy(\"t\")\nimport a/X/1 as x\n")).toEqual([]);
    expect(importsOf("import a/X/1 as x\n")).toEqual([]);
  });

  it("returns empty for a script with no imports", () => {
    expect(importsOf('//@version=5\nindicator("t")\nplot(close)\n')).toEqual([]);
  });
});

describe("requiredLibraries", () => {
  it("lists missing libraries", () => {
    const src = V5 + "import a/X/1 as x\nimport b/Y/2 as y\n";
    expect(requiredLibraries(src)).toEqual(["a/X/1", "b/Y/2"]);
  });

  it("returns empty when all libraries are supplied", () => {
    const src = "import a/X/1 as x\n";
    expect(requiredLibraries(src, { "a/X/1": "// lib source\n" })).toEqual([]);
  });

  it("follows transitive imports through supplied sources", () => {
    const main = V5 + "import a/Top/1 as t\n";
    const top = "import b/Mid/1 as m\nexport f() => 1\n";
    const mid = "import c/Leaf/1 as l\nexport g() => 2\n";
    const missing = requiredLibraries(main, { "a/Top/1": top, "b/Mid/1": mid });
    expect(missing).toEqual(["c/Leaf/1"]);
  });

  it("returns empty when the entire transitive chain is supplied", () => {
    const main = "import a/Top/1 as t\n";
    const top = "import b/Leaf/1 as l\nexport f() => 1\n";
    const leaf = "export g() => 2\n";
    expect(requiredLibraries(main, { "a/Top/1": top, "b/Leaf/1": leaf })).toEqual([]);
  });

  it("handles circular imports without infinite loop", () => {
    const a = "import me/B/1 as b\nexport f() => 1\n";
    const b = "import me/A/1 as a\nexport g() => 2\n";
    expect(requiredLibraries("import me/A/1 as a\n", { "me/A/1": a, "me/B/1": b }))
      .toEqual([]);
  });

  it("reports each missing library only once", () => {
    const a = "import x/Shared/1 as s\nexport f() => 1\n";
    const b = "import x/Shared/1 as s\nexport g() => 2\n";
    const main = V5 + "import me/A/1 as a\nimport me/B/1 as b\n";
    expect(requiredLibraries(main, { "me/A/1": a, "me/B/1": b })).toEqual(["x/Shared/1"]);
  });
});

describe("requiredLibraries reads libraries the way the compiler does", () => {
  it("follows a v6-annotated library's imports, since the compiler parses it as v5", () => {
    const top = '//@version=6\nlibrary("Top")\nimport b/Leaf/1 as l\nexport f() => l.g()\n';
    expect(requiredLibraries(V5 + "import a/Top/1 as t\n", { "a/Top/1": top })).toEqual(["b/Leaf/1"]);
  });
});
