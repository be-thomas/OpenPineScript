//@version=5
indicator("Timeframe-dependent MA", overlay = true)
bool tfIsDailyOrGreater = timeframe.in_seconds() >= 86400
float ma = ta.sma(close, 200)
plot(tfIsDailyOrGreater ? ma : na, "MA", color.aqua)