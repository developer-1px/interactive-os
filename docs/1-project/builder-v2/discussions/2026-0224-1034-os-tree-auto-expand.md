# Discussion: OS Tree Role Auto Expand/Collapse

> 2026-02-24 10:34 | builder-v2 귀속 (OS 코드 변경)

## Journey

**🧑 사용자**: 아코디언도 트리처럼 키보드 좌우로 펼접 가능해야지 아직 안되어 있나봐?

**🤖 AI**: keybinding은 설정됨. 클릭 시 OS item focus가 잡히지 않는 배선 누락으로 판단.

---

**🧑 사용자**: 우리 OS가 제안하는 가장 우아한 방법을 고민해봐. 이 모든 프로젝트는 빌더의 완성이 아니라 OS의 완성이야.

**🤖 AI**: Reframing — 현재 sidebar와 panel 모두 수동으로 `keybindings: [ArrowLeft → OS_EXPAND]` 배선. 이것은 앱이 OS 일을 대신하는 것. WAI-ARIA Tree 패턴에서 expand/collapse는 role 고유 동작이므로, OS가 `role: "tree"` 선언만으로 자동 제공해야 함. Pit of Success.

---

**🧑 사용자**: 우리의 목적은 빌더가 아니라 OS야.

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | OS가 `role: "tree"` 선언 시 ArrowLeft/Right → expand/collapse, Click/Enter → toggle을 자동 제공. 앱은 수동 배선 불필요. |
| **📊 Data** | 현재 sidebar와 panel 두 곳 모두 동일한 수동 keybinding 중복. 앱이 OS 일을 대신함. |
| **🔗 Warrant** | WAI-ARIA Tree 패턴에서 expand/collapse는 role 고유 동작. Pit of Success — role 선언만으로 옳은 동작이 따라와야 함. |
| **📚 Backing** | WAI-ARIA Tree View pattern. rules.md #5 Pit of Success. "이 OS 위에서 이 OS를 만든다." |
| **⚖️ Qualifier** | Complicated |
| **⚡ Rebuttal** | 기존 tree 사용자(sidebar, docs viewer)에 의도치 않은 동작 변경 가능 → 기존 수동 배선 제거 필요 |
| **❓ Open Gap** | 없음 |
