import { Context } from "../context";
import { PREFIX } from "../../utils/v2/common";

export function new_(ctx: Context, x1: any, y1: any, x2: any, y2: any, xloc?: any, extend?: any, color?: any, style?: any, width?: any): string {
    return ctx.new_drawing('line', {
        x1: ctx.val(x1),
        y1: ctx.val(y1),
        x2: ctx.val(x2),
        y2: ctx.val(y2),
        xloc: ctx.val(xloc),
        extend: ctx.val(extend),
        color: ctx.val(color) || "#000000",
        style: ctx.val(style),
        width: ctx.val(width)
    });
}

export function set_xy1(ctx: Context, id: string, x: any, y: any) {
    ctx.update_drawing(ctx.val(id), { x1: ctx.val(x), y1: ctx.val(y) });
}

export function set_xy2(ctx: Context, id: string, x: any, y: any) {
    ctx.update_drawing(ctx.val(id), { x2: ctx.val(x), y2: ctx.val(y) });
}

export function set_color(ctx: Context, id: string, color: any) {
    ctx.update_drawing(ctx.val(id), { color: ctx.val(color) });
}

export function delete_(ctx: Context, id: string) {
    ctx.delete_drawing(ctx.val(id));
}

// v2 Line Styles
export const style = {
    solid: 0,
    dotted: 1,
    dashed: 2,
    arrow_left: 3,
    arrow_right: 4,
    arrow_both: 5
};

export const __CONTEXT_AWARE__: string[] = ["new", "set_xy1", "set_xy2", "set_color", "delete"];
export const __SIGNATURES__: Record<string, string[]> = {
    "new": [PREFIX+"x1", PREFIX+"y1", PREFIX+"x2", PREFIX+"y2", PREFIX+"xloc", PREFIX+"extend", PREFIX+"color", PREFIX+"style", PREFIX+"width"],
    "set_xy1": [PREFIX+"id", PREFIX+"x", PREFIX+"y"],
    "set_xy2": [PREFIX+"id", PREFIX+"x", PREFIX+"y"],
    "set_color": [PREFIX+"id", PREFIX+"color"],
    "delete": [PREFIX+"id"]
};
