/**
 * Transpile Pine Script to JavaScript using the ANTLR parse tree.
 */
import { parse } from "../../parser/v2/parse";
import { ToJsVisitor } from "./ToJsVisitor";

export function transpile(source: string): string {
  const { tree, errorCount } = parse(source);
  if (errorCount > 0) {
    throw new Error(`Parsing failed with ${errorCount} error(s)`);
  }
  const visitor = new ToJsVisitor();
  return visitor.visit(tree);
}
