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
    // A NAMESPACE can arrive at v4 and grow at v5. `session` is that case: its
    // three market-state booleans are April 2021 (v4), and the four
    // bar-position ones are v5. An exact v5 name therefore wins over its v4
    // root, or `session.isfirstbar` would join v4's view along with the rest of
    // the namespace and be spellable a version early.
    if (v5OnlyNames.has(key)) return false;

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

    // ...and the mirror of it: a member that arrived a version EARLY. `str.*`
    // is a v5 namespace, but `str.replace_all` is used in `//@version=4`
    // examples on the v4 manual's own tables and arrays pages. Naming the
    // member is what keeps the rest of `str.*` out of v4.
    if (v4OnlyNames.has(key)) return false;
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
    /**
     * The namespace entries THIS version adds.
     *
     * A rename whose new spelling already has a real implementation is not an
     * alias, and must not become one. `tostring` → `str.tostring` is the case:
     * ./str.ts implements the v5 two-argument form, and inheriting v4's
     * one-argument `tostring` on top of it silently dropped the FORMAT
     * argument — so `str.tostring(x, "#.##")` returned every digit of `x`, and
     * every golden-data harness column (scripts/common/make-log-harness.ts)
     * was captured with default formatting instead of the mask it asked for.
     *
     * The rename entry still has to EXIST, because it is also what tells the
     * emitter that flat `tostring` was renamed at v5 and produces the migration
     * error. Only its registry inheritance is wrong here.
     */
    implemented: Record<string, StdlibEntry> = {},
): Record<string, StdlibEntry> {
    const out: Record<string, StdlibEntry> = {};

    for (const { to, from, value } of renames) {
        if (implemented[to]) continue;

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
    aliasesFrom(V4_RENAMES, BASE_REGISTRY, 4, V4_NAMESPACE_REGISTRY);

/**
 * What a v4 script may spell.
 *
 * Built here rather than in transpiler/v4/ToJsVisitor.ts so that v5 can be
 * derived from it without importing an emitter: a registry view is data about
 * the LANGUAGE, and the emitter is one of its consumers rather than its owner.
 */
/**
 * v4's explicit type CASTS, under the flat names a script actually writes.
 *
 * `float`, `bool` and `string` are two different things at two different
 * versions — the v1–v3 `input()` type CONSTANTS, and v4's casting FUNCTIONS —
 * and one flat registry key cannot hold both. They are generated under `cast.*`
 * (see the header of ./cast.ts) and re-keyed here, so the constant survives in
 * BASE_REGISTRY and the function exists only from v4.
 *
 * Spread AFTER the removal, deliberately: `without(BASE_REGISTRY, V4_REMOVED)`
 * has just deleted the three constants, which is correct, and this puts the
 * three functions back under the same names. `cast.*` itself is dropped, so
 * `cast.float(x)` is not a spelling in any version.
 */
const V4_CASTS: Record<string, StdlibEntry> = Object.fromEntries(
    ["float", "bool", "string"].map(name => {
        const entry = V4_NAMESPACE_REGISTRY[`cast.${name}`];
        if (!entry) throw new Error(`stdlib: cast.${name} is missing from the registry`);
        return [name, entry];
    }),
);

/** Everything under `cast.` — present so it can be excluded, never spelled. */
const CAST_KEYS = Object.keys(V4_NAMESPACE_REGISTRY).filter(k => k.startsWith("cast."));

export const V4_VIEW: Record<string, StdlibEntry> = {
    ...without(BASE_REGISTRY, V4_REMOVED),
    ...without(V4_NAMESPACE_REGISTRY, CAST_KEYS),
    ...V4_REGISTRY,
    ...V4_CASTS,
};

export const V5_REGISTRY: Record<string, StdlibEntry> =
    aliasesFrom(V5_RENAMES, V4_VIEW, 5, V5_NAMESPACE_REGISTRY);

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

/**
 * An empty namespace object that still reads as `value`.
 *
 * For a name that is a CONSTANT at one version and a NAMESPACE at another —
 * `session` is the only one today — so that `input(1, type = session)` at v1–v3
 * and `session.regular` at v5 both work off one sandbox binding.
 */
function valueBearingNamespace(value: unknown): Record<string, any> {
    const holder: Record<string, any> = {};
    Object.defineProperty(holder, "valueOf", { value: () => value, enumerable: false });
    Object.defineProperty(holder, "toString", {
        value: () => String(value), enumerable: false,
    });
    return holder;
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

    // A handful of ROOTS are a flat VALUE at one version and a NAMESPACE at
    // another, and one sandbox slot cannot hold both readings:
    //
    //   session   v1–v3  the input-type constant, `input(s, type = session)`
    //             v5     the `session.*` namespace
    //   line      v1–v3  the plot-style constant, `plot(x, style = line)`
    //             v4+    the `line.*` drawing namespace
    //
    // Where THIS version can spell only one of the two, install only that one.
    // Installing both let the union's last writer decide, and at v1–v3
    // `x = session` came out as the namespace object rather than the string
    // "session" — an input whose declared type was `[object Object]`.
    //
    // Where a version can spell BOTH (v4 keeps a flat `line` alongside
    // `line.new`), nothing is skipped and the merge below settles it.
    const spellable = (key: string): boolean => view[key] !== undefined;
    const skip = (key: string): boolean => {
        const dot = key.indexOf(".");
        if (dot > 0) {
            // A namespace member whose ROOT is a flat value here, and which
            // this version cannot spell anyway.
            const root = key.slice(0, dot);
            return !spellable(key) && view[root]?.is_value === true;
        }
        // A flat value this version cannot spell, whose namespace it can.
        if (spellable(key)) return false;
        return Object.keys(view).some(k => k.startsWith(key + "."));
    };

    for (const [key, unscoped] of Object.entries(REGISTRY)) {
        if (skip(key)) continue;
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
                if (existing && typeof existing === "object" && entry.ref !== null
                    && (typeof entry.ref === "function" || typeof entry.ref === "object")) {
                    Object.assign(entry.ref, existing);
                    current[part] = entry.ref;
                } else if (existing && typeof existing === "object") {
                    // A PRIMITIVE arriving on top of a namespace. `line` is the
                    // case: it is the v1–v3 plot-style string AND the root of
                    // v4's drawing namespace, and both are in the union — so
                    // whichever the generator emitted last decided. Assigning
                    // the string dropped `line.all`, `line.new` and the other
                    // twenty members, and which way it went depended on
                    // filename order.
                    //
                    // The value is kept, on a namespace that carries it: the
                    // same non-enumerable `valueOf` device the intermediate
                    // branch below uses, so `plot(x, style = line)` still reads
                    // "line" through `val()` while `line.all` resolves.
                    const holder = valueBearingNamespace(entry.ref as any);
                    Object.assign(holder, existing);
                    current[part] = holder;
                } else {
                    current[part] = entry.ref;
                }
            } else {
                // Intermediate part: ensure the nested object exists.
                //
                // It may already be a FUNCTION rather than an object: `plot` is a
                // function and `plot.style_line` a constant, and the same holds
                // for color/input/hline/dayofweek/log/ticker. Attaching members
                // to the function object is legal, and injectStdlib knows to
                // prefix them there.
                //
                // It may also already be a PRIMITIVE. `session` is a v1–v3
                // input-type constant whose value is the string "session", and
                // it is also v5's `session.*` namespace — and this registry is
                // deliberately the union of every version's view, so both
                // arrive. A string cannot carry properties, so assigning
                // `session.regular` onto it threw
                //
                //     Cannot create property 'regular' on string 'session'
                //
                // at sandbox construction, which broke EVERY script rather than
                // just the ones naming `session`.
                //
                // The replacement is a plain object with a non-enumerable
                // `valueOf`, which is the same device ./inputs.ts uses to let
                // `input.float` be v4's constant and v5's function at once:
                // every read of a value in this engine goes through `val()`,
                // which calls `valueOf()`. Non-enumerable so that injectStdlib
                // does not mistake it for a namespace member and prefix it.
                const here = current[part];
                if (here === undefined || here === null) {
                    current[part] = {};
                } else if (typeof here !== "object" && typeof here !== "function") {
                    current[part] = valueBearingNamespace(here);
                }
                current = current[part];
            }
        }
    }

    return sandboxStdlib;
}

export { UNIMPLEMENTED_BUILTINS } from "./renames";
