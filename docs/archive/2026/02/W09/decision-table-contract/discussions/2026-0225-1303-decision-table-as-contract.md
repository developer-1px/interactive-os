# Discussion: 결정 테이블 = 계약 — 8열 파이프라인 표준

## Journey

**🧑 사용자**: todo를 바탕으로 BDD 표 만들어 검증해보기

**🤖 AI**: 범위 확인 질문 — T5만? docs-viewer 전체? BOARD 전체?

---

**🧑 사용자**: 아니야, 지난 대화에 있어. LLM이 테스트를 더 잘하고 실수하지 않도록 파이프라인대로 표를 만들어서 MECE하게 만들 수 있는 구조에 대해서 고민을 하다가 지금의 /red가 나왔단 말이지

**🤖 AI**: /red의 결정 테이블(Zone × 입력 × OS 조건 → 의도 → 커맨드)을 찾아 확인. 빌더 41분기 분석도 발견.

---

**🧑 사용자**: 그걸 적당한 todo에서 앱 레벨에서는 어떻게 만들고 검증하면 좋을지 같이 고민해보자

**🤖 AI**: Todo의 bind() 선언, BDD 스펙(keyboard-and-mouse.md), todo-bdd.test.ts를 대조. 표의 행 수 ≈ 코드의 바인딩 수 ≈ 테스트의 it() 수.

---

**🧑 사용자**: 내가 하고 싶은 건 결국 그 표랑 코드랑 테스트 코드랑 비슷하게, 혹은 거의 같게 만드는 거야. 그러면 강력한 interface 혹은 계약방식을 만들 수 있게 되잖아?

**🤖 AI**: 동형(Isomorphic) 구조. 표 ≈ 코드 ≈ 테스트. interface가 형태를 강제하듯, 이 표가 행동을 강제.

---

**🧑 사용자**: LLM이 코드를 먼저 작성하면 습관이 있어서 자기 마음대로 짜. 특히 테스트. 표로 강제하고, 표에서 테스트+스키마를 강제하고, 구현은 자유롭게

**🤖 AI**: 순서가 핵심. ❌ 코드→테스트 (추인). ✅ 표→테스트+스키마→구현 (계약).

---

**🧑 사용자**: 표에 어떤 열들이 있어야 하나? (Zone, input, DOM, condition, command, effect, then)

**🤖 AI**: Intent(OS 1차 분기) 열 추가 제안. Enter가 activate vs field_commit으로 갈리는 걸 Intent가 명시. 최종 8열: Zone/Given/When/Intent/Condition/Command/Effect/Then.

---

**🧑 사용자**: 잘릴 수 있는 구간이 있나? 조합 폭발을 줄이자

**🤖 AI**: Intent가 컷 포인트. isEditing이 Intent를 결정하면 그 아래 App 조건만 남음. 72 → 33행. Zone 분할 + 대칭 축약 추가.

---

**🧑 사용자**: Todo랑 Builder 둘 다 만들어봐

**🤖 AI**: Todo 23행, Builder 33행 실증. Intent 컷 효과 확인.

---

**🧑 사용자**: 8열로 만들면 더 복잡해?

**🤖 AI**: 행 수 동일. 열은 행당 정보만 올림. 비용은 작성 노력뿐(LLM이 하면 0).

---

**🧑 사용자**: 열을 쪼갤 이유는?

**🤖 AI**: 테스트 수 결정에는 불필요. 표 자체의 MECE 완전성 검증에 필요. Intent+Condition을 분리해야 빠진 갈래를 발견할 수 있음.

---

**🧑 사용자**: 8열 외에 분기가 없어? 파이프라인에서?

**🤖 AI**: 파이프라인 7개 분기 지점 전수 대조 → 8열에서 전부 커버. 누락 없음.

---

**🧑 사용자**: 템플릿 만들어두자. /red에서 쓸 수 있게

**🤖 AI**: `.agent/workflows/documantaion/decision-table.md` 생성. `/red` Step 1에 참조 연결.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | 8열 결정 테이블(Zone/Given/When/Intent/Condition/Command/Effect/Then)을 SSoT로 두고, 표의 행 수 = 테스트 it() 수 = 앱 바인딩 수로 동형 강제하면, LLM의 습관적 일탈을 구조적으로 차단하면서도 구현의 자유는 보장하는 계약 구조가 된다 |
| **📊 Data** | Todo 23행, Builder 33행 실증. Intent 컷으로 72→33 (54% 감소). 기존 todo-bdd.test.ts 30 it()과 대응. Builder canvas 분석의 41분기 → 33행으로 축약 |
| **🔗 Warrant** | LLM은 코드를 먼저 쓰면 자기 습관대로 짠다. 특히 테스트. 표가 선행하면 여지가 없다. Intent가 조합 폭발의 자연 컷 포인트이며, 8열이 OS 파이프라인의 7개 분기를 빈틈 없이 커버 |
| **📚 Backing** | Builder 결정 테이블이 ESC forward-iteration 버그 발견 (6줄 수정, +13 tests). Rules #13 "산출물(Noun)로 증명". Rules #16 "변환 경계마다 독립된 실패 축" |
| **⚖️ Qualifier** | Complicated — 8열 표준은 확정, 남은 것은 /red 통합 + 앱별 적용 |
| **⚡ Rebuttal** | when-router 미구현으로 현재 bind() 행 수 ≠ 표 행 수 (콜백 안 분기 존재). 연쇄 시나리오(Dialog→Toast→Undo)는 단일 행으로 표현 불가 |
| **❓ Open Gap** | 연쇄 시나리오 표현 방식. 마우스 인터랙션 통합 기준 |
