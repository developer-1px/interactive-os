# Plan: normalized-collection tree 테스트 Green

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `tree-ops.test.ts`:beforeEach | `BuilderApp.create()` → GreenEye 프리셋 (ID: `ge-*`, accept 없음) | 전용 tree fixture: `tab-container-1` + `accept` 속성 포함. `loadPagePreset`으로 주입 or 별도 INITIAL_STATE | Clear | — | 15 tests GREEN | 기존 builder tests 무관 |
| 2 | `tree-paste.test.ts`:beforeEach | 동일 — GreenEye ID 불일치 | 동일 fixture 사용 | Clear | →#1 | 6 tests GREEN | 동일 |
| 3 | `BOARD.md` 구조 정리 | Now/Done 중복 2회. 거짓 Done 표기 | 단일 Done + Now에 "T7: tree-ops/paste Green" 추가 | Clear | — | BOARD 일관 | — |

## fixture 구조

```ts
const TREE_FIXTURE: Block[] = [
  { id: "hero-1",  type: "hero", label: "Hero", fields: {} },
  { id: "tab-container-1", type: "tabs", label: "Tabs", fields: {},
    accept: ["tab"],
    children: [
      { id: "tab-1-overview", type: "tab", label: "Overview", fields: {},
        accept: ["section"],
        children: [
          { id: "tab-1-overview-s1", type: "section", label: "Overview S1", fields: {} }
        ]},
      { id: "tab-1-details", type: "tab", label: "Details", fields: {},
        accept: ["section"],
        children: [
          { id: "tab-1-details-s1", type: "section", label: "Details S1", fields: {} }
        ]},
      { id: "tab-1-faq", type: "tab", label: "FAQ", fields: {} },
    ]},
  { id: "ncp-news",   type: "news",   label: "News",   fields: {} },
  { id: "ncp-pricing", type: "pricing", label: "Pricing", fields: {} },
  { id: "ncp-footer",  type: "footer",  label: "Footer",  fields: {} },
  { id: "ncp-cta",     type: "cta",     label: "CTA",     fields: {} },
];
// 6 root blocks (hero + tabs + news + pricing + footer + cta)
```

## 라우팅
승인 후 → `/go` (normalized-collection) — T7 tree fixture Green
