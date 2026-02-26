import { Context } from "../context";
import { getGeneratedRegistry, StdlibEntry } from "./metadata";

export const REGISTRY: Record<string, StdlibEntry> = getGeneratedRegistry();

export function createStdlib(ctx: Context) {
  const sandboxStdlib: Record<string, any> = {};

  for (const [key, entry] of Object.entries(REGISTRY)) {
      if (key.includes('.')) {
          const [ns, method] = key.split('.');
          if (!sandboxStdlib[ns]) sandboxStdlib[ns] = {};
          sandboxStdlib[ns][method] = entry.ref;
      } else {
          sandboxStdlib[key] = entry.ref;
      }
  }

  return sandboxStdlib;
}
