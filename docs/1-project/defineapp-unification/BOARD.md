# BOARD — defineApp Unification

## 🔴 Now

(없음 — 실행 가능한 Clear 태스크 모두 완료)

## ⏳ Done

- [x] T1: createTrigger 타입 안전화 — `payload: unknown` → 제네릭 `P` 추론 (02-20)
- [x] T2: Trigger 패턴 canonical — TaskItem 5개 + Sidebar 1개 원시 Trigger → createTrigger (02-20)
- [x] T4: Builder 핸들러 타입 명시 제거 — 5개 커맨드 `(ctx: {state})` → `(ctx)` 추론 (02-20)
- [x] T3: Undo/Redo generic 팩토리 — 180줄→6줄 `createUndoRedoCommands` + P1 소속 통일 (02-20)

## ⏸ Deferred → Ideas

- T5: useComputed 캐스팅 해소 — `useComputed` primitive-only 제약이 원인. API 변경(non-primitive 허용 overload 추가) 필요 → 별도 프로젝트
- T6: Export 패턴 통일 — Todo Namespaced 패턴이 canonical. Builder는 구조가 다름(자체 Builder.Item 래퍼). 무리하게 통일 불필요
- T7: Builder BoundComponents 정리 — dead code가 아님. `bind()` 호출 자체가 zone 등록 사이드이펙트. 변수명이 export되지만 뷰에서 미사용은 정상 (side-effect-only bind)
- T8: kernel 직접 참조 — followFocus(Sidebar)와 PropertiesPanel imperative bridge(Builder)는 known escape hatch. OS-level API 개선 시 함께 해소

## 💡 Ideas

- `fromArray()` 헬퍼 추가 (createCollectionZone 설정 간소화)
- `INITIAL_STATE` 위치 관례 확정 (별도 파일 vs 인라인)
- createTrigger의 disabled 자동 감지 (when 가드 연동)
- ESLint rule: 뷰에서 OS primitive 직접 import 감지
- useComputed non-primitive overload 추가
