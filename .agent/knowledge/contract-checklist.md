# Contract Checklist — OS 계약 준수 검사 기반

> OS 계약 위반을 검사할 때 사용하는 체크리스트와 금지 목록. /audit의 §Config 역할.

---

## Config

> **이 섹션이 /audit 워크플로우의 Slot이다.**
> /audit Step 1이 "§Config를 따른다"고 참조하면 여기서 검사 패턴을 읽는다.

### 검사 grep 패턴

```bash
# 전수 검색 (1회)
grep -rnE "useState|useEffect|onClick|onMouseDown|onChange|onKeyDown|onPointerDown|document\.|getElementById|querySelector|addEventListener|os\.dispatch|data-drag-handle" \
  src/apps/ --include="*.ts" --include="*.tsx" | grep -v "/test"
```

### 필수 OS 패턴 (§1-A: 앱→OS)

| 패턴 | OS API | 잘못된 예 |
|------|--------|-----------| 
| 상태 관리 | `BuilderApp.useComputed()`, `os.getState()` | `useState` |
| 커맨드 dispatch | `os.dispatch(command())` | 직접 state mutate |
| 목록 포커스/네비게이션 | Zone `bind({ role: "tree"/"grid" })` | `onKeyDown` arrow key |
| 아이템 선택 | Zone `onAction`, `onActivate` | `onClick` 직접 state 변경 |
| 필드 편집 | `Field.Editable`, `OS_FIELD_COMMIT` | `<input onChange>` |
| Undo/Redo | `createUndoRedoCommands` | 별도 history stack |

### OS 내부 계약 (§1-B: OS↔OS)

| 패턴 | 올바른 예 | 잘못된 예 |
|------|----------|----------|
| Zone 콜백 시그니처 | `(info) => BaseCommand \| BaseCommand[]` (선언형) | `(info) => void` (명령형) |
| Listener 격리 | 하나의 물리 제스처 → 하나의 Listener | 같은 pointerdown을 Mouse+Drag 각각 처리 |
| DOM convention 자동화 | OS가 `data-*` 속성 자동 주입 | 앱이 `data-drag-handle` 수동 부착 |

### 분류 기준

| 분류 | 기준 | 행선지 |
|------|------|--------|
| **🔴 LLM 실수** | OS가 대안을 제공하는데 앱이 안 쓴 경우 | 근본 원인 단계로 루프백 |
| **🟡 OS 갭** | OS가 이 패턴의 대안을 아직 제공하지 않는 경우 | `5-backlog/os-gaps.md` 등록 |
| **⚪ 정당한 예외** | 외부 라이브러리 통합, 브라우저 API 필수 사용 등 | BOARD Backlog |

### 수정 대응표 (🔴 LLM 실수 시)

- `useState` → OS state / `useSelection` / `useComputed`
- `onClick` → `Trigger onActivate` / OS activate
- `useEffect` → OS hook / kernel middleware

---

## Patterns

(축적 중)

## Hazards

(축적 중)

## Precedents

(audit.md §5의 선례는 audit.md에 유지 — 양이 많고 이미 잘 구조화됨)
