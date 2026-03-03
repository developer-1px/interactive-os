# Blueprint: OS_ACTIVATE config.activate.effect 소비

## 1. Goal

**UDE**: `activate.ts`가 `DOM_EXPANDABLE_ITEMS` (DOM/runtime context)를 직접 조회하여 expand 판단.
`config.activate.effect`가 타입에 존재하고 roleRegistry에 설정되어 있지만, **실제로 소비되지 않음**.

**Done Criteria**: `activate.ts`가 `config.activate.effect`로 판단. `DOM_EXPANDABLE_ITEMS` inject 제거.

## 2. Why

프로젝트 claim: "6 commands × **rolePresets(chain)** = APG 전수 커버".
config-driven이 불변인데, OS_ACTIVATE만 DOM 의존 → **claim 위반**.

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| effect 필드만으로 expand 대상 판별 가능 | ❌ **불충분** | effect="toggleExpand"는 "이 zone에서 activate→expand"이지, "이 **item이** expandable"인지는 모름 |
| accordion은 모든 아이템이 expandable | ✅ expand.mode="all" | — |
| tree는 activate로 expand하지 않음 | ✅ chain executor가 처리 | — |

**핵심 무효화**: `effect="toggleExpand"`만으로 **아이템 수준** expandable 판별 불가.
accordion(expand.mode="all")은 모든 아이템 → 문제 없음.
tree는 activate가 아님 → 문제 없음.

**하지만**: future role이 "일부 아이템만 expandable"일 때 effect만으로는 부족.
→ **effect + expand.mode 조합**으로 판단. effect가 있으면 activate가 expand를 시도하되,
아이템이 expandable인지는 여전히 필요. 다만 이건 `OS_EXPAND` 내부에서 guard 가능.

## 4. Ideal

```typescript
// activate.ts — config-driven
const zoneConfig = ctx.inject(ZONE_CONFIG);
if (zoneConfig?.activate?.effect === "toggleExpand") {
  return { dispatch: OS_EXPAND({ action: "toggle", itemId }) };
}
```

- `DOM_EXPANDABLE_ITEMS` inject 제거
- config만으로 판단
- OS_EXPAND 내부에서 non-expandable item guard

## 5. Inputs

| 파일 | 역할 |
|-|-|
| `activate.ts` | 수정 대상 |
| `FocusGroupConfig.ts` L77-96 | ActivateConfig 타입 (effect 필드 이미 존재) |
| `roleRegistry.ts` | accordion: effect="toggleExpand", menu: effect="invokeAndClose" |
| `expand-absorption.test.ts` | T5 기존 테스트 (이미 PASS) |
| `apg-matrix.test.ts` | accordion Enter/Space 테스트 (이미 PASS) |
| `OS_EXPAND` | toggle 시 non-expandable guard 여부 확인 필요 |

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | activate.ts가 config.effect 소비 | DOM_EXPANDABLE_ITEMS.has() 의존 | config 조회로 교체 | High | — |
| G2 | DOM_EXPANDABLE_ITEMS inject 불필요 | activate.ts에서 inject | 제거 | Med | G1 |
| G3 | OS_EXPAND가 non-expandable item guard | **미확인** | 확인 후 필요 시 추가 | Med | G1 |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| E1 | OS_EXPAND guard 확인 | 🟢 Clear | — | expand/index.ts에서 non-expandable item에 대한 guard 존재 여부 확인 |
| E2 | activate.ts 수정 | 🟢 Clear | E1 | config.activate.effect 소비, DOM_EXPANDABLE_ITEMS 제거 |
| E3 | 기존 테스트 검증 | 🟢 Clear | E2 | expand-absorption + apg-matrix → regression 0 |

## Cynefin 판정

**🟢 Clear.** config 인프라(타입, roleRegistry, 테스트) 전부 이미 존재.
activate.ts L33-37을 config 조회로 교체하면 끝. Complex 아님.
