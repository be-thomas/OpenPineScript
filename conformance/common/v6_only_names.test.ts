/**
 * Every v6-only name is in v6's view and in no earlier one.
 *
 * Structural, because the per-name tests missed it once: `text.format_bold`
 * is a member of v4's `text` namespace, and the v4 and v5 namespace
 * registries select by ROOT — so it was spellable at v4 and v5 until they
 * were taught to exclude v6 keys.
 */
import { describe, it, expect } from "vitest";
import { viewFor, V6_VIEW } from "../../runtime/v1/stdlib";
import { V6_ONLY_NAMES, V6_ONLY_PARAMS } from "../../runtime/v1/stdlib/renames6";
import { REGISTRY } from "../../runtime/v1/stdlib";

describe("v6-only names", () => {
  it.each(V6_ONLY_NAMES.map(n => [n]))("%s is implemented and spellable at v6", name => {
    expect(V6_VIEW[name], `${name} has no implementation`).toBeDefined();
  });

  it.each(V6_ONLY_NAMES.map(n => [n]))("%s is not spellable at v1–v5", name => {
    for (const v of [1, 2, 3, 4, 5]) expect(viewFor(v)[name], `v${v}`).toBeUndefined();
  });
});

describe("v6-only parameters", () => {
  it.each(Object.entries(V6_ONLY_PARAMS))("%s really has %j", (fname, params) => {
    // A listed parameter the function does not have would gate nothing.
    const entry = REGISTRY[fname];
    expect(entry, fname).toBeDefined();
    for (const p of params) expect(entry.args, `${fname}(${p})`).toContain(p);
  });
});
