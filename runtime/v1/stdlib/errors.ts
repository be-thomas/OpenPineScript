/**
 * The `runtime.*` namespace — v5's script-authored failure path.
 *
 * One member: `runtime.error(message)`, which halts the script with the
 * author's own message. It exists so a script can refuse to produce numbers it
 * knows are wrong — the same stance this engine takes everywhere else — rather
 * than plotting `na` and leaving the reader to guess why.
 */

import { Context } from "../context";
import { val } from "../../../utils/v2/common";

/**
 * Thrown by `runtime.error`. A distinct class so a host can tell an intentional
 * script-level halt from an engine defect: the first is the script working as
 * written, the second is a bug here.
 */
export class PineRuntimeError extends Error {
    constructor(message: string, public readonly bar: number) {
        super(message);
        this.name = "PineRuntimeError";
    }
}

export const runtime = {
    error: (ctx: Context, message: any): never => {
        const text = val(message);
        throw new PineRuntimeError(
            text === null || text === undefined ? "" : String(text),
            ctx.currentBarIndex,
        );
    },
};
