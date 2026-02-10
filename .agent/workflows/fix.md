---
description: Automatically verify and fix build errors, type errors, and runtime errors using smoke tests.
---

// turbo-all
1. **Type Verification**:
    - Run `npx tsc --noEmit` to identify any TypeScript compilation errors.
    - If errors are found, fix them before proceeding.
2. **Build Verification**:
    - Run `npm run build` to ensure the overall project integrity.
    - If errors are found, fix them before proceeding.
3. **Smoke Test** (Runtime Verification):
    - Ensure the dev server is running. If not, start it in the background: `npm run dev`
    - Run `npx playwright test e2e/smoke.spec.ts` to verify all routes render without errors.
    - This checks: import errors, runtime exceptions, and blank screens across every route.
4. **Diagnostic Loop**:
    - If any smoke test fails, read the error output to identify the failing route and error.
    - Read the relevant source files and apply fixes.
    - Re-run `npx playwright test e2e/smoke.spec.ts` until all routes pass.
5. **Full E2E (Optional)**:
    - If smoke tests pass and you suspect deeper regressions, run `npx playwright test` for the full suite.
6. **Stability Report**:
    - Return a summary of found issues, applied fixes, and current system health.
