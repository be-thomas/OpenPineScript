/**
 * Public transpiler entry point — THE VERSION ROUTER.
 *
 * Pipeline: source → detectVersion → that version's (parser, visitor) pair → JS.
 *
 * Each version owns a complete, independent pipeline built by inheritance:
 *
 *   version   grammar              parser            visitor
 *   ────────────────────────────────────────────────────────────────────
 *   v1        PineV1*.g4 (base)    parser/v1         V1ToJsVisitor (base)
 *   v2        import PineV1* + :=  parser/v2         extends V1
 *   v3        import PineV2*       parser/v3         extends V2
 *   v4        import PineV3* + var parser/v4         extends V3
 *   v5        import PineV4* + while/switch  parser/v5   extends V4
 *   v6        import PineV5* + once/"""      parser/v6   extends V5
 *
 * This module is the ONLY place that maps a version number to a pipeline. It is
 * deliberately un-versioned: it belongs to no single version, and adding v4 must
 * mean adding a row to PIPELINES, never editing v1, v2 or v3.
 */
import { parse as parseV1, type ParserError } from "../../parser/v1";
import { parse as parseV2 } from "../../parser/v2";
import { parse as parseV3 } from "../../parser/v3";
import { parse as parseV4 } from "../../parser/v4";
import { parse as parseV5 } from "../../parser/v5";
import { parse as parseV6 } from "../../parser/v6";
import { V1ToJsVisitor } from "../v1/ToJsVisitor";
import { V2ToJsVisitor } from "../v2/ToJsVisitor";
import { V3ToJsVisitor } from "../v3/ToJsVisitor";
import { V4ToJsVisitor } from "../v4/ToJsVisitor";
import { V5ToJsVisitor } from "../v5/ToJsVisitor";
import { V6ToJsVisitor } from "../v6/ToJsVisitor";
import {
  detectVersion,
  hasVersionLine,
  PineVersion,
  KNOWN_VERSIONS,
  registerImplementedVersions,
} from "./version";
import { explainParseErrors, explainEndOfFile, NO_VERSION_HINT } from "./parseErrors";
import { LanguageProfile, profileFor, UnimplementedVersionError } from "./profiles";

/** One version's complete front end. */
interface Pipeline {
  parse: (source: string) => { tree: any; errorCount: number; errors: unknown[] };
  createVisitor: (opts: TranspileOptions) => { visit(tree: any): string };
}

/**
 * A version is implemented exactly when it has a row here. `null` means the
 * version is known to exist but is not built — routing stays TOTAL, so a v4
 * script errors instead of silently transpiling under v3 rules and producing
 * wrong numbers.
 */
const PIPELINES: Readonly<Record<PineVersion, Pipeline | null>> = {
  1: { parse: parseV1, createVisitor: () => new V1ToJsVisitor() },
  2: { parse: parseV2, createVisitor: () => new V2ToJsVisitor() },
  3: { parse: parseV3, createVisitor: () => new V3ToJsVisitor() },
  4: { parse: parseV4, createVisitor: () => new V4ToJsVisitor() },
  // v5 is the first version whose emitter needs anything from the CALLER: an
  // `import` names a library this engine cannot fetch, so the host supplies it.
  5: { parse: parseV5, createVisitor: opts => new V5ToJsVisitor({ libraries: opts.libraries, editorRules: opts.editorRules }) },
  6: { parse: parseV6, createVisitor: opts => new V6ToJsVisitor({ libraries: opts.libraries, editorRules: opts.editorRules }) },
};

/** Versions with a working pipeline, ascending. */
export const IMPLEMENTED_VERSIONS: readonly PineVersion[] =
  KNOWN_VERSIONS.filter(v => PIPELINES[v] !== null);

// Tell version.ts which versions actually run, so an unknown-version error can
// name them. PIPELINES is the single source of truth: a version is implemented
// exactly when a parser and a visitor exist for it, which no data table can know.
// One-way dependency — version.ts never imports this module.
registerImplementedVersions(IMPLEMENTED_VERSIONS);

export interface TranspileOptions {
  /**
   * Force a version, ignoring any //@version annotation. Used by the
   * cross-version test matrix to run one source under every version.
   */
  version?: PineVersion;

  /**
   * Sources for the libraries a v5 script `import`s, keyed by path
   * (`"someuser/somelib/1"`).
   *
   * A library lives on TradingView and this engine has no way to fetch one, so
   * the host provides it — the same arrangement as `Context.provideSecurityData`
   * for higher-timeframe candles. An import with no source is refused rather
   * than stubbed out.
   */
  libraries?: Readonly<Record<string, string>>;

  /**
   * Apply the checks TradingView's chart editor makes (v5/v6 only). `Session`
   * sets it; a bare transpile leaves it off so fixtures can be partial scripts.
   */
  editorRules?: boolean;
}

export interface CompileResult {
  js: string;
  version: PineVersion;
  profile: LanguageProfile;
}

/**
 * Transpiles Pine Script and reports which version was applied.
 * @throws UnsupportedVersionError   annotation names a version outside 1–5
 * @throws UnimplementedVersionError version is recognised but not built yet
 */
export function compileScript(source: string, opts: TranspileOptions = {}): CompileResult {
  const version = opts.version ?? detectVersion(source);
  const pipeline = PIPELINES[version];

  if (!pipeline) throw new UnimplementedVersionError(version);

  const { tree, errorCount, errors } = pipeline.parse(source);
  const noVersionLine = opts.version === undefined && !hasVersionLine(source);
  const parsesAsNewer = () => ([5, 6] as const).some(v => PIPELINES[v]!.parse(source).errorCount === 0);

  if (errorCount > 0) {
    const error = new Error(`Pine Script v${version}: parsing failed with ${errorCount} error(s)`);
    (error as any).errors = explainParseErrors(source, errors as ParserError[], { noVersionLine, parsesAsNewer });
    (error as any).version = version;
    throw error;
  }

  let js: string;
  try {
    js = pipeline.createVisitor(opts).visit(tree);
  } catch (e: any) {
    const more = typeof e?.message === "string" ? explainEndOfFile(source, e.message) : null;
    if (more) e.message = `${e.message} ${more}`;
    if (noVersionLine && typeof e?.message === "string" && parsesAsNewer()) {
      // TradingView's own words for a v5 script read as v1 (pe3_no_version_v5_body.png).
      const call = /Undeclared identifier '(indicator|strategy|library)'/.exec(e.message)?.[1];
      if (call) e.detail = `${e.message} — TradingView: Could not find function or function reference '${call}'.`;
      e.message += NO_VERSION_HINT;
    }
    throw e;
  }
  return { js, version, profile: profileFor(version) };
}

/**
 * Transpiles Pine Script to JavaScript.
 *
 * The version comes from the `//@version` annotation; a script without one is
 * Pine Script v1. Use `compileScript` when you also need the resolved version.
 */
export function transpile(source: string, opts: TranspileOptions = {}): string {
  return compileScript(source, opts).js;
}

/**
 * The hint for an error found after the transpiler, on the compile dry run: ""
 * unless the source has no `//@version` line and parses as v5 or v6.
 */
export function noVersionHint(source: string): string {
  const parsesAsNewer = ([5, 6] as const).some(v => PIPELINES[v]!.parse(source).errorCount === 0);
  return !hasVersionLine(source) && parsesAsNewer ? NO_VERSION_HINT : "";
}

export { detectVersion } from "./version";
export type { PineVersion } from "./version";
