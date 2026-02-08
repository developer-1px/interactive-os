# Escape → DISMISS: 키 중심 vs 기능 중심 응집도

## 1. 개요

Escape 키로 DISMISS 커맨드를 발행하는 기능이 누락되어 있다. 이를 어디에 구현할지에 대한 아키텍처 결정이 필요하다.

**핵심 질문:** 키를 중심으로 모을 것인가(keyboard pipeline), 기능을 중심으로 모을 것인가(FocusSensor)?

## 2. 현재 구조 분석

### 이벤트 → 커맨드 흐름 (현재)

```
Mouse/Focus Events → FocusSensor → FOCUS, SELECT, RECOVER
Keyboard Events   → Keyboard Pipeline → NAVIGATE, TAB, ACTIVATE, TOGGLE, DELETE
                     (sense → classify → route)
```

### Escape 키의 현재 경로

```
keydown "Escape"
  → KeyboardSensor (감지)
  → classifyKeyboard
       → Field 편집 중? → FIELD → routeField → FIELD_CANCEL ✅
       → 아니면? → hasKeybinding("Escape") 확인
            → useOSCore에 등록: { key: "Escape", command: OS_COMMANDS.EXIT }
            → routeCommand → EXIT 디스패치
                → BUT: EXIT에 대한 handler가 없음! ❌
```

**발견:** Escape는 실제로 `OS_COMMANDS.EXIT`에 바인딩되어 있으나, `EXIT` 커맨드에 리스너가 없어서 아무 동작도 하지 않는다. 한편 `DISMISS` 커맨드는 구현되어 있으나 Escape와 연결되어 있지 않다.

## 3. Red Team / Blue Team 분석

### 🔴 Red Team: 키 중심 응집도 (keyboard pipeline에 추가)

**주장:** "모든 키보드 이벤트는 keyboard pipeline을 통해야 한다"

**장점:**
- 현재 Arrow, Tab, Enter, Space, Backspace, Delete가 모두 keyboard pipeline에 있음
- Escape도 이미 `useOSCore.ts`에 keybinding 등록됨 (`EXIT`)
- 일관된 파이프라인: sense → classify → route → dispatch
- 키 충돌 방지: classify 단계에서 Field Escape vs Zone Escape를 분류 가능
- **경로가 이미 존재**: `EXIT`을 `DISMISS`로 바꾸기**만** 하면 됨

**공격 포인트:**
- FocusSensor에 Escape 추가하면 **두 곳**에서 keydown 처리 → 충돌/중복 위험
- Field 편집 중 Escape는 이미 keyboard pipeline에서 FIELD_CANCEL로 분기됨
  → FocusSensor에서도 처리하면 이중 dispatching 가능
- keyboard pipeline의 classify가 우선순위를 관리하는데, FocusSensor가 끼어들면 우선순위 체계 붕괴

### 🔵 Blue Team: 기능 중심 응집도 (FocusSensor에 추가)

**주장:** "DISMISS는 focus 기능이므로 focus 파이프라인에 있어야 한다"

**장점:**
- SELECT, FOCUS, RECOVER가 FocusSensor에 있으니 DISMISS도 같은 레이어
- focus 기능을 이해하려면 FocusSensor.tsx 하나만 보면 됨
- keyboard pipeline은 범용 라우터, focus-specific 로직은 focus에

**공격 포인트:**
- FocusSensor는 현재 **keydown을 전혀 처리하지 않음** (로깅만)
- 여기에 Escape를 추가하면 FocusSensor의 책임이 확장됨: mouse + focus + keyboard
- keyboard pipeline의 classify/route 우선순위 체계를 우회하게 됨
- Arrow/Tab도 FocusSensor에 없는데 Escape만 넣으면 비일관적

## 4. 결론 및 제안

### 승자: 🔴 키 중심 응집도

**이유:** 이미 Escape → EXIT 경로가 keyboard pipeline에 존재한다. 가장 작은 변경으로 해결된다.

**수정 방법 (1줄):**

```diff
// useOSCore.ts:94
-{ key: "Escape", command: OS_COMMANDS.EXIT, allowInInput: true },
+{ key: "Escape", command: OS_COMMANDS.DISMISS, allowInInput: true },
```

**또는** EXIT와 DISMISS를 별도로 유지하고 싶다면:
- EXIT = 앱/모달 닫기 (상위 레벨)
- DISMISS = selection 해제 (focus 레벨)

이 경우 Escape에 **cascading** 로직 필요:
1. selection 있으면 → DISMISS (deselect)
2. selection 없으면 → EXIT (앱 종료/모달 닫기)

이건 DISMISS 커맨드 내부나 별도 미들웨어에서 처리 가능.

### 핵심 판단 기준

| 기준 | 키 중심 | 기능 중심 |
|:---|:---|:---|
| **변경 크기** | 1줄 | 10줄+ |
| **중복 위험** | 없음 | keyboard pipeline과 충돌 가능 |
| **일관성** | Arrow/Tab/Enter와 같은 레이어 | 단독으로 keydown 처리하는 유일한 케이스 |
| **Field Escape 충돌** | classify에서 이미 분기됨 | 별도 분기 로직 필요 |
| **기존 경로** | EXIT 경로 재활용 | 새 경로 생성 |
