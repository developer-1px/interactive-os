# ARIA Compliance Checklist

> **상태**: 🟢 진행중  
> **담당**: OS Focus System  
> **최종 감사일**: 2026-02-07

OS의 모든 ARIA 패턴 구현 상태를 추적하는 체크리스트.  
`roleRegistry.ts`와 동기화하여 관리한다.

---

## 1. Composite Widget Roles (Zone Presets)

핵심 — OS `ZoneRole`로 구현되어야 하는 ARIA 복합 위젯.

| 상태 | Role | Preset | 키보드 | aria-* 자동 | 테스트 |
|------|------|--------|--------|------------|--------|
| ✅ | `listbox` | ✅ | ✅ | 🔸 | ⬜ |
| ✅ | `menu` | ✅ | ✅ | 🔸 | ⬜ |
| ✅ | `menubar` | ✅ | ✅ | 🔸 | ⬜ |
| ✅ | `radiogroup` | ✅ | ✅ | 🔸 | ⬜ |
| ✅ | `tablist` | ✅ | ✅ | 🔸 | ⬜ |
| ✅ | `toolbar` | ✅ | ✅ | 🔸 | ⬜ |
| ✅ | `grid` | ✅ | ✅ | 🔸 | ⬜ |
| ✅ | `tree` | ✅ | ✅ | 🔸 | ⬜ |
| ✅ | `treegrid` | ✅ | ✅ | 🔸 | ⬜ |
| ✅ | `combobox` | ✅ | ✅ | 🔸 | ⬜ |

**범례**: ✅ 완료 / 🔸 부분 / ⬜ 미시작

---

## 2. Window Roles (Overlay Presets)

| 상태 | Role | Preset | 포커스 트랩 | 포커스 복원 | Escape | 테스트 |
|------|------|--------|-----------|-----------|--------|--------|
| ✅ | `dialog` | ✅ | ✅ | ✅ | ✅ | ⬜ |
| ✅ | `alertdialog` | ✅ | ✅ | ✅ | ✅ | ⬜ |

---

## 3. Content Pattern Roles (Custom Presets)

| 상태 | Role | Preset | 키보드 | 테스트 |
|------|------|--------|--------|--------|
| ✅ | `accordion` | ✅ | ✅ | ⬜ |
| ✅ | `disclosure` | ✅ | ✅ | ⬜ |
| ✅ | `feed` | ✅ | 🔸 | ⬜ |

---

## 4. aria-* 속성 자동 렌더링

OS가 렌더링 시 자동으로 설정해야 하는 aria-* 속성들.

### 필수 (Must Have)

| 상태 | 속성 | 적용 대상 | 설명 |
|------|------|----------|------|
| ✅ | `aria-selected` | Item in listbox/grid/tree/tab | 선택 상태 반영 |
| ✅ | `aria-orientation` | Zone (listbox/menu/toolbar 등) | 방향 반영 |
| ✅ | `aria-multiselectable` | Zone with select.mode="multiple" | 다중 선택 여부 |
| ✅ | `aria-activedescendant` | Zone with virtualFocus | 가상 포커스 대상 |
| 🔸 | `aria-expanded` | Item in tree/accordion | 확장/축소 상태 |
| 🔸 | `aria-checked` | Item in radiogroup/checkbox | 체크 상태 |
| ⬜ | `aria-modal` | Zone with dialog/alertdialog | 모달 여부 |
| ⬜ | `aria-disabled` | Item/Trigger disabled | 비활성 상태 |
| ⬜ | `aria-pressed` | Trigger toggle button | 토글 상태 |

### 자동 인덱싱

| 상태 | 속성 | 적용 대상 | 설명 |
|------|------|----------|------|
| ⬜ | `aria-posinset` | Item in listbox/tree/menu | 아이템 순서 |
| ⬜ | `aria-setsize` | Item in listbox/tree/menu | 전체 개수 |
| ⬜ | `aria-level` | Item in tree | 트리 깊이 |
| ⬜ | `aria-colindex` | gridcell | 열 인덱스 |
| ⬜ | `aria-rowindex` | gridcell | 행 인덱스 |
| ⬜ | `aria-colcount` | grid | 전체 열 수 |
| ⬜ | `aria-rowcount` | grid | 전체 행 수 |

### 관계 속성

| 상태 | 속성 | 적용 대상 | 설명 |
|------|------|----------|------|
| ⬜ | `aria-controls` | tab → tabpanel | 탭이 제어하는 패널 |
| ⬜ | `aria-labelledby` | tabpanel → tab | 패널의 라벨 탭 |
| ⬜ | `aria-haspopup` | Trigger for menu | 팝업 존재 표시 |
| ⬜ | `aria-keyshortcuts` | Trigger with keybinding | 단축키 안내 |

---

## 5. APG 키보드 패턴 적합성

각 패턴별 APG 키보드 스펙과의 적합성 검증.

### Listbox
- [x] ↑↓ 포커스 이동
- [x] 포커스 = 선택 (followFocus)
- [x] Home/End 첫/끝 이동
- [x] Typeahead 문자 검색
- [ ] 다중 선택: Shift+↑↓ 범위 선택
- [ ] 다중 선택: Ctrl+Space 토글 선택

### Menu
- [x] ↑↓ 포커스 이동 (loop)
- [x] Enter/Space 즉시 활성화
- [x] Escape 닫기
- [ ] 서브메뉴: → 열기, ← 닫기
- [ ] Typeahead 문자 검색

### Menubar
- [x] ←→ 포커스 이동 (loop)
- [x] Enter/Space 활성화
- [ ] ↓ 서브메뉴 열기
- [ ] Escape 서브메뉴 닫기

### Radiogroup
- [x] ↑↓ 포커스 이동 (loop, 방향키 = 선택)
- [x] 비어있을 수 없음 (disallowEmpty)
- [x] Tab 진입 시 선택된 항목으로

### Tablist
- [x] ←→ 포커스 이동 (loop)
- [x] 자동 활성화 (followFocus)
- [x] Tab 진입 시 선택된 탭으로
- [ ] Delete 탭 삭제 (선택적)

### Toolbar
- [x] ←→ 포커스 이동
- [x] Tab 재진입 시 마지막 포커스 복원
- [x] Loop 지원

### Grid
- [x] ↑↓←→ 2D 이동
- [ ] Ctrl+Home/End 첫/끝 셀
- [ ] Shift+Arrow 범위 선택
- [ ] Ctrl+Space 열 선택

### Tree
- [x] ↑↓ 포커스 이동
- [ ] → 노드 확장 / 자식으로 이동
- [ ] ← 노드 축소 / 부모로 이동
- [x] Enter/Space 선택 (명시적)
- [x] Typeahead 문자 검색

### Dialog
- [x] 포커스 트랩 (Tab 순환)
- [x] 닫을 때 포커스 복원
- [x] Escape 닫기
- [x] autoFocus 첫 요소

### Combobox
- [ ] ↓ 리스트 열기
- [x] ↑↓ 리스트 내 이동
- [ ] Enter 선택 후 닫기
- [x] Escape 닫기
- [ ] 입력 시 필터링

---

## 6. 미구현 APG 패턴 (향후)

| 우선순위 | 패턴 | 비고 |
|---------|------|------|
| 🔴 높음 | Tooltip | hover/focus 시 표시, aria-describedby 연결 |
| 🟡 중간 | Slider | range 위젯, ←→ 값 변경 |
| 🟡 중간 | Spinbutton | ↑↓ 값 증감 |
| 🟡 중간 | Carousel | 이전/다음 슬라이드 |
| 🟢 낮음 | Breadcrumb | HTML `<nav>` + aria-current |
| 🟢 낮음 | Meter | HTML `<meter>` |

---

## 변경 로그

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-07 | 초기 작성. 전체 role preset 17개 등록 완료. listbox followFocus 버그 수정. menu select→none 수정. |
