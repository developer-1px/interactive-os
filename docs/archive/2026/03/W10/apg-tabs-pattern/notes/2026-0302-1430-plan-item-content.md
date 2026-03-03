# Item.Content 변환 명세표

> Discussion: [2026-0302-1420-item-content-gap.md](../discussions/2026-0302-1420-item-content-gap.md)
> Conclusion: `Item.Region` → `Item.Content`로 일반화. Zone 역할에 따라 가시성 + ARIA 자동 투영.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `roleRegistry.ts`: contentRoleMap | 없음 | contentRoleMap + contentVisibilitySource 추가 | Clear | — | tsc 0 | 없음 |
| 2 | `bind.ts:RegionComponent` | expandedItems 기반, role="region" 하드코딩 | ContentComponent: Zone 역할 읽어 expand/select 자동 분기, role/tabindex 자동 | Clear | →#1 | tsc 0 + 기존 accordion 유지 | 핵심 변경 |
| 3 | `bind.ts:ItemComponent` | Item.Region만 | Item.Content 추가, Region=deprecated alias | Clear | →#2 | tsc 0 | 하위호환 |
| 4 | `types.ts:BoundComponents` | Region 타입 | Content 타입 + Region deprecated | Clear | — | tsc 0 | 타입만 |
| 5 | `AccordionPattern.tsx` | Item.Region | Item.Content | Clear | →#3 | tsc 0 + test 통과 | 리네임 |
| 6 | `TabsPattern.tsx` | 수동 os.useComputed | Item.Content 사용 | Clear | →#2,#3 | tsc 0 + 브라우저 패널 전환 | 깨진 구현 교체 |

## 라우팅

승인 후 → `/go` (apg-tabs-pattern) — OS primitive 확장 + APG Tabs 수정
