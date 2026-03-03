# Audit: command-config-invariant (2026-03-03)

## 대상
- `packages/os-core/src/4-command/activate/activate.ts` (T6 수정)
- `packages/os-core/src/4-command/navigate/` (chain executor)
- `packages/os-core/src/engine/registries/` (roleRegistry, zoneRegistry)
- `packages/os-sdk/src/app/defineApp/page.ts` (preview invariant)

## Step 1: grep 결과

```
tsc: 0 errors
```

| # | 파일:줄 | 패턴 | 스니펫 |
|---|---------|------|--------|
| 1 | `zoneRegistry.ts:250,264,316,340` | `querySelectorAll` | DOM scan for getItems/getLabels auto-registration |
| 2 | `navigate/index.ts:81` | `DOM_EXPANDABLE_ITEMS` | chain executor runtime item-level expand 판별 |
| 3 | `roleRegistry.ts:306,355,404,415` | `onClick: true` | config 데이터 속성 (이벤트 핸들러 아님) |

## Step 2: 분류

| # | 분류 | 판정 이유 |
|---|------|---------|
| 1 | ⚪ 정당한 예외 | §3: sense adapter DOM 읽기. `bindElement`는 FocusGroup.useLayoutEffect 유일 DOM 터치. OS 관할 정당 |
| 2 | ⚪ 정당한 예외 | navigate chain이 "이 item이 expandable인가?" runtime 판별 — activate.effect와 역할 다름 |
| 3 | ⚪ 정당한 예외 | config 데이터 속성. UI event handler 아님 |

## 0건 규칙 체크

| 항목 | 결과 |
|------|------|
| 이번 변경에서 사용된 OS 프리미티브 | `ZONE_CONFIG inject`, `OS_EXPAND dispatch`, `ZoneRegistry.isDisabled`, `enterPreview/exitPreview` |
| 콜백 시그니처 선언형 여부 | ✅ activate.ts: `return { dispatch: OS_EXPAND(...) }` |
| bind() 메소드 실제 존재 여부 | ✅ tsc 0 |
| os.dispatch 직접 호출 | ✅ 이번 scope 내 없음 (field/drag는 이전 scope) |

## 지표

```
총 위반: 0건 (이번 scope 기준)
  🔴 LLM 실수: 0건
  🟡 OS 갭: 0건 신규
  ⚪ 정당한 예외: 3종 (기존 §3 적용)
재감사: 필요 없음 (LLM 실수 0건)
```

## AUDITBOOK 갱신 여부

신규 지식 없음 → 갱신 없음.
