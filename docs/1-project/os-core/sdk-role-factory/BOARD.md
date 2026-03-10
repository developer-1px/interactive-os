# sdk-role-factory

| Key | Value |
|-----|-------|
| Claim | os-sdk는 ARIA-driven `defineRole` + role별 전용 config 타입 + role 팩토리(단일 컴포넌트)로 재설계해야 한다. LLM에게 자유도는 실수 확률이다 |
| Before | `bind({ role, ...flatConfig })` — 모든 role 동일 ZoneBindings, 27개 role에 아무 config 조합 가능, Zone/Item 배치 실수 열림 |
| After | Phase 1: `bind(role, typedConfig)` — role이 config 타입 결정, tsc가 잘못된 조합 거부. Phase 2: `listbox(app, "list", config)` → 단일 컴포넌트 + renderItem — 조합 실수 구조적 불가 |
| Size | Heavy |
| Risk | 27개 role별 config 타입 정의 비용. 기존 bind() 호출처 71건 마이그레이션. defineRole schema 설계가 ARIA 순수성과 OS 고유 관심사를 분리해야 함 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|

<!-- /plan이 Task Map으로 채운다. /project는 비워둔다. -->

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| U1 | `defineRole`의 ARIA schema 구체 형태 — containerRole, itemRole, attrs 외에 orientation, ownership 등 무엇을 포함? | defineRole API 설계의 블로커 |
| U2 | role 팩토리 내부에서 Zone/Item을 어떻게 숨기나? renderItem이 받는 인자의 형태는? | Phase 2 설계의 블로커 |
| U3 | 기존 bind() 71건 마이그레이션 전략 — 호환 레이어? 일괄 전환? | 실행 순서 결정 |
| U4 | `getItems` 제거 후 headless test의 items 접근 경로 — role 팩토리 내부에서 관리하면 headless page.goto()는 어떻게 items를 아나? | headless 아키텍처 영향 |
| U5 | 기존 ZIFT props-spread blueprint(discussions/)와의 관계 — 선행? 병렬? 흡수? | 실행 순서 결정 |
| U6 | C3(OCP vs Pit of Success) — `defineRole`을 os-core 내부 API로 제한하면 서드파티 확장은 어떻게? | 장기 확장성 |

## Knowledge (Discussion에서 발견)

- K1. 디자인·레이아웃은 OS의 관심사가 아니다 — 앱의 영역
- K2. 이 OS의 주 사용자는 LLM이다. LLM에게 자유도는 실수 확률이다
- K3. role 컴포넌트는 defineApp 메서드가 아니라 독립 팩토리여야 한다 (OCP)
- K5. props 주입 방식은 headless test 불가 — getItems는 선언 시점에 등록 필수
- K6. role 팩토리는 AppHandle<S>를 받는 독립 함수 — 타입 추론 + 확장성 양립
- K7. role 팩토리의 본질적 가치 = role별 전용 config 타입으로 잘못된 조합을 tsc가 거부
- K8. role 컴포넌트는 단일 컴포넌트 + renderItem. items 순회·Zone·ARIA는 내부 처리
- K9. render slot은 LLM에게 pit of success 아님 — renderItem 1개 + scalar props로 제한
- K10. Collection role = renderItem, Container role = children — 2분류
- K11. Container role도 preset(config-only) / custom(children) 2단계
- K12. API 형태는 업계 표준(Radix)을 따르는 게 LLM에게 Pit of Success
- K13. bind(role, config) 시그니처 변경 + role별 config 타입이 ROI 최고
- K14. Radix 직접 사용 불가 — OS의 통합 kernel과 구조적 충돌
- K15. ARIA 투영 경로는 projection API 형태와 무관 — headless compute가 진실
- K16. config 실수 = bind(role, config). 조합 실수 = role 팩토리. 두 레이어 필요
- K17. 실행 순서: bind(role, config) 먼저 → role 팩토리를 그 위에. 점진적 Pit of Success
- K18. role = defineRole()로 생성하는 등록 가능 객체. string union 아님. OCP 충족
- K19. defineRole의 schema = ARIA 속성 허용 목록. config(callback, getter)는 ARIA에서 도출
- K20. 3분류 확정: defineRole=ARIA, bind=OS고유(field,triggers), getItems=제거(role팩토리 내부화)
