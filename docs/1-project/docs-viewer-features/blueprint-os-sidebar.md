# Blueprint: OS-based Sidebar Tree Navigation

## 1. Goal

**UDE**: DocsSidebar는 `onClick`, `useState(isOpen)`, 수동 키보드 처리 등 React 직접 구현으로 트리를 관리. 키보드 네비게이션(ArrowUp/Down/Left/Right)이 불가능. OS가 설치되었지만 sidebar는 OS를 사용하지 않음.

**Done Criteria**: DocsSidebar에서 React 직접 이벤트 핸들러 없이 OS `FocusGroup(role="tree")` + `FocusItem` + `Trigger`로 완전한 WAI-ARIA Tree View 패턴 동작.
- ArrowUp/Down: 항목 간 이동
- ArrowRight: 폴더 열기 (닫혀 있을 때) / 자식 진입 (열려 있을 때)
- ArrowLeft: 폴더 닫기 (열려 있을 때) / 부모로 이동 (자식일 때)
- Enter: 파일 선택 → 문서 로드
- 포커스 상태 시각적 표시

## 2. Why

- OS portability 증명 2단계: "OS를 설치하면 기존 UI가 OS 프리미티브로 동작한다"
- 현재 sidebar는 키보드 네비게이션 완전 불가 — 마우스 전용
- ARIA Tree View 패턴 준수 (접근성)
- "React에서 직접 구현없이" 원칙 — OS가 관장

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| OS `tree` role이 expand/collapse를 ArrowLeft/Right로 처리 | ✅ `arrowExpand: true` 설정됨 | - |
| FocusGroup 중첩으로 tree 구조 표현 가능 | ✅ parentId 자동 전파 | - |
| defineApp 없이 FocusGroup만으로 충분 | ⚠️ activePath 상태는 DocsViewer에 존재 | onAction 콜백으로 연결 |
| open/close 상태를 OS가 관리 | ⚠️ OS는 aria-expanded만 관리, 실제 children 렌더는 React | `useComputed`로 expanded 구독 |

## 4. Ideal

```
DocsSidebar
  └── FocusGroup(role="tree")
        ├── FocusItem("0-inbox")     → treeitem, expandable
        │     └── FocusGroup(role="group")   → 하위 items
        │           ├── FocusItem("file-1")
        │           └── FocusItem("file-2")
        ├── FocusItem("1-project")   → treeitem, expandable
        └── FocusItem("2-area")      → treeitem, expandable
```

- ArrowDown → 다음 보이는 item으로 이동 (OS_NAVIGATE)
- ArrowRight on folder → OS_EXPAND → expanded → children 렌더
- Enter on file → onAction → handleSelect(path) → 문서 로드
- 포커스 시각화: `data-focused` → CSS

## 5. Inputs

- `src/os/6-components/base/FocusGroup.tsx` — Zone 프리미티브
- `src/os/6-components/base/FocusItem.tsx` — Item 프리미티브
- `src/os/registries/roleRegistry.ts` — tree preset (line 220-231)
- `src/os/3-commands/expand/` — OS_EXPAND
- `src/docs-viewer/DocsSidebar.tsx` — 현재 구현 (267 lines)
- `src/docs-viewer/docsUtils.ts` — DocItem 타입, cleanLabel

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | FocusGroup(role="tree") 래핑 | 수동 onClick/useState | tree Zone 교체 | High | - |
| G2 | FocusItem per tree node | 수동 button 렌더 | SidebarItem → FocusItem 변환 | High | G1 |
| G3 | Expand/collapse via OS | useState(isOpen) | aria-expanded → useComputed 구독 | Med | G1 |
| G4 | File selection via onAction | onClick → handleSelect | onAction 콜백 연결 | Med | G2 |
| G5 | Recent/Favorites 섹션 통합 | 별도 섹션 컴포넌트 | 같은 tree 안에 배치 or 별도 group | Low | G1 |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| 1 | DocsSidebar에 FocusGroup(role="tree") 래핑 | Clear | - | nav 영역을 FocusGroup으로 감싸기 |
| 2 | SidebarItem → FocusItem 변환 | Complicated | 1 | 폴더: expandable FocusItem + 중첩 group. 파일: leaf FocusItem |
| 3 | Expand/collapse OS 연동 | Complicated | 2 | aria-expanded 상태 → useComputed 구독 → children 조건부 렌더 |
| 4 | onAction → handleSelect 연결 | Clear | 2 | Enter/click on file → 문서 로드 |
| 5 | 포커스 시각화 | Clear | 2 | data-focused CSS + active item styling |
| 6 | Recent/Favorites 통합 | Complicated | 1 | 별도 FocusGroup(role="listbox") 또는 tree 내 group |
