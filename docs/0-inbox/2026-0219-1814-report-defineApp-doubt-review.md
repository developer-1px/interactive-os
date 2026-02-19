# /doubt + /review: defineApp 분석

> 2026-02-19 18:14 · 보고서 모드
> 대상: `defineApp.ts`, `defineApp.bind.ts`, `defineApp.trigger.ts`, `defineApp.types.ts`, `defineApp.testInstance.ts` (5 파일, 902줄)

---

## 1. /doubt 분석

### 목록화

| # | 파일 | 줄 수 | 역할 |
|:-:|------|:-----:|------|
| 1 | `defineApp.ts` | 269 | 메인 팩토리. condition/selector/command 등록, createZone, createTrigger, useComputed, create(test) |
| 2 | `defineApp.bind.ts` | 185 | Zone.bind() 결과물: ZoneComponent, ItemComponent, FieldComponent, WhenComponent 생성 |
| 3 | `defineApp.trigger.ts` | 125 | createSimpleTrigger + createCompoundTrigger(Dialog 패턴) |
| 4 | `defineApp.types.ts` | 170 | 브랜드 타입, 핸들러 타입, 바인딩 인터페이스, AppHandle/ZoneHandle/TestInstance 정의 |
| 5 | `defineApp.testInstance.ts` | 153 | 테스트 격리 커널 생성. flatHandlerRegistry 재등록 |

### 필터 체인

| # | 항목 | ①쓸모 | ②형태 | ③줄이기 | ④효율 | 판정 |
|:-:|------|:-----:|:-----:|:------:|:----:|:----:|
| 1 | `defineApp.ts` | ✅ 전 앱 팩토리 | ✅ | — | — | 🟢 |
| 2 | `defineApp.bind.ts` | ✅ UI 바인딩 | 🟡 | — | — | 🟡 |
| 3 | `defineApp.trigger.ts` | ✅ 트리거/다이얼로그 | ✅ | — | — | 🟢 |
| 4 | `defineApp.types.ts` | ✅ zero-runtime 타입 | ✅ | — | — | 🟢 |
| 5 | `defineApp.testInstance.ts` | ✅ 테스트 격리 | ✅ | — | — | 🟢 |

### 🟡 `defineApp.bind.ts` — 형태 의심

**Chesterton's Fence**: `bind()`에서 Zone/Item/Field/When 4개 컴포넌트를 생성하는데, **eventKeys 루프**(L59-79)가 형태를 왜곡하고 있음.

```typescript
// 현재: 런타임 문자열 루프 → 타입 안전성 0
const eventKeys = ["onCheck", "onAction", ...] as const;
for (const key of eventKeys) {
  if (key in config) {
    const cmd = (config as Record<string, unknown>)[key];  // 🔴 타입 소실
    zoneProps[key] = cmd;
  }
}
```

이유: ZoneBindings 인터페이스에 명시된 프로퍼티를 런타임 루프로 전달하면서 `Record<string, unknown>` 캐스팅 사용. 프로퍼티 추가/삭제 시 루프와 타입이 diverge 가능.

**더 적게 할 수 있나?**: 이 루프는 destructuring으로 대체 가능 → 줄 수 동일, 타입 안전성 ↑↑.

### /doubt 결과 (1라운드 수렴)

| Round | 🔴 제거 | 🟡 축소 | ↩️ 자기교정 | 수렴? |
|:-----:|:------:|:------:|:---------:|:----:|
| 1     | 0      | 1      | —         | ✅   |

- 🟡 **`defineApp.bind.ts` L59-79**: eventKeys 루프 → 명시적 prop 전달로 재설계 권고
- 🟢 나머지 4파일: 존재 이유 유효, 형태 적절

---

## 2. /review 분석

### 🔴 철학 위반

| 심각도 | 의도 | 위치 | 설명 |
|:------:|:----:|------|------|
| 🔴 | `[Blocker]` | `defineApp.ts` L102, L122 | `as unknown as Condition<S>`, `as unknown as Selector<S, T>` — 브랜드 타입 생성 시 double cast. **이유는 유효** (Symbol 브랜드를 object literal에 부여하는 유일한 방법). 그러나 팩토리 함수(`createCondition`, `createSelector`)로 추출하면 cast를 1곳으로 격리할 수 있음. Rule #4 "100% 타입" 관점에서 개선 여지. |
| 🔴 | `[Blocker]` | `defineApp.bind.ts` L74 | `(config as Record<string, unknown>)[key]` — 타입 가드 없이 any-level 접근. Zone에 새 콜백이 추가되면 런타임은 동작하지만 타입 체크가 누락을 잡지 못함. |
| 🔴 | `[Blocker]` | `defineApp.bind.ts` L131, L141, L148 | Field 바인딩에서 `Record<string, unknown>` 3회. `cmd.payload as Record<string, unknown>` — payload 타입 소실. |

### 🟡 구조/성능

| 심각도 | 의도 | 위치 | 설명 |
|:------:|:----:|------|------|
| 🟡 | `[Suggest]` | `defineApp.bind.ts` L87-95 | ZoneComponent 내 `useEffect`로 keybindings 등록. 의존성 배열 `[]` = config 변경 반영 불가. React StrictMode에서 double-register 가능성. |
| 🟡 | `[Suggest]` | `defineApp.trigger.ts` L65 | `Date.now()` 기반 dialogId — SSR/test에서 비결정적. `config.id` fallback만으로 충분한지 확인 필요. |
| 🟡 | `[Suggest]` | `defineApp.trigger.ts` L107 | `const confirmCmd = config.confirm ?? undefined` — `?? undefined`는 no-op. 축소 가능. |
| 🟡 | `[Suggest]` | `defineApp.ts` L231-251 | `createTrigger` overload — 런타임 type check (`typeof .type === "string"`)로 dispatch. TypeScript 함수 오버로드로 타입 안전하게 분기 가능. |

### 🔵 개선 제안

| 심각도 | 의도 | 위치 | 설명 |
|:------:|:----:|------|------|
| 🔵 | `[Suggest]` | `defineApp.types.ts` L88 | `KeybindingEntry.command: ZoneCallback` — 타입 이름만으로는 ZoneCallback이 `(cursor) => BaseCommand`인지 불명확. 별칭 or JSDoc 추가 권고. |
| 🔵 | `[Suggest]` | `defineApp.testInstance.ts` L55-58 | `history` 옵션 추출 IIFE — 가독성 낮음. 명시적 분기가 나을 수 있음. |
| 🔵 | `[Thought]` | 전체 | **테스트 0건**. 5파일 902줄, 소비자 2앱(todo 640줄 + builder ~300줄)의 기반인데 유닛 테스트 없음. `create()` 메서드가 있으나 `defineApp` 자체의 기계적 동작(command 등록, scope 생성, when guard 적용, condition 중복 방지 등)은 검증 안 됨. |

### 🟢 Praise

| 의도 | 대상 | 설명 |
|:----:|------|------|
| `[Praise]` | 전체 | `as any` **0건**. 모든 파일에서 any cast 없이 구현. 프로젝트 규칙 "100% 타입" 잘 지킴. |
| `[Praise]` | `defineApp.types.ts` | zero-runtime 타입 파일. 런타임 의존성 0, 170줄 순수 타입 선언. 교과서적 분리. |
| `[Praise]` | `defineApp.testInstance.ts` | 격리된 테스트 커널 패턴. flatHandlerRegistry 재등록, scope 정규화 — 테스트 안전성 우수. |
| `[Praise]` | 파일 분할 | `.ts`, `.bind.ts`, `.trigger.ts`, `.types.ts`, `.testInstance.ts` — concern 단위 분할. 탐색성 ↑↑. |

---

## 3. 종합 권고: 우선순위

### Tier 1 — 타입 안전성 (리팩토링)

| 대상 | 변경 | 효과 |
|------|------|------|
| `defineApp.bind.ts` eventKeys 루프 | 명시적 prop destructuring으로 교체 | `Record<string, unknown>` cast 제거 → 타입 가드 복원 |
| `defineApp.bind.ts` Field 바인딩 | payload cast → 타입 좁히기 | `as Record<string, unknown>` 3건 제거 |

### Tier 2 — 테스트 추가

| 대상 | 테스트 항목 |
|------|------------|
| `defineApp.ts` | condition 중복 등록 에러, selector 중복 에러, command → when guard, createZone scope 네이밍 |
| `defineApp.testInstance.ts` | create() → dispatch → state 변경, when guard 실패 시 false 반환, reset() |
| `defineApp.bind.ts` | (컴포넌트이므로 E2E에서 간접 커버 가능) |

### Tier 3 — 정리

| 대상 | 내용 |
|------|------|
| `defineApp.trigger.ts` L107 | `?? undefined` no-op 제거 |
| `defineApp.ts` L102, L122 | `as unknown as` → 팩토리 함수 추출 |
