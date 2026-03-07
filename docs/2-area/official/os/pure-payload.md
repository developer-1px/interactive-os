# [아키텍처] OS.FOCUS를 통한 명시적 페이로드 해결

## 1. 개요
이전의 "암시적 미들웨어 해결(Implicit Middleware Resolution)" 방식은 페이로드의 누락 여부가 모호하다는 문제점이 제기되었습니다.
이에 대한 해결책으로, **"Explicit Sentinel Value (명시적 예약어)"** 패턴을 채택합니다.
UI 호출부에서 `OS.FOCUS`라는 명시적인 상수를 페이로드로 전달함으로써, "현재 포커스된 대상을 사용하겠다"는 의도를 분명히 합니다.

## 2. 분석

### 🚨 암시적 해결의 문제점 (이전 방식)
- `DeleteTodo({})` 호출 시, 이것이 "전체 삭제"를 의도한 것인지, "포커스 삭제"를 의도한 것인지, 아니면 "실수"인지 구분하기 어려움.
- 코드를 읽는 사람 입장에서 `id`가 어디서 오는지 추적하기 힘듦.

### ✅ 채택: OS.FOCUS 센티넬 패턴
Zone 콜백(`onAction`, `onDelete`, `onCheck` 등)에 `"OS.FOCUS"` placeholder를 포함한 커맨드를 미리 등록한다.
OS가 커맨드를 dispatch하기 직전에 `resolveFocusId()`가 placeholder를 실제 `focusedItemId`로 치환한다.

#### 흐름
1. **Zone 등록**: `<Zone onAction={ToggleTodo({ id: "OS.FOCUS" })}>`
2. **Activate 시**: OS가 `resolveFocusId(command, focusedItemId)` 호출
3. **결과**: `ToggleTodo({ id: "42" })` — 실제 ID로 치환된 커맨드가 dispatch

## 3. 현재 구현

> **구현 위치**: `packages/os-core/src/4-command/` (focus resolve 로직이 커맨드 파이프라인에 통합됨)

```typescript
const FOCUS_PLACEHOLDER = "OS.FOCUS";

export function resolveFocusId<T extends Command<string, any>>(
  command: T,
  focusedItemId: string,
): T {
  if (!command.payload) return command;
  const resolved = { ...command };
  const payload = { ...command.payload };
  for (const key of Object.keys(payload)) {
    if (payload[key] === FOCUS_PLACEHOLDER) {
      payload[key] = focusedItemId;
    }
  }
  resolved.payload = payload;
  return resolved;
}
```

### 사용처 (현재 소스코드에서 활발히 사용)

| OS 커맨드 | 호출 위치 | 해결 방식 |
|-----------|----------|----------|
| `OS_ACTIVATE` | `activate.ts` | `resolveFocusId(entry.onAction, zone.focusedItemId)` |
| `OS_DELETE` | `delete.ts` | selection 각 ID 또는 focusedItemId |
| `OS_CHECK` | `check.ts` | `resolveFocusId(entry.onCheck, targetId)` |
| `OS_MOVE_UP/DOWN` | `move.ts` | `resolveFocusId(entry.onMoveUp/Down, focusedItemId)` |
| `OS_COPY/CUT/PASTE` | `clipboard.ts` | `resolveFocusId(entry.onCopy/Cut/Paste, id)` |

## 4. 결론
이 방식은 **"명시성(Explicitness)"**과 **"순수성(Purity)"**을 모두 만족합니다.
- **Developer**: `"OS.FOCUS"`를 씀으로써 의도를 명확히 표현.
- **Debugger**: placeholder → 실제 ID 치환 시점이 `resolveFocusId` 한 곳.
- **Command Handler**: 여전히 순수 데이터만 처리.

### ADR 결정 (vs 초기 제안)

| 항목 | 초기 제안 (2026-02-03) | 현재 구현 |
|------|----------------------|----------|
| Sentinel 값 | `Symbol.for("OS.FOCUS")` | `"OS.FOCUS"` (문자열) |
| 해결 위치 | 범용 미들웨어 (`payloadResolver`) | 각 커맨드 핸들러에서 호출 (`resolveFocusId`) |
| 해결 방식 | dispatch 파이프라인에 자동 삽입 | 핸들러가 명시적으로 호출 |

문자열이 선택된 이유: JSON 직렬화 가능, Symbol은 디버거에서 불투명.

---
*ADR (2026-02-03) / 소스코드 현행화: 2026-02-18*
