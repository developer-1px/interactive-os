# /naming Analysis — Testing Package (os-devtool/testing)

> 작성일: 2026-03-10
> 범위: `packages/os-devtool/src/testing/` (리팩토링 후)
> 파일 수: 15 (page.ts, 5 lib/, types.ts, simulate.ts, expect.ts, scripts.ts, runScenarios.ts, TestBotRegistry.ts, diagnostics.ts, zoneItems.ts, index.ts)

---

## 1. Key Pool — 동사 (Verbs)

| 동사 | 의미 | 횟수 | Dictionary | 사용처 |
|------|------|------|-----------|--------|
| `create` | 새 인스턴스 반환 | 7 | ✅ §1.4 | createPage, createLocator, createProjection, createNegatedLocator, createPositiveLocator, createValueAssertions, createLocatorAssertions |
| `simulate` | 상호작용 재현 (테스트 전용) | 2 | ✅ §1.5 | simulateKeyPress, simulateClick |
| `register` | 레지스트리에 추가 | 3 | ✅ §1.4 | registerZones, registerZoneFromBinding, registerHeadlessZone |
| `unregister` | 레지스트리에서 제거 | 1 | — | unregisterHeadlessZone |
| `build` | 조각 조립 → 구조체 | 1 | ✅ §1.4 | buildKeyboardInput |
| `set` | 값 직접 설정 | 1 | ✅ §1.5 | setInteractionObserver |
| `resolve` | 입력 분석 → 결과 결정 | 1 | ✅ §1.1 | resolveClipboardShim (internal) |
| `dispatch` | 커맨드 전달 | 1 | ✅ §1.5 | dispatchResult (internal) |
| `get` | 저장소에서 꺼냄 | 1 | ✅ §1.2 | getZoneItems |
| `extract` | 원시 데이터에서 구조 추출 | 1 | ✅ §1.1 | extractScenarios |
| `is` | boolean 질의 | 2 | ✅ §1.6 | isLocatorLike, isEntryMatched (internal) |
| `expect` | 단언 팩토리 (Playwright 동형) | 1 | — | expect |
| `format` | 포맷팅 | 1 | — | formatDiagnostics |
| `run` | 실행 | 1 | — | runScenarios |
| `setup` | 환경 초기화 | 1 | — | setupHeadlessEnv |
| `seed` | 초기 데이터 주입 | 1 | — | seedInitialState |
| `type` | 텍스트 입력 (Playwright 동형) | 1 | — | typeIntoField |
| `parse` | 파싱 | 1 | — | parseItems (internal) |
| `init` | 초기화 | 1 | — | initZoneReactive (TestBotRegistry method) |
| `rebuild` | 재구성 | 1 | — | rebuildSnapshot (internal) |
| `notify` | 리스너 알림 | 1 | — | notify (internal) |

**요약**: 21개 동사 중 12개가 Dictionary 등재. 9개 미등재 중 `expect`, `run`, `type`은 Playwright 동형 API이므로 변경 불가. `format`, `parse`, `rebuild`, `notify`는 범용 프로그래밍 동사. 실질적 미등재 = `setup`, `seed`, `init` 3개.

---

## 2. Key Pool — 명사 (Nouns)

| 명사 | 의미 | 횟수 | 사용처 |
|------|------|------|--------|
| `Zone` | 포커스 관리 영역 | 7 | registerZones, registerZoneFromBinding, registerHeadlessZone, unregisterHeadlessZone, HeadlessZoneOptions, ZoneOrderEntry, getZoneItems |
| `Locator` | 요소 탐색 + 단언 | 6 | createLocator, HeadlessLocator, Locator, LocatorAssertions, createLocatorAssertions, ExpectLocator |
| `Script` | 테스트 스크립트 | 30+ | TestScript, *Script 상수들 (5 core + 21 APG) |
| `Scenario` | zone fixture + scripts 번들 | 3 | TestScenario, extractScenarios, runScenarios |
| `Assertions` | 단언 메서드 모음 | 3 | LocatorAssertions, ValueAssertions, createValueAssertions |
| `Items` | 아이템 목록 | 3 | getZoneItems, parseItems, (dom-items context) |
| `Page` | Playwright Page | 2 | createPage, Page |
| `Projection` | Component→HTML 렌더+파싱 | 2 | createProjection, Projection |
| `Env` | 테스트 환경 | 2 | setupHeadlessEnv, HeadlessEnv |
| `Interaction` | 상호작용 | 2 | setInteractionObserver, InteractionObserver |
| `Diagnostics` | 진단 | 2 | formatDiagnostics, DiagnosticKernel |
| `Value` | 값 | 2 | ValueAssertions, createValueAssertions |
| `Entry` | 레지스트리 저장 단위 | 2 | ManifestEntry, ZoneOrderEntry |
| `Input` | resolve 입력 구조체 | 1 | buildKeyboardInput |
| `Field` | 편집 필드 | 1 | typeIntoField |
| `State` | 상태 | 1 | seedInitialState |
| `Result` | 결과 | 1 | dispatchResult |
| `Observer` | 관찰 콜백 | 1 | InteractionObserver |
| `Manifest` | 매니페스트 | 1 | ManifestEntry (internal) |
| `Registry` | 레지스트리 | 1 | TestBotRegistry |
| `Snapshot` | 스냅샷 | 1 | rebuildSnapshot (internal) |
| `Bot` | TestBot (Inspector 제품명) | 1 | TestBotRegistry |
| `Kernel` | 커널 | 1 | DiagnosticKernel (internal) |
| `Keyboard` | 키보드 | 1 | buildKeyboardInput |
| `Clipboard` | 클립보드 | 1 | resolveClipboardShim (internal) |
| `Shim` | 대체 구현 | 1 | resolveClipboardShim (internal) |

---

## 3. Key Pool — 수식어 (Modifiers) & 접미사 (Suffixes)

### Modifiers
| 수식어 | 의미 | 횟수 | 사용처 |
|--------|------|------|--------|
| `Headless` | DOM 없이 실행 | 5 | HeadlessLocator, HeadlessEnv, HeadlessZoneOptions, registerHeadlessZone, unregisterHeadlessZone |
| `Test` | 테스트 관련 | 3 | TestScript, TestScenario, TestBotRegistry |

### Suffixes (Types)
| 접미사 | Dictionary | 횟수 | 사용처 |
|--------|-----------|------|--------|
| `Options` | ✅ | 1 | HeadlessZoneOptions |
| `Assertions` | — | 2 | LocatorAssertions, ValueAssertions |
| `Entry` | ✅ | 2 | ManifestEntry, ZoneOrderEntry |
| `Observer` | ✅ | 1 | InteractionObserver |
| `Input` | ✅ | 1 | KeyboardInput (imported) |
| `Env` | — | 1 | HeadlessEnv |
| `Kernel` (structural) | — | 1 | DiagnosticKernel |
| `Like` | — | 1 | LocatorLike |

---

## 4. 이상 패턴 리포트

### F1. `setup` vs `init` 동의어 충돌 (Low)

| 식별자 | 의미 |
|--------|------|
| `setupHeadlessEnv` | 테스트 환경 초기화 (beforeEach) |
| `initZoneReactive` | TestBotRegistry zone-reactive 모드 시작 |

둘 다 "초기화"이나 맥락이 다름: `setup`은 테스트 fixture (testing 관례), `init`은 라이브러리 부트스트랩. **허용 가능한 차이**이나, 통일한다면 `setup`이 testing 패키지에 더 적합.

### F2. `Env` 접미사 Dictionary 미등재 (Low)

`HeadlessEnv` — `cleanup()`, `addKeybindings()`, `zonesWithBindingGetItems`를 가진 disposable test fixture handle. naming.md 접미사 Dictionary에 없음.

- `Context`와 가장 가까우나, `Context`는 "실행 환경 / 의존성 묶음"으로 정의됨
- `Env`는 `setup → use → cleanup` 라이프사이클을 가진 test fixture에 더 정확
- **판정**: Dictionary에 `Env` 추가 후보. 또는 현행 유지 (내부 타입이므로)

### F3. `read*` os-core import — Dictionary 위반 (Cross-package, Info)

simulate.ts에서 `readActiveZoneId`, `readFocusedItemId`, `readZone`을 import. naming.md §1.2에 따르면 `read`는 금지, `get`으로 통일해야 함.

- 이는 **os-core의 문제**이지 testing의 문제가 아님
- testing이 자체 export에서 `read*`를 사용하지는 않음 (locator.ts 내부에서만 import)
- os-core 네이밍 리팩토링 시 함께 해결

### F4. `Assertions` 접미사 Dictionary 미등재 (Low)

`LocatorAssertions`, `ValueAssertions` — Playwright 동형 타입. Playwright가 `LocatorAssertions`를 쓰므로 변경 불가.

**판정**: Playwright 동형 이름은 naming dictionary 관할 밖. 현행 유지.

### F5. Dictionary 미등재 동사 6개 (Info)

| 동사 | 판정 |
|------|------|
| `setup` | Testing 관례. Dictionary 추가 후보 |
| `seed` | Database/testing 관례. Dictionary 추가 후보 |
| `init` | 라이브러리 부트스트랩. `setup`과 통일 가능 |
| `format` | 범용. Dictionary 불필요 |
| `run` | 범용. Dictionary 불필요 |
| `parse` | 범용, internal only. Dictionary 불필요 |

---

## 5. 종합 평가

**일관성: 높음** — 리팩토링 후 testing 패키지는 깨끗하다.

- `create*` 패턴이 7개 factory function에서 일관 적용
- `simulate*` 2개가 테스트 전용 상호작용 재현에 일관 사용
- `register/unregister` 쌍이 명확
- Type suffix는 `Options`, `Entry`, `Observer` 등 Dictionary 준수
- Playwright 동형 이름(`Page`, `Locator`, `expect`, `keyboard.type`)은 의도적 차용이며 naming dictionary 관할 밖

**이상 패턴 요약**:
| # | 심각도 | 내용 | 조치 |
|---|--------|------|------|
| F1 | Low | `setup` vs `init` 동의어 | 허용 가능. 통일 시 `setup` |
| F2 | Low | `Env` suffix 미등재 | Dictionary 추가 또는 현행 유지 |
| F3 | Info | `read*` os-core import | os-core 리팩토링 시 해결 |
| F4 | Info | `Assertions` suffix | Playwright 동형. 변경 불가 |
| F5 | Info | 6개 미등재 동사 | `setup`, `seed` 2개만 추가 후보 |

**결론**: 심각한 네이밍 이상 없음. 리팩토링이 깔끔하게 완료됨.
