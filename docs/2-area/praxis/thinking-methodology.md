# Thinking Methodology — 어떻게 판단하는가

> Living Document. 회고·discussion·판단교정에서 발견된 사고 방법론.

---

## 측정 후 판단 (Measure Before Judgment)

"Blocked"라고 판단하기 전에, 실제 변경 범위를 줄 단위로 세어라. 가정하지 말고 측정하라.

**사례**: OS Keybinding Architecture — 범위가 넓어 보여 "blocked" 판정했으나, 실제 측정하니 3줄 수정으로 해결.

**적용**: 범위 판단 시 grep으로 의존도를 확인하고, 줄 수를 세고, 그 다음에 판단한다.

---

## 표가 선행한다 (Contract-First via Decision Table)

코드→테스트(추인) 금지. 표→테스트→구현(계약) 필수.

LLM이 코드를 먼저 쓰면 습관대로 짠다. 표가 선행하면 여지가 없다. 행 수 = 테스트 수 = 바인딩 수로 동형을 강제한다.

**사례**: Decision Table Contract — 8열(Zone/Given/When/Intent/Condition/Command/Effect/Then) 표를 먼저 쓰자 누락이 즉시 드러남.

---

## 근본 원인을 먼저 (Root Cause Before Architecture Fix)

OS-level 메커니즘이 거짓 양성을 피할 수 없으면, 앱 레벨 책임으로 전가. 강제가 아닌 Safety Net 설계.

**사례**: Focus Recovery — 세 가지 경우(리렌더/조건부 렌더/실제 삭제)가 동일 시그널(ref null)을 발생. OS가 "삭제 의도"를 감지할 수 없다는 근본 한계 발견.

---

## Allowlist > Blocklist

Blocklist("나열하지 않은 것 = 상대에게 넘긴다")는 의도치 않게 넘어갈 수 있다. Allowlist("명시적으로 넘기는 것만 나열")이 항상 더 안전.

**적용**: 키보드/UI 소유권, 보안 권한 등 ambiguous하기 쉬운 영역은 항상 allowlist.

---

## tsc 통과 ≠ 런타임 정상

삭제된 파일을 참조하는 코드가 dead code라 TS가 체크 안 함. Vite dev 서버는 lazy하게 모든 import를 resolve하므로 dead code여도 크래시.

**적용**: 파일 이동/삭제 후에는 반드시 스모크 테스트(E2E)까지 돌리기.

---

## 리팩토링은 측정 가능한 개선일 때만

import 수, 코드 줄 수, 중복 맵 수, 의존 방향 수 — 하나 이상이 strictly 개선되고, 나머지가 악화되지 않아야 한다. 등가 교환이면 하지 않는다.

**사례**: OCP Violations — import -10, 코드 -142줄, 중복 맵 2→1로 명확한 개선 증거.
