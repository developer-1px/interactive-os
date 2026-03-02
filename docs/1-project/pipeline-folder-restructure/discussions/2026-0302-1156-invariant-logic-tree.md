# 불변 로직 트리 Discussion

> 2026-03-02 | Session: f904bdf9

---

## Journey

**🧑 사용자**: core는 좀 중구난방인거 같은데 한번 분석해봐

**🤖 AI**: core/ 4-Lens 분석. 7가지 성격 혼재 → headless, collection, widgets를 core/ 밖으로 분리 제안.

---

**🧑 사용자**: @/redteam 냉정하게 현재 os 폴더 구조 평가해봐

**🤖 AI**: 8개 공격 포인트. 전체 6.25/10. P1(widgets OS 밖), P2(headless/collection core 복귀) 제안.

---

**🧑 사용자**: 엔트로피 관점에서 트레이드오프가 있어?

**🤖 AI**: P2는 엔트로피 교환일 뿐, 감소 아님. → 철회.

**🧑 사용자**: 일관성과 배워야 할 것의 감소 관점에서 재검토해봐.

**🤖 AI**: Level 0 인지 부하 감소 + 규칙 수 9→6 + 예외 3→0. → **P2 철회 철회. 실행해야 함.**

---

**🧑 사용자**: 로직트리를 불변하게 만들어보자

**🤖 AI**: v1(커널 기반) → v2(커널 frozen) → **v3(FE 물리 법칙 기반)** 진화.

**🧑 사용자**: 우리는 OS가 아니라 FE의 데이터 흐름과 개념에서 불변성을 찾아야 해

**🤖 AI**: CICP(Capture-Interpret-Compute-Project) 4단계. 모든 인터랙티브 시스템에 공통.

---

**🧑 사용자**: 폴더구조가 로직트리랑 닮았으면 좋겠는데?

**🧑 사용자**: flow와 관련된건 번호를 유지해줘

**🧑 사용자**: FE의 개념적 용어에 충실했으면. pipeline/app/core/test 구성은 좋아보여

**🧑 사용자**: 각 폴더가 파이프라인이어야지 결과이면 안 돼. 산출물 인터페이스 정리해봐

**🤖 AI**: 실제 코드 추적: DOMEvent → TypedInput → OSCommand → Context → NextState → DOM. 동사 6개 도출.

**🧑 사용자**: 3-command에서 inject와 navigate는 같은 위상이 아니잖아

**🤖 AI**: 맞음. inject를 command 하위에 넣으면 위상 위반. Flow 우선 원칙 → 6단계 유지.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | `src/os/` = `1-listen/ 2-resolve/ 3-inject/ 4-command/ 5-effect/ 6-project/ app/ core/ testing/` — 9 folders, 6-stage pipeline + 3 support |
| **📊 Data** | 실제 코드 데이터 흐름 추적: DOMEvent→TypedInput→OSCommand→Context→NextState+Effects→DOM. 각 단계의 입출력 인터페이스가 명확히 구분됨 |
| **🔗 Warrant** | (1) FE 보편 데이터 흐름은 불변 (2) 폴더명=동사=과정 (3) 로직 트리=폴더 구조 동형 (4) Flow 우선 원칙으로 inject 독립 유지 |
| **📚 Backing** | Elm Architecture (Msg→update→view), Stable Dependencies Principle (Robert C. Martin) |
| **⚖️ Qualifier** | 🟢 Clear |
| **⚡ Rebuttal** | inject는 개념적으로 command에 종속. 허용 (Flow 우선, 문서화로 보완) |
| **❓ Open Gap** | 없음 |
