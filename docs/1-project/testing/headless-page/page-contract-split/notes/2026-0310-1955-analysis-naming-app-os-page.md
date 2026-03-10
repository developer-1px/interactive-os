# /naming Analysis: app, os, page 설계 확인

> 날짜: 2026-03-10
> 범위: `packages/os-devtool/src/testing/page.ts`, `packages/os-sdk/src/app/`, `domain-glossary.md`
> 목적: 1경계(page) 파라다임 확정 후 app, os, page 식별자 설계 일관성 점검 및 잔재 청산

## 1. 수집된 식별자 분해

| 식별자 | 분해 |
|---|---|
| `createPage` | `create` + `Page` |
| `createAppPage` | `create` + `App` + `Page` |
| `AppPage` | `App` + `Page` |
| `AppPageInternal` | `App` + `Page` + `Internal` |
| `defineApp` | `define` + `App` |
| `AppHandle` | `App` + `Handle` |
| `os` | `os` |

## 2. Key Pool 분류

| Category | Key | Meaning | Appears In |
|----------|-----|---------|------------|
| Noun | `Page` | Playwright 동형의 테스트 관찰/동작 객체 (행동+관찰) | `createPage`, `Page` |
| Noun | `App` | 컴포넌트, Zone, Command가 결합된 정의체계 (Fixture용) | `defineApp`, `AppHandle` |
| Noun | `os` | 상태 머신 커널 (시스템 내부 상세) | `os` |
| Verb | `create` | 시스템 위에 Runtime 인터페이스를 초기화함 | `createPage`, `createAppPage` |
| Verb | `define` | 정적(추상) 명세를 등록함 | `defineApp` |
| Suffix | `Internal` | 테스트 코드에 노출되지 않아야 할 타입 | `AppPageInternal` |
| Suffix | `Handle` | 외부에서 조작하기 위해 제공하는 API 포인터 | `AppHandle` |

## 3. 이상 패턴 리포트 및 아키텍처 점검

### 🚨 3.1 동의어/안티패턴 충돌: `AppPage` vs `Page`
현재 `domain-glossary.md`에는 `AppPage`와 `AppPageInternal`이 Playwright 동형을 깨트리는 **⛔ 금지된 안티패턴**으로 등재되어 있습니다.
하지만 소스 상(`packages/os-sdk/src/app/defineApp/types.ts` 등)에는 여전히 구형 식별자 구조가 남아있습니다.
- **`createAppPage`**
- **`AppPage`**
- **`AppPageInternal`**

`AppPage`는 app(Dispatch 계층)과 page(Playwright 시뮬레이션 계층)라는 전혀 다른 두 경계의 용어가 혼합된 키메라 식별자입니다. 

### 🚨 3.2 Boundary 의미 과적 (1경계 원칙 준수 여부)
- **`os`**: `os`는 패키지 내부(인프라) 구동체로, 테스트 시나리오에는 절대 노출(import)되어서는 안 됩니다. (조치 완료)
- **`app` (`AppHandle`)**: 테스트의 **Fixture 준비 단계(Arrange)** 에서만 사용되어야 합니다. 시나리오 내에서 `app.dispatch()`를 부르면 동형이 파괴됩니다.
- **`page` (`Page`)**: **테스트 시나리오의 유일한 액터**여야 합니다. 

## 4. 확정 및 권고 (Action Items)

**조치 목표:** 아키텍처 원칙(1경계)을 타입 구조와 완전히 동기화.

1. `AppPage`, `AppPageInternal`, `createAppPage`를 소스 코드 및 SDK 노출 경로에서 완전히 **삭제(제거)**.
2. 모두 순수 Playwright 동형 타입인 **`Page`** 와 팩토리 **`createPage`** 로 식별자를 단일화해야 합니다.
3. 이를 통해 설계와 코드베이스 간의 `Truth Gap`을 메울 수 있습니다.
