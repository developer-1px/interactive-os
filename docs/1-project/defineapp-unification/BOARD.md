# BOARD — defineApp Unification

## 🔴 Now

- [ ] T3: Undo/Redo 앱-레벨 통합 — 중복 로직(Todo 57줄 + Builder 43줄) → generic 팩토리 추출
- [ ] T5: useComputed 캐스팅 해소 — `as unknown as` 제거, API 타입 개선
- [ ] T6: Export 패턴 통일 — Namespaced export 관례 확정 (Todo 패턴 canonical)
- [ ] T7: Builder 미사용 BoundComponents 정리 — `BuilderSidebarUI`/`BuilderCanvasUI` 활용 또는 제거
- [ ] T8: kernel 직접 참조 격리 — imperative 브릿지를 app.ts에서 분리

## ⏳ Done

- [x] T1: createTrigger 타입 안전화 — `payload: unknown` → 제네릭 `P` 추론 (02-20)
- [x] T2: Trigger 패턴 canonical — TaskItem 5개 + Sidebar 1개 원시 Trigger → createTrigger (02-20)
- [x] T4: Builder 핸들러 타입 명시 제거 — 5개 커맨드 `(ctx: {state})` → `(ctx)` 추론 (02-20)

## 💡 Ideas

- `fromArray()` 헬퍼 추가 (createCollectionZone 설정 간소화)
- `INITIAL_STATE` 위치 관례 확정 (별도 파일 vs 인라인)
- createTrigger의 disabled 자동 감지 (when 가드 연동)
- ESLint rule: 뷰에서 OS primitive 직접 import 감지
