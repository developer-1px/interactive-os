# kernel-docs-sync

> 커널 문서-코드 간극 6건 해소. 문서만 수정, 코드 변경 없음.

## Objective

커널 공식 문서(`docs/2-area/official/kernel/`)와 실제 코드(`packages/kernel/src/`)의 간극을 해소하여, LLM이 정확한 코드를 생성할 수 있도록 한다.

## Problem Frame

| | 내용 |
|---|------|
| **Objective** | 커널 문서 6개 간극(G1-G6) 해소 |
| **Constraints** | 코드 변경 없음 / 기존 문서 수정 / 동결 문서(glossary)도 간극 수정 허용 |
| **Variables** | G1(Query)은 기존 문서에 분산 추가 / G4(inspector-api)는 현행화 수정 |

## Backward Chain

| Depth | Subgoal | 판정 | Evidence |
|-------|---------|------|----------|
| 0 | 커널 문서-코드 동기화 | -- | 6개 간극 식별 |
| 1 | G1: Query API 문서화 | -- | 11개 문서에서 0회 언급. 코드: `createKernel.ts:161` defineQuery, `:183` resolveQuery, `tokens.ts:39` QueryToken, `createReactBindings.ts:69` useQuery |
| 1 | G2: Preview API 문서화 | -- | `03-api-reference.md` Kernel 반환 타입에 없음. 코드: `createKernel.ts:823-835` |
| 1 | G3: 소스 구조 갱신 | -- | `00-overview.md:90` "~740 lines" vs 실제 847줄, 5파일 vs 실제 8파일 |
| 1 | G4: inspector-api.md 수정 | -- | `registerMiddleware` → `use`, `createGroup` → `group`, 723줄 → 847줄, Port 구조 변경 |
| 1 | G5: MW 파이프라인 순서 수정 | -- | `06-middleware.md:62-68` inject 인터셉터 before/after 단계가 코드에 없음 |
| 1 | G6: useComputed 위치 명확화 | -- | `03-api-reference.md:43` Kernel 반환에 포함 vs 실제 `createReactBindings` 별도 |

## Work Packages

| WP | Subgoal | Chain | 대상 파일 |
|----|---------|-------|----------|
| 1 | G1: Query 프리미티브 전 문서 추가 | Goal <- G1 | `02-core-concepts.md`, `03-api-reference.md`, `05-type-system.md`, `09-glossary.md` |
| 2 | G4: inspector-api.md 전면 수정 | Goal <- G4 | `inspector-api.md` |
| 3 | G2+G3+G5+G6: 소규모 간극 일괄 수정 | Goal <- G2,G3,G5,G6 | `00-overview.md`, `03-api-reference.md`, `06-middleware.md` |

## WP Detail

### WP1: Query 프리미티브 문서화
- `02-core-concepts.md`: "7가지 핵심 개념" → 8가지. Query 섹션 추가 (defineQuery, resolveQuery, invalidateOn, 캐싱)
- `03-api-reference.md`: defineQuery, resolveQuery API 시그니처 + useQuery hook
- `05-type-system.md`: "4가지 토큰" → 5가지. QueryToken 섹션 추가
- `09-glossary.md`: Query, QueryToken 용어 추가

### WP2: inspector-api.md 현행화
- `registerMiddleware(mw)` → `use(mw)` (Group API)
- `createGroup(scope, tokens)` → `group(config)` (Group API)
- `723줄` → `847줄`
- Port 인터페이스: `getRegistry()` 직접 반환 → 개별 메서드 (getCommandTypes, getEffectTypes 등)
- Inspector vs Port 구분 명확화

### WP3: 소규모 간극 일괄
- `00-overview.md`: 파일 목록에 `shallow.ts`, `createReactBindings.ts` 추가. `~740` → `~850`. 파일 수 정정
- `03-api-reference.md`: Preview API (enterPreview, exitPreview, isPreviewing) 섹션 추가. useComputed가 createReactBindings 소속임을 명시
- `06-middleware.md`: 파이프라인 순서에서 "커맨드별 inject 인터셉터" 단계 제거. inject는 processCommand 내부 직접 주입으로 정정

## Status

| WP | Status |
|----|--------|
| 1 | Done |
| 2 | Done |
| 3 | Done |

## Completed

- [x] WP1: Query 프리미티브 문서화 — 02, 03, 05, 09 네 파일에 Query/QueryToken 섹션 추가
- [x] WP2: inspector-api.md 전면 현행화 — Port/Inspector 분리, API명 정정, 줄 수/파일 목록 갱신
- [x] WP3: 소규모 간극 일괄 — 00(소스 구조), 03(Preview+useComputed+useQuery), 06(MW 파이프라인 순서)
