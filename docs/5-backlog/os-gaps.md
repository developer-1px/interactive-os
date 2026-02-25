# OS Gap Backlog

> OS가 아직 제공하지 않는 UI/인터랙션 프리미티브 목록.
> `/audit`에서 🟡 OS 갭으로 분류된 항목이 등록된다.
> 항목이 OS에 구현되면 `[x]`로 체크하고 구현 PR/커밋을 기록한다.

---

## 미해결

| # | 발견일 | 앱 | 패턴 | 설명 | 임시 대응 |
|---|--------|-----|------|------|----------|
| OG-001 | 2026-02-25 | builder-i18n | Dropdown (listbox) Zone | `LocaleSwitcher.tsx`가 드롭다운 전체(열기/닫기/Escape/ArrowDown/Up/Enter/backdrop)를 App에서 직접 구현. 4건의 onClick이 모두 OS Dropdown Zone 부재에서 기인. DT #4~#7 키보드는 미구현 상태. | App에서 raw div+ul로 임시 구현 (onClick 4건) |
| OG-003 | 2026-02-26 | OS core | Listener 충돌 | MouseListener(`mousedown`/`click`)와 DragListener(`pointer*`)가 같은 물리 제스처를 경쟁 처리. `e.preventDefault()` 충돌 발생. | 분리 유지 + `e.preventDefault()` 제거. 백로그: `unified-pointer-listener.md` |
| OG-004 | 2026-02-26 | builder | DOM convention | `data-drag-handle` 속성을 앱이 수동 부착. OS가 자동 주입하지 않음. | 앱에서 수동 `data-drag-handle` 부착 |
| OG-005 | 2026-02-26 | builder | 커서 메타 등록 | `useCursorMeta` hook이 useEffect로 cursorRegistry에 수동 등록/해제. OS에 커서 메타 API 없음. | useEffect + 앱 내부 레지스트리 |

## 해결됨

| # | 발견일 | 해결일 | 패턴 | 설명 |
|---|--------|--------|------|------|
| OG-002 | 2026-02-26 | 2026-02-26 | `onReorder: void` | zone 콜백 명령형 시그니처. 다른 콜백(onAction 등)은 선언형(BaseCommand 리턴). → 선언형으로 수정 완료 |
