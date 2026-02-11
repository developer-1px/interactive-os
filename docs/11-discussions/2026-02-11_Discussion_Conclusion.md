# Discussion Conclusion — Modal은 누구의 책임인가?

> **Date**: 2026-02-11  
> **Duration**: ~1.5h (08:09 → 11:37)

---

## Why

ZIFT(Zone-Item-Field-Trigger) 프레임워크가 Modal이라는 **첫 번째 경계 사례**에 직면했다. Modal은 "시간적으로 생기고 사라지는 공간"이라 ZIFT의 "정적 공간" 가정과 충돌한다. 이 충돌을 어떻게 해결할 것인가?

## Intent

ZIFT의 4개 원형을 유지하면서 **모든 Overlay**(Dialog, Menu, Tooltip, Popover...)를 커버하는 설계를 발견하고, **LLM이 학습 비용 0으로 사용할 수 있는** 인터페이스를 설계하고 싶었다.

## Warrants (완결)

### 아키텍처 원칙

| # | Warrant |
|:---|:---|
| W1 | ZIFT = 정적 공간의 포커스 관리 Facade (Zone, Item, Field, Trigger) |
| W3 | Zone `role="dialog"` → 내부 포커스(trap, autoFocus, ESC, restore)는 이미 ZIFT |
| W5 | Overlay의 on/off 상태는 Kernel이 소유해야 함 (`overlays.stack`) |
| W15 | **Passive Primitive**: 구조만 선언, 모든 관리는 OS |
| W19 | 열기/닫기 모두 선언적. Trigger(열기) + Trigger.Dismiss(닫기) |

### Overlay 설계

| # | Warrant |
|:---|:---|
| W7 | Trigger와 Content는 co-located (Modal 묘지 방지) |
| W8 | Trigger의 `role`이 트리거 메커니즘 결정 (click/hover/contextmenu) |
| W10 | Overlay = Trigger-Overlay(선언적) + Command-Overlay(Toast, 명령적) |
| W13 | Trigger가 Portal을 children으로 소유 → "선언 = 등록" |
| W23 | Nested overlay는 stack. Dismiss = top pop. ID 지정 불필요 |
| W27 | OS 기본 기능은 ONE prescribed way. 커맨드 노출 금지 |
| W28 | Facade(`Trigger.Dismiss`) / Core(`OS_DISMISS(id)`) 이중 구조 |

### LLM 친화 설계

| # | Warrant |
|:---|:---|
| W18 | **Core Layer 커버리지 = LLM 코드 품질 상한선** |
| W30 | **매직 금지**. 모든 의도는 명시적 마커로 선언 |
| W31 | 명시적의 기준 = W3C/ARIA 명세 존재 여부. 있으면 role, 없으면 컴포넌트 |
| W35 | LLM 사전 지식: ARIA ★★★★★, Radix ★★★★★, MUI ★★★★★+ |
| W37 | TypeScript namespace merge → `Trigger.` 자동완성이 Portal, Dismiss 노출 |

### 전략적 결론

| # | Warrant |
|:---|:---|
| W38 | `Trigger` = Root. namespace merging. Radix 5단 → ZIFT 4단 |
| W43 | **Radix 인터페이스 계승 + ZIFT Kernel 이식** = TestBot-Playwright 전략 |
| W44 | **3층**: MUI(완성) / Radix(headless) / ZIFT(engine) |
| W45 | **Bottom-up**: Kernel → Radix Interface → MUI Interface |

---

## 한 줄 요약

> **Radix의 인터페이스를 그대로 계승하되 ZIFT Kernel 위에 구축하면, LLM은 학습 비용 0으로 접근성 완전한 UI를 만들 수 있다.**
