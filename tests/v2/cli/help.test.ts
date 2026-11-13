import { describe, it, expect, vi, afterEach } from "vitest";
import { main } from "../../../mock_run/v2/cli_main";

// Runs main() with the given arguments, capturing stdout/stderr and the exit code.
async function runCli(args: string[]) {
    const out: string[] = [];
    const err: string[] = [];
    const argv = process.argv;
    process.argv = ["node", "openpinescript", ...args];
    vi.spyOn(console, "log").mockImplementation((...a) => { out.push(a.join(" ")); });
    vi.spyOn(console, "error").mockImplementation((...a) => { err.push(a.join(" ")); });
    const exit = vi.spyOn(process, "exit").mockImplementation(((code?: number) => { throw new Error(`exit:${code}`); }) as never);
    let code: number | null = null;
    try { await main(); } catch (e: any) {
        const m = /^exit:(\d+)$/.exec(e.message);
        if (!m) throw e;
        code = Number(m[1]);
    } finally { process.argv = argv; exit.mockRestore(); }
    return { code, stdout: out.join("\n"), stderr: err.join("\n") };
}

afterEach(() => vi.restoreAllMocks());

describe("openpinescript --help", () => {
    for (const flag of ["--help", "-h"]) {
        it(`${flag} prints usage to stdout and exits 0`, async () => {
            const r = await runCli([flag]);
            expect(r.code).toBe(0);
            expect(r.stderr).toBe("");
            expect(r.stdout).toContain("openpinescript <script.pine> --data <data.csv> [flags]");
            expect(r.stdout).toContain("npx openpinescript");
            expect(r.stdout).not.toContain("opsv2");
        });
    }

    it("a missing script prints the error and usage to stderr and exits 1", async () => {
        const r = await runCli(["--data", "x.csv"]);
        expect(r.code).toBe(1);
        expect(r.stdout).toBe("");
        expect(r.stderr).toContain("openpinescript <script.pine>");
    });
});
