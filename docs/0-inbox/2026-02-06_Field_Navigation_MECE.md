# Field + Navigation 키 상호작용 MECE 분석

## 1. 개요

Field 컴포넌트와 Navigation 키(Arrow, Tab) 입력의 상호작용을 MECE(Mutually Exclusive, Collectively Exhaustive)하게 분류.

---

## 2. 분류 축

### 축 1: Field Mode
| Mode | 설명 |
|------|------|
| **immediate** | 포커스 시 즉시 편집 가능 |
| **deferred** | Enter로 편집 시작, Escape/Enter로 종료 |

### 축 2: Editing State
| State | 설명 |
|-------|------|
| **isEditing: true** | 현재 텍스트 편집 중 |
| **isEditing: false** | 비편집 상태 (선택만 됨) |

### 축 3: Key Type
| Key | 예시 |
|-----|------|
| **Navigation** | ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Tab |
| **Edit** | Enter, Escape, Backspace, Delete, 문자 입력 |

---

## 3. MECE 케이스 매트릭스

### immediate Mode

| isEditing | Navigation Key | 기대 동작 |
|-----------|----------------|----------|
| ✗ (N/A) | Arrow | **Field 내부 커서 이동** (contenteditable 기본) |
| ✗ (N/A) | Tab | **다음 focusable 요소로 이동** (OS 키바인딩) |

> **Note:** immediate mode에서는 포커스 = 편집. `isEditing` 구분 없음.

---

### deferred Mode

| isEditing | Navigation Key | 기대 동작 |
|-----------|----------------|----------|
| **false** | Arrow | **Zone 내 다른 Item으로 이동** (OS_NAVIGATE) |
| **false** | Tab | **다음 Zone으로 이동** (OS 키바인딩) |
| **true** | Arrow | **Field 내부 커서 이동** (contenteditable 기본) |
| **true** | Tab | ??? (커밋 후 이동? 아니면 탭 문자 입력?) |

---

## 4. 미결정 케이스 (Decision Needed)

| 케이스 | 현재 동작 | 대안 |
|--------|----------|------|
| deferred + editing + Tab | ? | A) 커밋 → 다음 Field로 이동 / B) 탭 문자 삽입 / C) 무시 |
| deferred + editing + ArrowUp/Down | 커서 이동 | 커서가 맨 위/아래일 때 → 이전/다음 Item으로 이동? |

---

## 5. 결론 / 제안

### 명확한 케이스
- **deferred + not editing**: Navigation은 OS가 처리 (Zone 이동)
- **immediate / editing**: Navigation은 Field가 처리 (커서 이동)

### 결정 필요
1. **Tab in editing mode**: 커밋 후 이동 vs 탭 삽입
2. **Boundary navigation**: 커서가 경계에서 Arrow 시 다음 Item으로 이동할지

---

## 6. 현재 코드 구현 상태

```typescript
// classifyKeyboard.ts
if (isEditing && FIELD_KEYS.has(canonicalKey)) {
    return 'FIELD';  // Field가 처리
}

// routeKeyboard.ts - COMMAND case
if (mode === 'deferred' && !isEditing) {
    effectiveIntent = { ...intent, isFromField: false };  // OS가 처리하도록
}
```

**현재 로직:** deferred + not editing → OS 키바인딩으로 라우팅 ✓
