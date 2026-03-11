# Discussion: Tab Container & Accept Constraint

> 2026-02-20 18:26~18:33

## Journey

**🧑 사용자**: builder에서 pricing section 보다는 무난한 탭 컨테이너. 기존 블록 붙여넣기 가능. 블록 그룹핑이 가능해야 하니까 중요한 UI.

**🤖 AI**: Intent 추론 — "Pricing Section" 같은 특수 목적이 아니라 **범용 Container Block 체계**를 세우려는 것. Compound Document Model (Notion, Framer, Webflow 공통 패턴).

---

**🧑 사용자**: 왼쪽 builder를 tree로, 탭을 폴더 취급해서 재귀적 관리. 우측에는 탭 UI로 렌더링.

**🤖 AI**: **Dual Projection** 패턴 발견 — Figma Layer Panel ↔ Canvas와 동일. 하나의 Block Tree 데이터 모델에서 좌(구조 트리) / 우(시각적 렌더링) 두 개의 뷰를 파생.

---

**🧑 사용자**: `accept`를 만들어서 section만 들어올 수 있게.

**🤖 AI**: **Constrained Composition** — `accept: ["section"]`으로 Container가 받을 수 있는 하위 블록 타입을 제한. 드래그/붙여넣기/키보드 이동 모두에서 필터 역할.

---

**🧑 사용자**: `accept`는 나중에 copy & paste 등 전체적으로 일원화할 예정.

**한 줄 요약**: Tab Container를 범용 Container Block의 첫 사례로 구현하되, `accept` 제약과 Dual Projection (Tree ↔ Canvas) 아키텍처를 확장 가능하게 설계한다.

---

## Conclusion

### Why
현재 `BuilderTabs`는 Pricing Section에 결합된 하드코딩된 демо. 범용 블록 그룹핑이 필요.

### Intent
`accept: ["section"]`을 가진 Tab Container Block을 도입하고, 사이드바를 flat list → recursive tree로 전환하여 Dual Projection (트리 ↔ 캔버스)을 실현한다.

### Warrants
- W1. `Block.children?: Block[]` 재귀 구조 이미 존재
- W2. `data-level` 3단 계층 정의됨
- W3. **Figma Layer Panel 패턴** — 하나의 모델, 두 개의 뷰
- W4. **Constrained Composition** — `accept`로 진입 타입 제한
- W5. **Tab = Section** — 각 탭 패널 = 독립적 Section. 기존 블록 재사용
- W6. `accept`는 범용 시스템으로 나중에 일원화 (copy/paste/drag 공통)
- W7. APG Tree 스펙이 커널에 구현됨 — 사이드바 tree 전환 시 무료로 계층 탐색 획득

**한 줄 요약**: Builder Primitives로 감싸면 어떤 디자인이든 편집 가능해지는 보편 Block Tree 모델에, `accept` 제약 기반 Tab Container를 첫 번째 범용 Container로 구현한다.
