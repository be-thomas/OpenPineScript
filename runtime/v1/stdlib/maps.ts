/**
 * Pine Script maps — the `map.*` namespace. v5, August 2023.
 *
 * ── Representation ──────────────────────────────────────────────────────────
 *
 * A JavaScript `Map`, unwrapped. Same reasoning as arrays (see ./arrays.ts): a
 * wrapper class would buy a type tag this engine does not model anywhere else,
 * and cost interop with every iteration in the runtime.
 *
 * Keys are STORED UNWRAPPED. A Pine map key is a scalar, but the emitter hands
 * the runtime a Series wherever the key came from a variable, and `Map` keys
 * compare by identity — so putting `Series(3)` and later looking up `3` would
 * miss, and worse, two writes of the same logical key would both be kept. Every
 * entry point below therefore passes its key through `val` first.
 *
 * ── Insertion order is the documented order ─────────────────────────────────
 *
 * `map.keys()` and `map.values()` return arrays, and Pine specifies them as
 * being in insertion order. `Map` iterates in insertion order, so nothing here
 * has to sort — but a re-`put` of an existing key must not move it to the end,
 * which is `Map.set`'s behaviour for an existing key and is why `put` does not
 * delete-then-set.
 *
 * v5-only, which this file does not enforce: the registry split in ./index.ts
 * keeps the namespace out of the v1–v4 views.
 */

import { val } from "../../../utils/v2/common";

/** Unwraps a Series and asserts the result really is a map. */
function m(id: any, fn: string): Map<any, any> {
    const v = val(id);
    if (!(v instanceof Map)) {
        throw new Error(`map.${fn}: expected a map, got ${v === undefined ? "na" : typeof v}`);
    }
    return v;
}

/** Map keys compare by identity, so every key is unwrapped before use. */
const key = (k: any): any => val(k);

export const map = {
    /**
     * `map.new<keyType, valueType>()`.
     *
     * The type arguments are parsed by the grammar and discarded by the
     * emitter: this engine does not track element types anywhere, and a
     * constructor that pretended to would be checking nothing.
     */
    new: () => new Map<any, any>(),

    // --- Access ------------------------------------------------------------

    /** Pine returns `na` for a missing key rather than raising. */
    get: (id: any, k: any) => {
        const target = m(id, "get");
        const at = key(k);
        return target.has(at) ? target.get(at) : NaN;
    },

    contains: (id: any, k: any): boolean => m(id, "contains").has(key(k)),
    size: (id: any): number => m(id, "size").size,

    // --- Mutation ----------------------------------------------------------

    /**
     * `map.put(id, key, value)` — returns the PREVIOUS value, or na.
     *
     * The return value is not decoration: `map.put` is how a script detects a
     * first write, and dropping it would make that idiom silently impossible.
     */
    put: (id: any, k: any, value: any) => {
        const target = m(id, "put");
        const at = key(k);
        const previous = target.has(at) ? target.get(at) : NaN;
        target.set(at, val(value));
        return previous;
    },

    put_all: (id: any, id2: any) => {
        const target = m(id, "put_all");
        for (const [k, v] of m(id2, "put_all")) target.set(k, v);
    },

    /** Returns the removed value, or na when the key was absent. */
    remove: (id: any, k: any) => {
        const target = m(id, "remove");
        const at = key(k);
        if (!target.has(at)) return NaN;
        const previous = target.get(at);
        target.delete(at);
        return previous;
    },

    clear: (id: any) => { m(id, "clear").clear(); },

    // --- Bulk views --------------------------------------------------------
    //
    // Both return a fresh ARRAY, not a live view. Pine specifies a copy, and a
    // live view would let a script mutate the map through the result of a read.

    keys: (id: any): any[] => [...m(id, "keys").keys()],
    values: (id: any): any[] => [...m(id, "values").values()],

    /** A shallow copy — the entries are shared, the map is not. */
    copy: (id: any) => new Map(m(id, "copy")),
};
