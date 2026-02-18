# Journey: 테스트 구조 컨벤션 논의

## 발단 — "테스트를 한눈에 보고 싶다"

**🧑 사용자**: 지금 어떤 테스트가 있는지를 모두 그룹화해서 시각적으로 볼 수 있는 페이지가 필요해

**🤖 AI**: 단순 목록이 아니라 OS가 자기 건강을 인식하는 능력이 필요한 것 같다. "시각적으로 본다"의 목적이 (A) 커버리지 확인, (B) OS 자체 진단 대시보드, (C) 테스트 러너 UI 중 어디에 가까운가?

---

## 레퍼런스 탐색 — "Vitest UI 별거 없네"

**🧑 사용자**: 예전에는 이런 거 다 커버리지 세우고 볼 수 있고... 가장 대표적인 레퍼런스가 뭐야?

**🤖 AI**: JUnit → Istanbul → Jest → **Vitest UI**(가장 현대적) → Storybook → Allure 계보 정리. Vitest UI가 가장 직접적인 레퍼런스.

**🧑 사용자**: vitest ui가 있으면 뭐가 좋은데 특별한 기능이 있어?

**🤖 AI**: 솔직히 핵심은 discovery → run → collect → render 4단계일 뿐. 특별한 건 Vite HMR 연동 정도. 결국 **"별거 없으면 우리가 직접 만들어도 되겠네"**라는 판단이 맞을 수 있다.

---

## 현실 파악 — 코드베이스 탐색

**🧑 사용자**: 네가 한번 살펴봐

**🤖 AI**: (코드베이스 전수 조사) 3개 레이어 발견:
- **Layer 1**: Vitest 단위 테스트 11개 파일 (todo, builder, os-commands, keybindings...)
- **Layer 2**: TestBot 브라우저 테스트 (focus-showcase 10개, Inspector 내장)
- **Layer 3**: Playwright E2E (e2e/ 디렉토리, 15개 spec)

빈 `/playground/tests` 라우트도 이미 존재. TestBot 인프라(`TestBot`, `TestActions`, `TestBotPanel`, `useTestBotRoutes`)도 이미 완성.

---

## 프레임 전환 — "테스트 ≠ 뷰어, 테스트 = 건강"

**🧑 사용자**: 사실 테스트를 모아보는 거보다 테스트가 곧 project의 진행도이나 건강 관리라서

**🤖 AI**: 프레임이 완전히 바뀌었다. "테스트 뷰어"가 아니라 **"프로젝트 건강 대시보드"**이고 테스트는 핵심 데이터 소스. Projects 페이지와 연결될 수 있다.

**🧑 사용자**: 일단은 그래도 테스트 전용 뷰어이면서도 프로젝트 단위이기도 하자 인거지

**🤖 AI**: 양자택일이 아니라 AND — 테스트 전용 뷰어 + 프로젝트 단위 그룹화.

---

## 구조 논쟁 — "Subtask 안에 Layer? Layer 안에 Subtask?"

**🧑 사용자**: 테스트의 layer 그리고 subtask — 그래서 컨벤션이 궁금해 subtask 안에 3layer 아니면 3layer 안에 sub?

**🤖 AI**: 두 옵션 비교:
- **A (Subtask > Layer)**: 기능별 검증 깊이를 보여주지만, Layer 간 1:1 매핑이 안 됨
- **B (Layer > Subtask)**: 현재 코드(`describe` = subtask, 파일 = layer)와 자연스럽게 일치

현실적으로 **B가 맞다**고 제안.

---

## FSD 응집도 — "Slice 안에 테스트"

**🧑 사용자**: FSD를 생각해보면 응집도가 Project > Epic? 암튼 그 안에 테스트가 맞겠지?

**🤖 AI**: FSD의 Slice 개념 적용. 이미 `apps/todo/tests/`, `apps/builder/tests/`가 이 패턴. 하지만 `e2e/`, `os/` 등은 흩어져 있다.

---

## 핵심 원칙 1 — "폴더구조 = 멘탈구조"

**🧑 사용자**: 아니 나는 폴더구조가 곧 멘탈구조라고 생각해 맞춰가야지

**🤖 AI**: 💥 이 한 문장이 모든 논의를 정리. 논리적 매핑 ❌, 메타데이터 태그 ❌, E2E 따로 ❌ — **물리적 파일 구조가 진실**이어야 한다.

---

## Lazy Nesting 제안 → 폐기

**🧑 사용자**: 하나의 slice에서 테스트가 몇 개나 나올까?

**🤖 AI**: 1개(docs-viewer)~19개(aria-showcase)까지 편차. Lazy Nesting 제안: "1개면 옆에, 2+면 tests/, 3+/layer면 tests/{layer}/"

---

## 핵심 원칙 2 — "Agent 시대, 편의보다 명시적"

**🧑 사용자**: Agent시대야 편의보다 명시적이지

**🤖 AI**: Lazy Nesting 폐기. **무조건 `tests/{unit,testbot,e2e}/`** — 에이전트가 제로 추론으로 작동해야 한다. 빈 폴더도 허용, "없음"도 명시적 신호.

---

## 결론 — 실행 순서 확정

**🧑 사용자**: 1 → 2 (마이그레이션 먼저, 대시보드 나중에)

확정된 구조:
```
{slice}/tests/{unit,testbot,e2e}/*.test.ts|*.spec.ts
```

Discovery: 단일 glob `src/**/tests/{unit,testbot,e2e}/*`

---

# Conclusion: Test Structure Convention

## Why
프로젝트에 테스트가 3개 레이어(Vitest Unit, TestBot, Playwright E2E)로 흩어져 있어 한눈에 파악이 불가능했다. 테스트는 단순 검증이 아니라 **프로젝트 건강/진행도의 핵심 지표**이므로, 이를 시각적으로 볼 수 있는 시스템이 필요했다.

## Intent
테스트 전용 뷰어를 만들되 프로젝트 단위로 그룹화하여, 각 프로젝트의 건강도를 한눈에 파악할 수 있는 대시보드를 구축한다. 이를 위해 먼저 **폴더 구조를 정비**하여 대시보드가 단순 glob으로 Discovery할 수 있게 한다.

## Warrants (논거)

### 철학 원칙
- **W1. OS Dogfooding**: 외부 프레임워크 없이 자체 프리미티브로 테스트한다
- **W6. 테스트 = 프로젝트 건강 지표**: 뷰어인 동시에 건강 관리 도구
- **W14. 폴더구조 = 멘탈구조**: 논리적 매핑이 아닌 물리적 구조가 진실
- **W19. Agent 시대, 편의보다 명시적**: 컨벤션에 예외 없어야 에이전트가 제로 추론으로 작동

### 구조 결정
- **W9. 계층**: Project → Layer → Subtask(describe) → Case
- **W10. Layer > Subtask**: 현재 코드가 자연스럽게 이 구조 (파일=레이어, describe=subtask)
- **W12. FSD 응집도**: 테스트는 기능 슬라이스 안에 co-locate
- **W20. 확정 구조**: `{slice}/tests/{unit,testbot,e2e}/`
- **W21. Discovery**: 단일 glob `src/**/tests/{unit,testbot,e2e}/*`

### 컨벤션
- **W15. 파일명 컨벤션**: `*.test.ts` = unit, `*.spec.ts` = e2e
- **W18. 확장자가 레이어 메타데이터**: 별도 config 불필요
- **W16. 슬라이스별 테스트 편차 (1~19개)** → 일률적 구조가 적합

## 실행 계획
1. **기존 테스트 파일 마이그레이션** — 흩어진 파일을 `tests/{layer}/` 구조로 이동
2. **테스트 대시보드 구축** — `/playground/tests` 페이지에서 프로젝트별 건강도 시각화

## Rules 추가 대상
- "폴더구조 = 멘탈구조"
- "Agent 시대, 편의보다 명시적"

## 한 줄 요약
> **"폴더구조=멘탈구조"와 "Agent시대 편의보다 명시적" 두 원칙으로, 모든 테스트를 `{slice}/tests/{unit,testbot,e2e}/`에 통일하고 대시보드로 프로젝트 건강도를 시각화한다.**
