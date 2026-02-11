# OS 구조 논증 여정

## 대화록

**🧑 사용자**: 현재 OS 구조에 관하여 (discussion 시작)

**🤖 AI**: os-new의 레이어드 넘버링(1~6) + Core + Kernel + Schema 구조를 분석. re-frame 6 도미노와의 매핑을 검토하고, `2-contexts`가 파이프라인 단계가 아닌 인프라가 아니냐는 의문을 제기.

**🧑 사용자**: 레이어 넘버링은 너무 만족해. re-frame 6 도미노를 FE에 잘 이식했다 생각해. 어색한 이름이나 순서가 있어?

**🤖 AI**: `2-contexts`가 React Context로 오해될 수 있고, 데이터 흐름 단계가 아닌 인프라라고 주장.

**🧑 사용자**: 흠... 순서상 맞지 않아?

---

**🤖 AI**: 코드를 실제로 확인. `kernel.defineContext("dom-items", ...)`는 React Context가 아니라 커맨드 실행 전 DOM 데이터를 lazy inject하는 프로바이더. re-frame coeffect에 해당하며 순서상 정확. 기존 주장을 철회.

**🧑 사용자**: 내가 맞다고 해서 맞다고 한거야?

**🤖 AI**: 아니다. 코드(`kernel.defineContext`)가 근거였지, 사용자의 반박이 근거가 아니었다. 단, "context"라는 이름이 React Context와 혼동될 수 있다는 점은 유효.

**🧑 사용자**: contexts라고 한 이유가 결국 state handler에서 ctx에 들어가는 값이지 않아?

**🤖 AI**: `ctx.inject(DOM_ITEMS)` — 문자 그대로 `ctx` 파라미터에 들어가는 값. "context"가 추상적 은유가 아니라 **코드와 1:1 대응**. 이름 변경 제안의 근거가 소멸.

> **전환점: "context" 네이밍 논쟁 종결. 이름은 코드 구조와 정확히 일치한다.**

---

**🧑 사용자**: 넘버링 밖 디렉토리들은 레거시야. middleware는 확정이고, pipeline이 아니라 번호가 없는 것은 맞아.

**🤖 AI**: "번호 있음 = 파이프라인 단계, 번호 없음 = 횡단 인프라" 원칙 확인.

**🧑 사용자**: OS 내부 컴포넌트와 외부 컴포넌트 구분이 고민.

**🤖 AI**: `AntigravityOS.tsx` Facade가 이미 public/private 경계를 수행하므로 별도 폴더 분리가 필수는 아니라고 제안.

**🧑 사용자**: 그러네. 그래도 레이어적 구분은 필요한데.

> **전환점: Facade = public 경계, 폴더 = 레이어 경계. 두 관심사 분리.**

---

**🧑 사용자**: 지금 radix 수준도 있어서 3 layer야. FocusGroup / ZIFT / Dialog 이런 느낌.

**🤖 AI**: 처음에 FocusGroup을 Layer 3으로 오해했으나 사용자가 교정. Dialog가 Radix 수준의 복합 컴포넌트.

```
Layer 1: FocusGroup, FocusItem (base)
Layer 2: Zone, Item, Field, Trigger (primitives)
Layer 3: Dialog, Modal (radix-level compound)
```

**🧑 사용자**: 폴더 구조로 레이어와 모듈이 눈에 보여야 해. 서브 폴더를 반드시 레이어별로 구분할 거야.

> **원칙 확립: "폴더를 열면 아키텍처가 보인다."**

---

**🧑 사용자**: (Layer 3을) shadcn이라고 지을 거야.

**🤖 AI**: 역할을 기술하지 않는 외부 프로젝트 이름이다. LLM 프롬프트 의도는 이해하지만 Tailwind 구현 오염 리스크가 있다.

**🧑 사용자**: 그러면 radix라고 하자.

**🤖 AI**: Radix는 headless이므로 Tailwind 오염 없이 compound 인터페이스 패턴만 유도. 적합.

**🧑 사용자**: (Layer 1은) base나 core로 바꿀까?

**🤖 AI**: `core/`는 `os-new/core/`와 이름 충돌. `base`가 깔끔하다.

> **확정: `base / primitives / radix`**

---

**🧑 사용자**: listener가 할 수 있는 게 이제 뭐가 있을까?

**🤖 AI**: 마우스가 없다고 주장했으나 사용자가 교정 — `FocusSensor`가 이미 mousedown을 처리.

**🧑 사용자**: 이름과 구성의 문제인데. KeyboardListener / MouseListener / ClipboardListener가 맞지 않아?

**🤖 AI**: 현재 Listener/Sensor/Intent 3패턴 혼재. "Driver"를 제안했으나 과한 OS 은유. 사용자의 반문("Driver?") 후 Listener 통일로 수정.

**🤖 AI**: (Red Team) 진짜 문제는 이름이 아니라 `keybindings.ts`, `osDefaults.ts`가 listener가 아닌 **설정 데이터**인데 `1-listeners` 안에 있는 것.

**🧑 사용자**: keybinding은 분명 pipeline은 아니지? → 맞다.

> **전환점: keybindings를 `keymaps/`로 분리.**

---

**🧑 사용자**: 커널도 키바인딩이고 Zone이 키바인딩을 가질 수 있어. Zone 버블링이고 App도 Kernel도 Zone이야.

**🤖 AI**: "모든 것은 Zone이다" — 키바인딩이 Zone 스코프이며 버블링하는 구조 발견. 캡처=Listener, 버블링+해석=커널, 데이터=Zone config.

**🧑 사용자**: Zone이 커맨드를 가지는 건 맞지만, group이 커맨드를 가지는 구조인데.

**🤖 AI**: Zone=UI 파사드(선언), FocusGroup=런타임(커맨드 소유+ZoneRegistry 등록). `onAction` 등은 하드코딩된 키바인딩 — 범용 시스템으로 일반화 가능.

**🧑 사용자**: 키바인딩은 별도 논의가 필요할 정도로 큰 건.

> **키바인딩 시스템은 별도 /discussion으로 연기.**

---

**🧑 사용자**: os-new의 이상적인 폴더 구조만 잡아보고 마무리하자.

**🧑 사용자**: lib는 별도로 모아두지 않고 응집도에 맞게 근처로 보낼 거야.

> **최종 확정: 파이프라인 6개 + 비파이프라인 3개(schema, middleware, keymaps). lib 해체. 레거시 7개 폴더 전부 흡수/제거.**

---

## 한 줄 요약

> **os-new의 re-frame 도미노 이식을 검증하고, "폴더=레이어, Facade=경계, 번호=파이프라인" 원칙을 확립하여, 파이프라인 6개 + 비파이프라인 3개 + 컴포넌트 3층(base/primitives/radix)의 이상적 구조를 합의했다.**
