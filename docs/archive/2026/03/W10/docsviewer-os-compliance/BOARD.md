# docsviewer-os-compliance

## Context

Claim: DocsViewer의 모든 상호작용을 OS 패턴(Trigger/Item/Zone)으로 전환하여 Tab, 키보드 접근성, focus 관리를 OS가 보장하도록 한다.

Before → After:
- Before: 다수의 `<button onClick={...}>` + `os.dispatch()` 직접 호출. Tab이 zone 간 이동 불가. docs-reader zone에 Item 없음.
- After: 모든 버튼이 OS Trigger. 모든 zone에 적절한 Item. Tab으로 전체 zone 순환 동작.

Risks:
- DocsSearch의 input/keyDown은 OS Field로 전환 필요 (복잡도 높음)
- StatusDashboard, DocsDashboard는 하위 컴포넌트 — 범위 통제 필요

## Audit — OS 계약 위반 목록

### DocsViewer.tsx (본문)
| # | Line | 위반 | 분류 |
|---|------|------|------|
| V1 | 355 | `onClick={() => os.dispatch(goBack())}` — back 버튼 | Trigger 전환 |
| V2 | 363 | `onClick={() => os.dispatch(goForward())}` — forward 버튼 | Trigger 전환 |
| V3 | 388 | `onClick={() => handleSelect(folder:...)}` — breadcrumb | Trigger 전환 |
| V4 | 402 | `onClick={() => os.dispatch(openSearch())}` — search 버튼 | Trigger 전환 |
| V5 | 426 | `onClick={() => handleSelect(allFiles[0].path)}` — return home | Trigger 전환 |
| V6 | 472 | `onClick={() => toggleFavorite(...)}` — pin 버튼 | Trigger 전환 |
| V7 | 517 | `onClick={() => handleSelect(prevFile.path)}` — prev nav | Trigger 전환 |
| V8 | 535 | `onClick={() => handleSelect(nextFile.path)}` — next nav | Trigger 전환 |
| V9 | 319 | `onClick={handleCloseFolder}` — close folder | Trigger 전환 |
| V10 | 328 | `onClick={handleOpenFolder}` — open folder | Trigger 전환 |
| V11 | 99 | `onClick` — mode toggle | Trigger 전환 |

### DocsSidebar.tsx
| # | Line | 위반 | 분류 |
|---|------|------|------|
| V12 | 52 | `onClick={() => setIsOpen(!isOpen)}` — section toggle | Trigger 전환 |

### DocsSearch.tsx
| # | Line | 위반 | 분류 |
|---|------|------|------|
| V13 | 85-88 | `onClick` + `onKeyDown` — overlay backdrop | OS overlay dismiss |
| V14 | 99-100 | `onChange` + `onKeyDown` — search input | OS Field 전환 |
| V15 | 107 | `onClick` — clear button | Trigger 전환 |
| V16 | 126 | `onClick` — result item | Item + onAction |

### DocsDashboard.tsx
| # | Line | 위반 | 분류 |
|---|------|------|------|
| V17 | 113-164 | 다수 `onClick` — dashboard links | Item + onAction |

### StatusDashboard.tsx
| # | Line | 위반 | 분류 |
|---|------|------|------|
| V18 | 42-114 | `os.dispatch()` 직접 호출 | Trigger 전환 |

### TableOfContents.tsx
| # | Line | 위반 | 분류 |
|---|------|------|------|
| V19 | 85-110 | `onClick` — TOC heading links | Item + onAction |

### docs-reader zone
| # | 위반 | 분류 |
|---|------|------|
| V20 | Zone에 Item이 0개 — Tab 순서에서 제외됨 | Zone 설계 |

## Now
(empty — all tasks complete)

## Done
- [x] T7: Tab 순환 검증 — 5개 zone(navbar/favorites/recent/sidebar/reader) 등록, Tab/Shift+Tab 순환 확인 — tsc 0 | 9/9 tests pass | 1927 total pass ✅
- [x] T1: DocsViewer 본문 — V1~V8, V11 onClick → Zone Item 전환 (9/11건) — tsc 0 | 1920 tests pass | V9/V10 partial ✅
  - V1-V4: `docs-navbar` zone (toolbar) 신설 → back/forward/breadcrumb/search를 Item으로 전환
  - V5-V8, V11: `docs-reader` zone에 onAction + activate.onClick 추가 → prev/next/home/pin/folder-child를 Item으로 전환
  - V6: `TOGGLE_FAVORITE` command 신설, favVersion을 app state로 이동
  - V9, V10: onClick 유지 (async File System Access API — OS command 불가)
- [x] T2: docs-reader zone에 prev/next를 Item으로 등록 (V20) — T1에서 해결. reader zone에 onAction + activate.onClick 추가, prev/next/home/pin이 Item으로 등록됨 ✅
- [x] T3: DocsSidebar V12 — native `<button>`이 Enter/Space 처리. 순수 UI visibility toggle이므로 OS 전환 불필요 ✅
- [x] T4: DocsSearch V13~V16 — V13(backdrop dismiss)은 이미 OS command 사용. V14~V16은 combobox 패턴 필요 → Unresolved로 이관 ✅
- [x] T5: StatusDashboard V18 → Item 전환. DocsDashboard V17은 미사용 legacy — tsc 0 ✅
- [x] T6: TableOfContents V19 — native `<button>` + scrollIntoView. DOM scroll이므로 OS 전환 불필요 ✅

## Unresolved
- DocsSearch의 input은 OS Field로 전환 가능한가? (Field가 overlay 내부에서 동작하는지 확인 필요)
- V9/V10 (folder open/close): 비동기 브라우저 API 호출이 포함되어 순수 OS command로 전환 불가. 향후 OS effect 패턴 도입 시 전환 가능
- V14~V16 (DocsSearch input/results): combobox 패턴 (input + listbox zone) 필요. OS Field가 overlay 내부에서 동작하는지 + combobox zone 지원 필요

## Ideas
- docs-tab.test.ts를 T7에서 Green으로 만들기
- DocsViewer를 OS dogfooding 레퍼런스 앱으로 활용
