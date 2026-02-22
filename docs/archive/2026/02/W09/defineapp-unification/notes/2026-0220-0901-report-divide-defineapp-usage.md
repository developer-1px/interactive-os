# defineApp Usage 비일관성 — 분해 보고서

> `/divide` — Discussion에서 발견된 "defineApp 소비 패턴 분산" 문제를 Cynefin 기준으로 분해

## 배경

Discussion에서 확인된 핵심 통찰:
- defineApp **API 프리미티브** 자체는 일관적 (condition/selector/command/createZone/bind)
- **소비 패턴**(usage)이 앱마다 다름 = **Pit of Success 부재**
- 에이전트가 새 앱을 작성할 때 매번 동일한 의사결정을 반복함

비교 대상: [todo/app.ts](file:///Users/user/Desktop/interactive-os/src/apps/todo/app.ts) vs [builder/app.ts](file:///Users/user/Desktop/interactive-os/src/apps/builder/app.ts)

---

## 문제 분해

### P1. Undo/Redo 소속 불일치 — **Complicated**

| | Todo | Builder |
|---|------|---------|
| 소속 | `listCollection.command("undo", ...)` | `BuilderApp.command("undo", ...)` |
| 위치 | Collection Zone 레벨 | 앱 레벨 |

**영향**: 에이전트가 새 앱에 Undo/Redo를 추가할 때 "어디에 등록하지?"를 판단해야 함.

**분석**: Undo/Redo는 **전체 앱 상태**를 되돌리므로 본질적으로 앱-레벨 관심사다. Todo에서 `listCollection`에 등록한 것은 `onUndo` 바인딩이 listZone에 있어서 편의상 그렇게 한 것이지, 의미적으로 맞는 건 아니다. Builder가 `BuilderApp.command`로 한 것이 더 의미적으로 정확.

**판정**: 관례 확정 필요 → **Undo/Redo는 앱-레벨에 등록하고 `onUndo`/`onRedo`로 바인딩만 각 존에서 한다.**

---

### P2. 핸들러 타입 명시 불일치 — **Clear**

| | Todo | Builder |
|---|------|---------|
| 스타일 | `(ctx) =>` (추론) | `(ctx: { state: BuilderState }) =>` (명시) |
| 사례 수 | 12개 커맨드 전부 추론 | 5개 커맨드 전부 명시 |

**영향**: 에이전트가 "타입을 써야 하나 말아야 하나" 판단 비용.

**분석**: `defineApp<S>`가 제네릭으로 `S`를 바인딩하므로, `FlatHandler<S, P>` 시그니처에서 `ctx` 타입은 자동 추론된다. **명시적 타입은 불필요**. Builder의 `(ctx: { state: BuilderState })` 명시는 TSC에는 무해하지만, 에이전트에게 "이렇게 써야 하나?"라는 잘못된 신호를 보냄.

**판정**: **Clear** → 타입 추론에 위임. 관례: `(ctx)` 또는 `(ctx, payload: P)`.

---

### P3. Export 패턴 불일치 — **Complicated**

| | Todo | Builder |
|---|------|---------|
| 패턴 | Namespaced: `TodoList = { ...UI, commands: {...} }` | Flat: `BuilderSidebarUI`, `BuilderCanvasUI` 각각 export |
| export 수 | `TodoList`, `TodoSidebar` 등 5개 네임스페이스 | `BuilderSidebarUI`, `BuilderCanvasUI` 등 flat export |

**영향**: 외부에서 import할 때 `TodoList.Zone` vs `BuilderSidebarUI.Zone` — 구조가 다름. 소비 코드에서 패턴 일관성 깨짐.

**분석**: Todo의 Namespaced Export는 **Zone + Commands를 번들**로 묶어서 "이 zone이 뭘 할 수 있는지"를 한 눈에 보여줌. Builder는 그런 번들링이 없어서 commands가 app.ts 전체에 흩어져있음.

**판정**: 트레이드오프 분석 필요. Namespaced가 더 discoverable하지만, Builder처럼 Zone 수가 적으면 오버엔지니어링일 수 있음. → **관례 확정 필요**

---

### P4. `useComputed` 캐스팅 강제 — **Complicated**

```typescript
// builder/app.ts:428
) as unknown as Record<string, string>;

// builder/app.ts:463
}) as unknown as string;
```

**영향**: `as unknown as`는 rules.md Goal #4 위반 신호 ("Make Illegal States Unrepresentable"). API가 올바른 반환 타입을 표현하지 못함.

**분석**: `useComputed`의 반환 타입이 selector 함수의 반환 타입과 일치하지 않는 상황. `slice.useComputed`의 제네릭 추론이 실패하거나, 래핑 과정에서 타입이 소실됨. 이건 **defineApp API 자체의 타입 설계 결함**.

**판정**: API 수정 필요. `useComputed`가 selector 반환 타입을 정확히 추론하도록 타입 시그니처 개선.

---

### P5. `kernel` 직접 참조 (Imperative Escape Hatch) — **Complicated**

```typescript
// builder/app.ts:396
import { kernel } from "@/os/kernel";

// builder/app.ts:415 — builderUpdateField
kernel.dispatch(updateField({ sectionId, field, value }));

// builder/app.ts:471 — builderUpdateFieldByDomId
const appState = kernel.getState().apps["builder"] as BuilderState | undefined;
kernel.dispatch(updateField({ ... }));
```

Todo에도 있지만 테스트 코드에만 있음:
```typescript
// todo/tests/unit/clipboard-bug.test.ts:32
kernel.dispatch(addTodo({ text: "A" }));
```

**영향**: "모든 변경은 하나의 문을 통과한다" (Rule #3) 위반. 앱 코드가 kernel을 직접 참조하면 defineApp의 추상화가 무의미해짐.

**분석**: Builder의 imperative helpers (`builderUpdateField`, `builderUpdateFieldByDomId`)는 PropertiesPanel에서 native `<input>` onChange를 커맨드로 변환하기 위한 **ZIFT Remediation 브릿지**. 존재 자체가 나쁜 것은 아니지만, **app.ts에 있으면 안 되고** OS 레이어의 브릿지 패턴으로 격리되어야 함.

**판정**: 브릿지를 app.ts에서 분리하고, 장기적으로 defineApp이 imperative dispatch 헬퍼를 공식 제공할지 결정 필요.

---

### P6. Undo/Redo 구현 중복 — **Clear**

Todo undoCommand: [app.ts:145-202](file:///Users/user/Desktop/interactive-os/src/apps/todo/app.ts#L145-L202) (57줄)
Builder undoCommand: [app.ts:194-237](file:///Users/user/Desktop/interactive-os/src/apps/builder/app.ts#L194-L237) (43줄)

**영향**: 거의 동일한 로직이 두 곳에 복제. "복제본을 동기화하려는 순간이 '왜 복제본이 있는가?'를 물어야 하는 순간이다" (Rule #11).

**분석**: 두 앱의 Undo/Redo 로직은 핵심이 동일:
1. `past`에서 groupId로 묶인 항목들을 pop
2. 현재 상태를 `future`에 push
3. snapshot에서 `data`/`ui` 복원

차이점은 Todo가 focus dispatch를 추가하는 것뿐.

**판정**: **Clear** → OS 레벨에서 generic undo/redo 커맨드 팩토리를 제공해야 한다. 이미 `historyKernelMiddleware`가 있으므로 그 위에 구축 가능.

---

### P7. `createCollectionZone` 설정 불일치 — **Clear**

| | Todo | Builder |
|---|------|---------|
| 데이터 형태 | Entity dict (`fromEntities()`) | Array 직접 (`accessor`) |
| ID 추출 | 자동 (entity key = ID) | 수동 (`extractId: focusId.replace("sidebar-", "")`) |

**영향**: API가 두 가지 설정 경로를 허용하므로 에이전트가 매번 선택해야 함.

**분석**: 이건 `createCollectionZone`의 설계 문제. **데이터 형태가 다르니 설정이 다른 것은 정당**. 하지만 `fromEntities` 헬퍼가 있듯이, Array 버전도 `fromArray()` 헬퍼가 있으면 에이전트가 고민할 필요 없음.

**판정**: **Clear** → `fromArray()` 헬퍼 추가, 관례 확정.

---

### P8. `INITIAL_STATE` 위치 불일치 — **Clear**

| | Todo | Builder |
|---|------|---------|
| 위치 | 별도 파일 (`persistence.ts`에서 import) | `app.ts`에 인라인 (72줄짜리 객체) |

**영향**: 파일 구조 컨벤션 부재. `INITIAL_STATE`가 커지면 app.ts가 비대해짐.

**판정**: **Clear** → 관례 확정 (별도 파일 vs 인라인 기준).

---

## Cynefin 분류 요약

| 도메인 | 문제 | 전략 |
|--------|------|------|
| **Clear** | P2 (핸들러 타입), P6 (Undo 중복), P7 (collection 헬퍼), P8 (INITIAL_STATE 위치) | 관례 정하고 즉시 실행 |
| **Complicated** | P1 (Undo 소속), P3 (Export 패턴), P4 (useComputed 캐스팅), P5 (kernel 직접 참조) | 트레이드오프 분석 후 결정 |
| **Complex** | 없음 | — |

## 실행 우선순위 제안

1. **P2** (Clear, 가장 쉬움) — Builder 핸들러 타입 명시 제거
2. **P6** (Clear, 가장 큰 중복) — generic undo/redo 팩토리 추출
3. **P7** (Clear) — `fromArray()` 헬퍼 추가
4. **P8** (Clear) — INITIAL_STATE 위치 관례 확정
5. **P1** (Complicated) — Undo 소속 결정, Todo 수정
6. **P4** (Complicated) — useComputed 타입 개선
7. **P3** (Complicated) — Export 패턴 통일
8. **P5** (Complicated) — imperative 브릿지 격리
