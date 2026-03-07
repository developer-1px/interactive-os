# Infrastructure Inventory — 세션 간 인프라 망각 방지

> 작성일: 2026-03-07
> 태그: infra
> 우선순위: P1

## 문제 / 동기

**세션마다 기존 인프라를 잊고 처음부터 만들려 한다.**

- **증상**: "Write Once Run Anywhere TestScript 인프라가 없다"고 판단하고 새로 만들려 함 → 이미 완성되어 있었음 (`packages/os-devtool/src/testing/types.ts`, `scripts/apg/*.ts`, `tests/e2e/apg-testbot.spec.ts`)
- **발견 경위**: APG Suite 완료 표기 논의 중, e2e 브릿지가 "없다"고 발언 → 사용자가 교정 → grep으로 발견
- **근본 원인**: 코드베이스에 "무엇이 있는가"의 인덱스가 없다. grep은 known-unknown만 찾는다. unknown-unknown(존재 자체를 모르는 인프라)은 발견 불가.
- **빈도**: 반복적. MEMORY.md의 217줄 제한도 기여 요인 (상세 정보가 잘림).

## 현재 상태

- `.agent/knowledge/` — 도메인별 지식 파일 (testing-hazards.md, runbook.md 등). "어떻게 쓰는가"는 있지만 "무엇이 있는가" 인덱스는 없음
- `MEMORY.md` — 200줄 제한, 이미 초과. 새 인프라 추가 시 오래된 항목이 잘림
- `docs/STATUS.md` — 프로젝트 상태만 추적. 인프라 목록 아님

## 기대 상태

`.agent/knowledge/infrastructure-inventory.md` 파일이 존재하며:

1. **카테고리별 인프라 목록**: 테스팅, 빌드, DX, 앱 공통 패턴 등
2. **각 항목**: 이름 + 한 줄 설명 + 진입점 파일 경로 + 사용 예시 파일
3. **갱신 시점**: `/archive` 워크플로우에서 프로젝트 완료 시 자동 갱신 (새 인프라가 만들어졌으면 추가)

### 완료 조건

- [ ] `infrastructure-inventory.md` 생성 — 현재 코드베이스 전수 조사
- [ ] `/archive` 워크플로우에 갱신 단계 추가 (선택)
- [ ] MEMORY.md에서 상세 인프라 정보를 inventory로 이관 → MEMORY 200줄 내 유지

### 검증 방법

새 세션에서 "TestScript 인프라가 있나?"를 물었을 때, inventory 파일을 읽고 즉시 답할 수 있으면 성공.

## 접근 방향

### Phase 1: 현재 인프라 전수 조사

아래 카테고리별로 코드베이스를 탐색하여 인덱스를 작성한다:

| 카테고리 | 탐색 범위 | 예시 항목 |
|---------|----------|----------|
| **Testing** | `packages/os-devtool/src/testing/` | Page API, TestScript, runScenarios, createPlaywrightPage |
| **Build** | `vite.config.ts`, `packages/*/vite.config.ts` | Vite plugins, virtual modules |
| **DX** | `.agent/`, `.claude/`, `scripts/` | 워크플로우, 커맨드, hook |
| **App Patterns** | `packages/os-devtool/src/testing/scripts/` | APG scripts (28+), Todo scripts |
| **OS Primitives** | `packages/os-core/src/` | Zone, inputmap, Pipeline, roleRegistry |
| **React Bindings** | `packages/os-react/src/` | Item, Zone, Field, Trigger |

### Phase 2: 갱신 자동화

`/archive` 워크플로우 종료 직전에 체크리스트 추가:
- "이 프로젝트에서 새 인프라(공용 유틸, 패턴, 도구)가 만들어졌는가?"
- 있으면 → `infrastructure-inventory.md`에 추가

## 관련 항목

- MEMORY.md 200줄 초과 문제 (같은 근본 원인: 지식이 단일 파일에 과적)
- `.agent/knowledge/testing-tools.md` — 테스팅 도구 일부 문서화됨 (inventory와 중복 가능, 통합 검토)
