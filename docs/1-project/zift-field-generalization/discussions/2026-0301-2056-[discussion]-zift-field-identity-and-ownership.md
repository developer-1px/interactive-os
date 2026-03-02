# ZIFT Field 정체성 & 소유권 — Discussion Conclusion

| 항목 | 내용 |
|------|------|
| **날짜** | 2026-03-01 20:25 ~ 20:56 |
| **선행 문서** | `docs/0-inbox/2026-0301-1830-[research]-aria-zift-mece-mapping.md`, `docs/0-inbox/2026-0301-1900-[proposal]-zift-ownership-field-generalization.md` |

---

## Journey

**🧑 사용자**: ZIFT 소유권 정렬 제안서를 읽어봐.

**🤖 AI**: Tension Report 작성 — 5개 대립 구조 발견 (T1: 이론 순수성 vs 안전성, T2: Field의 정체성 Conduit vs Value Owner, T3: 독립 Field vs Zone-내부 Field, T4: radio의 checked 분류, T5: 성능).

---

**🧑 사용자**: ZIFT의 기원은 "모든 UI를 프리미티브하게 쪼갤 수 있을까?"에서 시작. UI의 존재 이유 = 데이터 표시(Item), 데이터 편집(Field), 액션(Trigger), 구조(Zone). Field는 처음부터 **Property**였다.

**🤖 AI**: 그렇다면 T2(Field의 정체성)가 근본적으로 재구성된다. 현재 KI의 "Text Conduit" 정의가 원래 비전에서 축소된 것이지, 제안서가 확장하려는 게 아니다.

---

**🧑 사용자**: Field vs Trigger 구분: **데이터 변화와 동작이 1:1 매핑이면 Field, 아니면 Trigger.** 그리고 **Field는 Entity에만 한정.** UI State는 Field가 아니다.

**🤖 AI**: 두 축 정리 — 필터 1: 1:1 매핑, 필터 2: Entity 테스트. `expanded`는 1:1이지만 Entity가 아니므로 Trigger. 깔끔.

---

**🧑 사용자**: selection과 check는 Item이야. Property가 아니기 때문. Items는 Zone의 소유, 상태는 Item의 책임.

**🤖 AI**: 같은 checkbox가 맥락에 따라 Item(마킹)이거나 Field(property 편집). 메커니즘 동일, 의미가 다름.

---

**🧑 사용자**: radiogroup은 본질적으로 dropdown과 동치이고 UI만 다른 거 아냐?

**🤖 AI**: 맞다. radiogroup ≡ dropdown ≡ segmented ≡ rating — 전부 enum Field의 시각적 변형.

---

**🧑 사용자**: enum Field는 내부적으로 Zone+Item 구조를 UI로 쓰고, 그 결과가 Field에 반영되는 구조.

**🤖 AI**: Field = 값 소유자, Zone+Item = 입력 위젯. string→키보드, boolean→토글, number→조정, enum→Zone+Item. HTML form과 동형.

---

**🧑 사용자**: Nesting과 composition으로 해결. Property를 활용하면 Field.

**🤖 AI**: ZIFT = 레이어 분류. 합성은 자유. 판별 기준 4개: 구조→Zone, 정체성→Item, Property→Field, 간접 변화→Trigger.

---

**🧑 사용자**: 아코디언 그려봐. 펼침 상태 보관은?

**🤖 AI**: Accordion = Zone + Item + Trigger. Field 없음. expanded는 UI State. 보관 ≠ Entity. OS가 UI State를 보관하는 것과 Field가 Entity를 보관하는 것은 별개 메커니즘.

---

## Conclusion — Toulmin 정석 표

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | **Field = Entity Property의 1:1 편집 인터페이스.** FieldType은 `string \| boolean \| number \| enum \| enum[]`. ZIFT는 요소 분류가 아니라 레이어 분류이며, Nesting과 composition으로 자유 합성. enum Field는 Zone+Item을 내부 입력 위젯으로 사용 |
| **📊 Data** | (1) ARIA 53개 속성 MECE 검증: Field 13개, 반례 0. (2) 현재 computeItem이 Field 속성(aria-checked/valuenow)까지 소유하는 코드 증거. (3) radiogroup ≡ dropdown ≡ segmented 동치 관계. (4) HTML form control과 ZIFT Field 동형 |
| **🔗 Warrant** | (W4) ZIFT의 기원은 UI 존재론: 표시=Item, 편집=Field, 액션=Trigger, 구조=Zone. Field는 처음부터 Property. (W5) 직접 변경=Field, 간접=Trigger. (W8) Entity 테스트: Field는 도메인 데이터만. (W9) Item은 UI 상태(selected/checked/disabled) 소유, Field는 Entity 값 소유. (W12) Field는 값의 소유자, Zone+Item은 enum Field의 입력 위젯 |
| **📚 Backing** | DDD Ubiquitous Language (Eric Evans), Composite Pattern (GoF), WAI-ARIA 1.2 Recommendation, HTML form controls 모델 |
| **⚖️ Qualifier** | 🟢 Clear |
| **⚡ Rebuttal** | (1) "Property"의 경계가 맥락 의존적 (같은 checkbox가 Item일 수도 Field일 수도). 하지만 이건 표현력이지 모호함이 아님 — `createField`로 선언하면 의미가 확정됨. (2) computeItem 분해 시 regression 위험 — 점진적 추출(내부 함수 분리 → 외부 분리)로 관리 가능 |
| **❓ Open Gap** | (1) `createField` API의 구체적 시그니처 (2) FieldRegistry의 `value: string` → `string \| boolean \| number \| string[]` 확장 설계 (3) enum Field와 Zone selection의 동기화 메커니즘 |

---

## 핵심 원칙 요약 (14개 Warrant)

| # | Warrant |
|---|---------|
| W1 | ZIFT = ARIA 53개의 동형 추상화 (MECE 검증) |
| W2 | 이론-구현 불일치 = Pit of Failure |
| W3 | Responder chain ↔ ZIFT 레이어 정렬 |
| W4 | ZIFT 기원 = UI 존재론. Field = Property |
| W5 | 직접 변경 = Field, 간접 = Trigger |
| W6 | ZIFT = 요소 분류가 아닌 레이어 분류 |
| W7 | "직접/간접" 판단에 "사용자 의도" 보조 축 |
| W8 | Entity 테스트: Field = 도메인 데이터만 |
| W9 | Item = UI 상태 소유, Field = Entity 값 소유 |
| W10 | radiogroup = Zone(구조) + Item(상태) + Field(값)의 합성 |
| W11 | radiogroup ≡ dropdown ≡ segmented — enum Field 변형 |
| W12 | Field는 값 소유자, Zone+Item은 enum Field의 입력 위젯 |
| W13 | Nesting과 composition이 합성 방향 해소 |
| W14 | 보관 여부 ≠ ZIFT 분류 기준 |

---

## Field Value Type 요약

| 값 유형 | 입력 메커니즘 | ARIA 예시 | 비고 |
|---------|-------------|----------|------|
| `string` | 키보드/contentEditable | textbox, searchbox | 현행 Field |
| `boolean` | 토글 (Space/Enter/Click) | switch, checkbox, toggle button | 신규 |
| `number` | Arrow/drag | slider, spinbutton | 신규 |
| `enum` | Zone+Item 단일 선택 | radiogroup, listbox(single), combobox | 신규 |
| `enum[]` | Zone+Item 멀티 선택 | checkbox group, listbox(multi) | 신규 |

---

## ZIFT 합성 패턴 지도

```
Zone only:            group, toolbar
Zone + Item:          listbox (파일선택), tree (탐색)
Zone + Item + Trigger: accordion, tree (expand), disclosure
Field only:           switch, slider, textbox
Field → Zone+Item:    radiogroup, dropdown, checkbox-group (enum Field)
Zone+Item → Field:    editable list, settings 리스트
Z + I + T + F:        combobox (전부 합성)
```
