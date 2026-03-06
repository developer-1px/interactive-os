# Playwright Strict Subset — T7-T13 완료 보고서

| 항목 | 내용 |
|------|------|
| 원문 | "최종 보고서를 작성해봐" |
| 내(AI)가 추정한 의도 | 1. **경위** — playwright-subset 프로젝트 T7-T13을 /auto 파이프라인으로 완주한 직후. 2. **표면** — 작업 결과를 정리한 보고서 요청. 3. **의도** — 세션 간 지식 보존 + 향후 참조용 성과 기록. |
| 날짜 | 2026-03-06 |
| 프로젝트 | `testing/playwright-subset` (archived) |
| 상태 | 완료 (archived → `docs/4-archive/2026/03/W10/playwright-subset/`) |

---

## 1. 개요

Playwright Strict Subset 프로젝트의 후반부 T7-T13을 단일 세션에서 완주했다.
핵심 성과: **TestScript ONE Format** — "Write once, run anywhere" 테스트 인프라 확립.

| Task | 내용 | 상태 |
|------|------|------|
| T7 | `TestScenario` 타입 + `extractScenarios()` 정의 | Done |
| T8 | `runScenarios()` vitest auto-runner adapter | Done |
| T9 | DocsViewer testbot → `#id` 셀렉터 + scenarios export | Done |
| T10 | Builder testbot → `#id` 셀렉터 + scenarios export | Done |
| T11 | DocsViewer unit test → `runScenarios()` 3줄로 축소 | Done |
| T12 | `@os-devtool/testing` index.ts re-export | Done |
| T13 | `/audit` + `/doubt` 통과 | Done |

## 2. 분석

### 2.1 TestScript ONE Format (3-layer 구조)

```
Layer 1: run(page, expect)     — Playwright Strict Subset (K2)
Layer 2: scenarios[]           — zone/items/role 매핑 (infra)
Layer 3: zones/group exports   — TestBot manifest auto-discovery
```

**Playwright Strict Subset Rule (K2)**: `run()` 내부에서 허용되는 API:
- `page.locator("#id").click()`
- `page.keyboard.press(key)`
- `expect(loc).toHaveAttribute(attr, value)`
- `expect(loc).toBeFocused()` / `.not.toBeFocused()`
- `locator.getAttribute(attr)`

### 2.2 핵심 산출물

**`TestScenario` 인터페이스** (`packages/os-devtool/src/testing/scripts.ts`):
```typescript
interface TestScenario {
  zone: string;
  items: string[];
  role: ZoneRole;
  config?: Partial<FocusGroupConfig>;
  initial?: { selection?: string[]; expanded?: string[]; values?: Record<string, number> };
  scripts: TestScript[];
}
```

**`runScenarios()` adapter** (`packages/os-devtool/src/testing/runScenarios.ts`):
- scenarios 배열을 받아 vitest `describe`/`it` 블록을 자동 생성
- `page.goto()` + `page.cleanup()` 보일러플레이트 제거
- 기존 42줄 테스트 파일 → 3줄로 축소

### 2.3 Cross-zone 제약

`page.goto()`는 단일 zone만 설정 → 멀티존 Tab 테스트(Section 4)는 headless auto-runner 불가.
Section 4 스크립트는 `scenarios[]`에서 제외, 브라우저 TestBot 전용으로 유지.

### 2.4 `#id` 셀렉터 통일

- 기존: bare ID (`"ge-hero"`) — OS 전용
- 변경: `#id` prefix (`"#ge-hero"`) — Playwright 호환
- 하위 호환: 기존 3곳에서 `#` strip 처리 → bare ID도 여전히 동작

## 3. 결론 / 제안

**성과**: TestScript 생태계의 인터페이스가 안정화됨. 향후 testbot 파일에 `scenarios` export만 추가하면 vitest 자동 등록이 완료된다. 보일러플레이트 test 파일 작성이 불필요.

**남은 작업** (Later):
- T14: `todo-interaction.test.ts` → TestScript + unit test 분리 (백로그)

## 4. Cynefin 도메인 판정

**Complicated** — 방향(Playwright subset 준수)은 명확했고, 분석하면 답이 좁혀지는 문제였다. cross-zone 제약 발견이 유일한 탐색적 요소였으나 빠르게 해소됨.

## 5. 인식 한계 (Epistemic Status)

- 이 분석은 코드 정적 분석 + vitest 실행 결과에 기반한다.
- 브라우저 TestBot에서의 실제 동작은 검증하지 않았다 (headless만 확인).
- T14(todo-interaction) 분리의 난이도는 미평가.

## 6. 열린 질문

해당 없음 — 모든 태스크 완료 및 아카이브됨.

---

> **3줄 요약**
> TestScript ONE Format 확립: `run(page, expect)` Playwright subset + `scenarios[]` infra + manifest auto-discovery 3계층.
> `runScenarios()` adapter로 vitest 보일러플레이트를 42줄→3줄로 제거. cross-zone Tab 테스트는 headless 불가→브라우저 전용 유지.
> 프로젝트 T7-T13 완주, `/audit`+`/doubt` 통과, `4-archive/2026/03/W10/`에 아카이브 완료.
