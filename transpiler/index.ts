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
 *
 * This module is the ONLY place that maps a version number to a pipeline. It is
 * deliberately un-versioned: it belongs to no single version, and adding v4 must
 * mean adding a row to PIPELINES, never editing v1, v2 or v3.
 */
import { parse as parseV1 } from "../parser/v1";
import { parse as parseV2 } from "../parser/v2";
import { parse as parseV3 } from "../parser/v3";
import { V1ToJsVisitor } from "./v1/ToJsVisitor";
import { V2ToJsVisitor } from "./v2/ToJsVisitor";
import { V3ToJsVisitor } from "./v3/ToJsVisitor";
import {
  detectVersion,
  PineVersion,
  KNOWN_VERSIONS,
  registerImplementedVersions,
} from "./version";
import { LanguageProfile, profileFor, UnimplementedVersionError } from "./profiles";

/** One version's complete front end. */
interface Pipeline {
  parse: (source: string) => { tree: any; errorCount: number; errors: unknown[] };
  createVisitor: () => { visit(tree: any): string };
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
  4: null,
  5: null,
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

  if (errorCount > 0) {
    const error = new Error(`Pine Script v${version}: parsing failed with ${errorCount} error(s)`);
    (error as any).errors = errors;
    (error as any).version = version;
    throw error;
  }

  return { js: pipeline.createVisitor().visit(tree), version, profile: profileFor(version) };
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

export { detectVersion } from "./version";
export type { PineVersion } from "./version";
