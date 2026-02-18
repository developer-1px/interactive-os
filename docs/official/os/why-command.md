# Why Command & Keybinding

> **Status**: Working Draft
> **Date**: 2026-02-18
> **Pipeline Stage**: ② Input Translation (해석)
> **Parent**: [VISION.md](../VISION.md)

---

## Abstract

Command & Keybinding은 **사용자의 물리적 입력(키 누름, 클릭)을 의미적 의도(Command)로 변환**하는 모듈이다. "Enter 키를 눌렀다"를 "ACTIVATE 커맨드를 실행하라"로 번역한다. 입력 장치와 행동을 분리하여, 동일한 행동을 키보드, 마우스, 터치, 테스트 봇 어디서든 동일하게 실행할 수 있게 한다.

---

## 1. Problem — 이벤트 핸들러의 지옥

### 1.1 입력과 행동이 뒤섞인다

대부분의 웹 앱에서 키보드 처리는 이렇게 생겼다:

```javascript
const onKeyDown = (e) => {
  if (e.key === 'Enter') {
    activateItem(currentId)
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    deleteSelectedItems()
  } else if (e.key === 'c' && (e.metaKey || e.ctrlKey)) {
    copyToClipboard()
  } else if (e.key === 'Escape') {
    if (isModalOpen) closeModal()
    else if (hasSelection) clearSelection()
    else goBack()
  }
  // ... 30줄 더
}
```

이 코드의 문제:

- **입력(e.key)과 행동(activateItem)이 같은 함수에 있다.** 번역기와 실행기가 결합되어 있다.
- **조건 분기가 누적된다.** Escape 하나에 3가지 분기. 새 기능이 추가되면 분기가 늘어난다.
- **테스트가 어렵다.** "ACTIVATE 동작을 테스트하려면" 키보드 이벤트를 시뮬레이션해야 한다. 행동 자체를 독립적으로 테스트할 수 없다.
- **재사용 불가.** 마우스 클릭으로도 같은 activateItem을 호출하고 싶으면, 로직을 복제해야 한다.

### 1.2 단축키 충돌

웹 앱에는 세 층의 단축키가 충돌한다:

| 층 | 예시 | 우선순위 |
|---|------|---------|
| 브라우저 | Cmd+L (주소창), Cmd+T (새 탭) | 항상 최우선 |
| 앱 전체 | Cmd+K (Command Palette) | 어디서든 동작해야 함 |
| 컴포넌트 로컬 | Enter (리스트 아이템 활성화) | 포커스된 영역에서만 |

`onKeyDown`을 컴포넌트에 직접 붙이면, 이 세 층의 우선순위를 관리할 방법이 없다.

### 1.3 입력 장치 종속

`onKeyDown`으로 구현하면, 같은 행동을 마우스로 호출하려면 별도 핸들러가 필요하다. 터치를 추가하면 또 하나. 게임패드를 추가하면 또 하나. **행동이 입력 장치에 종속**되면, 새 입력 장치를 추가할 때마다 모든 행동을 다시 연결해야 한다.

---

## 2. Cost — 이벤트 핸들러 산재의 비용

| 이해관계자 | 비용 |
|-----------|------|
| **사용자** | 단축키가 불일관. 같은 앱 안에서도 영역에 따라 다르게 동작 |
| **개발자** | `onKeyDown` 핸들러가 컴포넌트마다 산재. 변경 시 어디를 고쳐야 할지 모름 |
| **테스트** | 행동을 테스트하려면 키보드 이벤트를 시뮬레이션해야 함. 순수 로직 테스트 불가 |
| **확장성** | 새 입력 장치(터치, 음성) 추가 시 모든 행동을 다시 바인딩 |

---

## 3. Principle — 번역기는 번역만 한다

### 3.1 Sensor → Command 분리

입력 장치(Sensor)와 행동(Command)을 분리한다:

```
KeyboardSensor  → "Enter"     → dispatch(ACTIVATE())
MouseSensor     → click       → dispatch(ACTIVATE())
TouchSensor     → tap         → dispatch(ACTIVATE())
TestBot         → direct call → dispatch(ACTIVATE())
```

센서는 커맨드가 뭘 하는지 모른다. 커맨드 핸들러는 누가 호출했는지 모른다.  
이 분리가 "어떤 입력 장치든 같은 행동"을 가능하게 한다.

### 3.2 Keybinding Table

키와 커맨드의 매핑은 **선언적 테이블**로 관리한다:

```
ArrowDown  → NAVIGATE({ direction: 'down' })
Enter      → ACTIVATE()
Escape     → ESCAPE()
Meta+C     → OS_COPY()
```

테이블을 바꾸면 키 매핑이 바뀐다. 코드를 수정할 필요가 없다. 사용자가 키를 커스터마이징할 수 있는 기반이기도 하다.

### 3.3 When 조건 — 문맥에 따른 분기

같은 Enter 키가 문맥에 따라 다른 커맨드로 변환된다:

| 키 | 조건 (when) | 커맨드 |
|----|-----------|--------|
| Enter | `navigating` | ACTIVATE |
| Enter | `editing` | FIELD_COMMIT |
| Space | checkbox/switch | OS_CHECK |
| Space | 그 외 | ACTIVATE |

분기 로직이 `if/else` 대신 **when 조건**으로 선언되므로, 코드에서 분기가 사라진다.

---

## 4. Reference

- [re-frame: Effects as Data](https://day8.github.io/re-frame/) — 커맨드와 실행의 분리
- [VS Code: Keybinding System](https://code.visualstudio.com/docs/getstarted/keybindings) — when 조건의 선례
- [macOS: Responder Chain](https://developer.apple.com/documentation/appkit/nsresponder) — 이벤트 버블링의 선례
- [Command Pattern (GoF)](https://en.wikipedia.org/wiki/Command_pattern) — 의도의 객체화

---

## Status of This Document

Working Draft.
