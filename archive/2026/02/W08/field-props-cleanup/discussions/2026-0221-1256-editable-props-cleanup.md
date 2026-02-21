# Field Editable Props 정리 Discussion

## Journey

**🧑 사용자**: Field가 이제 Editable로 분리가 되었는데 prop가 이제는 맞지 않아서 정리가 필요할것 같아

**🤖 AI**: Field.tsx는 이미 Editable/Input/Textarea/Label로 compound 분리 완료. 하지만 `defineApp.bind`의 FieldComponent와 BoundComponents.Field 타입이 분리 이전 구조. 정리 방향 3가지 제시 (compound 올리기 / prop 보강 / bind에서 제거).

**🧑 사용자**: props은 LLM 예측가능하게 정리하고 각자 필요한것만 가지는 방향으로

**🤖 AI**: 3 variant (Editable/Input/Textarea) props 전수 비교. 공통 prop 추출보다 각자 자기 interface에 선언하는 구조가 LLM에게 더 명확 (개체 수 최소화).

---

**🧑 사용자**: multiline도 필요한가 싶어

**🤖 AI**: 추적 결과 multiline이 하는 일 3가지: ① CSS (whitespace), ② fieldType 기본값 (block/inline), ③ aria-multiline. 전부 `fieldType`에서 도출 가능. multiline은 fieldType의 중복 개체.

---

**🧑 사용자**: blurOnInactive 이런것도

**🤖 AI**: 추적 결과 blurOnInactive 사용처 1곳 (TaskItem.tsx). `mode="deferred"` → blur, `mode="immediate"` → no blur로 결정론적 도출 가능. 파생 가능한 prop을 노출하면 모순 조합이 가능 → Pit of Success 위반.

---

**🧑 사용자**: /doubt해서 정말 Editable용으로만 정리해보자

**🤖 AI**: /doubt 2라운드 수렴. 15개 prop → 10개로 정리:
- 🔴 제거 5건: multiline, blurOnInactive, as, target, controls
- 🟡 강화 1건: name optional → required
- 🟢 유지 10건: value, name, placeholder, fieldType, onCommit, trigger, schema, resetOnSubmit, onCancel, mode

---

> **한 줄 요약**: Editable의 15개 prop 중 파생 가능 4개 + 미사용 2개를 제거하여 10개의 독립적·모순불가 prop set으로 정리.

---

## Conclusion

### Why
Field compound 분리 후 Editable의 prop interface에 역사적 잔재(단일 Field 시절의 편의 prop)가 남아 LLM 예측 가능성과 타입 안전성을 해치고 있다.

### Intent
각 variant가 자기 prop만 갖고, 파생 가능한 prop을 노출하지 않아 모순 조합이 불가능한 최소 prop set을 만든다.

### Warrants
1. Field는 이미 Editable/Input/Textarea/Label로 분리 완료
2. bind의 FieldComponent 타입에 주요 prop 누락
3. Builder는 직접 import으로 bind를 우회 — bind의 Field 추상화가 실전에서 불충분
4. 각 variant가 자기 prop을 자기 interface에 선언하는 구조가 LLM에게 더 명확
5. `FieldProps` → `EditableProps`로 rename하여 혼란 방지
6. `multiline`은 `fieldType`에서 도출 가능 — 중복 제거
7. `blurOnInactive`은 `mode`에서 도출 가능 — 중복 제거
8. **파생 가능한 prop을 노출하면 모순 조합이 가능해진다** — Pit of Success 위반

> **한 줄**: 파생 가능한 prop은 interface에 노출하지 않는다 — 모순 불가가 LLM 예측 가능성의 전제다.
