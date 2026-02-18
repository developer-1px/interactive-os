# Why Dismiss

> **Status**: Working Draft  
> **Date**: 2026-02-18  
> **Pipeline Stage**: ③ Behavior (실행)  
> **Parent**: [VISION.md](../VISION.md)

---

## Abstract

Dismiss는 **Escape 키로 "현재 맥락에서 벗어나는" 행동**을 관리하는 모듈이다.
동일한 Escape 키가 맥락에 따라 "선택 해제", "오버레이 닫기", "편집 취소" 등 다른 의미를 가진다. Dismiss는 이 다의성을 Zone 설정 기반으로 해결한다.

---

## 1. Problem — Escape는 만능 키다

### 1.1 하나의 키, 여러 의미

Escape 키는 웹에서 가장 과부하된 키다:

| 맥락 | 기대 동작 |
|------|----------|
| 모달 다이얼로그가 열려 있을 때 | 다이얼로그 닫기 |
| 아이템이 선택되어 있을 때 | 선택 해제 |
| 인라인 편집 중일 때 | 편집 취소 (FIELD_CANCEL) |
| 드롭다운 메뉴가 열려 있을 때 | 메뉴 닫기 |
| 아무 상태도 아닐 때 | 아무 일도 안 함 |

이 모든 경우를 `onKeyDown` 하나에서 분기하면, 코드가 맥락 폭발(context explosion)에 시달린다.

### 1.2 Overlay와의 분리 이유

Dismiss는 Overlay(why-overlay.md)에서 다루는 "닫기"와 겹치지만 독립적이다. Overlay가 없는 일반 리스트에서도 Escape로 선택을 해제할 수 있어야 한다. **Dismiss는 Overlay의 부분집합이 아니라, Overlay가 Dismiss의 한 사례다.**

---

## 2. Cost — Escape를 직접 관리하는 비용

| 증상 | 원인 |
|------|------|
| Escape가 다이얼로그만 닫고 선택은 안 풀림 | 우선순위 규칙 부재 |
| 편집 중 Escape가 모달까지 닫음 | FIELD_CANCEL과 OVERLAY_CLOSE 충돌 |
| 중첩 오버레이에서 Escape가 전부 닫음 | 스택 기반 처리 부재 |
| Escape가 아무 일도 안 하는 구간이 있음 | 기본 동작(fallback) 미정의 |

---

## 3. Principle — Zone이 Dismiss 정책을 선언한다

### 3.1 Zone 설정 기반 해석

각 Zone은 `dismiss.escape` 설정으로 Escape의 의미를 선언한다:

```typescript
dismiss: {
  escape: "deselect" | "close" | "none"
}
```

| 값 | 동작 | 사용 예 |
|----|------|--------|
| `"deselect"` | 선택 해제 (선택이 없으면 아무 일도 안 함) | listbox, grid |
| `"close"` | Zone 비활성화 + onDismiss 콜백 호출 | dialog, menu |
| `"none"` | 아무 일도 안 함 | toolbar, static group |

### 3.2 Role Preset이 기본값을 제공한다

개발자가 직접 dismiss 정책을 설정할 필요가 없다. Role preset이 적절한 기본값을 제공한다:

| Role | dismiss.escape 기본값 |
|------|--------------------|
| `listbox` | `"deselect"` |
| `dialog` | `"close"` |
| `menu` | `"close"` |
| `toolbar` | `"none"` |
| `radiogroup` | `"deselect"` |

### 3.3 Field와의 우선순위

편집 모드가 활성화되어 있으면, KeyboardListener의 Key Ownership Model이 Escape를 `FIELD_CANCEL`로 라우팅한다. Dismiss 커맨드에 도달하기 전에 Field가 먼저 처리한다.

---

## References

- Dismiss 구현: `os/3-commands/dismiss/escape.ts`
- Resolver: `os/3-commands/dismiss/resolveEscape.ts`
- Role Presets: `os/registries/roleRegistry.ts` (dismiss 설정)
- Unit Tests: `escape.test.ts` (5 cases)
- E2E Tests: `focus-showcase.spec.ts`, `dialog.spec.ts`

---

## Status of This Document

Working Draft. 기본 deselect/close 정책은 안정. 중첩 오버레이 스택과의 통합 검증 후 CR로 승격 예정.
