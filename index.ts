/**
 * OpenPineScript — public package entry point.
 *
 * Everything a host needs to compile and run Pine Script is re-exported here,
 * so an integrator imports from the package root and never from a path inside
 * it. Internal paths are NOT a public API and move between versions; this file
 * is the contract.
 *
 *     import { Session } from "open-pinescript";
 *
 *     const s = new Session();
 *     const compiled = s.compile(pineSource);
 *     if (compiled.errors.length === 0) {
 *         const result = s.runHistory(candles);
 *         // result.series   → one entry per plot, ready to draw
 *         // result.drawings → lines, boxes, labels the script created
 *         // result.trades   → the broker's fills, for a strategy
 *     }
 *
 * See dev-docs/integration/ for the full integration guide.
 */

// ── The host API ───────────────────────────────────────────────────────────
//
// `Session` is the one most integrations want: compile once, inspect the
// inputs, run the history, then feed live ticks.
export {
    Session,
    runScript,
    buildRenderModel,
    PROTOCOL_VERSION,
    ENGINE_VERSION,
} from "./runtime/v1/session";

export type {
    Compiled,
    SimResult,
    RenderSeries,
    RenderDelta,
    EngineError,
    InputView,
    Candle,
} from "./runtime/v1/session";

// ── The render model's own types ───────────────────────────────────────────
export type {
    PlotData,
    FillData,
    Drawing,
    LogEntry,
    ScriptMeta,
    SecurityCandle,
    InputDef,
    Trade,
    Position,
} from "./runtime/v1/context";

// ── The compiler, for hosts that want the JavaScript rather than the run ───
export {
    compileScript,
    transpile,
    detectVersion,
    IMPLEMENTED_VERSIONS,
} from "./transpiler/common";

export type { PineVersion, TranspileOptions, CompileResult } from "./transpiler/common";

// ── The language itself, for an editor ─────────────────────────────────────
//
// The keywords and built-in names a version knows, taken from the grammars and
// the registry the compiler consults — so a host's syntax highlighting cannot
// drift from what the engine will actually accept.
export { languageSpec } from "./runtime/v1/language-spec";
export type { LanguageSpec } from "./runtime/v1/language-spec";

// ── The low-level engine ───────────────────────────────────────────────────
//
// An escape hatch for a host that drives the bar loop itself — a custom
// replay, a different tick model, or a harness. `Session` is built on exactly
// these two and nothing else.
export { Context, compile, run } from "./runtime/v1";
