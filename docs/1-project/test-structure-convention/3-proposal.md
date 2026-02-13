# Proposal: Test Structure Convention

## 개요

"폴더구조=멘탈구조", "Agent시대 편의보다 명시적" 원칙에 따라, 흩어진 테스트 파일을 `{slice}/tests/{unit,testbot,e2e}/` 구조로 마이그레이션하고, `/playground/tests` 대시보드를 구축한다.

## 실행 순서

> **Phase A: 마이그레이션** → **Phase B: Config 수정** → **Phase C: 대시보드**

---

## Phase A: 파일 이동

### A1. Unit 테스트 (`*.test.ts`) → `tests/unit/`

```bash
# todo
mkdir -p src/apps/todo/tests/unit
mv src/apps/todo/tests/todo.test.ts src/apps/todo/tests/unit/
mv src/apps/todo/tests/todo.v3.test.ts src/apps/todo/tests/unit/

# builder
mkdir -p src/apps/builder/tests/unit
mv src/apps/builder/tests/builder.test.ts src/apps/builder/tests/unit/

# os-commands
mkdir -p src/os/3-commands/tests/unit
mv src/os/3-commands/os-commands.test.ts src/os/3-commands/tests/unit/
mv src/os/3-commands/utils/resolveFocusId.test.ts src/os/3-commands/tests/unit/

# os-contexts
mkdir -p src/os/2-contexts/tests/unit
mv src/os/2-contexts/zoneRegistry.test.ts src/os/2-contexts/tests/unit/

# keymaps
mkdir -p src/os/keymaps/tests/unit
mv src/os/keymaps/keybindings.test.ts src/os/keymaps/tests/unit/

# command-palette
mkdir -p src/command-palette/tests/unit
mv src/command-palette/command-palette.test.ts src/command-palette/tests/unit/
mv src/command-palette/fuzzyMatch.test.ts src/command-palette/tests/unit/

# docs-viewer
mkdir -p src/docs-viewer/tests/unit
mv src/docs-viewer/docs-scroll.test.ts src/docs-viewer/tests/unit/

# inspector
mkdir -p src/inspector/tests/unit
mv src/inspector/panels/inferPipeline.test.ts src/inspector/tests/unit/
```

### A2. E2E 테스트 (`*.spec.ts`) → `tests/e2e/`

```bash
# todo
mkdir -p src/apps/todo/tests/e2e
mv e2e/todo/todo.spec.ts src/apps/todo/tests/e2e/

# builder
mkdir -p src/apps/builder/tests/e2e
mv e2e/builder/builder-spatial.spec.ts src/apps/builder/tests/e2e/

# aria-showcase
mkdir -p src/pages/aria-showcase/tests/e2e
mv e2e/aria-showcase/*.spec.ts src/pages/aria-showcase/tests/e2e/

# command-palette
mkdir -p src/command-palette/tests/e2e
mv e2e/command-palette/command-palette.spec.ts src/command-palette/tests/e2e/

# focus-showcase
mkdir -p src/pages/focus-showcase/tests/e2e
mv e2e/focus-showcase/focus-showcase.spec.ts src/pages/focus-showcase/tests/e2e/

# playground
mkdir -p src/pages/playground/tests/e2e
mv e2e/playground/dialog.spec.ts src/pages/playground/tests/e2e/

# smoke (전역)
mkdir -p src/tests/e2e
mv e2e/smoke.spec.ts src/tests/e2e/
```

### A3. 빈 e2e/ 디렉토리 정리
```bash
rm -rf e2e/  # 모든 spec이 이동된 후 빈 디렉토리 삭제
```

---

## Phase B: Config 수정

### B1. `vitest.config.ts`
```diff
 test: {
-  include: ["src/**/*.test.ts"],
+  include: ["src/**/tests/unit/**/*.test.ts"],
   environment: "jsdom",
   globals: true,
 },
```

### B2. `playwright.config.ts`
```diff
-testDir: "./e2e",
+testDir: "./src",
+testMatch: "**/tests/e2e/**/*.spec.ts",
```

### B3. import 경로 수정
- 이동된 파일의 relative import가 깨진 경우 수정
- 주로 `os-commands.test.ts` (원래 `src/os/3-commands/`에서 `src/os/3-commands/tests/unit/`로 이동)

---

## Phase C: 대시보드 (1차 — 정적 discovery)

### C1. Discovery 유틸
- `src/**/tests/{unit,testbot,e2e}/` glob으로 테스트 파일 목록 수집
- Vite의 `import.meta.glob`으로 빌드타임 discovery

### C2. `/playground/tests` 페이지
- 프로젝트별 그룹화 (디렉토리 경로에서 추출)
- 레이어별 카운트 표시
- 건강도 아이콘 (unit/testbot/e2e 커버리지)

---

## 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| import 경로 깨짐 | Vitest/Playwright 실패 | 이동 후 즉시 `tsc --noEmit` + `vitest run` 확인 |
| Playwright testMatch 패턴 누락 | E2E 테스트 누락 | 이동 전후 `find` 카운트 비교 |
| CI 파이프라인 경로 하드코딩 | CI 실패 | CI config 업데이트 포함 |

---

## 검증 계획

### 자동 검증
```bash
# 1. 타입 체크
npx tsc --noEmit

# 2. Vitest 전체 실행
npx vitest run

# 3. Playwright 전체 실행 (dev 서버 필요)
npx playwright test

# 4. 파일 카운트 검증
echo "Unit tests:" && find src -path "*/tests/unit/*.test.ts" | wc -l
echo "E2E tests:" && find src -path "*/tests/e2e/*.spec.ts" | wc -l
echo "Stray tests:" && find src -name "*.test.ts" -not -path "*/tests/*" | wc -l
```

### 수동 검증
- `/playground/tests` 페이지 접속하여 프로젝트 그룹 확인
