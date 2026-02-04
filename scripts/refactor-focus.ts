/**
 * Focus System Refactoring Script
 * 
 * ts-morph를 사용하여 6-Axis 중심 구조로 리팩토링합니다.
 * 
 * 실행: npx ts-node scripts/refactor-focus.ts
 */

import { Project, SourceFile, SyntaxKind } from "ts-morph";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "../src/os/core");
const FOCUS_DIR = path.join(ROOT, "focus");

// ============================================================
// Phase 1: 디렉토리 구조 생성
// ============================================================

const NEW_DIRS = [
    "focus/store",
    "focus/behavior",
    "focus/axes/direction",
    "focus/axes/edge",
    "focus/axes/tab",
    "focus/axes/target",
    "focus/axes/entry",
    "focus/axes/restore",
    "focus/utils",
];

function createDirectories() {
    console.log("\n📁 Phase 1: Creating directory structure...\n");

    for (const dir of NEW_DIRS) {
        const fullPath = path.join(ROOT, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`  ✅ Created: ${dir}`);
        } else {
            console.log(`  ⏭️  Exists: ${dir}`);
        }
    }
}

// ============================================================
// Phase 2: 파일 분할 - focusBehavior.ts
// ============================================================

function splitFocusBehavior(project: Project) {
    console.log("\n📄 Phase 2a: Splitting focusBehavior.ts...\n");

    const sourceFile = project.getSourceFile(path.join(ROOT, "focusBehavior.ts"));
    if (!sourceFile) {
        console.log("  ⚠️  focusBehavior.ts not found, skipping...");
        return;
    }

    // 1. behaviorTypes.ts - 타입 정의만
    const types = sourceFile.getTypeAliases().map(t => t.getText()).join("\n\n");
    const interfaces = sourceFile.getInterfaces().map(i => i.getText()).join("\n\n");

    const typesContent = `// Focus Behavior Types (6-Axis System)

${types}

${interfaces}
`;

    fs.writeFileSync(
        path.join(ROOT, "focus/behavior/behaviorTypes.ts"),
        typesContent
    );
    console.log("  ✅ Created: behavior/behaviorTypes.ts");

    // 2. behaviorPresets.ts - FOCUS_PRESETS 상수
    const presetsVar = sourceFile.getVariableDeclaration("FOCUS_PRESETS");
    if (presetsVar) {
        const presetsContent = `// ARIA Role Based Focus Behavior Presets
import type { FocusBehavior } from "./behaviorTypes";

${presetsVar.getParent().getText()}
`;
        fs.writeFileSync(
            path.join(ROOT, "focus/behavior/behaviorPresets.ts"),
            presetsContent
        );
        console.log("  ✅ Created: behavior/behaviorPresets.ts");
    }

    // 3. behaviorResolver.ts - resolveBehavior 함수
    const resolverFn = sourceFile.getFunction("resolveBehavior");
    if (resolverFn) {
        const resolverContent = `// Focus Behavior Resolver
import type { FocusBehavior } from "./behaviorTypes";
import { FOCUS_PRESETS } from "./behaviorPresets";

${resolverFn.getText()}
`;
        fs.writeFileSync(
            path.join(ROOT, "focus/behavior/behaviorResolver.ts"),
            resolverContent
        );
        console.log("  ✅ Created: behavior/behaviorResolver.ts");
    }
}

// ============================================================
// Phase 2: 파일 분할 - navigation.ts
// ============================================================

function splitNavigation(project: Project) {
    console.log("\n📄 Phase 2b: Splitting navigation.ts...\n");

    const sourceFile = project.getSourceFile(path.join(ROOT, "navigation.ts"));
    if (!sourceFile) {
        console.log("  ⚠️  navigation.ts not found, skipping...");
        return;
    }

    // Direction type export
    const directionType = sourceFile.getTypeAlias("Direction");
    const directionTypeText = directionType ? directionType.getText() : 'export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";';

    // NavigationContext interface
    const navContextInterface = sourceFile.getInterface("NavigationContext");
    const navContextText = navContextInterface ? navContextInterface.getText() : "";

    // 1. rovingNavigation.ts
    const rovingFn = sourceFile.getFunction("findNextRovingTarget");
    if (rovingFn) {
        const rovingContent = `// Roving Navigation Engine (1D: v/h)
import type { FocusBehavior } from "../behavior/behaviorTypes";

${directionTypeText}

${navContextText}

${rovingFn.getText()}
`;
        fs.writeFileSync(
            path.join(ROOT, "focus/axes/direction/rovingNavigation.ts"),
            rovingContent
        );
        console.log("  ✅ Created: axes/direction/rovingNavigation.ts");
    }

    // 2. spatialNavigation.ts
    const spatialFn = sourceFile.getFunction("findNextSpatialTarget");
    if (spatialFn) {
        const spatialContent = `// Spatial Navigation Engine (2D: grid)

${directionTypeText}

interface NavigationContext {
    currentId: string | null;
    items: string[];
    direction: Direction;
    itemRects?: Record<string, DOMRect>;
    stickyX?: number | null;
    stickyY?: number | null;
}

${spatialFn.getText()}
`;
        fs.writeFileSync(
            path.join(ROOT, "focus/axes/direction/spatialNavigation.ts"),
            spatialContent
        );
        console.log("  ✅ Created: axes/direction/spatialNavigation.ts");
    }

    // 3. directionDispatcher.ts
    const dispatcherFn = sourceFile.getFunction("findNextTarget");
    if (dispatcherFn) {
        const dispatcherContent = `// Direction Axis Dispatcher
import { logger } from "@os/debug/logger";
import type { FocusBehavior } from "../behavior/behaviorTypes";
import { findNextRovingTarget } from "./rovingNavigation";
import { findNextSpatialTarget } from "./spatialNavigation";

${directionTypeText}

export interface NavigationContext {
    currentId: string | null;
    items: string[];
    direction: Direction;
    itemRects?: Record<string, DOMRect>;
    stickyX?: number | null;
    stickyY?: number | null;
}

${dispatcherFn.getText()}
`;
        fs.writeFileSync(
            path.join(ROOT, "focus/axes/direction/directionDispatcher.ts"),
            dispatcherContent
        );
        console.log("  ✅ Created: axes/direction/directionDispatcher.ts");
    }
}

// ============================================================
// Phase 3: 파일 이동
// ============================================================

function moveFiles() {
    console.log("\n📦 Phase 3: Moving files...\n");

    const moves: [string, string][] = [
        // Slices -> Store
        ["focus/slices/zoneSlice.ts", "focus/store/zoneSlice.ts"],
        ["focus/slices/cursorSlice.ts", "focus/store/cursorSlice.ts"],
        ["focus/slices/spatialSlice.ts", "focus/store/spatialSlice.ts"],
        // Types
        ["focus/types.ts", "focus/focusTypes.ts"],
        // Utils
        ["focus/domUtils.ts", "focus/utils/domUtils.ts"],
        ["focus/utils.ts", "focus/utils/pathUtils.ts"],
        // Bridge
        ["focus/useFocusBridge.ts", "focus/focusBridge.ts"],
        // Store entry (renamed)
        ["focus.ts", "focus/focusStore.ts"],
    ];

    for (const [from, to] of moves) {
        const fromPath = path.join(ROOT, from);
        const toPath = path.join(ROOT, to);

        if (fs.existsSync(fromPath) && !fs.existsSync(toPath)) {
            // Create a copy, don't delete original yet (safer)
            fs.copyFileSync(fromPath, toPath);
            console.log(`  ✅ Copied: ${from} → ${to}`);
        } else if (!fs.existsSync(fromPath)) {
            console.log(`  ⏭️  Source not found: ${from}`);
        } else {
            console.log(`  ⏭️  Already exists: ${to}`);
        }
    }
}

// ============================================================
// Phase 4: Import 경로 업데이트
// ============================================================

function updateImports(project: Project) {
    console.log("\n🔄 Phase 4: Updating import paths...\n");

    const importMappings: [RegExp, string][] = [
        // focusBehavior.ts imports
        [/from\s+["']@os\/core\/focusBehavior["']/g, 'from "@os/core/focus/behavior/behaviorResolver"'],
        [/from\s+["']\.\.\/focusBehavior["']/g, 'from "./behavior/behaviorResolver"'],
        [/from\s+["']\.\/focusBehavior["']/g, 'from "./focus/behavior/behaviorResolver"'],

        // focus.ts (store) imports
        [/from\s+["']@os\/core\/focus["']/g, 'from "@os/core/focus/focusStore"'],

        // navigation.ts imports
        [/from\s+["']@os\/core\/navigation["']/g, 'from "@os/core/focus/axes/direction/directionDispatcher"'],

        // Slice imports
        [/from\s+["']\.\.\/slices\/zoneSlice["']/g, 'from "../store/zoneSlice"'],
        [/from\s+["']\.\.\/slices\/cursorSlice["']/g, 'from "../store/cursorSlice"'],
        [/from\s+["']\.\.\/slices\/spatialSlice["']/g, 'from "../store/spatialSlice"'],
        [/from\s+["']\.\/slices\/zoneSlice["']/g, 'from "./store/zoneSlice"'],
        [/from\s+["']\.\/slices\/cursorSlice["']/g, 'from "./store/cursorSlice"'],
        [/from\s+["']\.\/slices\/spatialSlice["']/g, 'from "./store/spatialSlice"'],
    ];

    // Get all source files in src/
    const srcPath = path.resolve(__dirname, "../src");
    const allFiles = project.getSourceFiles(`${srcPath}/**/*.{ts,tsx}`);

    let updatedCount = 0;

    for (const file of allFiles) {
        let text = file.getText();
        let changed = false;

        for (const [pattern, replacement] of importMappings) {
            if (pattern.test(text)) {
                text = text.replace(pattern, replacement);
                changed = true;
            }
        }

        if (changed) {
            file.replaceWithText(text);
            updatedCount++;
        }
    }

    console.log(`  ✅ Updated imports in ${updatedCount} files`);
}

// ============================================================
// Main
// ============================================================

async function main() {
    console.log("🚀 Focus System Refactoring Script");
    console.log("==================================\n");

    // Initialize ts-morph project
    const project = new Project({
        tsConfigFilePath: path.resolve(__dirname, "../tsconfig.json"),
    });

    // Phase 1: Create directories
    createDirectories();

    // Phase 2: Split files
    splitFocusBehavior(project);
    splitNavigation(project);

    // Phase 3: Move files
    moveFiles();

    // Reload project to pick up new files
    project.addSourceFilesAtPaths(path.resolve(__dirname, "../src/**/*.{ts,tsx}"));

    // Phase 4: Update imports
    updateImports(project);

    // Save all changes
    console.log("\n💾 Saving changes...\n");
    await project.save();

    console.log("✅ Refactoring complete!");
    console.log("\n⚠️  Next steps:");
    console.log("   1. Run 'npm run build' to check for errors");
    console.log("   2. Fix any remaining import issues manually");
    console.log("   3. Delete original files after verification");
}

main().catch(console.error);
