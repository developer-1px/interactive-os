# 포커스 시스템 개요 및 아키텍처

> **버전**: v8.201 (2026-02-07)
> **위치**: `src/os/features/focus/`

---

## 1. 개요

Focus System은 Antigravity Interaction OS의 핵심 내비게이션 엔진입니다. 웹 브라우저의 기본 포커스 메커니즘(`tabIndex`, `activeElement`)을 완전히 대체하여, 운영체제 수준의 **결정론적 내비게이션**을 구현합니다.

### 핵심 철학

> **"브라우저는 캔버스일 뿐, 물리학은 엔진이 담당한다."**

Interactive-OS는 웹 페이지가 아닌 **애플리케이션**입니다. 다음 전략을 채택합니다:

| 전략 | 설명 |
|:--|:--|
| **블랙홀(Black Hole)** | 모든 Item에 `tabIndex="-1"` 적용, 브라우저 Tab Order에서 제거 |
| **Zone 전략** | DOM 구조가 아닌 수학적 좌표로 다음 위치 계산 |
| **입력 싱크** | Edit Mode 외에는 포커스를 컨테이너에 고정 |

---

## 2. Config-Driven 행동 모델

복잡한 ARIA 패턴을 **6개의 Config 객체**로 설정합니다:

| Config | 주요 속성 | 설명 |
|:--|:--|:--|
| **navigate** | `orientation`, `loop`, `seamless`, `entry`, `recovery` | 방향키 내비게이션 설정 |
| **tab** | `behavior`, `restoreFocus` | Tab 키 동작 정책 |
| **select** | `mode`, `followFocus`, `range`, `toggle` | 선택 동작 |
| **activate** | `mode` | 활성화 트리거 방식 |
| **dismiss** | `escape`, `outsideClick` | 해제 동작 |
| **project** | `virtualFocus`, `autoFocus` | DOM 프로젝션 |

### ARIA Role 프리셋

각 ARIA Role에 대해 사전 정의된 Config를 제공합니다:

| Role | Navigate | Tab | Select | Activate |
|:--|:--|:--|:--|:--|
| **listbox** | vertical, loop | escape | single, range | manual |
| **menu** | vertical, loop, typeahead | escape | none | manual |
| **tablist** | horizontal, loop | escape, restore | single | manual |
| **toolbar** | horizontal | escape | none | manual |
| **grid** | both, seamless | escape | single | - |
| **radiogroup** | vertical, loop | escape | single, followFocus | automatic |

> **구현 위치**: `src/os/features/focus/store/roleRegistry.ts`

---

## 3. 디렉토리 구조

```
src/os/features/focus/
├── types.ts              # 통합 타입 정의 (FocusGroupConfig, FocusIntent 등)
│
├── pipeline/             # 5-Phase 파이프라인
│   ├── 1-sense/          # 브라우저 이벤트 캡처 (FocusSensor)
│   ├── 2-intent/         # 키 → 의도 변환 (classifyKeyboard, routeKeyboard 등)
│   ├── 3-resolve/        # 다음 상태 계산 (updateNavigate, updateSelect 등)
│   ├── 4-commit/         # Store 업데이트 (runOS)
│   ├── 5-sync/           # DOM 동기화 (FocusSync)
│   └── core/             # 파이프라인 러너 (runOS.ts)
│
├── primitives/           # React 컴포넌트
│   ├── FocusGroup.tsx    # Zone 프리미티브 (관할권)
│   └── FocusItem.tsx     # Item 프리미티브 (포커스 대상)
│
├── store/                # Zustand 상태 관리
│   ├── FocusGroupStore.ts
│   ├── sliceZone.ts      # Zone 등록/관리, 자기 치유 포커스(recovery)
│   └── roleRegistry.ts   # ARIA Role 프리셋 정의
│
├── registry/             # Zone/Item DOM 레지스트리
├── hooks/                # React 훅
└── lib/                  # 유틸리티
```

---

## 4. 상태 관리

### FocusGroupStore (Zustand + Immer)

| 상태 | 타입 | 설명 |
|:--|:--|:--|
| `focusedItemId` | `string \| null` | 현재 포커스된 아이템 ID |
| `lastFocusedId` | `string \| null` | 마지막 포커스 위치 (restore용) |
| `selection` | `string[]` | 선택된 아이템 ID 배열 |
| `selectionAnchor` | `string \| null` | 범위 선택 기준점 |
| `expandedItems` | `string[]` | 확장된 아이템 ID 배열 |
| `stickyX/Y` | `number \| null` | 공간 기억 좌표 (Grid 내비용) |
| `items` | `string[]` | 등록된 아이템 ID 배열 (DOM 순서) |

### 전역 상태 (FocusData)

| 속성 | 설명 |
|:--|:--|
| `activeZoneId` | 현재 활성 Zone ID |
| `getFocusPath()` | 루트→현재 Zone 경로 배열 |
| `getOrderedZones()` | 모든 Zone ID (DOM 순서) |

---

## 5. DOM 동기화 (Sync)

브라우저 DOM과 가상 포커스의 양방향 동기화:

```
[Store 변경] → FocusSync → el.focus({ preventScroll: true })
                         → el.scrollIntoView({ block: "nearest" })

[브라우저 이벤트] → FocusSensor → runOS 파이프라인 → Store 업데이트
```

### 스크롤 조정
- `preventScroll: true`로 네이티브 점프 방지
- `scrollIntoView({ block: "nearest" })`로 최소 이동 보장
- 이미 보이면 이동 없음 → 빠른 내비게이션 시 "진동" 방지

---

## 6. 주요 패턴

### Kanban 2D 내비게이션
Zone 계층과 Config 조합으로 N차원 포커스 구현:
- 컬럼 내: ↑↓ 이동 (vertical)
- 컬럼 간: ←→ 이동 시 부모 Zone으로 버블 → 다음 컬럼으로 딥다이브
- `seamless: true`: 컬럼 경계 없는 공간 탐색

### 포커스 가능 Zone
Zone이 Container이면서 동시에 Target인 경우:
- `focusable={true}`: Zone 자체도 아이템으로 등록
- Enter: 내부 진입 / Escape: 부모로 복귀

### 가상 포커스 (Combobox)
- `virtualFocus: true`: `aria-activedescendant` 사용
- Input이 실제 포커스 유지, Arrow로 가상 커서 이동
- 📚 [Deep Dive: Virtual Focus & aria-activedescendant](../../3-resource/04-architecture/2026-0215-virtual-focus-activedescendant.md)

### 안티 패턴

| ❌ 잘못된 패턴 | ✅ 올바른 패턴 |
|:--|:--|
| 앱에서 인덱스 수학 | OS에 내비게이션 위임 |
| 수동 `tabIndex` 관리 | Roving TabIndex 자동 관리 |
| `onClick`에서 `focus()` 호출 | Pipeline의 `OS_FOCUS` 사용 |

---

*마지막 업데이트: 2026-02-07*
