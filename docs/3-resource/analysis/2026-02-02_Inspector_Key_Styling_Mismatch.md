# Inspector Key Styling Mismatch for START_EDIT (ENTER)

## 배경 (Context)
사용자는 Command Inspector에서 `START_EDIT` 커맨드의 단축키인 `ENTER`가 **활성화된 상태임에도불구하고** 다른 키들과 시각적 스타일(Border 등)이 다르다고 지적했습니다.

> "START_EDIT가 가능한데 왜 다른 애들과 border가 표시가 달라?"

## 분석 (Analysis)

### 1. 현재 스타일링 로직 분석
`CommandInspector.tsx` 내 `Kbd` 컴포넌트 사용부를 보면, 상태에 따라 복잡한 `className` 오버라이드를 적용하고 있습니다:

```tsx
<Kbd
    variant={active ? 'active' : 'ghost'}
    className={!isDisabled && !active ? (
        isLastExecuted 
            ? 'text-white border-white/20 bg-indigo-400/50' 
            : 'text-slate-500 scale-90 border-white/5 bg-black/20' // <--- "Enabled but Idle" 상태
    ) : 'scale-90'}
>
```

### 2. 문제점 (Hypothesis)
*   **"Disable"처럼 보이는 "Idle" 상태**: `text-slate-500`, `scale-90`, `bg-black/20` 조합은 시각적으로 **비활성화(Disabled)** 상태와 매우 유사합니다.
*   **Disabled 상태와의 차이**: 역설적으로 커맨드가 *비활성화(Disabled)*되면 코드는 `scale-90`만 적용하고 `variant="ghost"`(`border-transparent`)를 따릅니다.
    *   **Enabled (Idle)**: `border-white/5` (희미한 테두리 있음)
    *   **Disabled**: `border-transparent` (테두리 없음)
*   사용자는 이 미묘한 테두리 차이(`border-white/5`)를 "왜 다르냐"고 인식했거나, 혹은 "가능한데 왜 이렇게 흐리게(slate-500) 표시되냐"고 묻는 것일 수 있습니다.

### 3. 비교 대상 불일치
*   사용자가 비교하고 있는 "다른 애들"이 **최근 실행된(Last Executed)** 커맨드이거나, **입력 중(Active Input)** 상태의 키일 수 있습니다. 이 경우 명조(Contrast) 차이가 극심하여 `START_EDIT`가 상대적으로 죽어 보입니다.

## 제안 및 계획 (Proposal/Plan)

### 1. 상태별 스타일 명확화 (Design System Alignment)
Inspector 내 `Kbd` 스타일링을 임의의 오버라이드 대신 `Kbd` 컴포넌트의 `variant`로 흡수하거나, 명확한 의미(Semantic)를 부여해야 합니다.

*   **Enabled (Default)**: `text-slate-300`, `scale-100`, `border-white/10` (더 잘 보이게)
*   **Disabled**: `text-slate-700`, `opacity-50`

### 2. 가시성 개선
`START_EDIT`와 같이 **"현재 컨텍스트에서 주요한 액션"**은 단순히 Enabled를 넘어 Highlight 될 필요가 있을 수 있습니다. (e.g. `Recommended` 상태)

---
**보고서 작성일**: 2026-02-02
**상태**: 검토 대기 (Open for Review)
