# OS Core Refactoring — 기획서

> Status: Active
> Created: 2026-02-09
> Updated: 2026-02-12

---

## Why — 배경과 동기

### 현재 문제점

1. **상태 파편화**: `FocusData`(전역 변수) + `FocusGroupStore`(Zone별 Zustand) + `CommandEngineStore`(앱별) — 3개 이상의 상태 저장소가 분산
2. **복잡한 커맨드 라우팅**: dispatch → eventBus → FocusIntent → runOS (4단계). re-frame은 2단계(dispatch → handler)
3. **App Override 한계**: Zone prop으로 앱 커맨드 전달, OS 코드가 App 커맨드를 직접 dispatch (결합도 높음)
4. **과잉 수집**: `buildContext()`가 매 커맨드마다 DOM rect, focus path 등 30+ 필드를 전부 수집

### Kernel 도입으로 해결되는 것

- ✅ **단일 State Tree** — `state.os` + `state.app`, 트랜잭션 기록, Time-travel debugging
- ✅ **Scoped Handler** — App이 OS 커맨드를 scope 단위로 override (DOM 버블링 패턴)
- ✅ **EffectMap 선언형 이펙트** — `{ state, focus, scroll }` 반환, 부작용 격리
- ✅ **Middleware 체계** — Transaction log, debug, analytics 횡단 관심사 분리

---

## What — 목표와 범위

**os-new를 @kernel 기반으로 완전 재구성**하여 3-Layer Architecture를 실현한다:

```
┌─────────────────────────────────────┐
│  Layer 3: App                       │  ← Todo, Kanban (도메인 로직)
├─────────────────────────────────────┤
│  Layer 2: OS                        │  ← Focus, Zone, Navigate, Activate
├─────────────────────────────────────┤
│  Layer 1: Kernel (완성)              │  ← dispatch, bubbling, scoped handler
└─────────────────────────────────────┘
```

### 범위 (8 Phases)

| Phase | 내용 | 복잡도 |
|-------|------|--------|
| 1 | OS State 통합 (Zustand → Kernel) | 중 |
| 2 | OS Commands Kernel 등록 | 고 |
| 3 | OS Effects 등록 | 낮 |
| 4 | Context Providers 등록 | 낮 |
| 5 | Scoped Handler 통합 | 고 |
| 6 | Keybinding Phase 분리 | 중 |
| 7 | Primitive 재작성 (Zone, Item, Field) | 중 |
| 8 | App Layer 마이그레이션 (Todo, Kanban) | 낮 |

---

## 완료 기준 (Definition of Done)

### 기능
- [ ] Todo 앱 완전 동작 (kernel + os-new 기반)
- [ ] Keyboard navigation 정상 (arrow, tab, enter, esc)
- [ ] Selection (single/multi), Field inline edit, Clipboard, History 정상

### 아키텍처
- [ ] `state.os`와 `state.app` 완전 분리
- [ ] 모든 OS/App 커맨드가 `kernel.defineCommand` 기반
- [ ] Zone = Kernel Scope (1:1)
- [ ] 전역 변수 제거 (FocusData, CommandEngineStore)

### 품질
- [ ] TypeScript strict 모드 0 에러
- [ ] 모든 테스트 통과
- [ ] Transaction log로 전체 상태 변화 추적 가능

---

## Non-Goals (하지 않을 것)

- 새로운 기능 추가 (동일 기능, 더 나은 아키텍처)
- Builder* 컴포넌트 Kernel 전환 (별도 프로젝트)
- 성능 최적화 (아키텍처 전환 후 별도 수행)

---

## 참고 문서

- [상세 Migration Plan](file:///Users/user/Desktop/interactive-os/docs/1-project/os-core-refactoring/notes/2026-02-09_OS-New_Kernel_Migration_Plan.md)
- [경량화 리팩토링 플랜](file:///Users/user/Desktop/interactive-os/docs/1-project/os-core-refactoring/notes/2026-02-09_refactoring-plan.md)
- [Kernel Source](file:///Users/user/Desktop/interactive-os/packages/kernel/src/index.ts)
