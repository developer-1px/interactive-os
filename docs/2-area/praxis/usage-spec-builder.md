# Usage Spec — Builder (Design Spike v2)

> **대상**: Visual CMS Builder (복잡성 대표)
> **방법론**: Wishful Thinking + Conceptual Integrity Check
> **규칙**: 이 코드는 **컴파일되지 않는다**. Goal을 표현하는 설계 문서다.
> **상태**: 🟡 Direction confirmed, details unconfirmed

---

## 1. 확정된 핵심 모델

```
┌─────────────────────────────────────────────────────┐
│  App Data (자유로운 구조)                              │
└─────────────────┬───────────────────────────────────┘
                  │  from: (state) => NormalizedCollection
                  ▼
╔═════════════════════════════════════════════════════╗
║  Zone (유일한 Facade)                                ║
║                                                     ║
║  NormalizedStore (단일 정규화 구조)                    ║
║  + entity schema → Field 타입 자동 결정              ║
║  + with[] 모듈 → 기능 합성                           ║
╚═════════════════════════════════════════════════════╝
                  │  to: (state, normalized) => nextState
                  ▼
┌─────────────────────────────────────────────────────┐
│  App Data (원래 구조로 복원)                           │
└─────────────────────────────────────────────────────┘
```

**확정된 원칙:**
- Zone이 유일한 Facade. `createCollectionZone` 등 별도 개념 불필요
- `to` 없음 → 읽기 전용 (Navigation + Selection만)
- `to` 있음 → 편집 가능 (상태 변경 모듈 사용 가능)
- `entity` 있음 → Field 타입별 위젯 자동 결정
- `with[]` → 기능은 모듈로 합성. 없으면 없는 것. 피쳐 플래그보다 상위 개념

---

## 2. 확정된 Usage 형태

```typescript
// ── 확정: 이 구조가 Goal ──

const sidebar = app.zone("sidebar", {
  structure: "tree",
  from: (state) => normalizeTree(state.data.blocks),   // 앱이 작성
  to: (state, n) => ({ ...state, data: { blocks: denormalizeTree(n) } }),
  entity: {
    label:   { type: "string", mode: "inline" },
    visible: { type: "boolean" },
  },
  with: [
    crud(),                                  // Add, Delete, Duplicate
    reorder(),                               // Alt+↑↓
    reparent(),                              // Alt+←→
    clipboard(),                             // Ctrl+C/X/V
    select({ mode: "multi" }),               // Shift+Arrow, Ctrl+Click
    dnd({ axis: "vertical" }),               // 드래그 앤 드롭
    activate((item) => openDetail(item)),    // Enter 시 앱 고유 동작
  ],
});

// ── 확정: 읽기 전용 Zone ──

const docs = app.zone("docs", {
  structure: "tree",
  from: (state) => normalize(state.sections),
  // to 없음 → 읽기 전용
});
```

---

## 3. 모듈 목록 (방향 확정, 상세 미확정)

| 모듈 | 제공하는 것 | 확정 |
|------|-----------|:----:|
| `crud()` | Add/Delete/Duplicate | ✅ 방향 |
| `reorder()` | 순서 변경 (Alt+↑↓) | ✅ 방향 |
| `reparent()` | 트리 재배치 (Alt+←→) | ✅ 방향 |
| `clipboard()` | Copy/Cut/Paste | ✅ 방향 |
| `select(opts)` | 셀렉션 모드 | ✅ 방향 |
| `dnd(opts)` | Drag & Drop | ✅ 방향 |
| `activate(fn)` | Enter 동작 (앱 고유) | ✅ 방향 |

---

## 4. 미확정 (T1~T6에서 설계할 것)

- [ ] Properties Panel (Master-Detail) — Zone으로 표현 가능한지, 별도 개념인지
- [ ] 동적 entity schema — block type별로 다른 속성을 어떻게 선언하는가
- [ ] Field 타입 확장 — enum/color/date가 OS 내장인지 앱 커스텀인지
- [ ] Cross-zone 연동 — 여러 zone이 같은 데이터를 from하면 동기화는?
- [ ] 자동 생성 UI — OS가 기본 View를 제공할 것인가, 헤드리스만인가
- [ ] Zone 모듈의 타입 제약 — tree가 아닌데 reparent() 넣으면?
- [ ] Overlay/Trigger 선언 방식
