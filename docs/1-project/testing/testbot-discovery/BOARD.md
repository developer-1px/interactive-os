# testbot-discovery

## Context

Claim: testbot 파일 작성만으로 3-engine 자동 등록 + TestBot 패널이 현재 route에 맞는 스크립트만 표시

Before → After:
- **format**: TestScript 현행 유지 (describe/it SDK는 over-engineering — W7, W8)
- **discovery**: import.meta.glob 자동 발견 이미 존재 (zone-reactive). route를 명시적 키로 추가
- **filtering**: TestBot 패널이 모든 스크립트를 항상 표시 → route 기반 context-aware 필터링
- **execution**: 그룹/단일 실행 현행 유지

핵심 논거:
- W2. describe/it와 TestScript.run은 동형 — wrapper는 순수 overhead
- W8. LLM 친화성은 format이 아니라 context 공급(knowledge 문서) 문제
- W10. discovery는 route/convention, execution은 zone — 관심사 분리
- W11. TanStack Router가 이미 현재 route 제공 — TestBot이 읽기만 하면 됨

선례: Playwright E2E proof (e5b0d4c0) — apgAccordionScript.run(page, expect)이 Chromium에서 PASS

Risks:
- C2(engine 호환성): 모든 testbot이 3 engine에서 동작하지는 않음 (OS runtime import 차단, builderBlock headless 미지원). opt-out engines 필드로 해소
- route convention이 복잡한 라우팅(동적 params)에서 깨질 수 있음

## Now
- [ ] T1: ManifestEntry에 route? 필드 추가 + buildAutoEntries 추출 — 크기: S, 의존: —
- [ ] T2: testbot 3파일에 export const route 추가 — 크기: S, 의존: —
- [ ] T3: TestBotRegistry route 필터링 (getCurrentRoute 콜백) — 크기: M, 의존: →T1
- [ ] T4: TestBotPanel route getter 연결 — 크기: S, 의존: →T3
- [ ] T5: 전체 vitest regression 검증 — 크기: S, 의존: →T4

## Done

## Unresolved
- engine opt-out 메커니즘의 구체적 API (engines 필드? 파일 convention?)
- 동적 route params ($pattern 등)의 매칭 전략

## Ideas
- vitest plugin으로 testbot-*.ts에서 .test.ts runner 자동 생성
- Playwright config에서 testbot glob으로 E2E spec 자동 생성
- testbot-usage-unification blueprint(notes/)의 G1~G8 후속 통합
