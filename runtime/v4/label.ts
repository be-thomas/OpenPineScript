import { Context } from "../context";
import { PREFIX } from "../../utils/v2/common";

export function new_(ctx: Context, x: any, y: any, text: any, xloc?: any, yloc?: any, color?: any, style?: any, textcolor?: any, size?: any, textalign?: any, tooltip?: any): string {
    return ctx.new_drawing('label', {
        x: ctx.val(x),
        y: ctx.val(y),
        text: ctx.val(text),
        xloc: ctx.val(xloc),
        yloc: ctx.val(yloc),
        color: ctx.val(color),
        style: ctx.val(style),
        textcolor: ctx.val(textcolor),
        size: ctx.val(size),
        textalign: ctx.val(textalign),
        tooltip: ctx.val(tooltip)
    });
}

export function set_xy(ctx: Context, id: string, x: any, y: any) {
    ctx.update_drawing(ctx.val(id), { x: ctx.val(x), y: ctx.val(y) });
}

export function set_text(ctx: Context, id: string, text: any) {
    ctx.update_drawing(ctx.val(id), { text: ctx.val(text) });
}

export function set_color(ctx: Context, id: string, color: any) {
    ctx.update_drawing(ctx.val(id), { color: ctx.val(color) });
}

export function delete_(ctx: Context, id: string) {
    ctx.delete_drawing(ctx.val(id));
}

export const style = {
    none: 0,
    triangleup: 1,
    triangledown: 2,
    flag: 3,
    circle: 4,
    square: 5,
    diamond: 6,
    label_up: 7,
    label_down: 8,
    label_left: 9,
    label_right: 10
};

export const __CONTEXT_AWARE__: string[] = ["new", "set_xy", "set_text", "set_color", "delete"];
export const __SIGNATURES__: Record<string, string[]> = {
    "new": [PREFIX+"x", PREFIX+"y", PREFIX+"text", PREFIX+"xloc", PREFIX+"yloc", PREFIX+"color", PREFIX+"style", PREFIX+"textcolor", PREFIX+"size", PREFIX+"textalign", PREFIX+"tooltip"],
    "set_xy": [PREFIX+"id", PREFIX+"x", PREFIX+"y"],
    "set_text": [PREFIX+"id", PREFIX+"text"],
    "set_color": [PREFIX+"id", PREFIX+"color"],
    "delete": [PREFIX+"id"]
};
