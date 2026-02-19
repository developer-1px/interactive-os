# BOARD — Command Type Unification

## 🔴 Now
- [ ] T1: ZoneBindings → BaseCommand — onCheck/onAction 등 14개 필드 타입 변경
  - [ ] /tdd
  - [ ] /divide
  - [ ] /verify
- [ ] T2: bind() 팩토리 호출 제거 — eventMap 루프에서 cmd({id: OS.FOCUS}) 삭제
- [ ] T3: FieldBindings → BaseCommand — onChange/onSubmit/onCancel 분기 로직 제거
- [ ] T4: KeyBinding → BaseCommand — factory+args 패턴 → 단일 BaseCommand
- [ ] T5: createTrigger → BaseCommand — 팩토리 대신 커맨드 객체 수락
- [ ] T6: AnyCommandFactory 삭제 — kernel tokens에서 제거
- [ ] T7: 앱 코드 마이그레이션 — bind() 호출부에서 cmd({ id: OS.FOCUS }) 추가
- [ ] T8: /verify — tsc + unit + smoke + build

## ⏳ Done
(empty)

## 💡 Ideas
- BaseCommand vs AnyCommand 통합 검토 (ADR 후속 #2)
- v3 compat widget 레이어 단순화 — 이번에 같이?
- KeyBinding에서 when context도 함께 단순화?
