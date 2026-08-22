/**
 * Pine Script matrices — the `matrix.*` namespace. v5, May 2022.
 *
 * ── Representation ──────────────────────────────────────────────────────────
 *
 * An array of row arrays, unwrapped, exactly as arrays and maps are (see
 * ./arrays.ts for why there is no wrapper class). A matrix is therefore also a
 * valid Pine ARRAY as far as `array.size` is concerned, which is a genuine
 * looseness: Pine's type checker keeps them apart at compile time and this
 * engine does not model element types at all. The alternative — a tagged
 * wrapper — would have to be unwrapped at every boundary in the runtime for a
 * check no script can trigger without already being rejected by TradingView.
 *
 * Rectangularity is an INVARIANT, not an assumption: every mutator that could
 * break it (add_row, add_col, set) validates first, because a ragged matrix
 * produces plausible numbers from `mult` and `det` rather than an error.
 *
 * ── What is deliberately absent ─────────────────────────────────────────────
 *
 * `matrix.eigenvalues` and `matrix.eigenvectors`. Both need an iterative
 * eigendecomposition, and for a general (non-symmetric) matrix the eigenvalues
 * can be complex — which Pine's `array<float>` return type cannot represent, so
 * TradingView must be doing something the docs do not state. Guessing at it
 * would produce numbers that look right and are not.
 *
 * An absent name is refused by the transpiler with "not available"; a present
 * one that is subtly wrong is not refused at all. `pinv` IS here, because its
 * restriction is statable — see the note on it.
 *
 * v5-only, which this file does not enforce: the registry split in ./index.ts
 * keeps the namespace out of the v1–v4 views.
 */

import { val } from "../../../utils/v2/common";

type Matrix = any[][];

/**
 * The property that marks an array as a MATRIX.
 *
 * A matrix is an array of arrays, which is also a perfectly good Pine array, so
 * a value cannot answer "am I a matrix?" from its shape alone. v5's method-call
 * syntax makes that answerable-or-not the difference between `m.get(r, c)`
 * reaching `matrix.get` and reaching `array.get` — see `Context.builtinMethod`.
 *
 * NON-ENUMERABLE, and a Symbol rather than a string key, so a tagged matrix is
 * indistinguishable from a plain array to everything else: `JSON.stringify`,
 * spread, `Object.keys`, and the array functions in ./arrays.ts all behave
 * exactly as they did before.
 */
export const MATRIX_TAG: unique symbol = Symbol.for("opsv2.matrix");

/** Marks `m` as a matrix and returns it. Every constructor's exit point. */
function tag(m: Matrix): Matrix {
    Object.defineProperty(m, MATRIX_TAG, { value: true, enumerable: false });
    return m;
}

/** Unwraps a Series and asserts the result really is a matrix. */
function mx(id: any, fn: string): Matrix {
    const v = val(id);
    if (!Array.isArray(v) || (v.length > 0 && !Array.isArray(v[0]))) {
        throw new Error(`matrix.${fn}: expected a matrix, got ${v === undefined ? "na" : typeof v}`);
    }
    return v as Matrix;
}

const num = (x: any): number => Number(val(x));
const rowsOf = (m: Matrix): number => m.length;
const colsOf = (m: Matrix): number => (m.length === 0 ? 0 : m[0].length);

function index(n: number, limit: number, fn: string, what: string): number {
    if (!Number.isInteger(n) || n < 0 || n >= limit) {
        throw new Error(`matrix.${fn}: ${what} ${n} is out of bounds (size ${limit})`);
    }
    return n;
}

/** Deep enough to be independent: rows are copied, elements are shared. */
const clone = (m: Matrix): Matrix => m.map(r => r.slice());

function sameShape(a: Matrix, b: Matrix, fn: string): void {
    if (rowsOf(a) !== rowsOf(b) || colsOf(a) !== colsOf(b)) {
        throw new Error(
            `matrix.${fn}: shapes differ (${rowsOf(a)}x${colsOf(a)} and ${rowsOf(b)}x${colsOf(b)})`,
        );
    }
}

/** Every finite element, row-major — the basis of the aggregates. */
const finite = (m: Matrix): number[] =>
    m.flat().map(x => Number(val(x))).filter(x => Number.isFinite(x));

export const matrix = {
    /**
     * `matrix.new<type>(rows, columns, initial_value)`.
     *
     * The type argument is parsed by the grammar and discarded by the emitter;
     * only the fill value distinguishes one element type from another here.
     */
    new: (rows: any = 0, columns: any = 0, initial_value: any = NaN): Matrix => {
        const r = Math.max(0, Math.trunc(num(rows) || 0));
        const c = Math.max(0, Math.trunc(num(columns) || 0));
        const fill = val(initial_value);
        return tag(Array.from({ length: r }, () => new Array(c).fill(fill)));
    },

    // --- Shape -------------------------------------------------------------

    rows: (id: any): number => rowsOf(mx(id, "rows")),
    columns: (id: any): number => colsOf(mx(id, "columns")),
    elements_count: (id: any): number => {
        const m = mx(id, "elements_count");
        return rowsOf(m) * colsOf(m);
    },
    is_square: (id: any): boolean => {
        const m = mx(id, "is_square");
        return rowsOf(m) === colsOf(m);
    },
    is_zero: (id: any): boolean => finite(mx(id, "is_zero")).every(x => x === 0),

    // --- Access ------------------------------------------------------------

    get: (id: any, row: any, column: any) => {
        const m = mx(id, "get");
        const r = index(Math.trunc(num(row)), rowsOf(m), "get", "row");
        const c = index(Math.trunc(num(column)), colsOf(m), "get", "column");
        return m[r][c];
    },

    set: (id: any, row: any, column: any, value: any) => {
        const m = mx(id, "set");
        const r = index(Math.trunc(num(row)), rowsOf(m), "set", "row");
        const c = index(Math.trunc(num(column)), colsOf(m), "set", "column");
        m[r][c] = val(value);
    },

    /** A COPY of the row, as a Pine array. Mutating it must not reach back. */
    row: (id: any, row: any): any[] => {
        const m = mx(id, "row");
        return m[index(Math.trunc(num(row)), rowsOf(m), "row", "row")].slice();
    },

    col: (id: any, column: any): any[] => {
        const m = mx(id, "col");
        const c = index(Math.trunc(num(column)), colsOf(m), "col", "column");
        return m.map(r => r[c]);
    },

    // --- Structural mutation -----------------------------------------------

    add_row: (id: any, row?: any, array_id?: any) => {
        const m = mx(id, "add_row");
        const at = row === undefined || row === null ? rowsOf(m) : Math.trunc(num(row));
        const width = colsOf(m);
        const values = array_id === undefined || array_id === null
            ? new Array(width).fill(NaN)
            : (val(array_id) as any[]).slice();
        if (rowsOf(m) > 0 && values.length !== width) {
            throw new Error(
                `matrix.add_row: row has ${values.length} elements, matrix has ${width} columns`,
            );
        }
        if (at < 0 || at > rowsOf(m)) {
            throw new Error(`matrix.add_row: row ${at} is out of bounds (size ${rowsOf(m)})`);
        }
        m.splice(at, 0, values);
    },

    add_col: (id: any, column?: any, array_id?: any) => {
        const m = mx(id, "add_col");
        const at = column === undefined || column === null ? colsOf(m) : Math.trunc(num(column));
        const height = rowsOf(m);
        const values = array_id === undefined || array_id === null
            ? new Array(height).fill(NaN)
            : (val(array_id) as any[]).slice();
        if (values.length !== height) {
            throw new Error(
                `matrix.add_col: column has ${values.length} elements, matrix has ${height} rows`,
            );
        }
        if (at < 0 || at > colsOf(m)) {
            throw new Error(`matrix.add_col: column ${at} is out of bounds (size ${colsOf(m)})`);
        }
        m.forEach((r, i) => r.splice(at, 0, values[i]));
    },

    remove_row: (id: any, row?: any): any[] => {
        const m = mx(id, "remove_row");
        const at = row === undefined || row === null ? rowsOf(m) - 1 : Math.trunc(num(row));
        return m.splice(index(at, rowsOf(m), "remove_row", "row"), 1)[0];
    },

    remove_col: (id: any, column?: any): any[] => {
        const m = mx(id, "remove_col");
        const at = column === undefined || column === null ? colsOf(m) - 1 : Math.trunc(num(column));
        const c = index(at, colsOf(m), "remove_col", "column");
        return m.map(r => r.splice(c, 1)[0]);
    },

    swap_rows: (id: any, row1: any, row2: any) => {
        const m = mx(id, "swap_rows");
        const a = index(Math.trunc(num(row1)), rowsOf(m), "swap_rows", "row");
        const b = index(Math.trunc(num(row2)), rowsOf(m), "swap_rows", "row");
        [m[a], m[b]] = [m[b], m[a]];
    },

    swap_columns: (id: any, column1: any, column2: any) => {
        const m = mx(id, "swap_columns");
        const a = index(Math.trunc(num(column1)), colsOf(m), "swap_columns", "column");
        const b = index(Math.trunc(num(column2)), colsOf(m), "swap_columns", "column");
        for (const r of m) [r[a], r[b]] = [r[b], r[a]];
    },

    fill: (id: any, value: any, from_row: any = 0, to_row?: any, from_column: any = 0, to_column?: any) => {
        const m = mx(id, "fill");
        const r0 = Math.trunc(num(from_row) || 0);
        const r1 = to_row === undefined || to_row === null ? rowsOf(m) : Math.trunc(num(to_row));
        const c0 = Math.trunc(num(from_column) || 0);
        const c1 = to_column === undefined || to_column === null ? colsOf(m) : Math.trunc(num(to_column));
        const v = val(value);
        for (let r = Math.max(0, r0); r < Math.min(rowsOf(m), r1); r++) {
            for (let c = Math.max(0, c0); c < Math.min(colsOf(m), c1); c++) m[r][c] = v;
        }
    },

    // --- Derived matrices --------------------------------------------------

    copy: (id: any): Matrix => tag(clone(mx(id, "copy"))),

    transpose: (id: any): Matrix => {
        const m = mx(id, "transpose");
        return tag(Array.from({ length: colsOf(m) }, (_, c) => m.map(r => r[c])));
    },

    submatrix: (id: any, from_row: any = 0, to_row?: any, from_column: any = 0, to_column?: any): Matrix => {
        const m = mx(id, "submatrix");
        const r0 = Math.trunc(num(from_row) || 0);
        const r1 = to_row === undefined || to_row === null ? rowsOf(m) : Math.trunc(num(to_row));
        const c0 = Math.trunc(num(from_column) || 0);
        const c1 = to_column === undefined || to_column === null ? colsOf(m) : Math.trunc(num(to_column));
        return tag(m.slice(r0, r1).map(r => r.slice(c0, c1)));
    },

    /** Row-major reshape. The element count must be preserved exactly. */
    reshape: (id: any, rows: any, columns: any): Matrix => {
        const m = mx(id, "reshape");
        const flat = m.flat();
        const r = Math.trunc(num(rows)), c = Math.trunc(num(columns));
        if (r * c !== flat.length) {
            throw new Error(
                `matrix.reshape: cannot reshape ${flat.length} elements into ${r}x${c}`,
            );
        }
        return tag(Array.from({ length: r }, (_, i) => flat.slice(i * c, i * c + c)));
    },

    concat: (id1: any, id2: any): Matrix => {
        const a = mx(id1, "concat"), b = mx(id2, "concat");
        if (rowsOf(a) > 0 && rowsOf(b) > 0 && colsOf(a) !== colsOf(b)) {
            throw new Error(
                `matrix.concat: column counts differ (${colsOf(a)} and ${colsOf(b)})`,
            );
        }
        // Pine mutates id1 and returns it, exactly as array.concat does.
        for (const r of b) a.push(r.slice());
        return a;
    },

    // --- Arithmetic --------------------------------------------------------

    sum: (id1: any, id2: any): Matrix => {
        const a = mx(id1, "sum");
        const other = val(id2);
        if (typeof other === "number") return tag(a.map(r => r.map(x => num(x) + other)));
        const b = mx(id2, "sum");
        sameShape(a, b, "sum");
        return tag(a.map((r, i) => r.map((x, j) => num(x) + num(b[i][j]))));
    },

    diff: (id1: any, id2: any): Matrix => {
        const a = mx(id1, "diff");
        const other = val(id2);
        if (typeof other === "number") return tag(a.map(r => r.map(x => num(x) - other)));
        const b = mx(id2, "diff");
        sameShape(a, b, "diff");
        return tag(a.map((r, i) => r.map((x, j) => num(x) - num(b[i][j]))));
    },

    /**
     * Matrix product, or a scalar/vector multiply.
     *
     * Pine overloads this three ways: matrix×matrix, matrix×array (treated as a
     * column vector) and matrix×scalar. The overloads are distinguished by what
     * the second argument IS, which is the only information available at run
     * time here — the emitter does not track types.
     */
    mult: (id1: any, id2: any): any => {
        const a = mx(id1, "mult");
        const other = val(id2);

        if (typeof other === "number") return tag(a.map(r => r.map(x => num(x) * other)));

        // A plain (non-nested) array is a column vector; the result is one too.
        if (Array.isArray(other) && (other.length === 0 || !Array.isArray(other[0]))) {
            if (colsOf(a) !== other.length) {
                throw new Error(
                    `matrix.mult: matrix has ${colsOf(a)} columns, vector has ${other.length} elements`,
                );
            }
            return a.map(r => r.reduce((acc, x, j) => acc + num(x) * num(other[j]), 0));
        }

        const b = mx(id2, "mult");
        if (colsOf(a) !== rowsOf(b)) {
            throw new Error(
                `matrix.mult: cannot multiply ${rowsOf(a)}x${colsOf(a)} by ${rowsOf(b)}x${colsOf(b)}`,
            );
        }
        return tag(Array.from({ length: rowsOf(a) }, (_, i) =>
            Array.from({ length: colsOf(b) }, (_, j) =>
                a[i].reduce((acc, x, k) => acc + num(x) * num(b[k][j]), 0))));
    },

    /**
     * Determinant by Gaussian elimination with partial pivoting.
     *
     * Not cofactor expansion: that is O(n!) and loses to rounding well before
     * it loses to time. Partial pivoting is what keeps the result usable when a
     * leading element is near zero, which is the common case for a matrix built
     * from price data.
     */
    det: (id: any): number => {
        const m = clone(mx(id, "det")).map(r => r.map(num));
        const n = rowsOf(m);
        if (n !== colsOf(m)) throw new Error(`matrix.det: matrix is not square`);
        if (n === 0) return 1;

        let determinant = 1;
        for (let col = 0; col < n; col++) {
            let pivot = col;
            for (let r = col + 1; r < n; r++) {
                if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
            }
            if (m[pivot][col] === 0) return 0;
            if (pivot !== col) {
                [m[col], m[pivot]] = [m[pivot], m[col]];
                determinant = -determinant;
            }
            determinant *= m[col][col];
            for (let r = col + 1; r < n; r++) {
                const factor = m[r][col] / m[col][col];
                for (let c = col; c < n; c++) m[r][c] -= factor * m[col][c];
            }
        }
        return determinant;
    },

    /** Inverse by Gauss-Jordan. `na`-filled when the matrix is singular. */
    inv: (id: any): Matrix => {
        const source = mx(id, "inv");
        const n = rowsOf(source);
        if (n !== colsOf(source)) throw new Error(`matrix.inv: matrix is not square`);

        const m = source.map((r, i) => [
            ...r.map(num),
            ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
        ]);

        for (let col = 0; col < n; col++) {
            let pivot = col;
            for (let r = col + 1; r < n; r++) {
                if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
            }
            if (m[pivot][col] === 0) {
                return tag(Array.from({ length: n }, () => new Array(n).fill(NaN)));
            }
            [m[col], m[pivot]] = [m[pivot], m[col]];

            const lead = m[col][col];
            for (let c = 0; c < 2 * n; c++) m[col][c] /= lead;

            for (let r = 0; r < n; r++) {
                if (r === col) continue;
                const factor = m[r][col];
                if (factor === 0) continue;
                for (let c = 0; c < 2 * n; c++) m[r][c] -= factor * m[col][c];
            }
        }
        return tag(m.map(r => r.slice(n)));
    },

    /**
     * Kronecker product. Exact — no tolerance, no iteration.
     *
     * `a` is `m×n` and `b` is `p×q`, so the result is `mp×nq`: every element of
     * `a` is replaced by that element times the whole of `b`.
     */
    kron: (id1: any, id2: any): Matrix => {
        const a = mx(id1, "kron"), b = mx(id2, "kron");
        const br = rowsOf(b), bc = colsOf(b);
        const out: Matrix = Array.from(
            { length: rowsOf(a) * br },
            () => new Array(colsOf(a) * bc).fill(0),
        );
        for (let i = 0; i < rowsOf(a); i++) {
            for (let j = 0; j < colsOf(a); j++) {
                const scale = num(a[i][j]);
                for (let k = 0; k < br; k++) {
                    for (let l = 0; l < bc; l++) {
                        out[i * br + k][j * bc + l] = scale * num(b[k][l]);
                    }
                }
            }
        }
        return tag(out);
    },

    /**
     * Rank — the number of linearly independent rows.
     *
     * Row echelon form with partial pivoting. A pivot counts as zero below a
     * tolerance scaled to the matrix's largest element, because a rank computed
     * against an absolute epsilon is a rank that depends on the units the
     * prices are quoted in.
     */
    rank: (id: any): number => {
        const m = clone(mx(id, "rank")).map(r => r.map(num));
        const rows = rowsOf(m), cols = colsOf(m);
        if (rows === 0 || cols === 0) return 0;

        const scale = Math.max(...m.flat().map(Math.abs), 1);
        const epsilon = scale * 1e-12;

        let rank = 0;
        for (let col = 0; col < cols && rank < rows; col++) {
            let pivot = rank;
            for (let r = rank + 1; r < rows; r++) {
                if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
            }
            if (Math.abs(m[pivot][col]) <= epsilon) continue;

            [m[rank], m[pivot]] = [m[pivot], m[rank]];
            for (let r = rank + 1; r < rows; r++) {
                const factor = m[r][col] / m[rank][col];
                for (let c = col; c < cols; c++) m[r][c] -= factor * m[rank][c];
            }
            rank++;
        }
        return rank;
    },

    /**
     * Moore-Penrose pseudo-inverse, for a FULL-RANK matrix.
     *
     * Computed from the normal equations — `(AᵀA)⁻¹Aᵀ` when the columns are
     * independent, `Aᵀ(AAᵀ)⁻¹` when the rows are — which is exact for a
     * full-rank matrix and is the standard construction.
     *
     * A RANK-DEFICIENT matrix has a pseudo-inverse too, but computing it needs
     * a singular value decomposition, and the cutoff that decides which
     * singular values count as zero is a tolerance TradingView does not
     * publish. Rather than pick one, this returns an `na`-filled matrix of the
     * right shape — the same answer `inv` gives a singular matrix, so a script
     * that checks for `na` catches both.
     */
    pinv: (id: any): Matrix => {
        const a = mx(id, "pinv").map(r => r.map(num));
        const rows = rowsOf(a), cols = colsOf(a);
        const naResult = () =>
            tag(Array.from({ length: cols }, () => new Array(rows).fill(NaN)));
        if (rows === 0 || cols === 0) return naResult();

        if (matrix.rank(a) < Math.min(rows, cols)) return naResult();

        const at = matrix.transpose(a) as number[][];

        if (cols <= rows) {
            // Independent columns: (AᵀA)⁻¹Aᵀ.
            const inverse = matrix.inv(matrix.mult(at, a)) as number[][];
            if (!Number.isFinite(inverse[0]?.[0])) return naResult();
            return tag(matrix.mult(inverse, at) as number[][]);
        }

        // Independent rows: Aᵀ(AAᵀ)⁻¹.
        const inverse = matrix.inv(matrix.mult(a, at)) as number[][];
        if (!Number.isFinite(inverse[0]?.[0])) return naResult();
        return tag(matrix.mult(at, inverse) as number[][]);
    },

    trace: (id: any): number => {
        const m = mx(id, "trace");
        const n = Math.min(rowsOf(m), colsOf(m));
        let total = 0;
        for (let i = 0; i < n; i++) total += num(m[i][i]);
        return total;
    },

    // --- Aggregates --------------------------------------------------------
    //
    // `na` elements are SKIPPED, matching the array aggregates in ./arrays.ts,
    // and an all-`na` matrix aggregates to `na` rather than to 0.

    avg: (id: any): number => {
        const xs = finite(mx(id, "avg"));
        return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
    },
    max: (id: any): number => {
        const xs = finite(mx(id, "max"));
        return xs.length ? Math.max(...xs) : NaN;
    },
    min: (id: any): number => {
        const xs = finite(mx(id, "min"));
        return xs.length ? Math.min(...xs) : NaN;
    },

    /** Sorts ROWS by the value in `column`, ascending unless told otherwise. */
    sort: (id: any, column: any = 0, order: any = "ascending") => {
        const m = mx(id, "sort");
        const c = colsOf(m) === 0 ? 0 : index(Math.trunc(num(column) || 0), colsOf(m), "sort", "column");
        const descending = String(val(order)) === "descending";
        m.sort((a, b) => (descending ? num(b[c]) - num(a[c]) : num(a[c]) - num(b[c])));
    },
};
