---
description: Automatically verify and fix runtime errors by inspecting the browser and logs.
---

// turbo-all
1. **Type & Build Verification**:
    - Run `npx tsc --noEmit` to identify any TypeScript compilation errors.
    - Run `npm run build` to ensure the overall project integrity.
    - If errors occur in these steps, fix them before proceeding to runtime analysis.
2. **Environment Ready**: Ensure the development server is active. If not, start it in the background using `npm run dev`.
3. **Browser Audit**: Open a browser subagent and navigate to the application URL (e.g. `http://localhost:5173` or `http://localhost:5174`).
4. **Audit Runtime Errors**: 
    - Check the browser console for `Uncaught Error`, `Maximum update depth exceeded`, or any `RED` log entries.
    - Capture a screenshot to verify if the "First Screen" (the Atomic Option Todo UI) correctly appears.
5. **Diagnostic Loop**:
    - If errors are found, read the specific source files identified in the stack trace.
    - Apply required fixes to eliminate infinite loops, missing properties, or syntax errors.
    - Refresh the page and re-run the audit until the console is clean and the UI is rendered.
6. **Stability Report**:
    - Return a summary of the found issues, the applied fixes, and a confirmation of the current system health.
