# OS 커맨드 어휘와 Listener 아키텍처

## Why
E2E 테스트 실패의 근본 원인이 코드 버그가 아니라 **설계 충돌**이었다. `OS_SELECT`가 "시각적 선택"과 "앱 토글"을 혼동하고 있었고, 이를 해결하려면 커맨드 어휘 체계와 Listener의 책임 범위를 재정의해야 했다.

## Intent
OS 커맨드를 **W3C ARIA APG 표준 용어에 1:1 매핑**하고, Listener를 **DOM 기반 Smart Translator**로 설계하여 Zone의 role에 따라 정확한 커맨드를 dispatch하는 구조를 확립한다.

## Warrants (확정된 논거)

| # | Warrant |
|---|---------|
| W1 | `SELECT`가 "선택"과 "토글"을 혼동 → E2E 실패 (실증) |
| W2 | Click과 Space는 서로 다른 입력 의도 (Focus vs Toggle) |
| W3 | Role/Strategy 패턴 — 커맨드는 의도만, 반응은 대상이 결정 |
| W4 | W3C APG 표준 용어: **Focus ≠ Selection ≠ Activate ≠ Expand** |
| W5 | APG에서 Space의 의미는 role 종속 (option→select, checkbox→check) |
| W6 | "selection follows focus"는 Zone의 전략이지 Listener의 책임 아님 |
| W7 | SELECT(aria-selected)와 TOGGLE(aria-checked)은 같은 패턴의 다른 인스턴스 |
| W8 | **SRP**: 1 커맨드 = 1 역할 → 순수하고 디버깅 용이. 커맨드 이름 = 계약 |
| W9 | 커맨드를 ARIA 속성에 1:1 매핑 → 자기 설명적 트랜잭션 로그 |
| W10 | ARIA = preset. 절대헌법 아님. 앱이 원하는 대로 조합 가능 |
| W11 | Zone config(onCheck, onSelect, onActivate)가 곧 전략 선언 |
| W12 | 키 입력은 두 종류: **확정**(Cmd+A→SELECT_ALL) vs **맥락적**(Space→Zone 의존) |
| W13 | 맥락적 키 해석은 Zone config 참조 필수 |
| W14 | Raw input 커맨드는 해석 책임을 옮길 뿐 제거하지 않음 |
| W15 | "해석된 의도"를 보내는 게 트랜잭션 가독성이 더 높음 |
| W16 | Listener는 Smart Translator — DOM 바로 앞에 있으므로 Zone 전략을 아는 게 자연스러움 |
| W17 | 커맨드 어휘 = ARIA 속성의 1:1 투영 |
| W18 | Listener는 DOM 전제 → DOM에서 role 읽는 게 자연스러움 |
| W19 | **DOM = Listener의 유일한 데이터 소스.** ZoneRegistry 의존 불필요 |

## 확정된 설계 원칙

### 커맨드 어휘 (ARIA 기반)

| ARIA 속성 | OS 커맨드 | 의미 |
|-----------|----------|------|
| `activeElement` | **FOCUS** | 포커스 이동 |
| `aria-selected` | **SELECT** | 선택 상태 변경 |
| `aria-checked` | **CHECK** | 체크 상태 변경 |
| `aria-expanded` | **EXPAND** | 펼침/접힘 |
| (default action) | **ACTIVATE** | 기본 동작 실행 |
| (removal) | **DELETE** | 제거 |
| (reorder) | **MOVE** | 이동 |

### Listener 아키텍처

- **Smart Translator**: DOM에서 role을 읽고 정확한 커맨드를 dispatch
- **DOM만 의존**: ZoneRegistry import 불필요
- **확정 키**: Keybinding에서 고정 매핑 (Cmd+A → SELECT_ALL)
- **맥락적 키**: role 읽어서 분기 (Space on checkbox → CHECK, Space on option → SELECT)

### 레이어 의존 구조

```
L1 Listener  → DOM만 의존
L3 Command   → ZoneRegistry 의존 (onCheck → app command)
L7 Component → DOM에 role 마크업 + ZoneRegistry에 등록
```

## 한 줄 요약

> **OS 커맨드 어휘는 ARIA 속성에서 직접 도출하고, Listener는 DOM의 role을 읽어 맥락적 키 입력을 정확한 커맨드로 번역하는 Smart Translator이다.**
