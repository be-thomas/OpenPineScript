/**
 * Shared plumbing for the v5 tests.
 *
 * Factored out rather than copied into each file — the v4 suite duplicates its
 * `build()` five times, and the one thing that must not vary is the PROFILE:
 * `new Context()` defaults to v1, so a v5 script run through a default Context
 * gets v1's banned identifiers and v1's stdlib resolution. That mistake is
 * silent, and it made the whole v4 suite pass under the wrong profile once
 * already.
 */
import { compileScript } from "../../transpiler/common";
import { compile, Context } from "../../runtime/v5";

export const HEAD = '//@version=5\nindicator("t")\n';

/** Compiles `src` under its own annotation and returns a runnable pair. */
export function build(src: string) {
  const { js, profile } = compileScript(src);
  const ctx = new Context(profile);
  // `let` → `var` so a re-run of the same body does not hit a redeclaration.
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  return { ctx, exec, js };
}

/** Runs `bars` synthetic bars and returns the per-bar values of `name`. */
export function series(src: string, name: string, bars = 3): any[] {
  const { ctx, exec } = build(src);
  const out: any[] = [];
  for (let i = 0; i < bars; i++) {
    ctx.setBar(i * 86400000, 10, 12, 9, 11, 100);
    exec();
    out.push(ctx.vars.get("opsv2_" + name)?.valueOf());
    ctx.finalizeBar();
  }
  return out;
}

/** The value of `name` after one bar — the common case. */
export function value(src: string, name: string): any {
  return series(src, name, 1)[0];
}
