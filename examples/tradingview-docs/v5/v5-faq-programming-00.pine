//@version=5
indicator("Scope demo")

// Global scope
int globalValue = close > open ? 1 : -1

if barstate.isconfirmed
    // Local scope
    int localValue = close > open ? 1 : -1

plot(localValue, "Local variable", chart.fg_color, 2)