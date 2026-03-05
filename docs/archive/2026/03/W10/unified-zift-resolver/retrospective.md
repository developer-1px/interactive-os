# Retrospective: Unified ZIFT Resolver

**Goal**: 4개 resolver → 1개 chain executor + Layer[] loop
**Result**: resolveKeyboard 본문 80줄→15줄, resolveClick 78줄→49줄. tsc 0, 122/122 PASS.

## 🔧 Development KPT

**Keep 🟢**
- Field absorb-all이 Keymap 모델에 안 맞다는 걸 일찍 발견 → 무리한 통합 방지
- `buildTriggerKeymap` 테스트를 기존 `resolveTriggerKey` 테스트에서 1:1 마이그레이션 → regression 0

**Problem 🔴**
- chainResolver를 먼저 만들고 나중에 통합하려다 orphan code 기간 발생

**Try 🔵**
- 새 추상화는 consumer와 함께 도입 (orphan 방지)

## 🤝 Collaboration KPT

**Keep 🟢**
- 사용자의 "하나의 철학" 피드백 → Layer[] loop 도출. 코드가 훨씬 단순해짐.

## ⚙️ Workflow KPT

**Keep 🟢**
- /doubt가 resolveKeyboard 추가 −61줄 이끌어냄

## 액션

| # | 액션 | 카테고리 | 상태 |
|---|------|---------|------|
| 1 | K5 (Layer[] loop) → design-principles.md | 지식 | ✅ |
| 2 | Unresolved → Phase 2 backlog | 문서 | ✅ |
| 3 | PointerListener trigger click 버그 | OS 코드 | 🟡 별도 이슈 |

총 액션: 3건 / ✅ 2건 / 🟡 1건 (별도 이슈)
