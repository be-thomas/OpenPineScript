import { Context } from "../context";
import { getGeneratedRegistry, StdlibEntry } from "./metadata";

// 1. Instantiate the auto-generated registry
export const REGISTRY: Record<string, StdlibEntry> = getGeneratedRegistry();

/**
 * createStdlib
 * Dynamically builds the sandbox-ready standard library object 
 * using the pre-compiled, minification-proof REGISTRY.
 */
export function createStdlib(ctx: Context) {
  // Note: 'ctx' is passed here to satisfy your runtime engine's call signature, 
  // but we don't actually need to use it in this file anymore since Context.call 
  // handles the injection automatically!

  const sandboxStdlib: Record<string, any> = {};

  // Build the nested sandbox object dynamically
  for (const [key, entry] of Object.entries(REGISTRY)) {
      
      // If the key has a dot (e.g., "strategy.entry" or "color.red")
      if (key.includes('.')) {
          const [ns, method] = key.split('.');
          
          // Initialize the namespace object if it doesn't exist
          if (!sandboxStdlib[ns]) {
              sandboxStdlib[ns] = {};
          }
          
          // Assign the reference (works for both functions and static values)
          sandboxStdlib[ns][method] = entry.ref;
      } 
      // If it's a global function (e.g., "sma", "plot")
      else {
          sandboxStdlib[key] = entry.ref;
      }
  }

  return sandboxStdlib;
}
