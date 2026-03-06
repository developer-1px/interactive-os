# /plan — TestBot Inspector 연결

> Date: 2026-02-28 12:00
> Trigger: /discussion Clear → focus-showcase "Run All"이 TestBot을 실제로 실행하도록

---

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `src/os/testing/TestBotRegistry.ts` (신규) | 없음 | 페이지가 TestScript[]를 등록/해제하는 singleton store. `register(scripts)→unregister`, `getScripts()`, `subscribe()`. InspectorRegistry와 동일 패턴 | Clear | — | tsc 0 | — |
| 2 | `src/os/testing/index.ts` | `TestBotRegistry` export 없음 | `TestBotRegistry` re-export 추가 | Clear | →#1 | tsc 0 | — |
| 3 | `src/inspector/panels/TestBotPanel.tsx` | 항상 `allAriaScripts`와 own container(containerRef) 사용 | TestBotRegistry.getScripts()가 있으면 → 페이지 스크립트 + `document.body` container. 없으면 → ARIA 기본 scuits + own containerRef | Clear | →#1 | 수동: Inspector TestBot 탭에서 두 모드 동작 확인 | 기존 ARIA 모드 regression |
| 4 | `src/pages/focus-showcase/focusScripts.ts` (신규) | 없음 | `NavigateTest`의 zone(nav-list, nav-toolbar, nav-grid, nav-seamless-a/b) + `SelectTest`의 zone(sel-range, sel-toggle, sel-radio)을 테스트하는 TestScript[] 배열 | Clear | — | tsc 0. 스크립트 수동 실행 PASS | nav-seamless 크로스존 테스트는 복잡 → 1차에서 제외, 기본 nav만 |
| 5 | `src/pages/focus-showcase/index.tsx` | `runAllTests()`가 `InspectorStore.setOpen(true)` 만 호출 | useEffect로 `TestBotRegistry.register(focusScripts)` + cleanup unregister. `runAllTests()`가 Inspector 열기 + TESTBOT 탭 활성화 | Clear | →#1 →#4 | 수동: focus-showcase에서 "Run All" 클릭 → Inspector TestBot 탭 열림 + 스크립트 실행 | unmount 시 unregister 필수 |

---

## MECE 점검

```
1. CE: #1→#2→#3→#4→#5 완료 시 "Run All"이 실제로 TestBot 실행? → YES
2. ME: 중복 없음
3. No-op: Before=After 없음
```

---

## 라우팅

승인 후 → `/go` (기존 프로젝트 없음 → Meta 직접 실행) — TestBot-Inspector 연결 5개 파일 수정
