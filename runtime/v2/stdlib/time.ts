import { Context } from "../context";

/**
 * time.ts - Pine Script v2 Time Functions and Variables
 */
export const time = {
    "year": (t: number): number => new Date(t).getFullYear(),
    
    "month": (t: number): number => new Date(t).getMonth() + 1,
    
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

    "dayofmonth": (t: number): number => new Date(t).getDate(),
    
    "dayofweek": (t: number): number => new Date(t).getDay() + 1, // Sunday=1, Monday=2...
    
    "hour": (t: number): number => new Date(t).getHours(),
    
    "minute": (t: number): number => new Date(t).getMinutes(),
    
    "second": (t: number): number => new Date(t).getSeconds(),

    /**
     * In v2, 'time' is a built-in variable. 
     * When used in the REPL/Engine, the transpiler should map 
     * the variable 'time' to 'ctx.time'.
     */
    "time": (ctx: Context): number => ctx.time
};
