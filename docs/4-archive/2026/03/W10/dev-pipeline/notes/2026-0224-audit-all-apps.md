# Audit: 전체 앱 OS 계약 감사

> 일시: 2026-02-24
> 대상: `src/apps/` 전체 (tests 제외)
> 기준: "앱은 의도를 선언하고, OS가 실행을 보장한다"

## 위반 전수 열거

| 패턴 | builder | todo | 합계 |
|------|---------|------|------|
| useState | 1 | 0 | 1 |
| useEffect | 1 | 0 | 1 |
| onClick | 2 (1은 타입정의) | 3 | 5 |
| document.* | 0 | 0 | **0** ✅ |
| addEventListener | 0 | 0 | **0** ✅ |

## 분류 결과

| # | 앱 | 파일:줄 | 위반 | 분류 | 사유 |
|---|-----|---------|------|------|------|
| 1 | builder | `BuilderTabs.tsx:60` | `useState(defaultTab)` | 🟡 OS 갭 | tab-state 프로젝트로 등록 |
| 2 | builder | `useCursorMeta.ts:20` | `useEffect` | ⚪ 정당한 예외 | React mount lifecycle |
| 3 | builder | `BuilderTabs.tsx:108` | `onClick(setActiveIndex)` | 🟡 OS 갭 | #1과 동일 원인 |
| 4 | builder | `BuilderImage.tsx:28` | `onChangeSrc` (타입) | ⚪ 정당한 예외 | 타입 정의만 |
| 5 | todo | `ListView.tsx:61` | `onClick(clearSearch)` | 🔴 LLM 실수 | OS Trigger 대체 가능 |
| 6 | todo | `ListView.tsx:124` | `onClick(requestDeleteTodo)` | 🔴 LLM 실수 | OS Trigger 대체 가능 |
| 7 | todo | `ListView.tsx:136` | `onClick(bulkToggleCompleted)` | 🔴 LLM 실수 | OS Trigger 대체 가능 |

## 지표

```
총 위반: 7건
  🔴 LLM 실수: 3건 → /refactor 대상 (todo ListView onClick × 3)
  🟡 OS 갭:    2건 → tab-state 프로젝트 (BuilderTabs)
  ⚪ 정당한 예외: 2건 → useEffect(lifecycle), onChangeSrc(타입)
```

## 행동 항목

- 🔴 Todo ListView: `<button onClick={...}>` × 3 → `<Trigger onActivate={...}>` 패턴으로 전환
  - 검색 초기화 (X): Trigger + clearSearch command
  - 벌크 삭제 (Delete): Trigger + requestDeleteTodo command
  - 벌크 완료 (Complete): Trigger + bulkToggleCompleted command
