# Animation Policy Discussion

## Journey

**🧑 사용자**: 커맨드 팔레트 애니메이션을 `/doubt` 해줘

**🤖 AI**: 전체 커맨드 팔레트 경로의 애니메이션을 목록화. `os-modal-scale-in` ↔ `scale-in` 중복 발견, `transition-all` → `transition-colors` 축소 제안. 보고서 작성.

**🧑 사용자**: 키보드 이동 커서가 깜박임이 심해서 불편한데?

**🤖 AI**: (과잉 진단) kernel 이중 구독 문제까지 파고들어 FocusItem hint props 패턴 수정. 구조적 문제는 맞았지만 사용자가 원한 건 transition 제거였음.

**🧑 사용자**: 아니 커맨드 팔레트에 duration과 transition을 제거해

**🤖 AI**: 즉시 제거.

---

**🧑 사용자**: 애니메이션 정책에 대해서는 논의가 필요한 듯

**🤖 AI**: 키보드 vs 마우스 분류 제안, Gap 질문.

**🧑 사용자**: repeat가 가능하다면

**🤖 AI**: "repeat 가능 여부"를 분류축으로 채택. flash-command 예외 질문.

**🧑 사용자**: repeatable한 커서 이동에 한정해서 애니메이션 제거

**🤖 AI**: 코드베이스 전체 transition 검색 시작 (과잉)

**🧑 사용자**: 아니야. opacity가 0이 되어 과정을 볼 수 없게 만드는 애니메이션이 잘못된 것. 이건 Clear 문제야.

---

**한 줄 요약**: AI가 Clear 문제를 Complex로 끌고 간 전형적 사례. 사용자가 Cynefin 도메인 판단으로 교정.

---

## Conclusion

**Why**: 커맨드 팔레트 키보드 이동 시 transition이 깜박임을 유발 → 프로젝트 전체 애니메이션 기준이 필요

**Intent**: 애니메이션의 존재 이유를 한 문장으로 정의하고, 위반 사례를 판단할 검증 가능한 기준 확립

**Warrants**:
- W1. 키보드 포커스 이동에 opacity transition → 이동 중 상태가 안 보임 (경험적 확인)
- W2. rules.md #4 "편의보다 명시적" — 검증 가능한 기준 필요
- W3. rules.md #5 "모든 산출물은 부채" — 목적 없는 애니메이션은 낭비
- W4. 분류 기준은 입력장치가 아니라 repeat 가능 여부
- W5. **(결론)** 애니메이션은 과정을 보여줘야 한다. 과정을 가리는 애니메이션은 잘못된 애니메이션이다.

**한 줄 요약**: 애니메이션은 과정을 보여주는 것이지 가리는 것이 아니다. Repeatable한 빠른 이동에 opacity/색상 transition을 걸면 과정이 보이지 않는 순간이 생기므로, 즉시 반영한다.
