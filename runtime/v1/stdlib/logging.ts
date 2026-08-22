/**
 * Pine Logs — the `log.*` namespace. v5 only.
 *
 * ── Why this matters more than it looks ─────────────────────────────────────
 *
 * `log.info()` is how this project collects golden data from TradingView
 * without a PRO+ subscription. "Export chart data…" is a paid feature; Pine
 * Logs are not, they run on HISTORICAL bars (unlike `alert()`, which only ever
 * fires on realtime bars), and they retain the last 10,000 messages. Every
 * harness in conformance/golden/v5 ends by writing one CSV row per bar through
 * `log.info`, and scripts/make-log-harness.ts generates them.
 *
 * So the engine must be able to RUN those harnesses, not merely compile them —
 * otherwise the one artefact that proves the harness itself is well-formed
 * cannot be produced locally before it is pasted into TradingView.
 *
 * ── The flat `log` collision ────────────────────────────────────────────────
 *
 * v1–v4 spell the natural logarithm as the bare function `log(x)`; v5 renames
 * it to `math.log` and gives the word to this namespace. Both spellings exist
 * in the RUNTIME registry at once, deliberately — the runtime is one
 * implementation across versions, and the transpiler decides which spelling
 * each version may write. `createStdlib` in ./index.ts merges a namespace onto
 * a callable of the same name, which is what makes the two coexist.
 */

import { Context } from "../context";
import type { LogEntry } from "../context";
import { val } from "../../../utils/v2/common";
import { str } from "./str";

/**
 * Pine overloads every log function: `log.info(message)` and
 * `log.info(formatString, arg0, …)`. The second form is the one the harnesses
 * use indirectly, through string concatenation rather than placeholders, but
 * both must work or a script that formats its own row silently logs the
 * template.
 */
function render(message: any, args: any[]): string {
    if (args.length === 0) {
        const v = val(message);
        return v === null || v === undefined ? "" : String(v);
    }
    return str.format(message, ...args);
}

function emit(ctx: Context, level: LogEntry["level"], message: any, args: any[]): void {
    ctx.logs.push({
        level,
        message: render(message, args),
        bar: ctx.currentBarIndex,
        time: ctx.time,
    });
}

export const log = {
    info: (ctx: Context, message: any, ...args: any[]) => { emit(ctx, "info", message, args); },
    warning: (ctx: Context, message: any, ...args: any[]) => { emit(ctx, "warning", message, args); },
    error: (ctx: Context, message: any, ...args: any[]) => { emit(ctx, "error", message, args); },
};
