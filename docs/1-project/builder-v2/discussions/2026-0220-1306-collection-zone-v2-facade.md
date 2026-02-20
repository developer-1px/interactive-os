# Collection Zone v2: Minimal Facade 설계

## Journey

**🧑 사용자**: Builder에서 copy paste를 해볼건데 여기서부터 어려워지니까 잘 부탁해.

**🤖 AI**: 먼저 맥락 파악. vitest로 진단 → **2가지 버그 발견**: (1) `onPaste`가 shallow clone — children ID 중복, (2) 테스트 기대값 오류. `deepCloneBlock` 재귀 헬퍼로 수정, 커밋 완료.

---

**🧑 사용자**: delete edit copy paste undo redo를 범용적으로 headless하게 만들건데, id 필드만 알려준다거나 최소한의 퍼사드를 설계해보자.

**🤖 AI**: 현재 `createCollectionZone` 분석. Todo와 Builder의 config 비교 → **clipboard.accessor/set이 100% 동일 패턴**, Convention으로 고정 가능. `toText` 기본값 체인, deep clone 자동 감지 제안.

**🧑 사용자**: 뭐 더 커스텀하게 할수도 있지만 그냥 별 생각없이 쓰기에도 좋은 수준? 우리 role처럼 축은 다양하지만 preset이 있는 형태?

**🤖 AI**: **`role` Preset+Override 패턴** 적용. `items` 하나만 주면 CRUD+clipboard 전부 동작, 필요한 축만 오버라이드. clipboard를 OS 관리로 이동 제안 → focus.zones와 일관적 구조.

---

**🧑 사용자**: clipboard는 OS 내부에서 관리할 수 있게 해줄거야. 복사시 직렬화만 하는 법만 알려주면 되지.

**🤖 AI**: 합의. `toText`만 제공 → OS가 저장/관리. 앱 보일러플레이트 16줄→1줄.

**🧑 사용자**: 받아줄 수 있는 포맷이 필요할듯. block의 경우 block 구조가 맞지 않으면 받아줄 수 없듯이. 요는 type 매칭이 되느냐 하는거.

**🤖 AI**: **`accept` 기반 타입 매칭** 도입. Copy는 다중 포맷(structured + text), Paste는 accept 검증 → 매칭 성공이면 structured, 실패면 text 폴백. 같은 collection이면 자동 수락.

---

**🧑 사용자**: builder의 경우 같은 zone이지만 block와 button은 달라.

**🤖 AI**: **Zone ≠ Collection** 구분 발견. Zone은 포커스 경계, Collection은 동일 타입 리스트. Block과 Button은 다른 collection — 기본값 유지.

**🧑 사용자**: 같은 collection 구분을 어떻게 하는데?

**🤖 AI**: `appName:zoneName`이 고유 식별자. 이미 존재하는 정보의 조합.

---

**🧑 사용자**: /reflect 놓친게 있나?

**🤖 AI**: 3가지 보완 발견: (1) Clipboard는 per-zone이 아닌 **글로벌 단일**, (2) `fromText` 선택적 ingress hook 필요, (3) undo/redo+edit를 collection에 포함 여부.

**🧑 사용자**: 다 맞는 말이네 좋아 반영하자.

> **한 줄 요약**: "데이터 위치 하나만 알려주면 CRUD+clipboard가 동작하는 최소 API"를 role의 Preset+Override 패턴으로 설계했다.

---

## Conclusion

### Why
Builder의 copy/paste 구현이 어려운 이유는 현재 facade가 너무 많은 보일러플레이트를 요구하기 때문. 데이터 구조가 복잡해질수록 (tree, children) 수동 설정이 폭발.

### Intent
**"별 생각 없이 쓰면 되는, 그러나 커스텀도 가능한"** Collection CRUD+Clipboard facade.

### Warrants

| # | Warrant |
|---|---------|
| W1 | `role`의 Preset+Override는 검증된 패턴 — 같은 철학 적용 |
| W2 | `text` 기본값 체인 (`label → text → id`)으로 대부분 커버 |
| W3 | `children` 자동 감지로 deep clone은 기본 동작으로 흡수 |
| W4 | `extractId`는 `{zoneName}-` Convention으로 자동화 |
| W5 | clipboard를 OS가 관리하면 앱 보일러플레이트 **0** |
| W6 | 16줄 → 1줄 — focus/selection과 일관적 구조 |
| W7 | clipboard는 undo 범위 밖 — OS 관리가 자연스러움 |
| W8 | `accept`로 타입 매칭 — cross-app/cross-zone paste 제어 |
| W9 | 다중 포맷 (structured + text) — 브라우저 ClipboardItem 모델 |
| W10 | text 폴백으로 Block→Field 같은 downgrade paste 자연스러움 |
| W11 | Zone ≠ Collection — 포커스 경계 vs 동일 타입 리스트 구분 |
| W12 | 같은 collection 복사 = 항상 같은 타입 → 자동 수락 유효 |
| W13 | collection 식별자 = `appName:zoneName` — 추가 설정 불필요 |
| W14 | Clipboard는 글로벌 단일 (per-zone 아님) |
| W15 | `fromText` = 선택적 ingress hook (외부 텍스트 → 아이템) |
| W16 | undo/redo를 collection에 자동 포함하면 보일러플레이트 추가 감소 |

### 최종 API

```typescript
// 극한 최소
const sidebar = App.collection("sidebar", {
  items: (s) => s.data.blocks,
})

// Entity+Order
const list = App.collection("list", {
  entities: (s) => s.data.todos,
  order: (s) => s.data.todoOrder,
})

// 전체 축 (오버라이드만)
App.collection(zoneName, {
  items | entities+order,          // 데이터 위치 (필수)
  text: (T) => string,            // 직렬화 (기본: label→text→id)
  accept: (unknown) => T | null,  // ingress 검증 (기본: 같은 collection 수락)
  fromText: (string) => T | null, // 외부 텍스트 ingress (기본: null)
  onPaste: (T, S) => T,           // paste 변환 (기본: identity)
  onClone: (T, id) => T,          // 복제 (기본: auto deep clone)
  filter: (S) => (T) => bool,     // 가시성 필터 (기본: 전체)
  generateId: () => string,       // ID 생성 (기본: random)
})
```

```
OS clipboard (글로벌 단일):
  os.clipboard = { source, items, isCut, text }

Paste 해상도:
  같은 collection? → 자동 수락 → onPaste → insert
  다른 collection? → accept(data) → 성공? structured paste : text 폴백
```

> **한 줄 요약**: Collection은 "데이터 위치"만 알려주면 CRUD+Clipboard가 동작하고, 나머지는 Convention 기본값 + accept 타입 매칭으로 자동화된다.
