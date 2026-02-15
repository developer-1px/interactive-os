# OS 마이그레이션 & 폴더 구조 리팩토링 잔여 작업 보고서

> 날짜: 2026-02-10  
> 태그: os, os-new, migration, refactoring, cleanup  
> 상태: 검사 완료 — 작업 잔여 항목 정리

---

## 1. 개요 (Overview)

`src/os/` (Legacy) → `src/os-new/` (Kernel 기반 신규) 마이그레이션의 현재 상태를 점검하고, **폴더 구조·파일 명명·아키텍처 정리** 관점에서 남은 작업을 정리한다.

현재 `os-new/`에는 **두 개의 아키텍처 파이프라인이 공존**하고 있으며, 번호 충돌과 역할 중복이 존재한다. 이 보고서는 이러한 구조적 문제와 기능적 마이그레이션 잔여 항목을 모두 포함한다.

---

## 2. 구조적 문제: 번호 충돌 & 이중 파이프라인

### 2.1 현재 os-new/ 디렉토리 전체 구조

```
src/os-new/
├── 1-sensor/            ← Legacy Pipeline (입력 센서)
├── 1-listeners/         ← Kernel Pipeline (DOM 리스너)
├── 2-command/           ← Legacy Pipeline (순수 커맨드 로직)
├── 2-contexts/          ← Kernel Pipeline (Coeffect 주입)
├── 3-store/             ← Legacy Pipeline (Zustand 스토어)
├── 3-commands/          ← Kernel Pipeline (defineCommand)
├── 4-effect/            ← Legacy Pipeline (미들웨어/효과)
├── 4-effects/           ← Kernel Pipeline (defineEffect)
├── 5-hooks/             ← Kernel Pipeline (useComputed 기반)
├── 6-components/        ← Kernel Pipeline (Zone, Item)
├── core/                ← 공유 (dispatchToZone, logic)
├── kernel.ts            ← Kernel 인스턴스
├── lib/                 ← 공유 유틸리티
├── primitives/          ← Legacy Pipeline (FocusGroup, FocusItem)
├── registry/            ← 공유 (roleRegistry)
├── schema/              ← 공유 타입 정의 (23 파일)
├── shared/              ← 공유 (Slot)
├── spike/               ← Kernel 검증 데모
└── state/               ← Kernel State 정의
```

### 2.2 번호 충돌 매트릭스

| 번호 | Legacy Pipeline | Kernel Pipeline | 문제 |
|---|---|---|---|
| **1-** | `1-sensor/` (6 파일) | `1-listeners/` (3 파일) | ⚠️ 같은 번호, 다른 역할 |
| **2-** | `2-command/` (7 파일) | `2-contexts/` (2 파일) | ⚠️ 같은 번호, 다른 역할 |
| **3-** | `3-store/` (6 파일) | `3-commands/` (11 파일) | ⚠️ 같은 번호, 다른 역할 |
| **4-** | `4-effect/` (5 파일) | `4-effects/` (1 파일) | ⚠️ 같은 번호, 이름도 유사 |

> [!CAUTION]
> 번호가 의미하는 파이프라인 단계가 Legacy와 Kernel에서 완전히 다르다.  
> 예: Legacy `3-store`는 Zustand 상태 관리이지만, Kernel `3-commands`는 커맨드 핸들러.  
> 이 상태는 **어떤 파이프라인을 따라야 하는지 혼란**을 유발한다.

### 2.3 추가 명명 문제

| 문제 | 설명 |
|---|---|
| `4-effect/` vs `4-effects/` | 단수 vs 복수 — 두 폴더가 완전히 다른 내용임에도 이름이 거의 동일 |
| `primitives/` vs `6-components/` | Legacy `FocusGroup/FocusItem` vs Kernel `Zone/Item` — 역할은 같지만 구조가 분리 |
| `core/` 역할 모호 | `dispatchToZone.ts` + `logic/` — Legacy dispatchToZone은 Kernel에서 불필요할 수 있음 |
| `state/` vs `3-store/` | Kernel State(`state/OSState.ts`)와 Legacy Store(`3-store/focusGroupStore.ts`)가 공존 |

---

## 3. 기능적 마이그레이션 잔여 항목

### 3.1 커맨드 마이그레이션 현황

#### Kernel (`3-commands/`) 등록 완료 ✅

| 커맨드 | 파일 | 비고 |
|---|---|---|
| NAVIGATE | `3-commands/navigate.ts` | `2-command/navigate/resolve.ts` 참조 |
| ACTIVATE | `3-commands/activate.ts` | — |
| ESCAPE | `3-commands/escape.ts` | — |
| TAB | `3-commands/tab.ts` | — |
| SELECT | `3-commands/select.ts` | — |
| SELECTION_* | `3-commands/selection.ts` | SET/ADD/REMOVE/TOGGLE/CLEAR (신규) |
| EXPAND | `3-commands/expand.ts` | `2-command/expand/resolveExpansion.ts` 참조 |
| FOCUS | `3-commands/focus.ts` | — |
| SYNC_FOCUS | `3-commands/syncFocus.ts` | — |
| RECOVER | `3-commands/recover.ts` | — |

#### Kernel 미등록 — 마이그레이션 필요 ❌

| 커맨드 | 현재 위치 | 우선순위 | 비고 |
|---|---|---|---|
| **TOGGLE** | `2-command/` 내 미존재 | 중간 | Pipeline에서만 언급, 실제 구현 확인 필요 |
| **DELETE** | `2-command/` 내 미존재 | 중간 | Pipeline에서만 언급 |
| **FIELD_BLUR** | Legacy `os/` only | **높음** | Field 편집 기능 핵심 |
| **FIELD_CANCEL** | Legacy `os/` only | **높음** | Field 편집 기능 핵심 |
| **FIELD_COMMIT** | Legacy `os/` only | **높음** | Field 편집 기능 핵심 |
| **FIELD_START_EDIT** | Legacy `os/` only | **높음** | Field 편집 기능 핵심 |
| **FIELD_SYNC** | Legacy `os/` only | **높음** | Field 편집 기능 핵심 |
| **KEYBOARD** | Legacy `os/` only | 낮음 | 키보드 라우팅 |
| **COPY/CUT/PASTE** | Legacy `os/` only | 중간 | 클립보드 기능 |
| **UNDO/REDO** | Legacy `os/` only | 중간 | 히스토리 기능 |

### 3.2 컴포넌트/프리미티브 마이그레이션 현황

| 컴포넌트 | Legacy (`os/`) | New (`os-new/`) | 상태 |
|---|---|---|---|
| Zone | `app/export/primitives/Zone.tsx` | `6-components/Zone.tsx` | ✅ Kernel 기반 |
| Item | `app/export/primitives/Item.tsx` | `6-components/Item.tsx` | ✅ Kernel 기반 |
| FocusGroup | `features/focus/primitives/FocusGroup.tsx` | `primitives/FocusGroup.tsx` | ⚠️ Legacy 복사본 (Zustand 기반) |
| FocusItem | `features/focus/primitives/FocusItem.tsx` | `primitives/FocusItem.tsx` | ⚠️ Legacy 복사본 (Zustand 기반) |
| **App** | `app/export/primitives/App.tsx` | — | ❌ 미마이그레이션 |
| **Builder** | `app/export/primitives/Builder.tsx` | — | ❌ 미마이그레이션 |
| **BuilderBadge** | `app/export/primitives/BuilderBadge.tsx` | — | ❌ 미마이그레이션 |
| **BuilderButton** | `app/export/primitives/BuilderButton.tsx` | — | ❌ 미마이그레이션 |
| **BuilderDivider** | `app/export/primitives/BuilderDivider.tsx` | — | ❌ 미마이그레이션 |
| **BuilderIcon** | `app/export/primitives/BuilderIcon.tsx` | — | ❌ 미마이그레이션 |
| **BuilderImage** | `app/export/primitives/BuilderImage.tsx` | — | ❌ 미마이그레이션 |
| **BuilderLink** | `app/export/primitives/BuilderLink.tsx` | — | ❌ 미마이그레이션 |
| **Field** | `app/export/primitives/Field.tsx` | — | ❌ 미마이그레이션 |
| **Label** | `app/export/primitives/Label.tsx` | — | ❌ 미마이그레이션 |
| **Root** | `app/export/primitives/Root.tsx` | — | ❌ 미마이그레이션 |
| **Trigger** | `app/export/primitives/Trigger.tsx` | — | ❌ 미마이그레이션 |

### 3.3 Hook 마이그레이션 현황

| Hook | Legacy (`os/`) | New (`os-new/`) | 상태 |
|---|---|---|---|
| useFocused | — | `5-hooks/useFocused.ts` | ✅ Kernel useComputed |
| useSelected | — | `5-hooks/useSelected.ts` | ✅ Kernel useComputed |
| useExpanded | `useFocusExpansion.ts` | `5-hooks/useExpanded.ts` | ✅ Kernel useComputed |
| useActiveZone | — | `5-hooks/useActiveZone.ts` | ✅ Kernel useComputed |
| useIsFocusedGroup | `useIsFocusedGroup.ts` | `primitives/hooks/useIsFocusedGroup.ts` | ⚠️ Legacy 복사 |
| **useFocusRecovery** | `useFocusRecovery.ts` | — | ❌ 미마이그레이션 |

### 3.4 기타 미마이그레이션 항목

| 항목 | Legacy 위치 | 상태 | 비고 |
|---|---|---|---|
| GroupRegistry | `features/jurisdiction/` | ❌ | Kernel scope tree 대체 가능 |
| PersistenceAdapter | `features/persistence/` | ⚠️ 타입만 | `schema/state/PersistenceAdapter.ts` 타입만 존재 |
| defineApplication | `features/application/` | ❌ | 현재 미사용, Kernel group 대체 |
| FocusDebugOverlay | `features/focus/ui/` | ❌ | KernelPanel이 대체 |
| useOSCore | `app/export/primitives/useOSCore.ts` | ❌ | Kernel hook으로 대체 필요 |
| TestBot (14+ 파일) | `os/testBot/` | ⚠️ 유지 | os/ 전용으로 계속 사용 가능 |

---

## 4. 외부 참조 현황 (os-new 의존 관계)

### 4.1 os-new → 외부 import (47개 파일에서 참조)

| 참조 소스 | 파일 수 | 예시 |
|---|---|---|
| `src/os/` → `os-new/` | ~20 | `os/entities/CommandDefinition.ts`, `os/app/export/primitives/*`, `os/features/*` |
| `src/apps/` → `os-new/` | ~6 | `todo/features/todoKeys.ts`, `kanban/features/kanbanKeys.ts`, `todo/bridge/*`, `kanban/bridge/*` |
| `src/pages/` → `os-new/` | ~10 | `focus-showcase/tests/*`, `aria-showcase/*` |
| `src/routes/` → `os-new/` | 2 | `os-kernel-demo.tsx`, `spike-demo.tsx` |

> [!IMPORTANT]
> `os/`가 `os-new/`를 가져오고, `os-new/`의 `primitives/FocusGroup.tsx`가 `os-new/3-store/`를 가져오는 **교차 의존** 구조가 존재한다. 최종 정리 시 이 의존 관계를 단방향으로 정리해야 한다.

### 4.2 os-new 내부 교차 참조

| 참조 | 설명 |
|---|---|
| `3-commands/navigate.ts` → `2-command/navigate/resolve.ts` | Kernel 커맨드가 Legacy 커맨드 로직을 reuse |
| `3-commands/expand.ts` → `2-command/expand/resolveExpansion.ts` | Kernel 커맨드가 Legacy 커맨드 로직을 reuse |
| `primitives/FocusGroup.tsx` → `3-store/focusGroupStore.ts` | Legacy 컴포넌트가 Legacy 스토어 사용 |

---

## 5. 제안: 정리 방향

### 5.1 단계 1 — 번호 충돌 해소 (폴더 구조 통합)

Legacy Pipeline 폴더를 Kernel Pipeline으로 흡수하고, 단일 번호 체계를 확립한다.

**제안 구조:**

```
src/os-new/
├── 1-listeners/         ← DOM 이벤트 리스너 (기존 유지)
│   ├── KeyboardListener.tsx
│   ├── keybindings.ts
│   └── osDefaults.ts
│
├── 2-contexts/          ← Coeffect 주입 (기존 유지)
│   ├── index.ts
│   └── zoneRegistry.ts
│
├── 3-commands/          ← Kernel defineCommand (기존 유지)
│   ├── navigate.ts      (2-command/navigate/ 로직 흡수)
│   ├── activate.ts, escape.ts, tab.ts, ...
│   └── field/           (신규: FIELD_* 커맨드 추가)
│
├── 4-effects/           ← Kernel defineEffect (기존 유지)
│   └── index.ts
│
├── 5-hooks/             ← useComputed 기반 (기존 유지)
│   └── useFocused.ts, useSelected.ts, ...
│
├── 6-components/        ← Kernel 컴포넌트 (Zone, Item + 신규)
│   ├── Zone.tsx, Item.tsx, ZoneContext.tsx
│   ├── Field.tsx         (신규)
│   └── Trigger.tsx       (신규)
│
├── core/                ← 공유 로직 (정리)
├── kernel.ts            ← Kernel 인스턴스
├── lib/                 ← 유틸리티
├── schema/              ← 타입 정의
├── state/               ← Kernel State
└── shared/              ← Slot 등
```

**삭제 대상:**
- `1-sensor/` → `1-listeners/` + `1-sensor/keyboard/getCanonicalKey.ts`를 `lib/`로 이동
- `2-command/` → 순수 로직을 `3-commands/` 내부 헬퍼로 흡수
- `3-store/` → Kernel State로 이관 완료 시 삭제
- `4-effect/` → 미들웨어 로직은 `core/` 또는 별도 `middleware/`로 이동
- `primitives/` → `6-components/`로 Kernel 기반 재작성 후 삭제
- `spike/` → 검증 완료 후 삭제 또는 `pages/` 이동

### 5.2 단계 2 — 기능 완성 (미마이그레이션 항목)

| 우선순위 | 항목 | 추정 작업량 |
|---|---|---|
| 🔴 높음 | FIELD_* 커맨드 5개 Kernel 등록 | 1일 |
| 🔴 높음 | Field 컴포넌트 Kernel 기반 재작성 | 1일 |
| 🟡 중간 | COPY/CUT/PASTE/DELETE/UNDO/REDO Kernel 등록 | 0.5일 |
| 🟡 중간 | useFocusRecovery Kernel 기반 재구현 | 0.5일 |
| 🟡 중간 | Builder* 컴포넌트 전환 판단 (필요 여부) | 0.5일 |
| 🟢 낮음 | Trigger, Label, Root 컴포넌트 | 0.5일 |
| 🟢 낮음 | PersistenceAdapter 구현 | 0.5일 |
| 🟢 낮음 | FocusDebugOverlay 제거 (KernelPanel 대체) | 0.5일 |
| 🟢 낮음 | spike/ 데모 정리 | 0.5일 |

### 5.3 단계 3 — Legacy Pipeline 정리

Kernel Pipeline이 모든 기능을 커버하면:
1. `1-sensor/` 삭제
2. `2-command/` 삭제 (resolve 로직은 `3-commands/` 내부 유틸로 보존)
3. `3-store/` 삭제 (Zustand → Kernel State 전환 완료 확인)
4. `4-effect/` 삭제
5. `primitives/` 삭제
6. `core/dispatchToZone.ts` 삭제 (Kernel dispatch로 대체)

---

## 6. 총괄 요약 (Summary Matrix)

| 카테고리 | 완료 | 부분 | 미착수 | 합계 |
|---|---|---|---|---|
| 커맨드 (3-commands) | 10 | 0 | ~8 | ~18 |
| 컴포넌트 (6-components) | 3 | 2 (legacy) | 12 | ~17 |
| Hook (5-hooks) | 4 | 1 (legacy) | 1 | 6 |
| 컨텍스트 (2-contexts) | 4 | 0 | 0 | 4 |
| 이펙트 (4-effects) | 4 | 0 | 0 | 4 |
| 리스너 (1-listeners) | 3 | 0 | 0 | 3 |
| 스토어 → State 전환 | 3 (state/) | 6 (3-store/) | 0 | — |
| 스키마 | 23 | 0 | 0 | 23 |

### 핵심 숫자

- **전체 진행률:** 약 **65%** (기능 기준)
- **구조 정리 필요도:** **높음** (번호 충돌 + 이중 파이프라인)
- **외부 의존 파일:** **~47개** (os-new 참조하는 외부 파일 수)
- **남은 주요 작업:** FIELD 커맨드 + 컴포넌트 전환 + Legacy 폴더 정리

---

## 3. 결론 (Conclusion)

### 즉시 실행 가능한 작업

1. **폴더 번호 충돌 해소**: Legacy Pipeline 폴더를 Kernel Pipeline으로 통합하거나 명확히 분리
2. **`2-command/navigate/`, `2-command/expand/` 로직을 `3-commands/` 내부 유틸로 이동**: 현재 Kernel 커맨드가 Legacy 커맨드를 cross-reference하는 구조 제거
3. **`spike/` 정리**: 검증 완료된 데모 코드 정리

### 블로커 (먼저 결정 필요)

1. **Builder* 컴포넌트 유지 여부**: 6개 Builder 컴포넌트가 Kernel 기반에서도 필요한지 판단 필요
2. **Zustand 3-store 제거 시점**: `primitives/FocusGroup.tsx`가 `3-store/`에 의존 — FocusGroup을 Zone으로 완전 대체할 때까지 유지 필요
3. **TestBot 처리**: `os/testBot/`은 `os/` 전용 — os-new 전환 완료 시 새로운 테스트 방식 필요

> [!NOTE]
> 기존 마이그레이션 문서들 ([Migration Plan](file:///Users/user/Desktop/interactive-os/docs/1-project/os-core-refactoring/2026-02-09_OS-New_Kernel_Migration_Plan.md), [Status Report](file:///Users/user/Desktop/interactive-os/docs/1-project/os-core-refactoring/2026-02-10_04-[refactoring]OS_to_OS-New_Migration_Status.md))과 일관된 방향. 이 보고서는 현 시점의 **구조적 문제**에 초점을 맞춰 추가 정리함.
