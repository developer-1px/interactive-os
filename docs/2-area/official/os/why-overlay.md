# Why Overlay

> **Status**: Working Draft
> **Date**: 2026-02-18
> **Pipeline Stage**: ③ Behavior (실행)
> **Parent**: [VISION.md](../VISION.md)

---

## Abstract

Overlay는 **모달 다이얼로그, 팝오버, 메뉴 등 "위에 뜨는 UI"의 열기-닫기와 포커스 생명주기**를 관리하는 모듈이다. 열리면 포커스를 가져오고, 닫히면 이전 위치로 복원한다. 중첩도 지원한다.

---

## 1. Problem — 열기는 쉽지만, 닫기는 어렵다

### 1.1 대부분의 앱은 "열기"만 구현한다

```javascript
// 흔한 구현
const [isOpen, setIsOpen] = useState(false)
return (
  <>
    <button onClick={() => setIsOpen(true)}>Open</button>
    {isOpen && <Modal onClose={() => setIsOpen(false)} />}
  </>
)
```

이 구현이 빠뜨리는 것:

1. **모달이 열릴 때 포커스가 모달 안으로 이동하는가?** — 대부분 안 한다. 키보드 사용자는 모달이 열렸는지도 모를 수 있다.
2. **모달이 닫힐 때 포커스가 원래 위치로 돌아가는가?** — 대부분 안 한다. 닫히면 포커스가 `<body>`로 가거나 사라진다.
3. **모달 뒤의 콘텐츠와 상호작용이 차단되는가?** — `aria-modal`을 설정하지 않으면 스크린 리더가 모달 뒤를 읽는다.
4. **Escape로 닫을 수 있는가?** — 구현하더라도, 다른 Escape 핸들러와 충돌한다.
5. **중첩 모달은?** — A 모달 위에 B 확인 다이얼로그가 뜨면? B를 닫으면 A로 돌아가야 하는데?

### 1.2 포커스 복원은 스택이다

중첩 오버레이의 포커스 복원은 **스택(LIFO)**으로 관리되어야 한다:

```
Page (리스트 3번 아이템에 포커스)
  → Modal A 열림 (포커스 저장 → Modal A 첫 요소로)
    → Dialog B 열림 (포커스 저장 → Dialog B 첫 요소로)
    → Dialog B 닫힘 (포커스 복원 → Modal A)
  → Modal A 닫힘 (포커스 복원 → 리스트 3번 아이템)
```

이것을 각 컴포넌트가 개별적으로 구현하면, "B를 닫을 때 A로 돌아가야 한다"는 관계를 누가 관리하는가? 시스템이 아니면 불가능하다.

---

## 2. Cost — 오버레이 미관리의 비용

| 이해관계자 | 비용 |
|-----------|------|
| **키보드 사용자** | 모달 닫기 후 포커스 유실. "내가 어디 있었지?" |
| **스크린 리더 사용자** | `aria-modal` 없이 모달 뒤 콘텐츠 읽힘. 혼란 |
| **개발자** | 포커스 저장-복원 로직을 매 모달마다 구현. 중첩 시 복잡도 급증 |
| **QA** | 모달 열기-닫기-중첩-Escape 조합 테스트. 수동 검증 비용 높음 |

---

## 3. Principle — 오버레이는 포커스 스택이다

### 3.1 STACK_PUSH / STACK_POP

오버레이의 열기-닫기를 스택 연산으로 추상화한다:

| 동작 | 연산 | 포커스 |
|------|------|--------|
| 열기 | `STACK_PUSH` — 현재 포커스 저장 | 오버레이 안 첫 요소로 이동 |
| 닫기 | `STACK_POP` — 스택에서 복원 | 이전 위치로 복원 |

중첩 모달은 스택에 여러 엔트리가 쌓이는 것이다. 닫을 때마다 하나씩 꺼내면 된다.

### 3.2 Focus Trap 자동 적용

`role="dialog"`를 선언하면:

- Tab이 오버레이 안에 갇힌다 (trap)
- Escape로 닫을 수 있다
- 열릴 때 첫 포커스 가능 요소로 자동 포커스
- 닫힐 때 이전 포커스 자동 복원

개발자는 `isOpen` 상태만 관리하면 된다. 나머지는 OS가 보장한다.

### 3.3 Dismiss 정책

오버레이마다 "닫히는 조건"이 다르다:

| 유형 | Escape | 바깥 클릭 |
|------|--------|----------|
| Dialog | 닫힘 | 안 닫힘 |
| Menu | 닫힘 | 닫힘 |
| Alert Dialog | 안 닫힘 (확인 필수) | 안 닫힘 |

이 정책이 role에 내장되어 있으므로, 개발자가 매번 정의할 필요가 없다.

---

## 4. Reference

- [W3C APG: Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [W3C APG: Alert Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/)
- [WCAG 2.4.3: Focus Order](https://www.w3.org/TR/WCAG22/#focus-order) — 모달 포커스 관리
- [WCAG 2.1.2: No Keyboard Trap](https://www.w3.org/TR/WCAG22/#no-keyboard-trap) — Escape로 탈출 보장
- macOS: `NSWindow.level` + `makeKeyAndOrderFront` — 윈도우 레이어 관리의 선례

---

## Status of This Document

Working Draft.
