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
 *     `while` and `switch`. Neither is a v4 construct — an early draft of the
 *     delta spec said otherwise and was wrong — so v4 emits nothing for them
 *     and v5 emits both here.
 *
 *   RESERVED WORDS (this file)
 *     Thirteen words v5 will not let a script NAME anything. Enforced on the
 *     identifier rather than in the lexer, because `text` is simultaneously a
 *     live namespace (`text.align_left`) and a forbidden variable name — a
 *     distinction a token cannot draw.
 *
 *   KEYWORD ARGUMENTS (this file)
 *     §4b renamed parameters without renaming their functions:
 *     `study(resolution=)` became `indicator(timeframe=)`, `strategy.entry(long=)`
 *     became `direction=`. The RUNTIME still spells them the old way — it is one
 *     implementation across versions — so the emitter translates.
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
import type { PineVersion } from "../version";
import { V4ToJsVisitor } from "../v4/ToJsVisitor";
import { isRule } from "../v1/ToJsVisitor";
import type { StdlibEntry } from "../../runtime/v1/stdlib/metadata";
import { V5_VIEW } from "../../runtime/v1/stdlib";
import { V5_RENAMES, V5_REMOVED } from "../../runtime/v1/stdlib/renames5";
import type { ParseTree } from "antlr4ng";
import { parse as parseV5 } from "../../parser/v5";
import {
  While_exprContext,
  Switch_exprContext,
  Switch_caseContext,
  Fun_callContext,
  Var_defsContext,
  Var_assignContext,
  Kw_argContext,
  IdContext,
  StmtContext,
  Type_def_stmtContext,
  Method_def_stmtContext,
  Export_stmtContext,
  Import_stmtContext,
  Fun_headContext,
  Pine_scriptContext,
} from "../../parser/v5/generated/PineV5Parser";

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
  /** Disambiguates emitted source locations. Set when compiling a library. */
  readonly locationTag?: string;
  /** Disambiguates the names a script DECLARES. Set when compiling a library. */
  readonly nameScope?: string;
}

/** One field of a user-defined type. */
interface TypeField {
  readonly name: string;
  /** Its `= …` initialiser, or null — an undeclared default is `na`. */
  readonly defaultExpr: any | null;
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
 * Source: dev-docs/01-version-delta-spec.md §4e, from the v5 migration guide.
 *
 * `text` is on the list and is also a live namespace root, which is why the
 * check below only ever fires on an UNDOTTED identifier that is not a keyword
 * argument's name.
 */
const RESERVED = new Set([
  "catch", "class", "do", "ellipse", "in", "is", "polygon", "range", "return",
  "struct", "text", "throw", "try",
]);

/**
 * Keyword arguments v5 renamed, per CALLEE.
 *
 * §4b renamed these parameters without renaming their functions. The runtime
 * still spells them the v1–v4 way — it is one implementation across versions,
 * and `Context.call` matches a keyword argument by looking its written name up
 * in the registry entry's parameter list — so an unmatched key is DROPPED
 * SILENTLY. A v5 script writing `indicator(timeframe="D")` would therefore have
 * had its timeframe ignored and fallen back to the chart's.
 *
 * Scoped per callee rather than applied globally because the new names are
 * ordinary words: `source` is a parameter of half the `input.*` family, and
 * rewriting it everywhere would corrupt those calls to fix `nz`.
 */
const KEYWORD_ALIASES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  indicator: { timeframe: "resolution", timeframe_gaps: "resolution_gaps" },
  "request.security": { timeframe: "resolution" },
  time: { timeframe: "resolution" },
  time_close: { timeframe: "resolution" },
  "strategy.entry": { direction: "long" },
  "strategy.order": { direction: "long" },
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
   * Names declared with `method`.
   *
   * Kept apart from `userFunctions` — which already contains them, since a
   * method's body IS a function definition — because only a method may be
   * called as `receiver.name(…)`. A plain function of the same name may not,
   * and answering that question wrongly turns a typo into a silent field read.
   */
  protected userMethods: Set<string> = new Set();

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

  constructor(options: V5Options = {}) {
    super();
    this.libraries = options.libraries ?? {};
    this.locationTag = options.locationTag ?? "";
    this.nameScope = options.nameScope ?? "";
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
    return super.visitPine_script(ctx as any);
  }

  /** Walks the whole tree for `type` and `method` declarations. */
  protected collectDeclarations(root: any): void {
    const walk = (n: any): void => {
      if (!n) return;
      if (isRule(n, "Type_def_stmtContext")) {
        this.userTypes.set(n.id().getText(), this.fieldsOf(n));
      }
      if (isRule(n, "Method_def_stmtContext")) {
        const def = n.fun_def_stmt();
        const inner = def.fun_def_singleline() ?? def.fun_def_multiline();
        if (inner) this.userMethods.add(inner.id().getText());
      }
      const count = n.getChildCount?.() ?? 0;
      for (let i = 0; i < count; i++) walk(n.getChild(i));
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
      `'${name}' is a reserved word in Pine Script v5 and cannot be used as an ` +
      `identifier.`,
    );
  }

  /**
   * Rejects a v5 feature this engine does not implement, by name.
   *
   * Reported as "not implemented" rather than as a Pine error, because it is
   * not one: TradingView accepts all four. Saying so is the difference between
   * an author knowing to rewrite the script and an author hunting for a typo.
   */
  protected enforceSupported(name: string, ctx: SourceLocated): void {
    const feature = UNSUPPORTED.get(name);
    if (!feature) return;
    throw this.err(
      ctx,
      `'${name}' introduces ${feature}, which OpenPineScript does not implement ` +
      `at v5. Rewrite without it — see §8 of dev-docs/01-version-delta-spec.md.`,
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
    if (this.nameScope && !text.includes(".") && this.isReceiverName(text)) {
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
    if (this.namespaceRoots.has(root)) return null;
    if (this.importAliases.has(root)) return null;
    if (!this.isReceiverName(root)) return null;

    let js = this.localName(root);
    for (const part of text.slice(dot + 1).split(".")) {
      js = `ctx.field(${js}, ${JSON.stringify(part)})`;
    }
    return js;
  }

  /**
   * `p.x := expr` — a field WRITE.
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
    return `ctx.setField(${target}, ${JSON.stringify(field)}, ${this.visit(ctx.arith_expr())})`;
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
   */
  protected override enforceStrategyContext(name: string, ctx: SourceLocated): void {
    if (this.scriptKind === 'indicator' || this.scriptKind === 'library') {
      // "an indicator", "a library" — the article follows the word, because a
      // diagnostic that reads as broken English reads as a broken engine.
      const article = this.scriptKind === 'indicator' ? 'an' : 'a';
      throw this.err(
        ctx,
        `'${name}' is unavailable in ${article} ${this.scriptKind}() script ` +
        `(indicator mode). Declare strategy(...) to use the broker emulator.`,
      );
    }
    super.enforceStrategyContext(name, ctx);
  }

  // ── Calls ─────────────────────────────────────────────────────────────────

  override visitFun_call(ctx: Fun_callContext): string {
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

    if (name === "request.security") {
      return this.withCallee(name, () => this.emitSecurity(ctx as any));
    }

    if (name === "strategy.exit") this.enforceExitCondition(ctx);

    const typed = this.emitTypedConstructor(name, ctx);
    if (typed !== null) return typed;

    const dotted = this.emitDottedCall(name, ctx);
    if (dotted !== null) return dotted;

    return this.withCallee(name, () => super.visitFun_call(ctx as any));
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

    const library = this.importAliases.get(root);
    if (library !== undefined) return this.emitLibraryCall(root, library, tail, ctx);

    if (this.namespaceRoots.has(root)) return null;
    if (!this.isReceiverName(root)) return null;

    return this.emitMethodCall(root, tail, ctx);
  }

  /** `Point.new(…)` and `Point.copy(p)` — the two calls a TYPE answers. */
  protected emitTypeCall(typeName: string, member: string, ctx: Fun_callContext): string | null {
    if (member === "copy") {
      const target = ctx.fun_actual_args()?.pos_args()?.arith_expr(0);
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

    const positional = args?.pos_args()?.arith_expr() ?? [];
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
    const target = this.localName(receiver);
    const args = this.withCallee(
      method,
      () => (ctx.fun_actual_args() ? this.visit(ctx.fun_actual_args()!) : ""),
    );
    const tail = args ? `, ${args}` : "";

    const callId = `"${receiver}.${method}${this.getLocId(ctx as SourceLocated)}"`;

    if (this.userMethods.has(method)) {
      return `ctx.call(${callId}, ${this.funcName(method)}, ${target}${tail})`;
    }

    // A method this script imported rather than declared. Checked after the
    // local one so a script can shadow a library's method, which is the same
    // precedence every other name follows.
    const owner = this.libraryMethods.get(method);
    if (owner !== undefined) {
      const fn = `${this.libraryNamespace(owner)}[${JSON.stringify(method)}]`;
      return `ctx.call(${callId}, ${fn}, ${target}${tail})`;
    }

    return `ctx.builtinMethod("${this.getLocId(ctx as SourceLocated)}", ${target}, ` +
      `${JSON.stringify(method)}${tail})`;
  }

  /** Runs `emit` with `name` on the callee stack, so visitKw_arg can see it. */
  private withCallee(name: string, emit: () => string): string {
    this.calleeStack.push(name);
    try { return emit(); }
    finally { this.calleeStack.pop(); }
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
    const positional = args?.pos_args()?.arith_expr().length ?? 0;
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
      throw this.err(ctx, `'${resolved}' is not available in Pine Script v5.`);
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

  /**
   * Rejects `transp=`.
   *
   * Removed from every plotting function in v5 (§4c) and replaced by baking the
   * transparency into the colour. Left alone it would be dropped silently by
   * `Context.call`, so a v5 script asking for a 90%-transparent fill would get
   * an opaque one and no warning.
   */
  override visitKw_arg(ctx: Kw_argContext): string {
    if (ctx.id().getText() === "transp") {
      throw this.err(
        ctx,
        `the 'transp' argument was removed in Pine Script v5. Set the ` +
        `transparency on the colour instead: color.new(c, transp) or color.rgb().`,
      );
    }
    return super.visitKw_arg(ctx as any);
  }

  // ── Declarations: type, method, export, import ────────────────────────────

  /** v5's `stmt` gained four alternatives; the base knows two. */
  override visitStmt(ctx: StmtContext): string {
    if (ctx.import_stmt()) return this.visit(ctx.import_stmt()!);
    if (ctx.export_stmt()) return this.visit(ctx.export_stmt()!);
    if (ctx.type_def_stmt()) return this.visit(ctx.type_def_stmt()!);
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
   *       _o.x = _a.x !== undefined ? _a.x : (NaN);
   *       _o.y = _a.y !== undefined ? _a.y : (0.0);
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
      return `  _o[${key}] = _a[${key}] !== undefined ? _a[${key}] : (${fallback});`;
    });

    return [
      `function ${this.typeFactory(typeName)}(_a) {`,
      `  const _o = { __type: ${JSON.stringify(typeName)} };`,
      ...lines,
      `  return _o;`,
      `}`,
    ].join("\n");
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

    if (this.definedMethods.has(name)) {
      throw this.err(
        ctx,
        `method '${name}' is already defined. OpenPineScript dispatches a method ` +
        `by NAME, not by receiver type, so two methods cannot share one.`,
      );
    }
    this.definedMethods.add(name);

    return this.visit(def);
  }

  /** Method names ALREADY EMITTED, for the duplicate check above. */
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
    const inner = ctx.type_def_stmt() ?? ctx.method_def_stmt() ?? ctx.fun_def_stmt();

    const named = ctx.type_def_stmt()
      ? ctx.type_def_stmt()!.id().getText()
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
        `no source was supplied for the library '${path}'. OpenPineScript cannot ` +
        `fetch a library from TradingView; pass it in the 'libraries' option. ` +
        (known.length
          ? `Supplied: ${known.join(", ")}.`
          : `No libraries were supplied.`),
      );
    }

    const { js, exports, types, methods, members } =
      this.compileLibrary(path, alias, source, ctx);
    this.importAliases.set(alias, path);
    this.libraryExports.set(path, exports);
    for (const [name, fields] of types) this.libraryTypeFields.set(`${path}::${name}`, fields);
    for (const name of methods) this.libraryMethods.set(name, alias);

    return [
      `const ${this.libraryNamespace(alias)} = (() => {`,
      js,
      `return { ${members.join(", ")} };`,
      `})();`,
    ].join("\n");
  }

  /** The emitted name of an imported library's namespace object. */
  protected libraryNamespace(alias: string): string {
    return `${this.PREFIX}${LIBRARY_MARK}${alias}`;
  }

  /**
   * Compiles a library's source with a visitor of its own.
   *
   * A fresh visitor, not this one: a library has its own types, its own
   * methods, its own scope analysis and its own set of exported names, and
   * threading two scripts' worth of that through one instance is how a library
   * would end up able to see the importing script's declarations.
   *
   * Nested imports are allowed — the child gets the same library table — but
   * the depth is bounded, because a library that imports itself would otherwise
   * recurse until the stack ran out.
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
  } {
    if (this.locationTag.split("@").length > MAX_LIBRARY_DEPTH) {
      throw this.err(ctx, `libraries are nested more than ${MAX_LIBRARY_DEPTH} deep.`);
    }

    const parsed = parseV5(source);
    if (parsed.errorCount > 0) {
      const error = new Error(
        `Pine Script v5: parsing the library '${path}' failed with ` +
        `${parsed.errorCount} error(s)`,
      );
      (error as any).errors = parsed.errors;
      throw error;
    }

    const inner = new V5ToJsVisitor({
      libraries: this.libraries,
      locationTag: `${this.locationTag}@${alias}`,
      nameScope: `${this.nameScope}${LIBRARY_MARK}${alias}$`,
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

    // Built from the INNER visitor's spelling of each name, not this one's.
    // A type and a function are emitted under different names (`$type_Pair`
    // versus `$fn_scaled`), and both carry the library's own name scope — which
    // this visitor does not have, so it cannot spell either of them.
    const members = [...inner.exportedNames].map(name => {
      const emitted = types.has(name)
        ? inner.typeFactory(name)
        : inner.funcName(name);
      return `${JSON.stringify(name)}: ${emitted}`;
    });

    return { js, exports: inner.exportedNames, types, methods, members };
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
    const callId = `"${alias}.${member}${this.getLocId(ctx as SourceLocated)}"`;
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
      const target = ctx.fun_actual_args()?.pos_args()?.arith_expr(0);
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
    return super.visitContent(ctx);
  }

  /** `arith_expr` gained a `switch_expr` alternative; the base knows three. */
  override visitArith_expr(ctx: any): string {
    if (ctx.switch_expr?.()) return this.visit(ctx.switch_expr()!);
    return super.visitArith_expr(ctx);
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
      `Pine Script v5: while loop at ${this.getLocId(ctx as SourceLocated)} exceeded ` +
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
      `  ${body}\n` +
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
  visitSwitch_expr(ctx: Switch_exprContext): string {
    const subjectCtx = ctx.ternary_expr();
    const id = this.anonCounter++;
    const subject = `_sw${id}`;

    // The IIFE is a function boundary, so any suppression from an enclosing
    // statement-`if` inside a loop must not reach the arms — they MUST return.
    // Same rule, and the same reasoning, as visitIf_expr.
    const saved = this.suppressBlockReturn;
    this.suppressBlockReturn = 0;

    let chain: string;
    try {
      const cases = ctx.switch_body().switch_case();
      const arms: string[] = [];

      for (const arm of cases) {
        const label = arm.ternary_expr();
        const body = this.caseBody(arm);

        if (!label) {
          arms.push(`else ${body}`);
          continue;
        }

        // Loose '==' deliberately: the subject and the label are both routinely
        // Series objects, and loose equality is what invokes valueOf on them.
        // Strict equality would compare object identity and never match.
        const test = subjectCtx
          ? `(${subject} == ${this.visit(label)})`
          : `ctx.truthy(${this.visit(label)})`;

        arms.push(`${arms.length ? "else " : ""}if (${test}) ${body}`);
      }

      chain = arms.join(" ");
    } finally {
      this.suppressBlockReturn = saved;
    }

    const bind = subjectCtx ? `const ${subject} = ${this.visit(subjectCtx)};\n  ` : "";

    // The trailing `return NaN` is what an unmatched switch evaluates to. Pine
    // gives `na` when nothing matches and there is no default; falling off the
    // end of the IIFE would give `undefined`, which is not the same thing to
    // anything downstream that tests for a number.
    return `(() => {\n  ${bind}${chain}\n  return NaN;\n})()`;
  }

  /**
   * One arm's body, as a JavaScript block that RETURNS the arm's value.
   *
   * An indented block already ends in a `return` — that is what
   * `visitLocal_stmts_list` does with a block's last statement. A single-line
   * body does not, and cannot simply be wrapped in one either: `1 => x = 2`
   * emits a declaration, and `return let x = …` is a syntax error. A trailing
   * binding evaluates to the bound name, which is the same rule a function body
   * follows.
   */
  protected caseBody(arm: Switch_caseContext): string {
    const block = arm.stmts_block();
    if (block) return this.visit(block);

    const single = arm.local_stmt_singleline()!;
    const js = this.visit(single);

    const contents = single.local_stmt_content();
    if (contents.length === 1) {
      const bound = this.trailingValueName(contents[0] as any);
      if (bound) return `{ ${js};\nreturn ${bound}; }`;
    }
    return `{ return ${js}; }`;
  }
}
