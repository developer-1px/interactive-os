# os-api-rename — OS API Surface 정비

## WHY

앱 개발자(인간/AI)가 OS 제공 기능을 발견하지 못하고 바퀴를 다시 만든다.
원인: 네이밍 불일치, 진입점 혼란(`kernel`), 훅 발견 불가.

## Goals

1. `kernel` → `os` 전체 rename (alias 없이 한 번에)
2. 커맨드 변수명에 `OS_` 접두어 통일 (21개 미적용 → 적용)
3. OS 훅을 `os.*` 네임스페이스로 통합 (`os.useExpansion()`)
4. 변수명 = 디버그 문자열 일치 보장

## Scope

- `src/os/kernel.ts` — 인스턴스 변수 rename
- `src/os/3-commands/**` — 커맨드 변수명 통일
- `src/os/5-hooks/**` — 훅 경로/이름 재설계
- 모든 import site (apps, pages, tests)
- `@kernel` 패키지명은 변경하지 않음 (범용 라이브러리)

## Key Decisions (Discussion에서 확정)

| 결정 | 근거 |
|------|------|
| `OS_` 접두어 유지 + 통일 | 짧으면서 그룹핑에 탁월 |
| `createKernel` = React급 범용 라이브러리 | `os` = Next급 구현체. 레이어가 다름 |
| 한 번에 전체 rename | alias 점진 전환은 작업을 두 번 시킴 |
| `os.useExpansion()` | `use` prefix가 hook을 대변. 하위 네임스페이스 불필요 |

## References

- [Discussion: OS API Surface](discussions/2026-0220-1320-os-api-surface-naming.md)
- [Divide: OS Naming System](notes/2026-0220-1326-divide-os-naming-system.md)
- [Archived: naming-convention project](../../archive/2026/02/W08/naming-convention/)
