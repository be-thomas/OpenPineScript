import { Context } from "../context";
import { getGeneratedRegistry, StdlibEntry } from "./metadata";

export const REGISTRY: Record<string, StdlibEntry> = getGeneratedRegistry();

export function createStdlib(ctx: Context) {
    const sandboxStdlib: Record<string, any> = {};
  
    for (const [key, entry] of Object.entries(REGISTRY)) {
        const parts = key.split('.');
        let current = sandboxStdlib;
  
        // Iterate through parts to build/traverse the namespace tree
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
  
            if (i === parts.length - 1) {
                // Final part: Assign the actual function/value reference
                current[part] = entry.ref;
            } else {
                // Intermediate part: Ensure the nested object exists
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
        }
    }
  
    return sandboxStdlib;
}

