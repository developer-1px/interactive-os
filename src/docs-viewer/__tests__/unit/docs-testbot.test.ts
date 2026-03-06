/**
 * DocsViewer — Headless TestBot Runner (vitest)
 *
 * testbot-docs.ts의 scenarios를 auto-runner로 실행.
 * §4 (cross-zone Tab) 는 단일 zone goto()로 표현 불가 — 브라우저 TestBot 전용.
 */

import { runScenarios } from "@os-devtool/testing/runScenarios";
import { scenarios } from "../../testbot-docs";

runScenarios(scenarios);
