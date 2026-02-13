# Retrospective Log: OS 키바인딩 아키텍처 재설계

> 조각 단위로 발견·실수·교훈을 누적 기록한다. 프로젝트 종료 시 전체 회고의 원본 자료.

---

## 조각 1: todoKeys.ts 삭제 (2026-02-13)

### 발견
- `TODO_KEYMAP`이 **아무 데서도 import되지 않는 dead code**였다. VSCode 패턴의 keymap은 이미 사실상 폐기된 상태.
- OS 자체 `Keybindings` 레지스트리 + `osDefaults.ts`가 실제로 동작 중.
- `createTrigger()`가 이미 `triggers.ts`에 구현되어 있었다 — Discussion에서 설계를 논의했는데 부분 구현이 이미 존재.

### 실수
- `clipboard.ts` 삭제를 시도하며 테스트 import를 v3로 교체했으나, **레거시(todoSlice)와 v3(TodoApp)가 별도 상태 슬라이스**라는 사실을 간과. 테스트 실패 후 되돌림.

### 교훈
- **파일 삭제 전에 grep으로 import 확인** — todoKeys.ts는 grep 한 번으로 dead code 판명.
- **상태 슬라이스 경계를 넘는 마이그레이션**은 단순 import 교체가 아니다. v3 전환 프로젝트의 범위.
- rules.md #7 "하나를 끝내고 넘어간다" — clipboard.ts는 scope를 벗어나므로 미뤘고, 이것이 올바른 판단이었다.

---

<!-- 다음 조각의 회고를 여기 아래에 추가 -->

## 조각 2: WidgetConfig.keybindings (2026-02-13)

### 발견
- `Keybindings` 레지스트리의 `register`/`registerAll`/`resolve`가 앱 커스텀 keybinding을 **이미 완벽히 지원**했다. 인프라를 새로 만들 필요 없이, 위젯에서 기존 인프라에 연결만 하면 됐다.
- Zone이 없는 위젯(`TodoToolbar`)은 `ZoneComponent`가 렌더되지 않으므로 keybindings가 등록되지 않는 **구조적 한계** 발견.
- 위젯 경계를 넘는 keybinding 참조(Toolbar의 toggleView를 List에 선언)는 소유권을 훼손한다.

### 실수
- `TodoToolbar`에 keybinding을 추가한 뒤 `TodoToolbar.Zone`이 렌더되지 않는다는 것을 뒤늦게 파악.

### 교훈
- **Zone이 없으면 keybinding도 없다** — 현재 구조의 제약. 후속 과제: Zone 없이도 keybinding 등록 가능한 메커니즘 (or 앱 레벨 Zone 도입).
- **인프라부터 확인** — 테스트를 먼저 작성했더니 기존 인프라로 이미 통과, 불필요한 구현을 피했다.

---

<!-- 조각 2 끝 -->

## 조각 3: Zone 없는 위젯 keybinding 분석 (2026-02-13)

### 발견
- `toggleView(Meta+Shift+V)`는 레거시 `todoKeys.ts`에서도 **동작 안 했다** — dead code에 선언만 있었음.
- 이건 "기존 기능 마이그레이션"이 아니라 "새 기능 추가" — scope creep.

### 교훈
- **없었던 걸 만들지 마라** — 프로젝트 목표는 "제거"였지 "추가"가 아니다.
- Zone 없는 위젯의 keybinding은 구조적 과제지만, 현재 프로젝트의 MVP가 아님.

---

## 조각 4: clipboard.ts 삭제 (2026-02-13)

### 발견
- "v3 마이그레이션이 필요하다"는 과대평가였다. 실제로는 테스트 2개의 import 변경 + mock 전환 ≈ 20줄.
- OS dispatch chain 테스트는 앱 커맨드에 의존할 필요 없다 — mock으로 격리하면 OS 행동만 검증 가능.
- `todo.v3.test.ts`에 clipboard 테스트가 이미 있었다 — 중복 테스트만 제거하면 됐음.

### 실수
- 조각 1에서 "blocked"라고 판단하고 되돌린 것이 30분 지연의 원인.

### 교훈
- **"blocked"라고 판단하기 전에, 실제 변경 범위를 줄 단위로 세어라.** 가정하지 말고 측정하라.
- OS 테스트와 앱 테스트는 관심사 분리 — OS 테스트는 mock 콜백으로 충분.

