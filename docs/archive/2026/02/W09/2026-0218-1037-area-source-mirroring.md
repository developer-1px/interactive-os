# Discussion: Area 소스코드 미러링 & 프로젝트 관리 재설계

## Journey

**🧑 사용자**: project가 너무 짧아. area가 구성이 너무 flat해. 폴더구조와 전체 현황판을 함께 동기화 하는 프로젝트 전체 관리가 필요해.

**🤖 AI**: 현재 24개 프로젝트가 1~3일 수명. Area 13개가 flat. STATUS.md와 폴더 구조가 수동 동기화. "Code is the Design" 원칙 — 별도 설계 문서는 코드와 괴리된다.

---

**🧑 사용자**: 소스코드와 기획을 맞춰가는 게 좋지 않나. 폴더구조가 곧 기획의 구조가 되는 게 좋겠다.

**🤖 AI**: g3doc(Google), C4 Model, ADR, Living Documentation 등 업계 패턴 제시. Co-location vs Mirror 두 가지 접근 제안.

---

**🧑 사용자**: docs는 코드와 분리되어 따로 관리되어야 한다고 생각하는데.

**🤖 AI**: 솔직한 답 — co-location이 나은 문서와 separation이 나은 문서가 다르다. 핵심: **docs는 분리하되, docs 트리를 소스 트리와 동형(isomorphic)으로 맞추는 Mirror 패턴**.

---

**🧑 사용자**: PARA는 에이전트가 문서를 다룰 때 유용한 분류 방식이야. 더 유용한 방식이 있어?

**🤖 AI**: 비교 분석 결과 PARA가 에이전트에게 가장 적합. 문제는 PARA 자체가 아니라 내부 configuration — Area의 flat 구조, Project 단위 정의.

---

**🧑 사용자**: PARA는 지식으로 가고 PM식 문서 구조는 따로 관리하면 되잖아.

**🤖 AI**: PARA의 P+backlog = PM 축, A+R = 지식 축 — 이미 암묵적으로 두 축이 공존. 명시적 분리 제안.

---

**🧑 사용자**: project는 당분간 지금처럼 가고 area에서 지식과 project를 분리하고 project는 코드 레벨로 가자.

**🤖 AI**: 확정 — Area = 순수 지식(영속), Project = 진행 중 작업(일시적). Area는 소스코드 미러.

---

**🧑 사용자**: area도 소스코드가 커질수록 현행화되어야 하는데 project가 끝날때마다 area 업데이트가 전혀 안되고 있어.

**🤖 AI**: 24개 프로젝트 완료 동안 Area가 stale. 소스코드 미러 구조의 진짜 가치 = 코드 변경 → Area 갱신 경로가 자동 결정.

---

**🧑 사용자**: /archive를 더 자세하게 워크플로우를 작성하고 project를 단순 아카이브로 보내는게 아니라 area에 들어가고 resource로 정리해서 보내는 기능. /retire를 별도 워크플로우로.

**🤖 AI**: 3개 워크플로우 재정의 — `/archive`(지식 환류), `/retire`(문서 퇴출), `/para`(내부에서 /archive 호출).

> **한 줄 요약**: "프로젝트가 짧다"는 불만에서 시작해, PARA 유지 + Area 소스코드 미러링 + /archive 지식 환류 워크플로우로 수렴.

---

## Conclusion

### Why
프로젝트 완료 시 지식이 archive로 매몰되고, Area가 소스코드 변화를 반영하지 못해 "두 개의 진실 원천"이 발생.

### Intent
PARA 프레임워크를 유지하면서, Area를 소스코드 구조와 동형으로 재편하고, 프로젝트 완료 시 지식을 자동으로 Area/Resource에 환류하는 시스템 구축.

### Warrants
1. 프로젝트 수명 1~3일 → Task 수준이지 Project가 아님
2. Area가 flat → 소스코드 구조와의 매핑 불가
3. STATUS.md ↔ 폴더 수동 동기화 → drift
4. "Code is the Design" — 별도 트리면 괴리
5. PARA는 에이전트에게 가장 적합한 분류 체계
6. 문제는 PARA 자체가 아니라 내부 configuration
7. g3doc, Living Docs, C4, ADR — 검증된 패턴
8. co-location/separation은 문서 종류별 하이브리드가 합의
9. Mirror 패턴 — docs 분리 + 소스 구조 동형
10. 소스코드 미러 구조의 핵심 가치 = 코드 변경 → Area 갱신 경로 자동 결정
11. `/archive`는 "지식 분배"로, `/retire`는 "문서 퇴출"로 관심사 분리

> **한 줄 요약**: PARA를 유지하되 Area를 소스코드와 동형으로 미러링하고, 프로젝트 완료 시 `/archive`로 지식을 환류함으로써 "코드는 바뀌는데 문서는 멈춰있는" 문제를 구조적으로 해결한다.
