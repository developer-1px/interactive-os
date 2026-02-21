# [Closed] builderCursor가 화면에 보이지 않음

## 환경
- 모든 환경에서 재현

## 재현 단계
1. Builder 페이지 열기
2. Canvas에서 아이템 포커스 (화살표 키 또는 클릭)
3. 커서 표시기(colored border)가 보이지 않음

## 기대 결과
포커스된 아이템 주위에 블록 타입별 색상의 커서가 표시되어야 함

## 실제 결과
어떤 아이템에 포커스해도 커서가 전혀 보이지 않음

## 심각도
**P1** — 빌더 핵심 UX 기능 완전 동작 불가

## 근본 원인
커밋 `57c85c0`에서 BuilderCursor가 DOM 속성(data-level, data-builder-type)에서 메타데이터를
읽는 방식을 상태 기반(findBlockInfo)으로 리팩토링했다.

`findBlockInfo`는 block tree의 **block.id**만 검색한다. 하지만 canvas에서 포커스되는 아이템은
대부분 field item ID (예: `ncp-hero-title`, `ncp-hero-sub`)로, 이는 `${blockId}-${fieldName}`
형태의 파생 ID이다. block tree에 존재하지 않으므로 `findBlockInfo`는 항상 `null`을 반환한다.

`null` → `depth = blockInfo?.depth ?? 0` → `depth === 0` → early return (커서 숨김)

## 해결
`resolveItemBlockInfo` 함수 도입:
1. `findBlockInfo`로 직접 block match 시도
2. 실패하면 `resolveFieldAddress`로 부모 block 해석
3. 부모 block의 depth + 1을 field item의 depth로 반환

## 관련 커밋
- 원인: `57c85c0 refactor(builder): read block metadata from state, not DOM`
- 원인: `7d4f825 refactor: remove level concept, use block type for cursor color`
