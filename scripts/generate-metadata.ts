import { Project, Node, SyntaxKind } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

/**
 * Helper: Parses the @returns JSDoc string into a structured PineType object.
 */
function parseReturnType(raw: string): any {
    const text = raw.trim();
    // Handle Tuples: [float, float]
    if (text.startsWith("[") && text.endsWith("]")) {
        const inner = text.slice(1, -1);
        const parts = inner.split(",").map(p => p.trim());
        return {
            kind: "tuple",
            itemTypes: parts.map(p => ({ kind: "series", type: p }))
        };
    }
    // Handle Series
    if (text.startsWith("series")) {
        return { kind: "series", type: text.replace("series", "").trim() || "any" };
    }
    // Default to Scalar
    return { kind: "scalar", type: text || "any" };
}

function generateConfig(stdlibPath: string) {
    const project = new Project({ compilerOptions: { allowJs: true } });
    const absolutePath = path.resolve(stdlibPath);
    
    const files = fs.readdirSync(absolutePath).filter(file => {
        const ext = path.extname(file);
        const name = path.basename(file, ext);
        return [".ts", ".js"].includes(ext) && !["index", "metadata", "registry"].includes(name);
    });

    project.addSourceFilesAtPaths(files.map(f => path.join(absolutePath, f)));

    const imports: string[] = [];
    const registryEntries: string[] = [];

    files.forEach(file => {
        const sourceFile = project.getSourceFile(file);
        if (!sourceFile) return;

        const ext = path.extname(file);
        const moduleName = path.basename(file, ext);
        imports.push(`import * as ${moduleName} from "./${moduleName}";`);
        
        const hasNamespaceFlag = sourceFile.getVariableDeclaration("__IS_NAMESPACE__")?.isExported();
        const prefix = hasNamespaceFlag ? `${moduleName}.` : "";

        // --- PHASE 1: Standard Functions ---
        sourceFile.getFunctions().forEach(fn => {
            if (!fn.isExported()) return;

            const funcName = fn.getName()!;
            const params = fn.getParameters().map(p => p.getName());
            const fullKey = `${prefix}${funcName}`;

            const isContextAware = params[0] === "ctx";
            const args = isContextAware ? params.slice(1) : params;
            
            const jsDocs = fn.getJsDocs();
            const isGetter = jsDocs.some(doc => 
                doc.getTags().some(tag => tag.getTagName() === "getter")
            );

            // Extract @returns
            const returnsTag = jsDocs.flatMap(d => d.getTags()).find(t => t.getTagName() === "returns");
            const returnsObj = parseReturnType(returnsTag ? returnsTag.getCommentText()?.trim() || "any" : "any");

            registryEntries.push(`      "${fullKey}": {`);
            registryEntries.push(`          uses_context: ${isContextAware},`);
            registryEntries.push(`          args: ${JSON.stringify(args)},`);
            registryEntries.push(`          is_getter: ${isGetter},`);
            registryEntries.push(`          returns: ${JSON.stringify(returnsObj)},`);
            registryEntries.push(`          is_value: false,`);
            registryEntries.push(`          ref: ${moduleName}.${funcName}`);
            registryEntries.push(`      },`);
        });

        // --- PHASE 2: Object Literals (e.g., strategy.risk.max_intraday_loss) ---
        sourceFile.getVariableDeclarations().forEach(varDecl => {
            const init = varDecl.getInitializer();
            if (init && Node.isObjectLiteralExpression(init)) {
                const varName = varDecl.getName();
                
                // Skip the internal namespace flag itself
                if (varName === "__IS_NAMESPACE__") return;

                const isDefault = sourceFile.getStatementByKind(SyntaxKind.ExportAssignment)?.getExpression().getText() === varName;
                const isExported = varDecl.isExported() || isDefault;
                if (!isExported) return;

                // If the file is a namespace (e.g. strategy.), and we found an object (e.g. risk)
                // The new prefix for properties inside should be "strategy.risk."
                const nestedPrefix = `${prefix}${varName}.`;
                const accessorBase = isDefault ? `(${moduleName}.default || ${moduleName})` : `${moduleName}.${varName}`;

                init.getProperties().forEach(prop => {
                    if (Node.isPropertyAssignment(prop)) {
                        const propName = prop.getName().replace(/['"]/g, '');
                        if (propName === "__IS_NAMESPACE__") return; 

                        // FIXED: Use nestedPrefix instead of prefix
                        const fullKey = `${nestedPrefix}${propName}`;
                        const initializer = prop.getInitializer();

                        let isContextAware = false;
                        let args: string[] = [];
                        let isGetter = false;
                        let isValue = true; 

                        if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
                            isValue = false; 
                            const params = initializer.getParameters().map(p => p.getName());
                            isContextAware = params[0] === "ctx";
                            args = isContextAware ? params.slice(1) : params;
                        }

                        // Determine return type logic
                        const type = moduleName === 'color' ? 'color' : 'any';
                        const returnsObj = { kind: "scalar", type };

                        registryEntries.push(`      "${fullKey}": {`);
                        registryEntries.push(`          uses_context: ${isContextAware},`);
                        registryEntries.push(`          args: ${JSON.stringify(args)},`);
                        registryEntries.push(`          is_getter: ${isGetter},`); 
                        registryEntries.push(`          returns: ${JSON.stringify(returnsObj)},`);
                        registryEntries.push(`          is_value: ${isValue},`);
                        registryEntries.push(`          ref: ${accessorBase}["${propName}"]`);
                        registryEntries.push(`      },`);
                    }
                });
            }
        });

        // --- PHASE 3: Flat Exported Constants (e.g., export const red = "#FF5252") ---
        sourceFile.getVariableDeclarations().forEach(varDecl => {
            if (!varDecl.isExported()) return;

            const init = varDecl.getInitializer();
            if (init && (Node.isObjectLiteralExpression(init) || Node.isArrowFunction(init) || Node.isFunctionExpression(init))) {
                return; 
            }

            const varName = varDecl.getName();
            if (varName === "__IS_NAMESPACE__") return; 

            const fullKey = `${prefix}${varName}`;
            const type = moduleName === 'color' ? 'color' : 'any';
            const returnsObj = { kind: "scalar", type };

            registryEntries.push(`      "${fullKey}": {`);
            registryEntries.push(`          uses_context: false,`);
            registryEntries.push(`          args: [],`);
            registryEntries.push(`          is_getter: false,`); 
            registryEntries.push(`          returns: ${JSON.stringify(returnsObj)},`);
            registryEntries.push(`          is_value: true,`); 
            registryEntries.push(`          ref: ${moduleName}.${varName}`);
            registryEntries.push(`      },`);
        });
    });

    const content = `// This file is AUTO-GENERATED. Do not edit manually.
${imports.join("\n")}

export interface PineType {
    kind: "scalar" | "series" | "tuple";
    type?: string;
    itemTypes?: PineType[];
}

export interface StdlibEntry {
    uses_context: boolean;
    args: string[];
    is_getter: boolean;
    returns: PineType;
    is_value: boolean;
    ref: any;
}

export function getGeneratedRegistry(): Record<string, StdlibEntry> {
    return {
${registryEntries.join("\n")}
    };
}
`;

    const outputFile = path.join(absolutePath, "metadata.ts");
    fs.writeFileSync(outputFile, content);
    console.log(`✅ Registry generated with structured types at: ${outputFile}`);
}

generateConfig("./runtime/v2/stdlib");