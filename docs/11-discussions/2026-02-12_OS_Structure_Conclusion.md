# OS 구조 논증 결론

## Why

현재 `os-new` 폴더 구조가 re-frame 6 도미노 이식으로서 정합적인지 검증하고, 레거시 정리 방향과 이상적 구조를 확립하기 위해.

## Intent

- 넘버링 레이어(1~6)의 re-frame 매핑 유효성 검증
- 넘버링 밖 폴더들의 존재 이유와 정리 기준 확립
- 컴포넌트 내부 레이어 구조(3층) 확정
- `1-listeners` 내부의 관심사 분리 기준 발견

## Warrants (확정된 논거)

### 파이프라인 구조
- **W1.** 1~6 넘버링은 re-frame 6 도미노의 FE 이식이며, 순서가 정확하다
- **W2.** `2-contexts`는 React Context가 아니라 `ctx.inject()`에 주입되는 coeffect 데이터다. 이름은 커널 API(`defineContext`)와 1:1 대응하므로 정확하다
- **W3.** 번호 있음 = 파이프라인 단계 (데이터가 흐르는 곳), 번호 없음 = 횡단 인프라 (참조되는 곳)

### 컴포넌트 레이어
- **W4.** `6-components`는 3개 레이어로 구성: `base/`(FocusGroup — 순수 행동) → `primitives/`(Zone, Item — OS 프리미티브) → `radix/`(Dialog, Modal — 복합 위젯)
- **W5.** `radix/` 명명은 LLM이 Radix 인터페이스 패턴을 자동으로 따르도록 하는 프롬프트 역할이다 (Tailwind 오염 없음)
- **W6.** `AntigravityOS.tsx` Facade가 public/private 경계를 담당하므로 별도 폴더 분리 불필요

### Listener 구조
- **W7.** `1-listeners` 내부는 `*Listener`로 통일 (Sensor, Intent 혼재 해소)
- **W8.** `keybindings.ts`, `osDefaults.ts`는 파이프라인이 아니라 매핑 설정이므로 `keymaps/`로 분리
- **W9.** `lib/` 유틸리티는 중앙 집중화하지 않고 응집도 기반으로 사용처 근처에 배치

### Zone과 Keybinding (별도 논의 필요)
- **W10.** App도 Kernel도 Zone이다 — Zone이 시스템의 통합 추상화 단위
- **W11.** Keybinding은 Zone 스코프이며 버블링한다. 캡처=Listener, 해석+버블링=커널, 데이터=Zone config
- **W12.** `onAction`, `onCopy` 등 명시적 prop은 하드코딩된 키바인딩이므로 범용 시스템으로 일반화 가능 (큰 건 — 별도 논의)

## 확정된 이상적 구조

```
os-new/
├── kernel.ts
├── AntigravityOS.tsx
│
│  ═══ 파이프라인 (1~6) ═══
├── 1-listeners/          ← *Listener 통일
├── 2-contexts/           ← ctx.inject() 데이터
├── 3-commands/           ← 상태 변환
├── 4-effects/            ← 사이드이펙트
├── 5-hooks/              ← 구독
├── 6-components/         ← View
│   ├── base/             ← 행동 프리미티브
│   ├── primitives/       ← OS 프리미티브 (ZIFT)
│   └── radix/            ← 복합 위젯
│
│  ═══ 비파이프라인 ═══
├── schema/               ← 공유 타입
├── middleware/            ← 인터셉터
└── keymaps/              ← 입력 매핑 설정
```

### 제거 대상
| 현재 | 행선지 |
|---|---|
| `primitives/` | → `6-components/base/` |
| `registry/` | → `schema/focus/` |
| `store/` | → `2-contexts/` |
| `shared/` | → `6-components/` |
| `state/` | → `schema/state/` |
| `core/` | → 커널 흡수 |
| `lib/` | → 각 사용처 근처로 분산 |

## 한 줄 요약

> **os-new는 re-frame 6 도미노를 정확히 이식한 파이프라인(1~6)과 3개의 횡단 인프라(schema/middleware/keymaps)로 구성되며, 컴포넌트는 base→primitives→radix 3층, Facade가 public 경계를 담당한다.**
