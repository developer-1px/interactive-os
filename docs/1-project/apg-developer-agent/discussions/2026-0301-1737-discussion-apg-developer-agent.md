# Discussion: APG Developer Agent POC

> **Date**: 2026-03-01
> **Type**: Discussion → Project
> **Cynefin**: Clear
> **Next**: /go → /plan → /project

---

## Journey

**🧑 사용자**: 클로드 에이전트를 만든다면 어떤 걸 만들 수 있을까?

**🤖 AI**: Interactive OS의 역량과 Claude 에이전트의 교차점에서 차별화된 것을 찾아야 한다. 범용 에이전트 vs 프로젝트 특화 에이전트?

---

**🧑 사용자**: 우리 규칙을 무조건 따르는 방식으로 코드를 작성하라고 하는 에이전트?

**🤖 AI**: 이 프로젝트의 규칙 시스템(rules.md + design-principles + 40+ 워크플로우)은 이미 "에이전트 운영체제"로 기능하고 있다. A(Interactive OS 전용) vs B(범용 프레임워크)?

---

**🧑 사용자**: 프레임워크는 내가 만들거야. 문제는 LLM이 학습하지 않으면 이미 학습된 모델의 방법과 충돌이 나는 것.

**🤖 AI**: 핵심 전환점. 문제는 규칙이 아니라 **LLM 사전학습 패턴과 OS 패러다임의 구조적 충돌**이다. useState/onClick vs Zone/Command 선언.

---

**🧑 사용자**: 충돌 마찰: 핸들러를 쓰는 것, 이미 있는 기능을 또 구현하는 것.

**🤖 AI**: 두 마찰의 원인이 같다 — "OS가 뭘 제공하는지 모른다." LSP가 인간에게 하는 것을 컨텍스트가 LLM에게 해야 한다.

---

**🧑 사용자**: 클로드코드에 스킬과 에이전트 기능이 있잖아? 그걸 말한건데?

**🤖 AI**: Claude Code의 커스텀 에이전트(`.claude/agents/`) + 스킬(`.claude/skills/`) + Hooks로 구현 가능. 조사 결과: 시스템 프롬프트, 도구 제한, 스킬 사전 적재, 모델 선택 모두 지원.

---

**🧑 사용자**: 에이전트가 개발을 할거라고 기대했는데? 제시만 하면 되는 게 아니라.

**🤖 AI**: 근본 전환. 컨설턴트(레시피 제시)가 아니라 **직접 코드를 쓰는 전문 개발자 에이전트**. 범용 세션의 두뇌를 OS 전문가로 교체하는 것. 기존 /go 파이프라인의 실행자를 바꾸는 것.

---

**🧑 사용자**: 요구사항 이해 → 분석 → 분리 → 테스트 → 개발 → 검증 → 리뷰 → 승인 → 커밋 push까지 전 사이클.

**🤖 AI**: 이 파이프라인은 이미 스킬로 존재한다 (/spec → /divide → /red → /green → /bind → /verify → /audit → /review). 문제는 파이프라인이 아니라 실행자의 세계관.

---

**🧑 사용자**: POC로 APG example 개발 에이전트를 만들자. 정답이 있고 검증 가능하니까.

**🤖 AI**: APG 패턴 = W3C 스펙(정답) + Accordion(모범) + 헤드리스 테스트(검증). Clear 도메인. 완벽한 POC.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | **"APG 패턴 개발 에이전트"를 Claude Code 커스텀 에이전트(`.claude/agents/`)로 구현하여, OS 네이티브 개발자 에이전트의 POC를 수행한다.** Accordion을 레퍼런스로 적재하고, 새 APG 패턴을 전 사이클(spec→test→implement→verify→commit)로 만들게 한다. |
| **📊 Data** | D1. LLM 사전학습 패턴(useState, onClick)이 OS 선언 패턴(Zone, Command)과 구조적으로 충돌한다. D2. 현재 마찰: 핸들러 작성, 기존 기능 재구현. D3. Accordion이 "완전 선언적 OS 패턴"의 모범 사례로 존재 (useState 0줄, onClick 0줄). D4. Claude Code가 커스텀 에이전트를 지원 (시스템 프롬프트, 도구 제한, 스킬 사전 적재). |
| **🔗 Warrant** | W1. "하지 마"(규칙)보다 "이렇게 해"(예시)가 LLM 행동을 강하게 바꾼다. W2. 전용 에이전트는 시스템 프롬프트 수준에서 세계관을 제한하므로 범용 세션보다 충돌이 구조적으로 적다. W3. 컨설턴트 모델은 실행 단계에서 다시 충돌이 발생하므로 문제를 해결하지 못한다 — 에이전트가 직접 개발해야 한다. |
| **📚 Backing** | Curriculum Learning (Bengio 2009) — 도메인 특화 지식 우선 적재. Pit of Success (Rico Mariani) — 구조가 올바른 방향을 강제. |
| **⚖️ Qualifier** | 🟢 Clear — W3C APG 스펙이 정답, Accordion이 모범, 헤드리스 테스트가 검증 기준 |
| **⚡ Rebuttal** | R1. 서브에이전트는 다른 서브에이전트를 호출 불가 — 모든 단계를 자체 컨텍스트에서 수행해야 함. R2. 시스템 프롬프트만으로 사전학습 패턴을 완전히 억제할 수 있는지는 POC로 검증 필요. |
| **❓ Open Gap** | OG1. 에이전트 시스템 프롬프트에 "OS capability index"를 얼마나 상세하게 넣어야 충분한가? OG2. 어떤 APG 패턴을 첫 POC 대상으로 선택할 것인가? |
