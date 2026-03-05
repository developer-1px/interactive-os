# /plan — tsx 로직 추출 변환 명세표

> **Date**: 2026-03-03
> **Source**: /discussion (tsx-responsibility-split) → /divide (REPORT.md) → /plan
> **Goal**: os-react tsx를 최대한 얇은 bypass 통로로 만든다. OS 로직은 os-core로 이동

---

## 모범 사례 확인

Zone.tsx(228줄)과 Item.tsx(247줄)는 **이미 얇은 bypass 패턴**을 따르고 있음:
- Zone: 순수 로직은 `@os-core/3-inject/zoneContext.ts`에 위임 (createZoneConfig, buildZoneEntry, computeContainerProps)
- Item: SSOT는 `@os-sdk/library/headless/compute`의 `computeItem()`에 위임

→ 이 두 파일은 **추출 불필요**. 나머지를 이 수준으로 맞추는 것이 목표.

---

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `5-effect/index.ts` (95줄) | os-react에 위치. os-core→os-react 역의존 유발 | os-core/src/5-effect/로 이동. 역의존 제거 | 🟢 Clear | — | tsc 0, 역의존 grep 0 | import 2~3군데 변경 |
| 2 | `1-listen/*.ts` 순수 파일 7개 (resolve*.ts, senseMouse, domQuery) | os-react에 위치. 순수 TS인데 React 패키지에 있음 | os-core/src/1-listen/으로 이동 | 🟢 Clear | — | tsc 0 | os-react 내 상대경로 참조 변경 필요 |
| 3 | `KeyboardListener.tsx:senseKeyboard()` (L34-104, 70줄) | tsx 안에 DOM→Data 추출 함수가 인라인 | `os-core/src/1-listen/keyboard/senseKeyboard.ts`로 추출. tsx에서 import | 🟢 Clear | →#2 | tsc 0, 기존 테스트 유지 | senseKeyboard는 os.getState() 사용 → os-core 내에서 정상 |
| 4 | `PointerListener.tsx` (395줄) | `onPointerDown/Move/Up` 핸들러 안에 OS dispatch 로직 + DOM sense 혼재 | 핸들러 로직을 os-core/src/1-listen/pointer/로 추출. tsx는 useEffect + eventListener only | 🟢 Clear | →#2 | tsc 0, 기존 테스트 유지 | resolvePointer.ts는 이미 os-react에 순수 파일로 존재 → #2에서 이동 |
| 5 | `ClipboardListener.tsx` (91줄) | 판단 로직 + React binding 혼재 | 판단 로직 → `os-core/src/1-listen/clipboard/senseClipboard.ts`. tsx는 eventListener only | 🟢 Clear | →#2 | tsc 0 | 작은 파일, 위험 낮음 |
| 6 | `Field.tsx:checkValueEmpty,getFieldClasses` (L28-76, 48줄) | tsx 안에 순수 함수 인라인 | `os-react/src/6-project/field/fieldUtils.ts`로 추출. 같은 패키지 내 분리 | 🟢 Clear | — | tsc 0 | React 렌더링과 무관한 유틸 함수 |
| 7 | `Field.tsx:handleCommit,FieldRegistry 로직` (L164-210, 46줄) | tsx 안에 OS 연산 로직 | `os-react/src/6-project/field/fieldActions.ts`로 추출 | 🟢 Clear | →#6 | tsc 0 | 상태 관리 로직이므로 주의 |
| 8 | `QuickPick.tsx:defaultFilter,defaultTypeahead` (L127-156, 29줄) | tsx 안에 순수 함수 인라인 | `os-react/src/6-project/widgets/quickpick/quickPickUtils.ts`로 추출 | 🟢 Clear | — | tsc 0 | 작은 추출, 위험 낮음 |
| 9 | `useField.ts` (195줄) | os-react에 위치. React Hook이지만 OS 레지스트리 연산 포함 | 유지 (os-react). React Hook은 React 패키지가 맞음. Hook 내부의 순수 로직은 이미 FieldRegistry에 위임됨 | 🟢 Clear | — | — | No-op 후보 → MECE 점검에서 재확인 |
| 10 | `Trigger.tsx` (441줄) | TriggerBase + Portal + Dismiss 3개 컴포넌트가 한 파일 | 유지. 3개 서브컴포넌트는 한 개념(overlay trigger)을 구성. 로직은 이미 OS command dispatch로 선언형 | 🟢 Clear | — | — | Zone/Item과 같은 bypass 패턴 |

---

## MECE 점검

1. **CE**: #1~#8 실행하면 목표(os-react 최대한 얇게) 달성? → ✅ 예. 순수 로직 이동(#1,#2) + sense 함수 추출(#3,#4,#5) + 유틸 분리(#6,#7,#8)
2. **ME**: 중복? → #9, #10은 No-op → 제거
3. **No-op**: #9(useField), #10(Trigger)는 Before=After → 제거

→ **유효 행: #1~#8 (8개)**

---

## 예상 결과

| | Before | After |
|---|--------|-------|
| os-react 순수 TS | 1,480줄 | ~300줄 (useField + accessors만 잔류) |
| os-react tsx 최대 파일 | QuickPick 520줄 | QuickPick ~490줄 (유틸 추출) |
| os-core→os-react 역의존 | 1건 | **0건** |
| PointerListener.tsx | 395줄 | ~80줄 (useEffect + eventListener) |
| KeyboardListener.tsx | 170줄 | ~100줄 (useEffect + import) |

---

## 라우팅

승인 후 → `/go` (기존 프로젝트 `os-restructure`) — #1→#8 순차 실행. tsc 0 연속 검증.
