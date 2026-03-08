# Audit: layer-showcase

## 결과

총 위반: 8건
- 🔴 LLM 실수: 0건
- 🟡 OS 갭: 6건 (동일 원인)
- ⚪ 정당한 예외: 2건

## 상세

### ⚪ 정당한 예외 (2건)

| # | 파일 | 패턴 | 사유 |
|---|------|------|------|
| 1 | index.tsx:3 | useEffect | TanStack Router redirect (APG showcase 동일 패턴) |
| 2 | index.tsx:75 | onClick | Router navigation (APG showcase 동일 패턴) |

### 🟡 OS 갭 (6건, 동일 원인)

| # | 파일 | 패턴 |
|---|------|------|
| 3 | DialogPattern.tsx | @os-core import (OS_OVERLAY_OPEN) |
| 4 | AlertDialogPattern.tsx | @os-core import (OS_OVERLAY_OPEN) |
| 5 | MenuPattern.tsx | @os-core import (OS_OVERLAY_OPEN) |
| 6 | PopoverPattern.tsx | @os-core import (OS_OVERLAY_OPEN) |
| 7 | ListboxDropdownPattern.tsx | @os-core import (OS_OVERLAY_OPEN) |
| 8 | NestedPattern.tsx | @os-core import (OS_OVERLAY_OPEN) |

**원인**: SDK가 `OS_OVERLAY_OPEN`을 re-export하지 않음. zone-level trigger binding(`triggers: [{ onActivate: OS_OVERLAY_OPEN(...), overlay: {...} }]`)을 SDK 수준에서 선언할 방법 없음. `createTrigger`는 React 전용이라 headless 테스트에서 overlay lifecycle을 테스트할 수 없음.

**해소 방안**: SDK에 overlay trigger 선언형 빌더 추가 또는 OS_OVERLAY_OPEN을 @os-sdk에서 re-export.
