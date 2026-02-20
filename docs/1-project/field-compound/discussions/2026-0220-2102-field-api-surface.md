# Field API Surface — Agent-Safe 설계

> 2026-02-20 21:02 ~ 21:10

## Journey

**🧑 사용자**: Field, Form, Input 같은 것들을 어떻게 나눠야 할까? 인라인 편집만 생각했는데 우측에 Form Panel도 있고. `Field.Input`, `Field.Textarea`, `Field.Label`로 나눠야 하나? Agent가 환각 없이 잘 알아먹으려면?

**🤖 AI**: `Field.Input`/`Field.Textarea` 서브컴포넌트가 좋다. HTML 이름이 AI 사전학습과 1:1 매핑되어 환각이 적다.

---

**🧑 사용자**: 서브 컴포넌트는 네이티브 `<input>`을 붙일 생각이야. 근데 기본 Field는 contentEditable 기반인데, 칩이나 멘션 때문에 contentEditable이 필수잖아. 굳이 `<input>`이 필요한가?

**🤖 AI**: (정정) 맞다. 전부 contentEditable인데 `Input`/`Textarea`로 부르면 실체와 이름이 불일치 → 환각. `multiline` 하나로 `fieldType`을 자동 추론하는 현재 구조가 맞다.

---

**🧑 사용자**: 아니, 서브컴포넌트는 진짜 native `<input>`이야. `Field.Input = <input>` 맞아.

**🤖 AI**: 아, 두 종류의 편집 표면이 있구나. contentEditable(캔버스)과 native input(폼 패널). 둘 다 FieldRegistry + OS focus를 공유하되 렌더링이 다름. Radix Form 패턴과 동일.

---

**🧑 사용자**: 그러면 기본 Field가 contentEditable의 inline edit 대표가 되는 게 맞나?

**🤖 AI**: 웹 전체에서 "Field"는 form `<input>` wrapper (React Hook Form, Formik, Radix). 이 프로젝트에서는 contentEditable. 이름 충돌 위험. → `Field`를 네임스페이스로만 쓰고 `Field.Editable`로 분리하는 제3의 길 제안.

---

**🧑 사용자**: 나는 처음부터 만들어 왔으니 모르지. ("너는 컨텍스트를 갖고 있으니 `Field`가 contentEditable인 걸 알지만, 새 agent는 모른다")

**🤖 AI**: 맞다. cold-start agent 안전성이 기준. `Field.Editable`로 가야 한다.

**🧑 사용자**: 누가 봐도 너무 명확하잖아?

---

**한 줄 요약**: "나는 아니까 괜찮다"는 설계 기준이 아니다. cold-start agent가 이름만 보고 맞출 수 있어야 한다.

---

## Conclusion

### Why
AI agent가 컴포넌트 이름만 보고 올바른 prop과 동작을 추론할 수 있어야 한다. 환각의 근본 원인은 이름과 실체의 괴리.

### Intent
Field의 두 표면(contentEditable, native input)을 각각 실체를 반영하는 이름으로 분리하되, 공통 인프라(FieldRegistry, OS focus, commit 아키텍처)를 공유하는 네임스페이스로 묶기.

### Warrants (누적)

1. **W1**: prop 조합 폭발이 환각의 원인 (multiline+fieldType 버그로 실증)
2. **W2**: 이름이 실체와 일치하면 환각 감소, 불일치하면 증가
3. **W3**: contentEditable은 칩/멘션/리치텍스트의 공통 기반 — 단일 표면 유지
4. **W4**: `multiline` → `fieldType` + `as` 자동 추론 (단일 축 원칙)
5. **W5**: naming honesty principle — 이름이 실체를 반영해야 함
6. **W6**: Radix/Headless UI의 `Field > Input/Textarea/Label` compound pattern 선례
7. **W7**: 두 표면이 공유하는 것 = FieldRegistry + OS focus + commit → Field namespace의 존재 이유
8. **W8**: 필수 prop 3개(name, value, onCommit), 나머지는 스마트 기본값
9. **W9**: `multiline` 하나가 fieldType, as, 키보드 소유권을 결정 (단일 축)
10. **W10**: deferred가 인라인 편집의 업계 표준 (Figma/Excel/Notion)
11. **W11**: immediate는 "편집 외 할 일이 없는" 단순 필드 전용
12. **W12**: Agent 사전학습에서 "Field" = form `<input>` wrapper → contentEditable과 이름 충돌
13. **W13**: Chakra `<Editable>` 선례 → contentEditable에 Editable이라는 이름이 업계에서 사용됨
14. **W14 (결정적)**: "나는 아니까 괜찮다"는 설계 기준이 아니다 → cold-start agent 안전성이 기준

### 결정: Field Compound Component 구조

```
Field (namespace — 컴포넌트 아님, OS 필드 등록 범주)
├── Field.Editable   — contentEditable (인라인 편집, 칩/멘션 확장 가능)
│   props: name, value, onCommit, multiline?, mode?, placeholder?, ...
│   defaults: mode="deferred", multiline=false, fieldType=auto, as=auto
├── Field.Input      — native <input>  (폼 패널, 프로퍼티 패널)
├── Field.Textarea   — native <textarea> (폼 패널)
└── Field.Label      — <label> (이미 존재)
```

**한 줄 요약**: Field는 네임스페이스, 실체는 Editable/Input/Textarea — cold-start agent가 이름만 보고 올바른 mental model을 형성할 수 있다.
