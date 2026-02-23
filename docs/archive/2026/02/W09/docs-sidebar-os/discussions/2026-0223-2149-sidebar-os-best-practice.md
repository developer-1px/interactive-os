# Discussion: Docs Sidebar OS Best Practice 적용

> 2026-02-23 21:43 ~ 21:49

## Journey

**🧑 사용자**: docs tree — `/discussion`

**🤖 AI**: 현재 DocsSidebar 상태 파악. 메인 트리는 T8에서 OS화 완료, Recent/Favorites는 바닐라 React. 스코프 질문.

---

**🧑 사용자**: 우리 OS 방식으로 만들거야 다른 에이전트는 실패했어

**🤖 AI**: Intent 추론 — 다른 에이전트가 브라우저 네이티브 패턴으로 만들어서 OS 철학과 불일치. Best practice 위반 목록 작성. Recent/Favorites 처리 방향 질문 (A: 통합 / B: 별도 Zone / C: 스코프 제외).

---

**🧑 사용자**: os로 만드는 best practice를 안 따랐어

**🤖 AI**: Todo 벤치마크와 비교 분석. 6개 위반 항목 도출. 핵심: Recent/Favorites가 OS 바깥, activePath 이중 상태.

---

**🧑 사용자**: `/self` → A로 만들거야

**🤖 AI**: Option A(단일 Zone) 선택 시 중복 문제 제기. ID 네임스페이스 vs nested Zone 비교.

---

**🧑 사용자**: 일단 각자 zone으로 만들고 고민하자

**🤖 AI**: Cynefin Complex → Probe first. 3개 독립 Zone으로 먼저 구현, 통합은 실증 후 결정.

> **한 줄 요약**: 각 Zone 독립 구현 → selectDoc 커맨드 브릿지 → activePath 단일화 → 통합 여부는 후속 판단.

---

## Conclusion

### Why
다른 에이전트가 만든 docs sidebar는 OS best practice를 따르지 않았다. useState, onClick 등 브라우저 네이티브 패턴이 남아있어 키보드 네비게이션, Inspector 추적, 포커스 복구가 불가능하다.

### Intent
docs-viewer 사이드바 전체(Recent, Favorites, Tree)를 OS 패턴으로 재구축한다. Todo 벤치마크 수준의 best practice 적용.

### Warrants
- W1. 브라우저 위임 = OS 실패 (rules.md Goal)
- W2. app.ts = Single Source of Logic (Todo 벤치마크 패턴)
- W3. 3 Zone 독립 → Probe first, 통합은 실증 후 결정 (Cynefin Complex)
- W4. `activePath` 이중 상태(DocsViewer useState + DocsApp state) = Clear 위반 → 단일화 필수
- W5. 세 Zone 모두 `onAction → selectDoc` 커맨드 브릿지

### 설계 결정

| 섹션 | Zone ID | Role | 비고 |
|------|---------|------|------|
| Recent | `docs-recent` | `listbox` | 최근 수정 파일 7개 |
| Favorites | `docs-favorites` | `listbox` | 고정된 파일 |
| Tree | `docs-sidebar` (기존) | `tree` | 폴더 구조 |

> **한 줄**: 세 섹션을 각각 OS Zone으로 만들되, 모두 같은 `selectDoc` 커맨드로 `activePath`를 변경한다.
