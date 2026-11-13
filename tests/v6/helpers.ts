/**
 * Shared plumbing for the v6 tests. The same shape as tests/v5/helpers.ts, and
 * for the same reason: the one thing that must not vary is the PROFILE. A v6
 * script run through a default Context gets v1's profile, and every v6
 * behaviour keyed on the profile silently turns off.
 */
import { compileScript } from "../../transpiler/common";
import { compile, Context } from "../../runtime/v6";

export const HEAD = '//@version=6\nindicator("t")\n';

/** Compiles `src` under its own annotation and returns a runnable pair. */
export function build(src: string) {
  const { js, profile } = compileScript(src);
  const ctx = new Context(profile);
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
