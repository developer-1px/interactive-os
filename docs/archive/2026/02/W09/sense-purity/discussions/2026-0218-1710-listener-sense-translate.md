---
last-reviewed: 2026-02-18
---

# Discussion: 1-listen Sense/Translate 분리

## Journey

**🧑 사용자**: OS의 커버리지 특히 DOM과 연결된 1-listener의 커버리지가 높아지도록 코드를 만들려면 어떻게 하면 좋을지 분석해봐

**🤖 AI**: 1-listen의 3개 파일(FocusListener, KeyboardListener, ClipboardListener)을 분석한 결과, DOM 감지(Sense) + 판단(Translate) 두 책임이 하나의 useEffect 콜백에 혼재되어 있다. 이미 프로젝트에서 `tab.ts`/`resolveTab.ts` 패턴으로 검증된 분리를 적용하면 된다. 단, ClipboardListener처럼 판단이 2줄뿐인 파일에도 추출의 ROI가 있는가?

---

**🧑 사용자**: 이 프로젝트의 취지는 커널과 OS의 이유가 최대한 순수함수화 해서 DOM의 개입을 줄이면서도 표현력을 늘리는 거야

**🤖 AI**: 이건 커버리지 전술이 아니라 프로젝트의 raison d'être. ROI 문제가 아니라 원칙 문제. ClipboardListener 2줄도 추출해야 맞다. 이 패턴은 Hexagonal Architecture(Ports & Adapters)의 정확한 적용이다.

---

**🧑 사용자**: 1-listener를 /keyboard /mouse /clipboard 등으로 입력장치 기준으로 폴더링

**🤖 AI**: 현재 FocusListener가 mousedown + focusin을 혼용하고 있다. 분리하면 3-commands의 `command.ts`/`resolve*.ts` 패턴과 isomorphic해진다. 단, focus는 "입력장치"인가? 독립 폴더 vs pointer에 합치기.

---

**🧑 사용자**: 이건 정답이 있는 문제일까? aria나 혹은 참고할만한 레퍼런스?

**🤖 AI**: W3C UI Events Specification이 정답. Focus Events는 독립 모듈(§3.3)로 분류된다. Mouse와 분리. "Focus events are not caused by a specific input device."

---

**🧑 사용자**: w3c의 워딩을 최대한 빌려와서 파일명을 만든다면?

**🤖 AI**: W3C 인터페이스명(KeyboardEvent, MouseEvent, FocusEvent, ClipboardEvent)에서 파생. `keyboard/KeyboardListener.tsx` + `keyboard/resolveKeyboard.ts`. 이름 자체가 문서.

---

**한 줄 요약**: DOM 리스너의 Sense/Translate 분리를 W3C UI Events 모듈 기준 폴더링으로 구조화 → 순수 함수 커버리지 극대화.

---

## Conclusion

### Why
프로젝트의 존재 이유는 "최대한 순수함수화하여 DOM 개입을 줄이면서 표현력을 늘리는 것". 1-listen는 이 원칙이 아직 적용되지 않은 마지막 영역.

### Intent
1-listen에 Hexagonal Architecture(Ports & Adapters)를 적용하여, DOM 어댑터(Sense)와 순수 판단 함수(Translate)를 분리하고, W3C UI Events 모듈 기준으로 폴더링한다.

### Warrants
- W1. 검증된 패턴: `tab.ts`/`resolveTab.ts`, `escape.ts`/`resolveEscape.ts`
- W2. Listener엔 Sense + Translate 두 책임이 혼재
- W3. Translate 부분은 순수 함수로 추출 가능
- W4. Sense(DOM 접근)는 본질적으로 E2E 영역
- W5. 순수함수화는 프로젝트의 raison d'être
- W6. Hexagonal Architecture (Ports & Adapters)
- W7. 폴더 구조가 3-commands와 isomorphic → 학습 비용 제로
- W8. W3C UI Events Spec이 keyboard/mouse/focus/clipboard를 독립 모듈로 정의
- W9. 파일명이 W3C 인터페이스명과 1:1 매핑되면, 이름 자체가 문서

### 확정된 구조

```
1-listen/
  ├── keyboard/
  │   ├── KeyboardListener.tsx    ← 어댑터 (sense)
  │   └── resolveKeyboard.ts      ← 순수 (translate)
  ├── mouse/
  │   ├── MouseListener.tsx        ← 어댑터 (sense)
  │   └── resolveMouse.ts          ← 순수 (translate)
  ├── focus/
  │   ├── FocusListener.tsx        ← 어댑터 (sense)
  │   └── resolveFocus.ts          ← 순수 (translate)
  └── clipboard/
      ├── ClipboardListener.tsx    ← 어댑터 (sense)
      └── resolveClipboard.ts      ← 순수 (translate)
```

### 한 줄 요약
**W3C UI Events 모듈을 폴더 경계로, Hexagonal Architecture를 파일 경계로 적용하면, DOM 리스너도 unit 테스트 가능한 순수 함수의 집합이 된다.**
