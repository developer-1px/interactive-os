# Plan: APG Developer Agent POC

> **Date**: 2026-03-01
> **Origin**: Discussion `2026-0301-1737-discussion-apg-developer-agent.md`
> **Type**: Meta (인프라 — 에이전트 정의)
> **Cynefin**: Clear

---

## 목표

Claude Code 커스텀 에이전트(`.claude/agents/apg-developer.md`)를 만들어, Interactive OS 위에서 W3C APG 패턴을 **전 사이클**(스펙 조사 → 헤드리스 테스트 → UI 컴포넌트 → DOM 테스트 → 쇼케이스 등록)로 개발할 수 있는지 POC한다.

**성공 기준**: 에이전트가 새 APG 패턴을 만들었을 때 `useState` 0줄, `onClick` 0줄, `onKeyDown` 0줄이고 테스트가 통과하면 성공.

---

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `.claude/agents/` 디렉토리 | 존재하지 않음 | 디렉토리 생성 | Clear | — | `ls .claude/agents/` | 없음 |
| 2 | `.claude/agents/apg-developer.md` | 존재하지 않음 | OS 세계관 + 레퍼런스(Accordion 전체) + OS API 가이드 + 파일 규칙 + 개발 사이클이 포함된 에이전트 정의 파일 | Clear | →#1 | Task 도구로 에이전트 호출 가능 | 시스템 프롬프트 크기 vs 컨텍스트 예산 |
| 3 | POC 실행: 에이전트로 새 APG 패턴 개발 | 패턴 없음 | 에이전트가 생성한: (a) 헤드리스 테스트 (b) UI 컴포넌트 (c) DOM 테스트 | Clear | →#2 | `useState` 0회, `onClick` 0회, `vitest run` PASS | 에이전트가 사전학습 패턴으로 회귀할 수 있음 — 이것이 POC의 핵심 검증 대상 |

---

## #2 에이전트 시스템 프롬프트 설계

에이전트에 포함할 핵심 컨텍스트:

### A. 세계관 선언
- "이 세계에 `useState`, `useEffect`, `onClick`, `onKeyDown`, `addEventListener`는 없다"
- "상태 → `defineApp`, 영역 → `createZone` + `.bind({ role })`, 트리거 → `<Trigger onActivate={CMD()}>`"
- "headless 먼저, DOM은 바인딩"

### B. OS API Quick Reference
- `defineApp<State>(name, initialState)` → App
- `App.command(name, handler)` → Command
- `App.createZone(id)` → ZoneHandle
- `ZoneHandle.bind({ role })` → `{ Zone, Item, Item.Region }`
- `App.useComputed(selector)` → derived state
- `<Trigger onActivate={CMD()}>` → command dispatch on click/Enter
- `createOsPage()` → headless test page (Tier 1)
- `createPage(App, Component)` → projection test page

### C. 레퍼런스 예제
Accordion 패턴 3개 파일 전문을 포함:
1. `accordion.apg.test.ts` — headless test (Tier 1: pressKey → attrs)
2. `AccordionPattern.tsx` — UI component (zero JS state)
3. `accordion.apg.ui.test.tsx` — DOM test (Tier 2: render → check DOM)

### D. Contract Helpers
사용 가능한 공유 축 함수 목록:
- `assertVerticalNav`, `assertHorizontalNav`
- `assertBoundaryClamp`, `assertLoop`
- `assertHomeEnd`, `assertOrthogonalIgnored`
- `assertFollowFocus`, `assertNoSelection`
- `assertEscapeClose`, `assertFocusRestore`, `assertTabTrap`

### E. 파일 규칙
- 헤드리스 테스트: `src/os/3-commands/tests/apg/{pattern}.apg.test.ts`
- UI 컴포넌트: `src/pages/apg-showcase/patterns/{Pattern}Pattern.tsx`
- DOM 테스트: `src/pages/apg-showcase/tests/unit/{pattern}.apg.ui.test.tsx`

### F. 개발 사이클
1. W3C APG 스펙 조사 (WebFetch 또는 기존 지식)
2. 헤드리스 테스트 작성 (createOsPage + contract helpers)
3. 테스트 실행 — RED 확인
4. 필요시 OS gap 보고 (role preset 누락 등)
5. UI 컴포넌트 작성 (defineApp + createZone + bind)
6. DOM 테스트 작성 (createPage + render)
7. 전체 테스트 실행 — GREEN 확인
8. APG showcase index.tsx에 등록

---

## MECE 점검

1. **CE**: #1(디렉토리) + #2(에이전트 정의) + #3(POC 실행) → 목표 달성 ✅
2. **ME**: 중복 없음 ✅
3. **No-op**: 없음 ✅

---

## 라우팅

승인 후 → `/project` (새 프로젝트: `apg-developer-agent`) — Meta, 3 태스크
