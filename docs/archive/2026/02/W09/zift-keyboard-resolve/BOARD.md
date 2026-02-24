# zift-keyboard-resolve

## Context

Claim: `resolveKeyboard`에 ZIFT 계층 순회(Field → Item → Zone → OS)를 추가하여, 각 계층이 자기 관할 키를 자기 레이어에서 처리하게 한다.

Before → After:

```
Before:  KeyboardListener → flat Keybindings(when: navigating|editing) → dispatch
         • Field Enter/Escape가 전역에 등록 → 관할 침범
         • isFieldActive, fieldKeyOwnership 등 보상 장치 난립
         • 트리 expand/collapse가 navigate 안에 예외 처리
         • checkbox Space가 resolveKeyboard에 하드코딩

After:   KeyboardListener → resolveField → resolveItem → resolveZone → resolveGlobal
         • 각 계층이 자기 keybindings를 기존 레지스트리에 선언
         • resolve가 ZIFT 상태 트리(editingItemId → focusedItemId → activeZoneId) 순회
         • when:"editing", fieldKeyOwnership, resolveCheck 하드코딩 불필요
```

Backing: macOS Responder Chain, W3C APG widget keyboard patterns, ZIFT Jurisdiction Boundary.

Risks:
- 기존 앱(todo, docs-viewer, builder) 키보드 regression
- 점진적 마이그레이션 필요 — big-bang 전환은 위험

## 🔴 Now

- [x] T1: Field-layer keybindings — `resolveFieldKey()` +16 tests ✅
  - [x] Phase 1: 숙지 — OS 관점 설계 메모 완료
  - [x] Phase 2: /divide + /blueprint + /naming + /tdd (.feature) 완료
  - [x] Phase 3: Red→Green — resolveFieldKey.ts + 16 tests green
- [x] T2: Item-layer keybindings — `resolveItemKey()` +12 tests ✅
  - treeitem: ArrowR→expand, ArrowL→collapse
  - checkbox/switch: Space→CHECK
- [x] T3: resolveKeyboard ZIFT 순회 — Field→Item→Zone→Global — 785 tests green ✅
  - resolveCheck 하드코딩 제거 (Item layer로 흡수)
  - senseKeyboard에 editingFieldId, focusedItemExpanded 추가
- [x] T4: osDefaults 정리 — when:"editing" Enter/Escape 제거 — tsc 0 | 785 tests ✅
- [x] T5: fieldKeyOwnership 정리 — delegation→zone pass-through 재명칭 + 문서화 ✅
- [x] T6: 회귀 테스트 — 95 files / 1038 tests green | tsc 0 ✅

## ⏳ Done

- [x] T1: Field-layer keybindings — `resolveFieldKey()` +16 tests ✅
- [x] T2: Item-layer keybindings — `resolveItemKey()` +12 tests ✅
- [x] T3: resolveKeyboard ZIFT 순회 — Field→Item→Zone→Global ✅
- [x] T4: osDefaults 정리 — when:"editing" Enter/Escape 제거 ✅
- [x] T5: fieldKeyOwnership 정리 ✅
- [x] T6: 회귀 테스트 — 95 files / 1038 tests | tsc 0 ✅

## Unresolved

- Field-layer keybindings의 구체적 API (FieldRegistry.register 확장 vs 별도 키맵)
- Item-layer keybindings 등록 메커니즘 (rolePresets 확장 vs 별도 레지스트리)
- 점진적 마이그레이션 전략 (기존 when:"editing"을 언제 제거?)

## Ideas

- Keybinding Inspector 확장 — "scope: field/item/zone/global" 표시
- 앱별 커스텀 키바인딩 (Zone.bind에서 키맵 오버라이드)
