# Todo E2E 테스트 전략 전환 — 대화 여정

| 항목 | 내용 |
| :--- | :--- |
| **날짜** | 2026-02-12 |

---

**🧑 사용자**: 아니 e2e는 내부 로직을 전혀 모르게짜야지 todo를 작성해.

**🤖 AI**: 맞습니다. 현재 `TodoBot.tsx`나 `e2e-harness.ts`는 커널 내부에 직접 의존하고 있으니 진짜 E2E가 아닙니다. Playwright로 블랙박스 E2E를 작성하겠습니다.

---

**🧑 사용자**: 이제 e2e는 playwright에서만 작성하고 테스트 봇은 시각화만 하게 할거야

**🤖 AI**: TestBot "시각화만"의 형태는? (a) Playwright spec을 브라우저에서 리플레이? (b) assert 없는 데모 러너? (c) 녹화 뷰어? 그리고 `e2e-harness.ts`는?

**🧑 사용자**: 1a, 2는 제거

---

**🤖 AI**: 변환 메커니즘은? (i) 빌드타임 IR 변환 vs (ii) 기존 ShimPage 활용?

**🧑 사용자**: vite-plugin을 이용한 shim 기반이야.

---

**🤖 AI**: 1차 E2E 범위 — 기존 TodoBot의 7개 피처를 전부 옮길지, 코어만 먼저 할지?

**🧑 사용자**: 필요없는거 다 빼고 최소한의 마우스와 대부분의 키보드 동작으로 먼저 만들고 너무 앞서가는것들은 다 제거해 노이즈야

**🤖 AI**: CRUD + 키보드 네비게이션 코어만 1차 스코프로 제안. Undo/Redo, Multi-Select, Board View 등은 제외.

**🧑 사용자**: 좋아. 닫고 진행하자

---

**한 줄 요약**: "E2E는 블랙박스여야 한다" → Playwright 일원화 + TestBot은 vite-plugin shim 시각화만 + 1차는 키보드 코어만이라는 결론에 4턴 만에 도달.


---

# Todo E2E 테스트 전략 전환 — 결론

| 항목 | 내용 |
| :--- | :--- |
| **날짜** | 2026-02-12 |
| **참여** | User, AI |

---

## Why

현재 TodoBot(화이트박스)은 커널 내부 커맨드를 직접 호출하여 E2E라고 부르기 어렵다. 진짜 E2E는 사용자 관점에서 **내부 로직을 전혀 모르는 블랙박스**여야 한다.

## Intent

Playwright spec을 **E2E 테스트의 single source of truth**로 일원화하고, TestBot은 vite-plugin shim을 통해 동일 spec을 **브라우저에서 시각적으로 리플레이**하는 역할만 수행한다.

## Warrants

| # | Warrant |
| :--- | :--- |
| W1 | E2E는 내부 로직을 전혀 모르는 블랙박스여야 한다 |
| W2 | 현재 TestBot은 커널 직접 호출하는 화이트박스 → 진짜 E2E가 아님 |
| W3 | TestBot의 브라우저 내 시각화 UI는 개발 디버깅에 유용 → 가치 보존 |
| W4 | Playwright = CI 회귀 테스트, TestBot = 인터랙티브 시각화로 관심사 분리 |
| W5 | Playwright spec이 single source of truth → 시나리오 중복 제거 (DRY) |
| W6 | `e2e-harness` 제거 → 블랙박스 원칙 위반하는 뒷문 없앰 |
| W7 | vite-plugin shim이 Playwright API ↔ 브라우저 DOM API 변환 → 하나의 spec으로 양쪽 실행 |
| W8 | 1차 범위 = 최소 마우스 + 키보드 코어만. 미구현/미래 기능은 노이즈 |

## 결정 사항

| 항목 | As-Is | To-Be |
| :--- | :--- | :--- |
| E2E 테스트 | `TodoBot.tsx` (화이트박스) | `e2e/todo/todo.spec.ts` (Playwright 블랙박스) |
| CI 실행 | ❌ | `npx playwright test` |
| 브라우저 시각화 | TodoBot 자체 시나리오 | vite-plugin shim으로 spec 리플레이 |
| `e2e-harness.ts` | `window.__todo` 노출 | 🗑️ 제거 |
| `TodoBot.tsx` | 724줄 테스트 시나리오 | 🗑️ 제거 (spec이 대체) |

## 1차 E2E 스코프

**마우스** (최소): 카테고리 클릭 전환, Draft 포커스

**키보드** (코어):
- 네비게이션: `↑↓`, `Tab`
- 생성: 타이핑 + `Enter`
- 토글: `Space`
- 편집: `Enter` → 수정 → `Enter`/`Escape`
- 삭제: `Backspace` + 포커스 복구
- 순서: `⌘↑` `⌘↓`
- 클립보드: `⌘C` `⌘V`
- 사이드바: `Enter`/`Space`, `⌘↑` `⌘↓`

**제외**: Undo/Redo, Multi-Select, Board View, 컨텍스트 메뉴, 커맨드 팔레트, 뷰 전환

---

**한 줄 요약**: Todo E2E 테스트를 Playwright 블랙박스로 일원화하고, TestBot은 vite-plugin shim 기반 시각적 리플레이어로 역할을 축소하며, 1차 범위는 현재 동작하는 키보드 코어 인터랙션에 한정한다.
