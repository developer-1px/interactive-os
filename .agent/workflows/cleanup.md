---
description: Refine code, remove lazy comments, and verify lint/type integrity before committing.
---

1. **Lazy Comment Audit**:
    - Search for keys like `나중에`, `later`, `TODO`, `implementation omitted`, or any comments indicating incomplete tasks in the modified files.
    - Resolve these by implementing the missing logic or removing unnecessary markers.
2. **Type & Lint Purification**:
    - // turbo
    - Run `npx tsc --noEmit` to ensure type integrity.
    - // turbo
    - Run `npx biome check --write` to automatically fix formatting and linting issues.
3. **Unused & Orphan Cleanup**:
    - // turbo
    - Run `npx knip` to detect unused exports, unused dependencies, and orphan files.
    - Review the output and remove or re-export any genuinely unused items.
    - If a reported item is intentionally used (e.g. side-effect imports, global registrations), add it to `knip.json` ignoreExports or entry config.
4. **Build Verification**:
    - // turbo
    - Run `npm run build` to perform a final production-ready build check.
5. **Completion Report**:
    - Summarize the changes made.
    - Confirm that the code is now refined and ready for commit.
