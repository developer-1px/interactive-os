# Why Field

> **Status**: Working Draft  
> **Date**: 2026-02-18  
> **Pipeline Stage**: ③ Behavior (실행)  
> **Parent**: [VISION.md](../VISION.md)

---

## Abstract

Field는 **인라인 편집(inline editing)의 시작-커밋-취소 생명주기**를 관리하는 모듈이다.
리스트 아이템의 이름 변경, 셀 값 수정, 인라인 댓글 작성 — "제자리에서 편집"하는 모든 패턴을 시스템 수준에서 처리한다.

---

## 1. Problem — 인라인 편집은 모드 전환이다

### 1.1 편집은 상태가 아니라 모드다

일반적인 텍스트 입력(`<input>`)과 인라인 편집은 근본적으로 다르다. 인라인 편집은 **탐색 모드(navigation mode)에서 편집 모드(editing mode)로의 전환**이다.

```
탐색 모드 → [F2/Enter/더블클릭] → 편집 모드
편집 모드 → [Enter] → 커밋 → 탐색 모드
편집 모드 → [Escape] → 취소 → 탐색 모드 (원래 값 복원)
```

이 전환이 없으면, 방향키가 커서 이동인지 아이템 이동인지 구분할 수 없다.

### 1.2 키 소유권 충돌

편집 모드에서는 **키보드의 소유권이 OS에서 필드로 이전**되어야 한다:

- `ArrowLeft/Right` → OS 네비게이션이 아니라 텍스트 커서 이동
- `Space` → OS SELECT가 아니라 공백 입력
- `Enter` → OS ACTIVATE가 아니라 FIELD_COMMIT
- `Escape` → OS ESCAPE(dismiss)가 아니라 FIELD_CANCEL

이 소유권 전환 없이는, `contentEditable`에서 스페이스를 누르면 선택이 토글되고, 방향키를 누르면 아이템이 이동한다.

---

## 2. Cost — 인라인 편집을 직접 만드는 비용

| 증상 | 원인 |
|------|------|
| 편집 중 방향키가 아이템을 이동시킴 | 키 소유권 모델 부재 |
| Enter로 편집을 완료할 수 없음 | ACTIVATE와 FIELD_COMMIT이 충돌 |
| Escape로 취소하면 모달까지 닫힘 | ESCAPE와 FIELD_CANCEL이 충돌 |
| 편집 취소 시 원래 값으로 복원 안 됨 | 편집 전 값 스냅샷 부재 |
| 편집 완료 후 포커스가 사라짐 | 편집 → 탐색 모드 전환 프로토콜 부재 |

---

## 3. Principle — OS가 모드 전환을 관리한다

### 3.1 명시적 생명주기: Start → Commit/Cancel

```
FIELD_START_EDIT  →  편집 모드 진입 (값 스냅샷)
FIELD_COMMIT      →  변경 확정 → 탐색 모드 복귀
FIELD_CANCEL      →  변경 취소 → 원래 값 복원 → 탐색 모드 복귀
```

앱은 `onFieldCommit(id, value)` 콜백만 선언한다. 생명주기는 OS가 관리한다.

### 3.2 Key Ownership Model — 위임(Delegation)

편집 모드에서 키 소유권은 **"OS가 기본 소유, 필드에 위임"** 모델을 따른다:

| 키 | 탐색 모드 | 편집 모드 |
|----|----------|----------|
| `ArrowUp/Down` | OS Navigate | OS Navigate (편집 필드는 단일 행) |
| `ArrowLeft/Right` | OS Navigate | **Field** (커서 이동) |
| `Space` | OS Select | **Field** (공백 입력) |
| `Enter` | OS Activate | **Field** → FIELD_COMMIT |
| `Escape` | OS Escape | **Field** → FIELD_CANCEL |
| `Tab` | OS Tab | OS Tab (영역 탈출) |

키보드 리스너(`KeyboardListener`)는 `isFieldActive` 플래그로 이 전환을 감지한다.

### 3.3 포커스 연속성

편집이 끝나면(커밋이든 취소든) 포커스는 **편집하던 아이템으로 복귀**한다. 사용자는 편집 후 바로 다음 아이템으로 방향키 이동할 수 있다.

---

## References

- Field 구현: `os/3-commands/field/field.ts`
- Key Ownership: `os/keymaps/fieldKeyOwnership.ts`
- SPEC §3.7: Field Command Contract
- Unit Tests: `field.test.ts` (14 cases)

---

## Status of This Document

Working Draft. 구현 완료되었으며 키 소유권 모델이 안정화된 후 CR로 승격 예정.
