# Command-Config Invariant — 회고 항목

## 🔴 잘못된 결정 (이번 세션에서 발견)

### 1. 커맨드 기반 테스트 작성
- **문제**: T2-T4 테스트를 `os.dispatch(OS_NAVIGATE(...))` 커맨드 직접 호출로 작성
- **올바른 방향**: `page.keyboard.press("ArrowRight")` 키 입력 기반 E2E 테스트
- **이유**: 커맨드 기반 테스트는 파이프라인 전반(key→resolve→command→state)을 검증하지 못함. 커버리지만 올리는 나쁜 테스트.
- **조치**: `/red` 워크플로우에 "입력 기반 테스트 우선" 규칙 추가 필요

### 2. OS gap 우회
- **문제**: headless page에서 tree aria-expanded 프로젝션이 안 될 때, 테스트를 축소하여 우회
- **올바른 방향**: OS gap을 해결하는 방향으로 수정 계획을 세우고 실행
- **이유**: gap을 우회하면 같은 문제가 반복됨. OS의 목적은 gap을 줄이는 것.
- **조치**: 우회 대신 gap 리포트 → fix → 테스트 복원

## 📋 /red 워크플로우 추가 필요
- 키/마우스 입력으로 시작하는 테스트가 가능하면 커맨드가 아니라 입력 기반 테스트를 작성하라
- createHeadlessPage + page.keyboard.press 패턴 사용
