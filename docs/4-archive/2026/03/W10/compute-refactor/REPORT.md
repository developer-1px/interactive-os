# /divide Report — computeItem ARIA 투영 조건 분기 제거

## Problem Frame

| | 내용 |
|---|------|
| **Objective** | `computeItem`의 ARIA 투영 조건 분기를 제거하고, `items[id]`에 있는 aria-* 키를 그대로 투영 🟢 |
| **Constraints** | C1. 기존 테스트 전부 통과 🟢 / C2. headless와 DOM 동일 동작 (Zero Drift) 🟢 / C3. 코드 수정은 이 Report 이후 🟢 |
| **Variables** | V1. 초기 aria-* state를 **언제, 누가** 쓰는가 🟡 / V2. `aria-selected: false`가 초기에 state에 없으면 투영 안 됨 🟢 |

## Backward Chain

| Depth | Subgoal | 충족? | Evidence | 미충족 시 전제조건 |
|-------|---------|-------|----------|--------------------|
| 0 | computeItem이 `items[id]`의 aria-* 를 그대로 투영 | ❌ | `compute.ts:96-121` — 6개 개별 if 분기 | → A, B |
| 1 | **A**: 커맨드가 aria-* 를 state에 직접 쓴다 | ✅ | `select.ts:24`, `check.ts:48-50`, `press.ts:56-58`, `expand/index.ts:52-53` | — |
| 1 | **B**: 초기 상태에서 aria-* 키가 state에 존재한다 (false 포함) | ❌ | — | → B1, B2, B3 |
| 2 | **B1**: `aria-selected` 초기화 | ⚠️ 부분 | `page.ts:992-1002` — headless `goto()`에서 `initial.selection`이 있으면 씀. 하지만 **selected가 없는 option에 `false`를 안 씀** | → B1a |
| 2 | **B2**: `aria-checked` 초기화 | ❌ | 어디서도 초기 `false`를 쓰지 않음. `OS_CHECK`는 인터랙션 시에만 토글 | 🔨 WP-1 |
| 2 | **B3**: `aria-pressed` 초기화 | ❌ | 어디서도 초기 `false`를 쓰지 않음. `OS_PRESS`는 인터랙션 시에만 토글 | 🔨 WP-1 |
| 2 | **B4**: `aria-expanded` 초기화 | ⚠️ 부분 | `page.ts:1006-1015` — `initial.expanded`가 있으면 씀. 없으면 미기록 | 🔨 WP-1 |
| 3 | **B1a**: `aria-selected: false`를 select 지원 Zone의 **모든** 아이템에 초기화 | ❌ | `page.ts:996-998` — 선택된 것만 `true` 기록, 나머지에 `false` 안 씀 | 🔨 WP-2 |

## 추가 발견

| Depth | Subgoal | 충족? | Evidence |
|-------|---------|-------|----------|
| 0 | `as unknown as ElementAttrs` 캐스팅 제거 | ❌ | `compute.ts:257,267,285` — 3회 |
| 1 | `ItemAttrs`, `ContainerProps`가 `ElementAttrs`의 서브타입 | ❌ | `ElementAttrs = Record<string, ...>` — 구조적 서브타이핑 실패 |

## Work Packages

| WP | Subgoal | 왜 필요한가 (chain) | Evidence | 크기 |
|----|---------|-------------------|----------|------|
| **WP-1** | Zone 등록 시 `config/preset`에서 투영 대상 aria-* 키를 파생하여 `items`에 초기값으로 기록 | Goal ← B ← B2,B3,B4 | `zoneInit.ts:19` — `initialZoneState`를 그대로 쓰며 `items: {}` 빈 맵 | M |
| **WP-2** | `aria-selected` 지원 Zone에서 **모든** 아이템에 초기 `false` 기록 | Goal ← B ← B1 ← B1a | `page.ts:996-998` — 선택된 것만, `select.ts:91` — 이후 replace시에만 clear | S |
| **WP-3** | `computeItem`에서 조건 분기 제거 — `items[id]`의 aria-* 를 순회 투영 | Goal (직접) | `compute.ts:96-121` — 50줄 → ~5줄 | S |
| **WP-4** | `as unknown as ElementAttrs` 3회 제거 — 타입 설계 개선 | 추가 발견 | `compute.ts:257,267,285` | S |

## 실행 순서 (의존성)

```
WP-1 (초기화 인프라) ← WP-2 (selected 전체 초기화) ← WP-3 (computeItem 축소)
                                                      ↗
                                              WP-4 (타입 정리, 독립)
```

1. **WP-1**: `OS_ZONE_INIT` 또는 `page.goto()`에서, preset config 기반으로 투영 대상 aria-* 를 결정하고 `items[id]`에 초기값을 기록하는 로직 추가
2. **WP-2**: `select.mode !== "none"`인 Zone에서 모든 아이템에 `aria-selected: false` 초기화
3. **WP-3**: `computeItem`에서 `hasSelectRole`, `hasCheckCommand`, `hasPressCommand`, `inputmapCmds` 제거. `items[id]`의 aria-* 키를 그대로 투영
4. **WP-4**: `ElementAttrs` 타입 또는 `resolveElement` 반환 타입을 개선하여 `as unknown as` 제거

## 핵심 설계 결정

### 어디서 초기화하나?

| 선택지 | 장점 | 단점 |
|--------|------|------|
| A. `OS_ZONE_INIT` 커맨드 | 단일 경로, React/headless 통합 | 아이템 목록을 init 시점에 알아야 함 |
| B. `page.goto()` / `Zone.useLayoutEffect` | 현재 패턴과 일치 | 두 곳에서 같은 로직 중복 |
| C. **preset config에 `projectedAria` 선언** → 등록 시 Zone 레벨에서 결정 | config가 Single Source of Truth, 아이템별이 아닌 **Zone별** 메타데이터 | 새로운 config 필드 추가 필요 |

**🟡 제 추천: C** — 아이템별 초기화(A,B)보다 Zone 레벨에서 "이 Zone은 aria-selected를 투영한다"를 선언하는 것이 낫다. `computeItem`은 Zone의 `projectedAria` + `items[id]`의 실제 값만 보면 됨.

## Residual Uncertainty

- **React Zone.tsx의 초기화 경로**: headless `page.goto()`와 React `Zone.useLayoutEffect`가 동일한 초기화를 해야 함. WP-1에서 통합 방법 결정 필요.
- **OS_INIT_SELECTION과 zone.selection의 관계**: `initSelection.ts:33`이 아직 `zone.selection[]` (레거시?)을 쓰고 있음. `items[id]["aria-selected"]`와의 이중 경로 가능성 확인 필요.
