# field-headless-input

| 항목 | 내용 |
|------|------|
| **Claim** | AppPage에 `keyboard.type()` / `fill()` 추가 + Field Enter 처리를 OS 파이프라인으로 올리면, headless 통합 테스트가 입력→커맨드 경계를 검증할 수 있고, "Same test code, different runtime" 약속이 완성된다 |
| **Before → After** | Field.tsx가 DOM keydown으로 Enter 자체 처리 (stopPropagation), AppPage에 keyboard.type/fill 없음 → Field Enter가 OS resolveKeyboard 파이프라인 통과, AppPage에 keyboard.type/fill 추가 |
| **Risks** | Field Enter를 OS 파이프라인으로 올리면 IME 컴포지션(isComposing) 복잡 · 기존 DOM listener 의존 코드 영향 · immediate/deferred 두 mode 커버 필요 |
| **Backing** | Playwright Page API (`keyboard.type`, `locator.fill`, `keyboard.press`) |
| **규모** | Heavy |

## Now

(없음 — 모든 태스크 Done)

## Done

| # | Task | Evidence | Date |
|---|------|----------|------|
| T1 | AppPage에 `keyboard.type(text)` 추가 | `defineApp.page.ts` + `defineApp.types.ts` — Red #1 PASS | 02-25 |
| T2 | Field Enter을 ZIFT 파이프라인으로 (headless) | `headless.ts` editingFieldId + `commit.ts` sync dispatch — Red #2,#4 PASS | 02-25 |
| T3 | Todo draft headless 통합 테스트 | `field-headless-input.test.ts` 4/4 GREEN, 0 regressions | 02-25 |
| T4 | E2E 시나리오 headless 검증 | `todo-user-journey.test.ts` 9/9 GREEN (create, check, delete, reorder, copy+paste) | 02-25 |
| T5 | Draft field `fieldType="inline"` 버그 수정 | `ListView.tsx` — Enter가 줄바꿈 대신 commit 동작 | 02-25 |
| T6 | `clipboardWrite` headless no-op effect | `defineApp.page.ts` — clipboard 에러 제거 | 02-25 |

## Unresolved

| # | Question | Blocker? |
|---|----------|----------|
| U1 | ~~Field Enter를 resolveKeyboard로 올릴 때 immediate/deferred mode 모두 커버 가능한가?~~ → immediate 완료. deferred는 기존 editingItemId 경로 유지. | Resolved |
| U2 | FieldRegistry.updateValue()를 headless에서 직접 호출하는 것이 Playwright fill()과 동등한 추상화인가? | No |
| U3 | 다른 앱(builder, docs-viewer)의 Field도 같은 갭이 있는가? | No |

## Ideas

| Idea | Trigger |
|------|---------|
| pipeline-verification-table (inbox 문서)과 연계하여 모든 앱의 입력→커맨드 경계 체계적 검증 | — |
| `keyboard.type()` 완성 후 text-inject-component (backlog)와 연계하여 상태→뷰 투영 headless화 | — |
