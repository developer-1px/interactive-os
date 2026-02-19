# collection-clipboard

> `createCollectionZone`에 copy/cut/paste 자동 생성을 추가한다.

## WHY

T8에서 `createCollectionZone` facade가 remove, moveUp/Down, duplicate를 자동 생성한다.
그런데 Todo의 copy/cut/paste도 사실상 generic CRUD 패턴이다:

- **copy**: 선택된 아이템 → internal clipboard + OS 클립보드에 text/json 직렬화
- **cut**: copy + remove
- **paste**: clipboard → focused item 뒤에 insert (onPaste 훅으로 앱 커스터마이징)

유일한 앱-특화 부분은 paste 시 item 변환 (예: Todo의 `categoryId = selectedCategoryId`).
이걸 `onPaste?(item: T, state: S) => T` 훅으로 처리하면 facade가 나머지를 모두 자동 생성.

## Goals

1. facade에 `copy`, `cut`, `paste` 커맨드 자동 생성
2. `clipboardWrite` effect 자동 반환 (text + json 직렬화)
3. `onPaste` 훅으로 paste 시 item 커스터마이징
4. `collectionBindings()`에 `onCopy`, `onCut`, `onPaste` 추가
5. Todo app에서 수동 copy/cut/paste 코드를 facade로 대체
6. Builder에도 동일 패턴 적용 가능하도록 (현재 미구현이므로 신규)

## Scope

- `src/os/collection/createCollectionZone.ts` — copy/cut/paste 추가
- `src/os/collection/tests/unit/collection-zone.test.ts` — 테스트 추가
- `src/apps/todo/app.ts` — 마이그레이션
- 기존 clipboard OS 인프라 (`ClipboardListener`, `OS_COPY/CUT/PASTE`)는 건드리지 않음

## 선행

- T8: Collection Zone Facade (완료)
- `docs/official/os/why-clipboard.md` — OS clipboard 아키텍처
