/**
 * DocsViewer — auto-runner for testbot-docs.ts scenarios.
 *
 * Bridges testbot scenarios (§1 Sidebar, §2 Recent, §3 Favorites)
 * to vitest via runScenarios().
 */

import { runScenarios } from "@os-devtool/testing/runScenarios";
import { DocsApp } from "@/docs-viewer/app";
import { scenarios } from "@/docs-viewer/testbot-docs";

runScenarios(scenarios, DocsApp);
