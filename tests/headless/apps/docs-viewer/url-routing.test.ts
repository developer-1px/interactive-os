/**
 * url-routing — DocsViewer hash ↔ activePath 양방향 동기화.
 *
 * T1: selectDoc → hash 업데이트 (state→URL)
 * T2: hashchange → selectDoc (URL→state)
 *
 * 순수 단위 테스트 — Zone 없음, page 없음.
 */

import { describe, expect, it } from "vitest";
import {
  parseHashToPath,
  pathToHash,
  shouldSyncFromHash,
} from "@/docs-viewer/app";

// ═══════════════════════════════════════════════════════════════════
// T1: State→URL — parseHashToPath (기존) + pathToHash (신규)
// ═══════════════════════════════════════════════════════════════════

describe("T1: parseHashToPath (기존 유틸 검증)", () => {
  it("정상 hash → path 반환", () => {
    expect(parseHashToPath("#/docs/STATUS.md")).toBe("docs/STATUS.md");
    expect(parseHashToPath("#docs/STATUS.md")).toBe("docs/STATUS.md");
  });

  it("빈 hash → null", () => {
    expect(parseHashToPath("")).toBeNull();
    expect(parseHashToPath("#")).toBeNull();
    expect(parseHashToPath(null)).toBeNull();
    expect(parseHashToPath(undefined)).toBeNull();
  });

  it("ext: prefix → null (외부 모드)", () => {
    expect(parseHashToPath("#ext:folder/file.md")).toBeNull();
  });

  it("folder: prefix 보존", () => {
    expect(parseHashToPath("#/folder:docs/1-project")).toBe(
      "folder:docs/1-project",
    );
  });
});

describe("T1: pathToHash (hash 생성)", () => {
  it("path → #/path 형식", () => {
    expect(pathToHash("docs/STATUS.md")).toBe("#/docs/STATUS.md");
  });

  it("null → 빈 문자열", () => {
    expect(pathToHash(null)).toBe("");
  });

  it("folder: prefix 보존", () => {
    expect(pathToHash("folder:docs/1-project")).toBe("#/folder:docs/1-project");
  });
});

// ═══════════════════════════════════════════════════════════════════
// T2: URL→State — hashchange guard
// ═══════════════════════════════════════════════════════════════════

describe("T2: shouldSyncFromHash (무한루프 guard)", () => {
  it("같은 path면 동기화 불필요", () => {
    expect(shouldSyncFromHash("docs/A.md", "#/docs/A.md")).toBe(false);
  });

  it("다른 path면 동기화 필요", () => {
    expect(shouldSyncFromHash("docs/A.md", "#/docs/B.md")).toBe(true);
  });

  it("잘못된 hash → 동기화 안 함", () => {
    expect(shouldSyncFromHash("docs/A.md", "#ext:something")).toBe(false);
  });
});
