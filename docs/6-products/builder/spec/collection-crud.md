# Feature: Collection CRUD & Clipboard

## Story

> **콘텐츠 운영자**로서, 반복 블록(카드, 탭, 섹션)을 **복사·붙여넣기·이동·삭제**하고 싶다.
> 그래야 페이지 구조를 빠르게 조립하고, 실수하면 되돌릴 수 있다.

### 가치

- **속도**: 섹션을 처음부터 만들지 않고, 기존 섹션을 복제→수정
- **안전**: 잘못 지워도 Undo로 복구. 잘못 붙여도 Undo
- **깊이 무관**: 탭 안의 카드든, 섹션이든, 어디에 있든 똑같이 동작해야 한다

---

## Overview

### Block Tree 구조

```
Page
  └── Section (depth=1)     ← root block (e.g. ge-hero, ge-tab-nav)
        └── Group (depth=2) ← nested (e.g. ge-tab-overview)
              └── Item (depth=3+) ← deeply-nested (e.g. ge-card-2)
```

### 핵심 개념

| 개념 | 설명 |
|------|------|
| **동적 아이템** (dynamic) | Block Tree에 존재하는 블록. 복사하면 구조가 복제됨 |
| **정적 아이템** (static) | 블록의 필드 (title, icon 등). 복사하면 텍스트 값만 복사됨 |
| **depth** | 블록의 트리 깊이. depth에 관계없이 동일하게 동작해야 함 |

### 조작 수단

| Zone | 방법 |
|------|------|
| **사이드바** | 🖱️ 버튼 (삭제, 복제, ↑/↓ 이동) |
| **캔버스** | ⌨️ 키보드 단축키 (`Meta+C/X/V/Z`) |

---

## Behavior Contract

> S = Status: ⬜ spec | 🔴 fail | 🟢 pass | 🚧 wip | ⚠️ issue
> **언어 레벨**: Given/Then = 행동 언어. Condition/Command = 코드 레벨.
> 🆕 = 이슈에서 추가된 행.

### 1. 사이드바 섹션 관리 (Zone: sidebar)

| # | S | Given | When | Intent | Condition | Command | Effect | Then |
|---|---|-------|------|--------|-----------|---------|--------|------|
| S1 | 🟢 | 4개 섹션 있음 (`hero,news,services,footer`) | news `삭제 버튼` | remove | `id` exists, is root | `sidebar:remove` | `blocks` 변경 | `news` 제거됨, 나머지 순서 유지 |
| S2 | 🟢 | 3개 섹션 있음 | 존재하지 않는 id `삭제 버튼` | remove | `id` not found | no-op | state 불변 | 섹션 수 변화 없음 |
| S3 | 🟢 | 2개 섹션 있음 (`hero, news`) | hero `복제 버튼` | duplicate | is root | `sidebar:duplicate` | `blocks` 변경 | `hero` 바로 뒤에 복제본 삽입, 총 3개 |
| S4 | 🟢 | 3개 섹션 있음, `news`는 2번째 | news `↑ 버튼` | moveUp | `idx > 0` | `sidebar:moveUp` | `blocks` 변경 | `news`가 1번째로 이동 |
| S5 | 🟢 | `hero`가 첫 번째 섹션 | hero `↑ 버튼` | moveUp | `idx === 0` | no-op | state 불변 | 순서 변화 없음 |
| S6 | 🟢 | 3개 섹션 있음, `news`는 2번째 | news `↓ 버튼` | moveDown | `idx < last` | `sidebar:moveDown` | `blocks` 변경 | `news`가 3번째로 이동 |
| S7 | 🟢 | `footer`가 마지막 섹션 | footer `↓ 버튼` | moveDown | `idx === last` | no-op | state 불변 | 순서 변화 없음 |

### 2. 캔버스 클립보드 (Zone: canvas)

> **depth 분류**
> - `depth=1 (root)`: 최상위 block (e.g. `ge-hero`, `ge-tab-nav`)
> - `depth=2 (nested)`: root의 자식 (e.g. `ge-tab-overview`)
> - `depth=3+ (deeply-nested)`: 그 아래 (e.g. `ge-card-2` inside `ge-features`)

#### Copy

| # | S | Given | When | Intent | Condition | Command | Effect | Then |
|---|---|-------|------|--------|-----------|---------|--------|------|
| C1 | 🟢 | root block(`depth=1`)에 포커스 | `Meta+C` | copy | `isDynamic=true` | `canvas:copy({ids:[focusId]})` | `clipboard ← block` | 블록 구조 전체가 클립보드에 저장됨, 원본 유지 |
| C2 | 🟢 | `depth=2` 중첩 block에 포커스 | `Meta+C` | copy | `isDynamic=true` | `canvas:copy({ids:[focusId]})` | `clipboard ← block` | 블록 구조 전체가 클립보드에 저장됨, 원본 유지 |
| C3 🆕 | 🟢 | `depth=3+` 깊이 중첩된 block에 포커스 (e.g. `ge-card-2`) | `Meta+C` | copy | `isDynamic=true` | `canvas:copy({ids:[focusId]})` | `clipboard ← block` | 블록 구조 전체가 클립보드에 저장됨, 원본 유지 |
| C4 | 🟢 | 정적 필드(텍스트 필드)에 포커스 | `Meta+C` | copy | `isDynamic=false` | `copyText(fieldValue)` | `clipboard ← text` | 필드 텍스트 값이 클립보드에 저장됨 |

#### Cut

| # | S | Given | When | Intent | Condition | Command | Effect | Then |
|---|---|-------|------|--------|-----------|---------|--------|------|
| X1 | 🟢 | 동적 block(`depth=1`)에 포커스 | `Meta+X` | cut | `isDynamic=true` | `canvas:cut({ids:[focusId]})` | block 제거 + `clipboard ← block` | 블록이 캔버스에서 제거되고 클립보드에 저장됨 |
| X2 | 🟢 | 정적 필드에 포커스 | `Meta+X` | cut | `isDynamic=false` | no-op | state 불변 | 아무 변화 없음 |

#### Paste

| # | S | Given | When | Intent | Condition | Command | Effect | Then |
|---|---|-------|------|--------|-----------|---------|--------|------|
| V1 | 🟢 | root block에 포커스, 클립보드에 블록 있음 | `Meta+V` | paste | `clipData` exists, `focusId` resolves to root | `canvas:paste({afterId:focusId})` | block 삽입 | 포커스된 블록 바로 뒤에 새 블록 삽입됨, 고유 id |
| V2 | 🟢 | `depth=2` block에 포커스, 클립보드에 블록 있음 | `Meta+V` | paste | `clipData` exists, `focusId` resolves to nested | `canvas:paste({afterId:focusId})` | block 삽입 | 포커스된 블록 바로 뒤에 새 블록 삽입됨 |
| V3 🆕 | 🟢 | `depth=3+` block에 포커스 (e.g. `ge-card-2`), 클립보드에 블록 있음 | `Meta+V` | paste | `clipData` exists, `focusId` in deep tree | `canvas:paste({afterId:focusId})` | block 삽입 | 포커스된 블록 바로 뒤에 새 블록 삽입됨, 고유 id |
| V4 | 🟢 | 정적 필드에 포커스, 클립보드에 텍스트 있음 | `Meta+V` | paste | `clipData.type === "text"`, `isDynamic=false` | `updateFieldByDomId` | field value 교체 | 필드 값이 클립보드 텍스트로 교체됨 |
| V5 | 🟢 | 클립보드가 비어 있음 | `Meta+V` | paste | `clipData === null` | no-op | state 불변 | 아무 변화 없음 |
| V6 | 🟢 | 블록을 복사한 상태 | `Meta+V` ×3 | paste (반복) | repeat | `canvas:paste` ×3 | 3 blocks 삽입 | 3개 블록 추가됨, 모든 id가 서로 다름 |
| V7 | 🟢 | children 있는 컨테이너 블록이 클립보드에 있음 | `Meta+V` | paste | `block.children.length > 0` | `canvas:paste` | block + children 복제 | 부모·모든 자식이 새 id로 생성됨, 기존 id 재사용 없음 |

### 3. Undo/Redo (Zone: sidebar / canvas)

| # | S | Given | When | Intent | Condition | Command | Effect | Then |
|---|---|-------|------|--------|-----------|---------|--------|------|
| U1 | 🟢 | 앱 방금 시작, 아무 변경 없음 | — (`canUndo` 쿼리) | — | `past === []` | — | — | undo 불가 상태 |
| U2 | 🟢 | 섹션을 삭제한 직후 | `Meta+Z` | undo | `past.length > 0` | `undoCommand` | 상태 복원 | 삭제된 섹션이 원래 위치에 돌아옴 |
| U3 | 🟢 | 삭제 후 undo한 직후 | `Meta+Shift+Z` | redo | `future.length > 0` | `redoCommand` | 상태 재실행 | 섹션이 다시 삭제됨 |
| U4 | 🟢 | 섹션을 위로 이동한 직후 | `Meta+Z` | undo | `past.length > 0` | `undoCommand` | 상태 복원 | 이동 전 순서로 돌아옴 |
| U5 | 🟢 | 필드 값을 수정한 직후 | `Meta+Z` | undo | `past.length > 0` | `undoCommand` | 상태 복원 | 필드가 이전 값으로 돌아옴 |
| U6 | 🟢 | 변경을 3회 실행한 상태 | `Meta+Z` ×3 | undo (반복) | — | `undoCommand` ×3 | 역순 복원 | 3개 변경이 모두 역순으로 취소됨 |
| U7 | 🟢 | undo 후 redo 가능한 상태 | 임의 버튼 또는 임의 입력 | — | `future.length > 0` | 임의 커맨드 | redo 이력 소멸 | 이후 redo 불가 상태 |

---

## Edge Cases & No-gos

### 의도적 미지원

| 항목 | 이유 |
|------|------|
| 정적 필드 잘라내기 | 디자인 구조가 파괴됨. 텍스트는 복사만 허용 |
| 크로스 앱 붙여넣기 | 블록 스키마가 앱마다 다름. OS 레벨 통합은 Later |
| 드래그 정렬 | 별도 Feature로 분리 (`hierarchical-navigation.md`) |

### 알려진 엣지 케이스

| 케이스 | 현재 동작 | 비고 |
|--------|----------|------|
| 빈 페이지에 붙여넣기 | 첫 번째 블록으로 삽입 | ⬜ 테스트 미작성 |
| 복사 후 다른 Zone으로 이동 후 붙여넣기 | 클립보드 유지, 해당 Zone 규칙 적용 | ⬜ 테스트 미작성 |
