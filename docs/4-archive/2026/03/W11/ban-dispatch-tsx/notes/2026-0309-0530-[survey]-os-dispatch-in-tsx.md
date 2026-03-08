# Survey: os.dispatch in .tsx — OS Gap 전수 조사

> 작성일: 2026-03-09
> 원칙: **React(.tsx)에서 os.dispatch 호출은 구조적으로 항상 오류**
> React = L2 순수 투영. dispatch는 L0 실행 침범. Zone callback에서 BaseCommand를 리턴하는 것이 정상 경로.

## 목적

`.tsx` 파일의 `os.dispatch` 25건을 전수 분류한다:
- **🔴 LLM 실수**: OS가 선언형 대안을 이미 제공 → 즉시 수정 가능
- **🟡 OS 갭**: OS가 아직 선언형 대안을 제공하지 않음 → OS 개선 필요
- **⚪ 정당한 예외**: 존재 불가 (원칙상 .tsx에서 dispatch는 항상 오류)

## 전수 목록

### 1. command-palette/ (7건)

| # | 파일:줄 | 커맨드 | 분류 | 선언형 대안 |
|---|---------|--------|------|------------|
| 1 | CommandPalette.tsx:119 | OS_OVERLAY_CLOSE | ? | overlay auto-close? Zone onAction return? |
| 2 | QuickPick.tsx:196 | OS_OVERLAY_OPEN | ? | trigger prop-getter? zone.overlay()? |
| 3 | QuickPick.tsx:198 | OS_OVERLAY_CLOSE | ? | (동일) |
| 4 | QuickPick.tsx:227 | OS_FOCUS | ? | Zone이 자동 포커스? |
| 5 | QuickPick.tsx:272 | OS_OVERLAY_CLOSE | ? | (동일) |
| 6 | QuickPick.tsx:309 | OS_NAVIGATE(down) | ? | Zone 키보드 내비게이션? |
| 7 | QuickPick.tsx:313 | OS_NAVIGATE(up) | ? | (동일) |

**패턴**: command-palette 전체가 OS Zone 미적용. combobox role Zone으로 전환하면 대부분 해소 가능성.

### 2. docs-viewer/ (5건)

| # | 파일:줄 | 커맨드 | 분류 | 선언형 대안 |
|---|---------|--------|------|------------|
| 8 | DocsSearch.tsx:56 | selectDoc (앱 커맨드) | ? | Zone onAction callback? |
| 9 | DocsSearch.tsx:57 | closeSearch (앱 커맨드) | ? | (동일) |
| 10 | DocsSearch.tsx:64 | closeSearch | ? | Escape keybinding? |
| 11 | DocsSearch.tsx:86 | closeSearch | ? | backdrop dismiss? |
| 12 | DocsViewer.tsx:264 | selectDoc | ? | (동일) |
| 13 | DocsViewer.tsx:276 | resetDoc | ? | Zone callback? |
| 14 | DocsViewer.tsx:285 | resetDoc | ? | (동일) |

**패턴**: docs-viewer 전체가 OS Zone 미적용. 별도 defineApp + Zone 전환 필요.

### 3. pages/builder/ (6건)

| # | 파일:줄 | 커맨드 | 분류 | 선언형 대안 |
|---|---------|--------|------|------------|
| 15 | BuilderPage.tsx:134 | loadPagePreset | ? | Zone onAction? trigger? |
| 16 | PropertiesPanel.tsx:93 | raw command object | ? | Zone callback? |
| 17 | PropertiesPanel.tsx:316 | (dispatch) | ? | Field commit? |
| 18 | PropertiesPanel.tsx:473 | (dispatch) | ? | (동일) |
| 19 | EditorToolbar.tsx:57 | undoCommand | ? | keybinding으로 이미 존재? trigger? |
| 20 | EditorToolbar.tsx:62 | redoCommand | ? | (동일) |
| 21 | SectionSidebar.tsx:323 | addBlock | ? | Zone onAction? |

**패턴**: builder UI가 onClick + os.dispatch 조합. Zone onAction/trigger로 전환 필요.

### 4. apg-showcase/ (1건)

| # | 파일:줄 | 커맨드 | 분류 | 선언형 대안 |
|---|---------|--------|------|------------|
| 22 | MeterPattern.tsx:200 | OS_VALUE_CHANGE | ? | Zone bind value callback? |

### 5. widgets/ (3건)

| # | 파일:줄 | 커맨드 | 분류 | 선언형 대안 |
|---|---------|--------|------|------------|
| 23 | ToastContainer.tsx:107 | OS_NOTIFY_DISMISS | ? | Zone onAction? onDismiss callback? |
| 24 | ToastContainer.tsx:111 | n.actionCommand (dynamic) | ? | (동적 커맨드 — OS gap?) |
| 25 | ToastContainer.tsx:112 | OS_NOTIFY_DISMISS | ? | (23과 동일) |

**패턴**: Toast에 동적 actionCommand 실행이 있음 — 이건 OS gap일 가능성.

## 조사 필요 사항

각 건에 대해:
1. **해당 컴포넌트의 맥락을 읽고** 왜 os.dispatch를 쓰게 됐는지 파악
2. **OS에 이미 선언형 대안이 있는지** 확인 (Zone callback, trigger, keybinding, overlay auto)
3. 대안 없으면 **OS gap 카테고리** 명명 (예: "combobox overlay 통합", "toast action dispatch")

## 분류 결과 (수정됨)

**OS gap = 0. 전원 🔴 LLM 실수.**

Trigger prop-getter(`bind({ triggers })`) + Zone built-in이 25건 전부 커버:

| 대안 메커니즘 | 커버 건수 | 대상 |
|-------------|---------|------|
| `zone.overlay().trigger()` | ~10건 | overlay open/close 전부 |
| `bind({ triggers: { Name: () => cmd } })` | ~11건 | click→app command (selectDoc, addBlock, undo/redo, dismiss 등) |
| Zone built-in (role keyboard nav) | ~3건 | navigate up/down, focus |
| overlay auto-dismiss | ~1건 | backdrop click → close |

**근거**: Trigger = `onClick={() => os.dispatch(cmd)}`의 선언형 등가물. 동적 커맨드(toast actionCommand)도 closure capture로 커버.

## 다음 단계

1. ~~각 건을 실제 코드 맥락에서 분류~~ → **전부 🔴 확정**
2. 🔴 25건 수정 프로젝트 생성 (영역별 분할: command-palette, docs-viewer, builder, widgets)
3. lint rule 추가: `.tsx`에서 `os.dispatch` ERROR
4. 수정 완료 후 lint gate 활성화
