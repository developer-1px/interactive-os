# Command-Config 불변 구조 발견

> 출발: APG Matrix 개밥먹기 → 파이프라인 구조 질문 → 불변 계약 도출

## Journey

**🧑 사용자**: APG 매트릭스의 커맨드가 파이프라인과 일치하는지 확인하자. 옵션과 컨디션 분기 전략 논의.

**🤖 AI**: 로직 트리 작성. role 분기가 2회(L2 resolveItemKey + L5 rolePresets). 커맨드 9개.

---

**🧑 사용자**: role→command→role 이 구조가 최선이야?

**🤖 AI**: "Key-first" 모델 제안. Key→Command(1:1) → rolePresets(1회) → 행동. role 분기 1회.

---

**🧑 사용자**: "커맨드는 분기하지 않는다. 옵션을 가진다." 원칙이면?

**🤖 AI**: CHECK→SELECT, EXPAND→NAVIGATE 흡수. 9→6 커맨드. rolePresets가 유일한 옵션 소스.

---

**🧑 사용자**: instance 분기(expanded?)는? 함수 말고 배열 fallback은?

**🤖 AI**: `["expand", "enterChild"]` — 앞부터 시도, 성공 시 멈춤. 함수 0개, 조건문 0개. ~12 atomic actions.

---

**🧑 사용자**: 배열을 커맨드 안에 넣으면? 순수하게 재현·관찰 가능하게.

**🤖 AI**: `OS_NAVIGATE({ direction: "right", chain: ["expand", "enterChild"] })` — 커맨드가 자기 완결.

---

**🧑 사용자**: 상태를 없애는 게 낫지 않아? → resolved 넣자 → 과정도 담자 → resolved는 파생이니 불필요하네.

**🤖 AI**: 맞음. 최종: **Command = { 의도 + chain }. resolved는 실행 로그에만.** chain × state = resolved (계산). 커맨드는 입력, resolved는 출력.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | **Command = { intent + chain(string[]) }. chain은 rolePresets에서 복사된 fallback 정책. COMMIT이 chain × state로 resolved를 계산. 커맨드는 순수 데이터, 실행기는 외부 참조 0.** |
| **📊 Data** | APG Matrix 155행 전수검사. 현재 config 갭 9건. resolveItemKey 제거 가능. ~12 atomic actions로 전수 커버 |
| **🔗 Warrant** | "커맨드는 분기하지 않는다, 옵션을 가진다" → role 분기 2회→0회. 배열 fallback = 함수 0개로 instance 분기 표현 |
| **📚 Backing** | Chain of Responsibility (GoF). Event Sourcing (command = 재현 단위). re-frame cofx (resolve 시점 분리) |
| **⚖️ Qualifier** | 🟢 Clear |
| **⚡ Rebuttal** | R1: seq 케이스 2건 → 복합 atomic 흡수. R4: Big Bang 위험 → 점진적 마이그레이션. R5: app callback 분리 유지 |
| **❓ Open Gap** | 점진적 전환 첫 단계 결정 |

## 불변 계약 (5개)

```
1. Key → Command 무조건 1:1
2. Command = { intent + chain } (순수 데이터)
3. COMMIT = chain × state → resolved action → effect (외부 참조 0)
4. rolePresets = chain의 유일한 소스 (RESOLVE 시 command에 복사)
5. chain의 원소는 atomic action name (유한 enum)
```

## 6 Commands

| Command | 흡수 | 역할 |
|---------|------|------|
| **NAVIGATE** | +EXPAND, +FOCUS | 모든 이동·확장·축소 |
| **SELECT** | +CHECK | 모든 고르기 (selected/checked) |
| **ACTIVATE** | — | 모든 실행 (Enter) |
| **DISMISS** | — | 모든 닫기 (Escape) |
| **TAB** | — | Tab 이동 |
| **VALUE_CHANGE** | — | 값 변경 (slider/spinbutton) |

## Atomic Actions (~12)

```
이동:  move, enterChild, goParent, loop, stop
확장:  expand, collapse, expandSubmenu
닫기:  closeSubmenu, dismiss
복합:  closeAndNavNext, closeAndNavPrev
```

## Config 추가 필요 (9건)

| # | config 경로 | 타입 |
|---|-----------|------|
| C1 | `navigate.onRight` | `string[]` |
| C2 | `navigate.onLeft` | `string[]` |
| C3 | `navigate.onCrossAxis` | `string[]` |
| C4 | `navigate.onCrossAxisBack` | `string[]` |
| C5 | `select.scope` | `"cell" \| "column" \| "row"` |
| C6 | `select.extend` | `boolean` |
| C7 | `select.aria` | `"selected" \| "checked"` |
| C8 | `activate.effect` | `string` |
| C9 | `dismiss.restoreFocus` | `boolean` |

## 📎 References

- `docs/official/os/APG_MATRIX.md`
