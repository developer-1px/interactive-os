# Quality Improvement Reference

> 품질 개선과 낭비 제거, 회고에 사용하는 기법 모음.

---

## Lean 7 Muda (7가지 낭비)

> 가치를 만들지 않는 활동을 7가지 유형으로 분류하여 식별·제거하는 프레임워크.

**출처**: Taiichi Ohno (Toyota Production System, 1978)

| 낭비 유형 | 질문 |
|----------|------|
| 과잉생산 (Overproduction) | 아무도 안 쓰는데 미리 만들었나? |
| 재고 (Inventory) | 실행 안 된 채 쌓여만 있나? |
| 과잉처리 (Over-processing) | 필요 이상으로 정교하지 않나? |
| 운반 (Transport) | 불필요하게 이동/복사하고 있나? |
| 동작 (Motion) | 같은 정보를 반복 입력하나? |
| 대기 (Waiting) | 결정 대기로 멈춰 있나? |
| 결함 (Defects) | 현실과 불일치하나? |

**우리의 용법**: `/doubt`의 판단 렌즈. 필터 체인(Existence → Fit → Volume → Efficiency)에서 판단이 모호할 때, 7 Muda 유형으로 분류하여 해당 항목이 가치를 만드는지 검증한다. "모든 산출물은 부채다" (Project #8)와 연결: 코드, 문서, 워크플로우 — 존재하는 것은 정당화되어야 한다.

**참조**: `/doubt` Lean 7 Muda 렌즈, `.agent/rules.md` Project #8

---

## Subtract (뺄셈 사고)

> 인간은 문제 해결 시 체계적으로 뺄셈을 간과한다. "더하기"가 기본값이므로, "빼기"를 의식적으로 트리거해야 한다.

**출처**: Leidy Klotz (Subtract: The Untapped Science of Less, 2021, University of Virginia)

**우리의 용법**: `/doubt` 워크플로우 자체가 이 책의 "의식적 트리거"를 구현한 것. "빼는 것도 선택지다"라는 `/doubt`의 부제가 이 원칙을 요약. 모든 것(코드, 워크플로우, 문서, 프로젝트 구조, 기능, 절차)을 의심의 대상으로 삼고, 제거/축소 후보를 적극적으로 탐색한다. Chesterton's Fence가 "무분별한 뺄셈"의 균형추 역할.

**참조**: `/doubt` 이론적 기반

---

## KPT (Keep-Problem-Try)

> 회고 프레임워크. Keep(유지할 것), Problem(문제), Try(시도할 것)로 분류하여 개선점을 도출한다.

**출처**: Agile 회고 실천 (일본 Agile 커뮤니티에서 널리 사용, Alistair Cockburn의 Reflection Workshop과 유사)

**우리의 용법**: `/retrospect`의 구조적 골격. 세 관점(개발 과정, AI 협업 과정, 워크플로우)에서 각각 KPT를 수행한다.

| 분류 | 의미 | 행동 |
|------|------|------|
| **Keep** 🟢 | 효과적이었다 | 계속 유지 |
| **Problem** 🔴 | 아쉬웠다 | 구체적 개선 행동으로 귀결 |
| **Try** 🔵 | 다음에 시도할 것 | MECE 카테고리로 분류 → 즉시 반영 |

각 관점의 KPT 완료 후 자가 점검(🪞): "위 평가가 rules.md 원칙에 비추어 정직한가?" Try를 MECE 액션 아이템으로 변환하고, 🔴 즉시 항목부터 `.agent/workflows/`, `.agent/rules.md`, `docs/` 등에 반영. 미반영 0건이 목표.

**참조**: `/retrospect` 전체, `/go` 회고 단계

---

## Conventional Comments

> 코드 리뷰 코멘트에 의도 라벨을 붙여, 수신자가 코멘트의 심각도와 기대 행동을 즉시 파악하게 하는 규약.

**출처**: conventionalcomments.org (Paul Shortino)

| 라벨 | 의미 |
|------|------|
| `[Blocker]` | 반드시 수정해야 머지 가능 |
| `[Suggest]` | 개선 제안, 선택적 |
| `[Question]` | 이해를 위한 질문 |
| `[Thought]` | 생각 공유, 행동 불필요 |
| `[Nitpick]` | 사소한 스타일 지적 |
| `[Praise]` | 좋은 코드에 대한 칭찬 |

**우리의 용법**: `/review`의 이론적 기반. 보고서 모드에서 위반 사항을 심각도(🔴 철학 위반 / 🟡 네이밍·구조 / 🔵 개선 제안) × 의도(Conventional Comments 라벨) 2축으로 분류한다. 라벨이 있으면 수신자(사용자)가 "이걸 꼭 고쳐야 하나?"를 즉시 판단할 수 있다.

**참조**: `/review` 이론적 기반, `/review` Step 4 (위반 발견 시)

---

## Double-Loop Learning (이중 순환 학습)

> Single-loop는 규칙을 따르는 것. Double-loop는 규칙 자체를 질문하고 진화시키는 것.

**출처**: Chris Argyris (Organizational Learning, 1978, Harvard Business School)

**우리의 용법**: `2-area/praxis/`의 존재 이유. 워크플로우(`.agent/workflows/`)는 절차(single-loop: "이렇게 해라"), rules.md는 규칙(single-loop: "이것을 지켜라"), 그러나 "왜 이렇게 하게 됐는가"는 기록되지 않았다. `2-area/praxis/`가 double-loop의 기록: 회고에서 나온 교훈, discussion에서 나온 방법론 발견, LLM 판단 교정에서 나온 암묵지→명시지 전환. `/retrospect`에서 워크플로우를 수정하는 행위 자체가 double-loop learning의 실천.

**참조**: `docs/4-archive/2026/02/W09/area-praxis-BOARD.md`, `docs/4-archive/2026/02/W09/2026-0226-area-knowledge-redesign.md`
