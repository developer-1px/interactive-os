# tsx 책임 분리 — os-core vs os-react 경계 재정의

> **Date**: 2026-03-03 10:04
> **Trigger**: 패키지 분리(T1~T8) 직후, os-react 5,135줄에 대한 의문

---

## Journey

**🧑 사용자**: os-react에서 파이프라인을 이렇게 써야 하나?

**🤖 AI**: Pipeline(1→5)이 두 패키지로 쪼개짐. "React 유무"로 나눈 게 기술 분류이지 책임 분류가 아님. os-core→os-react 역의존 1건 발견.

---

**🧑 사용자**: React tsx는 최대한 얇은 접점이어야 하는데 왜 이렇게 크지?

**🤖 AI**: os-react 5,135줄 중 1,480줄(29%)이 순수 TS. PointerListener.tsx 395줄에 OS dispatch 로직 포함. Field.tsx 467줄에 OS:React = 21:20 반반 혼재.

---

**🧑 사용자**: tsx 안에서 책임 분리를 못했기에 이렇게 된 것.

**🤖 AI**: 맞음. 근본 원인은 tsx 내부 로직 혼재. 패키지 분리는 "폴더 이동"이지 "책임 분리"가 아니었음.

---

**🧑 사용자**: tsx 내부 로직 추출할 거야. 최대한 얇게 가져가는 게 큰 전략.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | tsx 컴포넌트에서 OS 로직을 추출하여 순수 TS로 분리해야 한다. tsx는 최대한 얇은 bypass 통로 |
| **📊 Data** | PointerListener.tsx 395줄(OS dispatch 8종 포함), Field.tsx 467줄(OS:React 21:20 혼재), os-react 내 순수 TS 1,480줄(29%) |
| **🔗 Warrant** | tsx가 두꺼우면 패키지를 아무리 나눠도 "폴더 이동"이지 "책임 분리"가 안 된다 |
| **📚 Backing** | Interaction OS 핵심 원칙: "앱은 의도를 선언하고, OS가 실행을 보장한다" — tsx도 예외 없음 |
| **⚖️ Qualifier** | 🟢 Clear |
| **⚡ Rebuttal** | 추출 후 파일 수 증가. 하지만 각 파일의 책임이 명확해지므로 LLM 유지보수에 유리 |
| **❓ Open Gap** | 추출 대상 파일별 구체적 분리 지점(어디까지가 로직이고 어디부터가 래핑인가) |

🚀 **Next**: 🟢 Clear → `/go` → `/divide` (추출 대상 전수 열거) → `/plan` → 실행
