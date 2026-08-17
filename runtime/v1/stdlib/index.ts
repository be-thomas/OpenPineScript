import { Context } from "../context";
import { getGeneratedRegistry, StdlibEntry } from "./metadata";
import { V4_RENAMES, V4_ONLY_NAMESPACES, V4_ONLY_NAMES } from "./renames";

/** Everything the generator found, at every version. */
const GENERATED: Record<string, StdlibEntry> = getGeneratedRegistry();

/**
 * The v1–v3 stdlib: everything generated, minus the namespaces that do not
 * exist before v4.
 *
 * This is the registry the TRANSPILER uses to decide what a v1–v3 script is
 * allowed to name (see `V1ToJsVisitor.registry`). The subtraction is what keeps
 * `array.new_float` and `label.new` from resolving at v1 — they live in the
 * ordinary stdlib source files, because the runtime is one implementation
 * across versions, so nothing else would stop them.
 */
const v4OnlyNamespaces = new Set(V4_ONLY_NAMESPACES);
const v4OnlyNames = new Set(V4_ONLY_NAMES);

/** True when `key` belongs to v4 and must not appear in the v1–v3 view. */
function isV4Only(key: string): boolean {
    // A flat name that v4 introduced — bb, wpr, mfi.
    if (v4OnlyNames.has(key)) return true;
    const root = key.split(".")[0];
    // A member of a v4-only namespace. The `key !== root` test keeps a FLAT
    // name of the same spelling: v1–v3 have a `line` plot-style constant, which
    // is unrelated to v4's `line.*` drawing namespace and must survive the cut.
    return key !== root && v4OnlyNamespaces.has(root);
}

export const BASE_REGISTRY: Record<string, StdlibEntry> = (() => {
    const out: Record<string, StdlibEntry> = {};
    for (const [key, entry] of Object.entries(GENERATED)) {
        if (!isV4Only(key)) out[key] = entry;
    }
    return out;
})();

/** The v4-only names, kept aside so v4's view can add them back. */
export const V4_NAMESPACE_REGISTRY: Record<string, StdlibEntry> = (() => {
    const out: Record<string, StdlibEntry> = {};
    for (const [key, entry] of Object.entries(GENERATED)) {
        if (isV4Only(key)) out[key] = entry;
    }
    return out;
})();

/**
 * The v4 spellings, each inheriting its v1–v3 entry wholesale.
 *
 * Inheriting rather than re-declaring is the point: `timeframe.period` must
 * carry `is_getter` and `uses_context` from `period`, or it emits as a static
 * reference and reads as the function object instead of the timeframe string.
 */
export const V4_REGISTRY: Record<string, StdlibEntry> = (() => {
    const out: Record<string, StdlibEntry> = {};

    for (const { to, from, value } of V4_RENAMES) {
        if (from !== undefined) {
            const source = BASE_REGISTRY[from];
            if (!source) {
                // A rename pointing at a name that does not exist would otherwise
                // produce an alias resolving to `undefined` — a constant that is
                // silently `na` everywhere it is used.
                throw new Error(
                    `v4 rename '${to}' names '${from}', which is not in the stdlib ` +
                    `registry. Either the source was renamed, or renames.ts has a typo.`,
                );
            }
            out[to] = source;
            continue;
        }

        out[to] = {
            uses_context: false,
            args: [],
            is_getter: false,
            returns: { type: "any" },
            is_value: true,
            ref: value,
        } as unknown as StdlibEntry;
    }

    return out;
})();

/**
 * Every name the RUNTIME can resolve, at any version.
 *
 * Deliberately the union. The runtime is shared across versions by design
 * (dev-docs/00-architecture-assessment.md §5.6) and is not the gatekeeper — the
 * transpiler decides what a given version may spell and refuses to emit
 * anything else. A union here just means the sandbox can execute whatever the
 * transpiler let through.
 */
export const REGISTRY: Record<string, StdlibEntry> = {
    ...GENERATED,
    ...V4_REGISTRY,
};

export function createStdlib(ctx: Context) {
    const sandboxStdlib: Record<string, any> = {};

    for (const [key, entry] of Object.entries(REGISTRY)) {
        const parts = key.split('.');
        let current = sandboxStdlib;

        // Iterate through parts to build/traverse the namespace tree
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (i === parts.length - 1) {
                // Final part: Assign the actual function/value reference
                current[part] = entry.ref;
            } else {
                // Intermediate part: ensure the nested object exists.
                //
                // It may already be a FUNCTION rather than an object: `plot` is a
                // function and `plot.style_line` a constant, and the same holds
                // for color/input/hline/dayofweek. Attaching members to the
                // function object is legal, and injectStdlib knows to prefix
                // them there.
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
        }
    }

    return sandboxStdlib;
}
