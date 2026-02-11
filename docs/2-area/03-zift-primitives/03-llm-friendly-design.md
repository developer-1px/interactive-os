# LLM 친화 설계 전략 — Naming & Layering

> ZIFT의 API 설계에서 LLM의 사전 지식을 최대 활용하기 위한 원칙

---

## 1. 핵심 원칙

### 1.1 매직 금지 (No Magic)

LLM은 명시적 마커만 신뢰한다. 암묵적 규칙은 존재하지 않는 것과 같다.

| ✅ 명시적 | ❌ 매직 |
|:---|:---|
| `<Trigger.Portal>` — 마커가 의도를 선언 | "Trigger 안에 Zone이 있으면 자동 Portal" |
| `role="dialog"` — W3C 명세에 정의 | 컴포넌트 조합으로 동작이 암묵적 변경 |
| `<Trigger.Dismiss>` — 이름이 곧 기능 | `onPress={OS_CLOSE_OVERLAY()}` — 커맨드 이름을 알아야 함 |

### 1.2 명시적의 기준 = 외부 명세

```
W3C/ARIA에 명세가 있는가?
  ├── Yes → role로 선언 (LLM이 이미 앎)
  └── No  → 명시적 컴포넌트로 제공 (이름이 가르침)
```

예시:
- `role="dialog"` → W3C WAI-ARIA에 focus trap, modal 정의 → **role**
- Portal → W3C에 없음 → **`Trigger.Portal` 컴포넌트**
- Dismiss → W3C에 없음 → **`Trigger.Dismiss` 컴포넌트**

### 1.3 ONE Prescribed Way

OS 기본 제공 기능은 개발자에게 커맨드 이름을 요구하지 않는다.

```tsx
// ❌ 커맨드 이름을 알아야 함
<Trigger onPress={OS_CLOSE_OVERLAY()}>Close</Trigger>

// ✅ 그냥 쓰면 됨
<Trigger.Dismiss>Close</Trigger.Dismiss>
```

---

## 2. 2층 퍼블리싱 전략

### Layer 1: ZIFT Primitives (조립용)

```
Trigger · Zone · Item · Field
```

- W3C ARIA 기반
- headless, 조립 가능
- OS 내부 + 고급 사용자용

### Layer 2: Published Components (사용자용)

```
Dialog · Menu · Select · Popover · Tooltip · Tabs ...
```

- MUI/Radix 업계 표준 네이밍
- Layer 1 위에 구축
- LLM이 이름만으로 역할을 즉시 인식

```
┌─────────────────────────────────────┐
│  Published Components (Layer 2)     │
│  Dialog · Menu · Select · Tooltip   │
│  ← MUI/Radix 네이밍 = LLM 즉시 인식  │
├─────────────────────────────────────┤
│  ZIFT Primitives (Layer 1)          │
│  Trigger · Zone · Item · Field      │
│  ← W3C ARIA 기반 = 조립 가능         │
└─────────────────────────────────────┘
```

### Layer 2 예시

```tsx
// Dialog — 내부적으로 Trigger role="dialog" + Trigger.Portal + Zone
<Dialog>
  <Dialog.Trigger>Open Settings</Dialog.Trigger>
  <Dialog.Content title="Settings">
    <Item id="theme">Theme</Item>
    <Dialog.Close>Cancel</Dialog.Close>
  </Dialog.Content>
</Dialog>
```

### 전략의 근거: shadcn/ui 모델

```
shadcn/ui  : Radix primitives → 익숙한 이름의 styled components
ZIFT 컴포넌트 : ZIFT primitives → 익숙한 이름의 styled components
```

---

## 3. LLM 사전 지식 활용 매트릭스

| 지식 영역 | LLM 학습량 | ZIFT 활용 방식 |
|:---|:---|:---|
| W3C ARIA roles | ★★★★★ | Zone/Trigger의 `role` prop |
| Radix compound 패턴 | ★★★★★ | `Trigger > Trigger.Portal > Zone > Trigger.Dismiss` |
| MUI 컴포넌트 네이밍 | ★★★★★+ | Layer 2 Published Components 이름 |
| HTML `<dialog>` | ★★★★★ | `Trigger.Portal` 내부 구현 |
| HTML Popover API | ★★★☆☆ | 미래 Core 구현 마이그레이션 대상 |
| Invoker Commands | ★☆☆☆☆ | 미래 참조 (아직 proposal) |

### 설계 원칙

> **LLM의 ★★★★★ 영역을 기반으로 Facade를 설계하고,**  
> **★☆☆☆☆ 영역은 Core 내부 구현으로 숨긴다.**

---

## 4. Core Layer 커버리지 = LLM 코드 품질 상한선

```
Core Layer가 커버하는 영역 → LLM이 ZIFT 패턴으로 코드 작성
Core Layer가 커버하지 않는 영역 → LLM이 useState + onClick으로 회귀
```

- 현재 `OS.Modal`은 Core Layer 부재로 LLM이 임시 구현한 산물
- Overlay에 대한 Core 지원(`Trigger.Portal` + `Trigger.Dismiss`)이 추가되면, LLM은 이 패턴으로 코드 생성
- `no-handler-in-app` lint가 `onClick` 회귀를 1차 방어

> [!IMPORTANT]
> **ZIFT primitives의 커버리지를 넓히는 것 = LLM이 생성하는 코드의 품질 상한선을 올리는 것**
