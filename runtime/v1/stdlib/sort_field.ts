/**
 * `sort_field` — sorting and searching collections of user-defined objects.
 *
 * Release notes, April 2026 (sorting) and August 2026 (binary search): the
 * collection functions "can now sort collections of UDT IDs. They compare
 * values in an "int", "float", or "string" field of the referenced objects",
 * chosen by `sort_field` — "a field index. The default is 0, the first field
 * in the type declaration" — or "the field's name".
 *
 * Not a stdlib module of its own in the registry sense: it exports helpers,
 * not built-ins, so it is excluded from the metadata generator.
 */
import { val } from "../../../utils/v2/common";
import type { Context } from "../context";

/** Is `x` an instance of a user-defined type? Such objects carry `__type`. */
export function isObject(x: any): boolean {
    return x !== null && typeof x === "object" && typeof x.__type === "string";
}

/**
 * The field of `obj` that `sortField` names. Fields are stored in declaration
 * order after `__type`, which is what makes an INDEX meaningful.
 */
function fieldName(obj: any, sortField: any): string | undefined {
    const raw = val(sortField);
    const fields = Object.keys(obj).filter(k => k !== "__type");
    if (raw === undefined || raw === null || (typeof raw === "number" && Number.isNaN(raw))) return fields[0];
    if (typeof raw === "string") return fields.includes(raw) ? raw : undefined;
    return fields[Math.trunc(Number(raw))];
}

/** The value a UDT element sorts by, or the element itself when it is not one. */
export function sortKey(item: any, sortField: any): any {
    if (!isObject(item)) return val(item);
    const name = fieldName(item, sortField);
    if (name === undefined) {
        throw new Error(`sort_field ${JSON.stringify(val(sortField))} does not name a field of '${item.__type}'.`);
    }
    return val(item[name]);
}

/** Ascending comparison of two keys: strings by code point, numbers numerically. */
export function compareKeys(a: any, b: any): number {
    if (typeof a === "string" || typeof b === "string") {
        const x = String(a), y = String(b);
        return x < y ? -1 : x > y ? 1 : 0;
    }
    return Number(a) - Number(b);
}

/**
 * Whether this call sorts by field. Only at v6 — at v5 a UDT array was never
 * sortable here, and turning it into one would change what v5 does.
 */
export function byField(ctx: Context | undefined, items: any[]): boolean {
    return (ctx?.profile?.version ?? 1) >= 6 && items.some(isObject);
}
