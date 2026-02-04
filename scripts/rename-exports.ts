/**
 * Phase 2: Rename Exports to Match File Names
 * 
 * Usage: npx ts-node scripts/rename-exports.ts [--dry-run]
 */

import { Project, SyntaxKind, Node } from "ts-morph";
import * as path from "path";

const dryRun = process.argv.includes("--dry-run");
const project = new Project({
    tsConfigFilePath: "./tsconfig.app.json",
});

// Export renames: [file path, old export name, new export name]
const EXPORT_RENAMES: [string, string, string][] = [
    // Handlers
    ["src/os/features/focus/axes/handlerDirection.ts", "directionAxis", "handlerDirection"],
    ["src/os/features/focus/axes/handlerEntry.ts", "entryAxis", "handlerEntry"],
    ["src/os/features/focus/axes/handlerRestore.ts", "restoreAxis", "handlerRestore"],
    ["src/os/features/focus/axes/handlerRecovery.ts", "executeRecovery", "handlerRecovery"],
    ["src/os/features/focus/axes/handlerSeamless.ts", "findSiblingZone", "handlerSeamless"],
    ["src/os/features/focus/axes/handlerTab.ts", "executeTabNavigation", "handlerTab"],
    ["src/os/features/focus/axes/handlerTarget.ts", "applyFocus", "handlerTarget"],
    ["src/os/features/focus/axes/handlerEdge.ts", "wrapIndex", "handlerEdge"],

    // Store - keep useFocusStore as it's the actual hook, but the file should describe the module
    // Actually, Zustand stores ARE used as hooks, so useFocusStore is correct
    // We reverted the FILE name, but the export name `useFocusStore` is fine.

    // Utils - these export multiple things, we won't rename them
    // Resolvers
    ["src/os/features/focus/lib/behaviorResolver.ts", "resolveBehavior", "resolveBehavior"], // Keep - verb is fine

    // Pipeline
    ["src/os/features/focus/lib/focusPipeline.ts", "runPipeline", "focusPipeline"],

    // Navigation
    ["src/os/features/focus/lib/navigationRoving.ts", "findNextRovingTarget", "navigationRoving"],
    ["src/os/features/focus/lib/navigationSpatial.ts", "findNextSpatialTarget", "navigationSpatial"],
];

console.log("\n=== Phase 2: Rename Exports ===\n");

if (dryRun) {
    console.log("🔍 Dry run mode\n");
}

for (const [filePath, oldName, newName] of EXPORT_RENAMES) {
    if (oldName === newName) {
        console.log(`⏭️  Skip (same): ${oldName}`);
        continue;
    }

    const sourceFile = project.getSourceFile(filePath);
    if (!sourceFile) {
        console.log(`⚠️  Not found: ${filePath}`);
        continue;
    }

    // Find and rename the export
    const exportDecl = sourceFile.getVariableDeclaration(oldName)
        || sourceFile.getFunction(oldName);

    if (exportDecl) {
        console.log(`📝 ${oldName} -> ${newName} (in ${path.basename(filePath)})`);
        if (!dryRun) {
            exportDecl.rename(newName);
        }
    } else {
        console.log(`⚠️  Export not found: ${oldName} in ${filePath}`);
    }
}

if (!dryRun) {
    project.saveSync();
    console.log("\n✅ Phase 2 complete. Exports renamed.");
} else {
    console.log("\n🔍 Dry run complete. No changes made.");
}
