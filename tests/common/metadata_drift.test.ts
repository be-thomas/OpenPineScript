/**
 * The committed stdlib registry matches what the generator would produce.
 *
 * runtime/v1/stdlib/metadata.ts is generated from the stdlib sources and then
 * committed, and every test loads the committed copy. So a source edit that
 * changes the published surface — a new export, a lost `@getter`, an extra
 * parameter — passes the whole suite and only appears at the next build, as
 * new Pine built-ins nobody reviewed. This makes it appear here instead.
 */
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";

describe("stdlib metadata", () => {
  it("is up to date with the stdlib sources", () => {
    let out = "";
    let failed = false;
    try {
      out = execFileSync("npx", ["ts-node", "scripts/common/generate-metadata.ts", "--check"], {
        encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e: any) {
      failed = true;
      out = String(e.stderr ?? e.message);
    }
    expect(failed, out).toBe(false);
  }, 120_000);
});
