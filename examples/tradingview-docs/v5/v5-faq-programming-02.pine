//@version=5
indicator("Scope demo")

bool isUpCandleWithLargerUpWick = false

if barstate.isconfirmed
    // Local scope 1
    bool upWickIsLarger = (high - math.max(open, close)) > (math.min(open,close) - low)
    if close > open
        // Local scope 2
        bool isUpCandle = true
    isUpCandleWithLargerUpWick := upWickIsLarger and isUpCandle ? true : false

plot(isUpCandleWithLargerUpWick, "Global variable depending on two local variables", chart.fg_color, 2)