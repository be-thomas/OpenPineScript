/**
 * Pine Script arrays — the `array.*` namespace.
 *
 * Added to Pine in September 2020, under v4 (see the v4 release notes). They
 * are v4+ only, which this file does NOT enforce: the registry split in
 * ./index.ts removes the whole namespace from the v1–v3 view, so a v3 script
 * naming `array.new_float` is refused there rather than by a check here.
 *
 * ── Representation ──────────────────────────────────────────────────────────
 *
 * A Pine array is a plain JavaScript array. Not a wrapper class — the wrapper
 * would buy a type tag and cost interop with every `Math.*`, spread and
 * destructure in the runtime, and the type tag is not worth that: Pine's own
 * type checking happens at compile time, and this engine does not model
 * `array<float>` versus `array<int>` anywhere else either.
 *
 * ── Why identity matters ────────────────────────────────────────────────────
 *
 * Pine arrays are REFERENCE values. `var a = array.new_float(0)` holds one
 * array across every bar, and `array.push(a, x)` mutates that one. The engine
 * gets this for free: `Context.var_def` re-stamps the same reference onto each
 * bar, so every bar sees the same object. Copying on read would silently make
 * every push a no-op from the next bar's point of view.
 */

import { val } from "../../../utils/v2/common";

/** Unwraps a Series and asserts the result really is an array. */
function arr(id: any, fn: string): any[] {
    const a = val(id);
    if (!Array.isArray(a)) {
        // `na` unwraps to NaN, which is a number, and reporting it as one named
        // the wrong thing: `array<int> a = na` then `array.push(a, 111)` — which
        // is TradingView's own "Out of bounds index" demo — read as
        // "expected an array, got number".
        const what = a === undefined || a === null
            || (typeof a === "number" && Number.isNaN(a)) ? "na" : typeof a;
        throw new Error(`array.${fn}: expected an array, got ${what}`);
    }
    return a;
}

/**
 * Pine reports an out-of-range index rather than returning na.
 *
 * A FRACTIONAL index is floored rather than refused. TradingView's own
 * `v5-language-arrays-06` states the rule in a comment on the line that needs
 * it — "The index used by `array.get()` will be the equivalent of
 * `floor(fillNo)`" — and computes that index as
 * `math.min(lastHiBar / (lookbackInput / 5), 4)`, an ordinary float. Requiring
 * an integer rejected the script at its first bar.
 */
function bounds(a: any[], index: any, fn: string): number {
    const i = Math.floor(Number(val(index)));
    if (!Number.isFinite(i) || i < 0 || i >= a.length) {
        throw new Error(`array.${fn}: index ${i} is out of bounds (size ${a.length})`);
    }
    return i;
}

const num = (x: any): number => Number(val(x));

/** Finite numeric members only — `na` is excluded from every aggregate. */
const finite = (a: any[]): number[] =>
    a.map(x => Number(val(x))).filter(x => Number.isFinite(x));

function sized(size: any, initial: any): any[] {
    const n = Number(val(size)) || 0;
    if (n < 0) throw new Error(`array.new: size cannot be negative (got ${n})`);
    return new Array(n).fill(val(initial));
}

export const array = {
    // --- Construction ------------------------------------------------------
    // Pine has one constructor per element type. They differ only in the
    // default fill value, since the element type is not tracked at run time.
    new_float: (size: any = 0, initial_value: any = NaN) => sized(size, initial_value ?? NaN),
    new_int: (size: any = 0, initial_value: any = 0) => sized(size, initial_value ?? 0),
    new_bool: (size: any = 0, initial_value: any = false) => sized(size, initial_value ?? false),
    new_string: (size: any = 0, initial_value: any = "") => sized(size, initial_value ?? ""),
    new_color: (size: any = 0, initial_value: any = null) => sized(size, initial_value ?? null),
    new_line: (size: any = 0, initial_value: any = null) => sized(size, initial_value ?? null),
    new_label: (size: any = 0, initial_value: any = null) => sized(size, initial_value ?? null),
    new_box: (size: any = 0, initial_value: any = null) => sized(size, initial_value ?? null),
    new_table: (size: any = 0, initial_value: any = null) => sized(size, initial_value ?? null),

    /** `array.from(v1, v2, …)` — build an array from its arguments. */
    from: (...items: any[]) => items.map(val),

    // --- Access ------------------------------------------------------------
    get: (id: any, index: any) => {
        const a = arr(id, "get");
        return a[bounds(a, index, "get")];
    },
    set: (id: any, index: any, value: any) => {
        const a = arr(id, "set");
        a[bounds(a, index, "set")] = val(value);
    },
    size: (id: any) => arr(id, "size").length,

    /**
     * `array.first(id)` and `array.last(id)` — January 2023.
     *
     * "Returns the array's first element" / "Returns the array's last element."
     *
     * An EMPTY array is an error rather than `na`, which is the same rule
     * `array.get` follows for an out-of-range index: the two are the same
     * mistake, and answering `na` would let a script average nothing and plot
     * it.
     */
    first: (id: any) => {
        const a = arr(id, "first");
        if (!a.length) throw new Error("array.first: array is empty");
        return a[0];
    },
    last: (id: any) => {
        const a = arr(id, "last");
        if (!a.length) throw new Error("array.last: array is empty");
        return a[a.length - 1];
    },

    /**
     * `array.binary_search(id, val)` — the index of `val`, or -1.
     *
     * Requires the array to be sorted ASCENDING, which is the contract of every
     * binary search and is why the three `binary_search*` functions exist
     * alongside `array.indexof`: on a sorted array they are the fast answer, and
     * on an unsorted one they are a wrong one. This engine does not verify the
     * ordering — checking it would cost the very thing the function is for.
     */
    binary_search: (id: any, value: any) => {
        const a = arr(id, "binary_search");
        const target = val(value);
        let lo = 0;
        let hi = a.length - 1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            const here = val(a[mid]);
            if (here === target) return mid;
            if (here < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    },

    // --- Mutation ----------------------------------------------------------
    push: (id: any, value: any) => { arr(id, "push").push(val(value)); },
    pop: (id: any) => {
        const a = arr(id, "pop");
        if (!a.length) throw new Error("array.pop: array is empty");
        return a.pop();
    },
    shift: (id: any) => {
        const a = arr(id, "shift");
        if (!a.length) throw new Error("array.shift: array is empty");
        return a.shift();
    },
    unshift: (id: any, value: any) => { arr(id, "unshift").unshift(val(value)); },
    insert: (id: any, index: any, value: any) => {
        const a = arr(id, "insert");
        const i = Number(val(index));
        if (!Number.isInteger(i) || i < 0 || i > a.length) {
            throw new Error(`array.insert: index ${i} is out of bounds (size ${a.length})`);
        }
        a.splice(i, 0, val(value));
    },
    remove: (id: any, index: any) => {
        const a = arr(id, "remove");
        return a.splice(bounds(a, index, "remove"), 1)[0];
    },
    clear: (id: any) => { arr(id, "clear").length = 0; },
    /**
     * Fills a contiguous range, and RETURNS THE ARRAY.
     *
     * The reference gives `array.fill(id, value, index_from, index_to) → void`,
     * and the manual's Methods page gives this example
     *
     *     srcArray.copy().fill(1.0, 0.0, min, val).avg()
     *
     * with the explanation: "We are able to call `copy()`, `fill()`, and
     * `avg()` successively on the same line of code because the first two
     * methods return an `array<float>` instance."
     *
     * The two statements disagree. The example is the one a script can depend
     * on — it is TradingView's own published code, and returning the receiver
     * is a strict superset of returning nothing: a caller that ignores the
     * result cannot tell the difference. So the receiver is returned, and the
     * conflict is recorded here rather than resolved silently.
     */
    fill: (id: any, value: any, index_from: any = 0, index_to: any = undefined) => {
        const a = arr(id, "fill");
        const from = Number(val(index_from)) || 0;
        const to = index_to === undefined || val(index_to) === undefined
            ? a.length : Number(val(index_to));
        a.fill(val(value), from, to);
        return a;
    },

    // --- Whole-array operations -------------------------------------------
    // `copy` and `slice` return NEW arrays. `concat` does NOT: it appends id2
    // onto id1 and returns id1, which is what Pine does — so a caller holding
    // id1 sees it grow. The rest mutate in place. Pine draws these lines, not
    // us; the shapes are copied, not chosen.
    copy: (id: any) => arr(id, "copy").slice(),
    slice: (id: any, index_from: any, index_to: any) =>
        arr(id, "slice").slice(Number(val(index_from)), Number(val(index_to))),
    concat: (id1: any, id2: any) => {
        const a = arr(id1, "concat");
        a.push(...arr(id2, "concat"));
        return a;
    },
    reverse: (id: any) => { arr(id, "reverse").reverse(); },
    sort: (id: any, order: any = "asc") => {
        const a = arr(id, "sort");
        const desc = String(val(order) ?? "asc").includes("desc");
        // Numeric compare, NOT JavaScript's default lexicographic sort — which
        // would order [2, 10] as [10, 2].
        a.sort((x, y) => (desc ? num(y) - num(x) : num(x) - num(y)));
    },

    // --- Search ------------------------------------------------------------
    includes: (id: any, value: any) => arr(id, "includes").includes(val(value)),
    indexof: (id: any, value: any) => arr(id, "indexof").indexOf(val(value)),
    lastindexof: (id: any, value: any) => arr(id, "lastindexof").lastIndexOf(val(value)),

    // --- Aggregates --------------------------------------------------------
    // All ignore `na`, and all return `na` for an empty (or all-na) array
    // rather than 0 — 0 is a legitimate result and must stay distinguishable.
    sum: (id: any) => {
        const f = finite(arr(id, "sum"));
        return f.length ? f.reduce((s, x) => s + x, 0) : NaN;
    },
    avg: (id: any) => {
        const f = finite(arr(id, "avg"));
        return f.length ? f.reduce((s, x) => s + x, 0) / f.length : NaN;
    },
    min: (id: any) => {
        const f = finite(arr(id, "min"));
        return f.length ? Math.min(...f) : NaN;
    },
    max: (id: any) => {
        const f = finite(arr(id, "max"));
        return f.length ? Math.max(...f) : NaN;
    },
    range: (id: any) => {
        const f = finite(arr(id, "range"));
        return f.length ? Math.max(...f) - Math.min(...f) : NaN;
    },
    median: (id: any) => {
        const f = finite(arr(id, "median")).sort((x, y) => x - y);
        if (!f.length) return NaN;
        const mid = f.length >> 1;
        return f.length % 2 ? f[mid] : (f[mid - 1] + f[mid]) / 2;
    },
    mode: (id: any) => {
        const f = finite(arr(id, "mode"));
        if (!f.length) return NaN;
        const counts = new Map<number, number>();
        for (const x of f) counts.set(x, (counts.get(x) ?? 0) + 1);
        // Pine returns the SMALLEST value among those tied for most frequent.
        let best = NaN, bestCount = -1;
        for (const [value, count] of [...counts].sort((p, q) => p[0] - q[0])) {
            if (count > bestCount) { best = value; bestCount = count; }
        }
        return best;
    },
    /** Sample variance (n-1), matching `variance()` elsewhere in the stdlib. */
    variance: (id: any) => {
        const f = finite(arr(id, "variance"));
        if (f.length < 2) return NaN;
        const mean = f.reduce((s, x) => s + x, 0) / f.length;
        return f.reduce((s, x) => s + (x - mean) ** 2, 0) / (f.length - 1);
    },
    stdev: (id: any) => {
        const f = finite(arr(id, "stdev"));
        if (f.length < 2) return NaN;
        const mean = f.reduce((s, x) => s + x, 0) / f.length;
        return Math.sqrt(f.reduce((s, x) => s + (x - mean) ** 2, 0) / (f.length - 1));
    },
    covariance: (id1: any, id2: any) => {
        const a = finite(arr(id1, "covariance"));
        const b = finite(arr(id2, "covariance"));
        const n = Math.min(a.length, b.length);
        if (n < 2) return NaN;
        const ma = a.slice(0, n).reduce((s, x) => s + x, 0) / n;
        const mb = b.slice(0, n).reduce((s, x) => s + x, 0) / n;
        let acc = 0;
        for (let i = 0; i < n; i++) acc += (a[i] - ma) * (b[i] - mb);
        return acc / (n - 1);
    },

    /** `array.join(id, separator)` — v4 spells the default separator as ",". */
    join: (id: any, separator: any = ",") =>
        arr(id, "join").map(x => String(val(x))).join(String(val(separator) ?? ",")),
};

/**
 * `array.sort`'s direction argument.
 *
 * A namespace of its own in Pine rather than a string, which is why the tests
 * spell `order.descending` and not `"desc"`. `array.sort` accepts either, since
 * it only asks whether the value contains "desc".
 */
export const order = {
    ascending: "ascending",
    descending: "descending",
};
