//@version=5
indicator("Counting intrabars using `request.security()`")

// @function    Calculates the quantity of 1D bars in a week of trading.
// @returns     (int) The number of intrabars within the current weekly bar up to the current moment.
qtyIntrabars() =>
    var int count = 0
    count := timeframe.change("W") ? 1 : count + 1

int qtyIntrabars = request.security(syminfo.tickerid, "1D", qtyIntrabars())

plot(qtyIntrabars, "qtyIntrabars", style=plot.style_histogram)