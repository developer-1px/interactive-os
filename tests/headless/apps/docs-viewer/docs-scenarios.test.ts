/**
 * DocsViewer — auto-runner for testbot-docs.ts scenarios.
 *
 * Bridges testbot scenarios (§1 Sidebar, §2 Recent, §3 Favorites)
 * to vitest via runScenarios().
 *
 * Mocks:
 *   - virtual:docs-meta → alias to __mocks__/docs-meta.ts (vitest.config.ts)
 *   - @/docs-viewer/docsUtils → shared mock (__mocks__/docsUtils.ts)
 */

import { vi } from "vitest";

// ── Mock docsUtils before any app imports ──
vi.mock("@/docs-viewer/docsUtils", () => import("./__mocks__/docsUtils"));

// ── Now safe to import app modules ──

import { runScenarios } from "@os-testing/runScenarios";
import { DocsApp } from "@/docs-viewer/app";
import { DocsViewer } from "@/docs-viewer/DocsViewer";
import { scenarios } from "@/docs-viewer/testbot-docs";

runScenarios(scenarios, DocsApp, DocsViewer);
