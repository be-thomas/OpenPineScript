/**
 * Shared helpers for cross-version tests.
 *
 * The version matrix is the core testing idea: a behaviour is asserted at
 * EVERY version, including the versions where it is illegal. See
 * dev-docs/03-tdd-workflow.md.
 */
import { compileScript, transpile } from "../../transpiler/v2";
import type { PineVersion } from "../../transpiler/version";
import { LANGUAGE_PROFILES } from "../../transpiler/profiles";

export type { PineVersion };

export const ALL_VERSIONS: PineVersion[] = [1, 2, 3, 4, 5];

/** Versions the engine currently implements. */
export const IMPLEMENTED_VERSIONS: PineVersion[] = ALL_VERSIONS.filter(
  v => LANGUAGE_PROFILES[v].implemented,
);

/** Versions that exist in Pine but that this engine refuses to run. */
export const UNIMPLEMENTED_VERSIONS: PineVersion[] = ALL_VERSIONS.filter(
  v => !LANGUAGE_PROFILES[v].implemented,
);

/**
 * Transpiles `src` under an explicit version, ignoring any annotation it
 * carries. This is what lets one source be asserted against every version.
 */
export function transpileAs(version: PineVersion, src: string): string {
  return transpile(src, { version });
}

/** Transpiles and reports the version that was applied. */
export function compileAs(version: PineVersion, src: string) {
  return compileScript(src, { version });
}

export type Outcome =
  | { ok: true; js: string }
  | { ok: false; message: string };

/**
 * Shapes the engine produces deliberately. Anything else — a TypeError, a
 * ReferenceError, an internal invariant blowing up — is a crash, not a verdict
 * on the script.
 */
const PINE_DIAGNOSTIC = [
  /^Pine Script v\d Error at /,
  /^Pine Script v\d: parsing failed with \d+ error\(s\)$/,
  /^Pine Script v\d support is not yet implemented\b/,
  /^Unknown Pine Script version \d+\b/,
];

export function isPineDiagnostic(message: string): boolean {
  return PINE_DIAGNOSTIC.some(re => re.test(message));
}

/**
 * Runs the transpiler and captures the verdict.
 *
 * Only recognised Pine diagnostics are captured. An engine crash is re-thrown,
 * because callers compare two captured messages for equality — and two
 * identical TypeErrors would compare equal and read as agreement. That is how
 * `this.getChannel is not a function` sat green inside the v1≡v2 suite.
 */
export function attempt(version: PineVersion, src: string): Outcome {
  try {
    return { ok: true, js: transpileAs(version, src) };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (!isPineDiagnostic(message)) {
      throw new Error(
        `Engine crash at v${version} (not a Pine diagnostic): ${message}`,
        { cause: e },
      );
    }
    return { ok: false, message };
  }
}

/**
 * Strips a `//@version=N` annotation line.
 *
 * Used to build the v1 corpus: TradingView states v1 and v2 are semantically
 * identical and differ only by the annotation, so removing it from a v2 script
 * yields the equivalent v1 script.
 */
export function stripVersionAnnotation(src: string): string {
  return src
    .split("\n")
    .filter(line => !/^\s*\/\/\s*@version\s*=/.test(line))
    .join("\n");
}

/**
 * Normalises a diagnostic so messages from two versions can be compared for
 * everything EXCEPT the version they name.
 */
export function withoutVersion(message: string): string {
  return message.replace(/Pine Script v\d/g, "Pine Script v<N>")
                .replace(/Pine Script v\d\./g, "Pine Script v<N>.");
}
