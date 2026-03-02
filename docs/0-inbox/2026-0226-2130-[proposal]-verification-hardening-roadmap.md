# 코드 검증 고도화 로드맵

| 항목 | 내용 |
|------|------|
| **원문** | 코드 검증든 lint를 어떻게 더 고도화 할지 제안서를 작성해봐 |
| **내(AI)가 추정한 의도** | 1. **경위**: 이전 제안서(2026-0226-2021)에서 부족 영역 11건을 식별했으나 "적용 시기 미정"으로 남겨둠. `code-hygiene` 프로젝트가 Active Focus로 진행 중. 2. **표면**: lint/검증 고도화의 구체적 실행 계획. 3. **의도**: "뭐가 부족한지"는 이미 알고 있으므로, **언제·어떻게·어떤 순서로** 적용할지의 로드맵을 원한다. |
| **날짜** | 2026-02-26 |
| **상태** | 로드맵 초안 |
| **선행 문서** | `docs/0-inbox/2026-0226-2021-[proposal]-verification-level-up.md` (부족 영역 11건 식별) |

> **3줄 요약**:
> 현재 검증 체인은 "도구는 있으나 게이트가 느슨하다" — pre-commit이 tsc만, ESLint/Biome/Coverage가 게이트 미연결.
> 4-Phase 로드맵: ① 게이트 조이기(1일) → ② 아키텍처 경계 린트(2~3일) → ③ CI/CD(1일) → ④ 고급 검증(선별적).
> Phase 1~3은 모두 Clear. 에이전트가 만드는 코드의 품질 하한선을 올리는 "가드레일 강화"가 핵심.

---

## 1. 현재 상태 (2026-02-26 재진단)

### 보유 도구 & 게이트 연결 현황

| 계층 | 도구 | Pre-commit | npm script | CI | 판정 |
|------|------|:----------:|:----------:|:--:|------|
| 타입 | TypeScript strict (모든 고급 옵션 ON) | ✅ `tsc -b` | `typecheck` | ❌ | 게이트 작동 |
| 린트 | ESLint flat + 커스텀 6규칙 | ❌ | `lint` | ❌ | **게이트 미연결** |
| 포맷/린트2 | Biome 400+ 규칙 (a11y 9규칙 포함) | ❌ | `lint:biome` | ❌ | **게이트 미연결** |
| 단위/통합 | Vitest jsdom | ❌ | `test` | ❌ | 수동 실행만 |
| 브라우저 | Vitest + Playwright | ❌ | `test:browser` | ❌ | 수동 실행만 |
| E2E | Playwright Chromium | ❌ | `test:e2e` | ❌ | 수동 실행만 |
| 커버리지 | @vitest/coverage-v8 | ❌ | ❌ (스크립트 없음) | ❌ | **설치만, 미사용** |
| Dead code | Knip | ❌ | ❌ (스크립트 없음) | ❌ | **설치만, 미사용** |
| 빌드 | Vite tsc+build | ❌ | `build` | ❌ | 수동 실행만 |
| 번들 | ❌ 없음 | — | — | — | **도구 없음** |

### 이전 제안서 대비 변화

| 항목 | 이전 (02-26 오전) | 현재 |
|------|------------------|------|
| Pre-commit | `\|\| true`로 무력화 | ✅ `tsc -b --noEmit` 작동 |
| TS 에러 | 미확인 | 185개 (226→199→185로 감소 중, `code-hygiene` 진행중) |
| lint-staged | 없음 | 설치됨, 설정 비어있음 (`"lint-staged": {}`) |

### 커스텀 ESLint 규칙 현황 (eslint-plugin-pipeline)

| 규칙 | 보호 대상 | 심각도 | 범위 |
|------|----------|--------|------|
| `no-pipeline-bypass` | resolve에서 commitAll/Registry 직접 호출 | error | 전역 |
| `no-direct-commit` | commitAll은 runPipeline에서만 | error | 전역 |
| `no-dom-in-commands` | 3-commands DOM 접근 | error | `3-commands/` |
| `no-full-state-useComputed` | `useComputed((s) => s)` 안티패턴 | error | 전역 |
| `no-handler-in-app` | 앱에서 네이티브 DOM 핸들러 | warn | `apps/` |
| `no-imperative-handler` | addEventListener 명령형 등록 | warn | `apps/` |

---

## 2. 4-Phase 로드맵

### Phase 1: 게이트 조이기 — "있는 도구를 제대로 쓰기"

> **목표**: Pre-commit에서 ESLint + Biome를 잡는다. 에이전트가 커밋할 때 기본적인 품질 게이트를 통과하게 한다.
> **Cynefin**: 🟢 Clear — lint-staged 설정만 추가하면 됨.
> **예상 소요**: 1일 이내

#### 1-1. lint-staged 활성화

현재 `"lint-staged": {}`가 비어있다. 채운다:

```jsonc
// package.json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix --max-warnings 0",
    "biome check --write"
  ],
  "*.css": [
    "biome format --write"
  ]
}
```

`.husky/pre-commit` 갱신:

```bash
npx tsc -b --noEmit
npx lint-staged
```

**효과**: 커밋 대상 파일에만 ESLint + Biome가 실행되어 빠르면서도 새 에러 유입을 차단.

#### 1-2. Knip 스크립트 연결

```jsonc
// package.json scripts
"knip": "knip",
"knip:ci": "knip --no-progress"
```

지금은 게이트에 연결하지 않고 수동 실행용. Phase 3(CI)에서 자동화.

#### 1-3. Coverage 스크립트 연결

```jsonc
// package.json scripts
"test:coverage": "vitest run --coverage"
```

커버리지 임계값은 아직 걸지 않는다. 먼저 현재 수치를 측정하고 기준선(baseline)을 잡은 뒤, Phase 3에서 게이트화.

---

### Phase 2: 아키텍처 경계 린트 — "OS 핵심 약속을 자동 증명"

> **목표**: OS 파이프라인 방향성 + 앱 격리를 린트로 강제한다. 에이전트가 역방향 import를 생성하면 즉시 에러.
> **Cynefin**: 🟢 Clear — 업계 표준 도구 존재.
> **예상 소요**: 2~3일
> **선행 제안서**: P1 (아키텍처 경계 강제)

#### 도구 선택: `eslint-plugin-boundaries`

| 기준 | `eslint-plugin-boundaries` | `dependency-cruiser` |
|------|:---:|:---:|
| 기존 ESLint 생태계 통합 | ✅ | ❌ 별도 CLI |
| Pre-commit/lint-staged 연동 | ✅ 자동 | 추가 설정 |
| 규칙 표현력 | 충분 | 더 높음 |
| 시각화 | ❌ | ✅ |
| 유지보수 부담 | 낮음 (설정 파일) | 중간 |

**제안**: `eslint-plugin-boundaries` 우선. 이유: ESLint 생태계 안에서 lint-staged → pre-commit까지 한 줄로 연결됨. `dependency-cruiser`는 CI 시각화용으로 나중에 보조 추가 가능.

#### 규칙 설계

```javascript
// eslint.config.js에 추가
{
  settings: {
    "boundaries/elements": [
      { type: "listeners",  pattern: "src/os/1-listen/**" },
      { type: "contexts",   pattern: "src/os/2-contexts/**" },
      { type: "commands",   pattern: "src/os/3-commands/**" },
      { type: "effects",    pattern: "src/os/4-effects/**" },
      { type: "hooks",      pattern: "src/os/5-hooks/**" },
      { type: "components", pattern: "src/os/6-components/**" },
      { type: "app-builder", pattern: "src/apps/builder/**" },
      { type: "app-todo",    pattern: "src/apps/todo/**" },
    ]
  },
  rules: {
    "boundaries/element-types": ["error", {
      default: "disallow",
      rules: [
        // OS 파이프라인: 숫자가 큰 쪽 → 작은 쪽만 허용
        { from: "components", allow: ["hooks", "commands", "contexts", "effects"] },
        { from: "hooks",      allow: ["commands", "contexts", "effects"] },
        { from: "effects",    allow: ["commands", "contexts"] },
        { from: "commands",   allow: ["contexts"] },
        { from: "contexts",   allow: [] },
        { from: "listeners",  allow: ["commands", "contexts"] },
        // 앱 격리: 앱↔앱 금지
        { from: "app-builder", allow: ["components","hooks","commands","contexts","effects","listeners"] },
        { from: "app-todo",    allow: ["components","hooks","commands","contexts","effects","listeners"] },
      ]
    }]
  }
}
```

**보호 범위**:
- ✅ `6-components → 3-commands` 역방향 import 차단
- ✅ `3-commands → 1-listen` 역방향 import 차단
- ✅ `apps/builder → apps/todo` 앱 간 import 차단
- ✅ `src/os/* → src/apps/*` OS→앱 import 차단

---

### Phase 3: CI/CD — "머지 전에 전체 검증"

> **목표**: GitHub Actions로 PR마다 전체 검증 체인 실행.
> **Cynefin**: 🟢 Clear — GitHub Actions 설정만.
> **예상 소요**: 1일
> **선행**: Phase 1 (lint-staged) 완료 후

#### 워크플로우 설계

```yaml
# .github/workflows/verify.yml
name: Verify
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile

      # Stage 1: 정적 분석 (빠름)
      - run: pnpm typecheck        # tsc
      - run: pnpm lint              # ESLint + boundaries
      - run: pnpm lint:biome        # Biome

      # Stage 2: 단위/통합 (중간)
      - run: pnpm test:coverage     # Vitest + coverage
      - run: pnpm knip:ci           # dead code

      # Stage 3: E2E (느림)
      - run: pnpm build             # Vite build
      - run: pnpm test:e2e          # Playwright
```

**실행 순서의 근거**: 빠른 피드백부터 (Working#6). tsc(30초) → ESLint(1분) → Vitest(2분) → E2E(5분). 앞 단계 실패 시 뒤는 실행하지 않아 러너 시간 절약.

---

### Phase 4: 고급 검증 — "선별적 도입"

> **Cynefin**: 🟡 Complicated — 각 항목의 ROI를 분석 후 결정.
> **선행**: Phase 1~3 완료 후

이 Phase의 항목은 이전 제안서(P2~P11)에서 상세 기술되어 있다. 우선순위가 높은 3건만 재정리:

#### 4-1. 크로스 브라우저 포커스 (이전 P3)

Playwright config에 Firefox, WebKit 추가. 설정 변경만으로 가능.

```typescript
projects: [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "firefox",  use: { ...devices["Desktop Firefox"] } },
  { name: "webkit",   use: { ...devices["Desktop Safari"] } },
]
```

**비용**: 설정 1줄, CI 시간 ×3. **효과**: Safari `button.focus()` 무시, Firefox `tabIndex` 차이를 자동 감지.

#### 4-2. axe-core 자동 접근성 (이전 P4)

E2E에 axe-core 통합. 페이지 렌더 후 ARIA 속성 누락 자동 탐지.

```typescript
import AxeBuilder from "@axe-core/playwright"
const results = await new AxeBuilder({ page }).analyze()
expect(results.violations).toEqual([])
```

**비용**: 의존성 1개, E2E에 3줄 추가. **효과**: ARIA 누락을 APG 수동 테스트 없이도 잡음.

#### 4-3. 속성 기반 테스트 (이전 P2)

`fast-check`으로 Config 불변식 검증. 진입점: `navigate(config, items, cursor)`의 "항상 유효한 item 반환" 불변식.

**비용**: 높음 (불변식 설계 필요). **효과**: 엣지 케이스 Config 조합의 안전성 자동 증명.

---

## 3. 요약: Phase별 비용-효과

| Phase | 무엇 | 비용 | 효과 | Cynefin |
|-------|------|------|------|---------|
| **1** | lint-staged + Knip/Coverage 스크립트 | 🟢 1일 | Pre-commit에서 ESLint+Biome 잡음 | Clear |
| **2** | eslint-plugin-boundaries | 🟡 2~3일 | OS 파이프라인 역방향 import 차단 | Clear |
| **3** | GitHub Actions CI | 🟢 1일 | PR마다 전체 체인 자동 실행 | Clear |
| **4-1** | 크로스 브라우저 | 🟢 설정만 | Safari/Firefox 포커스 차이 감지 | Clear |
| **4-2** | axe-core | 🟢 3줄 | ARIA 누락 자동 탐지 | Clear |
| **4-3** | fast-check PBT | 🔴 높음 | Config 불변식 자동 증명 | Complicated |

**Phase 1~3의 합계: 4~5일, 모두 Clear.** 이것만으로 검증 수준이 "도구 있음 + 수동 실행" → "커밋/PR마다 자동 강제"로 올라간다.

---

## 4. Cynefin 도메인 판정

🟡 **Complicated** — 로드맵 전체는 Complicated이지만, 개별 Phase는 대부분 Clear이다. Phase 4-3(속성 기반 테스트)만 Complicated. "뭘 할지"는 분석으로 좁혀졌고, "언제 할지"만 결정하면 된다.

---

## 5. 인식 한계

- ESLint 기존 에러 수(540→?)를 이 분석에서 실제 카운트하지 않았다. `code-hygiene` 프로젝트 진행에 따라 변동 중.
- `eslint-plugin-boundaries`의 실제 설정 복잡도를 경험하지 않았다. 공식 문서 기반 추정.
- GitHub Actions 러너 시간/비용을 산정하지 않았다. 오픈소스 프로젝트면 무료.
- Biome가 ESLint 규칙의 상당수를 커버하므로, 이중화 해소 후에는 Phase 1의 lint-staged 설정이 달라질 수 있다.

---

## 6. 열린 질문

1. Phase 2에서 `eslint-plugin-boundaries` vs `dependency-cruiser` — 위 비교표 기준으로 `eslint-plugin-boundaries`를 추천하지만, 시각화가 필요하면 `dependency-cruiser` 병행도 가능. 어느 쪽을 선호하는가?
2. Phase 1~3을 `code-hygiene` 프로젝트에 포함시킬 것인가, 별도 프로젝트로 분리할 것인가?
3. Biome vs ESLint 이중화: Phase 1에서 둘 다 lint-staged에 거는 것은 중간 단계이고, 장기적으로 하나로 수렴해야 한다. 어느 쪽을 드롭할 것인가?
4. CI 비용: GitHub Actions free tier(월 2,000분)로 충분한가, self-hosted runner를 고려하는가?
