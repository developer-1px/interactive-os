/**
 * File Rename Refactoring Script (v2)
 *
 * Renames files to match their primary export and updates all imports.
 * Skips files with multiple exports (collection files).
 *
 * Usage: npx ts-node scripts/rename-to-match-export.ts [--dry-run]
 */

import * as fs from "fs";
import * as path from "path";
import { Node, Project } from "ts-morph";

const dryRun = process.argv.includes("--dry-run");
const project = new Project({
  tsConfigFilePath: "./tsconfig.app.json",
});

// Files to skip (collections, types, etc.)
const SKIP_PATTERNS = [
  /types\.ts$/,
  /schema\.ts$/,
  /constants\.ts$/,
  /utils\.ts$/,
  /helpers\.ts$/,
  /persistence\.ts$/,
  /AntigravityOS\.tsx$/, // Main facade
  /app\.ts$/, // App definitions
];

// Skip if more than this many exports (collection file)
const MAX_EXPORTS_FOR_RENAME = 3;

interface RenameAction {
  oldPath: string;
  newPath: string;
  reason: string;
}

const actions: RenameAction[] = [];

// Get all source files in src/
const sourceFiles = project.getSourceFiles("src/**/*.{ts,tsx}");

for (const sourceFile of sourceFiles) {
  const filePath = sourceFile.getFilePath();
  const fileName = path.basename(filePath, path.extname(filePath));
  const ext = path.extname(filePath);
  const dir = path.dirname(filePath);

  // Skip index files
  if (fileName === "index") continue;

  // Skip patterns
  if (SKIP_PATTERNS.some((p) => p.test(filePath))) continue;

  // Collect exports (excluding re-exports)
  const ownExports: { name: string; kind: string }[] = [];
  let defaultExportName: string | null = null;

  sourceFile.getExportedDeclarations().forEach((declarations, name) => {
    for (const decl of declarations) {
      // Skip if this is a re-export (declaration is from another file)
      if (decl.getSourceFile() !== sourceFile) continue;

      if (name === "default") {
        if (Node.isFunctionDeclaration(decl) || Node.isClassDeclaration(decl)) {
          const actualName = decl.getName();
          if (actualName) defaultExportName = actualName;
        } else if (Node.isVariableDeclaration(decl)) {
          defaultExportName = decl.getName();
        }
      } else {
        let kind = "unknown";
        if (Node.isFunctionDeclaration(decl)) kind = "function";
        else if (Node.isClassDeclaration(decl)) kind = "class";
        else if (Node.isVariableDeclaration(decl)) kind = "const";
        else if (Node.isTypeAliasDeclaration(decl)) kind = "type";
        else if (Node.isInterfaceDeclaration(decl)) kind = "interface";

        ownExports.push({ name, kind });
      }
    }
  });

  const allExports = defaultExportName
    ? [{ name: defaultExportName, kind: "default" }, ...ownExports]
    : ownExports;

  // Skip if no exports or too many (collection file)
  if (allExports.length === 0) continue;
  if (allExports.length > MAX_EXPORTS_FOR_RENAME) {
    // console.log(`⏭️  Skip (collection): ${filePath} (${allExports.length} exports)`);
    continue;
  }

  // Skip if primary export is ALL_CAPS (constant, not good for filename)
  const primaryExport = allExports[0].name;
  if (/^[A-Z_]+$/.test(primaryExport)) {
    // console.log(`⏭️  Skip (const): ${filePath} (${primaryExport})`);
    continue;
  }

  // Normalize for comparison
  const normalizedFileName = fileName.toLowerCase().replace(/[-_]/g, "");
  const normalizedExport = primaryExport.toLowerCase().replace(/[-_]/g, "");

  // Check if already matches
  const hasMatch = allExports.some((exp) => {
    const normExp = exp.name.toLowerCase().replace(/[-_]/g, "");
    return normExp === normalizedFileName;
  });

  if (!hasMatch) {
    const newFileName = primaryExport;
    const newPath = path.join(dir, newFileName + ext);

    // Skip if new path already exists
    if (fs.existsSync(newPath)) {
      console.log(`⚠️  Skip: ${filePath} -> ${newPath} (already exists)`);
      continue;
    }

    actions.push({
      oldPath: filePath,
      newPath,
      reason: `Export: ${primaryExport} (${allExports[0].kind})`,
    });
  }
}

// Output
console.log("\n=== File Rename Plan ===\n");

if (actions.length === 0) {
  console.log("✅ No renames needed!");
  process.exit(0);
}

console.log(`Found ${actions.length} files to rename:\n`);

for (const action of actions) {
  const relOld = path.relative(process.cwd(), action.oldPath);
  const relNew = path.relative(process.cwd(), action.newPath);
  console.log(`📄 ${relOld}`);
  console.log(`   -> ${relNew} (${action.reason})`);
  console.log();
}

if (dryRun) {
  console.log("🔍 Dry run mode - no changes made.");
  process.exit(0);
}

// Apply renames using ts-morph (updates imports automatically)
console.log("\n=== Applying Renames ===\n");

for (const action of actions) {
  const sourceFile = project.getSourceFile(action.oldPath);
  if (!sourceFile) continue;

  try {
    sourceFile.move(action.newPath);
    console.log(
      `✅ Renamed: ${path.basename(action.oldPath)} -> ${path.basename(action.newPath)}`,
    );
  } catch (e) {
    console.error(`❌ Failed: ${action.oldPath}`, e);
  }
}

// Save all changes
project.saveSync();
console.log("\n✅ All renames complete. Imports updated.");
