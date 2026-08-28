/**
 * v5 `enum` — June 2024.
 *
 * SOURCING. From the release notes: "Enums, also known as enumerations,
 * enumerated types, or enum types, are unique data types with all possible
 * values declared by the programmer", and they "enable convenient dropdown
 * input creation with the new input.enum() function".
 *
 * The declaration syntax, from the manual's Enums page:
 *
 *     [export ]enum <enumName>
 *         <field_1>[ = <title_1>]
 *         <field_2>[ = <title_2>]
 *
 * and its three load-bearing rules:
 *
 *   - "If the programmer does not specify a field's title, its title is the
 *      'string' representation of its name."
 *   - "Calling the str.tostring() function on an enum field is the ONLY way to
 *      retrieve its title for additional calculations."
 *   - "Scripts CANNOT compare members of different enums or use such members in
 *      expressions requiring a specific enum type, EVEN IF THE FIELDS HAVE
 *      IDENTICAL NAMES AND TITLES."
 *
 * That last one is why these tests exist in this shape. The obvious
 * implementation — a member is its title string — passes every happy-path test
 * and breaks the rule silently: two enums with a `neutral` member would compare
 * equal. So the cross-enum case is tested first-class.
 */
import { describe, it, expect } from "vitest";
import { transpile, compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v5";

const HEAD = '//@version=5\nindicator("t")\n';

const OSC = "enum OscType\n" +
            '    rsi = "Relative Strength Index"\n' +
            '    mfi = "Money Flow Index"\n' +
            "    cci\n";

function build(body: string) {
  const { js, profile } = compileScript(HEAD + body);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  ctx.setBar(0, 10, 12, 9, 11, 100);
  exec();
  ctx.finalizeBar();
  return { ctx, js };
}

const read = (body: string, name: string) =>
  build(body).ctx.vars.get("opsv2_" + name)?.valueOf();

describe("declaring an enum", () => {
  it("its members are readable by dot notation", () => {
    expect(read(OSC + "x = OscType.rsi\n", "x")).toBeDefined();
  });

  it("a member equals itself", () => {
    expect(read(OSC + "x = OscType.rsi\ny = x == OscType.rsi\n", "y")).toBe(true);
  });

  it("...and differs from its siblings", () => {
    expect(read(OSC + "x = OscType.rsi\ny = x == OscType.mfi\n", "y")).toBe(false);
    expect(read(OSC + "x = OscType.rsi\ny = x != OscType.mfi\n", "y")).toBe(true);
  });

  it("a member that is never named is still declared", () => {
    expect(read(OSC + "x = OscType.cci\ny = x == OscType.cci\n", "y")).toBe(true);
  });

  it("a name that is not a member is refused, and lists what is", () => {
    expect(() => transpile(HEAD + OSC + "x = OscType.wpr\n"))
      .toThrow(/'OscType' has no member 'wpr'.*rsi, mfi, cci/s);
  });

  it("a field declared twice is refused", () => {
    expect(() => transpile(HEAD + "enum E\n    a\n    a\n" + "x = E.a\n"))
      .toThrow(/declares the field 'a' twice/);
  });
});

describe("titles", () => {
  it("str.tostring gives the declared title", () => {
    expect(read(OSC + "t = str.tostring(OscType.mfi)\n", "t")).toBe("Money Flow Index");
  });

  it("an untitled field's title is its NAME", () => {
    // "If the programmer does not specify a field's title, its title is the
    //  'string' representation of its name."
    expect(read(OSC + "t = str.tostring(OscType.cci)\n", "t")).toBe("cci");
  });

  it("the title is not what the member compares as", () => {
    // Two members could share a title and still be different members; the
    // comparison must not go through the title.
    const src = 'enum E\n    a = "same"\n    b = "same"\n' + "x = E.a == E.b\n";
    expect(read(src, "x")).toBe(false);
  });
});

describe("two enums do not mix", () => {
  /**
   * The rule that decides the representation. "Scripts cannot compare members
   * of different enums ... even if the fields have identical names and titles."
   */
  const TWO = 'enum A\n    up = "Up"\n    down = "Down"\n' +
              'enum B\n    up = "Up"\n    down = "Down"\n';

  it("identically named and titled members from different enums are NOT equal", () => {
    expect(read(TWO + "x = A.up == B.up\n", "x")).toBe(false);
  });

  it("...while the same member from the same enum still is", () => {
    expect(read(TWO + "x = A.up == A.up\n", "x")).toBe(true);
  });

  it("their titles are the same, which is the trap", () => {
    expect(read(TWO + "x = str.tostring(A.up)\n", "x")).toBe("Up");
    expect(read(TWO + "y = str.tostring(B.up)\n", "y")).toBe("Up");
  });
});

describe("input.enum", () => {
  it("returns the default member", () => {
    const src = OSC + 'sel = input.enum(OscType.mfi, "Oscillator")\nsame = sel == OscType.mfi\n';
    expect(read(src, "same")).toBe(true);
  });

  it("registers an input typed `enum`, not `string`", () => {
    // A `string` input would offer a free-text box for a value that has to be
    // one of a fixed set; the type is what lets a host render the dropdown.
    const { ctx } = build(OSC + 'sel = input.enum(OscType.rsi, "Oscillator")\n');
    expect(ctx.inputDefs[0].type).toBe("enum");
    expect(ctx.inputDefs[0].title).toBe("Oscillator");
  });

  it("the Context knows every member, so the dropdown can list them", () => {
    const { ctx } = build(OSC + 'sel = input.enum(OscType.rsi, "Oscillator")\n');
    const members = ctx.enumMembers.get("OscType")!;
    expect(members.map(m => ctx.enumTitle(m)))
      .toEqual(["Relative Strength Index", "Money Flow Index", "cci"]);
  });
});

describe("an enum as a declared type", () => {
  it("`OscType x = …` parses and binds", () => {
    const src = OSC + 'OscType sel = input.enum(OscType.rsi, "Osc")\nsame = sel == OscType.rsi\n';
    expect(read(src, "same")).toBe(true);
  });
});

describe("a script may name an enum after a built-in namespace", () => {
  it("its own declaration wins for the dotted read", () => {
    // TradingView's own example declares `enum syminfo`. The emitter resolves
    // enums before namespaces for exactly this reason.
    const src = "enum syminfo\n    a\n    b\n" + "x = syminfo.a == syminfo.a\n";
    expect(read(src, "x")).toBe(true);
  });
});

describe("it is a v5 addition", () => {
  for (const version of [1, 2, 3, 4]) {
    it(`v${version} does not accept 'enum'`, () => {
      const head = version === 1 ? 'study("t")\n' : `//@version=${version}\nstudy("t")\n`;
      expect(() => transpile(head + "enum E\n    a\n")).toThrow(/parsing failed/);
    });
  }

  it("`enum` may still END a dotted name — `input.enum` is one", () => {
    // The same seam `syminfo.type` needed: making a word a keyword must not
    // un-spell a built-in whose name ends in it. `input.enum` is that built-in,
    // so this case would fail the moment ENUM stopped being admitted after a
    // dot in `id`.
    expect(() => compileScript(HEAD + OSC + 'x = input.enum(OscType.rsi, "O")\n'))
      .not.toThrow();
  });
});
