# ZIFT 근본적 회의 — Usage Spec으로의 전환

> 2026-03-01 22:02~22:56 /discussion

## Journey

**🧑 사용자**: 근본적 회의감이 있다. FE 개발은 패턴화되어 있다는 점이 해결하고 싶은 문제.

**🤖 AI**: 회의감의 좌표가 시대적 유효성(C)인가?

**🧑 사용자**: C는 오히려 확신. 전통적 React로는 거대 프로젝트 관리에 한계가 있다는 걸 체감 중. 문제는 **ZIFT**.

---

**🧑 사용자**: ZIFT는 ARIA와 Data와 CRUD를 다 포함해야 한다. 그런데 이걸 표준화시키지 못했다.

**🤖 AI**: CollectionZone ↔ Entity Schema ↔ Field Types, 세 조각이 따로 논다. 가운데 Entity Schema가 ZIFT의 공식 개념이 아니라서 양쪽을 이을 수 없다.

**🧑 사용자**: 맞아. 완성된 Usage를 설계하지 못한 채 부분 검증만 반복. LLM도 나도 Goal을 모른다.

---

**🤖 AI**: "완성된 Usage"를 먼저 설계해야 한다. 단, 구현 없는 Design Spike로 — Wishful Thinking + 컨셉맵 대입.

**🧑 사용자**: 워크플로우로 만들자 → `/usage` 생성. 대상은 **Builder** (복잡성 대표, 15/18 커버).

---

## Conclusion — Toulmin

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | ZIFT의 Goal을 "Builder Usage Spec"(컴파일 안 되는 이상적 코드 + 컨셉맵 18개 대입)으로 먼저 확정하고, 이것을 나침반 삼아 구현해야 Spike↔Stabilize 무한 루프가 깨진다 |
| **📊 Data** | ① Field 관련 프로젝트 7~8회 반복에도 안정 안 됨 ② Zone↔Collection, Item↔Entity 매핑 미공식화 ③ CollectionZone/FieldTypes/EntitySchema 세 조각 미연결 |
| **🔗 Warrant** | 데이터 구조 + 편집 모드 = 결정론적 UI. 이 매핑을 선언적 API로 표현하면 OS가 나머지를 보장할 수 있다 |
| **📚 Backing** | RDD (Tom Preston-Werner), Wishful Thinking (SICP), Conceptual Integrity (Fred Brooks), Django Admin 선례 |
| **⚖️ Qualifier** | 🟡 Complicated — 방향 확정, 분해 필요 |
| **⚡ Rebuttal** | Builder가 너무 복잡하여 Usage Spec이 수렴하지 않을 위험. 점진적 Zone 추가로 완화 |
| **❓ Open Gap** | ① 4개 프리미티브로 충분한가 vs 5번째 필요? ② enum/date/relation Field 타입 처리 ③ Cross-zone 통신 선언 방식 |

## 산출물

- `docs/2-area/praxis/concept-map.md` — OS 18개 개념 영역 트리
- `.agent/workflows/usage.md` — Design Spike 워크플로우

## 🚀 Next

→ `/usage` (Builder, Heavy)
