# Discussion: OS 파일·구조 네이밍 컨벤션

> 2026-02-17 08:34 ~ 12:18

---

## Journey

**🧑 사용자**: OS의 파일과 구조 네이밍에 대한 일관성과 철학을 만들고 싶어

**🤖 AI**: 프로젝트 전체를 탐색하여 현재 네이밍 패턴을 전수 조사. 파일 케이스(PascalCase/camelCase/kebab-case)는 확장자별로 이미 잘 수렴되어 있으나, 폴더 단수/복수, 뷰 계층 어휘, dot.notation 범위, 번호 접두사 범위, snake_case 실수 등 5개 열린 질문 도출.

---

**🧑 사용자**: 그전에 우리가 만들고자 하는 네이밍에서 일관성이나 의도가 잘 만들어진 것, 그러지 못한 것을 분석하는 초안을 만들어보자.

**🤖 AI**: `/inbox` 워크플로우로 감사 보고서 작성. `docs/0-inbox/2026-0217-0837-[analysis]-naming-convention-audit.md`에 저장. 파일 케이스 12개 규칙, 폴더 패턴 6개 규칙, 5개 열린 질문으로 구조화.

---

**🧑 사용자**: (5개 질문에 대한 답변)
1. **복수 폴더명** 선호
2. Apps에서는 **FSD**, OS 3계층은 의도적. widgets는 고민중
3. dot.notation은 **defineApp 분해용 실용 수단**이었음, 고민중
4. 번호 접두사는 **순서가 필요한 모든 곳에 확대**
5. `todo_details/` snake_case는 **실수**

**🤖 AI**: Q1 결정에서 파생 질문 — `state/`, `lib/` 같은 불가산 명사도 복수형으로 바꿀 것인가? Q2에서 FSD 표준 레이어와 현재 구조 매핑 분석.

---

**🧑 사용자**:
1. FSD에서도 `lib`, `ui`, `config` 등의 segment는 이름을 그대로 쓴다. **업계 관행을 따르자.**
2. **업계 관행을 따르자.** FSD에서는 `widgets`가 맞다.

**🤖 AI**: Rule #7 ("표준이 있으면 발명하지 않는다")과 정확히 정렬됨을 확인. 전체 컨벤션 초안을 통합 정리하여 제시. dot.notation은 "defineApp에만 적용, 확장 시 재논의"로 동결 제안.

---

**🧑 사용자**: 좋아

**한 줄 요약**: 파일 케이스는 이미 수렴, 폴더는 "업계 관행 우선 + 컬렉션은 복수형", 앱은 FSD·OS는 파이프라인·docs는 PARA로 어휘 체계 확정.

---

## Conclusion

### Why
에이전트가 새 파일/폴더를 만들 때 **제로 추론**으로 이름을 결정할 수 있어야 한다.
"상황에 따라"는 매번 추론 비용이 발생하고, "무조건 이 규칙"은 제로 추론이다.

### Intent
네이밍 체계를 **"발명"이 아닌 "업계 표준 채택 + 프로젝트 고유 영역만 명시"**로 확립.

### Warrants (전체)

| # | Warrant |
|---|---------|
| W1 | **"이름은 법이다" (Rule #6)** — 하나의 개념에 하나의 이름. grep 한 번이면 모든 연결이 보여야 한다. |
| W2 | **"편의보다 명시적" (Rule #4)** — 제로 추론 가능한 규칙. |
| W3 | **"모든 산출물은 부채다" (Rule #5)** — 규칙 자체도 최소화. |
| W4 | **파일 케이스는 확장자별로 이미 수렴** — 문제의 핵심은 폴더 의미론과 어휘 통일. |
| W5 | **복수형은 업계 관행 우선** — `lib/`, `model/` 등 표준 이름은 그대로 유지. |
| W6 | **번호 접두사 = 순서가 의미인 모든 곳** — 파이프라인, 레이어, PARA. |
| W7 | **앱은 FSD, OS는 자체 파이프라인** — 두 어휘 체계 공존. |
| W8 | **dot.notation은 defineApp 분해의 실용 수단** — 현재 동결, 확장 시 재논의. |
| W9 | **"표준이 있으면 발명하지 않는다" (Rule #7)** — FSD, PARA 등 검증된 체계의 어휘를 그대로 사용. |

### 확정된 컨벤션

#### 파일 케이스

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

#### 폴더 네이밍

| 규칙 | 기준 | 예시 |
|------|------|------|
| 업계 관행이 있는 이름 | 표준 그대로 | `lib/`, `ui/`, `config/`, `model/`, `state/` |
| 컬렉션 폴더 | 복수형 | `widgets/`, `primitives/`, `stores/`, `panels/`, `keymaps/` |
| 테스트 | `tests/` → `unit/`, `e2e/` | 고정 구조 |
| 순서가 의미인 곳 | `N-name/` (번호 접두사) | `1-listeners/`, `0-inbox/` |
| 앱/모듈/프로젝트 | kebab-case | `todo/`, `builder-mvp/` |

#### 구조 어휘 — 세 세계

| 영역 | 어휘 체계 | 레이어 |
|------|----------|--------|
| **Apps** | **FSD** | `app.ts` → `widgets/` → `features/` → `entities/` → `shared/` |
| **OS** | **파이프라인** (번호) | `1-listeners/` → `2-contexts/` → `3-commands/` → `4-effects/` → `5-hooks/` → `6-components/` |
| **Docs** | **PARA** (번호) | `0-inbox/` → `1-project/` → `2-area/` → `3-resource/` → `4-archive/` → `5-backlog/` |

#### 즉시 교정 대상

| 현재 | 변경 | 이유 |
|------|------|------|
| `features/todo_details/` | `features/todo-details/` | snake_case → kebab-case 교정 |
| `codeTheme.css` | `code-theme.css` | CSS는 kebab-case |
| `schema/` | `schemas/` | 컬렉션 → 복수형 |
| `middleware/` | `middlewares/` | 컬렉션 → 복수형 |
| `registry/` | `registries/` | 컬렉션 → 복수형 |

**한 줄 요약**: "표준이 있으면 채택하고, 없으면 최소한으로 명시한다" — 파일 케이스는 확장자가 법이고, 폴더는 업계 관행이 법이며, 구조는 FSD/파이프라인/PARA가 법이다.
