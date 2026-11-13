/**
 * Copies a built-in's persistent state for the per-bar rollback point.
 *
 * Every stateful call site is snapshotted on every bar (see `call` in
 * ./context.ts), and a state is usually a rolling buffer: `ta.sma` keeps up to
 * 5,000 values. `structuredClone` of that, once per site per bar, was most of
 * the run on a 110,000-bar chart (70% for a script with a few moving averages).
 *
 * States are plain data, so a plain copy does the same job: objects of
 * primitives, arrays of primitives, and those nested. Anything else — a Map, a
 * class instance, a function (which `structuredClone` refuses, and the caller
 * reports), a value reachable twice (whose sharing `structuredClone` keeps) —
 * hands the WHOLE value to `structuredClone`, so what it copies, and what it
 * throws on, is unchanged.
 *
 * Not in stdlib/, where every export becomes a Pine built-in.
 */

const FALLBACK = Symbol("fallback");

function copy(v: any, seen: Set<object>): any {
    const t = typeof v;
    if (v === null || (t !== "object" && t !== "function")) {
        return t === "symbol" ? FALLBACK : v;
    }
    if (t === "function" || seen.has(v)) return FALLBACK;
    seen.add(v);

    if (Array.isArray(v)) {
        if (Object.getPrototypeOf(v) !== Array.prototype) return FALLBACK;
        let flat = true;
        for (let i = 0; i < v.length; i++) {
            const e = v[i];
            const te = typeof e;
            if ((te === "object" && e !== null) || te === "function" || te === "symbol") { flat = false; break; }
        }
        if (flat) return v.slice();
        const out: any[] = new Array(v.length);
        for (let i = 0; i < v.length; i++) {
            if (!(i in v)) return FALLBACK;   // a hole: let structuredClone keep it
            const c = copy(v[i], seen);
            if (c === FALLBACK) return FALLBACK;
            out[i] = c;
        }
        return out;
    }

    const proto = Object.getPrototypeOf(v);
    if (proto !== Object.prototype && proto !== null) return FALLBACK;
    const out: Record<string, any> = {};
    for (const k of Object.keys(v)) {
        if (k === "__proto__") return FALLBACK;
        const c = copy(v[k], seen);
        if (c === FALLBACK) return FALLBACK;
        out[k] = c;
    }
    return out;
}

/** What `structuredClone(v)` returns, faster for plain data. */
export function cloneState<T>(v: T): T {
    const c = copy(v, new Set());
    return c === FALLBACK ? structuredClone(v) : c;
}
