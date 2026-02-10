---
description: Automatically verify and fix build errors, type errors, and runtime errors using smoke tests.
---

// turbo-all
1. **Smoke Test** (Runtime Verification — 최우선):
    - Ensure the dev server is running. If not, start it in the background: `npm run dev`
    - Run `npx playwright test e2e/smoke.spec.ts` to verify all routes render without errors.
    - This checks: import errors, runtime exceptions, and blank screens across every route.
    - If any smoke test fails, read the error context files to identify the root cause, fix it, and re-run until all pass.
2. **Type Verification**:
    - Run `npx tsc --noEmit` to identify any TypeScript compilation errors.
    - If errors are found, fix them before proceeding.
3. **Build Verification**:
    - Run `npm run build` to ensure the overall project integrity.
    - If errors are found, fix them before proceeding.
4. **Full E2E (Optional)**:
    - If smoke tests pass and you suspect deeper regressions, run `npx playwright test` for the full suite.
5. **Stability Report**:
    - Return a summary of found issues, applied fixes, and current system health.
