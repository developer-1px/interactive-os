# Discussion: Docs Sidebar OS화 + Focus Ring

> 2026-02-23 21:43 ~ 22:07

## Journey

**🧑 사용자**: docs tree — `/discussion`

**🤖 AI**: 현재 DocsSidebar 상태 분석. 메인 Tree는 T8에서 OS화 완료, Recent/Favorites는 바닐라 React.

---

**🧑 사용자**: 우리 OS 방식으로 만들거야 다른 에이전트는 실패했어 / os로 만드는 best practice를 안 따랐어

**🤖 AI**: Todo 벤치마크 비교 → 6개 best practice 위반 도출. 핵심: Recent/Favorites OS 바깥, activePath 이중 상태.

---

**🧑 사용자**: `/self` → A로 만들거야 → 일단 각자 zone으로 만들고 고민하자

**🤖 AI**: Cynefin Complex → Probe first. 3개 독립 Zone(Recent, Favorites, Tree)으로 구현 결정.

---

**🧑 사용자**: `/project`

**🤖 AI**: docs-sidebar-os 프로젝트 scaffold → T1~T3 실행 → 937 tests GREEN.

---

**🧑 사용자**: folder focus ring이 group이 아니라 item에 있으면 좋겠어

**🤖 AI**: 조사 결과 — UA `:focus-visible { outline: -webkit-focus-ring-color auto 1px }` 가 원인. `[data-focus-item]:focus-visible { outline: none }` 추가했으나 미해결 → 백로그.

---

**🧑 사용자**: 키보드로 edge시 loop 막고 seamless passthru 같은거 백로그로

> **한 줄 요약**: docs sidebar의 3 섹션을 OS Zone으로 전환 완료. Focus ring과 Edge navigation은 백로그.

---

## Conclusion

### Why
다른 에이전트가 브라우저 네이티브 패턴으로 만든 docs sidebar를 OS best practice로 재구축.

### Intent
모든 상호작용을 커맨드 파이프라인으로 통과시켜 관찰 가능하고 키보드 탐색 가능한 사이드바를 만든다.

### Warrants
- W1. 브라우저 위임 = OS 실패 (rules.md Goal)
- W2. app.ts = Single Source of Logic (Todo 벤치마크)
- W3. 3 Zone 독립 → Probe first (Cynefin Complex)
- W4. activePath 이중 상태 = Clear 위반 → 단일화
- W5. 세 Zone 모두 `onAction → selectDoc` 커맨드 브릿지
- W6. `:focus-visible` UA specificity > `*` — OS 전역 규칙 필요 (미해결)

### 성과
- T1~T3 완료: app.ts 리팩토링 + DocsViewer 단일 상태 + DocsSidebar 3 Zone 전환
- 937/937 tests GREEN, tsc 0 errors

### 백로그
- Focus ring 제거 (`:focus-visible` 억제)
- Edge loop 방지 + seamless passthrough

> **한 줄**: docs sidebar를 3개 OS Zone으로 재구축하고, activePath 이중 상태를 제거했다.
