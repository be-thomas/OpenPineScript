import { Project, Node, SyntaxKind } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

function generateConfig(stdlibPath: string) {
    const project = new Project({ compilerOptions: { allowJs: true } });
    const absolutePath = path.resolve(stdlibPath);
    
    // 1. Scan for valid module files
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
        const prefix = moduleName === "color" ? "color." : (hasNamespaceFlag ? `${moduleName}.` : "");

        // --- 1. Standard Functions (e.g., ta.sma, core.na) ---
        sourceFile.getFunctions().forEach(fn => {
            if (!fn.isExported()) return;

            const funcName = fn.getName()!;
            const params = fn.getParameters().map(p => p.getName());
            const fullKey = `${prefix}${funcName}`;

            const isContextAware = params[0] === "ctx";
            const args = isContextAware ? params.slice(1) : params;
            
            // Check JSDoc for @getter
            const isGetter = fn.getJsDocs().some(doc => 
                doc.getTags().some(tag => tag.getTagName() === "getter")
            );

            registryEntries.push(`      "${fullKey}": {`);
            registryEntries.push(`          uses_context: ${isContextAware},`);
            registryEntries.push(`          args: ${JSON.stringify(args)},`);
            registryEntries.push(`          is_getter: ${isGetter},`);
            registryEntries.push(`          is_value: false,`); // Standard functions are never static values
            registryEntries.push(`          ref: ${moduleName}.${funcName}`);
            registryEntries.push(`      },`);
        });

        // --- 2. Object Literals (e.g., color.ts, strategy.direction) ---
        sourceFile.getVariableDeclarations().forEach(varDecl => {
            const init = varDecl.getInitializer();
            
            if (init && Node.isObjectLiteralExpression(init)) {
                const isDefault = sourceFile.getStatementByKind(SyntaxKind.ExportAssignment)?.getExpression().getText() === varDecl.getName();
                const isExported = varDecl.isExported() || isDefault;

                if (!isExported) return;

                const varName = varDecl.getName();
                const accessorBase = isDefault ? `${moduleName}.default` : `${moduleName}.${varName}`;

                init.getProperties().forEach(prop => {
                    if (Node.isPropertyAssignment(prop)) {
                        const propName = prop.getName().replace(/['"]/g, '');
                        const fullKey = `${prefix}${propName}`;
                        const initializer = prop.getInitializer();

                        let isContextAware = false;
                        let args: string[] = [];
                        let isGetter = false;
                        let isValue = true; // Assume it's a static value by default (like color.red)

                        // If the property is a function, parse it and unflag isValue
                        if (initializer && (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer))) {
                            isValue = false; 
                            const params = initializer.getParameters().map(p => p.getName());
                            isContextAware = params[0] === "ctx";
                            args = isContextAware ? params.slice(1) : params;
                        }

                        registryEntries.push(`      "${fullKey}": {`);
                        registryEntries.push(`          uses_context: ${isContextAware},`);
                        registryEntries.push(`          args: ${JSON.stringify(args)},`);
                        registryEntries.push(`          is_getter: ${isGetter},`); // Keeping false for object literal props
                        registryEntries.push(`          is_value: ${isValue},`);
                        registryEntries.push(`          ref: ${accessorBase}["${propName}"]`);
                        registryEntries.push(`      },`);
                    }
                });
            }
        });
    });

    // --- 3. Write Output ---
    const content = `// This file is AUTO-GENERATED. Do not edit manually.
${imports.join("\n")}

export interface StdlibEntry {
    uses_context: boolean;
    args: string[];
    is_getter: boolean;
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
    console.log(`✅ Registry generated at: ${outputFile}`);
}

generateConfig("./runtime/v2/stdlib");