import { core } from "./core";
import * as ta from "./ta";
import { time } from "./time";
import * as ui from "./ui";
import { Context } from "../context";
import * as strategy from "./strategy";

export function createStdlib(ctx: Context) {
  return {
    ...core,
    ...time,
    
    // ui functions
    "input": (defval: any, title?: string, type?: string, minval?: number, maxval?: number) => ui.input(ctx, defval, title, type, minval, maxval),
    "plot": (series: number, title: string = "Plot", color?: string, linewidth?: number, style?: any) => ui.plot(ctx, series, title, color, linewidth, style),
    "plotshape": (series: any, title: string = "Shape", style?: any, location?: any, color?: string) => ui.plotshape(ctx, series, title, style, location, color),
    "plotchar": (series: any, title: string = "Char", char?: string, location?: any, color?: string) => ui.plotchar(ctx, series, title, char, location, color),
    "hline": (price: number, title: string = "HLine", color?: string) => ui.hline(ctx, price, title, color),
    "bgcolor": (color: string, transp?: number) => ui.bgcolor(ctx, color, transp),
    "barcolor": (color: string) => ui.barcolor(ctx, color),
    "fill": (plot1: any, plot2: any, color?: string) => ui.fill(ctx, plot1, plot2, color),
    
    // ta functions
    "sma": (source: number, length: number) => ta.sma(ctx, source, length),
    "ema": (source: number, length: number) => ta.ema(ctx, source, length),
    "wma": (source: number, length: number) => ta.wma(ctx, source, length),
    "vwma": (source: number, length: number) => ta.vwma(ctx, source, length),
    "swma": (source: number) => ta.swma(ctx, source),
    "rma": (source: number, length: number) => ta.rma(ctx, source, length),
    "rsi": (x: number, y: number) => ta.rsi(ctx, x, y),
    "macd": (source: number, fast: number, slow: number, signal: number) => ta.macd(ctx, source, fast, slow, signal),
    "cci": (source: number, length: number) => ta.cci(ctx, source, length),
    "mom": (source: number, length: number) => ta.mom(ctx, source, length),
    "stoch": (source: number, high: number, low: number, length: number) => ta.stoch(ctx, source, high, low, length),

    "trix": (source: number, length: number) => ta.trix(ctx, source, length),
    "bb": (source: number, length: number, mult: number) => ta.bb(ctx, source, length, mult),
    "cross": (x: number, y: number) => ta.cross(ctx, x, y),
    "crossover": (x: number, y: number) => ta.crossover(ctx, x, y),
    "crossunder": (x: number, y: number) => ta.crossunder(ctx, x, y),
    "highest": (source: number, length: number) => ta.highest(ctx, source, length),
    "lowest": (source: number, length: number) => ta.lowest(ctx, source, length),
    "highestbars": (source: number, length: number) => ta.highestbars(ctx, source, length),
    "lowestbars": (source: number, length: number) => ta.lowestbars(ctx, source, length),


    // --- Strategy Namespace ---
    "strategy": {
      "entry": (id: string, dir: string, qty: number) => strategy.entry(ctx, id, dir, qty),
      "close": (id: string) => strategy.close(ctx, id),
      "close_all": () => strategy.close_all(ctx),
      
      // Constants
      "long": strategy.direction.long,
      "short": strategy.direction.short,
      
      // Helper to get current position size (for scripts)
      "position_size": () => ctx.position.size,
      "opentrades": () => ctx.position.size !== 0 ? 1 : 0,
      "equity": () => ctx.cash + (ctx.position.size * (ctx.close - ctx.position.avgPrice)),
    }

  }
};

