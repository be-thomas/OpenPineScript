/**
 * Public transpiler entry point.
 *
 * Pipeline: source → detectVersion → LanguageProfile → parse (one shared
 * superset grammar) → ToJsVisitor(profile) → JavaScript.
 *
 * Version differences are carried by the profile, not by forked pipelines.
 */
import { parse } from "../../parser/v2";
import { ToJsVisitor } from "./ToJsVisitor";
import { detectVersion, PineVersion } from "../version";
import {
  LanguageProfile,
  profileFor,
  UnimplementedVersionError,
} from "../profiles";

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
export function compileScript(
  source: string,
  opts: TranspileOptions = {},
): CompileResult {
  const version = opts.version ?? detectVersion(source);
  const profile = profileFor(version);

  if (!profile.implemented) {
    throw new UnimplementedVersionError(version);
  }

  const { tree, errorCount, errors } = parse(source);

  if (errorCount > 0) {
    const error = new Error(
      `Pine Script v${version}: parsing failed with ${errorCount} error(s)`
    );
    (error as any).errors = errors;
    (error as any).version = version;
    throw error;
  }

  return { js: new ToJsVisitor(profile).visit(tree), version, profile };
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

export { detectVersion } from "../version";
export type { PineVersion } from "../version";
