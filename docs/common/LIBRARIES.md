# Importing libraries

How `import` behaves on TradingView, and how this engine matches it. Each
TradingView rule says where it comes from: the published documentation, a test
in TradingView's Pine Editor, or libraries published on TradingView (which only
exist because TradingView compiled them).

## TradingView's rules

| Rule | Source |
|---|---|
| Syntax is `import <username>/<libraryName>/<libraryVersion> [as <alias>]`. | [Libraries docs](https://www.tradingview.com/pine-script-docs/concepts/libraries/) |
| The version must be written explicitly; there is no "latest". | Libraries docs |
| Without `as <alias>`, the library's name is its namespace. | Libraries docs |
| A library can import other libraries, or earlier versions of itself. | Libraries docs |
| A library must be published (privately or publicly) before anything can import it. Public scripts can only import public, open-source libraries. | Libraries docs |
| `import` and `library()` exist from Pine v5. A v1–v4 script cannot import anything, and v1–v4 scripts are indicators or strategies, never libraries, so there is nothing in them to import. | Libraries are a v5 feature; no v1–v4 library exists |
| **A v6 script can import a v5 library.** | Pine Editor test, 2026-10-24: `//@version=6` importing `RezzaHmt/Complex/1` (`//@version=5`) resolves; the published v6 library `mickes/PDArrays/2` imports the v5 `mickes/Touched/17` |
| **A v5 script cannot import a v6 library.** TradingView refuses with: *"Cannot import the 'fib' library into a script coded in Pine Script™ v5. Convert the script to Pine Script™ v6 to use this library."* | Pine Editor test, 2026-10-24: `//@version=5` importing `AYEHAN/CryptonianFibMath/1` (`//@version=6`). Among 999 published libraries, none at v5 imports one at v6. |
| A path TradingView does not know: *"The user 'X' does not have a published library titled 'Y'"*. | Pine Editor |
| A missing export, once the import resolves: *"Could not find method or method reference 'alias.name'"* (CE10271). | Pine Editor |
| Usernames may contain `-` and `.` (`S-Schmidt`, `harrell.jordon`), and a part may start with digits (`relax-mop-2fast`). | Published libraries |

In short: **a script can import libraries of its own Pine version or older, never newer.**

## This engine

The host supplies every library's source; the engine never fetches one.

```ts
import { Session, requiredLibraries } from "open-pinescript";

const libraries: Record<string, string> = {};
for (let missing = requiredLibraries(source); missing.length; missing = requiredLibraries(source, libraries)) {
  for (const path of missing) libraries[path] = await fetchLibrarySource(path); // the host's own store
}
const compiled = new Session().compile(source, { libraries });
```

- **Keys** are the path exactly as `import_path().getText()` reads it, which is
  what `importsOf` returns: whitespace between tokens is dropped
  (`me / Lib / 1` → `me/Lib/1`), and a path of any length is reported as
  written, so a host always learns the key the compiler will ask for. The
  engine matches keys exactly. A host may resolve them without regard to case,
  as TradingView does (Zeal Terminal does).
- **v1–v4 hosts:** `importsOf` and `requiredLibraries` return `[]`. Pass
  `{ version }` when the host forces a version (`TranspileOptions.version`).
- **v6 hosts** are not compiled yet (`UnsupportedVersionError`), so "v6 imports
  v5" cannot arise.
- **Imported libraries** are parsed with the v5 grammar whatever their
  `//@version`, and their own imports are followed the same way.
- **Refused, with the library named:** a missing source; a source that is not a
  `library()`; a library that exports nothing; a library that imports itself
  ("the library 'x/Y/1' imports itself") or a cycle ("libraries import each
  other in a cycle: A → B → A"); a chain deeper than 8.
- **Known gap: a v5 script importing a v6 library compiles here**; TradingView
  refuses it (above). Matching TradingView means comparing the importing
  source's `//@version` with the library's and raising TradingView's message.
