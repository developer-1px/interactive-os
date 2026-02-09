# TestBot의 의의 — Red Team / Blue Team

> 날짜: 2026-02-10
> 태그: testbot, red-team, blue-team, ai-native, thesis
> 상태: 의견서

---

## 1. 문제: LLM은 자기 코드를 검증할 수 없다

LLM이 코드를 작성한다. 하지만 **자기가 쓴 코드가 맞는지 확인할 방법**이 없다.

```
LLM: "NAVIGATE 커맨드를 구현했습니다. ArrowDown을 누르면 다음 아이템으로 이동합니다."
→ 정말? 실제 DOM에서 포커스가 이동하는가?
→ aria-activedescendant가 업데이트되는가?
→ 마지막 아이템에서 wrap되는가?
→ Grid에서 ArrowRight가 다음 열로 가는가?
```

LLM은 코드를 **읽고** 맞다고 판단할 수 있지만, 실제 **브라우저에서 실행한 결과**를 확인할 수 없다. 코드 리뷰와 실행 검증 사이에 gap이 존재한다.

이 gap을 메우는 유일한 방법: **코드가 아닌 런타임을 검증하는 자동화된 adversary.**

---

## 2. Red Team / Blue Team 모델

### Blue Team: OS 구현체

```
os-new/
├── 3-commands/     NAVIGATE, ACTIVATE, ESCAPE, SELECT, EXPAND, TAB...
├── 4-effects/      focus(), scroll(), blur(), click()
├── 6-components/   Zone, Item
└── kernel.ts       dispatch → handler → effects
```

Blue Team은 **W3C APG 스펙을 코드로 구현**한다. Listbox, Menu, Tabs, Grid, Dialog, Combobox — 각각의 키보드 인터랙션 패턴을 구현한다.

Blue Team의 목표: **모든 ARIA 패턴이 스펙대로 동작하게 만든다.**

### Red Team: TestBot

```
testBot/
├── actions/        click(), press(), type(), expect()
├── cursor           시각적 실행 추적
└── globalApi        window.__TESTBOT__
```

Red Team은 **스펙을 기준으로 구현체를 공격**한다. 실제 키보드 이벤트를 발사하고, 포커스가 맞는 곳에 있는지, 선택이 올바른지, 속성이 업데이트되었는지 검증한다.

Red Team의 목표: **Blue Team의 구현에서 스펙 위반을 찾아낸다.**

### 심판: W3C APG Spec

Red Team과 Blue Team 모두 **같은 스펙**을 참조한다. 의견 충돌은 없다. 스펙이 맞다.

```
W3C APG: "Listbox에서 Home을 누르면 첫 번째 옵션으로 이동한다"
                    ↓                              ↓
          Blue Team: NAVIGATE 핸들러        Red Team: press("Home")
          Home → items[0]으로 이동          expect(items[0]).toBeFocused()
```

---

## 3. 왜 LLM에게 이 구조가 필수적인가

### 3.1 LLM은 자기 코드를 과신한다

LLM이 NAVIGATE 커맨드를 구현하면, 그 코드가 맞다고 "확신"한다. 하지만:

- Off-by-one 에러 (마지막 아이템에서 overflow)
- 이벤트 버블링 순서 오류
- `aria-selected` vs `aria-checked` 혼동
- `roving tabindex` vs `aria-activedescendant` 혼용

이런 실수는 **코드를 읽는 것만으로는 발견할 수 없다.** 브라우저에서 실행해봐야 안다.

TestBot은 LLM의 과신을 **런타임 증거로 검증**한다.

### 3.2 Red Team은 Blue Team과 독립적이어야 한다

Red Team(TestBot)이 Blue Team(OS)과 같은 코드 경로를 공유하면 의미가 없다.

```
// ❌ 의미 없는 테스트: 같은 코드를 호출
test("navigate works", () => {
  const result = resolveNavigate("down", items, config);
  expect(result.targetId).toBe("item-2");
});
```

위 테스트는 `resolveNavigate` 함수의 단위 테스트일 뿐이다. **사용자가 실제로 ArrowDown을 눌렀을 때** 포커스가 이동하는지는 검증하지 않는다.

```
// ✅ 의미 있는 테스트: 실제 DOM 이벤트
test("navigate works", async (t) => {
  await t.click({ role: "option", name: "Item 1" });
  await t.press("ArrowDown");
  await t.expect({ role: "option", name: "Item 2" }).toBeFocused();
});
```

이 테스트는 Sensor → Command → Effect → DOM 전체 파이프라인을 관통한다. Red Team과 Blue Team이 **완전히 다른 코드 경로**를 탄다.

### 3.3 LLM 자가 수정 루프가 가능해진다

TestBot이 없으면:

```
LLM: 코드 작성 → 인간: 브라우저에서 확인 → 인간: "안 돼" → LLM: 수정
                  ^^^^ 병목
```

TestBot이 있으면:

```
LLM: 코드 작성 → TestBot: 자동 실행 → 결과 JSON → LLM: 실패 분석 → LLM: 수정 → TestBot: 재실행
                                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                    인간 개입 없는 피드백 루프
```

`window.__TESTBOT__.runAll()` → `getFailures()` → LLM이 실패 원인 분석 → 코드 수정 → `rerunFailed()`.

**인간이 자리를 비워도 품질이 수렴한다.**

---

## 4. "Structure as Specification" 과의 관계

프로젝트 철학이 "Structure as Specification"이다. 코드 구조 자체가 스펙이다.

TestBot은 이 철학의 **검증 계층**이다:

```
W3C APG Spec (문서)
    ↓ Blue Team이 구현
OS Commands, Effects, Components (코드 = 스펙)
    ↓ Red Team이 검증
TestBot Suites (테스트 = 스펙의 실행 가능한 증명)
```

TestBot suite가 통과한다 = **스펙이 런타임에서 증명되었다.**

TestBot suite가 실패한다 = **코드는 존재하지만 스펙을 만족하지 않는다.**

테스트는 문서가 아니다. 테스트는 **실행 가능한 스펙**이다.

---

## 5. 현재 증명: 51 Suites, 37 Pass, 14 Fail

ARIA Showcase에서 51개 테스트 suite를 실행한 결과:

- **37 pass** — Blue Team이 스펙을 올바르게 구현한 37개 패턴
- **14 fail** — Red Team이 발견한 14개 스펙 위반

14개 실패의 근본 원인 분석:

| 카테고리 | 실패 수 | 의미 |
|---|---|---|
| onActivate 미발화 | 4 | Enter/Space → click relay가 빠져있다 |
| Tab auto-select | 1 | followFocus 옵션이 미구현 |
| aria-selected 미갱신 | 3 | select pipeline이 DOM에 반영되지 않는다 |
| Dialog focus restore | 2 | 닫힐 때 focus stack pop이 안 된다 |
| Grid Home/End scope | 2 | row-scoped navigation이 미구현 |
| Combobox 구조 문제 | 2 | 별도 FocusGroup 간 이동 불가 |

**이 14개는 TestBot 없이는 발견할 수 없었다.** LLM이 코드를 읽어서 "onActivate가 발화되지 않을 것"이라고 추론하기는 극히 어렵다. 실제로 Enter를 누르고 결과를 관찰해야만 드러나는 문제들이다.

---

## 6. Kernel 시대의 Red Team

os-new/에서 Kernel 기반으로 전환되면 Red Team의 역할이 확장된다:

### 6.1 DOM 검증 (기존)

```typescript
await t.press("ArrowDown");
await t.expect({ role: "option", name: "Item 2" }).toBeFocused();
```

"사용자 관점에서 맞는가?"를 검증.

### 6.2 State 검증 (신규)

```typescript
await t.press("ArrowDown");
await t.expectState((s) => s.os.focus.zones["list"].focusedItemId).toBe("item-2");
```

"내부 상태가 올바른가?"를 검증. DOM은 맞는데 상태가 틀린 경우(또는 그 반대)를 잡아낸다.

### 6.3 Transaction 검증 (신규)

```typescript
await t.press("ArrowDown");
await t.expectTransaction()
  .toHaveCommand("OS_NAVIGATE")
  .toHaveEffect("focus")
  .toHaveChanges("os.focus.zones.list.focusedItemId");
```

"파이프라인이 올바른 경로를 탔는가?"를 검증. 상태는 맞는데 잘못된 커맨드가 처리된 경우를 잡아낸다.

### 세 겹의 검증

```
Layer 1: DOM       — 사용자가 보는 것이 맞는가?
Layer 2: State     — 내부 상태가 일관적인가?
Layer 3: Pipeline  — 올바른 경로로 처리되었는가?
```

어느 한 레이어만 테스트하면 나머지 두 레이어의 불일치를 놓친다. **세 겹 모두 통과해야 진짜 맞다.**

---

## 7. 요약

| | Red Team 없이 | Red Team 있으면 |
|---|---|---|
| 구현 검증 | 인간이 브라우저에서 수동 확인 | `runAll()` → 자동 검증 |
| LLM 피드백 | "이 코드 맞아 보입니다" | "37 pass, 14 fail — 실패 목록과 원인" |
| 스펙 준수 | 코드 리뷰로 추정 | 런타임 증명 |
| 자가 수정 | 불가능 (인간 병목) | LLM → TestBot → LLM 루프 |
| 회귀 방지 | 없음 | 51개 suite가 상시 감시 |

**TestBot은 "테스트 도구"가 아니다. LLM 시대의 개발에서 코드 품질을 수렴시키는 피드백 메커니즘이다.**

Red Team 없는 Blue Team은 자기 확신에 빠진다. Blue Team 없는 Red Team은 공격할 대상이 없다. 둘이 함께 돌아야 **스펙이 코드가 되고, 코드가 증명이 된다.**
