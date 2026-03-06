# Interactive OS

> **첫 번째 행동**: `.agent/rules.md`를 읽는다. 그것이 이 프로젝트의 헌법이다.
> 모든 작업은 rules.md를 읽은 뒤에 시작한다.

## 커밋 규칙

코드를 수정하면 반드시 커밋한다. 사용자의 요청을 기다리지 않는다.
- 하나의 논리적 변경 단위마다 커밋한다.
- pre-commit hook(husky)이 lint + tsc + vitest를 자동 실행한다. 통과해야 커밋이 완료된다.
- hook을 스킵(`--no-verify`)하지 않는다.
