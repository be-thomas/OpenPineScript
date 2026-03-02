
# Security Policy

## Supported Versions

OpenPineScript is currently in active development. We prioritize fixes for the latest version of the `main` branch.

| Version | Supported |
| --- | --- |
| **v0.2.x** (Current) | :white_check_mark: |
| < v0.2.x | :x: |

> **Note:** Once 100% parity with the v2 specification is reached, the stable release will transition to **v2.0.x**.

## Transparency & Reporting

We believe in **100% Transparency**. To maintain community trust and ensure the integrity of the engine, **all issues must be reported publicly** via the [GitHub Issues](https://www.google.com/search?q=https://github.com/be-thomas/OpenPineScript/issues) tab.

### 🚩 What to Report

Please open an issue immediately if you discover any of the following:

1. **Lookahead Leaks:** Any logic that allows the engine to "see" future bars during a backtest. This is a critical failure of algorithmic integrity.
2. **Logic Drift:** Mathematical discrepancies between `OpenPineScript` and TradingView's official v2 output.
3. **System Vulnerabilities:** Any bug that could lead to unauthorized local file access or unexpected code execution by the transpiler.
4. **Memory Leaks:** Issues that cause excessive RAM usage during deep historical backtests (beyond the 5,000-bar limit).

### 🛠️ How to Report

When opening an issue, please use the appropriate **Issue Template** and include:

* The Pine Script v2 code used.
* The expected output (e.g., a TradingView CSV export).
* The actual output from the OpenPineScript engine.
