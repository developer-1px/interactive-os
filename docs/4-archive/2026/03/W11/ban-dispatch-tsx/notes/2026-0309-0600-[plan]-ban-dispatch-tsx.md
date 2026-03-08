# Plan: .tsx에서 os.dispatch 제거 + lint 차단

> Discussion Claim: React(.tsx)에서 os.dispatch는 구조적으로 항상 오류. Trigger + Zone이 25건 전부 커버.

## 스코프 분리

| 스코프 | 건수 | 성격 | 이번 프로젝트? |
|--------|------|------|--------------|
| lint rule 추가 | 1건 | eslint-plugin-pipeline 룰 | ✅ |
| builder pages | 6건 | trigger 교체 | ✅ |
| widgets/ToastContainer | 3건 | trigger 교체 | ✅ |
| apg-showcase/MeterPattern | 1건 | setInterval → 별도 처리 | ✅ |
| command-palette | 7건 | 전체 앱 Zone 마이그레이션 | ❌ 별도 프로젝트 |
| docs-viewer | 5건 | 전체 앱 Zone 마이그레이션 | ❌ 별도 프로젝트 |
| PropertiesPanel useEffect | 1건 | OS_EXPAND in useEffect | ❌ 별도 (OS gap 가능성) |
| DocsViewer useEffect | 2건 | 앱 초기화 로직 | ❌ 별도 프로젝트 |

**이번 프로젝트 = 11건 수정 + lint rule. 나머지 14건은 backlog.**

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| T1 | `eslint-plugin-pipeline/index.js`: 새 룰 `no-dispatch-in-tsx` | 룰 없음 | `.tsx` 파일에서 `os.dispatch(` 호출 ERROR | Clear | — | eslint src/ 0 errors | 기존 위반 25건이 ERROR로 잡힘 → T2-T5 먼저 |
| T2 | `EditorToolbar.tsx:57,62` | `onClick={() => os.dispatch(undoCommand())}` | `{...toolbar.trigger("undo")}` — bind triggers로 전환 | Clear | →app.ts에 trigger 추가 | tsc 0 | toolbar Zone이 이미 있는지 확인 |
| T3 | `SectionSidebar.tsx:323` | `os.dispatch(addBlock({ block }))` in onClick | trigger prop-getter | Clear | →app.ts에 trigger 추가 | tsc 0 | AddBlockButton 구조 확인 |
| T4 | `BuilderPage.tsx:134` | `os.dispatch(loadPagePreset({ blocks }))` in onClick | trigger prop-getter | Clear | →app.ts에 trigger 추가 | tsc 0 | — |
| T5 | `ToastContainer.tsx:107,111,112` | `os.dispatch(OS_NOTIFY_DISMISS(...))` in onDismiss/onClick | trigger prop-getter (dismiss + action) | Clear | — | tsc 0 | 동적 actionCommand closure |
| T6 | `MeterPattern.tsx:200` | `os.dispatch(OS_VALUE_CHANGE(...))` in setInterval | 비-React 코드로 이동 (register.ts 또는 app.ts) | Clear | — | tsc 0 | setInterval = side-effect, React 밖으로 |
| T7 | `PropertiesPanel.tsx:316,473` | `os.dispatch(renameSectionLabel/updateField)` in onChange | Field binding 또는 trigger | Complicated | builder Zone 구조 확인 | tsc 0 | PropertiesPanel 구조 복잡 |
| T8 | `PropertiesPanel.tsx:93` | `os.dispatch(OS_EXPAND)` in useEffect | OS 갭 또는 Zone auto-expand | Complicated | OS auto-expand 지원 확인 | tsc 0 | |
| T9 | backlog 등록 | command-palette 7건 + docs-viewer 7건 | `5-backlog/` 등록 | Clear | — | — | — |

## 비-Clear 행 해소

**T7 (Complicated)**: PropertiesPanel의 onChange → dispatch는 Field binding으로 전환 가능하나, PropertiesPanel 구조가 복잡 (500+ lines). **제 판단: T7은 이번 스코프에서 제외, backlog로.** 이유: builder-v2 프로젝트가 이미 존재하고 PropertiesPanel 리팩토링이 거기 소속.

**T8 (Complicated)**: useEffect에서 OS_EXPAND를 dispatch하는 것은 "mount 시 auto-expand" 패턴. Zone이 `initialExpanded` 옵션을 제공하면 해소되지만 현재 미확인. **제 판단: T8도 backlog로.** builder-v2 소속.

→ **T7, T8을 T9에 병합 (backlog 등록)**

## 최종 스코프: T1~T6 + T9

## MECE 점검

1. CE: T1(lint rule) + T2-T6(즉시 수정 8건) + T9(backlog 14+2건) = 25건 전부 커버 ✓
2. ME: 중복 없음 ✓
3. No-op: 없음 ✓

## 라우팅

승인 후 → `/project` (새 프로젝트 `ban-dispatch-tsx`) — testing 도메인, Meta+Light 혼합
