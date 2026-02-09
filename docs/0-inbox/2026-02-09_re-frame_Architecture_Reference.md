# re-frame 참조 아키텍처 리서치

## 1. 개요 (Overview)

re-frame을 우리 interactive-os 아키텍처의 참조 모델로 연구.
RxJS/Cycle.js 배경에서 re-frame이 동일한 목표(순수성, 이펙트 분리, 추적 가능성)를
어떻게 더 단순하게 달성하는지 분석.

## 2. 분석 (Analysis)

### 핵심 발견

1. **Effect as Data** — 우리의 `OSResult { state, domEffects }`는 re-frame의 `effects map` 패턴과 정확히 일치
2. **Coeffect** — 우리의 `OSContext` (DOM 쿼리, 스토어 상태)는 re-frame의 `coeffects` 패턴과 일치
3. **Doing vs Causing** — re-frame의 핵심 철학. 핸들러는 이펙트를 "실행"하지 않고 "데이터로 선언"한다
4. **Six Dominoes** — Event → Handler → Effects → Query → View → DOM 루프

### 우리 시스템에 없는 것

- `reg-fx` — 커스텀 이펙트 핸들러 등록 (플러그인 방식)
- `inject-cofx` — 인터셉터로 코이펙트 주입 (더 선언적)
- Subscription Graph — 계층적 반응형 쿼리 (Layer 2/3)
- Flows — 선언적 파생 상태 (re-frame 최신)

## 3. 결과 (Result)

리소스 문서 생성 완료: `docs/3-resource/04-re-frame-guide.md`

- Why re-frame? (Redux/Elm/Cycle 대비 장점)
- Background (역사, 철학)
- Core Concepts 6가지 (Six Dominoes, Effect/Coeffect, Interceptors, Subscriptions)
- 우리 시스템과의 상세 매핑 테이블
- 필독 링크 및 강연 목록

## 4. 후속 액션

- [ ] `reg-fx` 패턴 도입 검토 — `executeDOMEffect`를 플러그인 방식으로 확장
- [ ] re-frame-10x (DevTools) 참고하여 Inspector UI 개선
- [ ] Subscription Graph 패턴 검토 — Zustand selector 계층화
