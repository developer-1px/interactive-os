# Discussion: Inspector Local View State vs OS Primitives

## Journey

**🧑 사용자**: 로컬 "View State" 관리의 번거로움 (현재의 한계/Pain Point)에 대해 어떻게 생각해? 보일러플레이트 커맨드를 남발한 건 아니지?

**🤖 AI**: 가짜 커맨드를 남발하지 않았습니다. 하위 컴포넌트를 순수 투영기(Passive Projector)로 유지하기 위해 모든 React 상태(`useState`)를 최상위 컨테이너(`UnifiedInspector.tsx`)로 끌어올렸습니다. 기능은 격리되었지만, 루트 컴포넌트에 Prop Drilling 보일러플레이트가 발생하는 과도기적 타협을 선택했습니다.

**🧑 사용자**: 로컬 View State는 원래 ARIA를 이용해서 정해진 UI 패턴을 선언적으로 만들 계획이었어. 

**🤖 AI**: 전적으로 동의합니다. W3C APG(Accordion, Tree 등) 패턴이 OS 프리미티브로 완전히 지원되면 개발자의 `useState` 개입이 차단됩니다. 현재 루트에 집중된 보일러플레이트는 설계적 결함이 아니라, 아직 해당 OS 프리미티브가 부재해서 발생한 과도기적 현상일 뿐입니다. 

**🧑 사용자**: 아니 그래서 뭘 하자고 go를 하자는거야?

**🤖 AI**: 이 결론(현재의 타협은 옳으며, 최종 해결책은 OS 프리미티브 확충임을 확인)을 문서화하고 다음 실행 단계로 넘어가자는 뜻입니다.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | ZIFT 아키텍처 하에서 로컬 UI 상태 처리는, **가짜 커맨드로 커널을 오염시키지 않고 최상단 컴포넌트에 `useState`를 모아 격리하는 것이 올바른 과도기적 타협**이다. 궁극적으로는 ARIA APG 기반 OS Primitive(Accordion, Tree) 개발을 통해 이를 선언적으로 100% 흡수해야 한다. |
| **📊 Data** | 1. `UnifiedInspector` 리팩토링 중 `expandedTxs` 등 뷰 상태 처리를 위해 보일러플레이트가 집중됨. <br> 2. 웹 UI의 90% 이상은 정형화된 ARIA APG 패턴임. |
| **🔗 Warrant** | 1. 뷰 상태를 커널 커맨드로 우회하면 핵심 비즈니스 로직(Trace)이 오염됨. <br> 2. 상태를 선언적 Primitive로 OS가 지원하면 Zero-Drift가 완성됨. |
| **📚 Backing** | ZIFT 철학 (Passive Projection), W3C ARIA Authoring Practices Guide (APG). |
| **⚖️ Qualifier** | 🟢 Clear (설계적 이견 없음, 남은 일은 실행뿐) |
| **⚡ Rebuttal** | 1%의 극단적인 커스텀 인터랙션이 필요할 경우, OS Primitive만으로 방어가 불가능한 Escape Hatch 설계가 추후 필요해질 수 있음. |
| **❓ Open Gap** | Accordion과 Tree 구조를 처리할 ZIFT OS Primitive 스펙 문서를 언제, 어느 수준까지 먼저 설계할 것인가? |

## 🚀 Next

| 예측행선지 | 🟢 Clear → `/go` |

> 이 논의를 바탕으로, 현재 타협된 `UnifiedInspector` 코드를 유지한 채로 리팩토링 검증을 종료(`go`)하거나, 이어서 OS Primitive 보강 태스크(`issue` 또는 `project`)로 진입할 수 있습니다.
