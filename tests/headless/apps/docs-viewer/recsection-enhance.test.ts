// @ts-nocheck — Red tests: isProjectMarkdown and commitMessage not yet implemented
/**
 * recsection-enhance — T1 + T4 unit tests.
 *
 * T1: getAgentRecentFiles should propagate commitMessage from entries.
 * T4: isProjectMarkdown should identify .md files for MarkdownRenderer routing.
 *
 * These are pure function tests — no page/zone interaction.
 * TestScript exception: page를 사용하지 않는 순수 단위 테스트.
 */

import { describe, expect, it } from "vitest";
import {
  getAgentRecentFiles,
  isProjectMarkdown,
} from "@/docs-viewer/docsUtils";

// ═══════════════════════════════════════════════════════════════════
// T1: commitMessage enrichment
// ═══════════════════════════════════════════════════════════════════

describe("T1: commitMessage enrichment", () => {
  it("commitMessage가 있는 entry → AgentRecentFile에 commitMessage 포함", () => {
    const entries = [
      {
        ts: "2026-03-12T10:00:00Z",
        session: "sess-aaa",
        tool: "Edit",
        detail: "/project/src/app.ts",
        commitMessage: "feat: add new feature",
      },
    ];
    const result = getAgentRecentFiles(entries, "/project/", 10);
    expect(result[0]?.commitMessage).toBe("feat: add new feature");
  });

  it("commitMessage가 없는 entry → AgentRecentFile.commitMessage는 undefined", () => {
    const entries = [
      {
        ts: "2026-03-12T10:00:00Z",
        session: "sess-aaa",
        tool: "Edit",
        detail: "/project/src/app.ts",
      },
    ];
    const result = getAgentRecentFiles(entries, "/project/", 10);
    expect(result[0]?.commitMessage).toBeUndefined();
  });

  it("git 저장소가 아닌 환경 → 모든 commitMessage는 undefined", () => {
    const entries = [
      {
        ts: "2026-03-12T10:00:00Z",
        session: "sess-aaa",
        tool: "Read",
        detail: "/project/src/utils.ts",
      },
      {
        ts: "2026-03-12T09:00:00Z",
        session: "sess-bbb",
        tool: "Write",
        detail: "/project/src/index.ts",
      },
    ];
    const result = getAgentRecentFiles(entries, "/project/", 10);
    for (const file of result) {
      expect(file.commitMessage).toBeUndefined();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// T4: .md 프로젝트 파일 뷰어 라우팅
// ═══════════════════════════════════════════════════════════════════

describe("T4: .md 프로젝트 파일 뷰어 라우팅", () => {
  it(".md 파일은 MarkdownRenderer 경로로 판별된다", () => {
    expect(isProjectMarkdown("src/docs-viewer/README.md")).toBe(true);
    expect(isProjectMarkdown("docs/1-project/spec.md")).toBe(true);
  });

  it(".ts/.tsx 파일은 코드 뷰어 경로로 판별된다", () => {
    expect(isProjectMarkdown("src/app.ts")).toBe(false);
    expect(isProjectMarkdown("src/DocsViewer.tsx")).toBe(false);
  });

  it("확장자 없는 파일은 코드 뷰어 경로로 판별된다", () => {
    expect(isProjectMarkdown("Makefile")).toBe(false);
    expect(isProjectMarkdown(".gitignore")).toBe(false);
  });
});
