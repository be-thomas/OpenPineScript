/**
 * Version routing: the annotation must select the right language profile, and
 * a version we have not built must REFUSE to run rather than silently falling
 * back to v2 rules and producing wrong numbers.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../transpiler/v2";
import { UnimplementedVersionError, LANGUAGE_PROFILES } from "../../transpiler/profiles";
import {
  ALL_VERSIONS,
  IMPLEMENTED_VERSIONS,
  UNIMPLEMENTED_VERSIONS,
} from "../helpers/transpileAs";

const SIMPLE = "plot(close)\n";

describe("version routing", () => {
  it("routes an unannotated script to v1", () => {
    expect(compileScript(SIMPLE).version).toBe(1);
  });

  for (const v of IMPLEMENTED_VERSIONS) {
    it(`routes //@version=${v} to the v${v} profile`, () => {
      const result = compileScript(`//@version=${v}\n${SIMPLE}`);
      expect(result.version).toBe(v);
      expect(result.profile.version).toBe(v);
    });
  }

  for (const v of UNIMPLEMENTED_VERSIONS) {
    it(`refuses //@version=${v} instead of falling back`, () => {
      expect(() => compileScript(`//@version=${v}\n${SIMPLE}`))
        .toThrow(UnimplementedVersionError);
      expect(() => compileScript(`//@version=${v}\n${SIMPLE}`))
        .toThrow(new RegExp(`Pine Script v${v} support is not yet implemented`));
    });
  }

  it("lets an explicit option override the annotation", () => {
    // The test matrix relies on this to run one source under every version.
    expect(compileScript(`//@version=2\n${SIMPLE}`, { version: 1 }).version).toBe(1);
  });

  it("covers every version in the routing table", () => {
    // Guards against a version existing in PineVersion but having no profile.
    for (const v of ALL_VERSIONS) {
      expect(LANGUAGE_PROFILES[v]).toBeDefined();
      expect(LANGUAGE_PROFILES[v].version).toBe(v);
    }
  });

  it("names the version in a parse failure", () => {
    expect(() => compileScript("//@version=2\nx = = 1\n"))
      .toThrow(/Pine Script v2: parsing failed/);
  });
});

describe("profile invariants", () => {
  it("v1 and v2 carry identical rules", () => {
    // TradingView: v2 is "fully backwards compatible" with v1 — the annotation
    // is the only difference. Any divergence here is a bug.
    const v1 = LANGUAGE_PROFILES[1];
    const v2 = LANGUAGE_PROFILES[2];
    expect([...v1.restrictions].sort()).toEqual([...v2.restrictions].sort());
    expect(v1.defaults).toEqual(v2.defaults);
    expect([...v1.banned.keys()]).toEqual([...v2.banned.keys()]);
  });

  it("v1 and v2 default security() to lookahead_on", () => {
    // v3 flips this to 'off'; v1/v2 must keep the original behaviour.
    expect(LANGUAGE_PROFILES[1].defaults.securityLookahead).toBe("on");
    expect(LANGUAGE_PROFILES[2].defaults.securityLookahead).toBe("on");
  });

  it("v1-v3 ban 'bar_index' (the v4 spelling)", () => {
    for (const v of [1, 2, 3] as const) {
      expect(LANGUAGE_PROFILES[v].banned.has("bar_index")).toBe(true);
    }
  });
});
