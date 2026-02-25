// src/parser/v2/transpiler.ts

import { CstNode, IToken } from "chevrotain";
import { OpenPinescriptParser } from "../../parser/v2/parser_builder";

// Instantiate the parser.
// It is used to get the base visitor class.
const parser = new OpenPinescriptParser();
const BaseCstVisitor = parser.getBaseCstVisitorConstructorWithDefaults();

/**
 * A visitor that traverses the Concrete Syntax Tree (CST) and transpiles
 * PineScript v2 code into executable JavaScript.
 */
export class PineToJsTranspiler extends BaseCstVisitor {
  constructor() {
    super();
    // The "validateVisitor" method is a useful utility from chevrotain
    // to detect missing or redundant visitor methods.
    this.validateVisitor();
  }

  // Main entry point for the script
  script(ctx: any): string {
    // Visit each statement and join them with newlines
    const statements = ctx.stmt?.map((s: CstNode) => this.visit(s)) || [];
    return statements.join("\n");
  }

  // A generic statement
  stmt(ctx: any): string {
    if (ctx.func_def_stmt) {
      return this.visit(ctx.func_def_stmt);
    }
    if (ctx.global_stmt_or_multistmt) {
      return this.visit(ctx.global_stmt_or_multistmt);
    }
    return "";
  }

  // Handles blocks and single lines of global statements
  global_stmt_or_multistmt(ctx: any): string {
    if (ctx.global_stmt_or_multistmt) { // Block BEGIN...END
        return this.visit(ctx.global_stmt_or_multistmt);
    }
    if (ctx.global_stmt_or_multistmt2) {
        return this.visit(ctx.global_stmt_or_multistmt2);
    }
    return ""; // For EMPTY_LINE
  }

  // A line that can contain multiple comma-separated statements
  global_stmt_or_multistmt2(ctx: any): string {
    const contents = ctx.global_stmt_content.map((c: CstNode) => this.visit(c));
    return contents.join("\n"); // Each content becomes a separate line in JS
  }

  // Content within a global statement line
  global_stmt_content(ctx: any): string {
    // Delegate to the specific statement type
    return this.visit(ctx.children[Object.keys(ctx.children)[0]][0]);
  }

  // Variable definition: a = 1
  var_def(ctx: any): string {
    const varName = ctx.ID[0].image;
    const value = this.visit(ctx.arith_expr[0]);
    // Use 'let' for new variable definitions
    return `let ${varName} = ${value};`;
  }

  // Destructuring variable definition: [a, b] = c
  var_defs(ctx: any): string {
    const ids = this.visit(ctx.ids_array[0]);
    const value = this.visit(ctx.arith_expr[0]);
    return `let ${ids} = ${value};`;
  }

  // Variable assignment: a := 1
  var_assign(ctx: any): string {
    const varName = ctx.ID[0].image;
    const value = this.visit(ctx.arith_expr[0]);
    // Simple assignment for existing variables
    return `${varName} = ${value};`;
  }

  // An array of identifiers for destructuring
  ids_array(ctx: any): string {
    const ids = ctx.ID.map((id: IToken) => id.image);
    return `[${ids.join(", ")}]`;
  }

  // An array of expressions
  arith_exprs(ctx: any): string {
    const exprs = ctx.arith_expr.map((e: CstNode) => this.visit(e));
    return `[${exprs.join(", ")}]`;
  }

  // Function definition statement wrapper
  func_def_stmt(ctx: any): string {
    if (ctx.fun_def_singleline) {
        return this.visit(ctx.fun_def_singleline);
    }
    return this.visit(ctx.fun_def_multiline);
  }

  // Single-line function definition: f(x) => x + 1
  fun_def_singleline(ctx: any): string {
    const funName = ctx.ID[0].image;
    const params = this.visit(ctx.fun_head[0]);
    const body = this.visit(ctx.fun_body_singleline[0]);
    // Single-line functions implicitly return the expression
    return `function ${funName}${params} {\n    return ${body};\n}`;
  }

  // Multi-line function definition
  fun_def_multiline(ctx: any): string {
    const funName = ctx.ID[0].image;
    const params = this.visit(ctx.fun_head[0]);
    const body = this.visit(ctx.fun_body_multiline[0]);
    return `function ${funName}${params} ${body}`;
  }

  // Function parameters: (a, b)
  fun_head(ctx: any): string {
    const params = ctx.ID?.map((id: IToken) => id.image) || [];
    return `(${params.join(", ")})`;
  }

  fun_body_singleline(ctx: any): string {
    return this.visit(ctx.local_stmt_singleline);
  }

  local_stmt_singleline(ctx: any): string {
     if (ctx.local_stmt_singleline) { // BEGIN...END block
        return this.visit(ctx.local_stmt_singleline);
    }
    return this.visit(ctx.local_stmt_singleline2);
  }
  
  local_stmt_singleline2(ctx: any): string {
      // In a single-line function body, multiple comma-separated expressions
      // usually mean the last one is the return value. We'll return the last one.
      const contents = ctx.local_stmt_content.map((c: CstNode) => this.visit(c));
      return contents[contents.length-1];
  }

  fun_body_multiline(ctx: any): string {
    return this.visit(ctx.local_stmts_multiline);
  }

  local_stmts_multiline(ctx: any): string {
    const body = this.visit(ctx.local_stmts_multiline2);
    return `{\n${body}\n}`;
  }

  local_stmts_multiline2(ctx: any): string {
    return ctx.local_stmt_multiline
      .map((s: CstNode) => "    " + this.visit(s))
      .join("\n");
  }

  local_stmt_multiline(ctx: any): string {
    const contents = ctx.local_stmt_content.map((c: CstNode) => this.visit(c));
    return contents.join(" ");
  }

  local_stmt_content(ctx: any): string {
    // Delegate to the specific statement type
    return this.visit(ctx.children[Object.keys(ctx.children)[0]][0]);
  }
  
  loop_break(): string {
    return "break;";
  }

  loop_continue(): string {
    return "continue;";
  }
  
  // Entry point for any expression
  arith_expr(ctx: any): string {
    // Delegate to the specific expression type
    return this.visit(ctx.children[Object.keys(ctx.children)[0]][0]);
  }

  // if expression
  if_expr(ctx: any): string {
    // The rule names are a bit confusing in the grammar.
    // if_then_expr is actually if-then-else.
    // if_then_else_expr is actually if-then.
    if (ctx.if_then_expr) {
        return this.visit(ctx.if_then_expr);
    }
    return this.visit(ctx.if_then_else_expr);
  }

  // if-then-else statement
  if_then_expr(ctx: any): string {
    const condition = this.visit(ctx.ternary_expr[0]);
    const thenBlock = this.visit(ctx.stmts_block[0]);
    const elseBlock = this.visit(ctx.stmts_block[1]);
    return `if (${condition}) ${thenBlock} else ${elseBlock}`;
  }

  // if-then statement
  if_then_else_expr(ctx: any): string {
    const condition = this.visit(ctx.ternary_expr[0]);
    const thenBlock = this.visit(ctx.stmts_block[0]);
    return `if (${condition}) ${thenBlock}`;
  }

  // for loop
  for_expr(ctx: any): string {
    if (ctx.for_loop_with_step) {
      return this.visit(ctx.for_loop_with_step);
    }
    return this.visit(ctx.for_loop_without_step);
  }

  for_loop_with_step(ctx: any): string {
    // The var_def inside a for loop gives us the initializer
    const initDef = ctx.var_def[0].children;
    const varName = initDef.ID[0].image;
    const startValue = this.visit(initDef.arith_expr[0]);

    const endValue = this.visit(ctx.ternary_expr[0]);
    const stepValue = this.visit(ctx.ternary_expr[1]);
    const body = this.visit(ctx.stmts_block[0]);
    
    return `for (let ${varName} = ${startValue}; ${varName} <= ${endValue}; ${varName} += ${stepValue}) ${body}`;
  }

  for_loop_without_step(ctx: any): string {
    const initDef = ctx.var_def[0].children;
    const varName = initDef.ID[0].image;
    const startValue = this.visit(initDef.arith_expr[0]);

    const endValue = this.visit(ctx.ternary_expr[0]);
    const body = this.visit(ctx.stmts_block[0]);
    
    // Default step is 1
    return `for (let ${varName} = ${startValue}; ${varName} <= ${endValue}; ${varName}++) ${body}`;
  }

  stmts_block(ctx: any): string {
      return this.visit(ctx.fun_body_multiline);
  }
  
  // Ternary operator: a ? b : c
  ternary_expr(ctx: any): string {
    const condition = this.visit(ctx.or_expr[0]);
    if (ctx.ternary_expr2) {
      const branches = this.visit(ctx.ternary_expr2[0]);
      return `(${condition} ? ${branches})`;
    }
    return condition;
  }

  ternary_expr2(ctx: any): string {
    const trueBranch = this.visit(ctx.ternary_expr[0]);
    const falseBranch = this.visit(ctx.ternary_expr[1]);
    return `${trueBranch} : ${falseBranch}`;
  }

  // Generic helper for binary expressions (e.g., a + b, a and b)
  private visitBinaryExpression(ctx: any, operandRule: string, operatorMap: Record<string, string>): string {
    let lhs = this.visit(ctx[operandRule][0]);

    if (ctx[operandRule].length > 1) {
        // Collect all operators present in the context
        const operators: IToken[] = Object.keys(operatorMap)
            .flatMap(key => ctx[key] || [])
            .sort((a, b) => a.startOffset - b.startOffset);

        for (let i = 1; i < ctx[operandRule].length; i++) {
            const operatorToken = operators[i - 1];
            const operator = operatorMap[operatorToken.tokenType.name];
            const rhs = this.visit(ctx[operandRule][i]);
            lhs = `(${lhs} ${operator} ${rhs})`;
        }
    }
    return lhs;
  }
  
  or_expr(ctx: any): string {
    return this.visitBinaryExpression(ctx, 'and_expr', { OR: '||' });
  }

  and_expr(ctx: any): string {
    return this.visitBinaryExpression(ctx, 'eq_expr', { AND: '&&' });
  }

  eq_expr(ctx: any): string {
    return this.visitBinaryExpression(ctx, 'cmp_expr', { EQ: '===', NEQ: '!==' });
  }

  cmp_expr(ctx: any): string {
    return this.visitBinaryExpression(ctx, 'add_expr', { GT: '>', GE: '>=', LT: '<', LE: '<=' });
  }

  add_expr(ctx: any): string {
    return this.visitBinaryExpression(ctx, 'mult_expr', { PLUS: '+', MINUS: '-' });
  }
  
  mult_expr(ctx: any): string {
    return this.visitBinaryExpression(ctx, 'unary_expr', { MUL: '*', DIV: '/', MOD: '%' });
  }
  
  unary_expr(ctx: any): string {
    if (ctx.NOT) {
      return `!(${this.visit(ctx.sqbr_expr[0])})`;
    }
    return this.visit(ctx.sqbr_expr[0]);
  }

  // Square bracket access: a[b]
  sqbr_expr(ctx: any): string {
    const base = this.visit(ctx.atom[0]);
    if (ctx.LSQBR) {
      const accessor = this.visit(ctx.arith_expr[0]);
      return `${base}[${accessor}]`;
    }
    return base;
  }
  
  // The smallest expression unit
  atom(ctx: any): string {
    if (ctx.fun_call) {
      return this.visit(ctx.fun_call);
    }
    if (ctx.ID) {
      return ctx.ID[0].image;
    }
    if (ctx.literal) {
      return this.visit(ctx.literal);
    }
    // Parenthesized expression
    if (ctx.LPAR) {
      return `(${this.visit(ctx.arith_expr[0])})`;
    }
    return '';
  }

  // Function call: f(a, b=2)
  fun_call(ctx: any): string {
    const funName = ctx.ID[0].image;
    const args = ctx.fun_actual_args ? this.visit(ctx.fun_actual_args) : "";
    return `${funName}(${args})`;
  }

  fun_actual_args(ctx: any): string {
    const posArgs = ctx.pos_args ? this.visit(ctx.pos_args) : [];
    const kwArgs = ctx.kw_args ? this.visit(ctx.kw_args) : null;
    
    let allArgs = [...posArgs];
    // Transpile keyword arguments into a single object, a common JS pattern
    if (kwArgs) {
        allArgs.push(`{ ${kwArgs.join(', ')} }`);
    }

    return allArgs.join(', ');
  }

  pos_args(ctx: any): string[] {
    return ctx.arith_expr.map((arg: CstNode) => this.visit(arg));
  }

  kw_args(ctx: any): string[] {
    return ctx.kw_arg.map((arg: CstNode) => this.visit(arg));
  }

  kw_arg(ctx: any): string {
    const key = ctx.ID[0].image;
    const value = this.visit(ctx.arith_expr[0]);
    // e.g., width: 10
    return `${key}: ${value}`;
  }
  
  literal(ctx: any): string {
    if (ctx.num_literal) {
      return this.visit(ctx.num_literal);
    }
    return this.visit(ctx.other_literal);
  }

  num_literal(ctx: any): string {
    const literalToken = ctx.INT_LITERAL?.[0] || ctx.FLOAT_LITERAL?.[0];
    return literalToken.image;
  }

  other_literal(ctx: any): string {
    const literalToken = ctx.STR_LITERAL?.[0] || ctx.BOOL_LITERAL?.[0] || ctx.COLOR_LITERAL?.[0];
    // Color literals like #FF5733 should be treated as strings in JS
    if (ctx.COLOR_LITERAL) {
      return `'${literalToken.image}'`;
    }
    return literalToken.image;
  }
}
