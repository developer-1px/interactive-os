# 투두 앱 포커스 로직 책임 소재 분석 보고서

## 1. 개요 (Overview)
사용자는 `src/apps/todo/logic/` 내의 `focus_rules.ts`, `focus_utils.ts`, `focusStrategies.ts` 파일들이 투두 앱의 책임 범위를 벗어난 로직을 포함하고 있음을 지적하였습니다. 본 보고서는 해당 파일들이 구체적으로 어떻게 아키텍처 원칙을 위반하고 있는지 분석하고 개선 방향을 제안합니다.

## 2. 분석 (Analysis) / 상세 내용 (Details)
지적된 파일들은 **'Smart Core, Dumb App'** (핵심 기능은 OS에, 앱은 선언만) 원칙을 위반하고, OS가 담당해야 할 일반적인 포커스 및 내비게이션 로직을 앱 내부에서 재구현하고 있습니다.

### A. 범용 내비게이션 연산의 중복 (`focus_utils.ts`)
- **현상**: `findNextFocusTarget` 함수는 리스트 내에서 현재 아이템의 인덱스를 찾고, +1 또는 -1을 하여 다음 타겟을 결정합니다.
- **문제점**: "다음 항목으로 이동"은 투두 앱의 비즈니스 로직이 아닌, 선형 리스트(Linear List) UI의 기하학적/공간적 내비게이션 문제입니다. 이를 앱마다 구현하는 것은 코드 중복이며 일관성을 해칩니다.
- **위반**: Separation of Concerns (관심사의 분리) 위반.

### B. 수동 상태 무결성 관리 (`focus_rules.ts`)
- **현상**: `ensureFocusIntegrity` 함수는 앱 상태(Reducer)가 변경될 때, 강제로 OS의 `useFocusStore`에 접근하여 포커스를 이동시킵니다(Side Effect).
- **문제점**: 앱이 OS의 포커스 상태 안정성을 직접 '마이크로매니징'하고 있습니다. 아이템 삭제 시 포커스 처리는 데이터가 사라졌을 때 OS의 Focus Engine이 정책(예: Nearest Neighbor)에 따라 자동으로 처리하거나, 선언적인 설정에 의해 동작해야 합니다.
- **위반**: Inversion of Control (제어의 역전) 부재.

### C. 병렬 전략 레지스트리 구축 (`focusStrategies.ts`)
- **현상**: `FocusStrategyRegistry`라는 별도의 클래스를 만들어 Zone 진입 시 어떤 아이템을 포커스할지 결정합니다.
- **문제점**: 이는 OS의 `Zone` 및 `Jurisdiction` 시스템이 이미 담당하고 있는 '진입 정책(Entry Policy)' 기능을 앱 레벨에서 재발명(Reinventing the wheel)한 것입니다. OS의 표준 API를 따르지 않고 독자적인 프레임워크를 구축하여 시스템 복잡도를 증가시킵니다.
- **위반**: Standard Compliance (표준 준수) 위반 및 기능 중복.

## 3. 결론 (Conclusion) / 제안 (Proposal)
해당 로직들은 투두 앱에서 제거되어야 하며, OS의 핵심 기능으로 이관되거나 대체되어야 합니다.

1.  **`focusStrategies.ts` 삭제**: 자체 레지스트리 대신 `Zone` 컴포넌트의 표준 `defaultFocus` 또는 `onEntry` 속성을 사용하십시오.
2.  **`focus_utils.ts` 로직 이관**: 리스트 순회 로직은 `@os/utils`와 같은 공용 라이브러리로 이동하거나, OS의 Spatial Navigation이 이를 계산하도록 위임하십시오.
3.  **`focus_rules.ts` 리팩토링**: 리듀서 내부의 불순한(Impure) Side Effect를 제거하고, 컴포넌트의 Lifecycle(Mount/Unmount)이나 OS의 자동 보정 Hooks(`useFocusCorrection` 등)를 활용하여 선언적으로 처리하십시오.
