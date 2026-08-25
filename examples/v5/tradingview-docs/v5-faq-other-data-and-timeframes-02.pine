//@version=5
indicator("Counting intrabars using `request.security_lower_tf()`")

// Count the number of elements in the array of close prices for each LTF bar in the current chart's bar.
int qtyIntrabars = array.size(request.security_lower_tf(syminfo.tickerid, "1D", close))

plot(qtyIntrabars, "qtyIntrabars", style=plot.style_histogram)