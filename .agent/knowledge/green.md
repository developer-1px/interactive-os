# GREENBOOK — Green 구현 지식베이스

> `/green` 시작 시 읽는다. 종료 시 새 지식이 있으면 갱신한다.
> 헤드리스 로직 구현 패턴과 함정을 축적한다.
> UI 연결은 /bind(RUNBOOK)의 영역. 이 책은 순수 로직까지만.

---

## 1. 알려진 좋은 패턴

| 패턴 | 설명 | 발견일 |
|------|------|--------|
| **순수 함수 레이어** | `createXxxState()` + 변환 함수들. 불변 객체 반환. immer 사용 금지 (순수함수 레이어에서는) | 2026-02-25 |
| **OS 커맨드 래핑** | 순수함수 → `App.command()` 래핑 → state 반환. 이 순서 유지 | 2026-02-25 |
| **최소 구현** | Red 테스트가 요구하는 것만. 테스트 없는 로직 추가 금지 | 2026-02-25 |
| **Zone 태스크 체크** | Green 완료 후 "Zone이 있는가?" 확인. 있으면 /bind 필요. 여기서 멈추면 안 됨 | 2026-02-25 |

## 2. 알려진 함정

| 함정 | 결과 | 대응 |
|------|------|------|
| **순수함수 PASS에서 멈춤** | Zone 태스크인데 UI 연결 없이 Done 처리 → 화면 동작 안 함 | /bind까지 가야 완성 |
| **immer를 순수함수에 사용** | 테스트에서 draft 참조 이슈 | 순수함수 레이어는 spread/Object.assign |
| **과잉 구현** | 테스트에 없는 edge case까지 미리 구현 → 테스트와 구현 괴리 | 테스트가 요구하는 것만 |

## 3. 판정 선례

| 선례 | 결정 | 이유 | 날짜 |
|------|------|------|------|
| localeState.ts | 순수함수(createLocaleState/openDropdown/closeDropdown/setLocale) + OS 커맨드(locale.ts) 분리 | 레이어 명확히 | 2026-02-25 |
| useLocalizedSectionFields | `field:locale` 키 패턴으로 하위호환 구현 | INITIAL_STATE 마이그레이션 비용 0 | 2026-02-25 |
| FocusGroup headless 등록 | `useMemo`에서 ZoneRegistry.register(element=null) + `useLayoutEffect`에서 element만 바인딩. `renderToString`으로 headless 증명 | Phase 1(논리)/Phase 2(물리) 분리 | 2026-02-27 |
| DOM 스캔 위치 이동 | DOM querySelectorAll을 2-contexts(커널)에서 제거하고 FocusGroup.useLayoutEffect(뷰)로 이동. getItems closure 자동 등록. "제거가 아니라 이동" | DOM 의존의 문제는 존재가 아니라 위치 | 2026-02-27 |

---

## 갱신 방법
`/green` 세션 종료 후 새 구현 패턴/함정 발견 시 추가.
