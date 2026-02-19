---
description: 코드 정리, lazy 주석 제거, lint/타입 무결성 확인 후 커밋 준비한다.
---

// turbo-all

## /cleanup — 코드 정리

> **분류**: 리프. 다른 워크플로우를 호출하지 않는다.

### 절차

1. **Lazy Comment Audit**
    - Search for keys like `나중에`, `later`, `TODO`, `implementation omitted`, or any comments indicating incomplete tasks in the modified files.
    - Resolve these by implementing the missing logic or removing unnecessary markers.

2. **Type & Lint Purification**
    - // turbo
    - Run `npx tsc --noEmit` to ensure type integrity.
    - // turbo
    - Run `npx biome check --write` to automatically fix formatting and linting issues.

3. **Unused & Orphan Cleanup**
    - // turbo
    - Run `npx knip` to detect unused exports, unused dependencies, and orphan files.
    - Review the output and remove or re-export any genuinely unused items.
    - If a reported item is intentionally used (e.g. side-effect imports, global registrations), add it to `knip.json` ignoreExports or entry config.

4. **의미적 자가 점검**
    - 변경된 파일 주변을 스스로 검토한다:
      - "이 추상화가 아직 가치를 만드는가?"
      - "이 모듈이 중복은 아닌가?"
    - 제거/축소 가능한 것이 있으면 직접 수행한다.

5. **Completion Report**
    - Summarize the changes made.
    - Confirm that the code is now refined and ready for commit.
