# Discussion: Content Mode / Edit Mode 분리

> 2026-02-24 14:32 ~ 14:55

---

## Journey

**🧑 사용자**: 컨텐츠모드와 편집모드 구분을 하는 기능을 넣을거야. text를 선택하고 한번 더 클릭하면 바로 글자 편집이 될 수 있게 하려고 해.

**🤖 AI**: Intent 추론 — 현재 Enter-to-edit 패턴이 키보드 OS 문법이라면, 사용자는 웹 사용자에게 친숙한 Figma/Google Slides 식 2단계 언어를 원함. Q1: 블록 레벨 선택과 필드 레벨 선택 중 무엇? Q2: 글로벌 잠금 모드인가 vs 현재 포커스 상태 반영인가?

---

**🧑 사용자**: 2단계 클릭 시퀀스. 상단 툴바에 선택모드와 편집모드가 구분되면 좋겠어. 선택모드에서 글자를 입력하면 자동으로 편집모드가 되면 되지 않을까? 현재 Enter를 쳐야만 편집되는 건 낯선 방식이고, 선택된 걸 한번 더 선택하면 글자 편집이 되는 건 워낙 익숙한 패턴이라.

**🤖 AI**: Steel-manning — 완전히 옳음. 업계 표준 검증: Figma/Google Slides/PowerPoint 모두 동일 패턴(첫 클릭=선택, 재클릭=편집, 타이핑=편집). Tension 발견: 타이핑 시 교체형 vs 이어쓰기형 / 툴바가 글로벌 잠금인가 vs 상태 투영인가.

---

**🧑 사용자**: 2단계, 선택 → 편집 → 선택 → 해제

**🤖 AI**: FSM 확정. Escape = 항상 한 단계 위로. 구현 gap 분석 완료.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | 빌더 캔버스에 4-state FSM(none → selected → editing → selected → none)을 도입한다. 재클릭·타이핑·Enter = 편집 진입, Escape = 한 단계 위로 복귀, 툴바는 현재 포커스 아이템의 상태를 실시간 반영한다. |
| **📊 Data** | 현재 Enter-only edit-entry가 웹 사용자에게 낯섦 / Figma, Google Slides, PowerPoint 모두 재클릭=편집 패턴 / 기존 KI에 Select-then-Edit 패턴 및 `data-[focused]`/`data-[editing]` 상태 분리가 이미 존재 |
| **🔗 Warrant** | Web-native editing paradigm을 따를 때 학습 비용이 0에 수렴하고, OS의 Principle of Least Astonishment가 보장됨 |
| **📚 Backing** | Figma Design Spec(V=Select/T=Text), W3C APG editbox interaction pattern, PowerPoint/Keynote 재클릭 편집 진입 UX |
| **⚖️ Qualifier** | Complicated — 구현 경로 분명, 필요한 OS 훅 2개 특정 |
| **⚡ Rebuttal** | 재클릭 감지는 "이미 focused된 아이템 위의 click"을 OS 마우스 파이프라인이 구분해야 함 — 기존 `onActivate`와 충돌 가능성 검토 필요 |
| **❓ Open Gap** | 타이핑 시 기존 텍스트 교체 vs 이어쓰기 (Figma=커서 끝 이어쓰기, PPT=교체 — 이어쓰기 권장) |

---

## FSM 정의

```
none
  │ [클릭]
  ▼
selected  ◄──────────────────────┐
  │ [재클릭 / 타이핑 / Enter]     │
  ▼                              │ [Escape]
editing ───────────────────────►─┘
  
selected
  │ [Escape / 외부 클릭]
  ▼
none
```

---

## 구현 Gap 분석

| 트리거 | 현재 상태 | 필요 작업 |
|--------|-----------|-----------|
| 첫 클릭 → `selected` | ✅ OS 처리 | 없음 |
| Enter → `editing` | ✅ `FIELD_START_EDIT` | 없음 |
| 더블클릭 → `editing` | ✅ 있음 | 없음 |
| **재클릭 → `editing`** | ❌ re-focus만 | OS 마우스 파이프라인 수정 |
| **타이핑 → `editing`** | ❌ OS 키맵이 가로챔 | Zone 키바인딩에 printable char 핸들러 |
| Escape(editing) → `selected` | ✅ `FIELD_CANCEL` | 없음 |
| Escape(selected) → `none` | 확인 필요 | 검토 |
| **툴바 모드 표시** | ❌ 없음 | EditorToolbar에 모드 indicator |

---

## 라우팅

- **행선지**: `builder-v2` BOARD.md — New Task 등록
- **Cynefin**: Complicated → `/go`
