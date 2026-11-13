/**
 * Passed by the emitter as `str.tostring`'s second argument, in place of a
 * format, when the call has no format and its value is a compile-time CONSTANT
 * number. TradingView prints a constant and a series differently (see
 * `numberToString` in ./stdlib/str.ts), and that is a property of the source,
 * not of the value.
 *
 * Its own file rather than an export of str.ts, because the stdlib registry
 * generator turns every export of a stdlib module into a built-in.
 */
export const CONST_DEFAULT = "\0const";
