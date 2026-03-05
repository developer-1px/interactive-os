# Code Review: OS Refactoring (createOsPage 병합 + Registry 통일)

> **범위**: 이번 세션에서 수정된 100+ 파일  
> **기준**: `.agent/rules.md` 원칙 + `/review` 체크리스트  
> **수렴**: 2회차, 신규 발견 0건

---

## 🔴 철학 위반 — `any` Type Leak

### 1. `OsPage.attrs` 유니온에 `any` 포함

| 항목 | 내용 |
|------|------|
| **파일** | [defineApp.page.ts](file:///Users/user/Desktop/interactive-os/src/os/defineApp.page.ts#L73) |
| **위반** | `readonly attrs: ItemAttrs | any` — `| any`는 `ItemAttrs`를 무효화한다 |
| **심각도** | 🔴 `[Blocker]` 100% Type-Strict 위반 |
| **수정** | `readonly attrs: ItemAttrs`로 변경, 또는 `Record<string, unknown>`으로 명시 |

### 2. OS Command 필드 14개가 전부 `any`

| 항목 | 내용 |
|------|------|
| **파일** | [defineApp.page.ts](file:///Users/user/Desktop/interactive-os/src/os/defineApp.page.ts#L139-L153) |
| **위반** | `OS_FOCUS: any`, `OS_NAVIGATE: any` 등 14개 필드에 `any` 사용 |
| **심각도** | 🔴 `[Blocker]` 커맨드 원칙 위반 — 모든 커맨드는 `BaseCommand` 브랜드 타입이어야 함 |
| **수정** | 각 필드를 `typeof OS_FOCUS` 등 실제 커맨드 타입으로 교체 |

---

## 🟡 네이밍/구조

### 3. Import 경로 혼재 (alias vs relative)

| 항목 | 내용 |
|------|------|
| **파일** | [defineApp.page.ts](file:///Users/user/Desktop/interactive-os/src/os/defineApp.page.ts#L50-L52) 및 `2-contexts/*.ts` |
| **위반** | 동일 모듈(`registries/`)을 3가지 경로로 import: `@os/registries/*`, `./registries/*`, `../registries/*` |
| **심각도** | 🟡 `[Suggest]` grep 일관성 훼손 — 하나의 규칙으로 통일 필요 |
| **수정** | `src/os/` 내부에서는 전부 `@os/registries/*` alias로 통일. 자기 디렉토리 내부(`registries/` → `registries/`)만 `./` 허용 |

### 4. `zoneRegistry.ts` 자기 참조 경로

| 항목 | 내용 |
|------|------|
| **파일** | [zoneRegistry.ts](file:///Users/user/Desktop/interactive-os/src/os/registries/zoneRegistry.ts#L13) |
| **위반** | `import type { ZoneRole } from "../registries/roleRegistry"` — 자기 자신의 디렉토리를 `../registries/`로 참조 |
| **심각도** | 🟡 `[Suggest]` 이동 후 경로 미수정. `./roleRegistry`가 정확 |
| **수정** | `from "./roleRegistry"`로 변경 |

### 5. `as FocusGroupConfig` 타입 캐스팅

| 항목 | 내용 |
|------|------|
| **파일** | [defineApp.page.ts](file:///Users/user/Desktop/interactive-os/src/os/defineApp.page.ts#L726) |
| **위반** | `as FocusGroupConfig` — 스프레드 결과를 강제 캐스팅 |
| **심각도** | 🟡 `[Suggest]` 구조 우회. `satisfies` 또는 타입 안전 merge 유틸 사용 권장 |

### 6. `as unknown as Set<string>` 캐스팅

| 항목 | 내용 |
|------|------|
| **파일** | [defineApp.page.ts](file:///Users/user/Desktop/interactive-os/src/os/defineApp.page.ts#L539) |
| **위반** | `{ has: () => true, size: Infinity } as unknown as Set<string>` — Duck typing으로 Set 계약 우회 |
| **심각도** | 🟡 `[Suggest]` expand mode "all"을 위한 sentinel. 별도 타입(`AllItemsSet`)으로 명시하면 의도가 명확해짐 |

---

## 🔵 개선 제안

### 7. `createOsPage` 내 inline import

| 항목 | 내용 |
|------|------|
| **파일** | [defineApp.page.ts](file:///Users/user/Desktop/interactive-os/src/os/defineApp.page.ts#L500) |
| **패턴** | `import("./2-contexts").ZoneOrderEntry` — 인라인 import |
| **심각도** | 🔵 `[Thought]` 파일 상단 import로 이동하면 의존성이 명시적. 현재는 동작에 문제 없음 |

### 8. `vitest_output.txt` 잔여 파일

| 항목 | 내용 |
|------|------|
| **파일** | `vitest_output.txt` (프로젝트 루트) |
| **심각도** | 🔵 `[Nitpick]` 디버깅 산출물. `.gitignore`에 추가하거나 삭제 필요 |

---

## ✅ Praise

- **`[Praise]`** `createOsPage` → `defineApp.page.ts` 통합이 backward-compatible하게 잘 구현됨. 38개 테스트 파일이 import 경로만 바꿔서 통과.
- **`[Praise]`** `followFocus` 초기 selection 동기화 로직을 정확히 재현하여 APG tab-state 테스트를 깨뜨리지 않음.
- **`[Praise]`** Registry 통합 후 90개 파일/986개 테스트 전부 통과. 정적 검증(tsc)도 0 에러.

---

## 요약

| 심각도 | 건수 | 즉시 수정 권장 |
|--------|------|----------------|
| 🔴 Blocker | 2 | **예** — `any` 타입 제거 |
| 🟡 Suggest | 4 | 다음 세션에 일괄 처리 가능 |
| 🔵 Thought/Nitpick | 2 | 선택 |
