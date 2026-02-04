/**
 * File-Export Name Mismatch Checker
 * 
 * Finds files where the filename doesn't match the primary exported function/class/const.
 * 
 * Usage: npx ts-node scripts/check-file-export-mismatch.ts
 */

import { Project, SyntaxKind, Node } from "ts-morph";
import * as path from "path";

const project = new Project({
    tsConfigFilePath: "./tsconfig.app.json",
});

interface Mismatch {
    file: string;
    fileName: string;
    primaryExport: string;
    allExports: string[];
}

const mismatches: Mismatch[] = [];

// Get all source files in src/
const sourceFiles = project.getSourceFiles("src/**/*.{ts,tsx}");

for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    const fileName = path.basename(filePath, path.extname(filePath));

    // Skip index files and type declaration files
    if (fileName === "index" || fileName.endsWith(".d")) continue;

    // Collect all exports
    const namedExports: string[] = [];
    let defaultExportName: string | null = null;

    // Get named exports
    sourceFile.getExportedDeclarations().forEach((declarations, name) => {
        if (name === "default") {
            // Try to extract actual name from default export
            for (const decl of declarations) {
                if (Node.isFunctionDeclaration(decl) || Node.isClassDeclaration(decl)) {
                    const actualName = decl.getName();
                    if (actualName) {
                        defaultExportName = actualName;
                    }
                } else if (Node.isVariableDeclaration(decl)) {
                    defaultExportName = decl.getName();
                } else if (Node.isIdentifier(decl)) {
                    defaultExportName = decl.getText();
                }
            }
        } else {
            namedExports.push(name);
        }
    });

    // If only default export exists with no extractable name, skip
    if (namedExports.length === 0 && !defaultExportName) continue;

    const allExports = defaultExportName
        ? [defaultExportName, ...namedExports]
        : namedExports;

    if (allExports.length === 0) continue;

    // Normalize for comparison
    const normalizedFileName = fileName.toLowerCase().replace(/[-_]/g, "");

    // Check if any export matches the filename
    const hasMatch = allExports.some((exp) => {
        const normExp = exp.toLowerCase().replace(/[-_]/g, "");
        return normExp === normalizedFileName
            || normalizedFileName.includes(normExp)
            || normExp.includes(normalizedFileName);
    });

    if (!hasMatch) {
        mismatches.push({
            file: path.relative(process.cwd(), filePath),
            fileName,
            primaryExport: defaultExportName || namedExports[0],
            allExports,
        });
    }
}

// Output
console.log("\n=== File-Export Name Mismatch Report ===\n");

if (mismatches.length === 0) {
    console.log("✅ No mismatches found!");
} else {
    console.log(`Found ${mismatches.length} potential mismatches:\n`);

    for (const m of mismatches) {
        console.log(`📄 ${m.file}`);
        console.log(`   Filename: ${m.fileName}`);
        console.log(`   Exports:  ${m.allExports.join(", ")}`);
        console.log();
    }
}
