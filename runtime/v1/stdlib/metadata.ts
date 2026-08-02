// This file is AUTO-GENERATED. Do not edit manually.
import * as arrays from "./arrays";
import * as barmerge from "./barmerge";
import * as barstate from "./barstate";
import * as chart from "./chart";
import * as color from "./color";
import * as core from "./core";
import * as drawings from "./drawings";
import * as input from "./input";
import * as mtf from "./mtf";
import * as renames from "./renames";
import * as scale from "./scale";
import * as sources from "./sources";
import * as strategy from "./strategy";
import * as ta from "./ta";
import * as time from "./time";
import * as ui from "./ui";

export interface PineType {
    kind: "scalar" | "series" | "tuple";
    type?: string;
    itemTypes?: PineType[];
}

export interface StdlibEntry {
    uses_context: boolean;
    args: string[];
    is_getter: boolean;
    returns: PineType;
    is_value: boolean;
    ref: any;
}

export function getGeneratedRegistry(): Record<string, StdlibEntry> {
    return {
      "array.new_float": {
          uses_context: false,
          args: ["size","initial_value"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["new_float"]
      },
      "array.new_int": {
          uses_context: false,
          args: ["size","initial_value"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["new_int"]
      },
      "array.new_bool": {
          uses_context: false,
          args: ["size","initial_value"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["new_bool"]
      },
      "array.new_string": {
          uses_context: false,
          args: ["size","initial_value"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["new_string"]
      },
      "array.new_color": {
          uses_context: false,
          args: ["size","initial_value"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["new_color"]
      },
      "array.new_line": {
          uses_context: false,
          args: ["size","initial_value"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["new_line"]
      },
      "array.new_label": {
          uses_context: false,
          args: ["size","initial_value"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["new_label"]
      },
      "array.new_box": {
          uses_context: false,
          args: ["size","initial_value"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["new_box"]
      },
      "array.new_table": {
          uses_context: false,
          args: ["size","initial_value"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["new_table"]
      },
      "array.from": {
          uses_context: false,
          args: ["items"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["from"]
      },
      "array.get": {
          uses_context: false,
          args: ["id","index"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["get"]
      },
      "array.set": {
          uses_context: false,
          args: ["id","index","value"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["set"]
      },
      "array.size": {
          uses_context: false,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["size"]
      },
      "array.push": {
          uses_context: false,
          args: ["id","value"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["push"]
      },
      "array.pop": {
          uses_context: false,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["pop"]
      },
      "array.shift": {
          uses_context: false,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["shift"]
      },
      "array.unshift": {
          uses_context: false,
          args: ["id","value"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["unshift"]
      },
      "array.insert": {
          uses_context: false,
          args: ["id","index","value"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["insert"]
      },
      "array.remove": {
          uses_context: false,
          args: ["id","index"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["remove"]
      },
      "array.clear": {
          uses_context: false,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["clear"]
      },
      "array.fill": {
          uses_context: false,
          args: ["id","value","index_from","index_to"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["fill"]
      },
      "array.copy": {
          uses_context: false,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["copy"]
      },
      "array.slice": {
          uses_context: false,
          args: ["id","index_from","index_to"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["slice"]
      },
      "array.concat": {
          uses_context: false,
          args: ["id1","id2"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["concat"]
      },
      "array.reverse": {
          uses_context: false,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["reverse"]
      },
      "array.sort": {
          uses_context: false,
          args: ["id","order"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["sort"]
      },
      "array.includes": {
          uses_context: false,
          args: ["id","value"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["includes"]
      },
      "array.indexof": {
          uses_context: false,
          args: ["id","value"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["indexof"]
      },
      "array.lastindexof": {
          uses_context: false,
          args: ["id","value"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["lastindexof"]
      },
      "array.sum": {
          uses_context: false,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["sum"]
      },
      "array.avg": {
          uses_context: false,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["avg"]
      },
      "array.min": {
          uses_context: false,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["min"]
      },
      "array.max": {
          uses_context: false,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["max"]
      },
      "array.range": {
          uses_context: false,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["range"]
      },
      "array.median": {
          uses_context: false,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["median"]
      },
      "array.mode": {
          uses_context: false,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["mode"]
      },
      "array.variance": {
          uses_context: false,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["variance"]
      },
      "array.stdev": {
          uses_context: false,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["stdev"]
      },
      "array.covariance": {
          uses_context: false,
          args: ["id1","id2"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["covariance"]
      },
      "array.join": {
          uses_context: false,
          args: ["id","separator"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: arrays.array["join"]
      },
      "order.ascending": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: arrays.order["ascending"]
      },
      "order.descending": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: arrays.order["descending"]
      },
      "barmerge.lookahead_on": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: barmerge.lookahead_on
      },
      "barmerge.lookahead_off": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: barmerge.lookahead_off
      },
      "barmerge.gaps_off": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: barmerge.gaps_off
      },
      "barmerge.gaps_on": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: barmerge.gaps_on
      },
      "barstate.ishistory": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: barstate.ishistory
      },
      "barstate.isrealtime": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: barstate.isrealtime
      },
      "barstate.isnew": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: barstate.isnew
      },
      "barstate.islast": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: barstate.islast
      },
      "period": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"The resolution string."},
          is_value: false,
          ref: chart.period
      },
      "interval": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"Minutes per bar, 0 for daily and above."},
          is_value: false,
          ref: chart.interval
      },
      "isintraday": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: chart.isintraday
      },
      "isdaily": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: chart.isdaily
      },
      "isweekly": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: chart.isweekly
      },
      "ismonthly": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: chart.ismonthly
      },
      "ticker": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: chart.ticker
      },
      "timenow": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"UNIX timestamp in milliseconds."},
          is_value: false,
          ref: chart.timenow
      },
      "heikinashi": {
          uses_context: false,
          args: ["symbol"],
          is_getter: false,
          returns: {"kind":"scalar","type":"The symbol, marked for Heikin-Ashi transformation."},
          is_value: false,
          ref: chart.heikinashi
      },
      "sunday": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: chart.sunday
      },
      "monday": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: chart.monday
      },
      "tuesday": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: chart.tuesday
      },
      "wednesday": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: chart.wednesday
      },
      "thursday": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: chart.thursday
      },
      "friday": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: chart.friday
      },
      "saturday": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: chart.saturday
      },
      "HEIKINASHI_PREFIX": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: chart.HEIKINASHI_PREFIX
      },
      "color.new": {
          uses_context: false,
          args: ["colorStr","transp"],
          is_getter: false,
          returns: {"kind":"scalar","type":"color"},
          is_value: false,
          ref: (color.default || color)["new"]
      },
      "color.rgb": {
          uses_context: false,
          args: ["r","g","b","transp"],
          is_getter: false,
          returns: {"kind":"scalar","type":"color"},
          is_value: false,
          ref: (color.default || color)["rgb"]
      },
      "color.r": {
          uses_context: false,
          args: ["c"],
          is_getter: false,
          returns: {"kind":"scalar","type":"color"},
          is_value: false,
          ref: (color.default || color)["r"]
      },
      "color.g": {
          uses_context: false,
          args: ["c"],
          is_getter: false,
          returns: {"kind":"scalar","type":"color"},
          is_value: false,
          ref: (color.default || color)["g"]
      },
      "color.b": {
          uses_context: false,
          args: ["c"],
          is_getter: false,
          returns: {"kind":"scalar","type":"color"},
          is_value: false,
          ref: (color.default || color)["b"]
      },
      "color.t": {
          uses_context: false,
          args: ["c"],
          is_getter: false,
          returns: {"kind":"scalar","type":"color"},
          is_value: false,
          ref: (color.default || color)["t"]
      },
      "na": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.na
      },
      "nz": {
          uses_context: false,
          args: ["x","y"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.nz
      },
      "iff": {
          uses_context: false,
          args: ["cond","t","f"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.iff
      },
      "safe_add": {
          uses_context: false,
          args: ["a","b"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.safe_add
      },
      "safe_sub": {
          uses_context: false,
          args: ["a","b"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.safe_sub
      },
      "tostring": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.tostring
      },
      "abs": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.abs
      },
      "acos": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.acos
      },
      "asin": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.asin
      },
      "atan": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.atan
      },
      "ceil": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.ceil
      },
      "cos": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.cos
      },
      "exp": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.exp
      },
      "floor": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.floor
      },
      "log": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.log
      },
      "log10": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.log10
      },
      "max": {
          uses_context: false,
          args: ["args"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.max
      },
      "min": {
          uses_context: false,
          args: ["args"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.min
      },
      "pow": {
          uses_context: false,
          args: ["x","y"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.pow
      },
      "round": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.round
      },
      "sign": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.sign
      },
      "sin": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.sin
      },
      "sqrt": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.sqrt
      },
      "tan": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.tan
      },
      "avg": {
          uses_context: false,
          args: ["args"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: core.avg
      },
      "red": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.red
      },
      "green": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.green
      },
      "blue": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.blue
      },
      "orange": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.orange
      },
      "teal": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.teal
      },
      "navy": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.navy
      },
      "white": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.white
      },
      "black": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.black
      },
      "gray": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.gray
      },
      "purple": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.purple
      },
      "yellow": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.yellow
      },
      "lime": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.lime
      },
      "aqua": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.aqua
      },
      "fuchsia": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.fuchsia
      },
      "olive": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.olive
      },
      "maroon": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.maroon
      },
      "silver": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: core.silver
      },
      "line.new": {
          uses_context: true,
          args: ["x1","y1","x2","y2","xloc","extend","color","style","width"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["new"]
      },
      "line.set_x1": {
          uses_context: true,
          args: ["id","x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["set_x1"]
      },
      "line.set_y1": {
          uses_context: true,
          args: ["id","y"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["set_y1"]
      },
      "line.set_x2": {
          uses_context: true,
          args: ["id","x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["set_x2"]
      },
      "line.set_y2": {
          uses_context: true,
          args: ["id","y"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["set_y2"]
      },
      "line.set_width": {
          uses_context: true,
          args: ["id","width"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["set_width"]
      },
      "line.set_xloc": {
          uses_context: true,
          args: ["id","xloc"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["set_xloc"]
      },
      "line.set_extend": {
          uses_context: true,
          args: ["id","extend"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["set_extend"]
      },
      "line.set_color": {
          uses_context: true,
          args: ["id","color"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["set_color"]
      },
      "line.set_style": {
          uses_context: true,
          args: ["id","style"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["set_style"]
      },
      "line.get_x1": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["get_x1"]
      },
      "line.get_y1": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["get_y1"]
      },
      "line.get_x2": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["get_x2"]
      },
      "line.get_y2": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["get_y2"]
      },
      "line.set_xy1": {
          uses_context: true,
          args: ["id","x","y"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["set_xy1"]
      },
      "line.set_xy2": {
          uses_context: true,
          args: ["id","x","y"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["set_xy2"]
      },
      "line.get_price": {
          uses_context: true,
          args: ["id","x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["get_price"]
      },
      "line.delete": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["delete"]
      },
      "line.copy": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.line["copy"]
      },
      "line.style_solid": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.line["style_solid"]
      },
      "line.style_dotted": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.line["style_dotted"]
      },
      "line.style_dashed": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.line["style_dashed"]
      },
      "line.style_arrow_left": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.line["style_arrow_left"]
      },
      "line.style_arrow_right": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.line["style_arrow_right"]
      },
      "line.style_arrow_both": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.line["style_arrow_both"]
      },
      "label.new": {
          uses_context: true,
          args: ["x","y","text","xloc","yloc","color","style","textcolor","size","textalign","tooltip"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["new"]
      },
      "label.set_x": {
          uses_context: true,
          args: ["id","x"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["set_x"]
      },
      "label.set_y": {
          uses_context: true,
          args: ["id","y"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["set_y"]
      },
      "label.set_text": {
          uses_context: true,
          args: ["id","text"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["set_text"]
      },
      "label.set_xloc": {
          uses_context: true,
          args: ["id","xloc"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["set_xloc"]
      },
      "label.set_yloc": {
          uses_context: true,
          args: ["id","yloc"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["set_yloc"]
      },
      "label.set_color": {
          uses_context: true,
          args: ["id","color"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["set_color"]
      },
      "label.set_style": {
          uses_context: true,
          args: ["id","style"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["set_style"]
      },
      "label.set_textcolor": {
          uses_context: true,
          args: ["id","textcolor"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["set_textcolor"]
      },
      "label.set_size": {
          uses_context: true,
          args: ["id","size"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["set_size"]
      },
      "label.set_textalign": {
          uses_context: true,
          args: ["id","textalign"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["set_textalign"]
      },
      "label.set_tooltip": {
          uses_context: true,
          args: ["id","tooltip"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["set_tooltip"]
      },
      "label.get_x": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["get_x"]
      },
      "label.get_y": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["get_y"]
      },
      "label.get_text": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["get_text"]
      },
      "label.set_xy": {
          uses_context: true,
          args: ["id","x","y"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["set_xy"]
      },
      "label.delete": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["delete"]
      },
      "label.copy": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.label["copy"]
      },
      "label.style_none": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_none"]
      },
      "label.style_xcross": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_xcross"]
      },
      "label.style_cross": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_cross"]
      },
      "label.style_triangleup": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_triangleup"]
      },
      "label.style_triangledown": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_triangledown"]
      },
      "label.style_flag": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_flag"]
      },
      "label.style_circle": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_circle"]
      },
      "label.style_arrowup": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_arrowup"]
      },
      "label.style_arrowdown": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_arrowdown"]
      },
      "label.style_label_up": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_label_up"]
      },
      "label.style_label_down": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_label_down"]
      },
      "label.style_label_left": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_label_left"]
      },
      "label.style_label_right": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_label_right"]
      },
      "label.style_label_lower_left": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_label_lower_left"]
      },
      "label.style_label_lower_right": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_label_lower_right"]
      },
      "label.style_label_upper_left": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_label_upper_left"]
      },
      "label.style_label_upper_right": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_label_upper_right"]
      },
      "label.style_label_center": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_label_center"]
      },
      "label.style_square": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_square"]
      },
      "label.style_diamond": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.label["style_diamond"]
      },
      "box.new": {
          uses_context: true,
          args: ["left","top","right","bottom","border_color","border_width","border_style","extend","bgcolor"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["new"]
      },
      "box.set_left": {
          uses_context: true,
          args: ["id","left"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["set_left"]
      },
      "box.set_top": {
          uses_context: true,
          args: ["id","top"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["set_top"]
      },
      "box.set_right": {
          uses_context: true,
          args: ["id","right"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["set_right"]
      },
      "box.set_bottom": {
          uses_context: true,
          args: ["id","bottom"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["set_bottom"]
      },
      "box.set_border_width": {
          uses_context: true,
          args: ["id","width"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["set_border_width"]
      },
      "box.set_border_color": {
          uses_context: true,
          args: ["id","color"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["set_border_color"]
      },
      "box.set_border_style": {
          uses_context: true,
          args: ["id","style"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["set_border_style"]
      },
      "box.set_extend": {
          uses_context: true,
          args: ["id","extend"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["set_extend"]
      },
      "box.set_bgcolor": {
          uses_context: true,
          args: ["id","bgcolor"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["set_bgcolor"]
      },
      "box.get_left": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["get_left"]
      },
      "box.get_top": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["get_top"]
      },
      "box.get_right": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["get_right"]
      },
      "box.get_bottom": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["get_bottom"]
      },
      "box.set_lefttop": {
          uses_context: true,
          args: ["id","left","top"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["set_lefttop"]
      },
      "box.set_rightbottom": {
          uses_context: true,
          args: ["id","right","bottom"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["set_rightbottom"]
      },
      "box.delete": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["delete"]
      },
      "box.copy": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.box["copy"]
      },
      "box.style_solid": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.box["style_solid"]
      },
      "box.style_dotted": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.box["style_dotted"]
      },
      "box.style_dashed": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.box["style_dashed"]
      },
      "table.new": {
          uses_context: true,
          args: ["position","columns","rows","bgcolor","frame_color","frame_width","border_color","border_width"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.table["new"]
      },
      "table.cell": {
          uses_context: true,
          args: ["table_id","column","row","text","width","height","text_color","text_halign","text_valign","text_size","bgcolor"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.table["cell"]
      },
      "table.set_cell_text": {
          uses_context: true,
          args: ["table_id","column","row","text"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.table["set_cell_text"]
      },
      "table.set_position": {
          uses_context: true,
          args: ["id","position"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.table["set_position"]
      },
      "table.set_bgcolor": {
          uses_context: true,
          args: ["id","bgcolor"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.table["set_bgcolor"]
      },
      "table.clear": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.table["clear"]
      },
      "table.delete": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: drawings.table["delete"]
      },
      "xloc.bar_index": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.xloc["bar_index"]
      },
      "xloc.bar_time": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.xloc["bar_time"]
      },
      "yloc.price": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.yloc["price"]
      },
      "yloc.abovebar": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.yloc["abovebar"]
      },
      "yloc.belowbar": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.yloc["belowbar"]
      },
      "extend.none": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.extend["none"]
      },
      "extend.right": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.extend["right"]
      },
      "extend.left": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.extend["left"]
      },
      "extend.both": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.extend["both"]
      },
      "position.top_left": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.position["top_left"]
      },
      "position.top_center": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.position["top_center"]
      },
      "position.top_right": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.position["top_right"]
      },
      "position.middle_left": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.position["middle_left"]
      },
      "position.middle_center": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.position["middle_center"]
      },
      "position.middle_right": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.position["middle_right"]
      },
      "position.bottom_left": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.position["bottom_left"]
      },
      "position.bottom_center": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.position["bottom_center"]
      },
      "position.bottom_right": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.position["bottom_right"]
      },
      "text.align_left": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.text["align_left"]
      },
      "text.align_center": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.text["align_center"]
      },
      "text.align_right": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.text["align_right"]
      },
      "text.align_top": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.text["align_top"]
      },
      "text.align_bottom": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: drawings.text["align_bottom"]
      },
      "input": {
          uses_context: true,
          args: ["defval","title","type"],
          is_getter: false,
          returns: {"kind":"series","type":"float (or int/bool depending on type)"},
          is_value: false,
          ref: input.input
      },
      "integer": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: input.integer
      },
      "float": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: input.float
      },
      "bool": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: input.bool
      },
      "string": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: input.string
      },
      "source": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: input.source
      },
      "resolution": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: input.resolution
      },
      "session": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: input.session
      },
      "symbol": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: input.symbol
      },
      "security": {
          uses_context: true,
          args: ["symbol","resolution","expression","gaps","lookahead"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: mtf.security
      },
      "V4_ONLY_NAMESPACES": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: renames.V4_ONLY_NAMESPACES
      },
      "V4_RENAMES": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: renames.V4_RENAMES
      },
      "V4_REMOVED": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: renames.V4_REMOVED
      },
      "scale.right": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: scale.right
      },
      "scale.left": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: scale.left
      },
      "scale.none": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: scale.none
      },
      "hl2": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: sources.hl2
      },
      "hlc3": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: sources.hlc3
      },
      "ohlc4": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: sources.ohlc4
      },
      "strategy.order": {
          uses_context: true,
          args: ["id","dir","qty","limit","stop","oca_name","oca_type"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.order
      },
      "strategy.entry": {
          uses_context: true,
          args: ["id","dir","qty","overridePrice"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.entry
      },
      "strategy.close": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.close
      },
      "strategy.close_all": {
          uses_context: true,
          args: ["comment"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.close_all
      },
      "strategy.cancel": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.cancel
      },
      "strategy.cancel_all": {
          uses_context: true,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.cancel_all
      },
      "strategy.exit": {
          uses_context: true,
          args: ["id","from_entry","qty","profit","limit","loss","stop","oca_name"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.exit
      },
      "strategy.processPendingOrders": {
          uses_context: true,
          args: ["high","low"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.processPendingOrders
      },
      "strategy.position_size": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.position_size
      },
      "strategy.opentrades": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.opentrades
      },
      "strategy.equity": {
          uses_context: true,
          args: [],
          is_getter: true,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.equity
      },
      "strategy.commission.percent": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: strategy.commission["percent"]
      },
      "strategy.commission.cash_per_contract": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: strategy.commission["cash_per_contract"]
      },
      "strategy.commission.cash_per_order": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: strategy.commission["cash_per_order"]
      },
      "strategy.direction.long": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: strategy.direction["long"]
      },
      "strategy.direction.short": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: strategy.direction["short"]
      },
      "strategy.oca.cancel": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: strategy.oca["cancel"]
      },
      "strategy.oca.reduce": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: strategy.oca["reduce"]
      },
      "strategy.oca.none": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: strategy.oca["none"]
      },
      "strategy.risk.max_intraday_loss": {
          uses_context: true,
          args: ["value","type"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.risk["max_intraday_loss"]
      },
      "strategy.risk.max_intraday_filled_orders": {
          uses_context: true,
          args: ["count"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.risk["max_intraday_filled_orders"]
      },
      "strategy.risk.max_drawdown": {
          uses_context: true,
          args: ["value","type"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.risk["max_drawdown"]
      },
      "strategy.risk.max_cons_loss_days": {
          uses_context: true,
          args: ["count"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.risk["max_cons_loss_days"]
      },
      "strategy.risk.max_position_size": {
          uses_context: true,
          args: ["size"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.risk["max_position_size"]
      },
      "strategy.risk.allow_entry_in": {
          uses_context: true,
          args: ["dir"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: strategy.risk["allow_entry_in"]
      },
      "strategy.long": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: strategy.long
      },
      "strategy.short": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: strategy.short
      },
      "sma": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.sma
      },
      "ema": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.ema
      },
      "rma": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.rma
      },
      "wma": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.wma
      },
      "vwma": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.vwma
      },
      "swma": {
          uses_context: true,
          args: ["source"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.swma
      },
      "trix": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.trix
      },
      "rsi": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.rsi
      },
      "macd": {
          uses_context: true,
          args: ["source","fastLen","slowLen","sigLen"],
          is_getter: false,
          returns: {"kind":"tuple","itemTypes":[{"kind":"series","type":"series float"},{"kind":"series","type":"series float"},{"kind":"series","type":"series float"}]},
          is_value: false,
          ref: ta.macd
      },
      "mom": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.mom
      },
      "bb": {
          uses_context: true,
          args: ["source","length","mult"],
          is_getter: false,
          returns: {"kind":"tuple","itemTypes":[{"kind":"series","type":"series float"},{"kind":"series","type":"series float"},{"kind":"series","type":"series float"}]},
          is_value: false,
          ref: ta.bb
      },
      "cci": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.cci
      },
      "cross": {
          uses_context: true,
          args: ["x","y"],
          is_getter: false,
          returns: {"kind":"scalar","type":"bool"},
          is_value: false,
          ref: ta.cross
      },
      "crossover": {
          uses_context: true,
          args: ["x","y"],
          is_getter: false,
          returns: {"kind":"scalar","type":"bool"},
          is_value: false,
          ref: ta.crossover
      },
      "crossunder": {
          uses_context: true,
          args: ["x","y"],
          is_getter: false,
          returns: {"kind":"scalar","type":"bool"},
          is_value: false,
          ref: ta.crossunder
      },
      "highest": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.highest
      },
      "lowest": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.lowest
      },
      "highestbars": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"int"},
          is_value: false,
          ref: ta.highestbars
      },
      "lowestbars": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"int"},
          is_value: false,
          ref: ta.lowestbars
      },
      "stoch": {
          uses_context: true,
          args: ["source","high","low","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.stoch
      },
      "valuewhen": {
          uses_context: true,
          args: ["condition","source","occurrence"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.valuewhen
      },
      "barssince": {
          uses_context: true,
          args: ["condition"],
          is_getter: false,
          returns: {"kind":"series","type":"int"},
          is_value: false,
          ref: ta.barssince
      },
      "atr": {
          uses_context: true,
          args: ["length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.atr
      },
      "vwap": {
          uses_context: true,
          args: ["source"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.vwap
      },
      "linreg": {
          uses_context: true,
          args: ["source","length","offset"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.linreg
      },
      "sar": {
          uses_context: true,
          args: ["start","inc","max"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.sar
      },
      "cum": {
          uses_context: true,
          args: ["source"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.cum
      },
      "roc": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.roc
      },
      "change": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.change
      },
      "falling": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"bool"},
          is_value: false,
          ref: ta.falling
      },
      "rising": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"bool"},
          is_value: false,
          ref: ta.rising
      },
      "dev": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.dev
      },
      "variance": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.variance
      },
      "stdev": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.stdev
      },
      "correlation": {
          uses_context: true,
          args: ["source1","source2","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.correlation
      },
      "percentrank": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.percentrank
      },
      "wpr": {
          uses_context: true,
          args: ["length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.wpr
      },
      "mfi": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.mfi
      },
      "alma": {
          uses_context: true,
          args: ["source","length","offset","sigma"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.alma
      },
      "cog": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.cog
      },
      "tsi": {
          uses_context: true,
          args: ["source","longLen","shortLen"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.tsi
      },
      "pivothigh": {
          uses_context: true,
          args: ["source","leftbars","rightbars"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.pivothigh
      },
      "pivotlow": {
          uses_context: true,
          args: ["source","leftbars","rightbars"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.pivotlow
      },
      "tr": {
          uses_context: true,
          args: [],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.tr
      },
      "sum": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.sum
      },
      "fixnan": {
          uses_context: true,
          args: ["x"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.fixnan
      },
      "percentile_nearest_rank": {
          uses_context: true,
          args: ["source","length","percentage"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.percentile_nearest_rank
      },
      "percentile_linear_interpolation": {
          uses_context: true,
          args: ["source","length","percentage"],
          is_getter: false,
          returns: {"kind":"series","type":"float"},
          is_value: false,
          ref: ta.percentile_linear_interpolation
      },
      "timestamp": {
          uses_context: false,
          args: ["year","month","day","hour","minute","second"],
          is_getter: false,
          returns: {"kind":"scalar","type":"UNIX timestamp in milliseconds."},
          is_value: false,
          ref: time.timestamp
      },
      "year": {
          uses_context: false,
          args: ["t"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: time.year
      },
      "month": {
          uses_context: false,
          args: ["t"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: time.month
      },
      "dayofmonth": {
          uses_context: false,
          args: ["t"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: time.dayofmonth
      },
      "dayofweek": {
          uses_context: false,
          args: ["t"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: time.dayofweek
      },
      "hour": {
          uses_context: false,
          args: ["t"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: time.hour
      },
      "minute": {
          uses_context: false,
          args: ["t"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: time.minute
      },
      "second": {
          uses_context: false,
          args: ["t"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: time.second
      },
      "weekofyear": {
          uses_context: false,
          args: ["t"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: time.weekofyear
      },
      "time": {
          uses_context: true,
          args: ["resolution","session"],
          is_getter: false,
          returns: {"kind":"scalar","type":"float} The bar's UNIX time in ms, or na."},
          is_value: false,
          ref: time.time
      },
      "plot": {
          uses_context: true,
          args: ["series","title","color","linewidth","style"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: ui.plot
      },
      "plotshape": {
          uses_context: true,
          args: ["series","title","style","location","color"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: ui.plotshape
      },
      "plotchar": {
          uses_context: true,
          args: ["series","title","char","location","color"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: ui.plotchar
      },
      "hline": {
          uses_context: true,
          args: ["price","title","color","linestyle","linewidth"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: ui.hline
      },
      "plotbar": {
          uses_context: true,
          args: ["open","high","low","close","title","color"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: ui.plotbar
      },
      "plotcandle": {
          uses_context: true,
          args: ["open","high","low","close","title","color"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: ui.plotcandle
      },
      "plotarrow": {
          uses_context: true,
          args: ["series","title","colorup","colordown","minheight","maxheight"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: ui.plotarrow
      },
      "bgcolor": {
          uses_context: true,
          args: ["color","transp"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: ui.bgcolor
      },
      "barcolor": {
          uses_context: true,
          args: ["color"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: ui.barcolor
      },
      "fill": {
          uses_context: true,
          args: ["plotId1","plotId2","color","title","editable","fillgaps"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: ui.fill
      },
      "color": {
          uses_context: false,
          args: ["col","transp"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: ui.color
      },
      "tickerid": {
          uses_context: false,
          args: ["prefix","ticker"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: ui.tickerid
      },
      "alertcondition": {
          uses_context: true,
          args: ["condition","title","message"],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: false,
          ref: ui.alertcondition
      },
      "location.abovebar": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.location["abovebar"]
      },
      "location.belowbar": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.location["belowbar"]
      },
      "location.top": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.location["top"]
      },
      "location.bottom": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.location["bottom"]
      },
      "location.absolute": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.location["absolute"]
      },
      "shape.xcross": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.shape["xcross"]
      },
      "shape.cross": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.shape["cross"]
      },
      "shape.triangleup": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.shape["triangleup"]
      },
      "shape.triangledown": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.shape["triangledown"]
      },
      "shape.flag": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.shape["flag"]
      },
      "shape.circle": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.shape["circle"]
      },
      "shape.arrowup": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.shape["arrowup"]
      },
      "shape.arrowdown": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.shape["arrowdown"]
      },
      "shape.labelup": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.shape["labelup"]
      },
      "shape.labeldown": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.shape["labeldown"]
      },
      "shape.square": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.shape["square"]
      },
      "shape.diamond": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.shape["diamond"]
      },
      "size.auto": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.size["auto"]
      },
      "size.tiny": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.size["tiny"]
      },
      "size.small": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.size["small"]
      },
      "size.normal": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.size["normal"]
      },
      "size.large": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.size["large"]
      },
      "size.huge": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.size["huge"]
      },
      "currency.NONE": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.currency["NONE"]
      },
      "currency.USD": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.currency["USD"]
      },
      "currency.EUR": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.currency["EUR"]
      },
      "currency.GBP": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.currency["GBP"]
      },
      "currency.JPY": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.currency["JPY"]
      },
      "currency.CHF": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.currency["CHF"]
      },
      "currency.AUD": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.currency["AUD"]
      },
      "currency.CAD": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.currency["CAD"]
      },
      "currency.NZD": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.currency["NZD"]
      },
      "currency.HKD": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.currency["HKD"]
      },
      "currency.SGD": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.currency["SGD"]
      },
      "currency.INR": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.currency["INR"]
      },
      "currency.RUB": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.currency["RUB"]
      },
      "currency.ZAR": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.currency["ZAR"]
      },
      "currency.TRY": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.currency["TRY"]
      },
      "color_red": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.color_red
      },
      "color_green": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.color_green
      },
      "color_blue": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.color_blue
      },
      "color_orange": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.color_orange
      },
      "color_teal": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.color_teal
      },
      "color_navy": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.color_navy
      },
      "color_white": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.color_white
      },
      "color_black": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.color_black
      },
      "color_gray": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.color_gray
      },
      "color_purple": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.color_purple
      },
      "line": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.line
      },
      "histogram": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.histogram
      },
      "columns": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.columns
      },
      "circles": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.circles
      },
      "areabr": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.areabr
      },
      "linebr": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.linebr
      },
      "stepline": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.stepline
      },
      "area": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.area
      },
      "dotted": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.dotted
      },
      "dashed": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.dashed
      },
      "solid": {
          uses_context: false,
          args: [],
          is_getter: false,
          returns: {"kind":"scalar","type":"any"},
          is_value: true,
          ref: ui.solid
      },
    };
}
