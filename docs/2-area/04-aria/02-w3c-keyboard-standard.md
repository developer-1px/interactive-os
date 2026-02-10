# W3C 키보드 인터랙션 표준 — 우리의 절대 원칙

> **작성일**: 2026-02-08
> **상태**: ⚡ 핵심 원칙 (Area — 항상 참조)

---

## 1. 핵심 발견

우리가 앱에서 사용하는 키보드 인터랙션 패턴들 — **포커스 이동, 트리 탐색, Shift+클릭 범위 선택, 방향키 내비게이션** 등 — 은 각 앱이 "디팩터 표준(de facto)" 또는 "머슬 메모리"로 만들어낸 것이 **아니다**.

> [!IMPORTANT]
> **W3C WAI-ARIA APG(Authoring Practices Guide)가 이 모든 키보드 인터랙션 패턴을 공식 표준으로 정의하고 있다.**

이것은 단순한 "권장 사항"이 아니라, 접근성과 사용성의 근간이 되는 **명시적 스펙**이다.

---

## 2. 절대 원칙

> [!CAUTION]
> **우리는 W3C APG 키보드 인터랙션 패턴을 무조건 따른다. 예외 없음.**

### 왜?

| 이유 | 설명 |
|:--|:--|
| **표준 존재** | 우리가 "감"으로 만드는 것이 아니라, 이미 정의된 스펙이 있다 |
| **일관성 보장** | 모든 ARIA 패턴이 동일한 키보드 규칙을 따르면 사용자 학습 비용 제로 |
| **접근성 준수** | 스크린리더, 보조 기술 사용자에게 예측 가능한 경험 제공 |
| **테스트 근거** | TestBot의 테스트 케이스가 APG 스펙에서 직접 도출됨 |

---

## 3. APG가 정의하는 주요 키보드 패턴

### 3.1 공통 내비게이션 원칙

| 키 | 동작 | 적용 패턴 |
|:--|:--|:--|
| `↑` `↓` | Vertical 리스트 내 이동 | Listbox, Menu, Tree, Radiogroup |
| `←` `→` | Horizontal 리스트 내 이동 | Tablist, Menubar, Toolbar |
| `Home` / `End` | 첫/마지막 항목으로 이동 | 모든 Composite Widget |
| `Enter` / `Space` | 항목 활성화/선택 | Button, MenuItem, TreeItem |
| `Escape` | 해제/닫기/부모로 복귀 | Menu, Dialog, Combobox |
| `Tab` | Zone 진입/탈출 | 모든 Composite Widget |

### 3.2 선택(Selection) 패턴

| 키 | 동작 | 적용 패턴 |
|:--|:--|:--|
| `Space` | 단일 토글 선택 | Listbox (multi), Checkbox |
| `Shift + ↑/↓` | 범위 확장 선택 | Listbox (multi), Grid |
| `Shift + Click` | 앵커~클릭 범위 선택 | Listbox (multi), Grid |
| `Ctrl + Click` | 비연속 토글 선택 | Listbox (multi), Grid |
| `Ctrl + A` | 전체 선택 | Listbox (multi), Grid |
| `Ctrl + Shift + Home/End` | 현재~처음/끝 범위 선택 | Listbox (multi) |

### 3.3 트리(Tree) 전용 패턴

| 키 | 동작 |
|:--|:--|
| `→` | 닫힌 노드 → 열기 / 열린 노드 → 첫 자식으로 이동 |
| `←` | 열린 노드 → 닫기 / 닫힌 노드 → 부모로 이동 |
| `*` (Asterisk) | 같은 레벨의 모든 노드 확장 |

### 3.4 Grid 전용 패턴

| 키 | 동작 |
|:--|:--|
| `↑` `↓` `←` `→` | 셀 단위 2D 이동 |
| `Ctrl + Home/End` | 그리드 첫/마지막 셀 |
| `PageUp/Down` | 대량 이동 |

---

## 4. 참조 링크

| 문서 | URL |
|:--|:--|
| **APG Keyboard Patterns** | https://www.w3.org/WAI/ARIA/apg/patterns/ |
| **APG Practices — Keyboard** | https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/ |
| **APG Practices — Focus Management** | https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#focusmanagement |
| **APG Practices — Grid Navigation** | https://www.w3.org/WAI/ARIA/apg/patterns/grid/ |
| **APG Practices — Tree View** | https://www.w3.org/WAI/ARIA/apg/patterns/treeview/ |

---

## 5. 우리 프로젝트에서의 적용

- **`roleRegistry.ts`**: 각 ARIA Role preset이 APG 키보드 패턴을 그대로 구현
- **`classifyKeyboard.ts`**: 키 입력 → FocusIntent 변환이 APG 규칙 기반
- **TestBot 테스트**: 모든 ARIA 패턴 테스트가 APG 스펙에서 직접 도출
- **새 패턴 추가 시**: 반드시 APG 해당 패턴 페이지를 먼저 읽고 구현

> [!TIP]
> 새로운 키보드 인터랙션을 구현할 때, "다른 앱은 어떻게 하지?"가 아니라 **"APG 스펙에 뭐라고 되어 있지?"**를 먼저 확인하라.
