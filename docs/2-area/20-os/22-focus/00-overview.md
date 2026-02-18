# 포커스 시스템 개요

> **구현 위치**: `src/os/3-commands/`, `src/os/6-components/base/`, `src/os/registries/`
> **진실의 원천**: [SPEC.md](../SPEC.md) §2-§9

---

## 1. 핵심 철학

> **"브라우저는 캔버스일 뿐, 물리학은 엔진이 담당한다."**

Interactive-OS는 웹 페이지가 아닌 **애플리케이션**이다. 브라우저 포커스(`tabIndex`, `activeElement`)를 완전히 대체하여, OS 수준의 **결정론적 내비게이션**을 구현한다.

| 전략 | 설명 |
|:--|:--|
| **블랙홀(Black Hole)** | 모든 Item에 `tabIndex="-1"` 적용, 브라우저 Tab Order에서 제거 |
| **Zone 전략** | DOM 구조가 아닌 Config(orientation, loop, entry...)로 다음 위치 계산 |
| **입력 싱크** | Edit Mode 외에는 포커스를 Zone Container에 고정 |

---

## 2. Config-Driven 행동 모델

6개의 Config 객체(`navigate`, `tab`, `select`, `activate`, `dismiss`, `project`)로 ARIA 패턴을 선언적으로 정의한다.

> **상세 명세**: [SPEC.md §3-§6](../SPEC.md) (Command Behavior, Effect, Context, Keymap)
> **Role Preset 테이블**: [SPEC.md §7](../SPEC.md) (17 roles × 10 fields)
> **Component 계약**: [SPEC.md §9](../SPEC.md) (FocusGroup, FocusItem props + ARIA attributes)

---

## 3. 주요 패턴

### Kanban 2D 내비게이션
Zone 계층과 Config 조합으로 N차원 포커스 구현:
- 컬럼 내: ↑↓ (vertical), 컬럼 간: ←→ (부모 Zone 버블)
- `seamless: true`: 컬럼 경계 없는 공간 탐색

### 포커스 가능 Zone
Zone이 Container이면서 동시에 Target인 경우:
- Zone 자체도 아이템으로 등록
- Enter: 내부 진입 / Escape: 부모로 복귀

### 가상 포커스 (Combobox)
- `virtualFocus: true`: `aria-activedescendant` 사용
- Input이 실제 포커스 유지, Arrow로 가상 커서 이동
- 📚 [Deep Dive: Virtual Focus & aria-activedescendant](../../3-resource/04-architecture/2026-0215-virtual-focus-activedescendant.md)

---

## 4. 안티 패턴

| ❌ 잘못된 패턴 | ✅ 올바른 패턴 |
|:--|:--|
| 앱에서 인덱스 수학 | OS에 내비게이션 위임 |
| 수동 `tabIndex` 관리 | Roving TabIndex 자동 관리 |
| `onClick`에서 `focus()` 호출 | kernel `dispatch(FOCUS(...))` 사용 |
| 여러 Provider nesting | Zone Config로 선언 |

---

*축소 정리: 2026-02-18 — SPEC.md 중복 제거, 철학/패턴/안티패턴만 보존*
