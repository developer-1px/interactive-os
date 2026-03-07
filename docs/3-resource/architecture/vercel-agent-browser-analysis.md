---
last-reviewed: 2026-03-07
---

# Vercel Agent-Browser: AI-First 브라우저 자동화와 우리의 Headless 접근 비교

> DOM을 압축할 것인가, DOM 없이 계산할 것인가 — 같은 문제, 다른 급진성

## 왜 이 주제인가

Interactive OS의 headless 테스팅은 "DOM 없이 상호작용을 검증한다"는 급진적 접근을 취한다. 2026년 1월 Vercel이 발표한 agent-browser는 비슷한 문제 인식("AI에게 DOM은 토큰 낭비")에서 출발하되, 다른 해법을 선택했다. 두 접근을 비교하면 우리가 어디에 있고, 어디를 보완할 수 있는지 보인다.

## Background / Context

### 문제: AI 에이전트에게 DOM은 독이다

Playwright MCP는 매 액션마다 full accessibility tree를 반환한다. 복잡한 페이지에서 클릭 한 번에 3,000~5,000 토큰이 소비된다. Chrome DevTools MCP는 도구 정의만으로 ~17,000 토큰을 먹는다. 6개 테스트를 돌리면 Playwright MCP는 ~31K 문자(~7,800 토큰), 다단계 워크플로우에서 컨텍스트 윈도우가 금방 고갈된다.

### Vercel의 해법: Snapshot + Refs

agent-browser는 Playwright를 내부적으로 감싸되, LLM에게 보이는 인터페이스를 재설계했다:

1. **Snapshot**: DOM 대신 accessibility tree의 상호작용 가능 요소만 추출
2. **@refs**: 각 요소에 `@e1`, `@e2` 같은 안정적 참조 할당
3. **Compact output**: `button "Sign In" [ref=e1]` — 수천 노드가 수 줄로

결과: 동일 테스트 6개 기준 ~5.5K 문자(~1,400 토큰). **93% 감소**.

### 아키텍처

```
[AI Agent] ←CLI→ [Rust Parser] ←IPC→ [Node.js Daemon] ←CDP→ [Chromium]
                                         └── Playwright instances (warm)
```

- Rust CLI: <50ms 부팅, 커맨드 파싱
- Node.js daemon: Playwright 세션 관리, 상시 실행 (warm instance)
- 108+ 커맨드: open, snapshot, click, fill, press, screenshot, diff snapshot...

### 핵심 명령어

```bash
agent-browser open https://example.com
agent-browser snapshot                    # accessibility tree + @refs
agent-browser click @e2                   # ref로 클릭
agent-browser fill @e3 "user@test.com"    # ref로 입력
agent-browser find role button --name "Submit"  # ARIA role로 검색
agent-browser diff snapshot               # 스냅샷 비교 (회귀 감지)
```

## Core Concept: 두 접근의 구조적 비교

| 차원 | agent-browser | Interactive OS headless |
|------|--------------|------------------------|
| 전제 | DOM 존재, 출력만 압축 | DOM 자체 없음 |
| 핵심 | accessibility tree → snapshot + @refs | headless compute → ARIA 상태 |
| 토큰 비용 | ~1,400/6테스트 (93% 감소) | 0 (브라우저 없음) |
| 대상 | 임의의 웹사이트 | 자체 OS 위 앱 |
| 선택자 | `@e1` (동적, 세션 내 유효) | `#id` (정적, 앱이 선언) |
| 실행 | Rust + Node.js + Chromium | vitest (Node.js only) |
| ARIA | 읽기용 (tree → 요약) | 계산 입력 (compute → attrs) |

**공통 직관**: AI에게는 DOM이 아니라 **의미론적 표현**이 필요하다.

**차이**: agent-browser = "DOM → 사후 요약", headless = "DOM 없이 직접 생성". 우리가 더 급진적이다.

## 벤치마킹 포인트

### 1. Snapshot 텍스트 포맷 (채택 가치: 높음)

agent-browser의 snapshot 출력은 LLM과 인간 모두에게 읽기 좋다. 우리 headless page에 `snapshot()` 메서드를 추가하면 디버깅과 TestBot 텍스트 모드에 유용하다:

```ts
// 제안: page.snapshot()
page.snapshot()
// → listbox "Todos" [3 items]
//     option "Buy milk" [aria-selected]
//     option "Walk dog"
//     option "Read book"
```

### 2. diff snapshot — 상태 변화 단언 (채택 가치: 중간)

두 시점의 상태를 비교하는 자동화. 현재 우리는 `expect(page.locator("#x").attrs()).toEqual(...)` 수동 단언. diff 기반이면 "무엇이 변했는가"를 선언적으로 테스트할 수 있다.

### 3. "도구를 줄이면 성능이 오른다" 원칙 (확인)

Vercel 내부 데이터: 도구 80% 제거 → 3.5x 빠름, 37% 토큰 감소, 성공률 80%→100%. 우리 파이프라인의 "단계별 단일 책임" 원칙과 동형. 이미 올바른 방향에 있음을 확인.

### 벤치마킹 불필요

- **@ref 시스템**: 우리 `#id`가 이미 안정적이고 의미론적
- **Rust CLI / daemon**: vitest 직접 실행이므로 프로세스 간 통신 오버헤드 없음
- **범용 웹 자동화**: 우리 scope이 아님

## Best Practice + Anti-Pattern

### DO
- 에이전트에게 보여주는 출력을 의미론 단위로 압축하라 (Vercel의 교훈)
- 도구 수를 최소화하라 — 선택지가 적을수록 LLM 성공률이 높다
- accessibility tree를 "검증의 공통 언어"로 활용하라

### DON'T
- DOM을 파싱해서 ARIA를 추출하는 방향으로 가지 마라 (우리는 이미 더 나은 위치)
- 범용 브라우저 자동화를 모방하지 마라 — 우리 scope은 자체 OS

## 흥미로운 이야기들

**"Constraints help more than they hurt"** — Vercel 팀의 설계 철학. 도구를 줄이면 LLM이 더 잘 수행한다. 이것은 우리 rules.md의 "Pit of Success"와 정확히 같은 사상이다. LLM의 자유도를 줄이면 올바르게 만들기가 기본값이 된다.

**Pulumi의 비판: "Ralph Wiggum Loop"** — AI가 자기 코드를 자기가 검증하는 것은 "학생이 자기 시험을 채점하는 것"이라는 비판. agent-browser로 AI가 자기 앱을 테스트하면 false positive 위험. 우리는 headless compute가 "OS가 보장하는 불변"이므로 이 함정에 덜 빠진다.

**14,000+ GitHub stars in 2 months** — 이 문제에 대한 시장의 갈증이 크다는 증거.

## 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|------|------|------|--------|------|
| agent-browser 소스 코드 | snapshot 포맷 구현 상세 | [GitHub](https://github.com/vercel-labs/agent-browser) | 중 | 2h |
| Context Wars 분석 | 토큰 효율 벤치마크 방법론 | [paddo.dev](https://paddo.dev/blog/agent-browser-context-efficiency/) | 하 | 30m |
| Playwright Accessibility API | `page.accessibility.snapshot()` 기존 기능 | [Playwright docs](https://playwright.dev/docs/accessibility-testing) | 하 | 30m |
| Ralph Wiggum Loop 비판 | self-verification 한계 | [Pulumi Blog](https://www.pulumi.com/blog/self-verifying-ai-agents-vercels-agent-browser-in-the-ralph-wiggum-loop/) | 하 | 20m |
