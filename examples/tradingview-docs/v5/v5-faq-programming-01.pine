//@version=5
indicator("Scope demo")

// Global scope
int globalValue = close > open ? 1 : -1
int localValue  = na

if barstate.isconfirmed
    // Local scope
    localValue := close > open ? 1 : -1

plot(localValue, "Local variable", chart.fg_color, 2)