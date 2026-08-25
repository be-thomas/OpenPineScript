//@version=5
indicator("Timeframe to value")

tfInSec  = timeframe.in_seconds()
tfInMin  = tfInSec / 60
tfInHrs  = tfInMin / 60
tfInDays = tfInHrs / 24

if barstate.islastconfirmedhistory
    var table displayTable = table.new(position.top_right, 2, 5, na, color.gray, 1, color.gray, 1)
    table.cell(displayTable, 0, 0, "Original TF string",   text_color = chart.fg_color)
    table.cell(displayTable, 1, 0, "\"" + timeframe.period + "\"", text_color = chart.fg_color)
    table.cell(displayTable, 0, 1, "Timeframe in seconds", text_color = chart.fg_color)
    table.cell(displayTable, 1, 1, str.tostring(tfInSec),  text_color = chart.fg_color)
    table.cell(displayTable, 0, 2, "Timeframe in minutes", text_color = chart.fg_color)
    table.cell(displayTable, 1, 2, str.tostring(tfInMin),  text_color = chart.fg_color)
    table.cell(displayTable, 0, 3, "Timeframe in hours",   text_color = chart.fg_color)
    table.cell(displayTable, 1, 3, str.tostring(tfInHrs),  text_color = chart.fg_color)
    table.cell(displayTable, 0, 4, "Timeframe in days",    text_color = chart.fg_color)
    table.cell(displayTable, 1, 4, str.tostring(tfInDays), text_color = chart.fg_color)