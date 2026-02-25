# Discussion: OS 테스트 관찰 가능성 갭

## Journey

**🧑 사용자**: 이번 프로젝트 왜 이렇게 힘들까?

**🤖 AI**: smooth→instant 같은 DOM 수정을 먼저 시도해서. OS 방식으로 했으면 바로 풀렸을 것.

---

**🧑 사용자**: smooth로 해도 지금 동작할걸? 네 "레거시면 5분" 분석 틀렸어.

**🤖 AI**: 맞다. DOM 수정은 원인이 아니었다. Zone 마운트가 진짜 수정. 레거시 방식으로는 원인을 못 찾았다.

---

**🧑 사용자**: 혼내는게 아니라 액션 아이템 찾아야지.

**🤖 AI**: "버그도 /red부터" — headless 재현이 원인을 즉시 보여준다.

---

**🧑 사용자**: 진짜 문제는 경고와 로그가 없다는 거잖아? 트랜잭션 dump 기능도 있는데 안 써.

**🤖 AI**: effect는 경고하고 command는 침묵. 비대칭. 그리고 AI가 inspector를 안 쓰고 console.log를 찍음.

---

**🧑 사용자**: 통과해도 기록 남기면 noise 아냐? 표준화된 방법 있을거 아냐.

**🤖 AI**: Go `t.Log()` 패턴 — Always Record, Print on Failure. vitest `onTestFailed`로 구현 가능.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | OS 테스트에 "Always Record, Print on Failure" 진단을 내장하고, kernel에 unhandled command 경고를 추가하면, AI의 삽질 루프를 구조적으로 차단한다 |
| **📊 Data** | T1에서 console.log 수동 삽입 3회, inspector.getTransactions() 사용 0회. effect는 Unknown effect 경고 있음, command는 없음 |
| **🔗 Warrant** | 도구가 있어도 "이 상황에서 이걸 써라"는 안내가 없으면 안 씀. 자동화해야 함 |
| **📚 Backing** | Go t.Log(), Playwright trace:retain-on-failure, pytest captured output, JUnit — 모두 같은 패턴 |
| **⚖️ Qualifier** | Clear — 기존 API 조합으로 구현 가능 |
| **⚡ Rebuttal** | 과도한 로깅은 noise. onTestFailed 한정이면 noise 0 |
| **❓ Open Gap** | createOsPage 내장 vs test helper 분리 |
