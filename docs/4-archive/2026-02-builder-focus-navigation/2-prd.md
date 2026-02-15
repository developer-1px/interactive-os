# Builder Focus Navigation PRD

## 1. 배경 (Background)
커널과 OS의 대규모 리팩토링(FocusData → ZoneRegistry/kernel 마이그레이션, Zone API 변경) 이후 빌더(Visual CMS Demo)의 마우스/키보드 포커스 이동 기능이 작동하지 않게 되었다. 파이프라인 컴포넌트(`FocusListener`, `KeyboardListener`, `NAVIGATE` command)는 존재하지만, `NAVIGATE` 커맨드가 의존하는 Context Provider(`DOM_ITEMS`, `DOM_RECTS`)가 끊어져 있고, `BuilderPage`의 선택 상태가 커널의 `selection` 상태와 분리되어 있다.

## 2. 목표 (Goals)
- **빌더 포커스 네비게이션 복원**: Arrow 키를 통한 블록/아이템 간 포커스 이동 기능을 복구한다.
- **선택 상태 동기화**: `BuilderPage`의 선택 상태를 커널의 `selection` 상태와 연동하여, 투명 클릭 영역 같은 임시방편을 제거한다.
- **시각적 피드백 복원**: 선택된 아이템에 대한 시각적 하이라이트(CSS `data-*` 속성 활용)를 복구한다.

## 3. 범위 (Scope)

### In-Scope
- `NAVIGATE` 커맨드를 위한 `DOM_ITEMS`, `DOM_RECTS`, `ZONE_CONFIG` Context Provider 주입 로직 수정.
- `BuilderPage.tsx`의 `selectedType` 상태를 커널 `focus.zones` 상태로부터 파생되도록 리팩토링.
- `builder-spatial.spec.ts` E2E 테스트 통과.

### Out-Scope
- `NAVIGATE` 커맨드 자체의 알고리즘 변경 (spatial navigation 알고리즘 개선은 별도 과제).
- 빌더 UI/UX의 대대적인 개편.

## 4. 사용자 시나리오 (User Scenarios)
1. **마우스 클릭 포커스**: 사용자가 빌더 캔버스의 블록을 클릭하면, 해당 블록이 포커스되고 우측 프로퍼티 패널이 해당 블록의 속성을 보여준다.
2. **키보드 네비게이션**: 포커스된 상태에서 방향키(ArrowUp/Down/Left/Right)를 누르면 인접한 블록이나 아이템으로 포커스가 이동한다.
3. **선택 상태 시각화**: 포커스된 아이템은 테두리나 배경색 변경으로 명확하게 식별된다.

## 5. 기술 제약 (Technical Constraints)
- 기존 `kernel` 및 `OS` 아키텍처를 준수해야 한다.
- `Zone` 컴포넌트의 변경은 최소화하며, 필요한 경우 `Zone`의 `options`나 Context 구성을 조정한다.
