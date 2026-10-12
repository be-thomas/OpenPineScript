//@version=5
indicator("print()", "", true)

print(string txt) =>
    // Create a persistent label
    var label myLabel = label.new(bar_index, na, txt, xloc.bar_index, yloc.price, color(na), label.style_label_left, chart.fg_color, size.large, text.align_left)
    // Update the label's x and y position, and the text it displays.
    label.set_xy(myLabel, bar_index, open)
    label.set_text(myLabel, txt)

if barstate.islast
    print("Timeframe = " + timeframe.period)