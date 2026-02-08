/**
 * Transpile Pine Script to JavaScript using the ANTLR parse tree.
 */
import { parse } from "../../parser/v2";
import { ToJsVisitor } from "./ToJsVisitor";

export function transpile(source: string): string {
  // Now 'errors' is available!
  const { tree, errorCount, errors } = parse(source); 

  if (errorCount > 0) {
    const error = new Error(`Parsing failed with ${errorCount} error(s)`);
    (error as any).errors = errors; // Attach them here
    throw error;
  }

  const visitor = new ToJsVisitor();
  return visitor.visit(tree);
}
