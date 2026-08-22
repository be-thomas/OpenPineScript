import { Context } from "../context";
import { getGeneratedRegistry, StdlibEntry } from "./metadata";
import {
    V4_RENAMES, V4_REMOVED, V4_ONLY_NAMESPACES, V4_ONLY_NAMES, RenameSpec,
} from "./renames";
import {
    V5_RENAMES, V5_REMOVED, V5_ONLY_NAMESPACES, V5_ONLY_NAMES,
} from "./renames5";

/**
 * ── Version-scoped registry views ───────────────────────────────────────────
 *
 * The stdlib is ONE implementation across versions (see
 * dev-docs/00-architecture-assessment.md §5.6), but it is not one VOCABULARY:
 * `sma` is a v1–v4 spelling and `ta.sma` is the v5 one, `red` is v1–v3 and
 * `color.red` is v4+, and accepting both dialects everywhere would compile
 * scripts TradingView rejects. That divergence — too permissive, silently — is
 * the one this file exists to prevent.
 *
 * So each version gets a VIEW, built by subtraction and addition from the one
 * below it:
 *
 *   BASE_REGISTRY   v1–v3   everything generated, minus the v4-only and
 *                           v5-only names
 *   V4_VIEW         v4      BASE − the spellings v4 renamed away
 *                           + the v4-only namespaces + the v4 aliases
 *   V5_VIEW         v5      V4_VIEW − the spellings v5 renamed away
 *                           + the v5-only namespaces + the v5 aliases
 *
 * Each visitor exposes its own view through `V1ToJsVisitor.registry`. The
 * RUNTIME registry at the bottom of this file is deliberately the union of all
 * of them — see the note there.
 */

/** Everything the generator found, at every version. */
const GENERATED: Record<string, StdlibEntry> = getGeneratedRegistry();

const v4OnlyNamespaces = new Set(V4_ONLY_NAMESPACES);
const v4OnlyNames = new Set(V4_ONLY_NAMES);
const v5OnlyNamespaces = new Set(V5_ONLY_NAMESPACES);
const v5OnlyNames = new Set(V5_ONLY_NAMES);

/** The root of a dotted key, or the key itself when it is flat. */
const rootOf = (key: string): string => key.split(".")[0];

/** True when `key` belongs to v4+ and must not appear in the v1–v3 view. */
function isV4Only(key: string): boolean {
    // A flat name that v4 introduced — bb, wpr, mfi.
    if (v4OnlyNames.has(key)) return true;
    const root = rootOf(key);
    // A member of a v4-only namespace. The `key !== root` test keeps a FLAT
    // name of the same spelling: v1–v3 have a `line` plot-style constant, which
    // is unrelated to v4's `line.*` drawing namespace and must survive the cut.
    return key !== root && v4OnlyNamespaces.has(root);
}

/** True when `key` belongs to v5 and must not appear in the v1–v4 views. */
function isV5Only(key: string): boolean {
    // An exact key — the typed `input.*` functions, whose ROOT is shared with
    // v4's constants of the same name and therefore cannot be gated wholesale.
    if (v5OnlyNames.has(key)) return true;
    const root = rootOf(key);
    return key !== root && v5OnlyNamespaces.has(root);
}

/** Selects the generated entries a predicate accepts. */
function select(accept: (key: string) => boolean): Record<string, StdlibEntry> {
    const out: Record<string, StdlibEntry> = {};
    for (const [key, entry] of Object.entries(GENERATED)) {
        if (accept(key)) out[key] = entry;
    }
    return out;
}

/**
 * The v1–v3 stdlib: everything generated, minus the namespaces that do not
 * exist yet.
 *
 * The subtraction is what keeps `array.new_float`, `label.new` and `str.length`
 * from resolving at v1 — they live in the ordinary stdlib source files, because
 * the runtime is one implementation across versions, so nothing else would stop
 * them.
 */
export const BASE_REGISTRY: Record<string, StdlibEntry> =
    select(key => !isV4Only(key) && !isV5Only(key));

/** The v4-only names, kept aside so v4's view can add them back. */
export const V4_NAMESPACE_REGISTRY: Record<string, StdlibEntry> = select(isV4Only);

/** The v5-only names, kept aside so v5's view can add them back. */
export const V5_NAMESPACE_REGISTRY: Record<string, StdlibEntry> = select(isV5Only);

/**
 * Builds an alias table: each new spelling inherits its source entry wholesale.
 *
 * Inheriting rather than re-declaring is the point. `timeframe.period` must
 * carry `is_getter` and `uses_context` from `period`, or it emits as a static
 * reference and reads as the function object instead of the timeframe string;
 * `ta.sma` must carry `args` from `sma`, or `ta.sma(close, length=20)` drops
 * its keyword argument and the length becomes undefined.
 *
 * A rename naming a source that does not exist THROWS at module load rather
 * than producing an alias that resolves to `undefined` — a built-in that is
 * silently `na` everywhere it is used.
 */
function aliasesFrom(
    renames: readonly RenameSpec[],
    source: Record<string, StdlibEntry>,
    version: number,
): Record<string, StdlibEntry> {
    const out: Record<string, StdlibEntry> = {};

    for (const { to, from, value } of renames) {
        if (from !== undefined) {
            const entry = source[from];
            if (!entry) {
                throw new Error(
                    `v${version} rename '${to}' names '${from}', which is not in the ` +
                    `v${version - 1} registry view. Either the source was renamed, or ` +
                    `renames${version === 4 ? "" : version}.ts has a typo.`,
                );
            }
            out[to] = entry;
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
}

/** Removes a version's retired spellings from a copy of the view below it. */
function without(view: Record<string, StdlibEntry>, removed: readonly string[]) {
    const out = { ...view };
    for (const name of removed) delete out[name];
    return out;
}

export const V4_REGISTRY: Record<string, StdlibEntry> =
    aliasesFrom(V4_RENAMES, BASE_REGISTRY, 4);

/**
 * What a v4 script may spell.
 *
 * Built here rather than in transpiler/v4/ToJsVisitor.ts so that v5 can be
 * derived from it without importing an emitter: a registry view is data about
 * the LANGUAGE, and the emitter is one of its consumers rather than its owner.
 */
export const V4_VIEW: Record<string, StdlibEntry> = {
    ...without(BASE_REGISTRY, V4_REMOVED),
    ...V4_NAMESPACE_REGISTRY,
    ...V4_REGISTRY,
};

export const V5_REGISTRY: Record<string, StdlibEntry> =
    aliasesFrom(V5_RENAMES, V4_VIEW, 5);

/** What a v5 script may spell. */
export const V5_VIEW: Record<string, StdlibEntry> = {
    ...without(V4_VIEW, V5_REMOVED),
    ...V5_NAMESPACE_REGISTRY,
    ...V5_REGISTRY,
};

/**
 * Every name the RUNTIME can resolve, at any version.
 *
 * Deliberately the union. The runtime is shared across versions by design
 * (dev-docs/00-architecture-assessment.md §5.6) and is not the gatekeeper — the
 * transpiler decides what a given version may spell and refuses to emit
 * anything else. A union here just means the sandbox can execute whatever the
 * transpiler let through.
 *
 * ORDER MATTERS for the one key that means different things at different
 * versions: `input.float` is a constant at v4 and a function at v5, and one
 * sandbox holds one object per name. V5_NAMESPACE_REGISTRY comes after
 * V4_REGISTRY so the FUNCTION wins, and ./inputs.ts gives that function a
 * `valueOf` returning the v4 constant so both readings survive.
 */
export const REGISTRY: Record<string, StdlibEntry> = {
    ...GENERATED,
    ...V4_REGISTRY,
    ...V5_NAMESPACE_REGISTRY,
    ...V5_REGISTRY,
};

/**
 * The view a given version writes against.
 *
 * Used by `createStdlib` to settle the handful of keys that MEAN different
 * things at different versions. It is not a gatekeeper — the transpiler decides
 * what a version may spell, and this function is never consulted about whether
 * a name is allowed, only about which of two meanings a name has.
 */
export function viewFor(version: number): Record<string, StdlibEntry> {
    if (version >= 5) return V5_VIEW;
    if (version === 4) return V4_VIEW;
    return BASE_REGISTRY;
}

export function createStdlib(ctx: Context) {
    const sandboxStdlib: Record<string, any> = {};

    // Where a key means different things at different versions, THIS version's
    // meaning wins.
    //
    // There is exactly one such family today: `input.float` and its five
    // siblings are CONSTANTS at v4 (`input(1.0, type=input.float)`) and
    // FUNCTIONS at v5 (`input.float(1.0)`). One sandbox holds one object per
    // name, so without this the union's last writer decided for both versions
    // and a v4 script read a function where it expected the string "float".
    //
    // The key SET stays the union — a name absent from this version's view
    // keeps whatever the union says, because the transpiler has already refused
    // to emit it and the runtime is not the place to refuse a second time.
    const view = viewFor(ctx.profile.version);

    for (const [key, unscoped] of Object.entries(REGISTRY)) {
        const entry = view[key] ?? unscoped;
        const parts = key.split('.');
        let current = sandboxStdlib;

        // Iterate through parts to build/traverse the namespace tree
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            if (i === parts.length - 1) {
                // Final part: assign the actual function/value reference.
                //
                // A namespace may already have been built here under the same
                // name — `log.info` before the flat `log`, `input.int` before
                // `input` — in which case a plain assignment would DROP the
                // members that were attached first. Which of the two arrives
                // first depends on the order the generator emitted keys in, so
                // the merge is not an optimisation: without it, whether
                // `log.info` exists depends on filename alphabetisation.
                const existing = current[part];
                if (existing && typeof existing === "object" && typeof entry.ref === "function") {
                    Object.assign(entry.ref, existing);
                }
                current[part] = entry.ref;
            } else {
                // Intermediate part: ensure the nested object exists.
                //
                // It may already be a FUNCTION rather than an object: `plot` is a
                // function and `plot.style_line` a constant, and the same holds
                // for color/input/hline/dayofweek/log/ticker. Attaching members
                // to the function object is legal, and injectStdlib knows to
                // prefix them there.
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
        }
    }

    return sandboxStdlib;
}
