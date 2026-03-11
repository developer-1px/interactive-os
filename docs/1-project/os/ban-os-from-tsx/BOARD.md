# ban-os-from-tsx

## Context

Claim: `.tsx` 파일에서 `os` 객체 import을 원천 차단하면, React가 순수 투영(L2)이 되고 모든 Pit of Failure가 한 번에 봉인된다.

Before → After:
- Before: `.tsx` 8파일에서 `os.dispatch`/`os.getState` 직접 호출. React에 행동 코드가 살고 있음
- After: `.tsx`에서 `os` import 불가 (ESLint). 행동은 Zone callback/Trigger/bind에만 존재. 예외 3건 (main.tsx, MeterPattern, DocsViewer)

핵심 논거:
- Goodhart's Law 확장: `os` 접근 자체가 LLM의 Redux 습관과 공명
- `seal-useComputed` 선례: 읽기를 봉인했으므로 쓰기도 봉인
- React = 발사대. 코딩이 들어간다는 것 자체가 실패

Risks:
- QuickPick.tsx가 가장 큰 변경 (7건 os 호출 + onKeyDown 제거)
- DocsViewer/DocsSearch는 ZIFT 미적용 앱 — 완전 전환은 별도 프로젝트

## Now
- [ ] T1: ESLint no-restricted-imports — *.tsx에서 os named export 차단
- [ ] T2: ToastContainer — os.dispatch → bind callback 전환 (3건)
- [ ] T3: CommandPalette — os.dispatch(OS_OVERLAY_CLOSE) → onDismiss (1건)
- [ ] T4: PropertiesPanel — os.dispatch(appCmd) → Trigger/bind (3건)
- [ ] T5: DocsSearch — os.dispatch(appCmd) → Zone callback (4건)
- [ ] T6: QuickPick — os 7건 제거. Dialog Zone 패턴 재구성
- [ ] T7: 예외 등록 — main.tsx, MeterPattern, DocsViewer에 eslint-disable
- [ ] T8: contract-checklist + rules.md 갱신

## Done

## Unresolved
