/**
 * Playwright Spec Loader
 *
 * Provides `usePlaywrightSpecs` — a React hook that mounts multiple
 * Playwright spec files as a single TestBot page suite.
 *
 * Usage:
 *   import runTabsSpec from "../../../../e2e/aria-showcase/tabs.spec.ts";
 *   const resetKey = usePlaywrightSpecs("aria-showcase", [runTabsSpec]);
 *   return <div key={resetKey}>...</div>;
 */

import { useCallback, useMemo } from "react";
import { type TestBot } from "../entities/TestBot";
import { useTestBotRoutes } from "../features/useTestBotRoutes";
import { getEntriesByFile, type TestEntry } from "./registry";
import { ShimPage } from "./shim";

// ── Flatten Utility ────────────────────────────────────────────

function flattenEntries(
    entries: TestEntry[],
    parentName = "",
    parentBeforeEach: Function[] = [],
): { name: string; fn: Function; beforeEach: Function[] }[] {
    const flat: { name: string; fn: Function; beforeEach: Function[] }[] = [];

    for (const entry of entries) {
        const fullName = parentName ? `${parentName} › ${entry.name}` : entry.name;
        const combinedBeforeEach = [
            ...parentBeforeEach,
            ...(entry.beforeEach || []),
        ];

        if (entry.type === "describe" && entry.children) {
            flat.push(
                ...flattenEntries(entry.children, fullName, combinedBeforeEach),
            );
        } else if (entry.type === "test") {
            flat.push({
                name: fullName,
                fn: entry.fn,
                beforeEach: combinedBeforeEach,
            });
        }
    }
    return flat;
}

// Track which spec files have been loaded (prevents duplicate execution)
const loadedFiles = new Set<string>();

type WrappedSpec = {
    (): void;
    sourceFile: string;
};

// ── Hook ───────────────────────────────────────────────────────

/**
 * Mount multiple Playwright specs as a single TestBot page suite.
 * 
 * Guaranteed execution order matches the array order.
 * Use this when a page has multiple spec files (e.g. component tests).
 *
 * @param pageId  - Unique ID for the page (e.g. "aria-showcase").
 * @param runSpecs - Array of wrapped spec functions.
 */
export function usePlaywrightSpecs(
    pageId: string,
    runSpecs: WrappedSpec[],
): number {
    // 1. Ensure all specs are loaded into registry (idempotent)
    // We do this immediately in the render phase (or memo) to ensure
    // registry is populated before definer is called.
    for (const runSpec of runSpecs) {
        const src = runSpec.sourceFile;
        if (!loadedFiles.has(src)) {
            runSpec(); // Run the spec function (populates registry)
            loadedFiles.add(src);
        }
    }

    // 2. Memoize source files to keep definer stable
    // We assume runSpecs array content (filenames) doesn't change for the component lifetime.
    const sourceFiles = useMemo(
        () => runSpecs.map((s) => s.sourceFile),
        // If runSpecs array is re-created but contents are same, we want stable result.
        // JSON.stringify is cheap for array of strings.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(runSpecs.map((s) => s.sourceFile))],
    );

    // 3. Stable definer callback
    const definer = useCallback(
        (bot: TestBot) => {
            for (const src of sourceFiles) {
                const entries = getEntriesByFile(src);
                const flat = flattenEntries(entries);

                for (const suite of flat) {
                    bot.describe(suite.name, async (t) => {
                        const page = new ShimPage(t);
                        // TODO: Implement proper context isolation/reset here?
                        // Currently we rely on test.beforeEach().
                        for (const hook of suite.beforeEach) {
                            await hook({ page });
                        }
                        await suite.fn({ page });
                    });
                }
            }
        },
        [sourceFiles],
    );

    return useTestBotRoutes(pageId, definer);
}

// Backward compatibility alias (if needed during refactor)
export function usePlaywrightSpec(pageId: string, runSpec: WrappedSpec): number {
    return usePlaywrightSpecs(pageId, [runSpec]);
}
