# Discussion — ARIA Role vs. Behavior-First Zone

> 2026-02-16 20:30 ~ 20:36

---

## Journey

**🧑 사용자**: todo에 typeahead가 있으면 안되는것 같은데. /doubt를 해

**🤖 AI**: /doubt 수행 → `role: "listbox"` preset이 `typeahead: true`를 기본 적용. Todo는 동적 사용자 작업 목록이라 알파벳 typeahead가 부적합. ARIA APG에서 typeahead는 "recommended"지 "required"가 아님. 정적 선택 목록(국가 선택, 파일 브라우저)에 적합한 기능.

**🤖 AI**: `zone.bind()`에 `options: { navigate: { typeahead: false } }` override 추가하여 수정. tsc/507 tests clean.

---

**🧑 사용자**: LLM이 잘 아는 ARIA는 제공하지만, ARIA로 앱을 개발하는 것에 대해서는 불일치가 많다. role을 쓰는게 아니라 요구사항에 맞게 만드는 과정을 해야 하지 않을까?

**🤖 AI**: 핵심 진단 — **인과관계가 뒤집혀 있다.**
- 현재: `ARIA Role → 행동 결정 → 안 맞으면 override`  
- 올바른 방향: `요구사항 → 행동 결정 → ARIA Role은 접근성 어노테이션`

ARIA 스펙 원문 확인:
- Role은 "이것이 무엇인가"(시맨틱). 행동 아님.
- APG 키보드 패턴은 "SHOULD" (해도 되고 안 해도 됨)
- 우리 OS가 SHOULD를 MUST로 격상시킨 것이 문제

---

**🧑 사용자**: role을 preset이 아니라 behavior를 만들어서 제공하되 role을 통해서 preset으로 만드는게 좋지 않을까? aria의 role이라고 해서 반드시 이렇게 동작해야 한다고 정의되는게 과연 맞는 건가?

**🤖 AI**: 잘못 생각한 것이 아니다. ARIA 스펙 자체가 그렇게 말한다. Role ≠ 행동 정의.

제안 구조:
- **Layer 1**: Behavior 원자(primitives) — 독립적으로 존재, 조합 가능
- **Layer 2**: Role = behavior 조합의 편의 별명(preset)
- **Layer 3**: 앱 개발자가 사용 (role preset 또는 직접 조합)

핵심 전환: **부정형(빼기) → 긍정형(넣기)**
- 현재: "listbox인데 typeahead는 빼줘"
- 제안: "이 행동들을 원해" (안 넣으면 없음)

---

**🧑 사용자**: 프로젝트로 진행해. 우리는 다시 만들지 않을 OS를 만드는 중이야.

> 한 줄 요약: Todo의 typeahead 버그에서 시작하여, ARIA role이 앱 행동의 원인이 아니라 결과여야 한다는 아키텍처 원칙을 발견했다.

---

## Conclusion

### Why
ARIA Role이 앱 행동을 결정하는 현재 구조는 인과관계가 뒤집혀 있다. Role은 접근성 어노테이션(결과)이지, 행동의 원인이 아니다.

### Intent
Behavior를 독립적 원자(primitive)로 만들고, Role은 그 조합의 편의 preset으로 재정의한다. 앱 개발자는 요구사항에 따라 behavior를 선택하고, ARIA role은 스크린리더를 위한 어노테이션으로만 사용한다.

### Warrants
1. ARIA는 접근성 계약이지 앱 행동 명세가 아니다
2. APG의 SHOULD를 rolePreset에서 MUST로 격상시킨 것이 문제
3. Todo typeahead 실증 — 올바른 ARIA가 잘못된 앱 행동을 만들었다
4. LLM의 ARIA 지식이 잘못된 확신을 강화한다
5. 인과관계 역전이 근본 원인 — Role→Behavior가 아니라 Behavior→Role
6. 행동 블록 합성이 role preset의 DX 편의성을 대체할 수 있다
7. ARIA 스펙 원문이 이 방향을 지지한다 — role은 시맨틱, 행동은 SHOULD≠MUST
8. 부정형(빼기) → 긍정형(넣기) 전환이 투명성을 근본 개선

> **한 줄 결론**: Behavior가 1급 시민이고, Role은 편의 별명이다. 앱 행동은 요구사항에서 도출하고, ARIA는 어노테이션한다.
