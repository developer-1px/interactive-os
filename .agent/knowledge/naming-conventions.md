# 네이밍 컨벤션

> 이름은 법이다. 하나의 개념에 하나의 이름. grep 한 번이면 모든 연결이 보여야 한다.
> 파일, 폴더, 함수 이름을 지을 때 참조한다.

**함께 읽어야 할 파일**:
- `.agent/knowledge/naming.md` — 동사 Dictionary (resolve/compute/read/get 등의 선택 기준)
- `.agent/knowledge/domain-glossary.md` — 도메인 개념 정의 (ZIFT, Zone, Item, Cursor 등)

---

## 파일 케이스

> "표준이 있으면 발명하지 않는다." 파일 케이스는 확장자가 법이고, 폴더는 업계 관행이 법이다.

| 역할 | 케이스 | 예시 |
|------|--------|------|
| React 컴포넌트 | `PascalCase.tsx` | `QuickPick.tsx`, `Zone.tsx` |
| 타입/스키마/Store/Registry | `PascalCase.ts` | `FocusState.ts`, `InspectorStore.ts` |
| 함수/유틸/로직 | `camelCase.ts` | `focusFinder.ts`, `loopGuard.ts` |
| 커맨드 핸들러 | `camelCase(동사).ts` | `activate.ts`, `escape.ts` |
| 앱 정의 | `app.ts` (고정) | — |
| 앱 등록 | `register.ts` (고정) | — |
| barrel export | `index.ts` (고정) | — |
| 모듈 분해 | `module.concern.ts` | `defineApp.bind.ts` (defineApp에만 적용) |
| 단위 테스트 | `kebab-case.test.ts` | `navigate.test.ts` |
| E2E 테스트 | `kebab-case.spec.ts` | `todo.spec.ts` |
| CSS | `kebab-case.css` | `docs-viewer.css` |
| 시스템 메타 문서 | `UPPER_CASE.md` | `STATUS.md`, `BOARD.md` |
| 분석/보고 문서 | `YYYY-MMDD-HHmm-[type]-slug.md` | — |

## 폴더 네이밍

| 규칙 | 기준 | 예시 |
|------|------|------|
| 업계 관행 이름 | 표준 그대로 (단수) | `lib/`, `ui/`, `config/`, `model/`, `state/` |
| 컬렉션 폴더 | 복수형 | `widgets/`, `primitives/`, `stores/`, `keymaps/` |
| 테스트 | `tests/` → `unit/`, `e2e/` | 고정 구조 |
| 순서가 의미인 곳 | `N-name/` (번호 접두사) | `1-listeners/`, `0-inbox/` |
| 앱/모듈/프로젝트 | kebab-case | `todo/`, `builder-mvp/` |

## 구조 어휘 — 세 세계

| 영역 | 어휘 체계 | 근거 |
|------|----------|------|
| **Apps** | **FSD** (Feature-Sliced Design) | `app.ts` → `widgets/` → `features/` → `entities/` → `shared/` |
| **OS** | **파이프라인** (번호 접두사) | `1-listeners/` → … → `6-components/` |
| **Docs** | **토폴로지** | `official/` (살아있는 문서) + `archive/` (죽은 문서) + `2-area/` (인큐베이터) |

## 파이프라인 동사 — 1-listeners 법

> **하나의 동사 = 하나의 경계.** 동사가 겹치면 에이전트가 "이 함수는 어느 단계?"를 추론해야 한다.

| 동사 | 경계 | 입력 → 출력 | 순수 | 예시 |
|------|------|------------|------|------|
| `sense` | DOM → SenseData | `HTMLElement, Event` → `MouseDownSense` | ❌ (DOM 읽기) | `senseMouseDown()` |
| `extract` | SenseData → ResolveInput | `MouseDownSense` → `MouseInput` | ✅ | `extractMouseInput()` |
| `resolve` | ResolveInput → Commands | `MouseInput` → `ResolveResult` | ✅ | `resolveMouse()` |
| `dispatch` | Commands → SideEffect | `ResolveResult` → `os.dispatch()` | ❌ (부수효과) | Listener 내부 |

- `sense`와 `extract`는 복잡도가 낮으면 하나로 합칠 수 있다.
- `resolve`는 **반드시** input→command 판단에만 사용한다. sense→input 변환에 `resolve`를 쓰지 않는다.

## 문서 토폴로지

> 소스는 문서처럼, 문서는 소스처럼.

| 계층 | 역할 | 규칙 |
|------|------|------|
| `official/` | 공식 지식의 인지 지도 | 개념 단위, 덮어쓰기, 날짜 없음, 소스코드 토폴로지와 양방향 동형 |
| `.agent/rules.md` | 헌법 | 강제 노출 경로, 매 세션 읽힘, 시점 독립 원칙만 |
| `2-area/` | 인큐베이터 | official로 아직 졸업 못 한 지식 |
| `archive/YYYY/MM/WNN/` | 매장 | 분류 없이 주차별 flat, 정리 비용 0 |

- 개발 중 문서(BOARD, discussions, devnote)는 에이전트의 세션 간 작업 기억으로 필수.
- 작업 완료 시 `/archive` 워크플로우로 환류: official 추출 + archive/주차 매장.
