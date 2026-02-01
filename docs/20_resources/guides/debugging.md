# 디버깅 및 관찰 가능성 (Debugging & Observability)

Antigravity는 개발 중에 완전히 투명하게 보이도록 설계되었습니다.

## 1. 전문 로거 (`AntigravityLogger`)

커스텀 로거는 다양한 시스템 계층에 대해 스타일이 적용된 배지를 제공합니다:
- `[ENGINE]`: 상태 변경 및 커맨드 결과.
- `[KEYMAP]`: 키보드 매치 결과.
- `[CONTEXT]`: 플래그 동기화 및 조건 컴파일.
- `[PRIMITIVE]`: 클릭이나 입력 커밋 같은 사용자 상호작용.
- `[SYSTEM]`: 등록 및 초기화 로그.

### 추적 커맨드 (Trace Command)
커맨드가 실행될 때, 로거는 다음을 보여주는 그룹을 생성합니다:
- **Payload**: 커맨드와 함께 전송된 데이터.
- **Prev State**: 실행 전의 상태 스냅샷.
- **Next State**: 실행 후의 상태 스냅샷.

## 2. 커맨드 인스펙터 (Command Inspector)

우측 패널은 "인터랙션 OS" 내부의 실시간 뷰를 제공합니다.

### 커맨드 레지스트리 (Command Registry)
- 등록된 모든 커맨드를 봅니다.
- 바인딩된 단축키를 확인합니다.
- `when` 조건에 따라 활성/비활성 상태(녹색/회색 표시기)를 모니터링합니다.

### 전역 상태 (Global State)
- `AppState`의 라이브 뷰.
- 실시간 `editDraft` 및 `focusId` 추적.

## 3. 모범 사례 (Best Practices)
- **콘솔 필터링**: `[KEYMAP]`으로 필터링하여 단축키가 왜 작동하지 않는지 디버깅하십시오.
- **그룹 검사**: `Action: COMMAND_ID` 그룹을 펼쳐서 `run` 함수 내의 로직 오류를 찾으십시오.
- **개발 모드**: 로깅과 인스펙터는 `import.meta.env.DEV`를 통해 프로덕션 빌드에서는 자동으로 비활성화됩니다.
