# 🔍 삽질 일지: normalized-collection tree 테스트 21건 전멸

> 날짜: 2026-02-26
> 실행 명령: `npx vitest run src/os/collection/tests/unit/tree-ops.test.ts tree-paste.test.ts`
> 결과: 21개 실패 / 88개 통과 (총 109)

## 증상

`tree-ops.test.ts`(15 FAIL), `tree-paste.test.ts`(6 FAIL) — 모두 같은 패턴:

```
TypeError: Cannot read properties of undefined (reading 'id')
TypeError: Cannot read properties of undefined (reading 'children')
```

`findInTree(app.state.data.blocks, "tab-1-overview")` → `undefined` 반환.
모든 tree-aware 연산(delete, cut, move, duplicate, paste)이 전멸.

## 즉시 수정한 것들

없음. import나 오타 수준이 아님.

## 삽질 과정

- 처음엔 tree-aware 커맨드(deleteSection, moveSectionUp 등)의 구현이 빠졌을 거라 생각했는데...
- 에러가 **커맨드 dispatch 전**에도 발생함. 첫 번째 `findInTree` 호출에서 즉시 undefined.
- 그래서 "테스트 데이터가 잘못된 건가?" 싶어서 INITIAL_STATE를 확인해봤더니...
- **INITIAL_STATE의 ID 체계가 테스트의 ID와 완전히 다름:**

| 테스트 기대 ID | 실제 INITIAL_STATE ID |
|---|---|
| `tab-container-1` | `ge-tab-nav` |
| `tab-1-overview` | `ge-tab-overview` |
| `tab-1-details` | `ge-tab-detail` |
| `tab-1-faq` | `ge-tab-faq` |
| `tab-1-overview-s1` | (존재 안 함. 자식은 `ge-notice`, `ge-features`) |
| `tab-1-details-s1` | (존재 안 함. 자식은 `ge-detail`) |

- 또한 `accept` 속성이 INITIAL_STATE 블록에 **없음**. 테스트는 `accept: ["section"]`, `accept: ["tab"]`을 기대.
- 테스트가 **가상의 블록 구조**를 기대하는데, INITIAL_STATE는 **실제 GreenEye 프리셋**을 쓰고 있음.
- 결론: 테스트가 작성될 당시 다른 INITIAL_STATE(또는 별도 test fixture)가 있었거나, 아직 구현이 안 된 상태에서 Red 테스트만 작성된 것.

## 원인 추정 — 5 Whys

1. 왜 21개 테스트가 실패하나? → `findInTree`가 undefined를 반환
2. 왜 undefined를 반환하나? → 기대하는 ID가 `app.state.data.blocks`에 없음
3. 왜 없나? → INITIAL_STATE(GreenEye 프리셋)의 ID 체계가 테스트와 불일치
4. 왜 불일치하나? → 테스트가 **가상의 tree fixture** 기준으로 작성됐는데, 실제 앱 상태를 사용 중
5. 왜 이런 상태가 지속됐나? → BOARD.md가 "Done"으로 표기되어, 테스트 실패를 확인하지 않고 넘어감

→ **근본 원인**: 테스트가 `BuilderApp.create()`의 실제 INITIAL_STATE 대신 **전용 test fixture**를 사용해야 하는데, fixture 없이 가상 ID로 작성됨. 혹은 Red 테스트로 작성된 후 Green 구현(ID 맞추기 or fixture 생성)이 진행되지 않음.
→ **확신도**: 높음

## 다음 액션 제안

**방향 A: test fixture 생성**
- `tree-ops.test.ts`용 별도 `createTreeTestApp()` fixture를 만들어 `tab-container-1`, `tab-1-overview` 등 가상 ID + `accept` 속성을 가진 블록 트리 제공.

**방향 B: 테스트 ID를 실제 INITIAL_STATE에 맞춤**
- 비추천. GreenEye 프리셋에 `accept` 속성이 없고, 구조가 테스트 시나리오와 맞지 않음.

**방향 C: BOARD.md 정직하게 갱신**
- 이 21개 테스트는 Red 상태. BOARD.md에서 해당 태스크를 Red→Green 미완으로 표기.

**추천: A + C**. fixture를 만들고, 커맨드 구현이 있는지 확인 후 Green 달성.
