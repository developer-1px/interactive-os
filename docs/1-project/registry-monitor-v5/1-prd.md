# Registry Monitor v5 — PRD

## 배경

Registry Monitor는 커널에 등록된 커맨드를 실시간으로 보여주는 인스펙터 패널이다.
현재 구현은 레거시 `GroupRegistry`(정적 Map)를 데이터 소스로 사용하고 있으나,
v5 커널은 `scopedCommands`를 클로저 안에서 관리한다.

**데이터 연결이 끊어진 상태** — GroupRegistry에 수동 등록된 것만 보이고,
`kernel.defineCommand()`로 등록된 커맨드들은 보이지 않는다.

## 목표

1. **v5 커널의 scopedCommands를 직접 읽어 표시한다.**
   - 커널에 Inspector API(`getRegistry()`)를 추가한다.
   - 레거시 `GroupRegistry`를 제거한다.

2. **UI를 고도화한다.**
   - Scope Tree 시각화 (부모-자식 관계)
   - When Guard 상태 실시간 표시
   - 커맨드 dispatch 이력과 연동
   - 가독성 개선 (현재 7-8px 폰트는 너무 작음)

## 범위

### In Scope
- 커널에 `getRegistry()` Inspector API 추가
- `RegistryMonitor` v5 커널 직접 연결
- Scope Tree 계층 UI
- When Guard 실시간 평가 표시
- 마지막 실행 커맨드 하이라이트
- `GroupRegistry.ts` 레거시 파일 제거

### Out of Scope
- 커맨드 편집/등록 UI (read-only inspector)
- 키바인딩 재할당 UI
- PipelineInspector 리팩토링 (별도 프로젝트)

## 사용자 시나리오

1. **개발자가 인스펙터 REGISTRY 탭을 열면**
   → 커널에 등록된 모든 커맨드가 Scope별로 그룹화되어 표시된다.
   → GLOBAL 커맨드와 Scoped 커맨드가 시각적으로 구분된다.

2. **커맨드를 실행하면**
   → 해당 커맨드 행이 하이라이트 + flash 애니메이션.
   → payload가 있으면 inline으로 표시.

3. **when guard가 있는 커맨드는**
   → 현재 state 기준으로 enabled/disabled가 실시간 반영.
   → guard 조건이 tooltip으로 표시.

4. **Scope Tree 계층을 탐색하면**
   → 부모→자식 관계가 트리 형태로 보인다.
   → 현재 활성 Zone이 하이라이트된다.

## 기술 제약

- 커널 코드는 `@frozen` 주석이 있음 — **Inspector API 추가만** 허용 (핵심 로직 수정 금지)
- `scopedCommands`는 `InternalCommandHandler`(함수)를 저장 — 커맨드 메타데이터(id, when)는 별도로 추적 필요
- React 18 `useSyncExternalStore` 패턴 유지
