# 주요 표준 시스템 누락 보고서 (Key Standards Gap Analysis)

## 1. 개요 (Overview)
사용자의 지적에 따라, "보편적인 프로덕트"로서 갖춰야 할 핵심 시스템(History, Clipboard, Focus)의 현재 상태를 점검하고 누락된 표준 기능들을 식별했습니다.

## 2. 상세 분석 (Detailed Analysis)

### 2.1. History System (Undo/Redo)
- **현재 상황**: `AppState.history`에 단순히 과거의 명령과 결과 상태를 `push`만 하고 있음.
- **누락된 표준**:
    - **Undo/Redo Stack**: 현재 `pointer`가 없고 스택을 앞뒤로 이동할 수 없음.
    - **Transaction Support**: 여러 명령을 하나의 Undo 단위로 묶는 기능 부재.
    - **Limit Management**: 히스토리가 무한정 쌓여 메모리 누수 가능성 존재.

### 2.2. Clipboard System (Copy/Paste)
- **현재 상황**: 구현 전무.
- **누락된 표준**:
    - **Object Serialization**: Todo 아이템이나 카테고리를 JSON/Text로 직렬화하여 클립보드에 복사하는 기능.
    - **Paste Handling**: 외부 텍스트나 내부 객체 붙여넣기 시 스마트한 파싱 및 생성 로직.
    - **Cross-App Support**: 다른 앱(예: 메모장)에서 텍스트 복사 시 Todo로 변환.

### 2.3. Focus System (Accessibility & Navigation)
- **현재 상황**: `FocusContext`와 `Zone`을 통한 내부적인 키보드 네비게이션은 구축됨.
- **누락된 표준**:
    - **ARIA Standards**: `aria-activedescendant` 미사용. 스크린 리더 호환성 낮음.
    - **Tab Order**: 기본 `Tab` 키를 통한 Zone 간 이동이 명시적으로 관리되지 않음(Interactive OS 특성상 의도적일 수 있으나, 접근성 표준 위배).
    - **Focus Trap**: 모달이나 특정 구역 내 포커스 가두기 기능 부재.

## 3. 제안 (Proposal)

이 위크플로는 단순 보고서 작성에 그치지 않고, 후속 작업으로 가장 시급한 **History(Undo/Redo)** 기능을 우선 구현할 것을 제안합니다.

1. **Phase 1**: History System 고도화 (Undo/Redo 도입)
2. **Phase 2**: Clipboard System 도입 (Copy/Paste)
3. **Phase 3**: Accessibility(ARIA) 표준 적용

현재 가장 치명적일 수 있는 사용성 결함은 실수를 되돌릴 수 없는 **Undo 기능의 부재**입니다.
