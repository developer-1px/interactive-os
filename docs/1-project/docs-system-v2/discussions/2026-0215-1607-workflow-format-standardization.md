# Discussion: 워크플로우 포맷 표준화 — Journey

---

**🧑 사용자**: `/discussion` 워크플로우 점검을 하고 싶어

**🤖 AI**: 현재 워크플로우와 실제 산출물을 대조 분석. `11-discussions/` 경로 모순, 5갈래 라우팅 vs Step 3 모순 등 구조적 불일치를 발견. 업계 표준 문서와 33개 워크플로우를 매핑하여 중복과 리추얼을 식별함.

---

**🧑 사용자**: 아니야. 나는 더 세부적인 디테일을 잡고 싶은거야. 검증 파이프라인은 각각이 다른 역할을 하고 필요에 맞게 선정하는게 필요하단말야. 나머지도 전부 그 세부 디테일이 다른 이유가 있는거야

**🤖 AI**: 방향 전환. 각 워크플로우의 존재 이유를 인정하고, 업계 표준에서 흡수할 구체적 디테일을 식별: `/review`에 피드백 유형 분류, `/tdd`에 AC 형식, `/project`에 ADR, `/issue`에 재현 단계, `/divide`에 분해 축 예시, `/changelog`에 타입 목록, `/verify`에 번들 사이즈, `/project` closing에 릴리스 노트 형식.

---

**🧑 사용자**: 나는 제안서와 prd의 세부 디테일이 부족하다 느껴졌어. 테스트 코드를 작성했는데 정작 요구사항의 누락이 많더라고 개발 제안은 훌륭한데 말야

**🤖 AI**: 핵심 문제 추적: WHY(Discussion) → WHAT(README, 추상적) → HOW(proposal, 상세)에서 **세부 WHAT** 단계가 빠져 있다. todo multi-select 클립보드 버그를 실제 사례로 분석 — "단일 복사는 덮어쓰기, 다중 복사는 추가" 시나리오가 정의되어 있었으면 /tdd에서 잡았을 것. 해법으로 기능별 Acceptance Criteria + 상태 인벤토리 + 엣지 케이스 목록 제안.

---

**🧑 사용자**: prd라는 새로운 workflow를 만들자

**🤖 AI**: Open 질문 3개 제시: 저장 위치(프로젝트 1파일 vs 기능별), Light 트랙 적용 여부, 트리거(자동 vs 수동).

---

**🧑 사용자**: 나는 prd 관리가 정말 중요하다 생각해. 회사에서도 중심이 되어줄 문서가 필요한데 예전에는 개발자가 소스가 진실의 원천이 되는 경우가 많았단 말야. 하지만 현실에서는 prd가 항상 기준이 되어 주어야 하는거 아니겠어?

**🤖 AI**: Known 확인. "소스 코드는 What IS, PRD는 What SHOULD BE." 이 원칙으로 3개 Open이 자동 결정됨: 프로젝트 루트 1파일, Light에서도 필수, /project Phase 2 자동 트리거. 파이프라인 확정: PRD → Test → Code.

→ `/prd` 워크플로우 생성, `/project`에 Step 6 추가, `/tdd` PRD 참조 필수화.

---

**🧑 사용자**: prd 작성전 유즈케이스나 스토리 그리고 BDD (given when then)도 넣어주고 싶은데 prd와 겹쳐? 아니면 별개라 생각해? 순서는?

**🤖 AI**: Known. User Story/Use Case/BDD는 추상도가 다른 같은 것 — 별도 문서가 아니라 PRD 내부 형식. 순서: Story(누가, 왜) → Use Case(상세 흐름) → BDD Given/When/Then(테스트 가능 스펙). BDD의 핵심 가치: Given이 전제 조건을 **강제**하여 요구사항 누락을 방지. todo 클립보드 버그는 "Given 기존 클립보드에 항목이 있을 때"를 생각하지 않아서 발생.

→ PRD 템플릿을 Story → Use Case → BDD Scenarios 구조로 개편. 엣지 케이스 섹션 제거(BDD Scenario에 흡수).

---

**🧑 사용자**: 마지막으로 지금처럼 포맷을 더 구체적으로 명시하면 좋겠는 워크플로우가 있나봐봐 특히 이렇게 검증된 표준화된 방식

**🤖 AI**: 5개 워크플로우 식별:
1. `/issue` — 재현 단계 + Expected/Actual (버그 리포트 표준)
2. `/review` — 심각도 × 의도 2축 (Blocker/Suggest/Question/Nitpick/Praise)
3. `/project` proposal — ADR 포맷 (Context/Decision/Alternatives+기각 사유/Consequences)
4. `/changelog` — Conventional Commits 타입 목록 명시
5. `/diagnose` — 5 Whys 근본 원인 분석

---

**🧑 사용자**: 전부 반영해

→ 5개 워크플로우 모두 업데이트 완료.

---

### 한 줄 요약

워크플로우 점검에서 출발하여, 요구사항 누락의 근본 원인(세부 WHAT 부재)을 발견하고, PRD를 진실의 원천으로 확립한 뒤, 6개 기존 워크플로우에 업계 표준 포맷을 주입했다.

---

## Conclusion

### Why
워크플로우 33개의 산출물 포맷이 자유 형식이거나 추상적으로만 기술되어 있어, AI가 매번 다른 구조로 작성하고 정보가 누락되는 문제가 있었다. 특히 요구사항 정의 단계가 부재하여, 테스트 코드를 작성해도 정작 요구사항 자체가 빠지는 구조적 결함이 있었다.

### Intent
각 워크플로우의 존재 이유는 유지하면서, 업계 검증 표준 포맷을 흡수하여 산출물의 정밀도와 일관성을 높인다.

### Warrant 전체 구조

1. `/project` 파이프라인은 업계 표준 10 Phase를 1인 개발에 맞게 잘 압축하고 있다 (Known)
2. `/verify`가 CI 역할을 충실히 대체하고 있다 (Known)
3. Known/Open 분류 체계가 Triage 역할을 하고 있다 (Known)
4. 각 워크플로우는 서로 다른 역할과 관점을 가지며, 표면적 중복이 아닌 역할 분리다
5. 현재 흐름에서 WHY(Discussion) → WHAT(README, 추상적) → HOW(proposal)로 이어지는데, WHAT의 세부 디테일(시나리오, 상태, 엣지 케이스)을 담는 구조가 없다
6. 소스 코드는 "What IS"를 말하지만 "What SHOULD BE"는 말하지 않는다. PRD가 있어야 버그와 의도를 구분할 수 있다
7. AI 협업에서 PRD가 모호하면 AI가 가정으로 빈칸을 채우고, 그 가정은 리뷰되지 않는 유령 요구사항이 된다
8. 테스트가 코드에서 파생되면 순환 논증이다. PRD → Test → Code 순서가 올바르다
9. User Story/Use Case/BDD는 추상도가 다른 같은 것 — 별도 문서가 아니라 PRD 내부 형식이다
10. BDD Given/When/Then이 flat AC보다 정밀하다 — Given이 전제 조건을 강제하여 빠진 조건을 드러낸다
11. 포맷이 자유 형식이면 AI가 매번 다른 구조로 작성하고 정보 누락이 발생한다. 포맷이 강제되면 빠뜨릴 칸이 눈에 보인다

### 실행 결과

| 변경 | 파일 | 핵심 |
|------|------|------|
| 신규 | `prd.md` | PRD = 진실의 원천. Story → Use Case → BDD G/W/T 구조. /redteam → /reflect 검증 |
| 수정 | `project.md` | Phase 2에 /prd 필수 단계 추가 + proposal ADR 포맷 |
| 수정 | `tdd.md` | PRD 참조 필수화 (조건부 → 필수) |
| 수정 | `issue.md` | 재현 단계 + Expected/Actual 분리 |
| 수정 | `review.md` | 심각도 × 의도 2축 분류 |
| 수정 | `changelog.md` | Conventional Commits 타입 목록 명시 |
| 수정 | `diagnose.md` | 5 Whys 근본 원인 분석 |

### 한 줄 요약

**PRD를 진실의 원천으로 확립하고(Story → Use Case → BDD), 6개 기존 워크플로우에 업계 표준 포맷(재현 단계, ADR, 심각도×의도, Conventional Commits, 5 Whys)을 주입하여 AI 산출물의 정밀도와 일관성을 구조적으로 보장한다.**
