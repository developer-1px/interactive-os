# Builder Interaction Spec — Cursor/Selection/DrillDown 정리

> Discussion: 2026-02-24 17:16~17:39

## Journey

**🧑 사용자**: 빌더에서 Cursor, Selection, drill down/up 처리를 LLM이 엄청 꼬아놨다. 하나씩 우아하게 풀자.

**🤖 AI**: 6개 파일에 걸쳐 관심사가 산재. Scope가 암묵적 파생 (DOM data-level에서 매번 파생), 파생 체인 4단계.

---

**🧑 사용자**: race condition이 없는데 왜 조건대로 개발하는데 꼬이는 건지 이해가 어렵다.

**🤖 AI**: Rich Hickey의 "complecting" — 각 규칙은 맞지만 규칙 사이의 관계가 명시되지 않음. LLM은 로컬하게 올바른 코드를 생산하지만 전체 관계를 인식하지 못함.

---

**🧑 사용자**: 우리는 headless OS야. DOM 없이 다 정의할 수 있게 만들었는데, 어느 순간부터 BDD도 안 하고 TDD도 안 하네?

**🤖 AI**: (핵심 전환점) 문제는 코드 구조가 아니라 개발 프로세스. headless 인프라가 있는데 쓰지 않고 있었다.

---

**🧑 사용자**: /go에서도 테스트를 안 하는데? 왜 워크플로우가 작동 안 하나?

**🤖 AI**: 증거 발견: cursor-ocp 7 태스크 새 테스트 0개. builder-v2 T15~T17 테스트 수 980 불변. Gate는 텍스트일 뿐 검증 메커니즘 없음.

---

**🧑 사용자**: /project에 BDD를 쓰는 것까지를 완료로 보게 할까?

**🤖 AI**: WHAT(시나리오)과 HOW(구현)를 /project와 /go로 분리. /project 산출물 = BOARD.md + Red 테스트.

→ `/project.md`, `/go.md` 워크플로우 수정 완료.

---

**🧑 사용자**: 시나리오 정정. Enter=drillDown, ESC/\=drillUp, 부모 없으면 탈출, 탈출=focusedItemId=null.

**🤖 AI**: ESC와 \는 같은 연산: "drill up, 부모 없으면 탈출." dismiss 경로 제거, drillUp의 terminal case로 통합. 엔트로피 감소.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | 빌더 상호작용은 **3상태(Deselected/Selected/Editing) + 1규칙(drill up, 부모 없으면 탈출)**로 완전히 기술된다. 이 스펙을 `/project`에서 Red 테스트로 인코딩한 후 `/go`로 구현한다 |
| **📊 Data** | 현재 ESC가 모든 레벨에서 deselect (스펙 불일치), .feature 3개/전체, 테스트 수 불변 (Gate 미작동) |
| **🔗 Warrant** | LLM이 꼬이는 이유는 race condition이 아니라 통합 BDD 시나리오 부재. headless 테스트 인프라는 있으나 미사용. Gate가 텍스트여서 강제되지 않음 |
| **📚 Backing** | TDD (Kent Beck), re-frame의 event→db→view 모델, Rich Hickey "Simple Made Easy" (complecting), rules.md #17 "완료=Red→Green" |
| **⚖️ Qualifier** | **Clear** — 스펙 확정, 구현 경로 명확 |
| **⚡ Rebuttal** | 워크플로우를 바꿔도 LLM이 /project 단계에서 Red 테스트 작성을 빼먹을 수 있음. 최소 3중 Gate(project/go Phase1/go Phase3)로 방어 |
| **❓ Open Gap** | Edit 모드 마우스 동작("Text 클릭=edit 유지, 다른 곳 클릭=select 유지")의 OS 레벨 구현 방법은 /go에서 설계 |

### 확정된 동작 스펙

**키보드:**

| 상태 | Enter | ESC / `\` | printable char |
|------|-------|-----------|---------------|
| Deselected | — | — | — |
| Section 포커스 | Drill down | 탈출 (focusId=null) | — |
| Group 포커스 | Drill down | Drill up → 부모 | — |
| Item 포커스 | Edit 시작 | Drill up → 부모 | Edit 시작 |
| Editing | 필드에 위임 | Commit → Item 포커스 | 필드에 위임 |

**마우스:**

| 현재 모드 | 클릭 대상 | 결과 |
|-----------|----------|------|
| Editing | Text 아이템 | Edit 유지 (대상 전환) |
| Editing | Non-text | Select 유지 (edit 종료) |
| Selected | 아이템 | Select (포커스 이동) |
| Selected | 같은 아이템 재클릭 | Drill down |
| Deselected | 아이템 | Select (재진입) |

**핵심 규칙:** ESC와 `\`는 같은 연산 = drill up. 부모 없으면 탈출 (focusedItemId=null, activeZoneId 유지).

### 워크플로우 변경 (이미 적용됨)

- `/project.md`: 6단계 Red 테스트 작성 추가. 프로젝트 초기화 DoD = BOARD.md + Red 테스트.
- `/go.md`: Phase 1에서 Red 테스트 존재 확인, Phase 2에서 .feature 단계 제거, Phase 3은 Green부터 시작.
