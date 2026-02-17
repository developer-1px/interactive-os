# Interactive OS 설계 현황 보고서

| 항목 | 내용 |
|------|------|
| 원문 | OS 설계에 대해서 이야기 나누자. 현황부터 보고해봐 |
| 내(AI)가 추정한 의도 | 선언문 작성 직후, 비전과 현실 사이 간극을 정량적으로 파악하고 싶다 |

---

## 1. 개요

선언문 30개가 확정된 시점에서, 현재 구현의 완성도를 레이어별로 점검한다.

---

## 2. 레이어별 현황

### Layer 1: Kernel (`packages/kernel/`)

| 항목 | 상태 |
|------|------|
| Unified Group API (createKernel → Group) | ✅ |
| defineCommand → CommandFactory | ✅ |
| defineEffect → EffectToken (scoped + bubbling) | ✅ |
| defineContext → ContextToken (wrapper object) | ✅ |
| Group inject (ctx 타입 자동 전파) | ✅ |
| dispatch (scoped bubbling, re-entrance safe) | ✅ |
| Middleware (before/after, scoped) | ✅ |
| Transaction log + travelTo | ✅ |
| createStore + bindStore | ✅ |
| useComputed (React hook) | ✅ |
| Branded types (Command, EffectToken, ScopeToken) | ✅ |

**평가**: 커널은 **설계 완료 + 구현 완료**. 선언문과 완전히 일치.

---

### Layer 2: OS (`src/os-new/`)

#### 프리미티브 (6-components/primitives/)

| 컴포넌트 | 크기 | 상태 |
|----------|------|------|
| Root | 1KB | ✅ 글로벌 인프라 (InputEngine, FocusSensor) |
| Zone | 4KB | ✅ 공간 영역 + config-driven 행동 |
| Item | 2.5KB | ✅ 포커스 가능 요소 |
| Field | 8.7KB | ✅ 편집 가능 요소 |
| Trigger | 13KB | ✅ 클릭/키보드 인터랙션 |
| Label | 1.8KB | ✅ 접근성 라벨 |
| Modal / Dialog | radox/ | ✅ 오버레이 패턴 |
| Kbd | 1.4KB | ✅ 키보드 단축키 표시 |

#### Listeners (1-listeners/)

| 리스너 | 크기 | 역할 |
|--------|------|------|
| KeyboardListener | 3.5KB | 키보드 → 커맨드 번역 (fallback 패턴) |
| FocusListener | 9.2KB | 포커스 이벤트 → 커맨드 |
| ClipboardListener | 1.7KB | 클립보드 이벤트 → 커맨드 |

#### Commands (3-commands/) — 9개 도메인

| 도메인 | 파일 수 | 커맨드 예시 |
|--------|---------|-------------|
| navigate | 6 | OS_NAVIGATE, OS_NAVIGATE_TO |
| interaction | 7 | OS_ACTIVATE, OS_CLICK |
| selection | 3 | OS_SELECT, OS_SELECT_ALL |
| focus | 5 | OS_FOCUS_ENTER, OS_FOCUS_LEAVE |
| field | 1 | OS_FIELD_EDIT |
| clipboard | 1 | OS_COPY, OS_PASTE |
| expand | 2 | OS_EXPAND |
| overlay | 1 | OS_OVERLAY |
| utils | 2 | 유틸리티 |

#### 지원 인프라

| 모듈 | 상태 |
|------|------|
| keymaps/ (osDefaults.ts, keybindings.ts) | ✅ 키 → 커맨드 매핑 |
| registry/ (roleRegistry.ts, 12KB) | ✅ ARIA role 기반 Zone 프리셋 |
| schema/ (29 파일) | ✅ 타입 정의 (command, effect, focus, state, logic) |
| middleware/ (3 파일) | ✅ history, persistence |
| state/ (3 파일) | ✅ 초기 상태 |
| appSlice.ts (11KB) | ✅ 앱 상태 슬라이스 등록 |

#### Facade (AntigravityOS.tsx)

```
OS.Root, OS.Zone, OS.Item, OS.Field, OS.Trigger, OS.Modal, OS.Dialog, OS.Kbd
OS.FOCUS, OS.SELECTION (sentinel 상수)
evalContext (로직 평가)
```

**평가**: OS 레이어는 **핵심 구현 완료**. 프리미티브 7개, 리스너 3개, 커맨드 9개 도메인. Config-driven 행동(roleRegistry), ARIA 표준 준수.

---

### Layer 3: Apps (`src/apps/`)

| 앱 | 파일 수 | 상태 |
|----|---------|------|
| Todo | 22 | ✅ 가장 성숙. OS 프리미티브 활용, appSlice 패턴 |
| Builder | 8 | ⚠️ 초기. NCP 뉴스 블록 등 |

**평가**: Todo는 **OS 위의 앱이 어떻게 동작하는지 보여주는 증명**. Builder는 아직 초기 단계.

---

### Layer 4: 테스트 인프라

| 항목 | 상태 |
|------|------|
| Playwright E2E (e2e/) | ✅ smoke + aria-showcase(9) + todo + builder + focus-showcase + playground |
| TestBot in-browser | ✅ window.__TESTBOT__ API |
| Playwright shim | ✅ src/inspector/testbot/playwright/ |
| Kernel 단위 테스트 | ✅ step1~4 + type-proof |
| OS 커맨드 테스트 | ✅ os-commands.test.ts (12KB) |

---

### Layer 5: 개발 도구

| 도구 | 상태 |
|------|------|
| Inspector (Cmd+D) | ✅ 8개 탭 (STATE, REGISTRY, EVENT_STREAM 등) |
| Vite plugins (spec-wrapper, babel-inspector) | ✅ |
| Command Palette (Cmd+K) | ✅ |

---

## 3. 선언문 vs 현실 간극 분석

| 선언문 | 현실 | 간극 |
|--------|------|------|
| G1. 핸들러 지옥을 끝낸다 | 커맨드 파이프라인 동작 중 | 🟢 핵심 구현 완료 |
| G2. OS의 질서 | Zone + roleRegistry로 보장 | 🟢 |
| G3. AI와 인간이 같은 도구 | TestBot + Inspector | 🟢 |
| G4. 접근성은 인프라 | roleRegistry의 ARIA preset | 🟡 role 커버리지 확장 필요 |
| G5. 단순한 프리미티브로 조립 | 7개 프리미티브 | 🟡 복합 패턴(Menu, Tree, Combobox) 미구현 |
| G9. 플랫폼 | 2개 앱 (Todo, Builder) | 🟡 더 많은 앱으로 증명 필요 |
| P7. 런타임 증명 | smoke + E2E 존재 | 🟡 커버리지 확장 필요 |
| W6. 자동화된 검증 | TestBot + Playwright | 🟡 shim 정합성 작업 진행 중 |

---

## 4. 결론 / 제안

**커널과 OS 코어는 완성되었다.** 선언문의 철학이 코드에 체현되어 있다.

다음 성장 축:
1. **프리미티브 확장** — Menu, Tree, Combobox 등 복합 ARIA 패턴
2. **앱 다양화** — Builder 성숙 + 새 앱으로 "플랫폼" 증명
3. **테스트 안정화** — TestBot-Playwright shim 정합성 완성

## 5. 해법 유형

🟡 **Constrained** — 코어는 완성. 남은 건 "확장"과 "증명"이며, 방향은 선언문이 이미 결정했다.

## 6. 인식 한계

- 이 분석은 파일 구조와 크기 기반의 정적 분석이다. 각 컴포넌트의 내부 완성도(edge case 처리, 버그 유무)는 확인하지 못했다.
- E2E 테스트 통과율은 직접 실행하지 않았다.

## 7. 열린 질문

1. 다음 프리미티브(Menu? Tree? Combobox?)의 우선순위는?
2. Builder 앱의 목표 스코프는 어디까지인가?
3. 세 번째 앱을 만든다면 무엇인가?

---

**한줄요약**: 커널과 OS 코어(7 프리미티브, 9 커맨드 도메인, 3 리스너, roleRegistry)는 완성 — 남은 건 복합 ARIA 패턴 확장과 더 많은 앱으로 "플랫폼" 선언을 증명하는 것.
