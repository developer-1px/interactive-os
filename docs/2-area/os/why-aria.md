# Why ARIA

> **Status**: Working Draft
> **Date**: 2026-02-18
> **Pipeline Stage**: ④ Output / Perception (피드백)
> **Parent**: [VISION.md](../VISION.md)

---

## Abstract

ARIA 모듈은 **UI의 의미(semantics)를 보조 기술(Assistive Technology)에 전달**하는 피드백 계층이다.
Interactive OS에서 ARIA는 개별 기능이 아니라 **모든 행동 모듈의 출력(output)**이다. Focus가 이동하면 `aria-current`가 갱신되고, Selection이 바뀌면 `aria-selected`가 갱신된다. 개발자가 ARIA 속성을 직접 관리하지 않는다.

---

## 1. Problem — 접근성은 1,000페이지 스펙이다

### 1.1 ARIA는 어렵다

[WAI-ARIA 1.2 스펙](https://www.w3.org/TR/wai-aria-1.2/)은 방대하다. 역할(role)만 80개 이상이고, 속성(property)은 50개가 넘는다. 올바르게 적용하려면:

- **어떤 role을 쓸 것인가?** — `listbox` vs `menu` vs `grid` — 비슷해 보이지만 행동이 완전히 다르다
- **어떤 속성을 붙일 것인가?** — `aria-selected` vs `aria-checked` vs `aria-current` — 언제 뭘 써야 하는가?
- **상태 변경 시 뭘 해야 하는가?** — `aria-activedescendant` 갱신? `aria-expanded` 토글?
- **컨테이너와 아이템의 관계는?** — `role="listbox"` 안의 자식은 반드시 `role="option"`?

이 모든 것을 매 컴포넌트마다 올바르게 적용하는 것은 **전문 접근성 컨설턴트가 아닌 이상 사실상 불가능**하다.

### 1.2 결과: 대부분의 웹 앱은 접근성이 깨져 있다

- [WebAIM Million 2024](https://webaim.org/projects/million/): 상위 100만 사이트 중 **95.9%가 WCAG 위반**
- 가장 흔한 오류: 누락된 `alt`, 빈 링크, 누락된 form label, 잘못된 ARIA 속성
- 스크린 리더 사용자가 앱을 정상적으로 사용할 수 있는 경우가 예외적

### 1.3 "나중에 추가하면 되지"의 함정

접근성을 기능(feature)으로 취급하면, 항상 우선순위에서 밀린다. "MVP에는 접근성 빼고, 나중에 추가하자" — 하지만 그 "나중에"는 오지 않는다. 그리고 사후 보강은 구조적 한계로 인해 대부분 불완전하다.

---

## 2. Cost — 접근성 부재의 비용

| 이해관계자 | 비용 |
|-----------|------|
| **장애인 사용자** | 앱 자체를 사용할 수 없음. 이것은 불편함이 아니라 **배제** |
| **법적 위험** | ADA(미국), EAA(유럽) 등 접근성 법규 위반. 소송 리스크 |
| **고령 사용자** | 시력 저하, 운동 능력 감소 — 접근성 미구현 시 사용 불가 |
| **개발자** | ARIA 스펙 학습 비용. 잘못 구현하면 "접근성이 없는 것보다 나쁜" 상태 |
| **조직** | 접근성 감사(audit) 비용. 사후 보강 비용은 초기 구현의 수배 |

---

## 3. Principle — 접근성은 기능이 아니라 인프라다

### 3.1 앱이 "추가"하는 것이 아니라, OS가 "보장"하는 것

Interactive OS에서 접근성은 별도 모듈이 아니다. **모든 행동 모듈의 출력**이다:

| 행동 | ARIA 출력 |
|------|----------|
| Focus 이동 | `tabIndex` 갱신, `data-focused`, `aria-current` |
| Selection 변경 | `aria-selected` 또는 `aria-checked` (role에 따라) |
| Expand 토글 | `aria-expanded` |
| Overlay 열기 | `role="dialog"`, `aria-modal="true"` |
| 비활성화 | `aria-disabled` |

앱이 접근성을 "추가"할 필요가 없다. 행동을 선언하면 접근성이 **자동으로 따라온다.**

### 3.2 Role Preset — 1,000페이지를 1줄로

개발자는 `role="listbox"`를 선언한다. OS가 이 role에 해당하는 모든 설정을 자동 적용한다:

- orientation: vertical
- selection: single, followFocus
- tab: escape
- 자식 role: option
- 속성: `aria-selected`, `aria-activedescendant`

17개 role에 대한 preset이 시스템에 내장되어 있다. 개발자가 ARIA 스펙을 읽지 않아도, role을 선언하면 올바른 접근성이 보장된다.

### 3.3 표준이 있으면 발명하지 않는다

W3C WAI-ARIA Authoring Practices Guide(APG)가 정의한 패턴을 그대로 구현한다. "우리만의 접근성 방식"은 존재하지 않는다. APG가 정의한 것이 곧 우리의 구현이다.

---

## 4. Reference

- [W3C WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/)
- [W3C WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WebAIM Million 2024](https://webaim.org/projects/million/)
- [European Accessibility Act (EAA)](https://ec.europa.eu/social/main.jsp?catId=1202)
- [ADA Title III — Web Accessibility](https://www.ada.gov/resources/web-guidance/)

---

## Status of This Document

Working Draft.
