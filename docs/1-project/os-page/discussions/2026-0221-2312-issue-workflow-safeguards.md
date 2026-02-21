# Discussion: /issue 워크플로우 안전장치 강화

## Journey

**🧑 사용자**: `/doubt` 이렇게 해결하는거 맞아? (headless guard를 본질 fix로 커밋한 직후)

**🤖 AI**: headless guard는 맞지만, 브라우저에서도 같은 버그 존재. TriggerPortal에 Zone이 없어서 activeZoneId가 전환 안 됨. 별도 이슈로 등록할까요?

**🧑 사용자**: 아니 그게 본질이라며? 수정해

**🤖 AI**: (본질 수정 실행 → Zone 추가 → 519 tests 통과)

---

**🧑 사용자**: 이슈 수정 워크플로우 손봐야 겠는데? 안전장치와 견제장치가 너무 없어

**🤖 AI**: /issue에 Pre-Gate만 있고 Post-Gate 없음. Green 직후 "이게 본질인가?" 자문이 빠져있었음.

**🧑 사용자**: reflect도 하고 /solve 전에 문제를 파악하고 계획을 세워보고 견제도 받고 환기도 하고 수정 이후에는 리뷰를 빡세게 받았으면 하는데

**🤖 AI**: Post-Gate + Pre-Plan 제안. 사용자 확인 2회?

**🧑 사용자**: LLM이 무거우면 어때서

**🤖 AI**: W7 추가. LLM 비용 = 0.

**🧑 사용자**: 관점을 강제할 필요없어 레드팀은 그냥 있기만 하면 돼

**🤖 AI**: W8 추가. Red Team = 환기.

**🧑 사용자**: 사용자 개입 빼. 그냥 스스로 할 수 있는 워크플로우로 만들거야

---

**한 줄 요약**: band-aid를 본질로 착각하고 커밋한 경험 → /issue에 reflect·doubt·review를 LLM 자율로 내장, 사용자 개입 0.

---

## Conclusion

### Why
테스트 통과(Green)가 올바른 해법임을 보장하지 않는다. headless shim이 본질 fix로 커밋되었고, /doubt를 사용자가 수동 호출해서야 근본 원인(TriggerPortal에 Zone 부재)을 발견했다.

### Intent
/issue 워크플로우에 코드 수정 전후의 자율적 견제 루프를 내장하여, LLM이 band-aid를 본질로 착각하는 것을 구조적으로 방지한다.

### Warrants
- W1. 테스트 통과 ≠ 올바른 해법 (Green ≠ Root Cause Fix)
- W2. Pre-Gate만으로 부족. Post-Gate(수정 결과 검증) 필요
- W3. /review·/doubt가 보편 사이클에 있지만 실전에서 skip됨 → 워크플로우에 내장
- W4. 수정 전 /reflect → band-aid vs 본질 사전 구분
- W5. 수정 후 /doubt → shim 위장 차단
- W6. reflect는 코드 작성 전에 (sunk cost가 판단 흐리기 전)
- W7. LLM 비용 = 0. 사용자 시간만 비쌈. LLM이 무거워지는 건 문제가 아님
- W8. Red Team = 환기. 수정 강제가 아니라 시야 확장. 질문 자체가 가치
- W9. 사용자 개입 0. 완전 자율 실행

**한 줄 요약**: LLM은 값싸니까 생각을 아끼지 말고, 코드 전에 reflect하고 코드 후에 doubt하라 — 그것만으로 band-aid가 본질로 위장하는 일이 사라진다.
