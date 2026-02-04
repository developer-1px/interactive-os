# Focus System 리팩토링 제안: 6-Axis 중심 응집도 개선

## 1. 개요 (Overview)

현재 Focus 시스템은 기능적으로 동작하지만, **6-Axis Behavior Model**을 중심으로 응집도를 높이면 유지보수성과 확장성이 크게 개선될 수 있습니다. 본 문서에서는 현재 구조의 문제점을 분석하고, 축(Axis) 중심 리팩토링 방안을 제안합니다.

---

## 2. 현재 구조 분석

### 2.1 파일별 책임 분산 현황

```
src/os/core/
├── focus.ts              # Store 조합 (15L)
├── focusBehavior.ts      # 6-Axis 타입 + Preset (123L)
├── navigation.ts         # Direction/Edge 처리 로직 (274L)
└── focus/
    ├── orchestrator.ts   # Direction/Tab/Entry 처리 (248L)
    ├── useFocusBridge.ts # Target 관련 (76L)
    ├── slices/
    │   ├── cursorSlice   # Restore/Entry 일부 (75L)
    │   ├── spatialSlice  # Stickiness (11L)
    │   └── zoneSlice     # Zone 레지스트리 (96L)
    └── types.ts          # 모든 타입
```

### 2.2 현재 문제점

| 문제 | 설명 |
|------|------|
| **축(Axis) 로직 분산** | `direction` 처리가 `navigation.ts`와 `orchestrator.ts`에 분산 |
| **edge 로직 결합** | `edge` 동작이 `navigation.ts`의 `findNextRovingTarget`에 하드코딩 |
| **tab 로직 암묵적** | `tab` 동작이 `orchestrator.ts`의 `shouldTrap` 분기에만 존재 |
| **entry/restore 혼재** | `cursorSlice`와 `orchestrator.resolveEntry`에 걸쳐 분산 |
| **target 불명확** | `real` vs `virtual` 분기가 명시적이지 않음 |

---

## 3. 제안: Axis-Centric Architecture

### 3.1 디렉토리 구조

> [!NOTE]
> **No Barrel Exports**: `index.ts` 배럴 파일 없이 명시적 파일명으로 직접 import합니다.
> 파일명 자체가 **명세(Specification)** 역할을 합니다.

```
src/os/core/focus/
├── focusStore.ts               # Zustand Store 조합 + Public API
├── focusTypes.ts               # 통합 타입 정의
│
├── store/
│   ├── zoneSlice.ts            # Zone 등록/관리 Slice
│   ├── cursorSlice.ts          # 커서 위치 관리 Slice
│   └── spatialSlice.ts         # Spatial Memory Slice
│
├── behavior/
│   ├── behaviorTypes.ts        # FocusBehavior, 6-Axis 타입
│   ├── behaviorPresets.ts      # ARIA Role 기반 preset 정의
│   └── behaviorResolver.ts     # resolveBehavior 함수
│
├── axes/                       # ⭐ 축별 로직 모듈화 (파일명 = 명세)
│   │
│   ├── direction/              # [Axis 1] 화살표 키 내비게이션
│   │   ├── directionDispatcher.ts  # findNextTarget (dispatcher)
│   │   ├── rovingNavigation.ts     # v/h 1차원 내비게이션
│   │   ├── spatialNavigation.ts    # grid 2차원 물리 내비게이션
│   │   └── noneNavigation.ts       # direction="none" (no-op)
│   │
│   ├── edge/                   # [Axis 2] 경계 동작
│   │   ├── loopEdge.ts             # 순환 (첫→끝, 끝→첫)
│   │   └── stopEdge.ts             # 정지 (경계에서 멈춤)
│   │
│   ├── tab/                    # [Axis 3] Tab 키 동작
│   │   ├── loopTab.ts              # Zone 내 순환
│   │   ├── escapeTab.ts            # 부모 Zone으로 탈출
│   │   └── flowTab.ts              # 자연스러운 탭 순서 (form)
│   │
│   ├── target/                 # [Axis 4] 포커스 대상 유형
│   │   ├── realTarget.ts           # el.focus() 실제 DOM 포커스
│   │   └── virtualTarget.ts        # aria-activedescendant 가상 포커스
│   │
│   ├── entry/                  # [Axis 5] Zone 진입 시 포커스 위치
│   │   ├── firstEntry.ts           # 첫 번째 아이템
│   │   ├── restoreEntry.ts         # 마지막 포커스 위치 복원
│   │   └── selectedEntry.ts        # 선택된 아이템 (listbox)
│   │
│   └── restore/                # [Axis 6] Zone 탈출/복귀 시 상태 복원
│       ├── saveRestorePoint.ts     # 복원 포인트 저장
│       └── restoreFocus.ts         # 이전 포커스 복원
│
├── orchestrator.ts             # 축 조합 실행기 (메인 로직)
├── focusBridge.ts              # 브라우저 ↔ 가상 포커스 동기화
│
└── utils/
    ├── domUtils.ts             # collectItemRects, getItemRect
    └── pathUtils.ts            # computePath (Leaf→Root)
```

**Import 예시:**
```typescript
// 직접 import (배럴 없음)
import { findNextTarget } from '@os/core/focus/axes/direction/directionDispatcher';
import { loopEdge } from '@os/core/focus/axes/edge/loopEdge';
import { restoreEntry } from '@os/core/focus/axes/entry/restoreEntry';
```

### 3.2 각 축(Axis) 모듈의 책임

| 축 | 모듈 | 책임 |
|----|------|------|
| `direction` | `axes/direction/` | 화살표 키 내비게이션 알고리즘 |
| `edge` | `axes/edge/` | 경계 도달 시 loop/stop 정책 |
| `tab` | `axes/tab/` | Tab 키 동작 (Zone 간 이동) |
| `target` | `axes/target/` | 포커스 대상 결정 (real DOM vs virtual) |
| `entry` | `axes/entry/` | Zone 진입 시 초기 포커스 위치 |
| `restore` | `axes/restore/` | Zone 복귀 시 상태 복원 |

---

## 4. 상세 설계

### 4.1 Axis Interface Pattern

```typescript
// 모든 축이 따르는 공통 패턴
interface AxisHandler<TInput, TOutput> {
  (ctx: AxisContext, input: TInput): TOutput;
}

interface AxisContext {
  zoneId: string;
  behavior: FocusBehavior;
  registry: Record<string, ZoneMetadata>;
  focusedItemId: string | null;
}
```

### 4.2 Orchestrator 단순화

```typescript
// 리팩토링 후 orchestrator
export function executeNavigation(direction: Direction, ctx: Context) {
  // 1. Direction Axis
  const target = directionAxis.find(ctx, direction);
  if (!target) return null;
  
  // 2. Edge Axis (direction 내부에서 호출됨)
  // 3. Entry Axis
  const finalTarget = entryAxis.resolve(ctx, target);
  
  // 4. Target Axis
  targetAxis.apply(ctx, finalTarget);
  
  // 5. Restore Axis (Zone 변경 시)
  if (ctx.zoneChanged) {
    restoreAxis.save(ctx.previousZone);
  }
  
  return finalTarget;
}
```

---

## 5. 잠재적 문제점 및 리스크

### 5.1 Breaking Changes

| 영역 | 리스크 | 대응 |
|------|--------|------|
| **Import Path 변경** | 외부에서 `navigation.ts` 직접 import 시 깨짐 | `core/focus/index.ts`에서 re-export |
| **Type 호환성** | 기존 `FocusBehavior` 타입 사용처 | 동일 인터페이스 유지 |
| **Store 구조** | Slice 구조 변경 불필요 | 그대로 유지 |

### 5.2 Over-Engineering 위험

> [!WARNING]
> **파일 수 증가**: 현재 ~10개 → 리팩토링 후 ~25개
> 
> 각 축별로 분리하면 파일 수가 증가하지만, 각 파일의 **단일 책임**이 명확해집니다.
> 단, 프로젝트 규모 대비 과도할 수 있습니다.

### 5.3 성능 고려사항

| 항목 | 현재 | 리팩토링 후 |
|------|------|-----------|
| 함수 호출 깊이 | 2-3 depth | 3-4 depth |
| 번들 사이즈 | 변화 없음 (Tree-shaking) | 변화 없음 |
| 런타임 오버헤드 | 무시할 수준 | 무시할 수준 |

### 5.4 마이그레이션 복잡도

| 단계 | 작업 | 예상 시간 |
|------|------|----------|
| 1 | `axes/direction/` 추출 | 2-3시간 |
| 2 | `axes/edge/` 추출 | 1시간 |
| 3 | `axes/tab/` 추출 + 테스트 | 2시간 |
| 4 | `axes/entry/` + `restore/` | 2시간 |
| 5 | `axes/target/` (virtual focus) | 1시간 |
| 6 | Orchestrator 리팩토링 | 2시간 |
| 7 | 통합 테스트 | 2시간 |
| **합계** | | **~12시간** |

---

## 6. 대안: 경량 리팩토링

전체 구조 변경이 과하다면, **파일 분리 없이 논리적 그룹화**를 먼저 적용:

### 6.1 navigation.ts 내부 정리

```typescript
// navigation.ts - 축별 섹션 구분

// ============== DIRECTION AXIS ==============
export function findNextTarget(...) { ... }
function findNextRovingTarget(...) { ... }
function findNextSpatialTarget(...) { ... }

// ============== EDGE AXIS ==============
function applyEdgeBehavior(index: number, ...): number { ... }

// (tab, entry, target, restore는 orchestrator.ts에 유지)
```

### 6.2 orchestrator.ts 주석 개선

```typescript
// orchestrator.ts - 축 실행 순서 명시

export function executeNavigation(...) {
  // [Axis 1: DIRECTION] Spatial Memory 준비
  const anchor = prepareStickyAnchor(...);
  
  // [Axis 2: EDGE] Bubbling with edge policy
  for (const zoneId of bubblePath) {
    // [Axis 3: TAB] Direction filter (handles axis semantics)
    // [Axis 4: ENTRY] Zone entry resolution
  }
  
  // [Axis 5: TARGET] Applied by caller (useFocusBridge)
  // [Axis 6: RESTORE] Managed by cursorSlice
}
```

---

## 7. 권장 사항

| 옵션 | 추천도 | 이유 |
|------|:------:|------|
| **A. 전체 리팩토링** | ⭐⭐⭐ | 장기적 유지보수성, 신규 축 추가 용이 |
| **B. 경량 리팩토링** | ⭐⭐⭐⭐ | 현재 규모에 적합, 빠른 적용 가능 |
| **C. 현상 유지** | ⭐⭐ | 동작에 문제없으나 확장 시 기술 부채 |

### 최종 제안

1. **단기**: 옵션 B (경량 리팩토링)로 주석과 섹션 구분 개선
2. **중기**: `direction` 축만 별도 모듈로 추출 (가장 복잡한 부분)
3. **장기**: 신규 기능 추가 시점에 맞춰 점진적으로 옵션 A 적용

---

## 8. 결론

6-Axis 중심 리팩토링은 **개념적 명확성**을 높이지만, 현재 코드베이스 규모에서는 **경량 리팩토링**이 더 실용적입니다. 다만, 향후 새로운 Behavior나 ARIA 패턴을 추가할 계획이 있다면 **점진적 모듈화**를 권장합니다.
