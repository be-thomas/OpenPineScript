import { Context } from "../context";

/**
 * time.ts - Pine Script v2 Time Functions and Variables
 * Note: These functions currently rely on the local timezone of the JS engine.
 * For a strict trading engine, ensure the timestamps (`t`) passed in are 
 * pre-aligned to the exchange's timezone, or use Date.UTC methods.
 */
export const time = {
    /**
     * Returns the year for the given timestamp.
     * @param {number} t - UNIX timestamp in milliseconds.
     * @returns {number} The full year (e.g., 2026).
     */
    "year": (t: number): number => new Date(t).getFullYear(),
    
    /**
     * Returns the month for the given timestamp.
     * In Pine Script, months are 1-indexed (January = 1, December = 12).
     * @param {number} t - UNIX timestamp in milliseconds.
     * @returns {number} The month of the year (1-12).
     */
    "month": (t: number): number => new Date(t).getMonth() + 1,
    
    /**
     * Returns the ISO week of the year for the given timestamp.
     * @param {number} t - UNIX timestamp in milliseconds.
     * @returns {number} The week number (1-53).
     */
    "weekofyear": (t: number): number => {
        const date = new Date(t);
        date.setHours(0, 0, 0, 0);
        // Thursday in current week decides the year.
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        // January 4 is always in week 1.
        const week1 = new Date(date.getFullYear(), 0, 4);
        // Adjust to Thursday in week 1 and count number of weeks from date to week1.
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    },

    /**
     * Returns the day of the month for the given timestamp.
     * @param {number} t - UNIX timestamp in milliseconds.
     * @returns {number} The day of the month (1-31).
     */
    "dayofmonth": (t: number): number => new Date(t).getDate(),
    
    /**
     * Returns the day of the week for the given timestamp.
     * In Pine Script, Sunday is 1, Monday is 2, ..., Saturday is 7.
     * @param {number} t - UNIX timestamp in milliseconds.
     * @returns {number} The day of the week (1-7).
     */
    "dayofweek": (t: number): number => new Date(t).getDay() + 1,
    
    /**
     * Returns the hour for the given timestamp in 24-hour format.
     * @param {number} t - UNIX timestamp in milliseconds.
     * @returns {number} The hour of the day (0-23).
     */
    "hour": (t: number): number => new Date(t).getHours(),
    
    /**
     * Returns the minute for the given timestamp.
     * @param {number} t - UNIX timestamp in milliseconds.
     * @returns {number} The minute of the hour (0-59).
     */
    "minute": (t: number): number => new Date(t).getMinutes(),
    
    /**
     * Returns the second for the given timestamp.
     * @param {number} t - UNIX timestamp in milliseconds.
     * @returns {number} The second of the minute (0-59).
     */
    "second": (t: number): number => new Date(t).getSeconds(),

    /**
     * Built-in 'time' variable getter.
     * In v2, 'time' returns the UNIX timestamp of the current bar.
     * The transpiler maps the 'time' keyword directly to this Context call.
     * * @param {Context} ctx - The current execution context.
     * @returns {number} The current bar's UNIX timestamp in milliseconds.
     */
    "time": (ctx: Context): number => ctx.time
};

export default time;