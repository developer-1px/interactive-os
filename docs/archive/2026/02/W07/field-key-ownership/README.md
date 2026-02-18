# Field Key Ownership — OS가 필드 편집 중 키보드를 지능적으로 처리한다

> 등록일: 2026-02-16
> Phase: Done ✅

## 문제 (Why)

현재 OS의 키보드 처리는 **이분법**이다:

```
isEditing === true  →  OS가 거의 모든 키를 포기 (Enter, Escape만 처리)
isEditing === false →  OS가 모든 키를 처리
```

이 모델은 현실에 맞지 않는다:
- **Draft 필드**에서 Tab/Shift+Tab이 작동하지 않음 (contentEditable → editing → 차단)
- **Draft 필드**에서 ↑↓ 키로 리스트 아이템으로 이동 불가
- 앱이 이런 동작을 **직접** 구현해야 한다면 OS의 존재가치가 떨어짐

## 목표 (What)

**OS가 필드 유형에 따라 키 소유권(Key Ownership)을 자동 판단**하여,
앱 개발자가 `fieldType`만 선언하면 모든 키보드 상호작용이 올바르게 동작한다.

### 원칙

> **편집 중 필드는 모든 키를 소유한다. 필요한 navigation 키만 OS에 위임(delegate)한다.**

핵심 전환:
```
이전: "편집 중이면 OS가 물러난다" (Field이 전부 가져감, OS가 opt-in)
최종: "편집 중 필드가 기본 소유. 명시적으로 OS에 위임한 키만 OS가 처리" (Field이 기본, OS가 allowlist)
```

이 위임(delegation) 모델이 소비(consumption) 모델보다 우수한 이유:
- **문자 입력 안전성**: Space, 숫자, 문자 등은 절대 OS navigation에 잡히지 않음
- **명시적 allowlist**: OS에 넘길 키(Tab, Arrow)만 나열하므로 의도가 명확
- **기본값 안전**: 새 키가 추가되어도 필드가 기본 소유 → 예기치 않은 키 삼킴 방지

## MECE 분석

### 축 1: 키 분류 (Exhaustive Key Enumeration)

편집 중 소유권이 결정되어야 하는 모든 키:

| 카테고리 | 키 | 설명 |
|---------|-----|------|
| **문자 입력** | a-z, 0-9, symbols, Space | 텍스트 타이핑 |
| **수평 커서** | ArrowLeft, ArrowRight | 텍스트 내 좌우 이동 |
| **수직 커서** | ArrowUp, ArrowDown | 줄 간 이동 또는 zone 탈출 |
| **점프 커서** | Home, End | 줄 시작/끝 또는 zone 시작/끝 |
| **Zone 탈출** | Tab, Shift+Tab | 컨트롤 간 이동 |
| **삭제** | Backspace, Delete | 문자 삭제 또는 아이템 삭제 |
| **확정/취소** | Enter, Escape | 이미 OS가 처리 (FIELD_COMMIT/CANCEL) |
| **수정자 조합** | Meta+Z, Meta+A, Meta+C/X/V | Undo, SelectAll, Clipboard |

### 축 2: 필드 유형 (MECE Field Types)

실제 UI에서 존재하는 모든 텍스트 입력 패턴:

| 유형 | 예시 | 핵심 특성 |
|------|------|-----------|
| **`inline`** | 검색바, Draft, 이름변경, URL입력 | 단일행, Tab 탈출, ↑↓ 탈출 |
| **`block`** | 댓글, 설명, 채팅 입력 | 다중행, Tab 탈출, ↑↓ 소비 |
| **`editor`** | 코드 에디터, 리치 텍스트 | 다중행, Tab 소비(indent), ↑↓ 소비 |
| **`tokens`** | 칩/태그 입력, 이메일 수신자 | 단일행, Backspace∅→OS 위임 |

### 축 3: 소유권 매트릭스

#### 독립 결정 축 (3개 이진 축)

| 축 | 의미 | 값 |
|----|------|-----|
| **A: ↑↓** | 수직 화살표를 누가 처리? | **OS**(zone nav) vs **Field**(커서 이동) |
| **B: Tab** | Tab/Shift+Tab을 누가 처리? | **OS**(zone escape) vs **Field**(indent) |
| **C: Bksp∅** | 빈 필드에서 Backspace를 누가 처리? | **Field**(no-op) vs **OS**(토큰 삭제) |

#### 2³ = 8 조합 중 유효한 4개  

| ↑↓ | Tab | Bksp∅ | Preset | 실존 여부 |
|----|-----|-------|--------|-----------|
| OS | OS | Field | **`inline`** | ✅ 검색바, Draft, 이름변경 |
| OS | OS | OS | **`tokens`** | ✅ 칩/태그 입력 |
| Field | OS | Field | **`block`** | ✅ 댓글, 설명 |
| Field | Field | Field | **`editor`** | ✅ 코드 에디터 |
| OS | Field | * | ❌ | 단일행+Tab 소비 = 비현실적 |
| Field | OS | OS | ❌ | 다중행+토큰 = 비현실적 |
| Field | Field | OS | ❌ | 코드 에디터+토큰 = 비현실적 |
| OS | Field | Field | ❌ | 단일행+Tab 소비 = 비현실적 |

→ **4개 프리셋이 MECE하게 모든 실제 패턴을 커버한다.**

### 완전 소유권 매트릭스

| 키 | `inline` | `tokens` | `block` | `editor` |
|----|----------|----------|---------|----------|
| **문자, Space** | Field | Field | Field | Field |
| **ArrowLeft/Right** | Field | Field | Field | Field |
| **ArrowUp/Down** | **OS** | **OS** | Field | Field |
| **Home/End** | Field | Field | Field | Field |
| **Tab/Shift+Tab** | **OS** | **OS** | **OS** | Field |
| **Backspace (비어있을 때)** | Field | **OS** | Field | Field |
| **Backspace (내용 있을 때)** | Field | Field | Field | Field |
| **Delete** | Field | Field | Field | Field |
| **Enter** | OS (commit) | OS (commit) | Field (newline)¹ | Field (newline) |
| **Escape** | OS (cancel) | OS (cancel) | OS (cancel) | OS (cancel) |
| **Meta+Z** | Native² | Native | Native | Native |
| **Meta+A** | Native | Native | Native | Native |
| **Meta+C/X/V** | Native | Native | Native | Native |

¹ `block`의 Enter: submit은 Shift+Enter 또는 별도 버튼으로 (앱 설정)  
² Native: 브라우저 네이티브 동작에 위임 (텍스트 undo, 텍스트 select all 등)

## 기존 코드 영향 분석

### 실제 구현

1. **`isEditingElement()`** (KeyboardListener.tsx) — 변경 없음, binary check 유지
2. **`resolveIsEditingForKey()`** (KeyboardListener.tsx) — 신규, per-key 위임 판단
3. **Dual Context**: `isEditing` (mode) + `isFieldActive` (per-key)
4. **`Keybindings.resolve()`** (keybindings.ts)
   - `when: "editing"` → `isEditing`으로 판단 (Enter→FIELD_COMMIT)
   - `when: "navigating"` → `!isFieldActive`로 판단 (Tab→zone escape)
5. **`FIELD_DELEGATES_TO_OS`** (fieldKeyOwnership.ts)
   - 각 프리셋이 OS에 위임하는 키의 allowlist
6. **`FieldConfig.fieldType`** (FieldRegistry.ts) — 기본값: `"inline"`
7. **Meta+Z/Shift+Z** `when: "navigating"` 가드 추가
8. **Space CHECK override** — `!isEditing` 조건 (편집 중 Space는 무조건 텍스트)

### 기존 호환성

| 현재 사용처 | 현재 Field 타입 | 할당할 preset |
|------------|---------------|--------------|
| Todo Draft (`TodoDraft.Field`) | immediate, 단일행 | `inline` ✅ |
| Todo Edit (`editZone.Field`) | deferred, 단일행 | `inline` ✅ |
| Builder blocks (`OS.Field`) | deferred, 혼합 | `inline` (대부분), `block` (description) |
| QuickPick input | 별도 처리 (combobox) | N/A (이미 자체 handler) |

## 성공 기준

| ID | 기준 | 검증 | 상태 |
|----|------|------|------|
| SC-1 | Todo Draft에서 Tab/Shift+Tab으로 zone 이동 가능 | E2E 테스트 | ✅ |
| SC-2 | Todo Draft에서 ArrowDown으로 리스트 아이템 이동 가능 | E2E 테스트 | ✅ |
| SC-3 | 코드 에디터에서 Tab이 indent로 동작 (zone escape 아님) | E2E 테스트 | 💡 (PoC 대기) |
| SC-4 | 모든 필드에서 Meta+Z가 native text undo로 동작 | E2E 테스트 | ✅ |
| SC-5 | `fieldType` 미지정 시 `inline`이 기본값으로 동작 | Unit 테스트 | ✅ |
| SC-6 | 기존 476개 Unit 테스트 깨지지 않음 | CI | ✅ |
| SC-7 | 기존 16개 + 신규 3개 Todo E2E 테스트 통과 | CI | ✅ (19/19) |

## Out of Scope

- Combobox 키보드 처리 (이미 별도 handler 존재)
- 코드 에디터 통합 (프리셋 정의만, 실제 에디터 구현은 별도)
- `tokens` 프리셋의 칩 삭제 UI (프리셋 정의만)
- multi-line Enter/Shift+Enter 전략 (FIELD_COMMIT 확장은 별도)

## 참조

- W3C APG: Tab은 항상 컨트롤 간 이동 (single-line, multi-line 무관)
- W3C APG: ArrowUp/Down은 multi-line에서 커서 이동, single-line에서는 컨트롤 이동
- macOS/Windows: 네이티브 OS도 동일한 패턴
