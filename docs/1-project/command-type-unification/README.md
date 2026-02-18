# Command Type Unification

## WHY

defineApp ↔ OS 프리미티브 간 커맨드 전달에 **2가지 타입 체계**가 공존한다:

1. **CommandFactory** — 팩토리 함수 (ZoneBindings, FieldBindings, KeybindingEntry, createTrigger)
2. **BaseCommand** — 커맨드 객체 (OS.Zone props, dispatch, middleware)

`bind()`가 중간에서 `factory({ id: OS.FOCUS })` → `BaseCommand`로 변환하지만,
`OS.FOCUS`는 **상수 문자열 플레이스홀더**이므로 앱이 직접 호출해도 동일하다.
이 불필요한 변환 계층이 `AnyCommandFactory = CommandFactory<string, any>`라는
type-erased 타입을 필요로 하고, `noExplicitAny` 298건 중 ~80건의 근본 원인이다.

### 선행 ADR

`archive/2026/02/W07/os-core-refactoring/2026-0211-1559-[decision]-anycommand-type.md`
— 동일 문제의 커맨드 객체 측면을 분석. 후속 제안 #2로 통합 검토를 언급.

## Goals

1. ZoneBindings, FieldBindings, KeybindingEntry가 `BaseCommand`를 직접 받도록 변경
2. `bind()` 내부의 팩토리 → 커맨드 변환 로직 제거
3. `AnyCommandFactory` 타입 삭제
4. `noExplicitAny` ~80건 자연 해소

## Scope

### In
- `defineApp.types.ts` — ZoneBindings, FieldBindings, KeybindingEntry 타입 변경
- `defineApp.bind.ts` — 팩토리 호출 로직 제거
- `defineApp.trigger.ts` — createTrigger 시그니처 변경
- `defineApp.widget.ts` — v3 compat 레이어 조정
- `keybindings.ts` — KeyBinding 타입에서 factory+args → BaseCommand
- 앱 코드 (todo 등) — bind() 호출부에서 `cmd({ id: OS.FOCUS })` 추가
- kernel tokens.ts — AnyCommandFactory 삭제

### Out
- `CommandFactory<T, P>` 자체 — 앱이 command()로 정의할 때 여전히 필요
- `BaseCommand` vs `AnyCommand` 통합 — 별도 검토 (ADR 참조)
- `resolveFocusId()` — 플레이스홀더 메커니즘 유지
- OS 프리미티브 (Zone, Trigger, Field) 내부 — 이미 BaseCommand 사용
