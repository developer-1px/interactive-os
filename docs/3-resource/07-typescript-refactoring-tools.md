---
last-reviewed: 2026-02-10
---

# TypeScript 리팩토링 자동화 도구 — 파일 이동과 Import 갱신

> sed/grep 수작업 대신 AST 기반으로 파일을 이동하고 import를 자동 갱신하는 도구들의 비교와 한계.

## 왜 이 주제인가

2026-02-10 리팩토링에서 `os/testBot/` → `inspector/testbot/`, `os/app/debug/` → `inspector/shell/` 이동 시 import 경로 누락으로 전 라우트가 크래시했다. sed/grep으로 수동 갱신하다 CSS 동반 파일, Vite 플러그인 내 하드코딩 경로를 놓친 것이 원인. "도구가 있으면 이런 실수를 방지할 수 있지 않나?"라는 질문에서 출발.

## Background / Context

JavaScript/TypeScript 생태계에서 파일 이동은 단순한 `mv` 명령이 아니다:

1. **상대 경로 import** — 이동한 파일 내부의 `import "./foo"` 경로가 바뀜
2. **역참조** — 다른 파일에서 이동한 파일을 import하는 경로도 바뀜
3. **alias 경로** — `@os/app/debug/Kbd` 같은 tsconfig paths 기반 import
4. **비-TS 자산** — CSS, SVG, JSON 등 동반 파일
5. **인프라 설정** — `vite.config.ts`, `vite-plugins/`, `playwright.config.ts` 내 하드코딩 경로

기존 도구들은 1~3번은 잘 처리하지만, **4~5번이 사각지대**다.

## Core Concept: 도구별 비교

### 1. ts-morph — AST 기반 정밀 조작

TypeScript Compiler API의 래퍼. 파일/디렉토리 이동 시 import/export 선언을 자동 갱신.

```typescript
import { Project } from "ts-morph";

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

// 파일 이동 — import 자동 갱신
const file = project.getSourceFileOrThrow("src/os/app/debug/components/Kbd.tsx");
file.moveToDirectory("src/inspector/shell/components/");

// 디렉토리 통째로 이동 — 비-TS 파일 포함 옵션
const dir = project.getDirectoryOrThrow("src/os/testBot/");
dir.move("src/inspector/testbot/", { includeUntrackedFiles: true });

await project.save(); // 메모리 → 파일시스템 반영
```

| 장점 | 한계 |
|------|------|
| TS/JS import 100% 자동 갱신 | **CSS import는 갱신 안 됨** (TS AST 범위 밖) |
| tsconfig paths alias 인식 | Vite 플러그인/config 내 문자열 경로 모름 |
| `directory.move({ includeUntrackedFiles: true })`로 CSS/SVG 함께 이동 가능 | 대규모 프로젝트에서 느림 |
| in-memory → save 패턴으로 안전 | 설치 필요 (`npm i -D ts-morph`) |

**결론**: TS import 갱신에는 최고. 하지만 CSS import와 인프라 설정은 별도로 처리해야 함.

### 2. ts-mover — 선언적 대량 이동

이동할 파일 목록을 텍스트 파일로 정의하고 한번에 실행.

```
# moves.txt
src/os/testBot/ -> src/inspector/testbot/
src/os/app/debug/components/Kbd.tsx -> src/inspector/shell/components/Kbd.tsx
```

```bash
npx ts-mover --moves moves.txt
```

| 장점 | 한계 |
|------|------|
| 대규모 구조 변경에 적합 | 덜 성숙한 프로젝트 |
| 선언적 — 리뷰 가능 | CSS 동반 파일 자동 처리 불확실 |

### 3. VS Code 내장 기능

파일 탐색기에서 드래그하면 `typescript.updateImportsOnFileMove.enabled: "always"` 설정으로 자동 갱신.

| 장점 | 한계 |
|------|------|
| 설치 불필요 | **CLI/스크립트에서 사용 불가** (IDE 전용) |
| 직관적 | 대량 이동 시 비효율적 |
| tsconfig paths 인식 | CSS import, config 파일 갱신 안 됨 |

**에이전트(AI)가 리팩토링할 때는 사용 불가** — 에이전트는 터미널에서 작업하므로.

### 4. jscodeshift — 코드 변환 프레임워크

import를 찾아서 바꾸는 "codemod" 스크립트를 작성. 이동 자체는 안 해줌.

```javascript
// 모든 파일에서 @os/app/debug → @inspector/shell 로 치환
export default function transformer(file, api) {
  const j = api.jscodeshift;
  return j(file.source)
    .find(j.ImportDeclaration)
    .filter(p => p.value.source.value.includes("@os/app/debug"))
    .forEach(p => {
      p.value.source.value = p.value.source.value
        .replace("@os/app/debug", "@inspector/shell");
    })
    .toSource();
}
```

| 장점 | 한계 |
|------|------|
| 복잡한 변환 로직 가능 | **파일 이동은 별도** |
| Facebook 검증 (React 16→17 마이그레이션 등) | 러닝 커브 높음 |
| CSS import 문자열도 조작 가능 | 매번 스크립트 작성 필요 |

### 5. knip — 죽은 코드 탐지 (보완 도구)

리팩토링 후 사용되지 않는 export, 파일, 의존성을 찾아내는 정적 분석 도구.

```bash
npx knip
# unused files, exports, dependencies 보고
```

| 장점 | 한계 |
|------|------|
| 이동 후 "놓친 참조" 발견 | import 갱신 자체는 안 함 |
| zero-config | CSS/Vite 플러그인 범위 밖 |
| Vite 플러그인 지원 | |

## Best Practice + Anti-Pattern

### ✅ 해야 할 것

1. **`ts-morph`의 `directory.move({ includeUntrackedFiles: true })` 사용** — CSS, SVG 등 동반 자산도 함께 이동
2. **이동 후 `grep -rn "옛 경로"` 실행** — ts-morph이 못 잡는 문자열 경로 (Vite 플러그인, config) 찾기
3. **이동 후 `npx knip` 실행** — 죽은 export/파일 탐지
4. **이동 후 스모크 테스트** — `npx playwright test e2e/smoke.spec.ts`

### ❌하지 말아야 할 것

1. **`mv` + `sed` 수작업** — 실수가 날 수밖에 없음
2. **ts-morph만 믿고 끝내기** — CSS import, config 경로는 커버 안 됨
3. **`tsc` 통과만 확인** — dead code 참조, CSS import, Vite 플러그인 경로는 tsc가 모름

## 우리 프로젝트에 적용한다면

**가장 현실적인 조합:**

```
ts-morph (파일 이동 + TS import 갱신)
  ↓
grep "옛 경로" (인프라 설정/Vite 플러그인 내 잔존 참조)
  ↓
스모크 테스트 (런타임 검증)
```

혹은 이 전체를 하나의 **`scripts/move-module.mjs`** 스크립트로 묶을 수 있다:

```javascript
// scripts/move-module.mjs (개념)
import { Project } from "ts-morph";
import { execSync } from "child_process";

const [from, to] = process.argv.slice(2);

// 1. ts-morph으로 이동 + import 갱신
const project = new Project({ tsConfigFilePath: "tsconfig.json" });
const dir = project.getDirectoryOrThrow(from);
dir.move(to, { includeUntrackedFiles: true });
await project.save();

// 2. 남은 참조 검색
const oldAlias = from.replace("src/", "@");
const result = execSync(
  `grep -rn "${oldAlias}" src/ e2e/ vite-plugins/ vite.config.ts 2>/dev/null`,
  { encoding: "utf-8" }
).trim();

if (result) {
  console.error("⚠️  남은 참조 발견:\n" + result);
  process.exit(1);
}

console.log("✅ 이동 완료. 스모크 테스트를 실행하세요.");
```

## 흥미로운 이야기들

- **ts-morph vs TypeScript Compiler API**: ts-morph은 `ts.createProgram()`의 래퍼인데, 원본 API가 파일 이동을 지원하지 않아서 ts-morph이 자체 구현함. 내부적으로 모든 소스파일을 순회하며 import specifier를 재계산.
- **Facebook의 jscodeshift 사용 사례**: React 16 → 17, Flow → TypeScript 마이그레이션 등 수만 개 파일 변환에 사용. "한 번 쓰고 버리는 스크립트"로 설계됨.
- **VS Code가 import 갱신을 놓치는 이유**: `tsconfig.json`이 없거나, 파일이 git에 추적되지 않으면 Language Service가 인식 못 함. 특히 monorepo에서 자주 발생.

## 📚 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|------|------|------|--------|------|
| ts-morph 공식 문서 | 파일 이동 API 상세 | [ts-morph.com](https://ts-morph.com) | ★★☆ | 2h |
| jscodeshift 튜토리얼 | codemod 작성법 | [github.com/facebook/jscodeshift](https://github.com/facebook/jscodeshift) | ★★★ | 3h |
| knip 사용법 | 죽은 코드 탐지 | [knip.dev](https://knip.dev) | ★☆☆ | 30min |
| TypeScript Compiler API | ts-morph 내부 이해 | [TypeScript Wiki](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) | ★★★★ | 반나절 |
