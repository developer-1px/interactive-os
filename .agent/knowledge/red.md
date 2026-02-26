# REDBOOK — Red 테스트 지식베이스

> `/red` 시작 시 읽는다. 종료 시 새 지식이 있으면 갱신한다.
> 좋은 헤드리스 테스트 패턴과 함정을 축적한다.

---

## 1. 알려진 좋은 패턴

| 패턴 | 설명 | 발견일 |
|------|------|--------|
| **헤드리스 테스트** | OS 상태 함수를 직접 호출하여 검증. DOM/이벤트 없음 | 2026-02-25 |
| **DT행 → 테스트 1:1** | DT 한 행 = 테스트 케이스 하나. 행 번호를 테스트 describe에 명시 | 2026-02-25 |
| **순수 함수 우선** | `createXxxState()` → 변환 함수 → 결과 단언. 상태 불변성 검증 | 2026-02-25 |
| **stub 로 시작** | 첫 Red는 "Not implemented" stub 반환으로 시작. 구현은 /green에서 | 2026-02-25 |

## 2. 알려진 함정

| 함정 | 결과 | 대응 |
|------|------|------|
| **DOM 직접 검증** | `document.querySelector`로 UI 검증 → OS Hook 미사용 → /audit에서 🔴 | OS useComputed/상태 변화로 검증 |
| **구현 포함** | Red 단계에서 실제 동작하는 코드 작성 → TDD 사이클 파괴 | stub만. 구현은 /green |
| **상태 public 노출** | 내부 상태를 직접 검증하지 말고, 공개 API(함수 반환값)만 검증 | 캡슐화 유지 |
| **거짓 GREEN** | `createOsPage`로 앱 기능 테스트 → 커널만 검증 → browser에서 전부 실패. 8 tests GREEN + audit PASS + doubt PASS 했지만 ArrowDown/Escape/overlay 모두 동작 안 함 | 앱 테스트 = `createPage(App)` + click/press만. `createOsPage`는 OS 커널 전용. (선례: dropdown-dismiss 2026-02) |
| **dispatch 우회** | 앱 통합 테스트에서 `dispatch(OS_OVERLAY_OPEN)` 직접 호출 → 브라우저의 Trigger click 경로를 안 탐 | click/press만 허용. dispatch는 browser 경로를 우회하는 레거시 |
| **테스트 대상 레이어 오타겟** | ZoneRegistry(저장소)를 테스트했는데 이미 OK → 진짜 문제는 FocusGroup(생성자). "이미 동작하는 레이어"와 "아직 안 되는 레이어"를 먼저 구분 | Red 작성 전 "이 테스트가 실패해야 하는 이유"를 1문장으로 명시 (선례: headless-zone-registry T1) |

## 3. 판정 선례

| 선례 | 결정 | 이유 | 날짜 |
|------|------|------|------|
| locale-switcher.test.ts | DT #1,#2,#4 → 3개 테스트. OS 순수함수 검증 | 키보드(#5-#7)는 OS Zone 미구현으로 보류 | 2026-02-25 |

---

## 갱신 방법
`/red` 세션 종료 후 새 테스트 패턴/함정 발견 시 추가.
