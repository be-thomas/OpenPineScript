/**
 * runtime/v1/stdlib/ui.ts
 * Implements "Full" Plotting Support (Colors, Styles, Shapes, Fills)
 */
import { Context } from "../context";

// --- Colors (Pine Script Standard) ---
export const color_red    = "#FF5252";
export const color_green  = "#4CAF50";
export const color_blue   = "#2196F3";
export const color_orange = "#FF9800";
export const color_teal   = "#009688";
export const color_navy   = "#3F51B5";
export const color_white  = "#FFFFFF";
export const color_black  = "#000000";
export const color_gray   = "#9E9E9E";
export const color_purple = "#9C27B0";

// --- Outputs ---

/**
 * `transp` — the transparency ARGUMENT that every plotting function used to
 * take, and that v5 deprecated without removing.
 *
 * SOURCING. The v4-to-v5 migration guide: "The `transp=` parameter used in the
 * signature of many v4 plotting functions was deprecated because it interfered
 * with RGB functionality." DEPRECATED, not removed — and TradingView's own v5
 * colours page says as much in a comment above two live calls:
 *
 *     // Use `transp` parameter (deprecated and advised against)
 *     plot(ta.sma(close, 70), "70", color.olive, transp = 40)
 *
 * ── Why this exists at all ─────────────────────────────────────────────────
 *
 * The parameter was not in these signatures at ANY version, so `ctx.call`
 * dropped it silently: a v3 script asking for a 40%-transparent line got an
 * opaque one and no warning. v5 rejected it outright, which was wrong in the
 * other direction — it refused a script TradingView still runs.
 *
 * Applied by baking the value into the colour, which is exactly what the
 * migration guide tells a script to do for itself.
 */
const withTransp = (col: any, transp: any): any =>
    transp === undefined || transp === null ? col : color(col, transp);


/**
 * The DISPLAY parameters every plotting function takes and this engine records.
 *
 * ── Why they are here at all ────────────────────────────────────────────────
 *
 * A keyword argument whose name is not in the callee's signature is dropped by
 * `Context.call` without a word. Every name below was being dropped, and the
 * corpus shows how often: `title` on 35 `bgcolor` calls, `size` on 24
 * `plotchar` calls, `display` on 8 `plot` calls, `wickcolor` and `bordercolor`
 * on 5 `plotcandle` calls each. A script asking for a named plot got "_BGCOLOR_"
 * and nothing said so.
 *
 * This engine does not RENDER, so recording them on the plot is the whole of
 * honouring them — with one exception. `offset` moves the value to a different
 * BAR, which changes the series rather than its appearance, so
 * `Context.registerPlot` applies it.
 */
const shown = (o: Record<string, any>): Record<string, any> => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
    return out;
};

export function plot(
    ctx: Context,
    series: number,
    title: string = "Plot",
    color?: string,
    linewidth: number = 1,
    style?: number,
    // `transp` sits where v5 spells `trackprice`, because it is the v1–v4
    // signature and `trackprice` is not: a positional sixth argument is `transp`
    // in the versions that have it. Everything after is by name in every
    // published script.
    transp?: any,
    trackprice?: any, histbase?: any, offset?: any, join?: any,
    editable?: any, show_last?: any, display?: any,
    format?: any, precision?: any, force_overlay?: any,
    // v6, September 2025: one of `plot.linestyle_*`, for the styles that draw
    // a line. Gated to v6 by V6_ONLY_PARAMS.
    linestyle?: any,
): string {
    ctx.registerPlot({
        type: 'line',
        value: Number(series),
        title,
        color: withTransp(color, transp),
        linewidth,
        style,
        ...shown({ trackprice, histbase, offset, join, editable, show_last,
                     display, format, precision, force_overlay, linestyle }),
    });
    // Return the ID (title) so it can be used by fill()
    return title;
}

export function plotshape(
    ctx: Context,
    series: boolean | number,
    title: string = "Shape",
    style?: string,
    location?: string,
    color?: string,
    transp?: any,
    offset?: any, text?: any, textcolor?: any, editable?: any, size?: any,
    show_last?: any, display?: any, format?: any, precision?: any,
    force_overlay?: any,
): void {
    let val = Number(series);

    // Pine Rule: 0 means "False" (Don't Plot).
    if (val === 0) {
        val = NaN;
    }

    ctx.registerPlot({
        ...shown({ location, offset, text, textcolor, editable, size, show_last,
                     display, format, precision, force_overlay }),
        type: 'shape',
        value: val,
        title,
        color: withTransp(color, transp),
        style
    });
}

export function plotchar(
    ctx: Context,
    series: boolean | number,
    title: string = "Char",
    char: string = "★",
    location?: string,
    color?: string,
    transp?: any,
    offset?: any, text?: any, textcolor?: any, editable?: any, size?: any,
    show_last?: any, display?: any, format?: any, precision?: any,
    force_overlay?: any,
): void {
    let val = Number(series);

    if (val === 0) {
        val = NaN;
    }

    ctx.registerPlot({
        ...shown({ location, offset, text, textcolor, editable, size, show_last,
                     display, format, precision, force_overlay }),
        type: 'char',
        value: val,
        title,
        color: withTransp(color, transp),
        style: char
    });
}

export function hline(
    ctx: Context,
    price: number,
    title: string = "HLine",
    color?: string,
    linestyle?: number,
    linewidth?: number,
    editable?: any, display?: any, force_overlay?: any,
): string {
    ctx.registerPlot({
        type: 'line',
        value: Number(price),
        title,
        color,
        linewidth,
        style: linestyle,
        ...shown({ editable, display, force_overlay }),
    });
    return title;
}

export function plotbar(
    ctx: Context,
    open: number,
    high: number,
    low: number,
    close: number,
    title: string = "Bar",
    color?: string,
    transp?: any,
    editable?: any, show_last?: any, display?: any,
    format?: any, precision?: any, force_overlay?: any,
): void {
    ctx.registerPlot({
        ...shown({ editable, show_last, display, format, precision,
                     force_overlay }),
        type: 'candle',
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        title,
        color: withTransp(color, transp)
    });
}

export function plotcandle(
    ctx: Context,
    open: number,
    high: number,
    low: number,
    close: number,
    title: string = "Candle",
    color?: string,
    transp?: any,
    wickcolor?: any, editable?: any, show_last?: any, bordercolor?: any,
    display?: any, format?: any, precision?: any, force_overlay?: any,
): void {
    ctx.registerPlot({
        ...shown({ wickcolor, editable, show_last, bordercolor,
                     display, format, precision, force_overlay }),
        type: 'candle',
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        title,
        color: withTransp(color, transp)
    });
}

export function plotarrow(
    ctx: Context,
    series: number,
    title: string = "Arrow",
    colorup?: string,
    colordown?: string,
    _minheight: number = 5,
    _maxheight: number = 100
): void {
    ctx.registerPlot({
        type: 'arrow',
        value: Number(series),
        title,
        color: Number(series) >= 0 ? (colorup || "#4CAF50") : (colordown || "#FF5252")
    });
}

// --- Visual Layers ---

export function bgcolor(
    ctx: Context, color: string, transp?: number,
    offset?: any, editable?: any, show_last?: any, title?: any,
    display?: any, force_overlay?: any,
): void {
    // `transp` was declared here and then dropped on the floor. See the note on
    // `withTransp` above: the argument has always been legal and has never been
    // applied, so a script asking for a 90%-transparent background got an
    // opaque one at every version.
    ctx.registerPlot({
        type: 'bgcolor',
        // A declared title names the plot; the synthetic one is the fallback it
        // always was.
        title: title === undefined || title === null || title === ""
            ? `_BGCOLOR_${color}` : String(title),
        color: withTransp(color, transp),
        ...shown({ offset, editable, show_last, display, force_overlay }),
    });
}

export function barcolor(
    ctx: Context, color: string,
    offset?: any, editable?: any, show_last?: any, title?: any, display?: any,
): void {
    ctx.registerPlot({
        type: 'barcolor',
        title: title === undefined || title === null || title === ""
            ? "_BARCOLOR_" : String(title),
        color,
        ...shown({ offset, editable, show_last, display }),
    });
}

/**
 * `fill` has two published signatures:
 *
 *   fill(plot1, plot2, color, title, editable, fillgaps, display, …)
 *   fill(plot1, plot2, top_value, bottom_value, top_color, bottom_color,
 *        title, display, fillgaps, editable, force_overlay)
 *
 * The registry holds one, so `fill(a, b, close + 10, close - 10, c1, c2)` bound
 * the price to `color`. A call is the gradient form when it NAMES one of the
 * four gradient parameters, or when its third AND fourth positional arguments
 * are numbers (the colour form's third is a colour, `na` included, and its fourth
 * a title or a flag). The positional
 * arguments are then re-read in the gradient order: `SLOTS` says which
 * parameter of the shared signature each positional argument landed in, for
 * the version being run (see V6_POSITIONAL). A keyword argument is bound by
 * name either way. A v6 positional argument past the eighth has no slot and
 * is dropped, as it always was.
 */
const FILL_GRADIENT = ["plot1", "plot2", "top_value", "bottom_value", "top_color",
                       "bottom_color", "title", "display", "fillgaps", "editable",
                       "force_overlay"] as const;
const FILL_SLOTS_V5 = ["plot1", "plot2", "color", "title", "editable", "fillgaps",
                       "transp", "display", "force_overlay", "show_last"] as const;
const FILL_SLOTS_V6 = ["plot1", "plot2", "color", "title", "editable", "show_last",
                       "fillgaps", "display"] as const;

export function fill(
    ctx: Context,
    plot1: string,
    plot2: string,
    color?: string,
    title?: string,
    editable?: boolean,
    fillgaps?: boolean,
    transp?: any,
    display?: any, force_overlay?: any,
    // Last, not where v5 lists it: the shared signature keeps v1-v4's order.
    // v6 positional arguments are placed by name (V6_POSITIONAL).
    show_last?: any,
    top_value?: any, bottom_value?: any, top_color?: any, bottom_color?: any,
): void {
    const named = ctx.keywordArguments;
    const asNumber = (x: any) => typeof (x as any)?.valueOf?.() === "number";
    const gradient = ["top_value", "bottom_value", "top_color", "bottom_color"].some((k) => named.has(k))
        // An `na` colour is NaN, a number too, so the third argument alone cannot decide:
        // the gradient form's fourth (bottom_value) is a number as well, the colour form's
        // fourth (title, editable) never is.
        || (!named.has("color") && ctx.positionalArguments > 3 && asNumber(color) && asNumber(title));
    if (!gradient) {
        ctx.registerFill(plot1, plot2, {
            color: withTransp(color, transp), title,
            ...shown({ editable, fillgaps, display, force_overlay, show_last }),
        });
        return;
    }

    const bound: Record<string, any> = {
        plot1, plot2, color, title, editable, fillgaps, transp, display, force_overlay,
        show_last, top_value, bottom_value, top_color, bottom_color,
    };
    const slots = ctx.profile.version >= 6 ? FILL_SLOTS_V6 : FILL_SLOTS_V5;
    const g: Record<string, any> = {};
    FILL_GRADIENT.forEach((name, k) => {
        if (named.has(name)) g[name] = bound[name];
        else if (k < ctx.positionalArguments && k < slots.length) g[name] = bound[slots[k]];
    });
    // `fill(show_last)` is a colour-form parameter, but it exists in both.
    ctx.registerFill(plot1, plot2, {
        color: "#00000000", title: g.title,
        top_value: g.top_value, bottom_value: g.bottom_value,
        top_color: g.top_color, bottom_color: g.bottom_color, gradient: true,
        ...shown({ editable: g.editable, fillgaps: g.fillgaps, display: g.display,
                   force_overlay: g.force_overlay, show_last: named.has("show_last") ? show_last : undefined }),
    });
}


// --- Plot style constants (v1-v3 bare globals; v4 moved them to plot.style_*) ---
export const line = "line";
export const histogram = "histogram";
export const columns = "columns";
export const circles = "circles";
export const areabr = "areabr";
export const linebr = "linebr";
export const stepline = "stepline";
export const area = "area";

// --- hline style constants (v1-v3; v4 moved them to hline.style_*) ---
export const dotted = "dotted";
export const dashed = "dashed";
export const solid = "solid";

// --- plotshape/plotchar location constants ---
export const location = {
    abovebar: "abovebar",
    belowbar: "belowbar",
    top: "top",
    bottom: "bottom",
    absolute: "absolute",
};

// --- plotshape style constants ---
export const shape = {
    xcross: "xcross", cross: "cross", triangleup: "triangleup",
    triangledown: "triangledown", flag: "flag", circle: "circle",
    arrowup: "arrowup", arrowdown: "arrowdown", labelup: "labelup",
    labeldown: "labeldown", square: "square", diamond: "diamond",
};

// --- size constants ---
export const size = {
    auto: "auto", tiny: "tiny", small: "small",
    normal: "normal", large: "large", huge: "huge",
};

/**
 * color(col, transp) — the v1-v3 spelling. v4 renamed it to color.new().
 * Applies a transparency percentage (0 = opaque, 100 = invisible) to a hex
 * colour, returning #RRGGBBAA.
 *
 * `color(na)` is `na`. It used to build the string "NaNff" from the NaN, so a
 * label drawn with `color = color(na)` carried a colour no renderer can parse,
 * where `color = na` carries `na` (NaN, which serialises as null) and is drawn
 * with no fill. On TradingView the ▲/▼ labels of harness_trader_club, drawn
 * with `color(na)`, show as bare text with no background (seen on the chart;
 * Pine Logs do not carry colours).
 */
export function color(col: any, transp?: any): string | number {
    const raw = col && typeof col.valueOf === "function" ? col.valueOf() : col;
    if (raw === null || (typeof raw === "number" && Number.isNaN(raw))) return NaN;
    const base = String(raw ?? "#000000");
    const t = Number(transp && typeof transp.valueOf === "function" ? transp.valueOf() : transp ?? 0);
    const hex = base.slice(0, 7);
    if (!Number.isFinite(t)) return hex;
    const alpha = Math.round(255 * (1 - Math.min(Math.max(t, 0), 100) / 100));
    return hex + alpha.toString(16).padStart(2, "0");
}

/**
 * `tickerid(prefix, ticker, session, adjustment)` — builds a ticker id string.
 *
 * The FUNCTION, not the variable: `syminfo.tickerid` is the current chart's id
 * and lives in ./syminfo.ts. Pine keeps functions and variables in separate
 * namespaces, so v1–v4 spell both of them `tickerid`; v5 renames this one to
 * `ticker.new` and leaves the variable alone.
 *
 * `session` and `adjustment` are accepted and IGNORED. Both select a different
 * data feed on TradingView — extended hours, dividend adjustment — and this
 * engine has one feed, the bars it was handed. Accepting them keeps
 * `tickerid("BATS", "AAPL", session.regular)` (a v4 documentation example)
 * running against the chart's own data, which is what it would produce anyway
 * for a regular-session request; asking for `session.extended` gets the same
 * bars, which is a divergence rather than a refusal because the ticker id is
 * usually handed straight to `security()`, where an unknown symbol already
 * reports itself.
 */
export function tickerid(prefix: any, ticker: any, _session?: any, _adjustment?: any): string {
    const p = String(prefix && typeof prefix.valueOf === "function" ? prefix.valueOf() : prefix ?? "");
    const t = String(ticker && typeof ticker.valueOf === "function" ? ticker.valueOf() : ticker ?? "");
    return p ? `${p}:${t}` : t;
}


/**
 * alertcondition(condition, title, message) — stub.
 *
 * There is no alert delivery system to integrate with locally, so the fired
 * condition is recorded into the context instead of dispatched, which keeps it
 * inspectable. Signature-compatible so real scripts run. See R-10.
 */
export function alertcondition(ctx: Context, condition: any, title?: any, message?: any): void {
    const fired = Boolean(condition && typeof condition.valueOf === "function"
        ? condition.valueOf() : condition);
    if (!fired) return;
    (ctx as any).alerts ??= [];
    (ctx as any).alerts.push({
        bar: ctx.currentBarIndex,
        time: ctx.time,
        title: String(title ?? ""),
        message: String(message ?? ""),
    });
}

/**
 * `alert(message, freq)` — the v4 script-alert call.
 *
 * ── How it differs from alertcondition() above ─────────────────────────────
 *
 * `alertcondition()` DECLARES an alert a user can then configure from the
 * chart UI; `alert()` FIRES one at the moment it is called, with a message that
 * may be computed on the bar. Both land in `ctx.alerts` here, because there is
 * no delivery system to integrate with locally — recording keeps them
 * inspectable, which is what a backtest can actually use.
 *
 * ── Realtime only, deliberately ────────────────────────────────────────────
 *
 * The v4 manual is explicit that an `alert()` call only triggers on realtime
 * bars — it is the property that separates it from Pine Logs, which run on
 * history too. Firing on every historical bar would make a backtest report
 * thousands of alerts TradingView would never have sent, so `is_realtime`
 * gates it.
 *
 * `freq` is recorded rather than enforced (the constants live in
 * ./alerts.ts — see the note there on why they cannot sit in this file): the three frequencies differ in how
 * many times a single realtime bar may re-fire as it updates, and that depends
 * on a tick feed the host supplies rather than on anything decidable here.
 *
 * Source: https://www.tradingview.com/pine-script-docs/v4/essential/alerts/
 *
 * @returns {void}
 */
export function alert(ctx: Context, message: any, freq?: any): void {
    if (!ctx.is_realtime) return;
    (ctx as any).alerts ??= [];
    (ctx as any).alerts.push({
        bar: ctx.currentBarIndex,
        time: ctx.time,
        title: "",
        message: String(message != null && typeof message.valueOf === "function"
            ? message.valueOf() : message ?? ""),
        freq: String(freq ?? "freq_once_per_bar"),
    });
}

/**
 * currency.* — the account currency the strategy reports in. Host-provided;
 * NONE means "same as the symbol". See R-15.
 */
export const currency = {
    NONE: "", USD: "USD", EUR: "EUR", GBP: "GBP", JPY: "JPY",
    CHF: "CHF", AUD: "AUD", CAD: "CAD", NZD: "NZD", HKD: "HKD",
    SGD: "SGD", INR: "INR", RUB: "RUB", ZAR: "ZAR", TRY: "TRY",
    // The rest of the ISO 4217 set TradingView exposes. A missing member of an
    // existing namespace used to read as `undefined`, so `currency.KRW` became
    // a strategy quoted in `[object Undefined]` rather than an error.
    KRW: "KRW", BRL: "BRL", CNY: "CNY", DKK: "DKK", ILS: "ILS",
    MYR: "MYR", NOK: "NOK", PHP: "PHP", PLN: "PLN", SEK: "SEK",
    THB: "THB", MXN: "MXN", ARS: "ARS", BTC: "BTC", ETH: "ETH",
    HUF: "HUF", CZK: "CZK", RON: "RON", RSD: "RSD", ISK: "ISK", IDR: "IDR",
    TWD: "TWD", VND: "VND", PKR: "PKR", BDT: "BDT", LKR: "LKR", KWD: "KWD",
    BHD: "BHD", QAR: "QAR", SAR: "SAR", AED: "AED", EGP: "EGP", NGN: "NGN",
    KES: "KES", MAD: "MAD", TND: "TND", CLP: "CLP", COP: "COP", PEN: "PEN",
    VES: "VES", USDT: "USDT",
};
