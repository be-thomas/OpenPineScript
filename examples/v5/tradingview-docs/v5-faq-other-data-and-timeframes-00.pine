//@version=5
indicator("HTF ATR")
float higherTfAtr = request.security(symbol = syminfo.tickerid, timeframe = "1D", expression = ta.atr(14))
plot(higherTfAtr)