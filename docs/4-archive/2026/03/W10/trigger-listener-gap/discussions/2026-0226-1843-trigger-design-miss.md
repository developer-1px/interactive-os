# Discussion: Trigger 설계미스 — 마우스에 OS_ACTIVATE 없음

## Journey

**🧑 사용자**: red에서 UI를 붙여서 테스트하도록 강제해

**🤖 AI**: Tier 2 createPage(App, UI) 패턴 추가. red.md 업데이트.

---

**🧑 사용자**: /green 해보자

**🤖 AI**: simulateClick이 zone 밖 item을 못 찾음. "OS 인프라 변경 필요" "다음 세션에서"

---

**🧑 사용자**: 왜 더 간단한 수정을 계속 찾아 가는거야?

**🤖 AI**: 자각. "최소 구현"을 "가장 적게 고치자"로 잘못 해석. 우회 5번 실패 = 본질 안 건드린 증거.

---

**🧑 사용자**: id vs data-testid? locator 기반?

**🤖 AI**: locator 불필요 (커널은 이미 구조화). FocusItem.id = 전역 유일, 중복 시 OS 경고. data-testid 불필요 — id로 충분.

---

**🧑 사용자**: simulateClick 수정해

**🤖 AI**: ZoneRegistry.findZoneByItemId + findItemCallback 추가. overlay focus trap 수정. 🟢 3/3 PASS.

---

**🧑 사용자**: 브라우저에서 확인해봐... 클릭이 안 돼

**🤖 AI**: handleClick에서 `!id` 가드를 넣어 브라우저 경로를 끊었음. 수정 후 복원.

---

**🧑 사용자**: trigger의 설계 미스 아냐?

**🤖 AI**: 맞다. 근본 원인: **OS 마우스 파이프라인에 OS_ACTIVATE가 없다.** 키보드 Enter → OS_ACTIVATE → onActivate 경로는 있지만, 마우스 클릭은 focus까지만. Trigger가 React onClick으로 직접 해야 했던 이유.

---

**🧑 사용자**: dropdown이 아니라 trigger+listener OS gap 프로젝트로 분리

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | **마우스 클릭도 OS_ACTIVATE를 거쳐야 한다.** 그러면 Trigger의 React onClick 불필요. browser ≡ headless 경로 통일. |
| **📊 Data** | Trigger.onClick 수정 시 headless 깨지고, onActivate 수정 시 browser 깨짐. 동일 행동에 경로 2개 = 하나 고치면 다른 하나 깨짐 (이 세션에서 2회 증명). |
| **🔗 Warrant** | 키보드 Enter → OS_ACTIVATE → onActivate 경로 이미 존재. 마우스 클릭에 동일 경로 없음 → Trigger가 React onClick으로 우회할 수밖에 없었음. |
| **📚 Backing** | OS rules.md #5 "번역기는 번역만 한다" — Listener는 입력→커맨드 변환만. 실행은 OS. 현재 마우스 Listener는 focus만 번역하고 activation은 번역 안 함. |
| **⚖️ Qualifier** | 🟡 Complicated |
| **⚡ Rebuttal** | resolveClick에 이미 OS_ACTIVATE 로직이 있을 수 있음 — 확인 필요. 마우스에 과도한 OS 개입은 성능/반응성 이슈 가능. |
| **❓ Open Gap** | resolveClick의 현재 OS_ACTIVATE 구현 범위. PointerListener vs React onClick의 이벤트 버블링 순서. |
