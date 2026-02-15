# Typeahead vs QuickPick 설계 논의

> 2026-02-15 18:30–18:36

## Journey

**🧑 사용자**: typeahead보다는 커맨드 K처럼 키 입력을 하고 키 이동을 해도 포커스가 유지가 되는 방식과, todo에서는 포커스 유지가 아니라 위아래서 커서가 되는 — 이 둘다 가능한 옵션을 만들고 싶어.

**🤖 AI**: 두 패턴 정리 — Pattern A (Cmd+K filter overlay), Pattern B (typeahead jump). Cmd+K는 App 수준인가 OS 수준인가? 네이밍은?

---

**🧑 사용자**: Cmd+K는 App 기능. 재사용 가능하게 패키지. 이름은 네가 잘 지어줘.

**🤖 AI**: OS=`typeahead` (W3C APG 표준 용어), App=`QuickPick` (VS Code 용어). 아키텍처: QuickPick은 기존 OS 프리미티브(combobox zone + overlay + filter) 조합. label 소스는 A(DOM textContent) vs B(label prop) vs C(aria-label)?

---

**🧑 사용자**: 답이 있는거야?

**🤖 AI**: Known임. W3C APG 정답 = accessible name = `el.textContent`. 추가 prop 불필요.

---

## Conclusion

### Decisions

| # | 항목 | 결정 |
|---|------|------|
| D1 | typeahead 레이어 | OS — `NavigateConfig.typeahead: boolean` |
| D2 | QuickPick 레이어 | App — 재사용 패키지로 제공 |
| D3 | 네이밍 | OS=`typeahead`, App=`QuickPick` |
| D4 | label 소스 | DOM `textContent` (W3C accessible name) |
| D5 | QuickPick 구조 | combobox zone + overlay + filter (기존 OS 프리미티브 조합) |

### Warrants

- W1. OS의 모든 동작은 커맨드로 표현된다
- W2. `resolveFallback` 패턴이 "바인딩 없는 키 → 커맨드" 경로를 증명함
- W3. typeahead 순수 함수(`resolveTypeahead`)는 구현 완료 — 재사용 가능
- W4. label 소스 = DOM `textContent` (accessible name) — W3C 표준
- W5. QuickPick = combobox role + overlay + filter — 기존 OS 프리미티브 조합
- W6. Cmd+K는 App 수준, 재사용 가능한 패키지로 제공

### 한 줄 요약

> typeahead(OS, 포커스 점프)와 QuickPick(App, 필터 오버레이)은 같은 "키 입력 탐색"이지만 레이어와 UX가 다르며, QuickPick은 기존 OS 프리미티브를 조합하는 App 패키지로 제공한다.
