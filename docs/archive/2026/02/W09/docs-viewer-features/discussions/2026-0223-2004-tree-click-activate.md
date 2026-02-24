# Discussion: Tree Click-to-Activate & ExpandTrigger

## Journey

**🧑 사용자**: DocsViewer Tree에서 followFocus 적용해서 클릭때마다 반응할 수 있게 해줘. 원클릭으로.

**🤖 AI**: `followFocus: true` + `onSelect`로 구현. 폴더도 `os.dispatch(OS_EXPAND)` 직접 호출로 expand.

---

**🧑 사용자**: 이 구현이 올바르지 않은데? `/reflect`

**🤖 AI**: reflect 결과 — Arrow 이동 시에도 폴더가 열림 (followFocus 부작용), 앱이 OS_EXPAND 직접 호출 (관심사 분리 위반).

---

**🧑 사용자**: Arrow로 폴더 도착하면 열리는 게 이상해!

**🧑 사용자**: OS의 defineApp으로 개발한 거잖아. 앱이 OS 커맨드를 수동으로 호출하는 건 잘못된 구현이지.

---

**🧑 사용자**: Tree에는 VS Code/Finder 같은 트리와 웹에서 쓰이는 원클릭 트리가 있어.

**🤖 AI**: APG 조사 결과 — "Navigation Treeview Example"이 정확히 원클릭 트리 패턴. APG: Click = Enter = activate.

---

**🧑 사용자**: Application Tree에서는 폴더 클릭 시 선택만. 셰브론 눌러야 expand.

**🤖 AI**: 두 모드의 차이 = `activate.onClick` 한 비트.

| | Tree App | Tree Page |
|---|---|---|
| Click item | select만 | activate |
| Click chevron | expand | expand |

---

**🧑 사용자**: 셰브론을 앱에서 처리하지 말고 OS에서 처리할 방법을 생각해봐.

**🤖 AI**: `data-expand-trigger` 관례를 제안.

**🧑 사용자**: 너무 이상하잖아. OS에서 제공하는데 관례를 외워야 하잖아.

**🤖 AI**: 맞음. `ExpandTrigger` 프리미티브 컴포넌트로 OS가 제공해야 함. `DocsSidebarUI.ExpandTrigger` (flat 구조, ZIFT 일관성).

---

> **한 줄 요약**: Tree의 두 변종(App/Page)은 `activate.onClick` 한 비트로 구분되고, 셰브론은 OS `ExpandTrigger` 프리미티브가 처리한다.

---

## Conclusion

### Why
앱이 `os.dispatch(OS_EXPAND)`를 직접 호출하는 패턴이 반복됨 → OS에 기능이 빠져있다는 신호.

### Intent
Tree의 Click/Expand 인터랙션을 OS가 완전히 관장하여 앱은 선언만 하면 되게 만든다.

### Warrants

| # | Warrant |
|---|---------|
| W1 | OS가 관장하면 React 직접 구현 없다 |
| W2 | defineApp은 최소 계약 |
| W3 | isExpanded는 OS가 제공 |
| W6 | 앱이 OS 커맨드를 직접 dispatch하면 관심사 분리 위반 |
| W7 | Click-to-expand는 OS의 책임이지 앱의 책임이 아니다 |
| W8 | ClickListener는 "클릭"이라는 trigger를 아는 유일한 레이어 |
| W9 | Tree에는 두 변종: App (select ≠ activate) vs Page (focus = action) |
| W10 | APG Navigation Treeview: Enter/Click = activate. Arrow = focus. followFocus 아님 |
| W11 | APG는 일반 웹 네비에 tree보다 disclosure pattern 권장 |
| W12 | APG Navigation Tree는 activate 기반. followFocus/onSelect 불필요 |
| W13 | aria-current + followFocus = 키보드 브라우징 + 접근성 동시 획득 |
| W14 | Click → OS_FOCUS만 dispatch하는 현재 구조가 click-to-activate 불가능하게 만듦 |
| W15 | APG: Click과 Enter은 동일한 activate 경로. Click → OS_ACTIVATE |
| W16 | App Tree: Click = select. Page Tree: Click = activate. 차이 = `activate.onClick` 한 비트 |
| W17 | OS_ACTIVATE가 expandable item에서 자동 OS_EXPAND(toggle) — OS_NAVIGATE와 동일 패턴 |
| W18 | 셰브론 클릭 = OS_EXPAND(toggle), 아이템 클릭 = OS_FOCUS (+ optional OS_ACTIVATE) |
| W19 | OS 기능은 관례(convention)가 아닌 프리미티브(component)로 제공 — 외울 것 = 0 |
| W20 | ZIFT 프리미티브는 flat structure — 서브컴포넌트보다 동급 배치가 일관적 |

### MECE Tree Variants

| 트리거 | Tree App | Tree Page | Tree Page + followFocus |
|--------|:---:|:---:|:---:|
| Arrow → file | focus만 | focus만 | focus + 문서 로드 |
| Arrow → folder | focus만 | focus만 | focus만 |
| Click → file | select만 | 문서 로드 | 문서 로드 |
| Click → folder | select만 | expand toggle | expand toggle |
| Click → chevron | expand toggle | expand toggle | expand toggle |
| Enter | activate | activate | activate |
| `activate.onClick` | false | true | true |
| `followFocus` | false | false | true |

### 한 줄 요약

> Tree의 Click-to-Activate는 `activate.onClick` 설정으로, 셰브론은 `ExpandTrigger` 프리미티브로 — 앱은 선언만, OS가 물리를 처리한다.
