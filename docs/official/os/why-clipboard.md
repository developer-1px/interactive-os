# Why Clipboard

> **Status**: Candidate Recommendation  
> **Date**: 2026-02-21  
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
onCopy: (cursor) => { /* 앱이 복사할 데이터 결정 */ }
onPaste: (cursor) => { /* 앱이 붙여넣기 처리 */ }
```

### 3.3 입력 필드 보호

`<input>`, `<textarea>`, `contentEditable` 요소가 활성화되어 있으면 클립보드 이벤트를 가로채지 않는다. 텍스트 편집 중의 복사-붙여넣기는 항상 네이티브로 동작한다.

---

## 4. Dual Mode — Text/Structural 이중 모드 (v2)

> v2 (2026-02-21): builder-usage-cleanup 프로젝트에서 발견한 범용 패턴

### 4.1 세 가지 보편 규칙

모든 clipboard 동작은 이 세 규칙으로 귀결된다:

| # | 규칙 | 의미 |
|---|------|------|
| 1 | `isFieldActive` → 네이티브 | 입력 필드 편집 중이면 브라우저가 처리 |
| 2 | `!isFieldActive` → Paste Bubbling | 탐색 중이면 데이터 계층을 올라가며 `accept` 찾기 |
| 3 | 정적 아이템 → 구조적 연산 불가 | 템플릿 슬롯은 cut/delete/duplicate 불가 |

### 4.2 두 가지 데이터 채널

Clipboard에는 두 가지 데이터가 동시에 흐른다:

```
┌─────────────────────────────────────────┐
│  clipboardWrite: { text, json? }        │  ← 시스템 클립보드 (브라우저)
│  clipboardStore: { source, items[] }    │  ← 내부 클립보드 (앱 구조 데이터)
└─────────────────────────────────────────┘
```

- **`clipboardWrite`**: 시스템 클립보드에 쓰는 effect. OS가 `navigator.clipboard.writeText`를 처리.
  앱은 `navigator.clipboard`를 직접 호출하지 않는다.
- **`clipboardStore`**: 모듈 레벨 내부 저장소. 구조적 copy/cut/paste의 데이터 채널.
  `source` 필드로 같은 컬렉션 vs 다른 컬렉션을 구분.

### 4.3 동적 vs 정적 아이템

| 구분 | 동적 아이템 | 정적 아이템 |
|------|-----------|-----------|
| 예시 | Section, Card, Tab | 필드 내 텍스트, 아이콘, 이미지 |
| Copy | 구조 복사 (`clipboardStore` + `clipboardWrite.json`) | 텍스트 복사 (`clipboardWrite.text` + `setTextClipboard`) |
| Cut | 구조 잘라내기 (제거 + 포커스 복구) | ❌ no-op |
| Paste | Bubbling → `accept` → 삽입 | 필드 값 교체 |
| Delete | 제거 + 포커스 복구 | ❌ no-op |

### 4.4 Paste Bubbling

붙여넣기 대상이 클립보드 데이터를 받을 수 없으면, 데이터 계층을 위로 올라가며 `accept` 가능한 컬렉션을 찾는다.

```
paste(card) on staticItem
  → parent(staticItem) = section  (accept: null) → skip
  → parent(section) = root        (accept: ["hero","news",...]) 
  → ✅ root에 삽입
```

`accept` 함수가 없으면 → no-op (조용히 무시).

### 4.5 `clipboardWrite` Effect 규약

Zone 콜백(`onCopy`)은 커맨드 배열 대신 `{ clipboardWrite: { text } }` 객체를 반환할 수 있다.
OS는 이 effect를 감지하여 `navigator.clipboard.writeText`를 호출한다.

```typescript
// 앱의 onCopy 콜백 — 정적 아이템:
return { clipboardWrite: { text: fieldValue } };

// 앱의 onCopy 콜백 — 동적 아이템:
return copy({ ids: [cursor.focusId] }); // createCollectionZone이 처리
```

---

## References

- Clipboard 구현: `os/3-commands/clipboard/clipboard.ts`
- ClipboardListener: `os/1-listeners/clipboard/ClipboardListener.tsx`
- Collection Clipboard: `os/collection/createCollectionZone.ts`
- Public API: `getClipboardPreview()`, `setTextClipboard()`
- Unit Tests: `clipboard-commands.test.ts`, `builder-canvas-clipboard.test.ts`
- PRD: `docs/1-project/builder-clipboard/prd.md`
- 설계 논의: `docs/1-project/builder-clipboard/discussions/2026-0220-2127-clipboard-design.md`

---

## Status of This Document

Candidate Recommendation. 조건부 가로채기 + 이중 모드(text/structural) 패턴이 Builder 앱에서 검증됨.
cross-app clipboard (다른 앱 간 구조적 붙여넣기) 표준화 후 Recommendation으로 승격 예정.
