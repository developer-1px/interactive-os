# Keyboard Responder Chain — ZIFT 계층 순회 키바인딩 설계

## Journey

**🧑 사용자**: Panel textarea에서 Enter를 누르면 title이 사라진다. Inspector에서 OS_FIELD_COMMIT이 발동한다.

**🤖 AI**: `capture: true`인 KeyboardListener가 Panel의 plain textarea를 OS Field로 오인. `when: "editing"` 바인딩이 `isFieldActive`를 무시하고 Enter → OS_FIELD_COMMIT 발동.

---

**🧑 사용자**: 이건 설계미스. Field에서의 Enter와 Escape는 해당 필드에서만 쓰여야 하는 키인데 키바인딩이 되면 안 되지 않아? 키바인딩은 Zone에서 쓰이는 단축키 개념인데.

**🤖 AI**: `when: "editing"` 자체가 관할 침범. Keybinding은 Zone 단축키인데 Field 내부 키를 등록. Field의 Enter/Escape는 Field 컴포넌트가 자체 처리해야 함.

---

**🧑 사용자**: 크게 정리해봐. 설계미스가 뭐야?

**🤖 AI**: MECE 분석 — 8개 설계미스 식별. M1(when:"editing" 존재) ~ M8(isEditingElement 범위). 의존 관계: M1이 root cause.

---

**🧑 사용자**: Keybinding의 when:"editing"은 편집모드에서 단축키 억제(Cmd+C native 등)에 필요했어. 원점에서 키바인딩 구조 자체가 잘못된 거 아닌가? Item Zone Field 모두 고려해야 하지 않아?

**🤖 AI**: 현재 flat `when: "navigating"|"editing"` 모델이 ZIFT 4계층을 반영 못함. macOS Responder Chain처럼 Field → Item → Zone → OS 순서가 필요.

---

**🧑 사용자**: DOM 버블링 vs 내부 컨트롤?

**🤖 AI**: 두 선택지 비교. 관찰 가능성(Inspector)과 Passive Projection 원칙상 **내부 컨트롤**(단일 capture + ZIFT 상태 트리 순회)이 맞음.

---

**🧑 사용자**: Zone에서 계층 구조를 headless하게 가지고 있으니 전파 구조도 자연스럽게 만들 수 있겠네?

**🤖 AI**: 맞다. OS가 이미 `editingItemId`, `focusedItemId`, `activeZoneId`를 알고 있고, FieldRegistry/ZoneRegistry가 계층별 mount 정보를 관리 중. resolveKeyboard만 ZIFT 순회하게 바꾸면 됨.

---

**🧑 사용자**: Field의 Enter/Escape를 기본 제공하려니 OS 바인딩에 둔 거지?

**🤖 AI**: 의도는 올바름(OS가 기본 행동 보장). 메커니즘이 잘못됨(전역 레지스트리 vs Field 레이어 기본값). 각 계층에 layer defaults가 있어야 함.

---

**🧑 사용자**: 그러면 KeyboardListener가 Item과 Field 자체적으로 처리할 수 있도록 안 되어 있었던 거네?

**🤖 AI**: 맞다. resolveKeyboard가 전역 Keybindings 하나만 조회. Item/Field 레이어 진입점 자체가 없음.

---

**🧑 사용자**: 트리에서 좌우 키보드 이슈도 같은 맥락이네? → 같은 근본 원인의 다른 증상 4개 식별.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | `resolveKeyboard`에 **ZIFT 계층 순회**(Field → Item → Zone → OS)를 추가해야 한다. 각 계층은 자기 keybindings를 기존 레지스트리에 **선언**하고, resolve가 순서대로 탐색. 현재의 flat `when: "editing"` 모델과 보상 장치들(`isFieldActive`, `fieldKeyOwnership`, resolveCheck 하드코딩)은 이 순회 부재의 우회책. |
| **📊 Data** | 1) KeyboardListener가 `capture: true`로 모든 키를 가로챔. 2) resolveKeyboard가 flat Keybindings 하나만 조회. 3) `when: "editing"` 바인딩이 Field 관할 키를 OS 전역에 등록. 4) OS_FIELD_COMMIT이 "어떤 Field?" 모르고 FieldRegistry 전체 스캔. 5) 트리 expand/collapse가 OS_NAVIGATE 안에 예외 처리. 6) checkbox Space가 resolveKeyboard에 하드코딩. |
| **🔗 Warrant** | ZIFT 각 계층(Zone/Item/Field)은 자기 관할 키를 소유. OS는 이미 전체 계층 상태(activeZoneId, focusedItemId, editingItemId)를 headless로 알고 있다. resolve 시 이 상태를 순회하면 각 레이어의 defaults가 자연스럽게 자기 자리를 찾는다. |
| **📚 Backing** | macOS Responder Chain (FirstResponder → Window → Application). W3C APG (각 위젯이 자기 키보드 인터랙션 정의). ZIFT Jurisdiction Boundary (Passive Projection Mandate). |
| **⚖️ Qualifier** | **Heavy / Complicated** — OS 키보드 아키텍처 변경. 수정 방향은 Clear하지만 범위가 큼 |
| **⚡ Rebuttal** | 기존 앱(todo, docs-viewer, builder) 키보드가 깨질 위험. 점진적 전환 필요. |
| **❓ Open Gap** | 1) `fieldKeyOwnership.ts`의 delegation 테이블을 Field-layer keybindings로 전환하는 구체적 API. 2) Item 레이어 keybindings 등록 메커니즘 (role preset 확장?). 3) 점진적 마이그레이션 전략 (기존 앱 깨지지 않으면서). |
