//@version=5
indicator("Target TF in string from float minutes", "", true)
float tfInMinInput = input.float(1440, "Minutes in target timeframe (<= 0.0167 [1 sec.])", minval = 0.0167)
// Convert target TF in minutes from input into string.
string targetTfString = timeframe.from_seconds(int(tfInMinInput * 60))
// Fetch target timeframe's close.
float targetTfClose = request.security(syminfo.tickerid, targetTfString, close)
// Plot target timeframe close.
plot(targetTfClose, "Target TF close")
// Display the target timeframe string in a table cell at the chart's top right.
if barstate.islastconfirmedhistory
    var table displayTable = table.new(position.top_right, 1, 1, color.new(color.yellow, 70), color.gray, 1, color.gray, 1)
    table.cell(displayTable, 0, 0, str.format("Target TF (string): {0}", targetTfString), text_color = chart.fg_color)