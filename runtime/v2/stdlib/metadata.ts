// This file is AUTO-GENERATED. Do not edit manually.
import * as color from "./color";
import * as core from "./core";
import * as strategy from "./strategy";
import * as ta from "./ta";
import * as time from "./time";
import * as ui from "./ui";

export interface StdlibEntry {
    uses_context: boolean;
    args: string[];
    is_getter: boolean;
    is_value: boolean;
    ref: any;
}

export function getGeneratedRegistry(): Record<string, StdlibEntry> {
    return {
      "color.red": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["red"]
      },
      "color.green": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["green"]
      },
      "color.blue": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["blue"]
      },
      "color.orange": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["orange"]
      },
      "color.teal": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["teal"]
      },
      "color.navy": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["navy"]
      },
      "color.white": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["white"]
      },
      "color.black": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["black"]
      },
      "color.gray": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["gray"]
      },
      "color.purple": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["purple"]
      },
      "color.yellow": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["yellow"]
      },
      "color.lime": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["lime"]
      },
      "color.aqua": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["aqua"]
      },
      "color.fuchsia": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["fuchsia"]
      },
      "color.olive": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["olive"]
      },
      "color.maroon": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["maroon"]
      },
      "color.silver": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: color.default["silver"]
      },
      "color.new": {
          uses_context: false,
          args: ["colorStr","transp"],
          is_getter: false,
          is_value: false,
          ref: color.default["new"]
      },
      "color.rgb": {
          uses_context: false,
          args: ["r","g","b","transp"],
          is_getter: false,
          is_value: false,
          ref: color.default["rgb"]
      },
      "color.r": {
          uses_context: false,
          args: ["c"],
          is_getter: false,
          is_value: false,
          ref: color.default["r"]
      },
      "color.g": {
          uses_context: false,
          args: ["c"],
          is_getter: false,
          is_value: false,
          ref: color.default["g"]
      },
      "color.b": {
          uses_context: false,
          args: ["c"],
          is_getter: false,
          is_value: false,
          ref: color.default["b"]
      },
      "color.t": {
          uses_context: false,
          args: ["c"],
          is_getter: false,
          is_value: false,
          ref: color.default["t"]
      },
      "na": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.na
      },
      "nz": {
          uses_context: false,
          args: ["x","y"],
          is_getter: false,
          is_value: false,
          ref: core.nz
      },
      "iff": {
          uses_context: false,
          args: ["cond","t","f"],
          is_getter: false,
          is_value: false,
          ref: core.iff
      },
      "tostring": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.tostring
      },
      "abs": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.abs
      },
      "acos": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.acos
      },
      "asin": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.asin
      },
      "atan": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.atan
      },
      "ceil": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.ceil
      },
      "cos": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.cos
      },
      "exp": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.exp
      },
      "floor": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.floor
      },
      "log": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.log
      },
      "log10": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.log10
      },
      "max": {
          uses_context: false,
          args: ["args"],
          is_getter: false,
          is_value: false,
          ref: core.max
      },
      "min": {
          uses_context: false,
          args: ["args"],
          is_getter: false,
          is_value: false,
          ref: core.min
      },
      "pow": {
          uses_context: false,
          args: ["x","y"],
          is_getter: false,
          is_value: false,
          ref: core.pow
      },
      "round": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.round
      },
      "sign": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.sign
      },
      "sin": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.sin
      },
      "sqrt": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.sqrt
      },
      "tan": {
          uses_context: false,
          args: ["x"],
          is_getter: false,
          is_value: false,
          ref: core.tan
      },
      "avg": {
          uses_context: false,
          args: ["args"],
          is_getter: false,
          is_value: false,
          ref: core.avg
      },
      "strategy.entry": {
          uses_context: true,
          args: ["id","dir","qty"],
          is_getter: false,
          is_value: false,
          ref: strategy.entry
      },
      "strategy.close": {
          uses_context: true,
          args: ["id"],
          is_getter: false,
          is_value: false,
          ref: strategy.close
      },
      "strategy.close_all": {
          uses_context: true,
          args: ["comment"],
          is_getter: false,
          is_value: false,
          ref: strategy.close_all
      },
      "strategy.position_size": {
          uses_context: true,
          args: [],
          is_getter: false,
          is_value: false,
          ref: strategy.position_size
      },
      "strategy.opentrades": {
          uses_context: true,
          args: [],
          is_getter: false,
          is_value: false,
          ref: strategy.opentrades
      },
      "strategy.equity": {
          uses_context: true,
          args: [],
          is_getter: false,
          is_value: false,
          ref: strategy.equity
      },
      "strategy.long": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: strategy.direction["long"]
      },
      "strategy.short": {
          uses_context: false,
          args: [],
          is_getter: false,
          is_value: true,
          ref: strategy.direction["short"]
      },
      "sma": {
          uses_context: true,
          args: ["sourceInput","lengthInput"],
          is_getter: false,
          is_value: false,
          ref: ta.sma
      },
      "ema": {
          uses_context: true,
          args: ["sourceInput","lengthInput"],
          is_getter: false,
          is_value: false,
          ref: ta.ema
      },
      "rma": {
          uses_context: true,
          args: ["sourceInput","lengthInput"],
          is_getter: false,
          is_value: false,
          ref: ta.rma
      },
      "wma": {
          uses_context: true,
          args: ["sourceInput","lengthInput"],
          is_getter: false,
          is_value: false,
          ref: ta.wma
      },
      "vwma": {
          uses_context: true,
          args: ["sourceInput","lengthInput"],
          is_getter: false,
          is_value: false,
          ref: ta.vwma
      },
      "swma": {
          uses_context: true,
          args: ["sourceInput"],
          is_getter: false,
          is_value: false,
          ref: ta.swma
      },
      "trix": {
          uses_context: true,
          args: ["sourceInput","lengthInput"],
          is_getter: false,
          is_value: false,
          ref: ta.trix
      },
      "rsi": {
          uses_context: true,
          args: ["sourceInput","lengthInput"],
          is_getter: false,
          is_value: false,
          ref: ta.rsi
      },
      "macd": {
          uses_context: true,
          args: ["sourceInput","fastLenInput","slowLenInput","sigLenInput"],
          is_getter: false,
          is_value: false,
          ref: ta.macd
      },
      "mom": {
          uses_context: true,
          args: ["sourceInput","lengthInput"],
          is_getter: false,
          is_value: false,
          ref: ta.mom
      },
      "bb": {
          uses_context: true,
          args: ["sourceInput","lengthInput","multInput"],
          is_getter: false,
          is_value: false,
          ref: ta.bb
      },
      "cci": {
          uses_context: true,
          args: ["sourceInput","lengthInput"],
          is_getter: false,
          is_value: false,
          ref: ta.cci
      },
      "cross": {
          uses_context: true,
          args: ["xInput","yInput"],
          is_getter: false,
          is_value: false,
          ref: ta.cross
      },
      "crossover": {
          uses_context: true,
          args: ["xInput","yInput"],
          is_getter: false,
          is_value: false,
          ref: ta.crossover
      },
      "crossunder": {
          uses_context: true,
          args: ["xInput","yInput"],
          is_getter: false,
          is_value: false,
          ref: ta.crossunder
      },
      "highest": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          is_value: false,
          ref: ta.highest
      },
      "lowest": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          is_value: false,
          ref: ta.lowest
      },
      "highestbars": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          is_value: false,
          ref: ta.highestbars
      },
      "lowestbars": {
          uses_context: true,
          args: ["source","length"],
          is_getter: false,
          is_value: false,
          ref: ta.lowestbars
      },
      "stoch": {
          uses_context: true,
          args: ["sourceInput","highInput","lowInput","lengthInput"],
          is_getter: false,
          is_value: false,
          ref: ta.stoch
      },
      "year": {
          uses_context: false,
          args: ["t"],
          is_getter: false,
          is_value: false,
          ref: time.time["year"]
      },
      "month": {
          uses_context: false,
          args: ["t"],
          is_getter: false,
          is_value: false,
          ref: time.time["month"]
      },
      "weekofyear": {
          uses_context: false,
          args: ["t"],
          is_getter: false,
          is_value: false,
          ref: time.time["weekofyear"]
      },
      "dayofmonth": {
          uses_context: false,
          args: ["t"],
          is_getter: false,
          is_value: false,
          ref: time.time["dayofmonth"]
      },
      "dayofweek": {
          uses_context: false,
          args: ["t"],
          is_getter: false,
          is_value: false,
          ref: time.time["dayofweek"]
      },
      "hour": {
          uses_context: false,
          args: ["t"],
          is_getter: false,
          is_value: false,
          ref: time.time["hour"]
      },
      "minute": {
          uses_context: false,
          args: ["t"],
          is_getter: false,
          is_value: false,
          ref: time.time["minute"]
      },
      "second": {
          uses_context: false,
          args: ["t"],
          is_getter: false,
          is_value: false,
          ref: time.time["second"]
      },
      "time": {
          uses_context: true,
          args: [],
          is_getter: false,
          is_value: false,
          ref: time.time["time"]
      },
      "input": {
          uses_context: true,
          args: ["defval","title"],
          is_getter: false,
          is_value: false,
          ref: ui.input
      },
      "plot": {
          uses_context: true,
          args: ["series","title","color","linewidth","style"],
          is_getter: false,
          is_value: false,
          ref: ui.plot
      },
      "plotshape": {
          uses_context: true,
          args: ["series","title","style","location","color"],
          is_getter: false,
          is_value: false,
          ref: ui.plotshape
      },
      "plotchar": {
          uses_context: true,
          args: ["series","title","char","location","color"],
          is_getter: false,
          is_value: false,
          ref: ui.plotchar
      },
      "hline": {
          uses_context: true,
          args: ["price","title","color","linestyle","linewidth"],
          is_getter: false,
          is_value: false,
          ref: ui.hline
      },
      "bgcolor": {
          uses_context: true,
          args: ["color","transp"],
          is_getter: false,
          is_value: false,
          ref: ui.bgcolor
      },
      "barcolor": {
          uses_context: true,
          args: ["color"],
          is_getter: false,
          is_value: false,
          ref: ui.barcolor
      },
      "fill": {
          uses_context: true,
          args: ["plotId1","plotId2","color","title","editable","fillgaps"],
          is_getter: false,
          is_value: false,
          ref: ui.fill
      },
    };
}
