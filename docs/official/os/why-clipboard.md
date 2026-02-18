# Why Clipboard

> **Status**: Working Draft  
> **Date**: 2026-02-18  
> **Pipeline Stage**: ③ Behavior (실행)  
> **Parent**: [VISION.md](../VISION.md)

---

## Abstract

Clipboard는 **Copy, Cut, Paste 동작을 시스템 수준에서 가로채고 위임**하는 모듈이다.
네이티브 클립보드 동작을 존중하면서, Zone이 등록한 콜백으로 앱 수준의 복사-붙여넣기를 제공한다.

---

## 1. Problem — 네이티브를 존중하면서 앱 클립보드를 제공해야 한다

### 1.1 두 세계의 충돌

웹에는 두 가지 클립보드가 있다:
- **네이티브**: 텍스트 선택 → Cmd+C → 시스템 클립보드에 복사
- **앱**: 리스트 아이템 선택 → Cmd+C → 아이템 데이터를 복사

이 둘은 동일한 단축키(Cmd+C)를 사용하지만 의미가 다르다. 모든 Cmd+C를 가로채면 텍스트 복사가 안 되고, 가로채지 않으면 앱 복사가 안 된다.

### 1.2 어느 Zone이 처리할지 앱이 결정해야 하는 문제

Clipboard 이벤트는 `window`에서 발생한다. 어느 Zone의 어떤 아이템을 복사할지는 현재 포커스 상태에 따라 달라진다. 앱이 이걸 직접 판단하면 포커스 시스템과 중복된다.

---

## 2. Cost — 직접 만드는 비용

| 증상 | 원인 |
|------|------|
| Cmd+C가 텍스트 복사를 방해함 | 모든 copy 이벤트를 무조건 가로챔 |
| 아이템 복사가 input 필드에서도 동작함 | isInputActive 체크 누락 |
| 붙여넣기 대상이 잘못된 Zone에 적용됨 | 활성 Zone 감지 부재 |
| 붙여넣기 시 데이터 형식이 안 맞음 | 복사-붙여넣기 형식 계약 부재 |

---

## 3. Principle — 조건부 가로채기(Conditional Intercept)

### 3.1 앱이 선언한 Zone만 가로챈다

```
네이티브 clipboard 이벤트 발생
  → isInputActive? → YES → 패스 (네이티브 동작)
  → activeZoneId 존재? → NO → 패스
  → Zone에 onCopy/onCut/onPaste 콜백 있음? → NO → 패스
  → YES → 가로채서 OS 커맨드 디스패치
```

**기본값은 "안 건드림"이다.** Zone이 명시적으로 클립보드 콜백을 등록한 경우에만 OS가 개입한다. 이것이 네이티브 존중과 앱 확장의 균형이다.

### 3.2 커맨드 위임

`OS_COPY`, `OS_CUT`, `OS_PASTE` 커맨드는 **활성 Zone의 콜백을 호출하는 것 외에 다른 일을 하지 않는다.** 클립보드 데이터의 형식과 내용은 앱이 결정한다.

```typescript
// Zone 등록 시:
onCopy: (selectedIds) => { /* 앱이 복사할 데이터 결정 */ }
onPaste: () => { /* 앱이 붙여넣기 처리 */ }
```

### 3.3 입력 필드 보호

`<input>`, `<textarea>`, `contentEditable` 요소가 활성화되어 있으면 클립보드 이벤트를 가로채지 않는다. 텍스트 편집 중의 복사-붙여넣기는 항상 네이티브로 동작한다.

---

## References

- Clipboard 구현: `os/3-commands/clipboard/clipboard.ts`
- ClipboardListener: `os/1-listeners/ClipboardListener.tsx`
- Unit Tests: `clipboard-commands.test.ts`
- E2E Tests: `dogfooding.spec.ts`

---

## Status of This Document

Working Draft. 조건부 가로채기 모델이 안정화됨. 클립보드 데이터 형식 표준화 후 CR로 승격 예정.
