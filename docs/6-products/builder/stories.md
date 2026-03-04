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

---

## v3 — 콘텐츠 운영 플랫폼

> builder-v3 기획. 개발 보류.

---

### US-005: 완성된 페이지를 배포한다

**Story**
콘텐츠 운영자로서, 편집을 마친 페이지를 배포하여 방문자에게 공개하고 싶다. 편집과 배포가 분리되어야 실수로 미완성 콘텐츠가 노출되지 않기 때문이다.

**UX Flow**
1. Draft 상태의 페이지에서 편집을 완료한다
2. 헤더 툴바의 [Publish] 버튼을 클릭한다
3. 확인 Dialog: "페이지를 배포하시겠습니까?"
4. [배포하기] 클릭 → 상태가 Published(초록)로 변경. Block Tree 스냅샷 저장

**Acceptance Criteria**
- [ ] AC1: Given 페이지가 Draft 상태이다 / When [Publish]를 클릭한다 / Then 확인 Dialog가 열린다
- [ ] AC2: Given 확인 Dialog가 열려있다 / When [배포하기]를 클릭한다 / Then 상태가 Published로 변경되고 스냅샷이 저장된다
- [ ] AC3: Given 페이지가 Published 상태이다 / When [Publish] 버튼을 확인한다 / Then 비활성화되어 있다

**Notes**
- spec: `spec/page-lifecycle.md`
- Zone: page-toolbar — toolbar role

---

### US-006: Published 페이지를 수정하면 자동으로 Draft 전환

**Story**
콘텐츠 운영자로서, 배포된 페이지를 수정하면 자동으로 Draft 상태로 전환되길 원한다. 수정 중인 내용이 즉시 라이브에 반영되면 안 되기 때문이다.

**UX Flow**
1. Published 상태의 페이지를 열고 있다
2. 아무 필드를 수정한다
3. 상태 배지가 자동으로 Draft(노랑)로 변경된다
4. 이전 Published 스냅샷은 보존된다

**Acceptance Criteria**
- [ ] AC1: Given Published 상태에서 필드를 수정했다 / When 상태 배지를 확인한다 / Then Draft(노랑)로 변경되어 있다
- [ ] AC2: Given Published→Draft 전환 후 / When 이전 스냅샷을 확인한다 / Then 수정 전 Published 스냅샷이 보존되어 있다

**Notes**
- 첫 수정에서만 전환. 이후 수정은 Draft 유지
- spec: `spec/page-lifecycle.md` L2

---

### US-007: 보관된 페이지를 복원한다

**Story**
콘텐츠 운영자로서, 보관(Archived)한 페이지를 다시 활성화하고 싶다. 이벤트 종료 후 보관했다가 재사용해야 하는 경우가 있기 때문이다.

**UX Flow**
1. 페이지 목록에서 Archived 필터 선택
2. 복원하려는 페이지의 [Restore] 클릭
3. 페이지가 Draft 상태로 복원되어 편집 가능

**Acceptance Criteria**
- [ ] AC1: Given Archived 페이지가 있다 / When [Restore]를 클릭한다 / Then 상태가 Draft로 변경된다
- [ ] AC2: Given 복원된 페이지이다 / When 편집을 시도한다 / Then 정상적으로 편집 가능하다

**Notes**
- Archived → Published 직접 전이는 금지. 반드시 Draft를 거침
- spec: `spec/page-lifecycle.md` L4

---

### US-008: 템플릿에서 새 페이지를 생성한다

**Story**
콘텐츠 운영자로서, 미리 정의된 템플릿을 선택하여 새 페이지를 빠르게 생성하고 싶다. 매번 빈 페이지에서 시작하면 생산성이 떨어지기 때문이다.

**UX Flow**
1. 페이지 목록에서 [+ 새 페이지] 클릭
2. 템플릿 선택 Dialog 열림 — 카드 형태의 갤러리
3. 카테고리 필터로 원하는 종류 좁히기
4. 템플릿 선택 → 페이지 이름 입력 → [생성하기]
5. 새 페이지가 Draft 상태로 생성, 에디터 진입

**Acceptance Criteria**
- [ ] AC1: Given 페이지 목록이다 / When [+ 새 페이지]를 클릭한다 / Then 템플릿 선택 Dialog가 열린다
- [ ] AC2: Given 템플릿을 선택하고 이름을 입력했다 / When [생성하기]를 클릭한다 / Then 새 페이지가 Draft로 생성되고 에디터가 열린다
- [ ] AC3: Given 이름을 입력하지 않았다 / When [생성하기]를 클릭한다 / Then 에러 메시지가 표시되고 페이지가 생성되지 않는다
- [ ] AC4: Given 키보드 사용자이다 / When Arrow 키로 카드를 탐색한다 / Then 카드 간 포커스가 이동한다

**Notes**
- presets/pages.ts 기존 프리셋을 PageTemplate 모델로 확장
- spec: `spec/page-template.md`

---

### US-009: 기존 페이지를 복제한다

**Story**
콘텐츠 운영자로서, 잘 만든 기존 페이지를 복제하여 비슷한 페이지를 빠르게 만들고 싶다. 유사한 구조의 페이지가 많을 때 효율적이기 때문이다.

**UX Flow**
1. 페이지 목록에서 원본 페이지의 [복제] 버튼 클릭
2. "원본 이름 (복사본)" 페이지가 즉시 생성 (Draft)
3. 모든 블록이 새 ID로 deep clone

**Acceptance Criteria**
- [ ] AC1: Given 페이지 목록에 "NCP 상품 소개"가 있다 / When [복제]를 클릭한다 / Then "NCP 상품 소개 (복사본)"이 Draft로 생성된다
- [ ] AC2: Given 복제 후 / When 복사본의 블록 ID를 확인한다 / Then 모든 ID가 원본과 다르다
- [ ] AC3: Given 복사본에서 필드를 수정했다 / When 원본을 확인한다 / Then 원본은 변경되지 않았다

**Notes**
- 기존 deepCloneBlock() 로직 재활용
- spec: `spec/page-template.md`

---

### US-010: 배포 전 변경사항을 확인한다

**Story**
콘텐츠 운영자로서, 배포 전에 무엇이 변경되었는지 시각적으로 확인하고 싶다. 의도하지 않은 변경이 배포되면 안 되기 때문이다.

**UX Flow**
1. Draft 상태에서 [변경사항 보기] 클릭
2. Side-by-side Diff 뷰 열림 (좌: Draft, 우: Published)
3. 추가(초록)/삭제(빨강)/수정(노랑) 블록이 색으로 구분
4. 사이드바 트리에서 변경 블록 클릭 → 해당 위치로 스크롤
5. 확인 후 [배포하기] 또는 Escape로 편집 모드 복귀

**Acceptance Criteria**
- [ ] AC1: Given Published 후 필드를 수정했다 / When [변경사항 보기]를 클릭한다 / Then 수정된 블록이 노랑으로 표시된다
- [ ] AC2: Given 새 블록을 추가했다 / When Diff 뷰를 확인한다 / Then 추가된 블록이 초록으로 표시된다
- [ ] AC3: Given 블록을 삭제했다 / When Diff 뷰를 확인한다 / Then 삭제된 블록이 빨강으로 표시된다

**Notes**
- Block 매칭은 id 기반
- spec: `spec/content-diff.md`

---

### US-011: 개별 변경을 선택적으로 되돌린다

**Story**
콘텐츠 운영자로서, 여러 변경 중 일부만 되돌리고 나머지는 유지하고 싶다. 전체 Undo보다 세밀한 제어가 필요할 때가 있기 때문이다.

**UX Flow**
1. Diff 뷰에서 수정된 블록을 확인한다
2. 되돌리고 싶은 블록의 [이 변경 되돌리기] 클릭
3. 해당 블록만 Published 값으로 복원, 나머지 변경 유지

**Acceptance Criteria**
- [ ] AC1: Given Diff 뷰에서 Hero Section이 modified이다 / When [이 변경 되돌리기]를 클릭한다 / Then Hero Section이 Published 값으로 복원된다
- [ ] AC2: Given Hero Section을 되돌렸다 / When 다른 modified 블록을 확인한다 / Then 다른 변경은 유지되어 있다

**Notes**
- 블록 단위 selective revert
- spec: `spec/content-diff.md` F6

---

### US-012: 과거 배포 버전을 확인하고 복원한다

**Story**
콘텐츠 운영자로서, 과거에 배포했던 페이지 상태를 타임라인으로 탐색하고, 필요하면 특정 버전으로 되돌리고 싶다. 실수로 잘못 배포했거나 이전 콘텐츠가 더 나았을 때 빠르게 복구해야 하기 때문이다.

**UX Flow**
1. 헤더의 [이력] 버튼 클릭 → 버전 타임라인 패널
2. 각 버전에 배포 시각, 메모, 변경 요약 표시
3. [미리보기]로 과거 상태 확인, [비교]로 현재와 diff
4. [이 버전으로 복원] → 확인 → Draft에 과거 블록 복원

**Acceptance Criteria**
- [ ] AC1: Given 3번 배포한 페이지이다 / When [이력]을 클릭한다 / Then v3, v2, v1 타임라인이 표시된다
- [ ] AC2: Given v1의 [미리보기]를 클릭했다 / When 캔버스를 확인한다 / Then v1 시점의 블록이 읽기 전용으로 표시된다
- [ ] AC3: Given v2의 [복원]을 클릭했다 / When 확인한다 / Then Draft 블록이 v2 블록으로 교체된다

**Notes**
- spec: `spec/version-history.md`
- Content Diff와 연동 (비교 기능)

---

### US-013: 배포할 때 변경 메모를 남긴다

**Story**
콘텐츠 운영자로서, 배포할 때 "왜 바꿨는지" 메모를 남기고 싶다. 나중에 이력을 볼 때 맥락을 알 수 있어야 하기 때문이다.

**Acceptance Criteria**
- [ ] AC1: Given Publish Dialog가 열려있다 / When 메모에 "가격표 수정"을 입력하고 배포한다 / Then 버전 이력에 "가격표 수정" 메모가 표시된다
- [ ] AC2: Given 메모를 입력하지 않고 배포했다 / When 이력을 확인한다 / Then 메모 없이 시각만 표시된다

**Notes**
- 메모는 선택 사항 (빈칸 허용)
- spec: `spec/version-history.md` M1~M3

---

### US-014: 자주 쓰는 블록 조합을 라이브러리에 저장한다

**Story**
콘텐츠 운영자로서, 잘 만든 블록 조합(예: 3열 가격표)을 저장해두고 다른 페이지에서 재사용하고 싶다. 매번 같은 구조를 처음부터 만드는 건 비효율적이기 때문이다.

**UX Flow**
1. 캔버스에서 블록 선택 → 우클릭 → [라이브러리에 저장]
2. 이름, 카테고리 입력 → 저장
3. 다른 페이지에서 사이드바 [라이브러리] 탭 → 카드 클릭 → 삽입

**Acceptance Criteria**
- [ ] AC1: Given 블록이 선택된 상태이다 / When 우클릭 → [라이브러리에 저장]을 선택한다 / Then 저장 Dialog가 열린다
- [ ] AC2: Given 라이브러리에 저장된 블록이 있다 / When 해당 카드를 클릭한다 / Then 현재 포커스 위치 뒤에 블록이 삽입된다
- [ ] AC3: Given 라이브러리에서 검색한다 / When "카드"를 입력한다 / Then 이름/설명에 "카드"가 포함된 블록만 표시된다

**Notes**
- Built-in (코드 정의) vs Custom (운영자 저장) 구분
- spec: `spec/block-library.md`

---

### US-015: 페이지 내 텍스트를 검색하고 일괄 치환한다

**Story**
콘텐츠 운영자로서, 페이지 내 특정 텍스트를 검색하여 위치를 확인하고, 필요하면 다른 텍스트로 일괄 치환하고 싶다. 브랜드명 변경이나 오타 수정 시 하나씩 찾아 고치는 건 불가능하기 때문이다.

**UX Flow**
1. Cmd+F → 검색 바 열림 → 검색어 입력
2. 매칭 결과 카운터 (3/12), Enter로 다음 매칭 이동
3. 치환어 입력 → [바꾸기] (하나씩) 또는 [모두 바꾸기]
4. Cmd+Shift+F → 전체 페이지 검색 (크로스 페이지)

**Acceptance Criteria**
- [ ] AC1: Given Cmd+F를 눌렀다 / When "네이버클라우드"를 입력한다 / Then 매칭 건수가 표시되고 첫 매칭이 하이라이트된다
- [ ] AC2: Given [모두 바꾸기]를 클릭했다 / When 확인한다 / Then 전체 매칭이 치환되고 Cmd+Z로 되돌릴 수 있다
- [ ] AC3: Given Cmd+Shift+F로 전체 검색했다 / When 다른 페이지의 결과를 클릭한다 / Then 해당 페이지가 열리고 매칭 블록으로 스크롤된다

**Notes**
- spec: `spec/content-search.md`

---

### US-016: 이미지를 중앙 라이브러리에서 관리한다

**Story**
콘텐츠 운영자로서, 이미지를 한 곳에서 업로드하고 관리하며, 필요한 페이지에서 꺼내 쓰고 싶다. URL을 직접 입력하는 건 불가능하고, 같은 이미지를 여러 페이지에서 재사용해야 하기 때문이다.

**UX Flow**
1. 이미지 필드 클릭 → 미디어 라이브러리 Dialog 열림
2. 기존 이미지 선택 or 새로 업로드
3. Alt 텍스트 입력 (접근성)
4. [선택하기] → 필드에 이미지 삽입

**Acceptance Criteria**
- [ ] AC1: Given 이미지 필드를 클릭했다 / When 미디어 라이브러리가 열린다 / Then 업로드된 이미지가 그리드로 표시된다
- [ ] AC2: Given 이미지를 선택하고 [선택하기]를 클릭했다 / When 캔버스를 확인한다 / Then 해당 이미지가 표시된다
- [ ] AC3: Given 새 이미지를 드래그앤드롭했다 / When 업로드가 완료된다 / Then 갤러리에 추가되고 자동 선택된다
- [ ] AC4: Given 3곳에서 사용 중인 이미지를 삭제하려 한다 / When [삭제]를 클릭한다 / Then "3곳에서 사용 중" 경고가 표시된다

**Notes**
- spec: `spec/media-library.md`

