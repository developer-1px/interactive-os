# W3C WAI-ARIA 참조 가이드

> 우리 프로젝트가 따르는 W3C 표준 문서들의 요약과 링크 모음.
> 새로운 패턴을 구현하기 전에 **반드시 이 문서의 해당 링크를 먼저 읽는다.**

---

## 1. 핵심 스펙 문서

### WAI-ARIA 1.2 Specification
- **URL**: https://www.w3.org/TR/wai-aria-1.2/
- **용도**: Roles, States, Properties의 **공식 정의**
- **우리가 가져오는 것**:
  - Role 분류 체계 (Widget / Composite / Structure / Landmark / Live Region / Window)
  - Role 상속 구조 (Abstract → Concrete)
  - 각 Role이 허용하는 aria-* 속성 목록
  - 필수 속성 vs 선택 속성

### WAI-ARIA 1.2 Class Diagram
- **URL**: https://www.w3.org/WAI/ARIA/1.2/class-diagram/
- **용도**: Role 상속 구조 **시각화**
- **우리가 가져오는 것**:
  - `composite` → `grid`, `listbox`, `menu`, `tablist`, `tree` 등의 계층 관계
  - 새 Role 추가 시 어떤 Abstract Role을 상속하는지 확인

---

## 2. APG (ARIA Authoring Practices Guide)

### 2.1 Patterns — 패턴별 구현 가이드

- **URL**: https://www.w3.org/WAI/ARIA/apg/patterns/
- **용도**: 각 ARIA 패턴의 **키보드 인터랙션, 포커스 관리, aria 속성** 구현 방법
- **우리가 가져오는 것**: `roleRegistry.ts` preset의 근거

#### 우리 OS가 구현하는 패턴 (직접 링크)

| 패턴 | APG 링크 | 핵심 가져오기 |
|:--|:--|:--|
| **Accordion** | [apg/patterns/accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) | 헤더 ↑↓ 이동, Enter/Space 토글, Home/End |
| **Alert Dialog** | [apg/patterns/alertdialog](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/) | 포커스 트랩, 초기 포커스 위치, Escape 닫기 |
| **Combobox** | [apg/patterns/combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) | `aria-activedescendant`, ↓ 열기, Escape 닫기, 자동완성 |
| **Dialog** | [apg/patterns/dialog-modal](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) | 포커스 트랩, Tab 순환, Escape 닫기, aria-modal |
| **Disclosure** | [apg/patterns/disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) | Enter/Space 토글, aria-expanded |
| **Feed** | [apg/patterns/feed](https://www.w3.org/WAI/ARIA/apg/patterns/feed/) | Page Up/Down 스크롤, aria-busy |
| **Grid** | [apg/patterns/grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) | 2D ↑↓←→ 이동, Ctrl/Shift 선택, Home/End |
| **Listbox** | [apg/patterns/listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) | ↑↓ 이동, Shift 범위 선택, type-ahead, 다중 선택 |
| **Menu / Menubar** | [apg/patterns/menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) | ↑↓ (menu), ←→ (menubar), 서브메뉴 열기/닫기 |
| **Radio Group** | [apg/patterns/radio](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) | ↑↓←→ 이동=선택, loop, 그룹 단위 Tab |
| **Tabs** | [apg/patterns/tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) | ←→ 이동, 자동/수동 활성화, aria-selected |
| **Toolbar** | [apg/patterns/toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) | ←→ 이동, Tab 진입/탈출, roving tabindex |
| **Tree View** | [apg/patterns/treeview](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) | ↑↓ 이동, ←→ 확장/축소, * 전체 확장, 다중 선택 |
| **Treegrid** | [apg/patterns/treegrid](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/) | Tree + Grid 2D 복합 내비게이션 |

#### 향후 도입 검토 패턴

| 패턴 | APG 링크 | 비고 |
|:--|:--|:--|
| **Carousel** | [apg/patterns/carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) | 슬라이드 이전/다음 |
| **Slider** | [apg/patterns/slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) | ←→ 값 변경, range 위젯 |
| **Spinbutton** | [apg/patterns/spinbutton](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/) | ↑↓ 값 증감 |
| **Tooltip** | [apg/patterns/tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) | hover/focus 시 표시, Escape 닫기 |

---

### 2.2 Practices — 설계 원칙

- **URL**: https://www.w3.org/WAI/ARIA/apg/practices/
- **용도**: 패턴 횡단적 **설계 원칙과 기법**

| Practice | 링크 | 우리가 가져오는 것 |
|:--|:--|:--|
| **Keyboard Interface** | [practices/keyboard-interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) | Roving Tabindex vs aria-activedescendant 선택 기준, 포커스 이동 원칙 |
| **Focus Management** | [practices/keyboard-interface/#focusmanagement](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusmanagement) | 초기 포커스, 포커스 복원, 포커스 트랩 |
| **Grid Navigation** | [practices/keyboard-interface/#kbd_general_within](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_general_within) | Composite 내부 방향키 이동 모델 |
| **Accessible Names** | [practices/names-and-descriptions](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/) | aria-label, aria-labelledby 사용 원칙 |
| **Structural Roles** | [practices/structural-roles](https://www.w3.org/WAI/ARIA/apg/practices/structural-roles/) | Landmark, 문서 구조 role 사용 원칙 |
| **Range Widgets** | [practices/range-related-properties](https://www.w3.org/WAI/ARIA/apg/practices/range-related-properties/) | aria-valuemin/max/now/text |

---

### 2.3 Landmark Regions

- **URL**: https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/
- **용도**: 페이지 구조 랜드마크
- **우리가 가져오는 것**: HTML5 시멘틱 태그 사용 원칙 (우리 OS 범위 밖이지만 앱 개발 시 참조)

---

## 3. 관련 W3C 스펙

| 문서 | URL | 용도 |
|:--|:--|:--|
| **ARIA in HTML** | https://www.w3.org/TR/html-aria/ | HTML 요소의 암묵적 ARIA role 매핑 |
| **Using ARIA** | https://www.w3.org/TR/using-aria/ | ARIA 사용 5대 규칙 |
| **WCAG 2.2** | https://www.w3.org/TR/WCAG22/ | 웹 접근성 가이드라인 (상위 프레임워크) |
| **HTML Living Standard** | https://html.spec.whatwg.org/ | 시멘틱 HTML 참조 |

---

## 4. 빠른 접근 체크리스트

새로운 Zone Role 또는 키보드 패턴을 구현할 때:

1. ☐ APG 해당 패턴 페이지 읽기 → [patterns/](https://www.w3.org/WAI/ARIA/apg/patterns/)
2. ☐ 키보드 인터랙션 테이블 확인 → 패턴 페이지의 "Keyboard Interaction" 섹션
3. ☐ 필수 aria-* 속성 확인 → 패턴 페이지의 "WAI-ARIA Roles, States, and Properties" 섹션
4. ☐ 예제 코드 참조 → 패턴 페이지의 "Examples" 섹션
5. ☐ `roleRegistry.ts` preset에 반영
6. ☐ TestBot 테스트 케이스 APG 기반으로 작성
