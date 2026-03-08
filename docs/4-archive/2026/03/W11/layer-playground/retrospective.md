# Retrospective: layer-playground

> 2026-03-08 | 8 tasks | 35 tests (31 active + 4 todo) | 3 OS gaps

## Session Summary
Layer Playground: overlay type별 독립 showcase 7개 + nested LIFO showcase 1개.
OS Layer+Trigger 시스템 개밥먹기로 3개 OS gap 발견 (OG-021~023).

## Knowledge Harvest
- K1: SDK OS_OVERLAY_OPEN re-export 부재 (OG-021)
- K2: Headless hover simulation 부재 (OG-022)
- K3: AlertDialog Escape 차단 미구현 (OG-023)
- K4: zone-level trigger binding이 headless overlay lifecycle 완전 지원
- K6: 사용자 행동이 있으면 무조건 Light 이상 (규칙화)

## KPT

### Keep
- Zone-level trigger binding 패턴 7개 overlay에 일관 적용
- 독립 defineApp으로 headless 테스트 격리
- /audit이 @os-core facade 위반 정확히 포착

### Problem
- triggerZone.bind() 이중 호출 버그 (tsc 미탐지)
- Meta 오분류 (사용자 교정 필요)

### Try (all reflected)
- zone.bind() 한 줄 패턴 강제 (분리 금지)
- 규모 판정: click/keyboard/focus 존재 → Light 이상 (project.md 반영)

## Actions: 6/6 reflected, 0 remaining
