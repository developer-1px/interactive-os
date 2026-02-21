# /doubt 결과 (defineApp + createTrigger 시스템 — 2라운드 수렴)

## 대상 (4개 파일, 831줄)
- `defineApp.ts` (321줄) — 메인 팩토리
- `defineApp.types.ts` (187줄) — 타입 선언
- `defineApp.trigger.ts` (153줄) — Simple/Dynamic/Compound Trigger
- `defineApp.undoRedo.ts` (170줄) — Undo/Redo 팩토리

## 라운드 요약
| Round | 🔴 제거 | 🟡 축소 | ↩️ 자기교정 | 수렴? |
|:-----:|:------:|:------:|:---------:|:----:|
| 1     | 0      | 1      | 0         | ❌  |
| 2     | 0      | 0      | 0         | ✅  |

## 🟡 축소/병합 (총 1건)
- **`undoRedo.ts` 내부 중복 제거**: undo/redo 커맨드 핸들러가 동일한 패턴을 코드 복제로 반복하고 있었음 (snapshot current, restore snapshot, build focus dispatch). 3개 공유 헬퍼로 추출하여 ~20줄 감축:
  - `restoreSnapshot(draft, snap)` — data/ui 복원 (4줄→1줄 호출 × 2곳)
  - `buildFocusDispatch(entry)` — FOCUS 커맨드 생성 (7줄→1줄 호출 × 2곳)
  - `snapshotCurrent(state)` — history 제외한 현재 상태 캡처 (2줄→1줄 호출 × 2곳)
  - 불필요한 5줄 인라인 타입 선언 제거 (이미 `as any`로 push)

## 🟢 유지 (주요 항목)
- `defineApp()` 팩토리 전체: 단일 진입점으로 AppHandle 생성, 역할 명확
- `createCondition` / `createSelector`: 모듈-private 브랜딩 팩토리, 적정 캡슐화
- `createTrigger` 3-overload 분기: Simple/Dynamic/Compound 3종을 1개 API 진입점으로 통합 — Pit of Success 원칙 부합
- `CompoundTrigger` (68줄): Todo ClearDialog에서 단 1건 사용이지만, Dialog 패턴의 재사용 가능한 인프라로서 유효
- `ZoneHandle.command` / `ZoneHandle.bind`: Zone 스코프 커맨드와 UI 바인딩의 핵심 메커니즘
- `BoundComponents` 타입: Zone/Item/Field/When 4개 프리미티브를 타입-안전하게 반환
- `TestInstance` 타입: 헤드리스 테스트 인프라의 공개 API 계약
- `DynamicTriggerProps`: P extends void 조건부 타입으로 payload 타입 안전성 확보

## 📊 Before → After (누적)
- `defineApp.undoRedo.ts`: **170줄 → 150줄 (−20줄)**
- 나머지 3개 파일: 변경 없음 (적합한 형태)
