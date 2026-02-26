# 코드 검증 수준 강화 제안서

| 항목 | 내용 |
|------|------|
| **원문** | 다른 주제 우리 lint등 코드 검증을 하기 위한 수단으로써 어느 정도 수준인지 확인해봐 → 검증 수준을 더 높이고 싶어. 뭐가 부족한지를 알려줘 |
| **내(AI)가 추정한 의도** | 1. **경위**: 워크플로우 정리 중 `/verify` 게이트의 실효성에 의문 발생. 2. **표면**: 현재 lint/test/build 검증 도구의 수준 진단. 3. **의도**: 에이전트가 코드를 쓰는 환경에서, "도구가 못 잡는 영역"을 식별해 자동 검증 범위를 넓히고 싶다. |
| **날짜** | 2026-02-26 |
| **상태** | 제안서 완료. 적용 시기 미정. |

> **3줄 요약**:
> 도구는 충분하나 "없어서 못 잡는" 11개 영역이 존재한다.
> OS 핵심 약속(파이프라인 방향성, Config 불변식, 크로스 브라우저 포커스)을 자동 증명하지 못하는 3대 구멍이 치명적이다.
> 우선순위: 아키텍처 경계 린트 → 속성 기반 테스트 → 크로스 브라우저 → 나머지.

---

## 1. 개요

현재 검증 인프라를 전수 스캔한 결과:
- **보유 도구 12종** (TS strict, ESLint, Biome, Vitest, Playwright, 커스텀 플러그인 6규칙, Husky, Knip 등)
- **기존 약점 5건** (CI 없음, pre-commit 무력화, 린트 1100+ 에러, 17 테스트 실패, Biome/ESLint 이중화)
- **부족 영역 11건** (이 제안서의 핵심)

이 문서는 **부족 영역 11건**에 대한 제안서다. 기존 약점 수정은 별도 이슈로 다룬다.

---

## 2. 현재 검증 체인 현황

| 계층 | 도구 | 상태 |
|------|------|------|
| 타입 | TypeScript strict (모든 옵션 ON) | ✅ |
| 린트 | ESLint flat config + 커스텀 6규칙 | ✅ (에러 방치 별도) |
| 린트2 | Biome 400+ 규칙 | ⚠️ IDE용, 게이트 미연결 |
| 단위 | Vitest jsdom 1178개 | ✅ |
| E2E | Playwright Chromium 22 spec | ✅ |
| 커버리지 | @vitest/coverage-v8 | ⚠️ 설치만, 게이트 없음 |
| 빌드 | Vite tsc+build | ✅ |
| Dead code | Knip | ✅ 설정됨, 게이트 미연결 |

### 커스텀 ESLint 규칙 (eslint-plugin-pipeline)

| 규칙 | 보호 대상 |
|------|----------|
| `no-pipeline-bypass` | resolve에서 commitAll/Registry 직접 호출 차단 |
| `no-direct-commit` | commitAll은 runPipeline에서만 |
| `no-dom-in-commands` | 3-commands DOM 접근 차단 |
| `no-full-state-useComputed` | `useComputed((s) => s)` 안티패턴 |
| `no-handler-in-app` | 앱에서 네이티브 DOM 핸들러 차단 |
| `no-imperative-handler` | addEventListener 명령형 등록 차단 |

---

## 3. 부족 영역 11건 — 제안

### Tier 1: OS 핵심 약속을 증명하지 못하는 구멍 (3건)

#### P1. 아키텍처 경계 강제 ⭐ 최우선

**현상**: OS 파이프라인 `1-listeners → 2-contexts → 3-commands → 4-effects → 5-hooks → 6-components`의 방향성이 린트로 강제되지 않음. `no-dom-in-commands`가 3-commands만 보호.

**위험**: 에이전트가 역방향 import를 생성해도 잡히지 않음. 앱↔앱 간 import도 무방비.

**도구 선택지**:

| 도구 | 방식 | 장점 | 단점 |
|------|------|------|------|
| `eslint-plugin-boundaries` | ESLint 규칙으로 import 방향 강제 | 기존 ESLint 생태계 통합 | 설정이 복잡 |
| `dependency-cruiser` | 별도 CLI로 의존 그래프 검증 | 시각화 지원, 규칙 표현력 높음 | 별도 도구 |
| 커스텀 ESLint 규칙 확장 | `eslint-plugin-pipeline`에 추가 | 기존 플러그인 활용 | 유지보수 부담 |

**제안 규칙 예시**:
```
# OS 레이어 방향성 (숫자가 큰 쪽 → 작은 쪽만 허용)
6-components → 5-hooks ✅
6-components → 3-commands ❌ (역방향)
3-commands → 1-listeners ❌ (역방향)

# 앱 격리
apps/builder → apps/todo ❌
apps/todo → apps/builder ❌

# OS → 앱 금지
src/os/* → src/apps/* ❌
```

**Cynefin**: Clear — 업계 표준 도구 존재, 설정만 하면 됨.

---

#### P2. Config 불변식 검증 (속성 기반 테스트)

**현상**: OS는 "Config 선언 → 올바른 동작 보장"이 핵심 약속. 현재 테스트는 특정 Config 조합만 검증. Config 공간 전체에 대한 불변식 검증 없음.

**위험**: 엣지 케이스 Config 조합에서 무한루프, null 참조, 잘못된 포커스 이동이 발생할 수 있음.

**도구**: `fast-check` (Property-Based Testing)

**검증 가능한 불변식 예시**:

| 불변식 | 의미 |
|--------|------|
| `navigate(config, items, cursor)` → 항상 유효한 item 반환 | 어떤 Config에서든 navigate가 범위 밖을 가리키지 않음 |
| `loop: true + 아이템 1개` → 자기 자신 반환 (무한루프 X) | 엣지 케이스 안전성 |
| `Escape` → 항상 부모 Zone 또는 null | 탈출이 항상 가능 |
| `Tab` → 항상 다음 Zone 또는 body | Zone 간 이동이 끊기지 않음 |
| `resolveItemFallback(items, deletedId)` → 항상 유효한 item 또는 null | 삭제 후 포커스 복구 안전성 |

**Cynefin**: Complicated — 어떤 불변식을 검증할지 분석 필요.

---

#### P3. 크로스 브라우저 포커스 테스트

**현상**: Playwright Chromium만 사용. focus 블랙홀 전략(`tabIndex=-1` + `element.focus()`)이 Safari/Firefox에서 다르게 동작할 수 있음.

**위험**: Safari는 `button.focus()`를 무시하는 경우가 있음 (macOS 시스템 설정 의존). Firefox의 `tabIndex` 처리도 미묘하게 다름.

**제안**: Playwright config에 `webkit`, `firefox` 프로젝트 추가.

```typescript
projects: [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  { name: "webkit", use: { ...devices["Desktop Safari"] } },
]
```

**Cynefin**: Clear — Playwright 설정 추가만으로 가능.

---

### Tier 2: 검증 품질을 높이는 영역 (4건)

#### P4. 자동 접근성 스캔 (axe-core)

E2E 테스트에 axe-core 통합. APG 수동 테스트와 별도로, ARIA 속성 누락/잘못된 role 자동 탐지.

```typescript
// Playwright E2E에 추가
import AxeBuilder from "@axe-core/playwright"
const results = await new AxeBuilder({ page }).analyze()
expect(results.violations).toEqual([])
```

**Cynefin**: Clear.

---

#### P5. 타입 수준 테스트 (expect-type / tsd)

"Make Illegal States Unrepresentable" 원칙의 자동 검증. 타입이 잘못된 상태를 거부하는지 테스트.

```typescript
import { expectTypeOf } from "expect-type"

// Config에 잘못된 orientation 넣으면 타입 에러
expectTypeOf<FocusGroupConfig>().toBeCallableWith({ orientation: "diagonal" }) // should fail
```

**Cynefin**: Complicated — 어떤 타입 경계를 테스트할지 설계 필요.

---

#### P6. 뮤테이션 테스트 (Stryker)

현재 테스트가 실제로 버그를 잡는지 검증. 코드를 의도적으로 변이시켜 테스트가 실패하는지 확인.

**Cynefin**: Complicated — 전체 코드베이스는 비용 과다, 핵심 모듈(3-commands, collection)에 선별 적용.

---

#### P7. 번들 분석 + 순환 의존 탐지

- `vite-bundle-visualizer`로 번들 사이즈 추적
- `madge` 또는 `dependency-cruiser`로 순환 의존 탐지
- 빌드 시 사이즈 예산 초과 경고

**Cynefin**: Clear.

---

### Tier 3: 인프라/운영 영역 (4건)

#### P8. 런타임 dev-mode assertion

OS 불변식을 런타임에서 dev 모드로 경고. React의 `__DEV__` 패턴.

```typescript
if (__DEV__) {
  if (isDispatching) throw new Error("OS: dispatch 중 dispatch 금지")
}
```

**Cynefin**: Complicated.

---

#### P9. 문서-코드 동기 검증

`docs/official/` 문서가 참조하는 파일/함수가 실제 존재하는지 자동 확인. 깨진 링크 탐지.

**Cynefin**: Clear — glob + grep 스크립트로 구현 가능.

---

#### P10. 의존성 보안/라이선스 감사

`pnpm audit` 자동화. Renovate 또는 Dependabot으로 의존성 갱신 자동화.

**Cynefin**: Clear.

---

#### P11. 시각 회귀 테스트

Playwright `toHaveScreenshot()`으로 주요 화면의 스크린샷 비교. UI 깨짐 자동 감지.

**Cynefin**: Complicated — 어떤 화면을 기준으로 잡을지 설계 필요.

---

## 4. 우선순위 매트릭스

| 순위 | 제안 | 영향도 | 난이도 | Cynefin |
|------|------|--------|--------|---------|
| **1** | P1. 아키텍처 경계 린트 | 🔴 높음 (에이전트 가드레일) | 🟡 중간 | Clear |
| **2** | P3. 크로스 브라우저 | 🔴 높음 (OS 핵심 약속) | 🟢 낮음 | Clear |
| **3** | P4. axe-core 자동 a11y | 🟡 중간 (접근성 보장) | 🟢 낮음 | Clear |
| **4** | P2. 속성 기반 테스트 | 🔴 높음 (Config 불변식) | 🔴 높음 | Complicated |
| **5** | P7. 번들/순환 의존 | 🟡 중간 | 🟢 낮음 | Clear |
| **6** | P5. 타입 수준 테스트 | 🟡 중간 | 🟡 중간 | Complicated |
| **7** | P9. 문서-코드 동기 | 🟡 중간 | 🟢 낮음 | Clear |
| **8** | P10. 의존성 감사 | 🟡 중간 | 🟢 낮음 | Clear |
| **9** | P8. 런타임 assertion | 🟡 중간 | 🟡 중간 | Complicated |
| **10** | P11. 시각 회귀 | 🟢 낮음 | 🟡 중간 | Complicated |
| **11** | P6. 뮤테이션 테스트 | 🟢 낮음 | 🔴 높음 | Complicated |

---

## 5. Cynefin 도메인 판정

🟡 **Complicated** — 부족 영역은 식별 완료. 각 영역의 도구 선택과 적용 순서는 분석으로 결정 가능. "정답이 없다"가 아니라 "분석하면 좁혀진다" 영역.

---

## 6. 인식 한계

- 린트 에러 1100+건의 구성(어떤 규칙 위반이 많은지)을 분류하지 않았다. 대부분이 특정 규칙 1~2개라면 일괄 수정 가능.
- Safari/Firefox에서의 실제 focus 동작 차이를 코드로 검증하지 않았다. "다를 수 있다"는 문헌 기반 추정.
- `fast-check` 적용 시 OS 순수함수 경계가 테스트하기 적합한 형태인지 확인하지 않았다.
- CI/CD 구축 비용(GitHub Actions 설정, 러너 시간)을 산정하지 않았다.

---

## 7. 열린 질문

1. P1(아키텍처 경계)에서 `eslint-plugin-boundaries` vs `dependency-cruiser` 중 어느 도구를 선호하는가?
2. P2(속성 기반 테스트)의 대상 순수함수를 어디부터 시작할 것인가? (navigate? resolve? focusStack?)
3. CI/CD는 이 제안서 범위에 포함하는가, 별도 프로젝트로 분리하는가?
4. Biome vs ESLint 이중화 해소 방향은? (하나를 드롭? 역할 분리 유지?)
