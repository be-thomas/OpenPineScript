import * as core from "./core";
import time from "./time";
import * as ta from "./ta";
import * as ui from "./ui";
import color from "./color";
import { Context } from "../context";
import * as strategy from "./strategy";



function build_signatures_and_context_awares() {
  const __CONTEXT_AWARE__: string[] = [];
  const __SIGNATURES__: Record<string, string[]> = {};

  /**
   * Helper to merge module metadata into the global registry.
   * @param prefix The namespace prefix (e.g. "ta."). Empty string for globals.
   * @param signatures The SIGNATURES export from the module.
   * @param contextAware The CONTEXT_AWARE export from the module.
   */
  function register(name:string, signatures: Record<string, string[]> | undefined, contextAware: string[] | undefined) {
      // 1. Merge Signatures
      if (signatures) {
          for (const [name, args] of Object.entries(signatures)) {
              __SIGNATURES__[`${name}${name}`] = args;
          }
      }
      // 2. Merge Context Flags
      if (contextAware) {
          for (const name of contextAware) {
              __CONTEXT_AWARE__.push(`${name}${name}`);
          }
      }
  }

  register("", core.__SIGNATURES__, core.__CONTEXT_AWARE__);
  register("", time.__SIGNATURES__, time.__CONTEXT_AWARE__);
  register("", ui.__SIGNATURES__, ui.__CONTEXT_AWARE__);
  register("", ta.__SIGNATURES__, ta.__CONTEXT_AWARE__);
  register("strategy.", strategy.__SIGNATURES__, strategy.__CONTEXT_AWARE__);
  return { __SIGNATURES__, __CONTEXT_AWARE__ };
}

export const { __SIGNATURES__, __CONTEXT_AWARE__ } = build_signatures_and_context_awares();


export function createStdlib(ctx: Context) {
  return {

    // --- Core Functions ---
    "na": core.na,
    "nz": core.nz,
    "iff": core.iff,
    "tostring": core.tostring,
    "abs": core.abs,
    "acos": core.acos,
    "asin": core.asin,
    "atan": core.atan,
    "ceil": core.ceil,
    "cos": core.cos,
    "exp": core.exp,
    "floor": core.floor,
    "log": core.log,
    "log10": core.log10,
    "max": core.max,
    "min": core.min,
    "pow": core.pow,
    "round": core.round,
    "sign": core.sign,
    "sin": core.sin,
    "sqrt": core.sqrt,
    "tan": core.tan,
    "avg": core.avg,

    // --- Time Functions ---
    "year": time.year,
    "month": time.month,
    "weekofyear": time.weekofyear,
    "dayofmonth": time.dayofmonth,
    "dayofweek": time.dayofweek,
    "hour": time.hour,
    "minute": time.minute,
    "second": time.second,
    "time": time.time,
    
    // --- UI Functions ---
    // NO WRAPPERS! ctx.call will inject 'ctx' as the first argument automatically.
    "input": ui.input,
    "plot": ui.plot,
    "plotshape": ui.plotshape,
    "plotchar": ui.plotchar,
    "hline": ui.hline,
    "bgcolor": ui.bgcolor,
    "barcolor": ui.barcolor,
    "fill": ui.fill,
    
    // --- TA Functions ---
    "sma": ta.sma,
    "ema": ta.ema,
    "wma": ta.wma,
    "vwma": ta.vwma,
    "swma": ta.swma,
    "rma": ta.rma,
    "rsi": ta.rsi,
    "macd": ta.macd,
    "cci": ta.cci,
    "mom": ta.mom,
    "stoch": ta.stoch,

    "trix": ta.trix,
    "bb": ta.bb,
    "cross": ta.cross,
    "crossover": ta.crossover,
    "crossunder": ta.crossunder,
    "highest": ta.highest,
    "lowest": ta.lowest,
    "highestbars": ta.highestbars,
    "lowestbars": ta.lowestbars,

    // --- Strategy Namespace ---
    "strategy": {
      "entry": strategy.entry,
      "close": strategy.close,
      "close_all": strategy.close_all,
      
      // Constants are fine (no function call involved)
      "long": strategy.direction.long,
      "short": strategy.direction.short,
      
      // Getters: These are called via ctx.call too, but since they ignore arguments
      // and use the 'ctx' from the closure, they usually work fine. 
      // Ideally, specific strategy functions should also be raw functions accepting (ctx),
      // but keeping these as arrow functions is safe for simple getters.
      "position_size": (/* ctx ignored */) => ctx.position.size,
      "opentrades": (/* ctx ignored */) => ctx.position.size !== 0 ? 1 : 0,
      "equity": (/* ctx ignored */) => ctx.cash + (ctx.position.size * (ctx.close - ctx.position.avgPrice)),
    },

    // -- Color --
    "color": color,
  }

};


