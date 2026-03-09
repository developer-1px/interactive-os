/**
 * Todo App — auto-runner for testbot-todo.ts scenarios.
 *
 * Bridges testbot scenarios (§1 List, §2 Sidebar)
 * to vitest via runScenarios().
 *
 * "Write once, run anywhere":
 *   - Headless (vitest): this file
 *   - Browser (TestBot): testbot-manifest auto-discovery
 *   - Playwright E2E: tests/e2e/todo.spec.ts
 */

import { TodoApp } from "@apps/todo/app";
import { scenarios } from "@apps/todo/testbot-todo";
import { runScenarios } from "@os-devtool/testing/runScenarios";
import TodoPage from "../../../../src/pages/TodoPage";

runScenarios(scenarios, TodoApp, TodoPage);
