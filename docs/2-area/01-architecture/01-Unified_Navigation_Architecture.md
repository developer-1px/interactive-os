# 통합 내비게이션 아키텍처 & 포커스 가능 존 (2026-02-03)

## 개요
이 업데이트는 Antigravity OS의 내비게이션 로직을 단일 커맨드 중심 파이프라인으로 통합합니다. 계층적 레이아웃(칸반 보드 등)에서의 "영역 갭(Area Gap)"을 **포커스 가능 존(Focusable Zones)** 도입과 물리 로직을 하드웨어 레이어(`KeyboardSensor`)에서 로직 레이어(`runOS 파이프라인`)로 이전하여 해결합니다.

## 주요 변경 사항

### 1. 포커스 가능 존 (`FocusGroup`)
Zone은 관할권 경계이자 포커스 가능 아이템으로 동시에 작동할 수 있습니다.
- **`focusable` prop**: 활성화 시 Zone이 `data-item-id`를 렌더링하여 공간/로빙 탐색으로 도달 가능.
- **자기 정체성**: 포커스 가능 Zone은 포커스를 받을 수 있어 빈 컬럼이나 영역 전체를 그룹 액션용으로 선택 가능.
- **계층적 컨텍스트**: `setFocus`는 레지스트리 내 아이템 위치를 기반으로 `activeZoneId`와 `focusPath`를 자동으로 해결.

### 2. 커맨드 중심 물리 (`runOS 파이프라인`)
이전에는 내비게이션 물리(버블링/딥다이브)가 `InputEngine.tsx`에 존재했습니다. 이는 인스펙터에 불투명하고 커스터마이징이 어려웠습니다.
- **`OS_NAVIGATE` 커맨드**: 이제 계층적 순회 로직을 포함.
  - **버블링**: 탐색이 경계에 도달하면 `focusPath`를 따라 다음 가용 Zone으로 버블링.
  - **딥다이브**: Zone 진입 시 (칸반 컬럼 이동 등) 마지막 포커스 자식 또는 첫 아이템에 자동 포커스.
- **텔레메트리**: 모든 탐색이 인스펙터에서 일급 커맨드로 표시.

> **현재 구현**: `src/os/features/focus/pipeline/3-resolve/`의 `updateNavigate.ts`에서 처리.

### 3. 미들웨어 중복 제거
이중 실행 오류를 방지하기 위해 `navigationMiddleware.ts`에서 중복 내비게이션 로직 제거. OS가 포커스 이동의 "방법"을 처리하고, 앱 레이어가 비즈니스 로직 부수 효과를 처리.

### 4. 하드웨어 레이어 단순화 (`KeyboardSensor`)
`KeyboardSensor`는 이제 순수한 "입력→의도" 변환기.
- 더 이상 물리 코드를 포함하지 않음.
- 레지스트리를 사용하여 물리 키를 커맨드에 매핑.
- IME 안전 및 입력 가드 처리.

> **현재 구현**: `src/os/features/keyboard/pipeline/` 및 `src/os/features/focus/pipeline/1-sense/FocusSensor.tsx`

### 칸반 보드 워크플로 예시
1. 사용자가 컬럼 A의 카드에서 `ArrowRight` 누름.
2. `FocusSensor`가 `OS_NAVIGATE { direction: 'RIGHT' }` 전달.
3. `runOS` 파이프라인이 컬럼 A 내 공간 탐색 시도 (실패).
4. `focusPath`를 따라 '보드' Zone으로 버블.
5. 보드 Zone이 컬럼 B (포커스 가능 Zone) 발견.
6. 컬럼 B로 "딥다이브"하여 첫 카드에 포커스.
7. 인스펙터 로그: `NAVIGATE (RIGHT) -> SUCCESS (Target: card-b1)`.

## 효과
- **제로 오버헤드**: 로직이 중앙화되어 앱 개발자의 인지 부담 감소.
- **높은 텔레메트리**: 모든 탐색 단계가 OS 인스펙터를 통해 감사 가능.
- **재귀적 무결성**: 중첩 레이아웃(Zone 내 Zone)이 표준 버블링으로 즉시 동작.
