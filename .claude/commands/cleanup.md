---
description: 코드 정리, lazy 주석 제거, dead code 제거 후 /verify로 안정성 확인한다.
---


## /cleanup — 코드 정리

> **분류**: `/verify`를 호출하여 기계적 검증을 위임한다.

### 절차

1. **Lazy Comment Audit**
    - Search for keys like `나중에`, `later`, `TODO`, `implementation omitted`, or any comments indicating incomplete tasks in the modified files.
    - Resolve these by implementing the missing logic or removing unnecessary markers.

2. **Unused & Orphan Cleanup**
    - Run `npx knip` to detect unused exports, unused dependencies, and orphan files.
    - Review the output and remove or re-export any genuinely unused items.
    - If a reported item is intentionally used (e.g. side-effect imports, global registrations), add it to `knip.json` ignoreExports or entry config.

3. **의미적 자가 점검**
    - 변경된 파일 주변을 스스로 검토한다:
      - "이 추상화가 아직 가치를 만드는가?"
      - "이 모듈이 중복은 아닌가?"
    - 제거/축소 가능한 것이 있으면 직접 수행한다.

4. **`/verify` 호출**
    - 정리 완료 후 `/verify`를 실행하여 tsc, lint, unit, build 안정성을 확인한다.

5. **Completion Report**
    - Summarize the changes made.
    - Confirm that the code is now refined and ready for commit.
