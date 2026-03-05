/**
 * @spec docs/1-project/builder/docs-browser/spec.md
 *
 * Feature: STATUS.md Parser (T6)
 * Tests parseStatusMd pure function.
 */
import { describe, expect, it } from "vitest";
import { parseStatusMd } from "../../docsUtils";

const SAMPLE_STATUS = `# Project Dashboard

> Last updated: 2026-03-05 12:00

---

## 🔥 Active Focus

**os-core / zift-usage-spec** — ZIFT 보편 모델 설계. Meta.

**testing / headless-simulator** — Vitest에서 Playwright 수준 검증 달성. Heavy.

**builder / builder-v2** — Panel Accordion. Heavy.

---

## 📋 Domains

### os-core
> \`packages/kernel/\`

| Project | Phase | Last Activity |
|---------|-------|---------------|
| 🔥 zift-usage-spec | Scaffold, T1~T6 미착수 | 03-04 |
| os-restructure | Phase 4 Done | 03-05 |

### testing
> \`packages/os-devtool/\`

| Project | Phase | Last Activity |
|---------|-------|---------------|
| 🔥 headless-simulator | Phase 1 T4~T6 | 03-03 |
| replay | Scaffold, T1 | 02-21 ⚠️ |

---

## ⚠️ Active Migrations

| Old Pattern | New Pattern | Remaining |
|-------------|-------------|-----------|
| \`zone.selection[]\` 배열 | \`zone.items[id]["aria-selected"]\` map | → selection-unification |
| \`useLayoutEffect\` 내 dispatch | \`config.initial\` 선언적 | → eliminate-layout-dispatch |

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| Domains | 5 |
| Active Projects | 12 |
| Active Focus | 3 |
| Stale (7d+) | 1 (replay) |
`;

describe("Feature: parseStatusMd (T6)", () => {
  it("parses Active Focus section", () => {
    const result = parseStatusMd(SAMPLE_STATUS);
    expect(result.activeFocus).toHaveLength(3);
    expect(result.activeFocus[0]).toMatchObject({
      domain: "os-core",
      project: "zift-usage-spec",
    });
    expect(result.activeFocus[1]).toMatchObject({
      domain: "testing",
      project: "headless-simulator",
    });
  });

  it("parses Domains with project tables", () => {
    const result = parseStatusMd(SAMPLE_STATUS);
    expect(result.domains).toHaveLength(2);
    expect(result.domains[0]!.name).toBe("os-core");
    expect(result.domains[0]!.projects).toHaveLength(2);
    expect(result.domains[0]!.projects[0]).toMatchObject({
      name: "zift-usage-spec",
      phase: "Scaffold, T1~T6 미착수",
      lastActivity: "03-04",
      isFocus: true,
    });
  });

  it("parses Active Migrations", () => {
    const result = parseStatusMd(SAMPLE_STATUS);
    expect(result.migrations).toHaveLength(2);
    expect(result.migrations[0]).toMatchObject({
      oldPattern: "`zone.selection[]` 배열",
      newPattern: '`zone.items[id]["aria-selected"]` map',
      remaining: "→ selection-unification",
    });
  });

  it("parses Summary metrics", () => {
    const result = parseStatusMd(SAMPLE_STATUS);
    expect(result.summary.get("Domains")).toBe("5");
    expect(result.summary.get("Active Projects")).toBe("12");
    expect(result.summary.get("Active Focus")).toBe("3");
    expect(result.summary.get("Stale (7d+)")).toBe("1 (replay)");
  });
});
