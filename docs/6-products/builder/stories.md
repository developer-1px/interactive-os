# Visual CMS — User Stories

> Living document. `/stories` 워크플로우가 관리한다.

---

### US-001: 언어를 전환하여 해당 언어의 콘텐츠 보기

**Story**
콘텐츠 운영자로서, 현재 편집 중인 페이지의 언어를 전환하여 다른 언어의 콘텐츠를 보고 싶다. 언어별로 페이지를 복제하지 않고 한 화면에서 다국어를 관리해야 하기 때문이다.

**UX Flow**
1. 페이지 상단 툴바에 현재 locale 표시 버튼 `[🌐 KO ▾]`이 보인다
2. `[🌐 KO ▾]` 클릭 → 등록된 언어 목록 드롭다운이 열린다 (`KO ✓`, `EN`, `JA`)
3. `EN` 클릭 → 드롭다운 닫힘. 버튼이 `[🌐 EN ▾]`로 변경
4. 페이지의 모든 텍스트 필드가 EN 콘텐츠로 전환. 콘텐츠 없으면 placeholder 표시

**Acceptance Criteria**
- [ ] AC1: Given 페이지에 ko, en 콘텐츠가 있다 / When `[🌐 KO ▾]` 버튼을 클릭한다 / Then 언어 목록 드롭다운이 열리고 현재 locale에 ✓ 표시
- [ ] AC2: Given 드롭다운이 열려있다 / When `EN`을 클릭한다 / Then 드롭다운 닫히고, 버튼이 `[🌐 EN ▾]`로 변경되고, 필드에 en 콘텐츠 표시
- [ ] AC3: Given en locale인데 필드에 en 콘텐츠가 없다 / When 화면을 본다 / Then 해당 필드에 "번역을 입력하세요" placeholder 표시

**Notes**
- 언어 전환은 **페이지 전역**. 필드별 독립 전환 아님
- 데이터: `Record<locale, string>`. 기존 string은 defaultLocale 값으로 자동 매핑 (하위 호환)
- Zone: locale-switcher (toolbar) — listbox role

**Decision Table** (Zone: locale-switcher)

| # | Zone | When | Intent | Condition | Command | Effect | Then |
|---|------|------|--------|-----------|---------|--------|------|
| 1 | locale-switcher | Click [🌐 KO ▾] | openDropdown | — | OPEN_LOCALE_DROPDOWN | dropdown 열림 | 드롭다운 표시, 현재 locale에 ✓ |
| 2 | locale-switcher | Click EN | selectLocale | locale ≠ currentLocale | SET_LOCALE(en) | currentLocale=en, dropdown 닫힘 | 필드 en 콘텐츠로 전환 |
| 3 | locale-switcher | Click KO (현재) | selectLocale | locale = currentLocale | CLOSE_DROPDOWN | dropdown 닫힘 | 변경 없음 |
| 4 | locale-switcher | Press Escape | closeDropdown | — | CLOSE_DROPDOWN | dropdown 닫힘 | 포커스 버튼으로 복귀 |
| 5 | locale-switcher | Press ArrowDown | navigate | 다음 옵션 있음 | FOCUS_NEXT | 포커스 이동 | 다음 언어 옵션에 포커스 |
| 6 | locale-switcher | Press ArrowUp | navigate | 이전 옵션 있음 | FOCUS_PREV | 포커스 이동 | 이전 언어 옵션에 포커스 |
| 7 | locale-switcher (옵션 포커스) | Press Enter | selectLocale | — | SET_LOCALE(focused) | currentLocale 변경 | 해당 언어로 전환 |

---

### US-002: 새 언어를 추가하여 번역 시작하기

**Story**
콘텐츠 운영자로서, 페이지에 새로운 언어를 추가하고 바로 해당 언어로 편집을 시작하고 싶다. 새 시장에 진출할 때 빠르게 다국어 콘텐츠를 만들어야 하기 때문이다.

**UX Flow**
1. `[🌐 KO ▾]` 클릭 → 드롭다운 하단에 `[+ 언어 추가]` 버튼 보임
2. `[+ 언어 추가]` 클릭 → 언어 선택 리스트 표시 (English, 日本語, 中文, ...)
3. `日本語` 클릭 → locale 목록에 JA 추가 + 자동으로 JA locale로 전환
4. 모든 텍스트 필드가 빈 상태(placeholder)로 표시 → 바로 편집 가능

**Acceptance Criteria**
- [ ] AC1: Given 드롭다운이 열려있다 / When `[+ 언어 추가]`를 클릭한다 / Then 추가 가능한 언어 목록이 표시된다
- [ ] AC2: Given 언어 목록이 표시되었다 / When `日本語`를 클릭한다 / Then JA가 locale 목록에 추가되고, locale이 JA로 전환되고, 필드가 빈 placeholder로 표시된다
- [ ] AC3: Given JA를 추가한 직후다 / When `[🌐 JA ▾]`를 클릭한다 / Then 드롭다운에 `KO`, `EN`, `JA ✓` 3개 언어가 보인다

**Notes**
- 이미 추가된 언어는 목록에서 비활성 처리
- Zone: language-picker — listbox role

---

### US-003: 언어별로 독립 편집하여 저장하기

**Story**
콘텐츠 운영자로서, 특정 언어의 텍스트를 수정해도 다른 언어에 영향이 없길 원한다. 실수로 다른 언어를 덮어쓰면 안 되기 때문이다.

**UX Flow**
1. `[🌐 EN ▾]` 상태에서 "Hero Title" 필드를 클릭하여 편집 시작
2. 텍스트를 "Welcome"에서 "Welcome Home"으로 수정
3. `[🌐 KO ▾]`로 전환 → "Hero Title" 필드에 "환영합니다" (원래 ko 값) 그대로 표시
4. 저장 버튼 클릭 → ko="환영합니다", en="Welcome Home" 모두 저장

**Acceptance Criteria**
- [ ] AC1: Given EN locale에서 필드에 포커스가 있다 / When 텍스트를 "Welcome Home"으로 수정한다 / Then en 콘텐츠만 변경되고 ko 콘텐츠는 "환영합니다" 유지
- [ ] AC2: Given en="Welcome Home", ko="환영합니다"로 편집되었다 / When 저장 버튼을 클릭한다 / Then 모든 언어 콘텐츠가 함께 저장된다

**Notes**
- 필드 편집은 OS Field 파이프라인 사용 (OS_FIELD_COMMIT)
- 저장은 기존 builder 저장 메커니즘에 locale 데이터 포함

---

### US-004: 사이드바에서 섹션을 드래그하여 순서 변경하기

**Story**
콘텐츠 편집자로서, 왼쪽 사이드바에서 섹션을 드래그하여 페이지 내 순서를 변경하고 싶다. 키보드나 메뉴 없이 직관적으로 레이아웃을 조정할 수 있어야 하기 때문이다.

**UX Flow**
1. 사이드바 왼쪽에 섹션 목록이 있다 (Hero, 서비스 특징, 푸터 등)
2. 섹션 아이템을 마우스로 드래그 시작 → 아이템이 반투명해지고 드래그 핸들 표시
3. 다른 섹션 위로 드래그 오버 → 드롭 위치 표시 (위/아래 구분선)
4. 드롭 → 섹션이 새 위치로 이동. 캔버스도 동시에 반영

**Acceptance Criteria**
- [ ] AC1: Given 사이드바에 섹션 목록이 있다 / When "서비스 특징" 아이템을 "Hero" 위로 드래그하여 드롭한다 / Then 사이드바와 캔버스 모두에서 "서비스 특징"이 "Hero" 앞으로 이동한다
- [ ] AC2: Given 드래그 중이다 / When 드롭 가능한 위치 위에 있다 / Then 드롭 위치(before/after)를 나타내는 구분선이 표시된다
- [ ] AC3: Given 섹션 순서가 바뀌었다 / When Cmd+Z를 누른다 / Then 이전 순서로 복원된다

**Decision Table** (Zone: sidebar)

| # | Zone | When | Intent | Condition | Command | Effect | Then |
|---|------|------|--------|-----------|---------|--------|------|
| 1 | sidebar | 드래그 시작 | startDrag | — | OS_DRAG_START | isDragging=true, dragItemId 설정 | 아이템 반투명 |
| 2 | sidebar | 드래그 오버 | dragOver | position=before | — (시각적) | dropIndicator 위 | 타겟 위 구분선 |
| 3 | sidebar | 드래그 오버 | dragOver | position=after | — (시각적) | dropIndicator 아래 | 타겟 아래 구분선 |
| 4 | sidebar | 드롭 onReorder | reorder | position=before | REORDER_BLOCK(from,to,before) | blocks 재정렬 | 순서 변경 반영 |
| 5 | sidebar | 드롭 onReorder | reorder | position=after | REORDER_BLOCK(from,to,after) | blocks 재정렬 | 순서 변경 반영 |
| 6 | sidebar | Escape (드래그 중) | cancelDrag | isDragging=true | OS_DRAG_CANCEL | isDragging=false | 원래 위치 복귀 |

**Notes**
- Zone API: `sidebarCollection.bind({ onReorder: reorderCommand })`
- REORDER_BLOCK은 history 포함 → Cmd+Z undo 가능 (AC3)
- OS DragState 구독: `isDragging`, `dragItemId`

