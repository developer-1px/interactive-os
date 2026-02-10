# Playwright Spec 컴포넌트 마운팅

## 1. 개요

Playwright `.spec.ts`를 **수정 없이**(Zero-Change) 브라우저에서 실행·시각화한다.
현재 모든 spec이 글로벌 등록되어 테스트 대상이 없는 페이지에서도 노출된다.
**Vite Plugin으로 spec 코드를 함수 래핑**하여 컴포넌트 lifecycle에 연동한다.

## 2. 핵심 문제

- `import "tabs.spec.ts"` → `test()` 가 **즉시 실행**(side-effect). 시점 제어 불가.
- `import()` 캐싱 → 언마운트 후 재마운트 시 side-effect 재실행 안 됨.
- 전역 registry → 어떤 테스트가 어떤 파일에서 왔는지 식별 불가.

## 3. 해결: Vite Plugin 함수 래핑

Vite `transform` 훅에서 `.spec.ts` 파일의 **import 문은 그대로 두고 나머지를 `export default function`으로 감싼다.**

```
원본:                          변환 결과:
import { test } from "…";     import { test } from "…";
test.describe("Tabs", …);     export default function() { test.describe("Tabs", …); }
```

- `import runSpec from "./tabs.spec.ts"` → **함수만 가져옴, side-effect 없음**
- `runSpec()` 호출 = 등록, 안 하면 = 미등록 → 컴포넌트 lifecycle로 제어 가능
- 재마운트 시 함수만 다시 호출하면 됨 (import 캐싱 무관)

**검증 완료**: 11개 spec 파일 전수 조사. 모두 `import 한 줄 + test.describe 한 블록` 패턴. 변환 안전.

## 4. 남은 구현 과제

1. **Vite Plugin 작성**: `.spec.ts` 파일 대상 `transform` 훅
2. **Context Tracking**: registry에 `sourceFile` 태깅 (플러그인이 `setLoadingContext()` 호출을 자동 삽입)
3. **중복 등록 방지**: `loaded` 플래그 또는 `sourceFile` 기반 중복 체크
4. **TypeScript 타입**: `*.spec.ts` 모듈의 `default export` 타입 선언 (`global.d.ts`)
5. **LLM 가이드**: `.agent/rules.md`에 `usePlaywrightSpec` 사용 패턴 추가
6. **글로벌 모드 유지**: `/playwright-runner`에서 전체 spec 실행 기능은 그대로 유지

## 5. 관련 파일

- `src/os/testBot/playwright/` — Polyfill
- `e2e/**/*.spec.ts` — Playwright spec (11개)
- `vite.config.ts` — 플러그인 추가 위치
