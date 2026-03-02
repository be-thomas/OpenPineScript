---
name: Bug report
about: Create a report to help us improve
title: "[BUG]: "
labels: bug, v2-parity
assignees: be-thomas

---

### **Description**

A clear and concise description of the bug (e.g., "SMA calculation differs from TradingView" or "Script crashes on `nz()` function").

### **Pine Script v2 Code**

Please provide the exact script that is causing the issue so it can be tested against the transpiler:

```pinescript
// Paste your //@version=2 code here

```

### **To Reproduce**

Steps to reproduce the behavior:

1. Run the script using `OpenPineScript` version `0.2.x`.
2. Use the following input data (or attach a CSV).
3. Observe the output value at Bar Index `[X]`.

### **Expected vs. Actual Behavior**

* **TradingView Output (Expected):** (e.g., RSI was 45.23)
* **OpenPineScript Output (Actual):** (e.g., RSI was 48.10)

### **Algorithmic Integrity Check**

* [ ] **Lookahead Leak:** Does this bug allow the script to "see" future data during a backtest?
* [ ] **Logic Drift:** Is this a mathematical discrepancy compared to the official v2 spec?

### **Environment**

* **Node.js Version:** (e.g., v20.x)
* **OS:** (e.g., Windows, macOS M1 Max)

### **Additional Context**

Add any other context, such as specific TradingView CSV exports or screenshots of the chart for comparison.
