# 회고: DnD 파이프라인 Coverage Gap

> 출처: `docs/0-inbox/2026-0226-0800-diagnose-dnd-onreorder.md`
> 관련 프로젝트: builder-v2 T5

## 문제

`/stories` → `/spec` → `/red` → `/green` → `/bind` → `/audit` 전 파이프라인 통과했으나 실제 브라우저에서 드래그 앤 드롭이 동작하지 않음.

## 근본 원인 2가지

### 1. onReorder 시그니처 위반
- OS 콜백 계약: 커맨드를 **리턴** (선언형) → OS가 dispatch
- `onReorder`만 `void` (명령형) → 앱이 직접 dispatch해야 함
- LLM이 존재하지 않는 `BuilderApp.dispatch`를 호출 → 런타임 에러

### 2. 파이프라인 Coverage Gap
| 구간 | 검증 여부 |
|------|----------|
| `reorderBlocks` 순수함수 | ✅ unit test |
| onReorder 콜백 → OS dispatch → 상태 변경 | ❌ **미검증** |
| `data-drag-handle` 존재 여부 | ❌ **미검증** |

## 제안

1. **OS 계약 통일**: 모든 zone 콜백은 `BaseCommand | BaseCommand[]` 리턴 (선언형) — 이번에 수정 완료
2. **`/bind` 이후 smoke 검증**: bind 완료 후 최소 1회 E2E smoke (실제 인터랙션 → 상태 변경 확인)
3. **`/audit` 확장**: OS 콜백 시그니처 일관성 검사 항목 추가
