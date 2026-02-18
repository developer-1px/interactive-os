# [아키텍처] 키보드 거버넌스: 두꺼비집(Circuit Breaker) 아키텍처

## 1. 개요
본 보고서는 Antigravity Interactive-OS의 핵심 인터랙션 원칙인 **'키보드 제어권의 귀속과 관리 방식'**에 대한 끝장토론 결과를 정리합니다. 특히, 개별 컴포넌트가 직접 키 이벤트를 처리하는 방식(Decentralized)과 OS 레이어에서 통합 관리하는 방식(Centralized)의 충돌을 분석하고, 최종적인 '두꺼비집(Circuit Breaker)' 아키텍처를 제안합니다.

## 2. 분석

> **현재 구현**: `src/os/keymaps/` (키보드 파이프라인) 및 `src/os/3-commands/` (커맨드 핸들러)

### 2.1. 논쟁의 핵심: "누가 이벤트를 소유하는가?"

#### **레드팀 (Decentralized): "로컬리티와 개발 생산성"**
- **근거**: `TodoItem` 내부에서 `onKeyDown`을 처리하는 것이 코드의 가독성이 높고, 특정 기능과 키 바인딩을 한눈에 볼 수 있다.
- **우려**: 중앙 파일(`todoKeys.ts`)이 비대해지면 'God File'이 되어 유지보수가 어려워지고, 작은 기능을 추가할 때마다 여러 파일을 오가야 하는 'Ping-pong' 개발을 유발한다.

#### **블루팀 (Centralized): "물리 자원의 희소성과 충돌 탐지"**
- **근거**: 키보드는 단 하나뿐인 **희소한 전역 자원**이다. 여러 구역(Zone)이 같은 키(`Enter`, `Space`)를 서로 다른 용도로 사용하려고 할 때, 이를 중재할 단일 진실 공급원(SSOT)이 없으면 '키 가로채기(Key Stealing)' 문제를 해결할 수 없다.
- **해결**: 중앙 관리 방식을 통해 "누가 'Enter'를 훔쳐 갔는가?"에 대한 답을 한 파일에서 즉시 찾을 수 있는 **역방향 조회(Reverse Lookup)** 성능을 확보한다.

### 2.2. Antigravity의 선택: "두꺼비집(Circuit Breaker) 패턴"

Antigravity는 물리적 배선(Keybinding)과 가전제품(Command)을 분리하는 방식을 채택합니다.

1.  **Jurisdictional Zone (관할 구역)**: `Zone.tsx`가 모든 키 이벤트를 흡수하는 '블랙홀'이자 '변전소' 역할을 수행합니다.
2.  **External Keymap (외부 배선도)**: 모든 키 바인딩은 기능을 정의하는 `Command` 내부가 아닌, 별도의 `KeymapConfig`에서 관리합니다. 
3.  **Command-Centricity**: 컴포넌트는 "어떤 키가 눌렸는가"를 몰라야 하며(Headless), 오직 "기능이 실행되었다"는 신호만 수신합니다.

### 2.3. 상세 구현 원칙 (The "How")

| 구분 | 관리 주체 | 구현 방식 |
| :--- | :--- | :--- |
| **물리적 트리거** | `KeymapConfig` | `key: "Meta+Z"`와 같이 물리 키를 명시 |
| **논리적 게이팅** | `Rule / Expect` | `when: Expect("isEditing").toBe(false)`와 같은 상태 조건 부여 |
| **이벤트 캡처** | `Zone.tsx` | `onKeyDown`의 `preventDefault` 및 `stopPropagation`을 통한 전역 오염 방지 |
| **입력 보호** | `allowInInput` | `<input>` 내부에서 허용될 Hotkey와 일반 타이핑을 구분 |

## 3. 결론 및 제안

키보드 관리는 **"OS 레이어가 관리하되, 구역(Zone)별로 위임된 배선도를 따른다"**로 명확히 정의합니다.

1.  **중앙 관리 유지**: `todoKeys.ts`와 같은 중앙 배선도를 유지하여 키 충돌 가시성을 확보합니다.
2.  **데이터 기반 위임**: `Zone`은 단순히 이벤트를 전달하는 것이 아니라, 현재 `activeZone`과 `isInput` 상태를 기반으로 명령을 필터링하는 **지능형 게이트웨이**가 됩니다.
3.  **향후 과제**: 중앙 파일이 커지는 문제를 해결하기 위해, `Zone` 단위의 배선도를 조립(Composition)하는 `combineKeymaps` 패턴을 도입하여 모듈성을 강화할 것을 권장합니다.

---
*Antigravity 아키텍처 보고서 (2026-02-03)*
