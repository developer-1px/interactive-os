# OS Gap Backlog

> OS가 아직 제공하지 않는 UI/인터랙션 프리미티브 목록.
> `/audit`에서 🟡 OS 갭으로 분류된 항목이 등록된다.
> 항목이 OS에 구현되면 `[x]`로 체크하고 구현 PR/커밋을 기록한다.

---

## 미해결

| # | 발견일 | 앱 | 패턴 | 설명 | 임시 대응 |
|---|--------|-----|------|------|----------|
| OG-004 | 2026-02-26 | builder | DOM convention | `data-drag-handle` 속성을 앱이 수동 부착. OS가 자동 주입하지 않음. | 앱에서 수동 `data-drag-handle` 부착 |
| OG-005 | 2026-02-26 | builder | 커서 메타 등록 | `useCursorMeta` hook이 useEffect로 cursorRegistry에 수동 등록/해제. OS에 커서 메타 API 없음. | useEffect + 앱 내부 레지스트리 |
| OG-009 | 2026-03-03 | os-core | Modifier keybindings | Shift+Arrow, Ctrl+Arrow, Ctrl+Space, Shift+Space 가 osDefaults에 하드코딩. config chain으로 전환 필요. | – |

## 해결됨

| # | 발견일 | 해결일 | 패턴 | 설명 |
|---|--------|--------|------|------|
| OG-001 | 2026-02-25 | 2026-02-26 | Dropdown Zone | 기존 Trigger+Portal 패턴으로 해결. 새 프리미티브 불필요. outsideClick 런타임 추가. |
| OG-002 | 2026-02-26 | 2026-02-26 | `onReorder: void` | zone 콜백 명령형 시그니처. 다른 콜백(onAction 등)은 선언형(BaseCommand 리턴). → 선언형으로 수정 완료 |
