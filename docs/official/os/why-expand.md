# Why Expand

> **Status**: Working Draft  
> **Date**: 2026-02-18  
> **Pipeline Stage**: ③ Behavior (실행)  
> **Parent**: [VISION.md](../VISION.md)

---

## Abstract

Expand는 **트리 노드, 아코디언 패널, 디스클로저 — "접었다 펼치는" 행동의 토글과 상태 관리**를 제공하는 모듈이다.
Enter/Space로 항목을 펼치고, ArrowRight로 열고, ArrowLeft로 접는 — 이 패턴을 시스템 수준에서 보장한다.

---

## 1. Problem — 확장-축소는 시스템이 모르는 상태다

### 1.1 aria-expanded는 앱이 직접 관리해야 한다

브라우저는 `aria-expanded` 속성을 인식하지만, **토글 로직은 제공하지 않는다.** 개발자가 직접:

1. 어떤 요소가 확장 가능한지 판별
2. Enter/Space/Click 시 토글
3. ArrowRight로 열기, ArrowLeft로 닫기
4. 자식 노드의 가시성 관리
5. `aria-expanded="true/false"` 동기화

이 모든 것을 직접 구현해야 한다.

### 1.2 Navigation과 Expand의 겹침

트리뷰에서 `ArrowRight`는 두 가지 의미를 가진다:
- **닫힌 노드**: 펼치기 (expand)
- **열린 노드**: 첫 번째 자식으로 이동 (navigate)

이 이중 의미를 처리하지 않으면, 방향키가 항상 네비게이션만 하거나 항상 확장만 한다.

---

## 2. Cost — Expand를 직접 만드는 비용

| 증상 | 원인 |
|------|------|
| 트리에서 ArrowRight가 항상 다음 아이템으로 이동 | Expand와 Navigate 우선순위 미정의 |
| 펼친 상태에서 ArrowLeft가 부모로 안 감 | 닫기 → 부모 이동 2단계 로직 부재 |
| 스크린 리더가 확장 상태를 읽지 못함 | aria-expanded 동기화 누락 |
| 아코디언에서 하나만 열어야 하는데 다 열림 | 단일/다중 확장 정책 부재 |

---

## 3. Principle — 확장은 Navigation의 전제 조건이다

### 3.1 EXPAND 커맨드

```typescript
EXPAND({ action: "toggle" | "open" | "close", itemId: string })
```

단일 커맨드로 모든 확장-축소 의도를 표현한다. 앱은 `onExpand(itemId, expanded)` 콜백만 선언한다.

### 3.2 Navigate와의 협력

Navigate 커맨드가 실행될 때, Expand 상태를 참조한다:

| 현재 상태 | ArrowRight | ArrowLeft |
|----------|-----------|-----------|
| 닫힌 노드 | **EXPAND(open)** | 부모 노드로 이동 |
| 열린 노드 | 첫 자식으로 이동 | **EXPAND(close)** |
| 리프 노드 | 다음 visible 노드 | 부모 노드로 이동 |

이 규칙은 W3C APG Tree Pattern에서 정의한 표준 행동이다.

### 3.3 ARIA 동기화

Expand 모듈이 동작하면 ARIA 모듈이 자동으로 `aria-expanded`를 갱신한다. 개발자가 속성을 직접 관리하지 않는다.

---

## References

- Expand 구현: `os/3-commands/expand/`
- W3C APG Tree Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
- Role Presets: `tree`, `treeitem` — `registries/roleRegistry.ts`
- Unit Tests: `expand.test.ts`
- E2E Tests: `tree.spec.ts`

---

## Status of This Document

Working Draft. Tree/Accordion 패턴에서 검증 완료. Disclosure 패턴 통합 후 CR로 승격 예정.
