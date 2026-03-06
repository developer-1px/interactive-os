/**
 * Todo — Headless TestBot Runner (vitest)
 *
 * testbot-todo.ts의 scenarios를 auto-runner로 실행.
 */

import { runScenarios } from "@os-devtool/testing/runScenarios";
import { scenarios } from "../../testbot-todo";

runScenarios(scenarios);
