# Discussion: Zone/FocusGroup 이름과 책임 분리

> 2026-02-23 17:42 ~ 17:58

## Journey

**🧑 사용자**: 초반에 `FOCUS_GROUP_INIT` 커맨드가 뜨는데 state 변화는 전혀 없어. 이건 왜?

**🤖 AI**: `FocusGroup.tsx`에서 `useMemo` 안에 dispatch하는 idempotent 커맨드. 이미 zone이 있으면 early return.

**🧑 사용자**: React StrictMode 때문이야?

**🤖 AI**: 맞다. StrictMode가 `useMemo`를 두 번 실행 → 두 번째는 no-op.

---

**🧑 사용자**: 이름이 애매해. 전수 조사해봐.

**🤖 AI**: 전수 감사 결과, 같은 개념에 3개 이름이 공존:
- `Zone` — State, Registry, Primitive, Command payload
- `FocusGroup` — Base component, Config, Context hook
- `group` — 변수명, data attribute, auto ID

특히 `FOCUS_GROUP_INIT`의 변수명은 `INIT_ZONE`인데 커맨드명은 `FOCUS_GROUP_INIT`. 한 줄에서 두 어휘 충돌.

---

**🧑 사용자**: FocusGroup은 APG focus와 관련된 일만 하는 개념이야. Zone이 상위 개념이지.

**🤖 AI**: W3C APG 확인 — 공식 용어는 "Composite Widget". `focusgroup`은 Open UI proposal (미표준).
APG Composite Widget = focus + selection + expansion + activation. FocusGroup의 정당한 범위 맞다.

---

**🧑 사용자**: Zone 하나로 통일하면 안 돼? 근데 Zone에는 나중에 DnD, FileUpload, Resize, Collection, DB 등 혼합될게 많은데?

**🤖 AI**: 핵심 발견 — Zone은 합성점(composition point)이고 FocusGroup은 하나의 기능 모듈. 합치면 god component가 된다. 현재 문제는 FocusGroup이 Zone의 책임(div 렌더링, ZoneRegistry 등록, ZoneState 초기화)을 대행하고 있다는 것.

---

**🧑 사용자**: asChild를 기본으로 해서 div를 children에서 받게 만들 거야.

**🤖 AI**: Goal #8 "OS는 행동을 제공하고, 형태는 앱이 결정한다"의 코드 구현. Zone, FocusGroup 모두 headless. 각 capability가 자기 props를 Slot에 기여하고 Zone이 최종 머지.

---

**한 줄 요약**: `FOCUS_GROUP_INIT` 네이밍 의문에서 출발해, Zone(합성점) / FocusGroup(기능 모듈)의 책임을 분리하고, asChild 기본으로 DOM 소유권을 앱에게 넘기는 아키텍처를 확정했다.

---

## Conclusion

### Why
현재 FocusGroup이 Zone의 책임(div 소유, Registry 등록, state 초기화)을 대행하고 있어서 이름과 실체가 괴리. DnD 등 두 번째 기능 모듈이 오면 구조가 무너진다.

### Intent
Zone을 합성점으로, FocusGroup을 headless 기능 모듈로 분리하여, 미래 확장에도 흔들리지 않는 구조를 만든다.

### Warrants
1. Zone ⊃ FocusGroup — Zone은 여러 기능(Focus, DnD, Resize...)의 합성점
2. FocusGroup = APG Composite Widget (focus, selection, expansion, activation) — 이 범위는 정당
3. clipboard, undo, delete, move, field editing은 APG 밖 — Zone의 추가 역할
4. Zone은 프로젝트 독자 어휘 — 사전학습 충돌 없어 LLM에게 안전
5. `FOCUS_GROUP_INIT`은 ZoneState를 초기화하므로 `OS_ZONE_INIT`이어야 함
6. asChild 기본 = Zone은 DOM 없음 — Goal #8 "OS는 행동, 형태는 앱"
7. 각 capability가 Slot에 props 기여 → Zone이 최종 머지 → div 중첩 0

**한 줄 요약**: Zone은 행동의 관할 영역이고 FocusGroup은 그 안의 APG 기능 모듈이다. 둘을 분리하고 asChild로 DOM을 앱에게 넘기면, 미래에 어떤 기능이 와도 같은 패턴으로 합성된다.
