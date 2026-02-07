# Transpiler usage

The transpiler turns Pine Script source into JavaScript. Target: **Node.js** (e.g. run with `node:vm` or eval).

## API

### `transpile(source: string): string`

**Location:** `transpiler/v2/transpile.ts`

- **Input:** Pine Script source string.
- **Output:** JavaScript source string (ES-like: `let`, `function`, etc.).
- **Errors:** Throws `Error` with message `Parsing failed with N error(s)` if the source does not parse.

```ts
import { transpile } from "./transpiler/v2/transpile";

const js = transpile("x = 1 + 2 * 3\n");
// => "let opsv2_x = 1 + 2 * 3;\n"
```

## Identifier prefix

All emitted variables and function names are prefixed with **`opsv2_`** (openpinescript v2) to avoid clashing with host globals when the code runs in a sandbox.

- Pine: `x = 1` → JS: `let opsv2_x = 1;`
- Pine: `double(x) => x * 2` → JS: `function opsv2_double(opsv2_x) { return opsv2_x * 2; }`

When you run the JS in a VM, read/write globals and inject helpers using these prefixed names (e.g. `sandbox.opsv2_x`, `sandbox.opsv2_myFunc`).

## Running the emitted JavaScript

### Option 1: Node `vm` (sandbox)

Use a sandbox object as the global; top-level bindings will appear as properties. Use `var` instead of `let` if you want those bindings on the sandbox (the transpiler emits `let`).

```ts
import * as vm from "node:vm";
import { transpile } from "./transpiler/v2/transpile";

const pine = "a = 1\nb = 2\nc = a + b\n";
let js = transpile(pine);
js = js.replace(/\blet\b/g, "var");

const sandbox: Record<string, unknown> = Object.create(null);
vm.createContext(sandbox);
vm.runInContext(js, sandbox);

console.log(sandbox.opsv2_a);  // 1
console.log(sandbox.opsv2_b);  // 2
console.log(sandbox.opsv2_c);  // 3
```

### Option 2: Inject helpers

Provide built-ins or callbacks under the same prefix so Pine code can call them:

```ts
const sandbox: Record<string, unknown> = {
  opsv2_getArr: () => [1, 2, 3],
  opsv2_plot: (x: number, opts?: { opsv2_width?: number }) => { /* ... */ },
};
vm.createContext(sandbox);
vm.runInContext(transpile("[a,b,c] = getArr()\n").replace(/\blet\b/g, "var"), sandbox);
// sandbox.opsv2_a === 1, sandbox.opsv2_b === 2, sandbox.opsv2_c === 3
```

### Option 3: Eval in current scope

For quick experiments you can `eval(transpile(pine))`. Prefixed names will be created in the current scope; avoid name clashes with existing variables.

## Example

```ts
import { transpile } from "./transpiler/v2/transpile";

const pine = `
double(x) => x * 2
y = double(7)
`;
const js = transpile(pine);
console.log(js);
// let opsv2_y = opsv2_double(7);
// function opsv2_double(opsv2_x) { return opsv2_x * 2; }
// (order may vary)

// Run in VM and read result
import * as vm from "node:vm";
let runnable = js.replace(/\blet\b/g, "var");
const sandbox: Record<string, unknown> = Object.create(null);
vm.createContext(sandbox);
vm.runInContext(runnable, sandbox);
console.log(sandbox.opsv2_y);  // 14
```

## Dependencies

- Parser: `parser/v2/parse` (ANTLR-based). Regenerate with `npm run generate:parser` after grammar changes.
- No runtime dependency: emitted JS is plain JavaScript.
