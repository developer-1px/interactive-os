# Audit: Builder 앱 OS 계약 감사

> 일시: 2026-02-24
> 대상: `src/apps/builder/` (tests 제외)
> 기준: "앱은 의도를 선언하고, OS가 실행을 보장한다"

## 위반 전수 열거

| 패턴 | 건수 |
|------|------|
| useState | 1건 |
| useEffect | 1건 |
| onClick/onMouse*/onChange | 2건 (1건은 타입 정의만) |
| document.*/querySelector | **0건** ✅ |
| addEventListener | **0건** ✅ |

## 분류 결과

| # | 파일:줄 | 위반 패턴 | 분류 | 사유 |
|---|---------|----------|------|------|
| 1 | `6-project/BuilderTabs.tsx:60` | `useState(defaultTab)` | 🟡 OS 갭 | OS에 Tab 활성 상태 관리 API 없음 |
| 2 | `hooks/useCursorMeta.ts:20` | `useEffect` | ⚪ 정당한 예외 | React mount/unmount lifecycle → 레지스트리 동기화 |
| 3 | `6-project/BuilderTabs.tsx:108` | `onClick={() => setActiveIndex(idx)}` | 🟡 OS 갭 | #1과 동일 원인. tablist activate가 OS 경로 없음 |
| 4 | `6-project/BuilderImage.tsx:28` | `onChangeSrc` (prop 타입 정의) | ⚪ 정당한 예외 | 타입 정의일 뿐, 실제 핸들러 등록 아님 |

## 지표

```
총 위반: 4건
  🔴 LLM 실수: 0건
  🟡 OS 갭: 2건 → BuilderTabs의 useState + onClick (동일 원인)
  ⚪ 정당한 예외: 2건
```

## OS 갭 분석

### BuilderTabs의 Tab 상태 관리 (2건, 동일 원인)

**현상**: BuilderTabs가 `useState`로 `activeIndex`를 관리하고, `onClick`으로 탭을 전환한다.

**기대**: APG Tabs 패턴에서 `aria-selected`는 OS가 관리해야 한다.
- tablist Zone의 `OS_ACTIVATE` → 해당 탭의 `aria-selected=true`
- 탭 클릭 → `OS_ACTIVATE` → 해당 탭이 활성

**OS에 없는 것**: Tab 활성 상태를 OS state로 관리하는 메커니즘.
현재 OS의 `aria-selected`는 selection(멀티셀렉트)용이지, tab 활성 상태와 별개.
