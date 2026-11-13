/**
 * Pine Script v5 → JavaScript emitter.
 *
 * v5 inherits every guard v3 added and every declaration form v4 added. The
 * migration guide relaxes none of them, so nothing here undoes anything.
 *
 * What v5 adds falls into four groups:
 *
 *   NAMES (runtime/v1/stdlib/renames5.ts + the V5_VIEW registry)
 *     The §4a namespace migration — `sma` → `ta.sma`, `abs` → `math.abs`,
 *     `security` → `request.security`, `tostring` → `str.tostring` — plus the
 *     §4b renames that keep their namespace (`study` → `indicator`) and the §4c
 *     removals (`iff`, `offset`, `transp=`). Those are lookups and rejections,
 *     driven from a data table, not emit rules.
 *
 *   SYNTAX (this file)
 *     `while`, `switch`, and `for … in`. None is a v4 construct — an early
 *     draft of the delta spec said otherwise about the first two and was wrong
 *     — so v4 emits nothing for them and v5 emits all three here.
 *
 *   RESERVED WORDS (this file)
 *     Twelve of the thirteen words v5 will not let a script NAME anything (the
 *     thirteenth, `in`, is a lexer keyword — see RESERVED below). Enforced on the
 *     identifier rather than in the lexer, because `text` is simultaneously a
 *     live namespace (`text.align_left`) and a forbidden variable name — a
 *     distinction a token cannot draw.
 *
 *   KEYWORD ARGUMENTS (this file)
 *     §4b renamed parameters without renaming their functions:
 *     `study(resolution=)` became `indicator(timeframe=)`, `strategy.entry(long=)`
 *     became `direction=`. Where the RUNTIME still spells one the old way — it is
 *     one implementation across versions — the emitter translates. Where it has
 *     taken the new name (`strategy.entry`'s `direction`), there is nothing to
 *     translate, and v1–v4's `long=` is mapped the other way, in the runtime
 *     (`V4_RENAMED_PARAMS`). tests/v5/transpiler/keyword_aliases.test.ts fails
 *     if an alias targets a name the runtime does not have.
 *
 * ── What is NOT implemented at v5 ───────────────────────────────────────────
 *
 * User-defined types (`type`), methods (`method`), and libraries
 * (`import`/`export`). Each needs a type system this engine does not have:
 * `p.x` is currently always a namespace member, and telling it apart from a
 * field access requires knowing that `p` came from `Point.new()`.
 *
 * `type` is absent from the GRAMMAR, so a script using it fails with "parsing
 * failed" — the same verdict v1 gives `:=` and v4 gives `while`. The other three
 * DO parse, because the inherited grammar can read what follows the keyword on
 * its own, so they are rejected by NAME instead — see UNSUPPORTED below. Either
 * way the script is refused rather than compiled into something it does not say.
 */
import type { PineVersion } from "../common/version";
import { V4ToJsVisitor } from "../v4/ToJsVisitor";
import { isRule } from "../v1/ToJsVisitor";
import { branchTupleWidths } from "../common/passes/ScopeAnalysis";
import type { StdlibEntry } from "../../runtime/v1/stdlib/metadata";
import { V5_VIEW } from "../../runtime/v1/stdlib";
import { V5_RENAMES, V5_REMOVED } from "../../runtime/v1/stdlib/renames5";
import type { ParseTree } from "antlr4ng";
import { parse as parseV5 } from "../../parser/v5";
import {
  declarationName, dynamicRequestsSetting, hasIndicatorOutput,
  insideConditionalOrLoop, isColorExpression, unwrap,
} from "../v6/rules";
import {
  While_exprContext,
  For_in_exprContext,
  Call_suffixContext,
  Switch_exprContext,
  Switch_caseContext,
  Fun_callContext,
  Var_defsContext,
  Var_assignContext,
  Kw_argContext,
  IdContext,
  StmtContext,
  Type_def_stmtContext,
  Enum_def_stmtContext,
  Method_def_stmtContext,
  Export_stmtContext,
  Import_stmtContext,
  Fun_headContext,
  Pine_scriptContext,
  Fun_def_stmtContext,
  Fun_def_singlelineContext,
  Fun_def_multilineContext,
} from "../../parser/v5/generated/PineV5Parser";

/** One declaration of an overloaded function name. */
/**
 * A type as overloads compare it: no whitespace, and no library alias on any
 * part — `lib.Point` and `Point`, `array<lib.Point>` and `array<Point>`, are
 * the same type to a library's own declarations.
 */
export function normaliseType(t: string): string {
  const bare = t.replace(/^\s*(series|simple|const)\s+/, "").replace(/\s+/g, "").replace(/\b[A-Za-z_]\w*\./g, "");
  // `float[]` is the older spelling of `array<float>`.
  const legacy = /^(.+)\[\]$/.exec(bare);
  return legacy ? `array<${legacy[1]}>` : bare;
}

/** `resolveOverload`'s answer when the overload is an imported library's. */
const LIBRARY_METHOD = "\u0000library";

/** The types a value can be told apart by from source alone. */
const PRIMITIVE_TYPES = new Set(["int", "float", "bool", "string", "color"]);

/**
 * Does a method declared on `decl` take a receiver of type `want`? Both are
 * normalised. An int widens to float, in a container's element too: a
 * `matrix<int>` is passed to a method declared on `matrix<float>` in
 * TradingView's own matrices example. Any other element type is a different
 * receiver, so `array<string>.set` is the built-in when the script declares
 * `set` for `array<float>`.
 */
function receiverTakes(decl: string, want: string): boolean {
  if (decl === want || (decl === "float" && want === "int")) return true;
  const d = /^(\w+)<(.*)>$/.exec(decl), w = /^(\w+)<(.*)>$/.exec(want);
  return !!d && !!w && d[1] === w[1] && receiverTakes(d[2], w[2]);
}

/**
 * Do the overloads left, at a position whose type is unknown, include both an
 * `int` and a `float` declaration? The run-time dispatcher cannot tell those
 * apart — a whole-number float looks like an int, so `close` of 11.0 would
 * reach the `int` body — so the `float` one is taken. It is the sound
 * default: Pine widens any int to float, never the reverse.
 */
function mixesIntFloat(types: ReadonlyArray<string | null>): boolean {
  const t = new Set(types.map(x => (x === null ? null : normaliseType(x))));
  return t.has("int") && t.has("float");
}

/**
 * `float` or `int` for an arithmetic expression whose type its text settles:
 * a price series or a decimal literal makes it float, as does `/`; integer
 * literals alone keep it int. Anything with a call or another name is
 * unknown — a runtime value cannot tell `22.0` from `22`, so the guess has to
 * be made here or not at all.
 */
export function numericTypeOf(text: string): "int" | "float" | null {
  if (/["'#(]/.test(text)) return null;
  // A comparison, a logical operator or a ternary is not arithmetic: `close >
  // open` is a bool, and `close > open ? 1 : 0` an int.
  if (/[<>=!?:]/.test(text)) return null;
  const names = text.match(/[A-Za-z_]\w*/g) ?? [];
  const FLOAT_SERIES = /^(open|high|low|close|hl2|hlc3|ohlc4|hlcc4|volume)$/;
  if (names.some(n => !FLOAT_SERIES.test(n))) return null;
  if (names.length > 0 || /\d\.\d*|\.\d|\//.test(text)) return "float";
  return /^[-+*%\d\s]+$/.test(text) ? "int" : null;
}

interface FnOverload {
  /** Fewest arguments a call may pass — parameters without a default. */
  min: number;
  /** Most — every parameter. */
  max: number;
  /** Each parameter's DECLARED type, or null where none is written. */
  types: Array<string | null>;
}

/** Anything carrying a source position (see the v1 base for why it is structural). */
interface SourceLocated {
  start?: { line: number; column: number } | null;
}

/** Construction options — how a v5 script reaches code outside itself. */
export interface V5Options {
  /**
   * Library sources, keyed by the path an `import` names
   * (`"someuser/somelib/1"`). Supplied by the host; see the field of the same
   * name on the visitor for why they cannot be fetched.
   */
  readonly libraries?: Readonly<Record<string, string>>;
  /**
   * Apply the checks TradingView's chart editor makes and its compile endpoint
   * does not (an indicator with no output, `request.*()` in a conditional at
   * v5, `color.new()` with no transparency, a colour for `input.string`).
   * Off for bare transpiles, so fixtures need not be complete scripts.
   */
  readonly editorRules?: boolean;
  /** Disambiguates emitted source locations. Set when compiling a library. */
  readonly locationTag?: string;
  /** Disambiguates the names a script DECLARES. Set when compiling a library. */
  readonly nameScope?: string;
  /** The library paths being compiled above this one, outermost first. Set when compiling a library. */
  readonly libraryChain?: readonly string[];
}

/** One field of a user-defined type. */
interface TypeField {
  readonly name: string;
  /** Its `= …` initialiser, or null — an undeclared default is `na`. */
  readonly defaultExpr: any | null;
}

/** One member of an `enum` declaration. */
interface EnumField {
  readonly name: string;
  /**
   * Its `= "title"` expression, or null.
   *
   * "If the programmer does not specify a field's title, its title is the
   * 'string' representation of its name."
   */
  readonly titleExpr: any | null;
}

/**
 * The marker separating a library's emitted names from the importing script's.
 *
 * `$` cannot occur in a Pine identifier, so a collision with anything the
 * script itself declares is impossible rather than merely unlikely — the same
 * device `funcName` uses to keep functions and variables apart.
 */
const LIBRARY_MARK = "$lib$";

/** How deeply one library may import another before the nesting is refused. */
const MAX_LIBRARY_DEPTH = 8;

/**
 * The alias an `import` gets when it does not name one.
 *
 * Pine uses the library's own name — the middle segment of `user/name/version`.
 */
function defaultAlias(path: string): string {
  const parts = path.split("/");
  return parts.length >= 2 ? parts[1] : parts[0];
}

/**
 * v4 spelling → the v5 spelling that replaced it.
 *
 * Filtered by V5_REMOVED, not taken from the rename table wholesale. A rename's
 * source is usually gone, but not always: `ticker.new` inherits
 * `syminfo.tickerid`, and `syminfo.tickerid` is still a live v5 variable
 * because only the FUNCTION moved. Gating on the table alone rejected it, so
 * `request.security(syminfo.tickerid, …)` — the most common line in any
 * multi-timeframe script — was refused at v5 with advice to rename it to
 * something else entirely.
 *
 * The entries added afterwards are the ones that are not stdlib registry
 * renames and therefore cannot live in the table: `study` is a directive the
 * emitter intercepts before any registry lookup, and the two `input.*`
 * constants changed NAME as well as kind.
 */
const REMOVED_AT_V5 = new Set(V5_REMOVED);
const REPLACEMENT = new Map<string, string>(
  V5_RENAMES
    .filter(r => r.from !== undefined && REMOVED_AT_V5.has(r.from))
    .map(r => [r.from!, r.to]),
);
REPLACEMENT.set("study", "indicator");
REPLACEMENT.set("input.integer", "input.int");
REPLACEMENT.set("input.resolution", "input.timeframe");
// `tonumber` is not in this engine's registry at any version, so it cannot be
// renamed by the table. It is in the migration guide, and a v5 script written
// from a v4 one will contain it, so the diagnostic is worth having anyway.
REPLACEMENT.set("tonumber", "str.tonumber");

/**
 * v4 spellings v5 removed OUTRIGHT — no new name, a different construct.
 *
 * Kept apart from REPLACEMENT because the advice differs in kind: "it is called
 * X now" is a rename, "rewrite it as Y" is not, and a message that says the
 * first when it means the second sends the reader looking for a name that does
 * not exist.
 */
const REWRITTEN = new Map<string, string>([
  ["iff", "use the ternary operator instead: `cond ? a : b`"],
  ["offset", "use the history-referencing operator instead: `x[n]`"],
]);

/**
 * v5 keywords this engine does not implement, and what each one introduces.
 *
 * EMPTY — `type`, `method`, `import` and `export` are all keyword TOKENS with
 * grammar rules of their own now, so none of them can reach `visitId` as a bare
 * identifier. The table and its guard are kept because they are the mechanism
 * that stopped those three from silently compiling to something else while they
 * were unimplemented: `export f(x) =>` parsed as the statement `export` plus an
 * ordinary function, and emitted the function with the keyword discarded. The
 * next unimplemented keyword goes here rather than being discovered that way.
 */
const UNSUPPORTED = new Map<string, string>([]);

/**
 * Words v5 reserves. A script may not NAME anything one of these.
 *
 * Source: docs/common/VERSIONS.md §4e, from the v5 migration guide.
 *
 * `text` is on the list and is also a live namespace root, which is why the
 * check below only ever fires on an UNDOTTED identifier that is not a keyword
 * argument's name.
 *
 * `in` is the fourteenth reserved word and is deliberately NOT here. It is the
 * only one that carries syntax — `for item in xs` is unreadable without it — so
 * PineV5Lexer.g4 tokenises it, and `in = 5` is a parse error before this check
 * could run. Listing it anyway would be dead code that reads like the rule.
 */
const RESERVED = new Set([
  "catch", "class", "do", "ellipse", "is", "polygon", "range", "return",
  "struct", "text", "throw", "try",
]);

/**
 * Keyword arguments v5 renamed, per CALLEE.
 *
 * §4b renamed these parameters without renaming their functions. The runtime
 * still spells most of them the v1–v4 way — it is one implementation across versions,
 * and `Context.call` matches a keyword argument by looking its written name up
 * in the registry entry's parameter list — so an unmatched key is DROPPED
 * SILENTLY. A v5 script writing `indicator(timeframe="D")` would therefore have
 * had its timeframe ignored and fallen back to the chart's.
 *
 * Scoped per callee rather than applied globally because the new names are
 * ordinary words: `source` is a parameter of half the `input.*` family, and
 * rewriting it everywhere would corrupt those calls to fix `nz`.
 */
export const KEYWORD_ALIASES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  indicator: { timeframe: "resolution", timeframe_gaps: "resolution_gaps" },
  "request.security": { timeframe: "resolution" },
  time: { timeframe: "resolution" },
  time_close: { timeframe: "resolution" },
  // `strategy.entry` is absent: the runtime's parameter is `direction` too.
  // `strategy.order`'s is `dir`.
  "strategy.order": { direction: "dir" },
  nz: { source: "x", replacement: "y" },
};

/**
 * `strategy.exit()` must specify at least one exit condition (§4d).
 *
 * Without one the order can never fill, and v4 accepted it silently — the
 * position simply stayed open forever, which reads as a strategy that never
 * exits rather than as a script that is wrong.
 */
const EXIT_CONDITIONS = [
  "profit", "limit", "loss", "stop",
  "trail_price", "trail_points", "trail_offset",
];

/**
 * How many passes a `while` may make before the engine gives up.
 *
 * TradingView bounds a loop by EXECUTION TIME, not by iteration count, and does
 * not publish the budget — so no count here can be the same rule. This one
 * exists for a different reason: `while` is the first construct in the language
 * that can fail to terminate, and a script that hangs the host gives its author
 * nothing to work with. A bound that is generous enough never to be reached by
 * a correct script turns a hang into a diagnostic.
 */
const WHILE_ITERATION_LIMIT = 100_000;

/**
 * Is this id the KEY of a keyword argument rather than a reference to a variable?
 *
 * The same question v3 asks for its forward-reference rule, and for the same
 * reason: `kw_arg : id DEFINE (...)`, and the base `visitKw_arg` visits that id
 * to emit the key, so a guard hooked on `visitId` sees it. It is not a variable
 * read — the name belongs to the callee's parameter list.
 *
 * At v5 this matters twice over. `label.new(x, y, text="hi")` would otherwise
 * be rejected for naming a reserved word, and `plot(close, ...)` calls whose
 * parameter happens to be spelled like a renamed built-in would be rejected for
 * using a v4 spelling.
 */
function isKeywordArgumentName(ctx: IdContext): boolean {
  const parent = (ctx as any).parent;
  return isRule(parent, "Kw_argContext") && parent.id?.() === ctx;
}

export class V5ToJsVisitor extends V4ToJsVisitor {
  protected override readonly version: PineVersion = 5;

  /**
   * v5's view of the stdlib: v4's, minus the spellings v5 renamed away, plus
   * the namespaces it introduced and the aliases it created.
   *
   * Subtracting matters as much as adding — leaving `sma` in beside `ta.sma`
   * would accept both dialects, and a script written half in each compiles here
   * and fails on TradingView.
   */
  protected override get registry(): Record<string, StdlibEntry> {
    return V5_VIEW;
  }

  /**
   * The callee whose arguments are currently being emitted, innermost last.
   *
   * `visitKw_arg` needs to know which function a keyword belongs to before it
   * can decide whether to translate its name, and the grammar gives it no way
   * up to the call. A stack rather than a single field because arguments nest:
   * `strategy.entry("L", direction=strategy.long, qty=nz(q, replacement=1))`.
   */
  private calleeStack: string[] = [];

  // ── User-defined types, methods and libraries ─────────────────────────────

  /** Declared type name → its fields, in declaration order. */
  protected userTypes: Map<string, TypeField[]> = new Map();

  /**
   * `enum Name` declarations, name → its fields in declaration order.
   *
   * Collected in the same pre-pass as `userTypes`, and for the same reason: a
   * member may be READ above the line that declares its enum, inside any
   * function body, and a single-pass emitter cannot know that yet.
   */
  protected userEnums: Map<string, EnumField[]> = new Map();

  /**
   * Names declared with `method`.
   *
   * Kept apart from `userFunctions` — which already contains them, since a
   * method's body IS a function definition — because only a method may be
   * called as `receiver.name(…)`. A plain function of the same name may not,
   * and answering that question wrongly turns a typo into a silent field read.
   */
  protected userMethods: Set<string> = new Set();

  /**
   * method name → the receiver type of each declaration of it, in file order.
   *
   * A single entry is the ordinary case and changes nothing. Two or more is an
   * OVERLOAD SET: "User-defined methods can override and overload existing
   * built-in and user-defined methods with the same identifier ... The
   * underlying type of each variable determines which overload of `getType()`
   * the compiler will use."
   */
  protected methodOverloads: Map<string, string[]> = new Map();

  /**
   * method name → every declaration's receiver AND full signature, in file
   * order. A receiver may carry several: "User-defined methods can override and
   * overload existing built-in and user-defined methods", told apart the way
   * any overload is — by required-parameter count, then by type.
   */
  protected methodSignatures: Map<string, Array<{ receiver: string; sig: FnOverload }>> = new Map();

  /** type name → field name → the field's declared type, where one is written. */
  protected userFieldTypes: Map<string, Map<string, string>> = new Map();

  /**
   * Declared types of the names in scope while a function or method body is
   * emitted, innermost last: its parameters, then its typed or constructed
   * locals. Script-scope names come from `scopes.staticTypes`.
   */
  protected localTypes: Array<Map<string, string | null>> = [];

  /** `import … as alias` → the library path it names. */
  protected importAliases: Map<string, string> = new Map();

  /** Library path → the names that library exports. */
  protected libraryExports: Map<string, Set<string>> = new Map();

  /**
   * `<path>::<TypeName>` → that type's field names, in declaration order.
   *
   * Needed because `ml.Pair.new(1, 2)` has to map POSITIONAL arguments onto
   * fields, and the field order lives in the library rather than here.
   */
  protected libraryTypeFields: Map<string, string[]> = new Map();

  /**
   * An imported library's exported METHOD name → the alias that owns it.
   *
   * Importing a library brings its methods into scope on values of its types,
   * so `pair.total()` has to resolve even though `total` is declared in another
   * file. Without this the call fell through to `Context.builtinMethod`, which
   * correctly reported that a plain object has no built-in methods — a true
   * statement about the wrong question.
   */
  protected libraryMethods: Map<string, string> = new Map();

  /**
   * Sources for `import`, keyed by the path a script writes.
   *
   * A library lives on TradingView, and this engine cannot fetch one — so the
   * host supplies them, the same way it supplies higher-timeframe candles for
   * `security()`. An import with no source is REFUSED rather than stubbed:
   * a library that silently resolves to nothing produces a script full of `na`
   * that still runs.
   */
  protected readonly libraries: Readonly<Record<string, string>>;

  /**
   * Appended to every source location this visitor emits.
   *
   * Empty for a script, `@<alias>` for a library compiled into one. Call ids
   * key per-call-site state — `ta.sma@L12:C4` is what keeps two `ta.sma` calls
   * from sharing one rolling window — and a library's line 12 has nothing to do
   * with the importing script's. Without the tag they collide silently, and two
   * unrelated indicators quietly share a buffer.
   */
  protected readonly locationTag: string;

  /**
   * Inserted into every name this script DECLARES. Empty for a script,
   * `$lib$<alias>$` for a library compiled into one.
   *
   * ── Why the IIFE is not enough ────────────────────────────────────────────
   *
   * A library's body is wrapped in an immediately-invoked function, so its
   * `let opsv2_len` is lexically its own. That is only half the isolation: a
   * variable is also a SERIES, registered in `ctx.vars` under its emitted name,
   * and `ctx.new_var` looks that registry up BY NAME. Two scripts each
   * declaring `len` therefore shared one series — the second write overwrote
   * the first, and the library's functions, closing over their own `let`, read
   * the importing script's value.
   *
   * It was worth 220 instead of 26 in the first library this engine ran, and
   * nothing about the emitted JavaScript looked wrong.
   *
   * Built-ins are NOT scoped: `close` must stay `opsv2_close`, which is what
   * the sandbox binds. Only names the script itself binds are rewritten, so the
   * declaration and every read of it move together.
   */
  protected readonly nameScope: string;

  /** The libraries being compiled above this visitor, so an import back into one is named as a cycle. */
  protected readonly libraryChain: readonly string[];

  constructor(options: V5Options = {}) {
    super();
    this.libraries = options.libraries ?? {};
    this.editorRules = options.editorRules ?? false;
    this.locationTag = options.locationTag ?? "";
    this.nameScope = options.nameScope ?? "";
    this.libraryChain = options.libraryChain ?? [];
  }

  /**
   * The emitted name of an identifier — scoped when this script declares it.
   *
   * The single place that decision is made, so the JS binding, the series
   * registry key and every read of it can never disagree.
   */
  protected localName(text: string): string {
    return this.nameScope && this.isReceiverName(text)
      ? `${this.PREFIX}${this.nameScope}${text}`
      : `${this.PREFIX}${text}`;
  }

  protected override funcName(pineName: string): string {
    return `${this.PREFIX}${this.nameScope}$fn_${pineName}`;
  }

  protected override getLocId(ctx: SourceLocated): string {
    return super.getLocId(ctx) + this.locationTag;
  }

  /** Names this script marks `export`. Non-empty only in a library. */
  protected exportedNames: Set<string> = new Set();

  /** Does this script declare itself a library? Set at the entry point. */
  protected get declaresLibrary(): boolean {
    return this.scriptKind === "library";
  }

  /** Is this visitor compiling a library INTO another script? */
  protected get isImportedLibrary(): boolean {
    return this.nameScope !== "";
  }

  /**
   * Types and methods are collected BEFORE anything is emitted.
   *
   * Both are whole-script facts a single pass cannot have: `p.x` has to know
   * that `p` might be an object, and `r.area()` has to know that `area` is a
   * method, and either can appear above its declaration inside a function body
   * (which runs at call time, so it is not a forward reference).
   *
   * The same reasoning, and the same shape, as `collectFunctionNames` in the v1
   * base.
   */
  override visitPine_script(ctx: Pine_scriptContext): string {
    this.collectDeclarations(ctx);
    this.enforceEditorRules(ctx);
    const js = super.visitPine_script(ctx as any);
    // Last, so a script's own errors (an undeclared name, a type error) are
    // reported before this whole-script one.
    this.enforceIndicatorOutput(ctx);
    return js;
  }

  /**
   * v5 `request.*()` is static unless the declaration says
   * `dynamic_requests = true`. (v6 has its own, explicit-opt-out rule.)
   */
  private editorRules: boolean;
  private v5StaticRequests = false;

  /**
   * Whole-script rules TradingView's chart editor applies (its compile
   * endpoint does not): an `indicator()` must display something.
   */
  protected enforceEditorRules(root: any): void {
    if (!this.editorRules) return;
    if (this.version === 5) {
      this.v5StaticRequests = dynamicRequestsSetting(root) !== "true";
    }
  }

  /** An `indicator()` must display something (log.* counts: a log-only script loads). */
  protected enforceIndicatorOutput(root: any): void {
    if (!this.editorRules) return;
    if (declarationName(root) === "indicator" && !hasIndicatorOutput(root)) {
      throw this.err(
        { start: { line: 1, column: 0 } } as any,
        "An indicator must contain at least one of the following: any `plot*()` function, " +
        "`barcolor()`, `bgcolor()`, `hline()`, `alertcondition()`, or any drawing " +
        "(line, label, box, table, polyline).",
      );
    }
  }

  /** Call-site rules the chart editor applies at v5 and v6 alike. */
  protected enforceEditorCallRules(name: string, ctx: any): void {
    if (!this.editorRules) return;
    const q = this.version === 5 ? (t: string) => `\`${t}\`` : (t: string) => `"${t}"`;
    const args = ctx.fun_actual_args?.();
    const pos: any[] = args?.pos_args?.() ? this.positionalArgs(args.pos_args()) : [];
    const kw: any[] = args?.kw_args?.()?.kw_arg?.() ?? [];
    const kwValue = (n: string) => kw.find((k: any) => k.id().getText() === n)?.arith_expr?.();

    if (this.version === 5 && this.v5StaticRequests) {
      // Lexical only: TradingView accepts a call to a user function that
      // requests (Smart Money Concepts [LuxAlgo] does exactly that), and a
      // request inside a function body.
      if (name.startsWith("request.") && insideConditionalOrLoop(ctx)) {
        throw this.err(
          ctx,
          "Cannot use `request.*()` call within loops or conditional structures, " +
          "when `dynamic_requests` is `false` in the `indicator()` function.",
        );
      }
    }

    if (name === "color.new" && pos.length < 2 && !kwValue("transp")) {
      throw this.err(ctx, `No value assigned to the ${q("transp")} parameter in color.new()`);
    }

    // TradingView compiler, 2026-11-13 (v5 and v6): the `stdev_mult` overload of
    // ta.vwap(source, anchor, stdev_mult) has no default for `anchor`.
    if (name === "ta.vwap" && kwValue("stdev_mult")
        && pos.length < 2 && !kwValue("anchor")) {
      throw this.err(ctx, `No value assigned to the ${q("anchor")} parameter in ta.vwap()`);
    }

    // TradingView compiler, 2026-11-13 (v5 and v6): hline()'s `display` takes only
    // display.all / display.none.
    if (name === "hline") {
      const display = pos[6] ?? kwValue("display");
      if (display && [...display.getText().matchAll(/\bdisplay\.(\w+)/g)].some(m => m[1] !== "all" && m[1] !== "none")) {
        const qq = this.version === 5 ? "'" : '"';
        throw this.err(
          ctx,
          `Invalid argument ${qq}display${qq} in ${qq}hline${qq} call. Possible values: [display.none, display.all]`,
        );
      }
    }

    if (name === "input.string") {
      const defval = pos[0] ?? kwValue("defval");
      if (defval && isColorExpression(defval)) {
        const qq = this.version === 5 ? "'" : '"';
        const text = unwrap(defval).getText();
        throw this.err(
          ctx,
          `Cannot call ${qq}input.string${qq} with argument ${qq}defval${qq}=${qq}${text}${qq}. ` +
          `An argument of ${qq}const color${qq} type was used but a ${qq}const string${qq} is expected.`,
        );
      }
    }
  }

  /** Walks the whole tree for `type` and `method` declarations. */
  protected collectDeclarations(root: any): void {
    const walk = (n: any, inMethod = false): void => {
      if (!n) return;
      if (isRule(n, "Type_def_stmtContext")) {
        this.userTypes.set(n.id().getText(), this.fieldsOf(n));
        const fieldTypes = new Map<string, string>();
        for (const f of n.type_body().type_field()) {
          const t = f.field_type?.()?.getText();
          if (t) fieldTypes.set(f.id().getText(), t);
        }
        this.userFieldTypes.set(n.id().getText(), fieldTypes);
      }
      if (isRule(n, "Enum_def_stmtContext")) {
        this.userEnums.set(n.id().getText(), this.enumFieldsOf(n));
      }
      // A FUNCTION declared more than once is an overload set. Collected in
      // the same pass, and skipped inside a method declaration — a method's
      // overloads are told apart by their receiver, which is a different rule
      // handled by `methodOverloads` just below.
      if (isRule(n, "Fun_def_stmtContext") && !inMethod) {
        const inner = (n as Fun_def_stmtContext).fun_def_singleline()
          ?? (n as Fun_def_stmtContext).fun_def_multiline();
        if (inner) {
          const list = this.functionOverloads.get(inner.id().getText()) ?? [];
          list.push(this.overloadOf(inner));
          this.functionOverloads.set(inner.id().getText(), list);
        }
      }

      if (isRule(n, "Method_def_stmtContext")) {
        const def = n.fun_def_stmt();
        const inner = def.fun_def_singleline() ?? def.fun_def_multiline();
        if (inner) {
          const name = inner.id().getText();
          this.userMethods.add(name);
          // Collected HERE rather than at the definition, because Pine permits
          // forward references: `a.getType()` may appear above the overload it
          // resolves to, and the call site has to know the whole set.
          const overloads = this.methodOverloads.get(name) ?? [];
          overloads.push(this.receiverTypeOf(inner));
          this.methodOverloads.set(name, overloads);
          const sigs = this.methodSignatures.get(name) ?? [];
          sigs.push({ receiver: this.receiverTypeOf(inner), sig: this.overloadOf(inner) });
          this.methodSignatures.set(name, sigs);
        }
      }
      const count = n.getChildCount?.() ?? 0;
      const nested = inMethod || isRule(n, "Method_def_stmtContext");
      for (let i = 0; i < count; i++) walk(n.getChild(i), nested);
    };
    walk(root);
  }

  /** A type declaration's fields, in declaration order. */
  protected fieldsOf(ctx: Type_def_stmtContext): TypeField[] {
    return ctx.type_body().type_field().map(f => ({
      // Read raw: a field lives in its own namespace, so it is neither a
      // reserved word nor a renamed built-in, and running the identifier
      // guards over it would reject `type Box\n    string text`.
      name: f.id().getText(),
      // Pine gives an undeclared field `na`, and `na` is NaN here.
      defaultExpr: f.arith_expr() ?? null,
    }));
  }

  /**
   * Is `root` a variable or parameter bound in a scope that contains this
   * call? A local or parameter counts inside its own span; a script-scope
   * binding (recorded with a null span) counts everywhere, which is safe
   * because the caller asks only for a name the namespace does not define,
   * and the namespace path would fail on it anyway. A namespace is never
   * shadowed by a name this script does not actually declare.
   */
  protected shadowsNamespace(root: string, ctx: any): boolean {
    const scopes = this.scopes.scopesOf?.get(root);
    if (!scopes?.length || !this.scopes.bound.has(root)) return false;
    const at = ctx?.start?.tokenIndex;
    if (typeof at !== "number") return false;
    return scopes.some(s => s === null || (at >= s.start && at <= s.stop));
  }

  /** Is `name` something this script binds — and therefore a possible receiver? */
  protected isReceiverName(name: string): boolean {
    return this.scopes.bound.has(name) || this.scopes.declared.has(name);
  }

  // ── The §4a/§4b/§4c name changes ──────────────────────────────────────────

  /**
   * Rejects a v1–v4 spelling with the name — or the construct — that replaced it.
   *
   * Hooked on identifiers and calls rather than driven off the registry,
   * because a missing registry entry is not by itself an error: `visitId` emits
   * any identifier it does not recognise, since most identifiers are the
   * script's own variables. So `sma` at v5 would just emit `opsv2_sma` and read
   * as `undefined` — an indicator that is silently `na` on a chart that still
   * draws.
   */
  protected enforceRenamedInV5(name: string, ctx: SourceLocated): void {
    // A script may still BIND the old word as its own variable — `sum = 0.0` is
    // legal v5, the built-in is simply gone. Only an unbound reference is the
    // migration error. (`sum` is not a v5 RESERVED word; that is a separate
    // rule, checked separately.)
    if (this.scopes.declared.has(name) || this.scopes.bound.has(name)) return;

    const rewrite = REWRITTEN.get(name);
    if (rewrite) {
      throw this.err(ctx, `'${name}' was removed in Pine Script v5 — ${rewrite}.`);
    }

    const replacement = REPLACEMENT.get(name);
    if (replacement) {
      throw this.err(ctx, `'${name}' was renamed to '${replacement}' in Pine Script v5.`);
    }
  }

  /** Rejects a declaration or reference that names one of v5's reserved words. */
  protected enforceNotReserved(name: string, ctx: SourceLocated): void {
    if (!RESERVED.has(name)) return;
    throw this.err(
      ctx,
      `'${name}' is a reserved word in Pine Script v${this.version} and cannot be used as an ` +
      `identifier.`,
    );
  }

  /**
   * Rejects a v5 feature this engine does not implement, by name.
   *
   * Reported as "not implemented" rather than as a Pine error, because it is
   * not one: TradingView accepts all four. Saying so is the difference between
   * an author knowing to rewrite the script and an author hunting for a typo.
   * The message reaches the script's author, so it names no repository path;
   * the known gaps are in docs/common/VERSIONS.md §7.
   */
  protected enforceSupported(name: string, ctx: SourceLocated): void {
    const feature = UNSUPPORTED.get(name);
    if (!feature) return;
    throw this.err(
      ctx,
      `'${name}' introduces ${feature}, which this engine does not implement ` +
      `at v5. Rewrite the script without it.`,
    );
  }

  override visitId(ctx: IdContext): string {
    const text = ctx.getText();

    // A keyword argument's key is the callee's parameter name, not a name this
    // script is using — the naming rules do not apply to it, and it is instead
    // where the §4b parameter renames are translated.
    if (isKeywordArgumentName(ctx)) {
      const runtimeName = this.keywordAliasFor(text);
      if (runtimeName) return `${this.PREFIX}${runtimeName}`;
    } else {
      if (!text.includes(".")) {
        this.enforceSupported(text, ctx);
        this.enforceNotReserved(text, ctx);
      }
      this.enforceRenamedInV5(text, ctx);
    }

    // A dotted name whose root is a VARIABLE is a field access, not a
    // namespace member. This is what UDTs need, and it is also the branch the
    // inherited code cannot take: `visitId` in the v1 base rejects any dotted
    // name whose root is not a known namespace, because before v5 there was no
    // other thing a dotted name could be.
    const fieldRead = this.emitFieldChain(text);
    if (fieldRead) return fieldRead;

    // A name this script DECLARES, inside a library, is emitted scoped. The
    // inherited path would prefix it plainly and collide with the importing
    // script — see `nameScope`. Returning early is safe: a script-bound name
    // is not a registry getter, and the namespace check does not apply to an
    // undotted name.
    //
    // Only where the binding is IN SCOPE. `isReceiverName` is a flat set, so a
    // parameter called `high` in one function made the bare `high` of every
    // other function a read of a variable that was never declared there.
    if (this.nameScope && !text.includes(".") && this.isReceiverName(text)
        && this.visibleAt(text, ctx as any)) {
      return this.localName(text);
    }

    // v4's gate runs next, and is kept rather than bypassed: `red` really was
    // renamed at v4, and v5 inherits that. Its message names v4 while the error
    // prefix names v5, which is the accurate reading — "you are on v5, and this
    // stopped being spellable at v4".
    return super.visitId(ctx as any);
  }

  /**
   * `p.x`, `p.inner.x` → nested `ctx.field` reads, or null if `text` is not a
   * field access at all.
   *
   * A namespace ALWAYS wins. `strategy.long` stays a namespace member even in a
   * script that happens to bind a variable called `strategy`, because Pine
   * would reject that script and reading it the other way would silently give
   * `na` instead.
   */
  protected emitFieldChain(text: string): string | null {
    const dot = text.indexOf(".");
    if (dot <= 0) return null;

    const root = text.slice(0, dot);

    // `OscType.rsi` — an ENUM MEMBER, resolved before anything else.
    //
    // Before receivers, because an enum name is not a variable this script
    // binds and `isReceiverName` would refuse it; before namespaces, because a
    // script may legally name an enum after one (TradingView's own example
    // declares `enum syminfo`), and its own declaration wins.
    if (this.userEnums.has(root)) {
      const field = text.slice(dot + 1);
      const declared = this.userEnums.get(root)!;
      if (!declared.some(f => f.name === field)) {
        throw new Error(
          `'${root}' has no member '${field}'. It declares: ` +
          `${declared.map(f => f.name).join(", ")}.`,
        );
      }
      return `${this.enumFactory(root)}[${JSON.stringify(field)}]`;
    }

    if (this.namespaceRoots.has(root)) return null;

    if (this.importAliases.has(root)) {
      // `Signal.State.long` — an enum the imported library exports. The member
      // list came back with the library, so a typo is caught here rather than
      // reading `undefined` off the namespace object.
      const rest = text.slice(dot + 1);
      const inner = rest.indexOf(".");
      if (inner > 0) {
        const enumName = rest.slice(0, inner);
        const fields = this.libraryEnums.get(`${root}.${enumName}`);
        if (fields) {
          const field = rest.slice(inner + 1);
          if (!fields.includes(field)) {
            throw new Error(
              `'${root}.${enumName}' has no member '${field}'. It declares: ` +
              `${fields.join(", ")}.`,
            );
          }
          return `${this.libraryNamespace(root)}[${JSON.stringify(enumName)}]` +
                 `[${JSON.stringify(field)}]`;
        }
      }
      return null;
    }

    if (!this.isReceiverName(root)) return null;

    let js = this.localName(root);
    for (const part of text.slice(dot + 1).split(".")) {
      js = `ctx.field(${js}, ${JSON.stringify(part)})`;
    }
    return js;
  }

  /**
   * `p.x := expr` — a field WRITE, and `p.x += expr` with it.
   *
   * Not routed through the inherited `visitVar_assign`: that emits
   * `<name> = ctx.new_var(…)`, and the name it would build here is a
   * `ctx.field(…)` read, which is not assignable. The declared-before-assigned
   * guard is skipped too, deliberately — a field is not a script-scope
   * variable, and `p.x` is declared by `type Point`, not by an `=` statement.
   */
  override visitVar_assign(ctx: Var_assignContext): string {
    const text = ctx.id().getText();
    const dot = text.indexOf(".");

    const isFieldWrite = dot > 0
      && !this.namespaceRoots.has(text.slice(0, dot))
      && !this.importAliases.has(text.slice(0, dot))
      && this.isReceiverName(text.slice(0, dot));

    if (!isFieldWrite) return super.visitVar_assign(ctx as any);

    const parts = text.split(".");
    let target = this.localName(parts[0]);
    for (let i = 1; i < parts.length - 1; i++) {
      target = `ctx.field(${target}, ${JSON.stringify(parts[i])})`;
    }
    const field = parts[parts.length - 1];

    // `p.x += 1` reads the field, applies the operator, and writes it back.
    // Without this the operator would be dropped silently and the field would
    // simply take the right-hand side — `p.x += 1` becoming `p.x := 1`.
    const op = this.compoundOperatorOf(ctx as any);
    const value = this.visit(ctx.arith_expr());
    const next = op
      ? this.compoundValue(op, `ctx.field(${target}, ${JSON.stringify(field)})`, value)
      : value;

    return `ctx.setField(${target}, ${JSON.stringify(field)}, ${next})`;
  }

  /**
   * The tuple form, `[a, b, c] = ta.bb(...)`.
   *
   * Overridden only to get the diagnostic right. The inherited implementation
   * finds the callee and — when the name is absent from this version's registry
   * but present in the runtime union — reports "added in a later version",
   * which is exactly backwards for `[a, b, c] = bb(close, 20, 2)` at v5.
   */
  override visitVar_defs(ctx: Var_defsContext): string {
    const callee = this.firstCallee(ctx.arith_expr());
    if (callee) this.enforceRenamedInV5(callee, ctx);
    // Destructured locals shadow globals of their names, as visitVar_def's do.
    const scope = this.localTypes[this.localTypes.length - 1];
    if (scope) for (const id of ctx.ids_array().id()) scope.set(id.getText(), null);
    return super.visitVar_defs(ctx as any);
  }

  /** The name of the first function CALL in a subtree, if there is one. */
  private firstCallee(node: ParseTree | null): string | null {
    if (!node) return null;
    if (isRule(node, "Fun_callContext")) return (node as any).id().getText();
    const count = (node as any).getChildCount?.() ?? 0;
    for (let i = 0; i < count; i++) {
      const found = this.firstCallee((node as any).getChild(i));
      if (found) return found;
    }
    return null;
  }

  // ── Directives ────────────────────────────────────────────────────────────

  /**
   * v5 renames `study()` to `indicator()`, keeps `strategy()`, and adds
   * `library()` — a script that declares functions for others to import and
   * plots nothing itself.
   */
  protected override detectDirective(
    node: ParseTree,
  ): 'indicator' | 'strategy' | 'library' | undefined {
    if (isRule(node, "Fun_callContext")) {
      const name = (node as any).id().getText();
      if (name === "indicator" || name === "strategy" || name === "library") return name;
    }
    const count = node.getChildCount();
    for (let i = 0; i < count; i++) {
      const child = node.getChild(i);
      if (child) {
        const found = this.detectDirective(child);
        if (found) return found;
      }
    }
    return undefined;
  }

  /**
   * An `indicator()` script is in indicator mode, so `strategy.*` is fatal —
   * the same rule the base applies to `study()`, under v5's spelling of it.
   *
   * A LIBRARY is not refused. The manual's Libraries page restricts what an
   * exported function may use (no non-const globals, no `input.*()`) and says
   * nothing against `strategy.*`, and published libraries call it —
   * `strategy.position_size`, `strategy.closedtrades`, `strategy.entry` — to
   * be imported by strategies, whose broker they then read.
   */
  protected override enforceStrategyContext(name: string, ctx: SourceLocated): void {
    if (this.scriptKind === 'indicator') {
      throw this.err(
        ctx,
        `'${name}' is unavailable in an indicator() script ` +
        `(indicator mode). Declare strategy(...) to use the broker emulator.`,
      );
    }
    if (this.scriptKind === 'library') return;
    super.enforceStrategyContext(name, ctx);
  }

  /**
   * A call to a function's own NAME is recursion only when it can reach this
   * definition. The manual forbids recursion ("cannot contain calls to
   * themselves within their bodies") but allows overloads, and an overload
   * calling its sibling is the documented way to share code:
   *
   *     export getHexString(series float r, series float g, series float b, series float t = 0.0) => …
   *     export getHexString(series color source) =>
   *         getHexString(color.r(source), color.g(source), color.b(source), color.t(source))
   *
   * So a call counts only when its argument count fits this definition and no
   * sibling overload's — `f(int x) => f(x)` beside `f(float x, int y)` still
   * calls itself, and would overflow the stack. Siblings of the same arity are
   * told apart by type, which is not known here, so they are let through. A
   * method `alert(string message, string key)` that calls the built-in
   * `alert(message)` does not call itself either.
   */
  protected override enforceNoRecursion(name: string, body: ParseTree, ctx: SourceLocated): void {
    const functions = this.functionOverloads.get(name) ?? [];
    const methods = this.methodOverloads.get(name) ?? [];
    // A method named like a built-in function — `method alert(string message,
    // string key)` — calls that built-in with a plain `alert(…)`.
    if (methods.length > 0 && name in this.registry) return;
    const own = this.overloadOf(ctx as any);
    const key = (o: FnOverload) => JSON.stringify([o.min, o.max, o.types]);
    const siblings = [...functions, ...(this.methodSignatures.get(name) ?? []).map(m => m.sig)]
      .filter(o => key(o) !== key(own));
    const fits = (o: FnOverload, count: number) => count >= o.min && count <= o.max;
    const reaches = (node: ParseTree): boolean => {
      if (isRule(node, "Fun_callContext") && (node as any).id().getText() === name) {
        const args = (node as any).fun_actual_args?.();
        const positional = args?.pos_args?.() ? this.positionalArgs(args.pos_args()!) : [];
        const count = positional.length + (args?.kw_args?.()?.kw_arg?.() ?? []).length;
        if (fits(own, count) && !siblings.some(o => fits(o, count))) return true;
      }
      for (let i = 0; i < node.getChildCount(); i++) {
        const child = node.getChild(i);
        if (child && reaches(child)) return true;
      }
      return false;
    };
    if (reaches(body)) {
      throw this.err(ctx, `recursion is not allowed; function '${name}' refers to itself.`);
    }
  }

  // ── Calls ─────────────────────────────────────────────────────────────────

  override visitFun_call(ctx: Fun_callContext): string {
    return this.emitCallChain(this.emitBaseCall(ctx), ctx);
  }

  /** The call itself, before any `.method()` chained onto its result. */
  protected emitBaseCall(ctx: Fun_callContext): string {
    const name = ctx.id().getText();

    // The directive is intercepted before anything else, exactly as the base
    // intercepts study()/strategy(): it is a metadata declaration, not a call.
    if (name === "indicator" || name === "library") {
      // A library compiled AS A DEPENDENCY declares nothing. Its `library(…)`
      // call would otherwise run inside the importing script's per-bar body and
      // overwrite `ctx.scriptMeta`, so a chart importing a library reported
      // itself as one — the last directive to run wins, and the library's runs
      // second.
      //
      // Compiled on its own, a library still declares itself: that is how a
      // host tells a library from an indicator before trying to render it.
      if (name === "library" && this.isImportedLibrary) return "";
      return this.withCallee(name, () => this.emitDirective(name, ctx as any));
    }

    // `study(...)` at v5 reaches here as an ordinary call, since the base only
    // intercepts it by name. The rename gate is what turns it into a migration
    // message rather than "opsv2_study is not a function".
    this.enforceRenamedInV5(name, ctx);
    this.enforceEditorCallRules(name, ctx);

    // Both members of the security family defer their `expression`: it is
    // evaluated in the REQUESTED context, not this one, so it has to reach the
    // runtime as a thunk rather than as a value computed on the chart bar.
    if (name === "request.security" || name === "request.security_lower_tf") {
      return this.withCallee(name, () => this.emitSecurity(ctx as any));
    }

    if (name === "strategy.exit") this.enforceExitCondition(ctx);
    if (name.startsWith("strategy.")) this.enforceWhenIsBool(name, ctx);

    const typed = this.emitTypedConstructor(name, ctx);
    if (typed !== null) return typed;

    const dotted = this.emitDottedCall(name, ctx);
    if (dotted !== null) return dotted;

    return this.withCallee(name, () => super.visitFun_call(ctx as any));
  }

  /**
   * The LAST link of a chain is what a destructuring unpacks.
   *
   *     [sampleMean, highBand, lowBand] =
   *         sourceArray.maintainQueue(sourceInput, newSample).calcBB(multiplier, newSample)
   *
   * `maintainQueue` returns the array; `calcBB` returns "a tuple containing the
   * basis, upper band, and lower band respectively". The base reads the call's
   * own `id`, which here is the receiver plus the FIRST method — so the arity
   * check asked `maintainQueue` and was told, correctly, that it returns no
   * tuple.
   *
   * A trailing FIELD suffix is not a callee, so it is skipped: `f().x` unpacks
   * nothing, and naming `x` would produce a message about a function that does
   * not exist.
   */
  /**
   * v5 widens where a `[a, b] = …` may take its values from:
   *
   *   - an `if` or `switch` whose branches end in tuples (manual: "If the
   *     final statement is a conditional structure … the function returns that
   *     structure's result", and the same holds for a declaration);
   *   - a METHOD call — `[lv, t] = this.eventHorizon(close)` — and a library
   *     function, whose definitions this script cannot see;
   *   - a function ending in a call or a `switch`, whose width is not written;
   *   - `ta.vwap(source, anchor, stdev_mult)`, which "will calculate the
   *     standard deviation bands … and return a [vwap, upper_band,
   *     lower_band] tuple".
   *
   * It still refuses what it can prove wrong: a built-in that returns one
   * value, a width that disagrees with the definition's, and a function every
   * one of whose exits is plainly a single value.
   */
  protected override checkTupleSource(ctx: any, ids: string[]): void {
    const arith: any = ctx.arith_expr();
    const conditional = arith?.if_expr?.() ?? arith?.switch_expr?.();
    if (conditional) {
      // Every branch must end in a tuple of the declared width; one whose
      // width is plain from the source and differs is the script's error.
      const wrong = branchTupleWidths(conditional).find(w => w !== null && w !== ids.length);
      if (wrong !== undefined) {
        throw this.err(ctx, `A branch returns ${wrong} value${wrong === 1 ? "" : "s"}, but you provided ${ids.length} variables.`);
      }
      return;
    }

    const call = this.firstCallOf(arith);
    if (!call) return super.checkTupleSource(ctx as any, ids);

    let name = this.destructuringCallee(call);
    // `request.security(sym, tf, f())`: the width is f's, and f — a user or
    // library function, a method — may not write it down.
    if (/^(request\.)?security$/.test(name)) {
      const args = call.fun_actual_args();
      const positional = args?.pos_args() ? this.positionalArgs(args.pos_args() as any) : [];
      const keyword = (args?.kw_args()?.kw_arg() ?? []).find(k => k.id().getText() === "expression");
      const expression: any = keyword ? keyword.arith_expr?.() : positional[2];
      const inner = expression ? this.firstCallOf(expression) : null;
      if (inner && this.tupleArityFromArgument(call as any) === null) {
        // Unless it is this script's own function, whose every exit is plainly
        // one value — then there is nothing to unpack, as before.
        const innerName = this.destructuringCallee(inner);
        const own = !innerName.includes(".") && this.scopes.functions?.has(innerName);
        if (!own || this.scopes.mayReturnTuple?.has(innerName)) return;
      }
    }
    if (name === "ta.vwap" || name === "vwap") {
      const args = call.fun_actual_args();
      const kw = (args?.kw_args()?.kw_arg() ?? []).map(k => k.id().getText());
      const given = this.argumentCount(args ?? null);
      if (given >= 3 || kw.includes("stdev_mult")) {
        if (ids.length !== 3) {
          throw this.err(ctx, `'ta.vwap' returns 3 values, but you provided ${ids.length} variables.`);
        }
        return;
      }
    }
    if (name.includes(".") && !(name in this.registry)) {
      const head = name.slice(0, name.indexOf("."));
      // A library's function: its body is in another script.
      if (this.importAliases.has(head)) return;
      // A method call: the method's name is the last part.
      name = name.slice(name.lastIndexOf(".") + 1);
      if (!this.userMethods.has(name) && !this.scopes.tupleArity?.has(name)) return;
    }
    const arity = this.scopes.tupleArity?.get(name);
    if (arity === undefined && this.scopes.mayReturnTuple?.has(name)) return;
    // Overloads may return tuples of different widths; which one this call
    // reaches is settled by its arguments, not by the name.
    if ((this.functionOverloads.get(name)?.length ?? 0) + (this.methodSignatures.get(name)?.length ?? 0) > 1) return;
    if (arity !== undefined && !(name in this.registry)) {
      if (arity !== ids.length) {
        throw this.err(ctx, `'${name}' returns ${arity} values, but you provided ${ids.length} variables.`);
      }
      return;
    }
    return super.checkTupleSource(ctx as any, ids);
  }

  /**
   * v5's declaration rule reads the initialiser the way the language does:
   *
   *   - `x = arr.last().x` and `float y = verts.get(i).y` read a FIELD called
   *     `x`/`y` off a value. A field after a dot is not the variable.
   *   - `result = if cond` + a branch that declares its own `result` reads
   *     that branch's local, not the one being declared.
   */
  protected override enforceNoSelfReference(name: string, value: ParseTree, ctx: SourceLocated): void {
    const reads = (node: any): boolean => {
      if (!node) return false;
      if (isRule(node, "Call_suffixContext")) {
        const args = node.fun_actual_args?.();
        return args ? reads(args) : false;
      }
      if (isRule(node, "IdContext")) {
        // A dotted id: only its FIRST part names a variable, and only when
        // that part is not a namespace, type, enum or library — in
        // `position = position.middle_center` the variable does not exist yet,
        // so the dotted name is the namespace's.
        const text = node.getText();
        if (text.includes(".") && this.isQualifierRoot(text.split(".")[0])) return false;
        return text.split(".")[0] === name && !isRule(node.parent, "Kw_argContext");
      }
      if (isRule(node, "Fun_callContext")) {
        // The callee is a function name, in its own namespace; its arguments
        // and any suffixes' arguments are read.
        const args = node.fun_actual_args?.();
        const callee = node.id?.()?.getText?.() ?? "";
        const receiverRead = callee.includes(".") && callee.split(".")[0] === name
          && !this.isQualifierRoot(name);
        return receiverRead || (args ? reads(args) : false)
          || (node.call_suffix?.() ?? []).some((s: any) => reads(s));
      }
      if (isRule(node, "Local_stmts_multilineContext")) {
        const declares = (node.local_stmts_list?.()?.local_stmt_multiline?.() ?? [])
          .some((l: any) => (l.local_stmt_content?.() ?? []).some((c: any) => c.var_def?.()?.id?.()?.getText?.() === name));
        if (declares) return false;
      }
      for (let i = 0; i < (node.getChildCount?.() ?? 0); i++) if (reads(node.getChild(i))) return true;
      return false;
    };
    if (!reads(value)) return;
    throw this.err(
      ctx,
      `'${name}' cannot reference itself in its own declaration. Declare it ` +
      `first (e.g. '${name} = 0.0'), then assign with ':='.`,
    );
  }

  /** Is `root` a namespace, user type, enum or library alias — a qualifier, not a variable? */
  protected isQualifierRoot(root: string): boolean {
    return this.namespaceRoots.has(root) || this.userTypes.has(root)
      || this.userEnums.has(root) || this.importAliases.has(root);
  }

  /**
   * `(expr).field` and `(expr).method()` — see `atom` in PineV5Parser.g4.
   * The receiver is a value, so it folds through the same `emitChainedMethod`
   * a call's result does.
   */
  override visitAtom(ctx: any): string {
    const suffixes = ctx.call_suffix?.() ?? [];
    if (suffixes.length === 0) return super.visitAtom(ctx);
    let js = ctx.LPAR?.() ? `(${this.visit(ctx.arith_expr())})` : `(${this.visit(ctx.literal())})`;
    // A literal's type is plain from its text; a parenthesised value's is not.
    let type = ctx.LPAR?.() ? null : this.argumentType(ctx.literal());
    for (const suffix of suffixes) {
      js = this.emitChainedMethod(js, suffix, type);
      type = null;
    }
    return js;
  }

  /** The first call in an expression, the way the base check finds it. */
  private firstCallOf(node: any): Fun_callContext | null {
    if (!node) return null;
    if (isRule(node, "Fun_callContext")) return node;
    for (let i = 0; i < (node.getChildCount?.() ?? 0); i++) {
      const found = this.firstCallOf(node.getChild(i));
      if (found) return found;
    }
    return null;
  }

  protected override destructuringCallee(call: Fun_callContext): string {
    const suffixes = ((call as any).call_suffix?.() ?? []) as Call_suffixContext[];
    for (let i = suffixes.length - 1; i >= 0; i--) {
      if (suffixes[i].LPAR()) return suffixes[i].id().getText().split(".").pop()!;
    }
    return super.destructuringCallee(call as any);
  }

  /**
   * `a.f().g()` — the chained method calls hanging off a call's result.
   *
   * Folded here rather than inside each emit path, because every one of them
   * returns a VALUE and the chain applies to the value, whatever produced it:
   * a built-in call, a method call, a UDT constructor, a library function.
   *
   * The receiver of a chained call is an expression, so it cannot go through
   * `emitMethodCall`, which resolves a receiver NAME to a local. Dispatch is
   * otherwise identical, and `Context.builtinMethod` was already receiving a
   * value rather than a name.
   */
  protected emitCallChain(base: string, ctx: Fun_callContext): string {
    let js = base;
    // The base call's type, where its text states one — `B.new(…)`,
    // `array.new<float>(…)`, `xs.copy()` — so the first link's method is
    // resolved by receiver like a named one. Later links' are not known.
    let type = this.typeOfInitialiser(ctx);
    for (const suffix of (ctx as any).call_suffix?.() ?? []) {
      js = this.emitChainedMethod(js, suffix as Call_suffixContext, type);
      type = null;
    }
    return js;
  }


  /** One `.method(args)` — or `.field` — applied to an already-emitted receiver. */
  protected emitChainedMethod(receiver: string, ctx: Call_suffixContext, receiverType: string | null = null): string {
    // `getText()`, not `visit`: this is a METHOD NAME, and visiting it as an
    // identifier would run it through the undeclared-identifier guard and the
    // rename table, neither of which is about a method.
    // A suffix's name may be DOTTED, because `id` is greedy inside this rule
    // too: `.inner.x` and `.xs.size()` both arrive as one id. Every part but
    // the last is a FIELD read, folded left to right exactly as
    // `emitFieldChain` folds a named receiver's.
    //
    // No parentheses means the last part is a field as well:
    //
    //     plot(m.get(0, 0).value, linewidth = 3)
    //
    // "matrix.get() returns a reference to an object rather than a copy", so
    // `.value` reads through the same accessor.
    const parts = ctx.id().getText().split(".");
    const method = ctx.LPAR() ? parts.pop()! : "";
    const field = (js: string, part: string) => `ctx.field(${js}, ${JSON.stringify(part)})`;
    receiver = parts.reduce(field, receiver);
    // Each field read follows its declared type, as typeOfPath does.
    for (const part of parts) {
      receiverType = receiverType === null ? null
        : this.userFieldTypes.get(normaliseType(receiverType))?.get(part) ?? null;
    }
    if (!method) return receiver;

    const args = this.withCallee(
      method,
      () => (ctx.fun_actual_args() ? this.visit(ctx.fun_actual_args()!) : ""),
    );
    const tail = args ? `, ${args}` : "";
    const at = this.getLocId(ctx as SourceLocated);

    if (this.userMethods.has(method)) {
      // The receiver here is a VALUE — the previous link's result — and not a
      // name. Its type is known only where the caller could read it off the
      // source; otherwise the dispatcher decides at run time.
      const count = this.argumentCount(ctx.fun_actual_args?.() ?? null);
      const overload = this.resolveOverload(method, receiverType, ctx as SourceLocated, count);
      // A receiver type no declaration takes: the library's or built-in method.
      if (overload !== LIBRARY_METHOD) return this.emitUserChainedCall(overload, method, at, receiver, tail);
    }

    const owner = this.libraryMethods.get(method);
    if (owner !== undefined) {
      const fn = `${this.libraryNamespace(owner)}[${JSON.stringify(method)}]`;
      return `ctx.call("${method}${at}", ${fn}, ${receiver}${tail})`;
    }

    return `ctx.builtinMethod("${at}", ${receiver}, ${JSON.stringify(method)}${tail})`;
  }

  /** A chained call to a user method, `overload` or the plain name. */
  private emitUserChainedCall(overload: string | null, method: string, at: string, receiver: string, tail: string): string {
    const fn = overload ?? this.funcName(method);
    // The call id carries the EMITTED name, not the Pine one.
    //
    // `Context.call` reads the id to find the callee's registry entry, and
    // that entry decides whether a Context is injected as the first argument
    // and how keyword arguments map onto parameters. A user method whose name
    // a built-in also spells — `fill` is both `method fill(array<float> …)`
    // and Pine's plot-filling function — was handed the BUILT-IN's metadata,
    // so its receiver arrived as the Context. TradingView's own method-
    // chaining example, `srcArray.copy().fill(1.0, 0.0, min, val).avg()`, is
    // exactly that collision. The emitted name is `opsv2_$fn_fill`, which no
    // registry key can equal.
    return `ctx.call("${fn}${at}", ${fn}, ${receiver}${tail})`;
  }

  /**
   * A dotted callee whose root is NOT a built-in namespace.
   *
   * Three things can be, and they are checked in this order:
   *
   *   Point.new(…)   a user type's constructor
   *   lib.f(…)       a function from an imported library
   *   p.area(…)      a method call, on a user type or on a built-in collection
   *
   * Returns null when none applies, so the caller falls through to the ordinary
   * namespace path. A real namespace always wins — see `emitFieldChain`.
   */
  protected emitDottedCall(name: string, ctx: Fun_callContext): string | null {
    const dot = name.indexOf(".");
    if (dot <= 0) return null;

    const root = name.slice(0, dot);
    const tail = name.slice(dot + 1);

    if (this.userTypes.has(root)) return this.emitTypeCall(root, tail, ctx);

    // `Weekday.MONDAY.to_int()` — a method called on an enum MEMBER.
    const enumFields = this.userEnums.get(root);
    if (enumFields && tail.includes(".")) {
      const member = tail.slice(0, tail.indexOf("."));
      if (enumFields.some(f => f.name === member)) {
        const method = tail.slice(member.length + 1);
        return this.emitValueMethodCall(
          `${this.enumFactory(root)}[${JSON.stringify(member)}]`, root, method, ctx);
      }
    }

    const library = this.importAliases.get(root);
    // An alias may be spelled like a built-in namespace (`import
    // TradingView/ta/10 as ta`), and the library's own exports are then added
    // to that namespace, not substituted for it: `ta.sma` is still the
    // built-in when the library exports no `sma`. Published libraries do this,
    // and they compile on TradingView.
    if (library !== undefined
        && !(this.namespaceRoots.has(root) && name in this.registry
             && !this.libraryExports.get(library)?.has(tail))) {
      return this.emitLibraryCall(root, library, tail, ctx);
    }

    // A variable the script binds, visible here, shadows a built-in namespace
    // of the same name: `shape = str.split(…)` then `shape.get(0)`, and a
    // parameter `DateFormat format` then `format.tostring()`, are published
    // library code. Only for a name the namespace does not itself define.
    if (this.namespaceRoots.has(root) && !(name in this.registry) && this.shadowsNamespace(root, ctx)) {
      return this.emitMethodCall(root, tail, ctx);
    }
    if (this.namespaceRoots.has(root)) return this.emitNamespaceValueMethod(name, ctx);
    if (!this.isReceiverName(root)) return null;

    return this.emitMethodCall(root, tail, ctx);
  }

  /**
   * `label.all.size()` — a method called on a namespace member's VALUE.
   *
   * `id` is greedy, so the whole of `label.all.size` arrives as one dotted
   * name and the ordinary namespace path asks the registry for a function of
   * that name. There is none: `label.all` is an ARRAY, and `size` is a method
   * on it.
   *
   * So the longest registry-known PREFIX is taken as the receiver and whatever
   * follows is applied to it — the same split `emitChainedMethod` performs on a
   * dotted call suffix, arrived at from the other side. Returns null when no
   * prefix resolves, which leaves the existing "has no member" diagnostic to
   * report the name the script actually wrote.
   */
  protected emitNamespaceValueMethod(name: string, ctx: Fun_callContext): string | null {
    if (this.registry[name]) return null;   // an ordinary namespace function

    const parts = name.split(".");
    for (let take = parts.length - 1; take >= 2; take--) {
      const receiver = parts.slice(0, take).join(".");
      const entry = this.registry[receiver];
      if (!entry) continue;

      // The receiver is emitted the way any read of it would be — a getter has
      // to be CALLED, or the method lands on the function object instead of on
      // the array it returns.
      const at = this.getLocId(ctx as SourceLocated);
      const read = entry.is_getter
        ? `ctx.call("${receiver}${at}", ${this.namespacedName(receiver)})`
        : this.namespacedName(receiver);

      const method = parts[take];
      const rest = parts.slice(take + 1);
      const args = this.withCallee(
        method,
        () => (ctx.fun_actual_args() ? this.visit(ctx.fun_actual_args()!) : ""),
      );
      const tail = args ? `, ${args}` : "";

      // Any parts between the receiver and the method are field reads.
      const target = rest.length
        ? rest.reduce((js, part) => `ctx.field(${js}, ${JSON.stringify(part)})`, read)
        : read;
      return `ctx.builtinMethod("${at}", ${target}, ${JSON.stringify(method)}${tail})`;
    }
    return null;
  }

  /** `label.all` → `opsv2_label.opsv2_all`, the way visitId prefixes a dotted read. */
  protected namespacedName(dotted: string): string {
    return dotted.split(".").map(p => `${this.PREFIX}${p}`).join(".");
  }

  /** `Point.new(…)` and `Point.copy(p)` — the two calls a TYPE answers. */
  protected emitTypeCall(typeName: string, member: string, ctx: Fun_callContext): string | null {
    if (member === "copy") {
      const pos = ctx.fun_actual_args()?.pos_args();
      const target = pos ? this.positionalArgs(pos)[0] : undefined;
      if (!target) throw this.err(ctx, `'${typeName}.copy' needs the object to copy.`);
      return `ctx.copyObject(${this.visit(target)})`;
    }
    if (member !== "new") {
      throw this.err(
        ctx,
        `'${typeName}' is a type; it has no '${member}'. A type answers only ` +
        `'${typeName}.new(…)' and '${typeName}.copy(obj)'.`,
      );
    }

    const fields = this.userTypes.get(typeName)!.map(f => f.name);
    const assigned = this.constructorFields(typeName, fields, ctx);
    const entries = [...assigned].map(([f, v]) => `${JSON.stringify(f)}: ${v}`);
    return `${this.typeFactory(typeName)}({${entries.join(", ")}})`;
  }

  /**
   * Maps a `Type.new(…)` argument list onto field names.
   *
   * Positional arguments take fields in declaration order; keyword arguments
   * name them. Both are checked, because neither mistake is visible at run
   * time: an unknown field name would just add a property nothing reads, and a
   * ninth positional argument to an eight-field type would be dropped.
   */
  protected constructorFields(
    typeName: string,
    fields: readonly string[],
    ctx: Fun_callContext,
  ): Map<string, string> {
    const args = ctx.fun_actual_args();
    const assigned = new Map<string, string>();

    const posArgs = args?.pos_args();
    const positional = posArgs ? this.positionalArgs(posArgs) : [];
    if (positional.length > fields.length) {
      throw this.err(
        ctx,
        `'${typeName}.new' takes ${fields.length} field(s), but ${positional.length} ` +
        `positional argument(s) were given.`,
      );
    }
    positional.forEach((expr, i) => assigned.set(fields[i], this.visit(expr)));

    for (const kw of args?.kw_args()?.kw_arg() ?? []) {
      const field = kw.id().getText();
      if (!fields.includes(field)) {
        throw this.err(
          ctx,
          `'${typeName}' has no field '${field}'. Its fields are: ` +
          `${fields.join(", ") || "(none)"}.`,
        );
      }
      if (assigned.has(field)) {
        throw this.err(ctx, `'${typeName}.new' got two values for field '${field}'.`);
      }
      assigned.set(field, this.visit(kw.arith_expr() ?? kw.arith_exprs()!));
    }

    return assigned;
  }

  /**
   * `receiver.name(args)`.
   *
   * A USER method becomes `name(receiver, args)`, which is what it already is —
   * see `visitMethod_def_stmt`. Anything else is a BUILT-IN method, and which
   * namespace owns it depends on what the receiver turns out to be at run time,
   * so that dispatch is deferred to `Context.builtinMethod`.
   *
   * `.copy()` is intercepted first because three different namespaces spell it
   * — `array.copy`, `matrix.copy`, and a UDT's shallow copy — and only the
   * value knows which it is.
   */
  protected emitMethodCall(receiver: string, method: string, ctx: Fun_callContext): string {
    // `id` is greedy, so `wrapper.data.size()` reaches here as the receiver
    // `wrapper` and the "method" `data.size`. Everything before the LAST dot is
    // a chain of field reads on the receiver; only the last part is the call.
    //
    // Without the split, the whole dotted string was handed to
    // `Context.builtinMethod` as a method name, and no value has a method
    // called `data.size` — so a perfectly ordinary
    //
    //     type Wrapper
    //         map<string, float> data
    //     …
    //     wrapper.data.size()
    //
    // died with "'.data.size()' cannot be called on this value: it is object".
    // The same shape appears as `obj.lbl.set_x()`, `obj.level.get_x1()` and
    // `obj.prices.get()` across five of TradingView's own examples.
    const cut = method.lastIndexOf(".");
    const fields = cut > 0 ? method.slice(0, cut).split(".") : [];
    const name = cut > 0 ? method.slice(cut + 1) : method;

    const target = fields.reduce(
      (js, field) => `ctx.field(${js}, ${JSON.stringify(field)})`,
      this.localName(receiver),
    );
    const args = this.withCallee(
      name,
      () => (ctx.fun_actual_args() ? this.visit(ctx.fun_actual_args()!) : ""),
    );
    const tail = args ? `, ${args}` : "";

    const callId = `"${receiver}.${method}${this.getLocId(ctx as SourceLocated)}"`;

    if (this.userMethods.has(name)) {
      // An overload set resolves on the receiver's declared type; a name with a
      // single declaration takes the ordinary path unchanged. A FIELD path
      // carries no declared type of its own, so it is resolved as an unnamed
      // receiver — which reports honestly rather than dispatching on the type
      // of the object the field hangs off.
      const overload = this.resolveOverload(
        name, this.typeOfPath(receiver, fields), ctx as SourceLocated,
        this.argumentCount(ctx.fun_actual_args?.() ?? null),
      );
      // The EMITTED name in the id, for the reason `emitChainedMethod` gives:
      // `Context.call` resolves the callee's metadata from it, and a user
      // method may share a name with a built-in.
      if (overload !== LIBRARY_METHOD) {
        const fn = overload ?? this.funcName(name);
        return `ctx.call("${fn}${this.getLocId(ctx as SourceLocated)}", ${fn}, ${target}${tail})`;
      }
    }

    // A method this script imported rather than declared. Checked after the
    // local one so a script can shadow a library's method, which is the same
    // precedence every other name follows.
    const owner = this.libraryMethods.get(name);
    if (owner !== undefined) {
      const fn = `${this.libraryNamespace(owner)}[${JSON.stringify(name)}]`;
      return `ctx.call(${callId}, ${fn}, ${target}${tail})`;
    }

    return `ctx.builtinMethod("${this.getLocId(ctx as SourceLocated)}", ${target}, ` +
      `${JSON.stringify(name)}${tail})`;
  }

  /**
   * `<value>.method(args)` where the receiver is an already-emitted VALUE of a
   * known type — an enum member — rather than a name.
   */
  protected emitValueMethodCall(receiver: string, receiverType: string, method: string, ctx: Fun_callContext): string {
    const args = this.withCallee(
      method, () => (ctx.fun_actual_args() ? this.visit(ctx.fun_actual_args()!) : ""));
    const tail = args ? `, ${args}` : "";
    const at = this.getLocId(ctx as SourceLocated);
    if (this.userMethods.has(method)) {
      const overload = this.resolveOverload(method, receiverType, ctx as SourceLocated,
        this.argumentCount(ctx.fun_actual_args?.() ?? null));
      if (overload !== LIBRARY_METHOD) {
        const fn = overload ?? this.funcName(method);
        return `ctx.call("${fn}${at}", ${fn}, ${receiver}${tail})`;
      }
    }
    const owner = this.libraryMethods.get(method);
    if (owner !== undefined) {
      const fn = `${this.libraryNamespace(owner)}[${JSON.stringify(method)}]`;
      return `ctx.call("${method}${at}", ${fn}, ${receiver}${tail})`;
    }
    return `ctx.builtinMethod("${at}", ${receiver}, ${JSON.stringify(method)}${tail})`;
  }

  /** Runs `emit` with `name` on the callee stack, so visitKw_arg can see it. */
  private withCallee(name: string, emit: () => string): string {
    this.calleeStack.push(name);
    try { return emit(); }
    finally { this.calleeStack.pop(); }
  }

  /**
   * Function OVERLOADING — several definitions of one name.
   *
   * SOURCING. From the v5 release notes:
   *
   *     // Two parameters
   *     mult(x1, x2) => x1 * x2
   *     // Three parameters
   *     mult(x1, x2, x3) => x1 * x2 * x3
   *     plot(mult(7, 4))
   *     plot(mult(7, 4, 2))
   *
   * and, for the harder case, "When overloads have the same number of
   * parameters, all parameters in each overload must be explicitly typified,
   * and their type combinations must be unique".
   *
   * ── What it was doing instead ───────────────────────────────────────────────
   *
   * Both definitions were emitted as `function opsv2_$fn_mult(…)`, so the second
   * simply replaced the first in JavaScript. `mult(7, 4)` then called the
   * three-parameter body with one argument missing and plotted `na` on every
   * bar — no error anywhere, because a redeclared function is legal JavaScript.
   */
  protected functionOverloads: Map<string, FnOverload[]> = new Map();

  /** The arity range and declared parameter types of one definition. */
  protected overloadOf(inner: Fun_def_singlelineContext | Fun_def_multilineContext): FnOverload {
    const params = (inner as any).fun_head?.()?.fun_param?.() ?? [];
    return {
      min: params.filter((p: any) => !p.DEFINE?.()).length,
      max: params.length,
      types: params.map((p: any) => p.field_type?.()?.getText() ?? null),
    };
  }

  /**
   * The suffix that separates one overload's emitted name from its siblings.
   *
   * Arity alone where the arities differ, and the declared types as well where
   * they do not — which the manual requires to be unique, so the pair always
   * is. A name with a single definition gets no suffix at all, so nothing about
   * an ordinary script's output changes.
   */
  protected overloadSuffix(o: FnOverload): string {
    const types = o.types.map(t => (t ?? "any").replace(/[^A-Za-z0-9_]/g, "_")).join("_");
    return `$${o.max}_${types}`;
  }

  /** The definition currently being emitted, when its name is overloaded. */
  private emittingOverload: FnOverload | null = null;

  /** The function or method whose body is being emitted, overloaded or not. */
  private enclosingDefinition: { name: string; sig: FnOverload } | null = null;

  private withOverload<T>(
    inner: Fun_def_singlelineContext | Fun_def_multilineContext, body: () => T,
  ): T {
    const previous = this.emittingOverload;
    const enclosing = this.enclosingDefinition;
    this.enclosingDefinition = { name: inner.id().getText(), sig: this.overloadOf(inner) };
    // Methods carry their own naming rule, and a name declared once needs none.
    this.emittingOverload =
      this.emittingMethodFor === null && this.overloadTotal(inner.id().getText()) > 1 ? this.overloadOf(inner) : null;
    // The parameters' declared types, for the body's method calls. An untyped
    // parameter is recorded too, as unknown: it shadows a global of its name,
    // whose type says nothing about it.
    const params = new Map<string, string | null>();
    for (const p of (inner as any).fun_head?.()?.fun_param?.() ?? []) {
      params.set(p.id().getText(), p.field_type?.()?.getText() ?? null);
    }
    this.localTypes.push(params);
    try { return body(); }
    finally { this.emittingOverload = previous; this.enclosingDefinition = enclosing; this.localTypes.pop(); }
  }

  override visitFun_def_singleline(ctx: Fun_def_singlelineContext): string {
    return this.withOverload(ctx, () => super.visitFun_def_singleline(ctx as any))
      + this.afterDefinition(ctx.id().getText());
  }

  override visitFun_def_multiline(ctx: Fun_def_multilineContext): string {
    return this.withOverload(ctx, () => super.visitFun_def_multiline(ctx as any))
      + this.afterDefinition(ctx.id().getText());
  }

  /**
   * The STATIC type of a call argument, as far as it can be known here.
   *
   * Literals carry their own type, and a variable carries whatever type its
   * declaration wrote down. Anything else is null — unknown — and an overload
   * set that cannot be resolved from what is known says so rather than picking
   * one, because picking wrong calls a body written for another type and
   * returns a plausible wrong number.
   */
  protected argumentType(expr: ParseTree | null): string | null {
    if (!expr) return null;
    const text = expr.getText();
    if (/^(true|false)$/.test(text)) return "bool";
    if (/^["']/.test(text)) return "string";
    if (/^#[0-9a-fA-F]{6,8}$/.test(text)) return "color";
    if (/^\d+$/.test(text)) return "int";
    if (/^\d*\.\d+([eE][+-]?\d+)?$|^\d+[eE][+-]?\d+$/.test(text)) return "float";
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(text)) {
      // A local or parameter of that name is what it names, typed or not.
      if (this.localTypes.some(scope => scope.has(text)) || this.typeOfName(text) !== null) return this.typeOfName(text);
    }
    // `close`, `high - low`: arithmetic whose text settles int or float.
    return numericTypeOf(text);
  }

  /** Does an argument of type `arg` fit a parameter declared `param`? */
  private fits(param: string | null, arg: string | null, widen: boolean): boolean {
    if (param === null) return true;              // an untyped parameter takes anything
    if (arg === null) return false;               // unknown cannot be proved to fit
    if (param === arg) return true;
    // "Accepts both 'int' and 'float' values - any 'int' can be automatically
    // cast to 'float'." Only in the widening pass, so an exact `int` overload
    // still wins over a `float` one when both exist.
    return widen && param === "float" && arg === "int";
  }

  /**
   * An enum member may not stand in for a member of a DIFFERENT enum.
   *
   * SOURCING. From the manual's Enums page: "Scripts cannot compare members of
   * different enums or use such members in expressions requiring a specific
   * enum type, EVEN IF THE FIELDS HAVE IDENTICAL NAMES AND TITLES." A parameter
   * declared `OscType selection` is such an expression.
   *
   * TradingView's own `v5-language-enums-05` is written to show the refusal —
   * it declares `OscType` and `OscType2` with identical fields, passes an
   * `OscType2` where an `OscType` belongs, and comments the plot "Raises a
   * compilation error because only members of `OscType` are allowed." This
   * engine compiled it and plotted `na` on every bar instead, which is the
   * worse of the two answers: the script looks like it ran.
   *
   * ⚠ The COMPARISON half of that sentence — `OscType.rsi == OscType2.rsi` —
   * is not refused here. It is the same rule and needs the same type
   * information on both operands of a binary expression; no corpus script
   * witnesses it, so it is left as a stated gap rather than a guess. The
   * runtime keeps the two members distinct regardless, which
   * tests/v5/transpiler/enums.test.ts asserts.
   */
  private checkEnumArguments(pineName: string, ctx: Fun_callContext): void {
    const declarations = this.functionOverloads.get(pineName) ?? [];
    // An overloaded name is resolved by type already, and picking the wrong
    // overload is reported there with a message about overloads.
    if (declarations.length !== 1) return;

    const args = ctx.fun_actual_args();
    const positional = args?.pos_args() ? this.positionalArgs(args.pos_args()!) : [];
    const params = declarations[0].types;

    positional.forEach((arg, i) => {
      const wanted = params[i];
      const given = this.argumentType(arg);
      if (!wanted || !given || wanted === given) return;
      if (!this.userEnums.has(wanted) || !this.userEnums.has(given)) return;
      throw this.err(
        ctx,
        `Argument ${i + 1} of '${pineName}' is declared '${wanted}', and a member ` +
        `of '${given}' was passed. Members of different enums are not ` +
        `interchangeable, even when their fields have identical names and titles.`,
      );
    });
  }

  protected override callFunctionName(pineName: string, ctx: Fun_callContext): string {
    this.checkEnumArguments(pineName, ctx);

    if (this.overloadTotal(pineName) < 2) return super.callFunctionName(pineName, ctx);
    const overloads = this.functionOverloads.get(pineName) ?? [];

    const args = ctx.fun_actual_args();
    const positional = args?.pos_args() ? this.positionalArgs(args.pos_args()!) : [];
    const keywords = args?.kw_args()?.kw_arg() ?? [];
    const count = positional.length + keywords.length;

    // A method may be called as a function, `area(r)` for `r.area()`, so its
    // declarations are candidates here too.
    const candidates = [
      ...overloads.map(o => ({ js: this.funcName(pineName) + this.overloadSuffix(o), sig: o })),
      ...(this.methodSignatures.get(pineName) ?? []).map(m =>
        ({ js: this.methodFunctionName(pineName, m.receiver, m.sig), sig: m.sig })),
    ];
    let byArity = candidates.filter(c => count >= c.sig.min && count <= c.sig.max);
    // Recursion is not allowed, so inside an overload's own body a call to its
    // name is to a sibling: `cust_series(simple float length, …)` calling
    // `cust_series(math.ceil(length), …)` means the int one, whatever type
    // `math.ceil` is known to return here.
    const self = this.enclosingDefinition;
    if (self !== null && self.name === pineName) {
      const key = (o: FnOverload) => JSON.stringify([o.min, o.max, o.types]);
      const siblings = byArity.filter(c => key(c.sig) !== key(self.sig));
      if (siblings.length > 0) byArity = siblings;
    }
    if (byArity.length === 0) {
      throw this.err(
        ctx,
        `'${pineName}' is declared ${candidates.length} times and none of them takes ` +
        `${count} argument(s). The declarations take ` +
        `${candidates.map(c => c.sig.min === c.sig.max ? `${c.sig.max}` : `${c.sig.min}-${c.sig.max}`).join(", ")}.`,
      );
    }
    if (byArity.length === 1) return byArity[0].js;

    // Same arity: the argument types decide. Exact first, then `int` widened
    // to `float`.
    const argTypes = positional.map(p => this.argumentType(p));
    for (const widen of [false, true]) {
      const hit = byArity.filter(c => argTypes.every((a, i) => this.fits(c.sig.types[i] ?? null, a, widen)));
      if (hit.length === 1) return hit[0].js;
    }

    // The types are not all written down here — an argument returned by a
    // call, a field. The dispatcher picks at run time from the values, and
    // between `int` and `float`, which it cannot tell apart, takes `float`
    // (mixesIntFloat); so does this, when that leaves one declaration.
    let live = byArity.filter(c => argTypes.every((a, i) => a === null || this.fits(c.sig.types[i] ?? null, a, true)));
    argTypes.forEach((a, i) => {
      if (a === null && mixesIntFloat(live.map(c => c.sig.types[i] ?? null))) {
        live = live.filter(c => normaliseType(c.sig.types[i] ?? "") !== "int");
      }
    });
    if (live.length === 1) return live[0].js;
    return this.funcName(pineName);
  }

  /**
   * v5 keeps the mutable-argument restriction for ONE member of the family.
   *
   * SOURCING. The manual's Other timeframes and data page states it only of
   * `request.security_lower_tf`: its `expression` parameter "accepts most of the
   * same arguments discussed in that section, excluding direct references to
   * collections and mutable variables declared in the script's main scope". It
   * is said of that function as a DIFFERENCE from `request.security()`, which
   * the same page restricts only INSIDE A LOOP — "all parameters defining parts
   * of the requested context can accept arguments that depend on variables from
   * the loop's header or mutable variables that change within the loop's local
   * scope. However, a request.*() call's evaluated expression cannot depend on
   * the values of those variables."
   *
   * TradingView's own `v5-writing-limitations-10` settles it. That script passes
   * the global `var x = 0`, mutated by 300 `if` blocks, straight into
   * `request.security()`, and its comment names the only error as "compilation
   * error since the scope count is now 602". The blanket v3 guard rejected it
   * one rule too early, for a reason v5 does not have.
   *
   * v3 and v4 are untouched: nothing in either archive lifts the rule there.
   */
  protected override securityRestrictsMutableArgs(ctx: Fun_callContext): boolean {
    return ctx.id().getText() === "request.security_lower_tf";
  }

  /**
   * `strategy.long` / `strategy.short` passed as `when` is rejected. They are
   * direction constants, not conditions: v4 let the mistake through, where
   * `strategy.entry("L", strategy.long, when = strategy.long)` read as true.
   * Migration guide to v5 (https://www.tradingview.com/pine-script-docs/migration-guides/to-pine-version-5/):
   * "strategy.long" cannot be passed to `when`; use `direction`.
   */
  protected enforceWhenIsBool(name: string, ctx: Fun_callContext): void {
    for (const k of ctx.fun_actual_args()?.kw_args()?.kw_arg() ?? []) {
      if (k.id().getText() !== "when") continue;
      const text = k.arith_expr?.()?.getText();
      if (text === "strategy.long" || text === "strategy.short") {
        throw this.err(
          ctx,
          `'${text}' is a direction, not a condition: it cannot be passed as the 'when' argument of ${name}(). ` +
          `Pass the direction as the 'direction' argument.`,
        );
      }
    }
  }

  /**
   * `strategy.exit()` with no exit condition is rejected (§4d).
   *
   * Positional form is admitted from the fifth argument on: the parameter order
   * is `(id, from_entry, qty, qty_percent, profit, …)`, so a fifth positional
   * argument IS `profit`. Checking the count rather than the names is the only
   * option there — a positional argument carries no name to check.
   */
  protected enforceExitCondition(ctx: Fun_callContext): void {
    const args = ctx.fun_actual_args();
    const posArgs = args?.pos_args();
    const positional = posArgs ? this.positionalArgs(posArgs).length : 0;
    if (positional >= 5) return;

    const keywords = args?.kw_args()?.kw_arg().map(a => a.id().getText()) ?? [];
    if (keywords.some(k => EXIT_CONDITIONS.includes(k))) return;

    throw this.err(
      ctx,
      `strategy.exit() must specify at least one of ${EXIT_CONDITIONS.join(", ")}. ` +
      `An exit order with no condition can never fill.`,
    );
  }

  /**
   * The collection constructors that take a TYPE ARGUMENT.
   *
   * `array.new<float>(0)` is v5's spelling of `array.new_float(0)`, and this
   * engine implements the per-type constructors — so the type argument is not
   * decoration here, it selects the function. `matrix.new<float>` and
   * `map.new<string, int>` have one implementation each, so their type
   * arguments are parsed and discarded.
   *
   * Returns null when this call is not a typed constructor, so the caller can
   * fall through to the ordinary path.
   */
  protected emitTypedConstructor(name: string, ctx: Fun_callContext): string | null {
    if (name !== "array.new" && name !== "matrix.new" && name !== "map.new") {
      // Anything else with type arguments — there is nothing else in v5 — falls
      // through to the ordinary path, which ignores them. Handling it here
      // instead would route the call around the guards `super.visitFun_call`
      // applies, `strategy.*` context among them.
      return null;
    }

    const typeArgs = (ctx as any).type_args?.();

    if (name === "array.new") {
      if (!typeArgs) {
        throw this.err(
          ctx,
          `'array.new' needs a type argument — write 'array.new<float>(…)', or ` +
          `use the typed constructor 'array.new_float(…)'.`,
        );
      }
      // This engine implements one constructor per element type, so here the
      // type argument is not decoration: it selects the function.
      //
      // A USER type has no constructor of its own — `array.new<Point>(3)` is
      // three `na`s, which is exactly what `array.new_float` produces, and an
      // explicit initial value is passed through either way.
      const element = typeArgs.type_arg(0).getText();
      const known = this.registry[`array.new_${element}`] ? element : "float";
      return this.emitCall(`array.new_${known}`, ctx);
    }

    // `matrix.new` and `map.new` have one implementation each; their type
    // arguments are parsed and discarded, because this engine does not track
    // element types anywhere and a constructor that pretended to would be
    // checking nothing.
    return this.emitCall(name, ctx);
  }

  /** Emits `ctx.call("name@L:C", ctx.builtin("name"), …args)` for a built-in. */
  private emitCall(resolved: string, ctx: Fun_callContext): string {
    if (!this.registry[resolved]) {
      throw this.err(ctx, `'${resolved}' is not available in Pine Script v${this.version}.`);
    }
    const args = this.withCallee(
      resolved,
      () => (ctx.fun_actual_args() ? this.visit(ctx.fun_actual_args()!) : ""),
    );
    const callId = `"${resolved}${this.getLocId(ctx as SourceLocated)}"`;
    return `ctx.call(${callId}, ctx.builtin(${JSON.stringify(resolved)})${args ? `, ${args}` : ""})`;
  }

  /**
   * The RUNTIME's name for a keyword the script spelled the v5 way, or null.
   *
   * Consulted from `visitId` rather than from `visitKw_arg`, which is where it
   * started. `emitSecurity` builds its keyword object itself — it has to, so it
   * can defer the `expression` argument as a thunk — and reads each key by
   * visiting the id directly, so a translation living in `visitKw_arg` was
   * bypassed for exactly the call that needs it most:
   * `request.security(…, timeframe="D")` silently fell back to the chart's
   * timeframe. `visitId` is the one point both paths go through.
   */
  protected keywordAliasFor(written: string): string | undefined {
    const callee = this.calleeStack[this.calleeStack.length - 1];
    return callee ? KEYWORD_ALIASES[callee]?.[written] : undefined;
  }

  // ── Declarations: type, method, export, import ────────────────────────────

  /** v5's `stmt` gained four alternatives; the base knows two. */
  override visitStmt(ctx: StmtContext): string {
    if (ctx.import_stmt()) return this.visit(ctx.import_stmt()!);
    if (ctx.export_stmt()) return this.visit(ctx.export_stmt()!);
    if (ctx.type_def_stmt()) return this.visit(ctx.type_def_stmt()!);
    if (ctx.enum_def_stmt()) return this.visit(ctx.enum_def_stmt()!);
    if (ctx.method_def_stmt()) return this.visit(ctx.method_def_stmt()!);
    return super.visitStmt(ctx as any);
  }

  /**
   * `type Name` + fields → a FACTORY FUNCTION.
   *
   *     type Point
   *         float x
   *         float y = 0.0
   *
   * becomes
   *
   *     function opsv2_$type_Point(_a) {
   *       const _o = { __type: "Point" };
   *       _o.x = ctx.fieldValue(_a.x !== undefined ? _a.x : (NaN));
   *       _o.y = ctx.fieldValue(_a.y !== undefined ? _a.y : (0.0));
   *       return _o;
   *     }
   *
   * A function DECLARATION rather than an object template, for two reasons.
   * Declarations hoist, so a type may be used above the line that declares it
   * inside any function body. And a default has to be RE-EVALUATED per
   * instance: `type Bag\n    array<float> xs = array.new<float>(0)` must give
   * every Bag its own array, and a shared template would give them all one.
   *
   * Fields are stored UNPREFIXED. They live inside an object of their own, so
   * there is nothing in the sandbox for them to collide with, and `p.x` reads
   * better in a debugger than `p.opsv2_x`.
   */
  visitType_def_stmt(ctx: Type_def_stmtContext): string {
    const typeName = ctx.id().getText();
    const fields = this.userTypes.get(typeName) ?? this.fieldsOf(ctx);

    const seen = new Set<string>();
    const lines = fields.map(f => {
      if (seen.has(f.name)) {
        throw this.err(ctx, `type '${typeName}' declares the field '${f.name}' twice.`);
      }
      seen.add(f.name);
      const fallback = f.defaultExpr ? this.visit(f.defaultExpr) : "NaN";
      const key = JSON.stringify(f.name);
      // `ctx.fieldValue`: a field holds the VALUE it was given on this bar, not
      // the series it came from -- see Context.fieldValue.
      return `  _o[${key}] = ctx.fieldValue(_a[${key}] !== undefined ? _a[${key}] : (${fallback}));`;
    });

    return [
      `function ${this.typeFactory(typeName)}(_a) {`,
      `  const _o = { __type: ${JSON.stringify(typeName)} };`,
      ...lines,
      `  return _o;`,
      `}`,
    ].join("\n");
  }

  /**
   * `enum Name` + fields → one frozen object of MEMBER objects.
   *
   *     enum OscType
   *         rsi = "Relative Strength Index"
   *         mfi = "Money Flow Index"
   *
   * becomes
   *
   *     const opsv2_$enum_OscType = ctx.declareEnum("OscType", {
   *       "rsi": "Relative Strength Index", "mfi": "Money Flow Index",
   *     });
   *
   * whose members are the STRINGS `"OscType.rsi"` and `"OscType.mfi"`. See
   * `Context.declareEnum` for why a member is a string rather than an object —
   * in one line, because `x == OscType.rsi` compares a Series to the member,
   * and JavaScript compares two objects by reference while it coerces an object
   * against a primitive.
   *
   * The enum NAME is part of every member, which keeps the rule the manual
   * states: "Scripts cannot compare members of different enums ... even if the
   * fields have identical names and titles."
   *
   * ── The title default ──────────────────────────────────────────────────
   *
   * "If the programmer does not specify a field's title, its title is the
   * 'string' representation of its name."
   */
  visitEnum_def_stmt(ctx: Enum_def_stmtContext): string {
    const enumName = ctx.id().getText();
    const fields = this.userEnums.get(enumName) ?? this.enumFieldsOf(ctx);

    const seen = new Set<string>();
    const titles = fields.map(f => {
      if (seen.has(f.name)) {
        throw this.err(ctx, `enum '${enumName}' declares the field '${f.name}' twice.`);
      }
      seen.add(f.name);
      const title = f.titleExpr ? this.visit(f.titleExpr) : JSON.stringify(f.name);
      return `${JSON.stringify(f.name)}: ${title}`;
    });

    return `const ${this.enumFactory(enumName)} = ` +
           `ctx.declareEnum(${JSON.stringify(enumName)}, {${titles.join(", ")}});`;
  }

  /** An enum declaration's fields, in declaration order. */
  protected enumFieldsOf(ctx: Enum_def_stmtContext): EnumField[] {
    return ctx.enum_body().enum_field().map(f => ({
      // Read raw, exactly as a type's field is: a member lives in its own
      // namespace, so it is neither a reserved word nor a renamed built-in.
      name: f.id().getText(),
      titleExpr: f.arith_expr() ?? null,
    }));
  }

  /** The emitted name of an enum's member table. */
  protected enumFactory(enumName: string): string {
    return `${this.PREFIX}${this.nameScope}$enum_${enumName}`;
  }

  /** The emitted name of a type's factory. */
  protected typeFactory(typeName: string): string {
    return `${this.PREFIX}${this.nameScope}$type_${typeName}`;
  }

  /**
   * `method name(Receiver self, …) => …`.
   *
   * Emitted as an ordinary function, because that is what it is: Pine's
   * `r.area()` and `area(r)` are the same call, and the receiver is simply the
   * first argument. Only the CALL SITES differ, and `visitFun_call` handles
   * those.
   *
   * ── The one limitation ────────────────────────────────────────────────────
   *
   * Pine dispatches on the receiver's declared type, so two methods may share a
   * name if their receivers differ. This engine dispatches on the NAME alone,
   * because it does not track types — so a second method of the same name would
   * emit a second JavaScript function of the same name and silently win. It is
   * rejected instead.
   */
  visitMethod_def_stmt(ctx: Method_def_stmtContext): string {
    const def = ctx.fun_def_stmt();
    const inner = def.fun_def_singleline() ?? def.fun_def_multiline();
    const name = inner!.id().getText();

    if (inner!.fun_head().fun_param().length === 0) {
      throw this.err(
        ctx,
        `method '${name}' has no parameters. A method's first parameter is its ` +
        `receiver — write 'method ${name}(MyType self) => …'.`,
      );
    }

    const receiver = this.receiverTypeOf(inner!);
    const sig = this.overloadOf(inner!);
    const key = `${name}/${receiver}/${this.overloadSuffix(sig)}`;
    if (this.definedMethods.has(key)) {
      throw this.err(
        ctx,
        `method '${name}' is already defined for a '${receiver}' receiver with these ` +
        `parameters. Overloads are told apart by their receiver's type, then by ` +
        `their required parameters' number and types.`,
      );
    }
    this.definedMethods.add(key);

    // An overload set emits one JavaScript function per declaration, under a
    // name that carries the receiver type (and the signature, where one
    // receiver has several). `methodFunctionName` is what both the definition
    // and every call site go through, so the two cannot disagree.
    const previousSig = this.emittingMethodSig;
    this.emittingMethodSig = sig;
    try { return this.withMethodReceiver(receiver, () => this.visit(def)); }
    finally { this.emittingMethodSig = previousSig; }
  }

  /**
   * A method's receiver type — the declared type of its FIRST parameter.
   *
   * "Since user-defined methods require explicit type specification for their
   *  first parameter (the receiver object)", this is always written down, and
   * it is the whole basis of overload resolution. A parameter with no declared
   * type is recorded as `?`, which no overload set can be resolved against and
   * which reads correctly in the diagnostic.
   */
  protected receiverTypeOf(inner: Fun_def_singlelineContext | Fun_def_multilineContext): string {
    const first = (inner as any).fun_head?.()?.fun_param?.()?.[0];
    return first?.field_type?.()?.getText() ?? "?";
  }

  /**
   * The JavaScript name for one method.
   *
   * Unqualified while the name has a single declaration, so nothing about a
   * script without overloads changes; qualified by receiver type as soon as it
   * has more than one, because two JavaScript functions of the same name are
   * one function and the second silently wins.
   */
  protected methodFunctionName(name: string, receiver: string | null, sig: FnOverload | null = null): string {
    const overloads = this.methodOverloads.get(name) ?? [];
    if (this.overloadTotal(name) < 2 || receiver === null) return this.funcName(name);
    const base = `${this.funcName(name)}$${receiver.replace(/[^A-Za-z0-9_]/g, "_")}`;
    // A receiver with several declarations needs its signature in the name too.
    const sameReceiver = overloads.filter(r => r === receiver).length;
    return sameReceiver > 1 && sig !== null ? base + this.overloadSuffix(sig) : base;
  }

  /** The signature of the method definition currently being emitted. */
  protected emittingMethodSig: FnOverload | null = null;

  /** The receiver type of the method definition currently being emitted. */
  protected emittingMethodFor: string | null = null;

  /**
   * A method's definition takes the qualified name; every other definition
   * keeps its own. Only `visitMethod_def_stmt` sets `emittingMethodFor`, and a
   * definition cannot nest inside another, so the flag cannot leak.
   */
  protected override definitionFunctionName(pineName: string): string {
    if (this.emittingMethodFor !== null) {
      return this.methodFunctionName(pineName, this.emittingMethodFor, this.emittingMethodSig);
    }
    return this.emittingOverload === null
      ? super.definitionFunctionName(pineName)
      : this.funcName(pineName) + this.overloadSuffix(this.emittingOverload);
  }

  private withMethodReceiver<T>(receiver: string, body: () => T): T {
    const previous = this.emittingMethodFor;
    this.emittingMethodFor = receiver;
    try { return body(); }
    finally { this.emittingMethodFor = previous; }
  }

  /**
   * Which overload of `name` a receiver spelled `expression` resolves to.
   *
   * Returns null when `name` is not overloaded — the caller then takes its
   * ordinary path. Throws when it IS overloaded and the receiver's type cannot
   * be proved, because guessing would dispatch to a body written for another
   * type and return a plausible wrong answer.
   */
  protected resolveOverload(
    name: string, receiverType: string | null, ctx: SourceLocated, argCount: number | null = null,
  ): string | null {
    const sigs = this.methodSignatures.get(name) ?? [];
    // A receiver whose type is known and taken by none of the declarations
    // calls another method of that name. Pine dispatches on the receiver's
    // type, so `arr.set(i, v)` is `array.set` even in a script that declares
    // `method set(Ctx this, …)`. With one local declaration as much as with
    // several: a local `area(Circle)` must not take an imported library's
    // `area(Square)` call.
    if (receiverType !== null && sigs.length > 0) {
      const want = normaliseType(receiverType);
      if (!sigs.some(o => receiverTakes(normaliseType(o.receiver), want))) {
        if (this.libraryMethods.has(name)) return LIBRARY_METHOD;
        const builtIn = /^(array|map|matrix)<|^(line|label|box|table|linefill|polyline|chart\.point)$/.test(want);
        if (builtIn) return LIBRARY_METHOD;
        const userDefined = (t: string) => this.userTypes.has(t) || this.userEnums.has(t);
        // Every user-defined type has a built-in `copy()`, so a `copy` declared
        // for one type leaves the others' built-in: Pine3D declares
        // `method copy(Vec3 this)` and calls `mesh.copy()`.
        if (name === "copy" && this.userTypes.has(want)) return LIBRARY_METHOD;
        if (userDefined(want) && sigs.every(o => userDefined(normaliseType(o.receiver)))) {
          throw this.err(
            ctx,
            `'${name}' is declared for ${sigs.map(o => `'${o.receiver}'`).join(", ")}, ` +
            `and this receiver is '${receiverType}', which none of them takes.`,
          );
        }
      }
    }
    if (sigs.length < 2) return null;

    // The receiver counts as an argument: a method's signature includes it.
    const byArity = argCount === null ? sigs
      : sigs.filter(o => argCount + 1 >= o.sig.min && argCount + 1 <= o.sig.max);
    const fitting = byArity.length > 0 ? byArity : sigs;
    if (receiverType !== null) {
      const want = normaliseType(receiverType);
      const exact = fitting.filter(o => normaliseType(o.receiver) === want);
      if (exact.length === 1) return this.methodFunctionName(name, exact[0].receiver, exact[0].sig);
      // "any 'int' can be automatically cast to 'float'"
      const widened = want === "int" ? fitting.filter(o => normaliseType(o.receiver) === "float") : [];
      if (exact.length === 0 && widened.length === 1) {
        return this.methodFunctionName(name, widened[0].receiver, widened[0].sig);
      }
      // A KNOWN type that no declaration takes is the script's error, as on
      // TradingView; only an unknown one is left to the dispatcher.
      // A library this script imports may declare the overload instead.
      if (exact.length === 0 && widened.length === 0 && this.libraryMethods.has(name)) return LIBRARY_METHOD;
      if (exact.length === 0 && widened.length === 0 && PRIMITIVE_TYPES.has(want)) {
        throw this.err(
          ctx,
          `'${name}' is declared ${sigs.length} times, for ${sigs.map(o => `'${o.receiver}'`).join(", ")} ` +
          `receivers, and this receiver is '${receiverType}', which none of them takes.`,
        );
      }
    }
    if (fitting.length === 1) return this.methodFunctionName(name, fitting[0].receiver, fitting[0].sig);

    // At run time a whole-number float looks like an int — `close` of 11.0 is
    // `11` — so without a written type the `float` overload is the one taken
    // (mixesIntFloat). It accepts an int as well, which Pine widens.
    if (receiverType === null && mixesIntFloat(fitting.map(o => o.receiver))) {
      const floats = fitting.filter(o => normaliseType(o.receiver) !== "int");
      if (floats.length === 1) return this.methodFunctionName(name, floats[0].receiver, floats[0].sig);
    }

    // The type cannot be proved here — a value returned by a call, a field of
    // an untyped local. The overload set's DISPATCHER (`emitOverloadDispatcher`)
    // picks among them at run time by the receiver's own type, which a
    // user-defined object carries.
    return this.funcName(name);
  }

  /**
   * The declared type of `name` where the code being emitted sits: a
   * parameter or typed local of the enclosing function, else a script-scope
   * declaration.
   */
  protected typeOfName(name: string): string | null {
    for (let i = this.localTypes.length - 1; i >= 0; i--) {
      const t = this.localTypes[i].get(name);
      if (t !== undefined) return t;
    }
    return this.scopes.staticTypes?.get(name) ?? this.scriptTypes.get(name) ?? null;
  }

  /** Script-scope types settled by an initialiser, beyond the scope pass's. */
  protected scriptTypes: Map<string, string> = new Map();

  /** The type of `receiver.field1.field2…`, following declared field types. */
  protected typeOfPath(receiver: string, fields: readonly string[]): string | null {
    let type = this.typeOfName(receiver);
    for (const field of fields) {
      if (type === null) return null;
      type = this.userFieldTypes.get(normaliseType(type))?.get(field) ?? null;
    }
    return type;
  }

  /**
   * A type stated by a local's initialiser: `P.new(…)`, `lib.P.new(…)`,
   * `array.new<T>(…)` and its `map`/`matrix` siblings, `xs.copy()`. Anything
   * else is unknown rather than guessed.
   */
  protected typeOfInitialiser(expr: ParseTree | null): string | null {
    if (!expr) return null;
    const text = expr.getText();
    const ctor = /^((?:[A-Za-z_]\w*\.)?[A-Za-z_]\w*)\.(?:new|copy)\(/.exec(text);
    if (ctor && this.userTypes.has(normaliseType(ctor[1]))) return ctor[1];
    if (ctor && /\./.test(ctor[1])) return ctor[1];
    // `xs.copy()` is a copy of a variable: the variable's type.
    if (ctor && !this.isQualifierRoot(ctor[1]) && /^[A-Za-z_]\w*\.copy\(\)/.test(text)) return this.typeOfName(ctor[1]);
    const generic = /^(array|map|matrix)\.new(<[^()]*>)\(/.exec(text);
    if (generic) return `${generic[1]}${generic[2]}`;
    // `array.from(…)` is an array of its first element's type, where that
    // type is plain from the text; otherwise unknown.
    const from = /^array\.from\(/.test(text) ? (this.firstCallOf(expr) as any)?.fun_actual_args?.() ?? null : null;
    if (from) {
      const first = from.pos_args?.() ? this.positionalArgs(from.pos_args() as any)[0] : null;
      const element = first ? (this.typeOfInitialiser(first) ?? this.argumentType(first)) : null;
      if (element) return `array<${element}>`;
    }
    return numericTypeOf(text);
  }

  /**
   * After the last declaration of an overloaded name, a function under the
   * PLAIN name that picks the overload at run time — by argument count, then
   * by the arguments' own types (Context.pickOverload).
   *
   * Calls the emitter can resolve go straight to their overload and never
   * reach it. It serves the rest: a receiver whose type is not written down
   * where it is used, and a library's export, which is published under the
   * plain name and so was "not defined" whenever the name was overloaded.
   */
  protected emitOverloadDispatcher(name: string): string {
    const fns = (this.functionOverloads.get(name) ?? []).map(o =>
      ({ js: this.funcName(name) + this.overloadSuffix(o), sig: o }));
    const methods = (this.methodSignatures.get(name) ?? []).map(m =>
      ({ js: this.methodFunctionName(name, m.receiver, m.sig), sig: m.sig }));
    const all = [...fns, ...methods];
    const table = all.map(c =>
      `[${c.js}, ${c.sig.min}, ${c.sig.max}, ${JSON.stringify(c.sig.types)}]`).join(", ");
    const dispatcher = this.funcName(name);
    // No declaration takes the receiver's type: a built-in method of the same
    // name is the one called — `arr.set(i, v)` in a script that declares
    // `method set(Ctx this, …)`.
    // Else an imported library's method of the name, if the script has one.
    const owner = this.libraryMethods.get(name);
    const fallback = owner !== undefined
      ? `${this.libraryNamespace(owner)}[${JSON.stringify(name)}].apply(null, args)`
      : `ctx.builtinMethod(${JSON.stringify(`${name}@dispatch`)}, args[0], ${JSON.stringify(name)}, ...args.slice(1))`;
    // No `__params` of its own: keyword arguments reach it as a bundle, and it
    // binds them by the CHOSEN overload's names (Context.callPicked). Giving it
    // one overload's names dropped every keyword the others spell differently.
    return `\nfunction ${dispatcher}(...args) {\n  const f = ctx.pickOverload(${JSON.stringify(name)}, args, [${table}]);\n` +
      `  return f ? ctx.callPicked(f, args, ${JSON.stringify(name)}) : ${fallback};\n}\n`;
  }

  /** How many declarations of each overloaded name have been emitted so far. */
  private emittedOverloads: Map<string, number> = new Map();

  /**
   * Every declaration of `name`, functions and methods together: they share
   * one JavaScript name, so they are one overload set. A library declaring
   * `export dot(Vec2 a, Vec2 b, …)` and `export method dot(float[] a, …)`
   * emitted both as the same function, and the second replaced the first.
   */
  protected overloadTotal(name: string): number {
    return (this.functionOverloads.get(name)?.length ?? 0) + (this.methodSignatures.get(name)?.length ?? 0);
  }

  /** How many arguments a call passes, positional and keyword. */
  protected argumentCount(args: any | null): number {
    if (!args) return 0;
    const positional = args.pos_args?.() ? this.positionalArgs(args.pos_args()!) : [];
    return positional.length + (args.kw_args?.()?.kw_arg?.() ?? []).length;
  }

  /**
   * A local's declared type — `Point p = …`, or one its initialiser states —
   * recorded for the method calls later in the same function body.
   */
  override visitVar_def(ctx: any): string {
    if (this.localTypes.length === 0 && !this.scopes.staticTypes?.has(ctx.id().getText())) {
      // Script scope: what the scope pass could not settle, the initialiser may.
      const type = this.typeOfInitialiser(ctx.arith_expr?.() ?? null);
      if (type) this.scriptTypes.set(ctx.id().getText(), type);
    }
    if (this.localTypes.length > 0) {
      const declared: string | null = ctx.field_type?.()?.getText() ?? null;
      const type = declared ?? this.typeOfInitialiser(ctx.arith_expr?.() ?? null);
      // Unknown is recorded as well, so the local hides a global of its name.
      this.localTypes[this.localTypes.length - 1].set(ctx.id().getText(), type);
    }
    if (this.isDeadLocal(ctx)) {
      // Declared but never evaluated: a block's last statement is still
      // `return <name>` when the block is emitted.
      const name = this.visit(ctx.id());
      return this.hoisted.has(ctx.id().getText()) ? `${name} = undefined` : `let ${name} = undefined`;
    }
    return super.visitVar_def(ctx);
  }

  /**
   * TradingView does not evaluate a plain local whose value nothing reads, so
   * an out-of-bounds `array.get` in one raises no error (probes: pe6 in
   * conformance/common/tradingview-findings.md, v6-dead-local; the same read
   * used errors: pe6b, v6-dead-local-used). Only what the probes showed is
   * skipped: a non-`var` local inside a block, never named elsewhere in that
   * block (a loop body re-runs, so earlier statements count), whose value is
   * not the block's result and whose initialiser is built from nothing but
   * reads and `array.get` / `.get`. Anything else is evaluated as before.
   */
  protected isDeadLocal(ctx: any): boolean {
    if (ctx.decl_mod?.()) return false;
    const content = ctx.parent;
    if (!isRule(content, "Local_stmt_contentContext")) return false;
    const line = (content as any).parent;
    if (!isRule(line, "Local_stmt_multilineContext") || line.getChildCount() !== 1) return false;
    const list = line.parent;
    if (!isRule(list, "Local_stmts_listContext")) return false;
    const idNode = ctx.id();
    const name = idNode.getText();
    if (this.mentionsName(list, name, idNode)) return false;
    if (!this.valueDiscarded(content)) return false;
    return this.isPureRead(ctx.arith_expr());
  }

  /** Is `name` (or a field path rooted at it) written anywhere under `node`, bar `skip`? */
  protected mentionsName(node: any, name: string, skip: any): boolean {
    if (!node || node === skip) return false;
    if (isRule(node, "IdContext") && String(node.getText()).split(".")[0] === name) return true;
    const count = node.getChildCount?.() ?? 0;
    for (let i = 0; i < count; i++) {
      if (this.mentionsName(node.getChild(i), name, skip)) return true;
    }
    return false;
  }

  /**
   * Is the value of this statement thrown away? A block's last statement is its
   * value, so it is only discarded when the construct holding the block is
   * itself a statement whose own value is discarded. Unknown shapes say no.
   */
  protected valueDiscarded(content: any): boolean {
    const parent = content.parent;
    if (isRule(parent, "Global_stmtContext")) return true;
    if (!isRule(parent, "Local_stmt_multilineContext") || parent.getChildCount() !== 1) return false;
    const list = parent.parent;
    if (!isRule(list, "Local_stmts_listContext")) return false;
    const entries = list.children.filter((c: any) => isRule(c, "Local_stmt_multilineContext"));
    if (entries[entries.length - 1] !== parent) return true;
    const block = list.parent?.parent?.parent;
    if (!isRule(block, "Stmts_blockContext")) return false;
    let owner = block.parent;
    if (!(isRule(owner, "If_exprContext") || isRule(owner, "For_exprContext")
      || isRule(owner, "For_in_exprContext") || isRule(owner, "While_exprContext"))) return false;
    while (isRule(owner.parent, "If_exprContext")) owner = owner.parent;
    let holder = owner.parent;
    if (isRule(holder, "Arith_exprContext")) holder = holder.parent;
    if (isRule(holder, "Global_stmt_contentContext")) return this.valueDiscarded(holder);
    if (isRule(holder, "Local_stmt_contentContext")) return this.valueDiscarded(holder);
    return false;
  }

  /** Reads, operators and `array.get` / `.get` only: nothing that can have an effect. */
  protected isPureRead(node: any): boolean {
    if (!node) return true;
    if (isRule(node, "If_exprContext") || isRule(node, "For_exprContext") || isRule(node, "For_in_exprContext")
      || isRule(node, "While_exprContext") || isRule(node, "Switch_exprContext")) return false;
    if (isRule(node, "Call_suffixContext") && node.LPAR?.()) return false;
    if (isRule(node, "Fun_callContext")) {
      const callee = String(node.id().getText());
      const isGet = callee === "array.get"
        || (/^[A-Za-z_]\w*(\.[A-Za-z_]\w*)*\.get$/.test(callee) && !this.userFunctions.has("get") && !this.importAliases.has(callee.split(".")[0]));
      if (!isGet || (node.call_suffix?.() ?? []).length > 0) return false;
    }
    const count = node.getChildCount?.() ?? 0;
    for (let i = 0; i < count; i++) {
      if (!this.isPureRead(node.getChild(i))) return false;
    }
    return true;
  }

  /** The dispatcher, when `name`'s last declaration has just been emitted. */
  protected afterDefinition(name: string): string {
    const total = (this.functionOverloads.get(name)?.length ?? 0) + (this.methodSignatures.get(name)?.length ?? 0);
    if (total < 2) return "";
    const done = (this.emittedOverloads.get(name) ?? 0) + 1;
    this.emittedOverloads.set(name, done);
    return done === total ? this.emitOverloadDispatcher(name) : "";
  }

  /** `name/receiverType` for every method ALREADY EMITTED — the duplicate check above. */
  private definedMethods: Set<string> = new Set();

  /**
   * `export` in front of a function, method or type.
   *
   * The declaration is emitted unchanged; the keyword only records that the
   * name is part of a library's public surface. Outside a library it is an
   * error, which is TradingView's rule and is worth enforcing: `export` in an
   * indicator is a script that thinks it is something it is not.
   */
  visitExport_stmt(ctx: Export_stmtContext): string {
    const inner = ctx.type_def_stmt() ?? ctx.enum_def_stmt()
      ?? ctx.method_def_stmt() ?? ctx.fun_def_stmt();

    const named = ctx.type_def_stmt()
      ? ctx.type_def_stmt()!.id().getText()
      : ctx.enum_def_stmt()
        ? ctx.enum_def_stmt()!.id().getText()
        : this.definitionName(ctx.method_def_stmt()?.fun_def_stmt() ?? ctx.fun_def_stmt()!);

    if (!this.declaresLibrary) {
      throw this.err(
        ctx,
        `'export ${named}' is only allowed in a library. Declare the script with ` +
        `library("…") instead of indicator("…").`,
      );
    }

    this.exportedNames.add(named);
    return this.visit(inner!);
  }

  /** The name a `fun_def_stmt` binds, whichever of its two forms it takes. */
  protected definitionName(def: any): string {
    const inner = def.fun_def_singleline() ?? def.fun_def_multiline();
    return inner.id().getText();
  }

  /**
   * `f(float x, int n = 2)` — v5 parameters carry a type and may carry a
   * default.
   *
   * The TYPE is parsed and discarded: this engine evaluates everything as a
   * series, so an annotation cannot change a result, and rejecting a script for
   * carrying one would be worse than ignoring it. The DEFAULT is not — it maps
   * straight onto a JavaScript default parameter, which has the semantics Pine
   * describes (evaluated per call, only when the argument is absent).
   */
  /** v5 parameters are a rule of their own, and may carry a default. */
  protected override paramNames(ctx: Fun_headContext): string[] {
    return ctx.fun_param().map((p) => p.id().getText());
  }

  override visitFun_head(ctx: Fun_headContext): string {
    const params = ctx.fun_param();
    if (params.length === 0) return "()";

    const emitted = params.map(p => {
      const name = this.visit(p.id());
      const fallback = p.arith_expr();
      return fallback ? `${name} = ${this.visit(fallback)}` : name;
    });
    return `(${emitted.join(", ")})`;
  }

  /**
   * `import user/library/version as alias`.
   *
   * The library is compiled INLINE, into an immediately-invoked function whose
   * result is the namespace object the alias refers to:
   *
   *     const opsv2_$lib$mylib = (() => {
   *       function opsv2_$fn_f(opsv2_x) { … }
   *       return { "f": opsv2_$fn_f };
   *     })();
   *
   * ── Why inline, and why an IIFE ───────────────────────────────────────────
   *
   * Inline, because there is nowhere else to put it: the emitted script is one
   * JavaScript function body that the runtime re-invokes per bar, and a library
   * has to be inside that scope to reach `ctx`.
   *
   * An IIFE, because a library has its own script scope. Two scripts that both
   * declare `len = 14` at top level are not sharing a variable, and emitted
   * flat they would be — `let opsv2_len` twice in one scope is a redeclaration
   * error, and with `var` it is worse: it silently works and they overwrite
   * each other.
   *
   * The library's body therefore re-runs per bar exactly as the importing
   * script's does, which is what Pine specifies: a library's top-level code is
   * script-scope code.
   */
  visitImport_stmt(ctx: Import_stmtContext): string {
    const path = ctx.import_path().getText();
    const alias = ctx.id()?.getText() ?? defaultAlias(path);

    if (this.importAliases.has(alias)) {
      throw this.err(ctx, `'${alias}' is already imported.`);
    }

    const source = this.libraries[path];
    if (source === undefined) {
      const known = Object.keys(this.libraries);
      throw this.err(
        ctx,
        `no source was supplied for the library '${path}'. Libraries cannot be ` +
        `fetched from TradingView; supply the source in the 'libraries' option. ` +
        (known.length
          ? `Supplied: ${known.join(", ")}.`
          : `No libraries were supplied.`),
      );
    }

    const { js, exports, types, methods, members, enums } =
      this.compileLibrary(path, alias, source, ctx);
    this.importAliases.set(alias, path);
    this.libraryExports.set(path, exports);
    for (const [name, fields] of types) this.libraryTypeFields.set(`${path}::${name}`, fields);
    for (const name of methods) this.libraryMethods.set(name, alias);
    for (const [name, fields] of enums) this.libraryEnums.set(`${alias}.${name}`, fields);

    return [
      `const ${this.libraryNamespace(alias)} = (() => {`,
      js,
      `return { ${members.join(", ")} };`,
      `})();`,
    ].join("\n");
  }

  /**
   * `alias.EnumName` → its field names, for every enum an import exports.
   *
   * Keyed by the ALIAS rather than the path, because that is what a read
   * spells: two aliases of one library are two namespaces to the script.
   */
  protected libraryEnums: Map<string, string[]> = new Map();

  /** The emitted name of an imported library's namespace object. */
  protected libraryNamespace(alias: string): string {
    return `${this.PREFIX}${LIBRARY_MARK}${alias}`;
  }

  /**
   * Parses a library's source, and says which version it was parsed as.
   *
   * A seam rather than an inline `parseV5`: a v6 script can import a library
   * written in either version, and each must be read by its OWN grammar — a v5
   * library binding a variable called `once` is legal and must stay so. v5
   * itself only ever had v5 libraries, so this reads everything as v5, exactly
   * as before.
   */
  protected parseLibrary(source: string): {
    parsed: ReturnType<typeof parseV5>;
    version: PineVersion;
  } {
    return { parsed: parseV5(source), version: 5 };
  }

  /** The visitor a library parsed as `version` is compiled with. See parseLibrary. */
  protected createLibraryVisitor(_version: PineVersion, options: V5Options): V5ToJsVisitor {
    return new V5ToJsVisitor(options);
  }

  /**
   * The JavaScript an exported name is reached by, on the library's own
   * visitor — a type's factory, an enum's, or a function. A seam because v6
   * adds a fourth kind of export, the constant.
   */
  protected exportedMemberJs(
    name: string, types: ReadonlyMap<string, unknown>, enums: ReadonlyMap<string, unknown>,
  ): string {
    return types.has(name)
      ? this.typeFactory(name)
      : enums.has(name)
        ? this.enumFactory(name)
        : this.funcName(name);
  }

  /**
   * Compiles a library's source with a visitor of its own.
   *
   * A fresh visitor, not this one: a library has its own types, its own
   * methods, its own scope analysis and its own set of exported names, and
   * threading two scripts' worth of that through one instance is how a library
   * would end up able to see the importing script's declarations.
   *
   * Nested imports are allowed — the child gets the same library table. An
   * import back into a library already being compiled (itself, or a cycle
   * through others) is refused by `libraryChain`, and the depth is bounded so a
   * long chain of distinct libraries cannot exhaust the stack either.
   */
  protected compileLibrary(
    path: string,
    alias: string,
    source: string,
    ctx: SourceLocated,
  ): {
    js: string;
    exports: Set<string>;
    types: Map<string, string[]>;
    methods: Set<string>;
    members: string[];
    enums: Map<string, string[]>;
  } {
    if (this.libraryChain.includes(path)) {
      throw this.err(ctx, this.libraryChain[this.libraryChain.length - 1] === path
        ? `the library '${path}' imports itself.`
        : `libraries import each other in a cycle: ${[...this.libraryChain.slice(this.libraryChain.indexOf(path)), path].join(" → ")}.`);
    }
    if (this.locationTag.split("@").length > MAX_LIBRARY_DEPTH) {
      throw this.err(ctx, `libraries are nested more than ${MAX_LIBRARY_DEPTH} deep.`);
    }

    const { parsed, version } = this.parseLibrary(source);
    if (parsed.errorCount > 0) {
      const error = new Error(
        `Pine Script v${version}: parsing the library '${path}' failed with ` +
        `${parsed.errorCount} error(s)`,
      );
      (error as any).errors = parsed.errors;
      throw error;
    }

    const inner = this.createLibraryVisitor(version, {
      libraries: this.libraries,
      locationTag: `${this.locationTag}@${alias}`,
      nameScope: `${this.nameScope}${LIBRARY_MARK}${alias}$`,
      libraryChain: [...this.libraryChain, path],
    });
    const js = inner.visit(parsed.tree);

    if (!inner.declaresLibrary) {
      throw this.err(
        ctx,
        `'${path}' is not a library — it must declare itself with library("…").`,
      );
    }
    if (inner.exportedNames.size === 0) {
      throw this.err(ctx, `the library '${path}' exports nothing.`);
    }

    const types = new Map<string, string[]>();
    for (const [name, fields] of inner.userTypes) {
      if (inner.exportedNames.has(name)) types.set(name, fields.map(f => f.name));
    }
    const methods = new Set(
      [...inner.userMethods].filter(name => inner.exportedNames.has(name)),
    );

    // An ENUM may be exported too, and a consumer reads it as
    // `alias.EnumName.member`. TradingView's own libraries page is built on it:
    // `library("Signal")` exports `enum State`, and the importing script writes
    // `Signal.State.long`. Without this the enum was emitted inside the IIFE
    // and left there, and the read failed as "'Signal' is not a namespace".
    const enums = new Map<string, string[]>();
    for (const [name, fields] of inner.userEnums) {
      if (inner.exportedNames.has(name)) enums.set(name, fields.map(f => f.name));
    }

    // Built from the INNER visitor's spelling of each name, not this one's.
    // A type and a function are emitted under different names (`$type_Pair`
    // versus `$fn_scaled`), and both carry the library's own name scope — which
    // this visitor does not have, so it cannot spell either of them.
    const members = [...inner.exportedNames].map(name =>
      `${JSON.stringify(name)}: ${inner.exportedMemberJs(name, types, enums)}`);

    return { js, exports: inner.exportedNames, types, methods, members, enums };
  }

  /**
   * `alias.f(args)` — a call into an imported library.
   *
   * Only EXPORTED names resolve. A library's private helpers are inside the
   * IIFE and unreachable from here, so an unexported name would emit a property
   * read that is `undefined` at run time; naming it at compile time is the
   * whole point of the export list.
   */
  protected emitLibraryCall(
    alias: string,
    path: string,
    member: string,
    ctx: Fun_callContext,
  ): string {
    const exports = this.libraryExports.get(path)!;

    // `ml.Pair.new(1, 2)` — the member is itself dotted, because the alias, the
    // type and the constructor are all one `id` to the grammar.
    const inner = member.indexOf(".");
    if (inner > 0) {
      return this.emitLibraryTypeCall(
        alias, path, member.slice(0, inner), member.slice(inner + 1), ctx,
      );
    }

    if (!exports.has(member)) {
      throw this.err(
        ctx,
        `the library '${path}' does not export '${member}'. It exports: ` +
        `${[...exports].join(", ")}.`,
      );
    }

    const args = this.withCallee(member, () =>
      ctx.fun_actual_args() ? this.visit(ctx.fun_actual_args()!) : "");
    // `lib:` keeps the id out of the built-in registry, which is looked up by the
    // name before the `@`: an alias spelled like a namespace (`as ta`) that
    // exports `sma` would otherwise run the built-in `ta.sma` in its place.
    const callId = `"lib:${alias}.${member}${this.getLocId(ctx as SourceLocated)}"`;
    const target = `${this.libraryNamespace(alias)}[${JSON.stringify(member)}]`;
    return `ctx.call(${callId}, ${target}${args ? `, ${args}` : ""})`;
  }

  /** `alias.Type.new(…)` and `alias.Type.copy(obj)` — a library's type. */
  protected emitLibraryTypeCall(
    alias: string,
    path: string,
    typeName: string,
    member: string,
    ctx: Fun_callContext,
  ): string {
    const fields = this.libraryTypeFields.get(`${path}::${typeName}`);
    if (!fields) {
      throw this.err(
        ctx,
        `the library '${path}' does not export a type '${typeName}'. It exports: ` +
        `${[...(this.libraryExports.get(path) ?? [])].join(", ")}.`,
      );
    }

    if (member === "copy") {
      const pos = ctx.fun_actual_args()?.pos_args();
      const target = pos ? this.positionalArgs(pos)[0] : undefined;
      if (!target) throw this.err(ctx, `'${alias}.${typeName}.copy' needs the object to copy.`);
      return `ctx.copyObject(${this.visit(target)})`;
    }
    if (member !== "new") {
      throw this.err(
        ctx,
        `'${alias}.${typeName}' is a type; it has no '${member}'.`,
      );
    }

    const assigned = this.constructorFields(typeName, fields, ctx);
    const factory = `${this.libraryNamespace(alias)}[${JSON.stringify(typeName)}]`;
    const entries = [...assigned].map(([f, v]) => `${JSON.stringify(f)}: ${v}`);
    return `${factory}({${entries.join(", ")}})`;
  }

  // ── Statement and expression dispatch ─────────────────────────────────────

  /**
   * v5's `global_stmt_content` / `local_stmt_content` gained `while_expr`, and
   * the global one gained `switch_expr` directly rather than through the
   * `arith_expr` wrapper. The statement dispatcher has to route both;
   * everything else falls through to the inherited implementation.
   */
  protected override visitContent(ctx: any): string {
    if (ctx.while_expr?.()) return this.visit(ctx.while_expr()!);
    if (ctx.switch_expr?.()) return this.visit(ctx.switch_expr()!);
    if (ctx.for_in_expr?.()) return this.visit(ctx.for_in_expr()!);
    return super.visitContent(ctx);
  }

  /** `arith_expr` gained `switch_expr` and `for_in_expr`; the base knows three. */
  override visitArith_expr(ctx: any): string {
    if (ctx.switch_expr?.()) return this.visit(ctx.switch_expr()!);
    if (ctx.for_in_expr?.()) return this.visit(ctx.for_in_expr()!);
    return super.visitArith_expr(ctx);
  }

  // ── `for … in` ────────────────────────────────────────────────────────────

  /**
   * `for item in xs` and `for [index, item] in xs`.
   *
   * Emitted as a real JavaScript `for … of` over `Context.forIn`, for the same
   * reason `while` is emitted as a real `while`: `break` and `continue` cannot
   * cross a function boundary, and Pine allows both here.
   *
   * The whole thing still sits inside an IIFE, because — unlike `while` — a
   * `for … in` is an EXPRESSION. The manual's syntax block opens with
   * `[variables = | :=]`, and its body ends with a `return_expression`, so the
   * loop has a value: the last one its body produced. `captureLoopResult`
   * rewrites the block's trailing `return` into an assignment to `_res`, which
   * is exactly what `visitFor_expr` does for the numeric form — the two loops
   * differ in how they step, not in what they evaluate to.
   *
   * ── Why the pair comes from the runtime rather than the emitter ───────────
   *
   * `item` means something different per collection — an element of an array, a
   * ROW of a matrix, the VALUE half of a map entry — and the emitter cannot
   * know which it has: `xs` is an expression, and this engine does not track
   * element types. `Context.forIn` decides at runtime, where the value is,
   * and hands back a uniform `[key, value]`. It also owns the two size rules,
   * which differ between maps and the rest.
   */
  visitFor_in_expr(ctx: For_in_exprContext): string {
    const tuple = ctx.ids_array();
    const names = tuple
      ? tuple.id().map(id => this.visit(id))
      : [this.visit(ctx.id()!)];

    const collection = this.visit(ctx.ternary_expr());

    this.loopDepth++;
    let rawBody: string;
    try { rawBody = this.visit(ctx.stmts_block()); }
    finally { this.loopDepth--; }

    this.anonCounter = this.anonCounter || 0;
    const id = this.anonCounter++;
    const res = `_res${id}`;
    const pair = `_it${id}`;
    const safeBody = this.captureLoopResult(rawBody, res);

    // One variable binds the VALUE, not the key: `for item in xs` is
    // element-wise, and the index is what the two-variable form adds.
    const bindings = names.length === 2
      ? `let ${names[0]} = ${pair}[0], ${names[1]} = ${pair}[1];`
      : `let ${names[0]} = ${pair}[1];`;

    const at = JSON.stringify(this.getLocId(ctx as SourceLocated));
    const step = `ctx.forIn(${collection}, ${names.length}, ${at})`;

    // `= NaN` for the same reason `visitFor_expr` initialises its own: an empty
    // collection produces no `return_expression`, and that value is `na`.
    return `(() => {\n  let ${res} = NaN;\n  for (const ${pair} of ${step}) {\n` +
           `    ${bindings}\n    ${safeBody}\n  }\n  return ${res};\n})()`;
  }

  // ── `while` ───────────────────────────────────────────────────────────────

  /**
   * `while cond` + block. A STATEMENT: it evaluates to nothing.
   *
   * Emitted as a real JavaScript `while` rather than an IIFE, so `break` and
   * `continue` inside it are legal — the same reason `visitIf_expr` drops the
   * IIFE for a statement-`if` inside a loop. `loopDepth` is raised for exactly
   * that: it is what makes a nested statement-`if` emit as a plain `if`.
   *
   * The trailing return that a block normally ends with is SUPPRESSED, because
   * there is no function boundary here to contain it — a `return` would leave
   * the enclosing user function, or be a syntax error at script scope.
   */
  visitWhile_expr(ctx: While_exprContext): string {
    const cond = this.visit(ctx.ternary_expr());

    this.loopDepth++;
    const saved = this.suppressBlockReturn;
    this.suppressBlockReturn = saved + 1;
    let body: string;
    try {
      body = this.visit(ctx.stmts_block());
    } finally {
      this.suppressBlockReturn = saved;
      this.loopDepth--;
    }

    const guard = `_wg${this.anonCounter++}`;
    const message = JSON.stringify(
      `Pine Script v${this.version}: while loop at ${this.getLocId(ctx as SourceLocated)} exceeded ` +
      `${WHILE_ITERATION_LIMIT} iterations. Its condition never became false.`,
    );

    // The body arrives as its own `{ … }` block and is nested inside the loop's,
    // rather than being spliced open. Splicing would mean string surgery on
    // emitted code to insert the guard, which is exactly the kind of thing that
    // breaks the moment a string literal in the body contains a brace.
    return (
      `let ${guard} = 0;\n` +
      `while (ctx.truthy(${cond})) {\n` +
      `  if (++${guard} > ${WHILE_ITERATION_LIMIT}) throw new Error(${message});\n` +
      `  ${this.catchLoopSignals(body)}\n` +
      `}`
    );
  }

  // ── `switch` ──────────────────────────────────────────────────────────────

  /**
   * `switch` — an EXPRESSION, in both of its forms.
   *
   *     switch expr          each label is compared to `expr`
   *         1 => "one"
   *         => "other"       a label-less arm is the default
   *
   *     switch               each label is a condition in its own right
   *         x > 5 => "big"
   *
   * Emitted as an IIFE, because the arms have to be able to evaluate to
   * something and a `return` needs a function to belong to. The subject is
   * bound to a temporary first so it is evaluated ONCE — Pine evaluates it once,
   * and re-evaluating a `ta.*` call per arm would advance its history several
   * times a bar and quietly desynchronise it.
   */
  /**
   * The loop depth at each enclosing `switch`. A `switch` is emitted as an
   * arrow function, so a `break` in one of its arms that belongs to a loop
   * OUTSIDE it cannot be a JavaScript `break`: Pine allows
   *
   *     for i = 0 to n
   *         switch kind
   *             1 =>
   *                 if found
   *                     break
   *
   * and the emitted `break` was an "Illegal break statement". It is thrown as
   * a loop signal instead, which that loop's body catches (captureLoopResult).
   */
  protected switchLoopFloors: number[] = [];

  override visitLoop_break(ctx: any): string {
    const floor = this.switchLoopFloors[this.switchLoopFloors.length - 1];
    return floor !== undefined && floor === this.loopDepth && floor > 0
      ? "throw ctx.LOOP_BREAK" : super.visitLoop_break(ctx);
  }

  override visitLoop_continue(ctx: any): string {
    const floor = this.switchLoopFloors[this.switchLoopFloors.length - 1];
    return floor !== undefined && floor === this.loopDepth && floor > 0
      ? "throw ctx.LOOP_CONTINUE" : super.visitLoop_continue(ctx);
  }

  visitSwitch_expr(ctx: Switch_exprContext): string {
    const subjectCtx = ctx.ternary_expr();
    const id = this.anonCounter++;
    const subject = `_sw${id}`;

    // The IIFE is a function boundary, so any suppression from an enclosing
    // statement-`if` inside a loop must not reach the arms — they MUST return.
    // Same rule, and the same reasoning, as visitIf_expr.
    const saved = this.suppressBlockReturn;
    this.suppressBlockReturn = 0;
    // A loop `break` or `continue` inside an arm crosses this function
    // boundary; see visitLoop_break.
    this.switchLoopFloors.push(this.loopDepth);

    let chain: string;
    try {
      const cases = ctx.switch_body().switch_case();
      const arms: string[] = [];

      for (const arm of cases) {
        const label = arm.ternary_expr();
        const body = this.caseBody(arm);

        if (!label) {
          // A switch that is ONLY a default has nothing to be an `else` of.
          arms.push(arms.length ? `else ${body}` : body);
          continue;
        }

        // The same equality `==` gets everywhere else in the language, for the
        // same reason: `safe_eq` unwraps a Series and then compares loosely.
        //
        // This was a bare `==`, on the reasoning that loose equality invokes
        // valueOf. It does — but only when ONE side is a primitive. Between two
        // objects, loose equality compares references exactly as strict does,
        // so a switch whose label is a VARIABLE never matched:
        //
        //     float fillPrice = switch bar_index
        //         entryIndex => strategy.opentrades.entry_price(0)
        //
        // is TradingView's own slippage demo, and both of its plots were na on
        // every bar. A label that is a LITERAL kept working, which is what hid
        // it. `safe_eq` also leaves plain objects alone, so an enum label —
        // `OscType.rsi => …` — still matches by identity, which is the rule.
        const test = subjectCtx
          ? `opsv2_safe_eq(${subject}, ${this.visit(label)})`
          : `ctx.truthy(${this.visit(label)})`;

        arms.push(`${arms.length ? "else " : ""}if (${test}) ${body}`);
      }

      chain = arms.join(" ");
    } finally {
      this.suppressBlockReturn = saved;
      this.switchLoopFloors.pop();
    }

    const bind = subjectCtx ? `const ${subject} = ${this.visit(subjectCtx)};\n  ` : "";

    // The trailing `return NaN` is what an unmatched switch evaluates to. Pine
    // gives `na` when nothing matches and there is no default; falling off the
    // end of the IIFE would give `undefined`, which is not the same thing to
    // anything downstream that tests for a number.
    return `(() => {\n  ${bind}${chain}\n  return ${this.switchFallthrough(ctx)};\n})()`;
  }

  /**
   * What a switch evaluates to when no arm matches. `na` at v5; a seam for the
   * same reason as `ifFallthrough` in the v1 base.
   */
  protected switchFallthrough(_ctx: Switch_exprContext): string {
    return "NaN";
  }

  /**
   * One arm's body, as a JavaScript block that RETURNS the arm's value.
   *
   * An indented block already ends in a `return` — that is what
   * `visitLocal_stmts_list` does with a block's last statement. A single-line
   * body does not, and cannot simply be wrapped in one either: `1 => x = 2`
   * emits a declaration, and `return let x = …` is a syntax error. A trailing
   * binding evaluates to the bound name, which is the same rule a function body
   * follows — so this is exactly `singleLineBody`.
   */
  protected caseBody(arm: Switch_caseContext): string {
    const block = arm.stmts_block();
    if (block) return this.visit(block);
    return `{ ${this.singleLineBody(arm.local_stmt_singleline()! as any)}; }`;
  }
}
