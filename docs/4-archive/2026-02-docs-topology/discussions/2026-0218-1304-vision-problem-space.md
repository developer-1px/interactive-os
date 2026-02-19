# Discussion: Vision & Problem Space 문서 부재

> **Date**: 2026-02-18 12:25 ~ 13:04
> **Participants**: 사용자, AI
> **Outcome**: VISION.md + 7개 why-*.md Working Draft 작성 완료

---

## Journey

**🧑 사용자**: 우리 문서에는 OS가 왜 필요하고 뭐하는 역할이고 이걸 왜 만드려고 하고 만들어서 뭘하고 싶고 하는 그런 원칙과 관련된 문서가 부재하네?

**🤖 AI**: rules.md의 Goal/Project 섹션에 Vision/Why가 있지만 에이전트 전용 파일에 갇혀 있다. official/에는 What/How만 있고 Why가 없다. rules.md를 official로 옮기는 것을 제안.

---

**🧑 사용자**: 아니야. 저건 rule이야. 일종의 선언문이야. 내가 말하는건 OS의 기능들이 왜 만들어져야 하는지 그 이전에 why가 없다는거야.

**🤖 AI**: Intent 재보정. rules.md(선언문/Belief) ↔ SPEC.md(Solution Space) 사이에 **Problem Space**(왜 이 기능이 시스템 수준으로 존재해야 하는가)가 완전히 비어 있다는 것을 인식. 문서 구조로 3가지 안 제시: ①통합 문서 ②기능별 분리 ③SPEC 안에 통합.

---

**🧑 사용자**: 기능별 분리를 해야지 더 구체적인 내용들이 필요해.

**🤖 AI**: 2번 확정. SPEC.md에서 7개 기능 영역 후보 추출 (Focus, Navigation, Selection, Tab, ARIA, Command, Overlay). 각 문서의 구조: Problem → Cost → Principle → Reference.

---

**🧑 사용자**: 좋아 상위의 개념을 먼저 생각해보자. interactive OS가 제공하고자 하는 것은 무엇이지?

**🤖 AI**: 핵심 전환점. 하위 기능 나열이 아닌 상위 개념에서 연역적 도출. **"사용자 Intent와 앱 Response 사이의 보편적 계약"** — 데스크탑 OS의 UI 툴킷이 웹에 부재하며, 이 공백을 채우는 것이 존재 이유. 4단계 파이프라인 모델 도출: 인지(Spatial) → 해석(Input) → 실행(Behavior) → 피드백(Output). Gap 테이블로 미구현 영역(DnD, 터치, 컨텍스트 메뉴 등) 식별.

---

**🧑 사용자**: 너무 잘했어. 이 프로젝트는 그걸 전부 다 해결하되 모듈로 제공해서 필요한것들을 설치해서 가져갈거야.

**🤖 AI**: 비전 확정. 전체 파이프라인을 커버하되 모듈 생태계로 제공. 컴포넌트 라이브러리가 아닌 **행동 인프라** — "이 컴포넌트를 쓰세요"가 아니라 "당신의 UI가 행동하게 해줄게요".

---

**🧑 사용자**: 지금 작성할거지만 DRAFT로 w3c처럼.

**🤖 AI**: W3C Working Draft 형식으로 VISION.md + 7개 why-*.md 작성 완료. official/README.md 목차 갱신.

---

**한 줄 요약**: rules.md(선언문)과 SPEC.md(명세) 사이에 빠진 Problem Space를 발견하고, 상위 비전(VISION.md)에서 하위 모듈(why-*.md)까지 연역적으로 도출하여 Working Draft로 작성했다.

---

## Conclusion

### Why
웹 애플리케이션에는 상호작용 인프라가 부재하다. 데스크탑 OS의 AppKit/UIKit에 해당하는 행동 계층이 없어서, 모든 앱이 포커스·네비게이션·선택·접근성을 처음부터 재발명한다.

### Intent
Interactive OS의 **존재 이유(Problem Space)**를 공식 문서로 정립한다. 선언문(rules.md)과 기술 명세(SPEC.md) 사이의 빈 자리 — "왜 이 기능이 시스템 수준에서 존재해야 하는가" — 를 채운다.

### Warrants
1. `rules.md`는 선언문(Belief)이지, 기능의 동기(Motivation)가 아니다 — 역할이 다르다.
2. `SPEC.md`는 Solution Space(What/How)만 기술하고, Problem Space(Why)가 없다.
3. Problem Space가 없으면 기능 추가/수정 시 "원래 왜 필요했는지" 판단 근거가 없다.
4. 상위 개념 → 파이프라인 → 하위 기능의 **연역적 구조**가 있어야, "왜 이 기능이 필요한가"가 자명해지고, "다음에 뭘 만들어야 하는가"도 도출된다.
5. Interactive OS의 상위 개념은 **"Intent ↔ Response의 보편적 계약"** — 데스크탑 OS의 UI 툴킷이 웹에 부재하며 이 공백을 채우는 것이 존재 이유.
6. 컴포넌트가 아니라 **행동(Behavior)**을 제공 — 형태에 비종속적.
7. 전체 파이프라인을 커버하되, **모듈 생태계**로 제공 — 필요한 것만 설치.
8. Problem Space 문서는 시점 독립 → `official/`에 위치.
9. 기능별 분리가 구체성을 보장한다.

### 산출물
- `official/VISION.md` (Working Draft) — 상위 비전
- `official/os/why-focus.md` (WD)
- `official/os/why-navigation.md` (WD)
- `official/os/why-selection.md` (WD)
- `official/os/why-tab.md` (WD)
- `official/os/why-aria.md` (WD)
- `official/os/why-command.md` (WD)
- `official/os/why-overlay.md` (WD)
- `official/README.md` 목차 갱신

### 한 줄 요약
> Interactive OS는 웹에 부재한 상호작용 인프라를 모듈 생태계로 제공하며, 그 존재 이유를 상위 비전(VISION)에서 하위 모듈(why-*)까지 연역적으로 문서화했다.
