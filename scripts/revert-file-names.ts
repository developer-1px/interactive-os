/**
 * Phase 1: Revert File Names to Original
 * 
 * Usage: npx ts-node scripts/revert-file-names.ts [--dry-run]
 */

import { Project } from "ts-morph";
import * as path from "path";

const dryRun = process.argv.includes("--dry-run");
const project = new Project({
    tsConfigFilePath: "./tsconfig.app.json",
});

// Files to revert: [current name, original name]
const REVERT_MAP: [string, string][] = [
    // Handlers (axes)
    ["src/os/features/focus/axes/directionAxis.ts", "src/os/features/focus/axes/handlerDirection.ts"],
    ["src/os/features/focus/axes/entryAxis.ts", "src/os/features/focus/axes/handlerEntry.ts"],
    ["src/os/features/focus/axes/restoreAxis.ts", "src/os/features/focus/axes/handlerRestore.ts"],
    ["src/os/features/focus/axes/executeRecovery.ts", "src/os/features/focus/axes/handlerRecovery.ts"],
    ["src/os/features/focus/axes/findSiblingZone.ts", "src/os/features/focus/axes/handlerSeamless.ts"],
    ["src/os/features/focus/axes/executeTabNavigation.ts", "src/os/features/focus/axes/handlerTab.ts"],
    ["src/os/features/focus/axes/applyFocus.ts", "src/os/features/focus/axes/handlerTarget.ts"],
    ["src/os/features/focus/axes/wrapIndex.ts", "src/os/features/focus/axes/handlerEdge.ts"],

    // Store
    ["src/os/features/focus/model/useFocusStore.ts", "src/os/features/focus/model/focusStore.ts"],

    // Resolvers & Utils
    ["src/os/features/focus/lib/resolveBehavior.ts", "src/os/features/focus/lib/behaviorResolver.ts"],
    ["src/os/features/focus/lib/collectItemRects.ts", "src/os/features/focus/lib/domUtils.ts"],
    ["src/os/features/focus/lib/computePath.ts", "src/os/features/focus/lib/pathUtils.ts"],
    ["src/os/features/focus/lib/getBubblePath.ts", "src/os/features/focus/lib/pivotUtils.ts"],
    ["src/os/features/focus/lib/runPipeline.ts", "src/os/features/focus/lib/focusPipeline.ts"],
    ["src/os/features/focus/lib/findNextRovingTarget.ts", "src/os/features/focus/lib/navigationRoving.ts"],
    ["src/os/features/focus/lib/findNextSpatialTarget.ts", "src/os/features/focus/lib/navigationSpatial.ts"],
];

console.log("\n=== Phase 1: Revert File Names ===\n");

if (dryRun) {
    console.log("🔍 Dry run mode\n");
}

for (const [currentPath, originalPath] of REVERT_MAP) {
    const sourceFile = project.getSourceFile(currentPath);

    if (!sourceFile) {
        console.log(`⚠️  Not found: ${currentPath}`);
        continue;
    }

    const currentName = path.basename(currentPath);
    const originalName = path.basename(originalPath);

    console.log(`📄 ${currentName} -> ${originalName}`);

    if (!dryRun) {
        sourceFile.move(originalPath);
    }
}

if (!dryRun) {
    project.saveSync();
    console.log("\n✅ Phase 1 complete. Files reverted.");
} else {
    console.log("\n🔍 Dry run complete. No changes made.");
}
