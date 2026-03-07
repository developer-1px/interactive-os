# 코딩 규칙

> 이 문서는 구체적인 코딩 패턴과 안티패턴을 정의한다.
> 성능, 렌더링, 상태 관리 관련 코드를 작성할 때 참조한다.

---

## 성능

1. **애니메이션은 과정을 보여줘야 한다. 과정을 가리는 애니메이션은 잘못된 애니메이션이다.** Repeatable한 빠른 이동(커서, 포커스)에 opacity·색상 transition을 걸면, 이동 중 상태가 보이지 않는 순간이 생겨 오히려 과정을 가린다. 이런 요소에는 transition 없이 즉시 반영한다.

2. **외부 스토어 구독값을 `useEffect` deps에 넣는 동시에 effect body에서 그 스토어를 변이(mutate)하지 않는다.** 이 패턴은 `구독 변경 → effect 재실행 → mutate → emit → 구독 변경 → ...` 무한 루프를 만든다 (`Maximum update depth exceeded`). **수정 패턴**: 구독값을 `ref`에 저장하고 렌더마다 갱신하되, deps에는 포함하지 않는다.

## 의존성 위생

3. **Facade 경계**: `src/`(앱)에서 `@os-core/*` 직접 import 금지. `@os-sdk/os` 또는 `@os-react/*`만 허용. facade에 필요한 API가 없으면 `@os-sdk/os.ts`에 re-export 추가.

4. **패키지 → 앱 역의존 금지**: `packages/` 코드에서 `@apps/` import 금지 (테스트 포함). 개밥먹기 통합 테스트는 `tests/integration/`에 위치시킨다.

5. **Dead code 검색 범위 = 프로젝트 루트**: 사용처를 찾을 때 `packages/`만 grep하면 `src/`의 앱 사용처를 놓친다. 반드시 `./`에서 검색.

6. **순환 의존성 해소**: 두 파일이 서로 import하면, 공유 타입을 `types.ts`로 분리하여 순환을 끊는다. `import type`만의 순환은 런타임 무해하지만, madge가 탐지하므로 가능하면 분리한다.

## Props 위생

7. **`...rest` spread에 콜백 prop이 묻히는 패턴 금지.** `onActivate`, `onChange` 등 콜백성 prop을 destructure하지 않으면 `...rest`가 DOM element에 spread하여 (a) 콜백이 실행되지 않고 (b) invalid HTML attribute 경고가 발생한다. **콜백 prop은 반드시 명시적으로 destructure한다.**
