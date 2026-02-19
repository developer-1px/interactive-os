# TestBot — Proposal

## 구현 전략

### Phase 1: Shim 커버리지 확대 (현재 → 1주)

현재 Todo E2E 12/12 PASS 달성. 나머지 63개 Playwright spec(focus-showcase, aria-showcase, playground)을 TestBot에서도 실행할 수 있도록 shim을 확대한다.

#### 추가 필요 API

| API | 용도 | 난이도 |
|-----|------|--------|
| `locator.fill(value)` | input 값 설정 | 🟢 |
| `locator.focus()` | 포커스 이동 | 🟢 |
| `expect().toBeVisible()` | 가시성 확인 | 🟢 |
| `expect().toBeDisabled()` | 비활성 확인 | 🟢 |
| `expect().toHaveText()` | 텍스트 확인 | 🟢 |
| `expect().toHaveValue()` | 값 확인 | 🟢 |
| `expect().not.*` | 반전 체이닝 | 🟡 |
| `page.waitForSelector()` | 타이밍 대기 | 🟡 |
| `locator.nth(n)` | n번째 요소 | 🟢 |

#### 변경 파일

- `src/inspector/testbot/playwright/shim.ts` — API 구현
- `src/inspector/testbot/features/actions/createActions.ts` — 추가 폴리필
- `src/inspector/testbot/features/actions/selectors.ts` — 쿼리 엔진 개선

### Phase 2: Spec 자동 등록 (1주)

현재는 Vite 플러그인(`vite-plugins/testbot-spec-plugin.ts`)이 `.spec.ts` 를 TestBot용으로 래핑한다. 이 파이프라인을 안정화하여 새 spec 추가 시 TestBot에 자동 등록.

#### 작업 항목

1. Vite 플러그인 안정화 — `test()` 블록 추출 정확도 개선
2. `goto()` URL → 라우트 매핑 — spec의 `page.goto('/todo')` → TestBot 내부 라우트 전환
3. `beforeEach` / `afterEach` 지원 — 현재 `describe` 내 setup 코드 처리

### Phase 3: 폴리필 체계화 (1주)

Synthetic event의 한계를 `press()` 폴리필 레지스트리로 체계화:

```typescript
const POLYFILLS: Record<string, (target: Element) => void> = {
  "Meta+a": selectAll,
  "Backspace": deleteSelection,
  "Meta+c": copyToClipboard,
  "Meta+v": pasteFromClipboard,
  "Enter": submitOrNewline,
};
```

### Phase 4: CDP Remote Control (장기)

별도 프로젝트로 분리. TestBot을 "Playwright GUI Runner"로 진화:
- Node.js Runner + WebSocket
- CDPHelper를 통한 실시간 시각화
- 이건 Shim이 충분히 성숙한 후에 검토

## 리스크

| 리스크 | 영향 | 완화 |
|--------|------|------|
| Synthetic event 한계 발견 | 특정 spec 실행 불가 | 폴리필 레지스트리로 개별 대응 |
| Vite 플러그인 불안정 | spec 변환 실패 | 변환 결과를 `.testbot.ts`로 미리 생성하여 검증 |
| Playwright API 확대 비용 | shim.ts 비대화 | API별 파일 분리, Playwright 타입 재사용 |

## 대안

1. **Shim 포기 → CDP only** — 단기 개발 비용 높고, dev 서버 + 별도 프로세스 필요
2. **TestBot 제거 → Playwright only** — Visual Verification 포기, 핵심 가치 상실
3. **현재 상태 유지** — Todo만 동작, 확장성 부족

## 추천

**Phase 1~3**을 순차 실행하여 현재 아키텍처에서 최대 효과 추출. Phase 4(CDP)는 Phase 3 완료 후 별도 평가.
