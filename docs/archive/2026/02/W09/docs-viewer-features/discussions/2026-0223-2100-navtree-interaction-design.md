# Navigation Tree 인터랙션 설계

> 2026-02-23 21:00 ~ 21:15

## Journey

**🧑 사용자**: DocsSidebar 컴포넌트에서 해야 하는 일이 너무 많지 않아?

**🤖 AI**: handleAction, handleSelect에 같은 guard가 중복. onNavigate 단일 콜백으로 통합 제안.

---

**🧑 사용자**: 그게 App의 책임이야? OS가 뭘 못해줘서 이렇게 된 건데?

**🤖 AI**: OS_SELECT에 expandable guard가 없어서. OS_ACTIVATE엔 있는데.

---

**🧑 사용자**: activate에서만 하면 되지 왜 OS_SELECT를 써야 하는데?

**🤖 AI**: followFocus가 select 채널이라서. activate.followFocus가 올바른 채널 아닌가 제안.

---

**🧑 사용자**: onSelect는 맞잖아. folder도 select는 맞고. OS가 meta 정보를 전달 안 해?

**🤖 AI**: ← **inflection point**. OS가 cursor에 isExpandable 등 meta를 넘기면 앱이 판단 가능. 앱의 비즈니스 로직은 앱 책임이 맞지만, 판단 재료는 OS가 제공해야.

---

**🧑 사용자**: 전달할 수 있는 거 다 전달해. 그리고 왜 이벤트 핸들러로 만드는 거야?

**🤖 AI**: Todo 패턴처럼 defineApp에서 커맨드 만들어서 bind로 연결하면 컴포넌트에 핸들러 불필요.

---

**🧑 사용자**: OS 쓰는법 공부하고 다시 와.

**🤖 AI**: Todo Sidebar 패턴 학습. `onAction: (cursor) => selectCategory({ id: cursor.focusId })`. 커맨드 반환, guard 없음. ZoneCursor에 meta 부재가 근본 원인.

---

**한 줄 요약**: ZoneCursor에 meta(isExpandable 등)가 없어서 앱이 문자열 컨벤션으로 우회 → OS가 알고 있는 구조 정보를 cursor에 bypass하면, 앱은 Todo 패턴(커맨드 + bind)으로 핸들러 없이 동작 가능.

---

## Conclusion

### Why

앱 컴포넌트(DocsSidebar)에 인터랙션 라우팅 코드(guard filter)가 있는 건 Headless OS의 경계 위반.

### Intent

Navigation Tree에서 앱은 커맨드 하나만 정의하고 bind로 연결하면 끝이어야 한다.

### Warrants

1. **W7**: 앱이 인터랙션 라우팅(guard filter)을 하면 Headless 경계 위반
2. **W10**: OS_SELECT가 folder도 호출하는 건 맞음 (select는 맞으니까). 문제는 판단 재료(meta)를 안 줌.
3. **W13**: OS가 meta를 전달해야. 판단은 앱. 재료는 OS.
4. **W15**: Passive Projection — 컴포넌트는 state project, event handle 안 함.
5. **W16**: behavior는 defineApp.command에 정의. 콜백을 컴포넌트에 쓰면 behavior가 UI에 누출.

### 근본 원인

`ZoneCursor = { focusId, selection, anchor }` — OS가 아는 isExpandable, isDisabled, treeLevel 등이 빠져 있음.

### 한 줄 요약

**OS가 아는 것을 cursor에 다 넘기면, 앱은 커맨드 하나로 핸들러 없이 동작한다.**
