# OS-Core 네이밍 구성 분석

> 작성일: 2026-03-10
> 범위: `packages/os-core/src/` (99 files, ~360 exports)
> 워크플로우: `/naming`

---

## 1. Key Pool 표

### 1.1 Prefix

| Key | Meaning | Count | Appears In |
|-----|---------|-------|------------|
| `OS_` | OS 커맨드 네임스페이스 | 36 | `OS_NAVIGATE`, `OS_FOCUS`, `OS_SELECT`, `OS_ACTIVATE`, `OS_ESCAPE`, `OS_TAB`, `OS_EXPAND`, `OS_FIELD_*`, `OS_COPY/CUT/PASTE`, `OS_DELETE`, `OS_MOVE_*`, `OS_OVERLAY_*`, `OS_NOTIFY*`, `OS_UNDO/REDO`, `OS_VALUE_CHANGE`, `OS_DRAG_*`, `OS_STACK_*`, `OS_SYNC_FOCUS`, `OS_CHECK`, `OS_PRESS`, `OS_SELECT_ALL`, `OS_SELECTION_CLEAR` |
| `DOM_` | DOM 컨텍스트 주입 토큰 | 4 | `DOM_ITEMS`, `DOM_RECTS`, `DOM_EXPANDABLE_ITEMS`, `DOM_TREE_LEVELS`, `DOM_ZONE_ORDER` |
| `ZONE_` | Zone 컨텍스트 토큰 | 1 | `ZONE_CONFIG` |
| `DEFAULT_` | 기본값 상수 | 9 | `DEFAULT_NAVIGATE`, `DEFAULT_TAB`, `DEFAULT_SELECT`, `DEFAULT_DISMISS`, `DEFAULT_PROJECT`, `DEFAULT_EXPAND`, `DEFAULT_INPUTMAP`, `DEFAULT_VALUE`, `DEFAULT_CONFIG`, `DEFAULT_TRIGGER_*` |
| `Internal` | — | 0 | (없음 — kernel과 달리 os-core에는 Internal prefix 미사용) |

### 1.2 Verb

| Key | Meaning | 순수 | Count | Appears In |
|-----|---------|------|-------|------------|
| `resolve` | 입력→결정 | ✅ | 20 | `resolveKeyboard`, `resolveClick`, `resolveMouse`, `resolvePointer*`, `resolveClipboard`, `resolveChain`, `resolveEscape`, `resolveExpansion`, `resolveNavigate`, `resolveEntry`, `resolveWithStrategy`, `resolveCorner`, `resolveTypeahead`, `resolveTab*`, `resolveValueChange`, `resolveRole`, `resolveElement`, `resolveItemId`, `resolveSelection`, `resolveTriggerClick`, `resolveFieldKey*`, `resolveSliderValue`, `resolveSelectMode`, `resolveTriggerRole`, `resolveFallback` |
| `compute` | 상태→속성 계산 | ✅ | 3 | `computeItem`, `computeAttrs`, `computeTrigger`, `computeContainerProps` |
| `build` | 조각→구조체 조립 | ✅ | 5 | `buildZoneCursor`, `buildZoneEntry`, `buildFieldConfig`, `buildTriggerKeymap`, `buildRegistrySnapshot` (inspector) |
| `create` | 새 인스턴스 팩토리 | ✅ | 5 | `createKeybindingRegistry`, `createZoneConfig`, `createZoneContext`, `createHistoryMiddleware`, `createIdleState` |
| `get` | 레지스트리/컬렉션 조회 | ✅ | 10 | `getState`, `getContentRole`, `getContentVisibilitySource`, `getChildRole`, `getCanonicalKey`, `getMacFallbackKey`, `getItemsAndLabels`, `getZoneItems`, `getItemAttribute`, `getDropPosition`, `getFirstDescendantWithAttribute`, `getAncestorWithAttribute`, `getActiveGroupId` |
| `read` | 커널 상태 읽기 (locator 내부) | ✅ | 5 | `readActiveZoneId`, `readZone`, `readFocusedItemId`, `readSelected`, `readSelection` |
| `find` | 조건 탐색 (없으면 null) | ✅ | 3 | `findBestCandidate`, `findFocusableItem`, `findItemElement`, `findZoneByItemId`, `findItemCallback` |
| `sense` | DOM→원시데이터 | ❌ | 2 | `senseKeyboard`, `senseMouseDown`, `senseClickTarget` |
| `extract` | 원시→구조화 | ✅ | 2 | `extractMouseInput`, `extractDropPosition` |
| `ensure` | 없으면 초기화 | ❌ | 1 | `ensureZone` |
| `apply` | 규칙 적용→상태 변경 | ❌ | 3 | `applyFollowFocus`, `applyFocusPush`, `applyFocusPop` |
| `set` | 값 직접 설정 | ❌ | 2 | `setDispatching`, `setDisabled`, `setError`, `setItemCallback` |
| `register` | 레지스트리 추가 | ❌ | 2 | `registerAppSlice`, `ZoneRegistry.register`, `FieldRegistry.register`, `Keybindings.register` |
| `reset` | 초기화 | ❌ | 2 | `resetAllAppSlices`, `resetTypeaheadBuffer`, `FieldRegistry.reset` |
| `validate` | 유효성 검사 | ✅ | 1 | `validateField` |
| `generate` | 유니크 ID 생성 | ❌ | 2 | `generateZoneId`, `generateGroupId` |
| `is` | boolean 질의 | ✅ | 6 | `isDispatching`, `isClickExpandable`, `isKeyDelegatedToOS`, `isEditingElement`, `isDisabled`, `isExpandable` |
| `has` | 보유 여부 | ✅ | 1 | `ZoneRegistry.has`, `Keybindings.has` |
| `clear` | 삭제/초기화 | ❌ | 2 | `clearAll`, `clearFieldDOM`, `clearItemCallback`, `TriggerOverlayRegistry.clear` |
| `bind` | 요소 연결 | ❌ | 1 | `bindElement` |
| `normalize` | 표준화 변환 | ✅ | 1 | `normalizeKeyDefinition` |
| `notify` / `notifyHandler` | 토스트 알림 | ❌ | 1 | `notifyHandler` |
| `unregister` | 등록 해제 | ❌ | 1 | `ZoneRegistry.unregister`, `FieldRegistry.unregister` |
| `subscribe` | 구독 | ❌ | 1 | `ZoneRegistry.subscribe` |
| `travel` | 시간 여행 | ❌ | 0 | (inspector에 위임) |
| `begin` / `end` | 트랜잭션 경계 | ❌ | 1쌍 | `beginTransaction`, `endTransaction` |
| `use` | React hook | — | 1 | `useFieldRegistry` |
| `strategy` | 전략 선택 | ✅ | 1 | `strategyNeedsDOMRects` |

### 1.3 Noun (도메인 명사)

| Key | Meaning | Count | Appears In |
|-----|---------|-------|------------|
| `Zone` | ZIFT 영역 | 30+ | `ZoneState`, `ZoneEntry`, `ZoneRegistry`, `ZoneRole`, `ZoneCallback`, `ZoneCursor`, `ZoneOptions`, `ZoneContextValue`, `ZoneOrderEntry`, `ensureZone`, `createZoneConfig/Context`, `buildZoneEntry`, `readZone`, `activeZoneId` |
| `Item` | ZIFT 데이터 | 15+ | `ItemState`, `ItemAttrs`, `ItemResult`, `ItemCallbacks`, `ItemOverrides`, `findFocusableItem`, `computeItem`, `resolveItemId`, `findItemElement` |
| `Field` | ZIFT 편집 | 10+ | `FieldType`, `FieldValue`, `FieldTrigger`, `FieldConfig`, `FieldState`, `FieldEntry`, `FieldRegistry`, `FieldConfigInputs`, `FieldCommandFactory`, `FieldKeyContext`, `OS_FIELD_*` |
| `Trigger` | ZIFT 액션 | 8 | `TriggerRole`, `TriggerOverlayRegistry`, `TriggerConfig`, `TriggerOpenConfig`, `TriggerFocusConfig`, `TriggerAriaConfig`, `TriggerAttrs`, `TriggerClickInput`, `resolveTriggerClick`, `resolveTriggerRole`, `buildTriggerKeymap` |
| `Focus` | 포커스 시스템 | 10+ | `FocusGroupConfig`, `FocusStackEntry`, `FocusTarget`, `FocusTargetInfo`, `FocusCandidate`, `FocusDirection`, `focusHandler`, `applyFocus*`, `resolveFocusTarget` |
| `Navigate` | Zone 내 이동 | 6 | `NavigateConfig`, `NavigateEntry`, `NavigateResult`, `resolveNavigate`, `OS_NAVIGATE` |
| `Tab` | Zone 간 이동 | 5 | `TabConfig`, `TabDirection`, `TabBehavior`, `resolveTab*`, `OS_TAB` |
| `Select` / `Selection` | 선택 | 5 | `SelectConfig`, `SelectMode`, `resolveSelectMode`, `OS_SELECT*`, `readSelection` |
| `Dismiss` | 닫기/해제 | 3 | `DismissConfig`, `DismissBehavior`, `resolveEscape` |
| `Expand` | 확장/축소 | 4 | `ExpandConfig`, `ExpandAction`, `ExpandResult`, `resolveExpansion` |
| `Overlay` | 오버레이 계층 | 3 | `OverlayEntry`, `OS_OVERLAY_*`, `TriggerOverlayRegistry` |
| `Keyboard` | 키보드 입력 | 4 | `KeyboardInput`, `resolveKeyboard`, `senseKeyboard`, `KeybindingItem` |
| `Mouse` | 마우스 입력 | 4 | `MouseInput`, `MouseDownSense`, `resolveMouse`, `extractMouseInput` |
| `Pointer` | 포인터 (드래그/슬라이더) | 4 | `PointerInput`, `PointerMoveInput`, `resolvePointer*` |
| `Clipboard` | 클립보드 | 3 | `ClipboardInput`, `ClipboardResult`, `resolveClipboard` |
| `Key` / `Keymap` / `Keybinding` | 키 매핑 | 6 | `KeyBinding`, `KeyResolveContext`, `KeybindingRegistry`, `KeymapConfig`, `Keymap`, `KeymapValue`, `getCanonicalKey` |
| `Drag` | 드래그앤드롭 | 3 | `DragState`, `OS_DRAG_*`, `DropSenseInput` |
| `Value` | 값 위젯 (slider/spinbutton) | 4 | `ValueConfig`, `ValueAction`, `ValueChangeResult`, `OS_VALUE_CHANGE`, `SliderValueInput` |
| `Toast` / `Notification` | 알림 | 3 | `NotificationType`, `NotificationEntry`, `OS_NOTIFY*` |
| `History` | Undo/Redo | 3 | `HistoryEntry`, `HistoryState`, `createHistoryMiddleware` |
| `Gesture` | 포인터 제스처 | 3 | `GesturePhase`, `GestureState`, `GestureResult` |
| `App` / `AppState` | 앱 프레임워크 | 4 | `AppState`, `AppSliceConfig`, `AppSliceHandle`, `AppModule` |
| `Typeahead` | 타자 탐색 | 2 | `typeaheadFallbackMiddleware`, `resolveTypeahead`, `resetTypeaheadBuffer` |
| `Interaction` | 상호작용 기록 | 2 | `InteractionRecord`, `InteractionObserver` |

### 1.4 Suffix (타입 접미사)

| Key | Meaning | Count | Appears In |
|-----|---------|-------|------------|
| `Config` | 동작 설정 | 14 | `NavigateConfig`, `TabConfig`, `SelectConfig`, `DismissConfig`, `ProjectConfig`, `ExpandConfig`, `ValueConfig`, `FocusGroupConfig`, `TriggerConfig`, `TriggerOpenConfig`, `TriggerFocusConfig`, `TriggerAriaConfig`, `FieldConfig`, `KeymapConfig`, `AppSliceConfig` |
| `Entry` | 레지스트리 저장 단위 | 6 | `ZoneEntry`, `OverlayEntry`, `NotificationEntry`, `FieldEntry`, `HistoryEntry`, `ZoneOrderEntry`, `FocusStackEntry` |
| `Result` | 함수 반환 결과 | 7 | `ResolveResult`, `NavigateResult`, `EscapeResult`, `ExpandResult`, `ValueChangeResult`, `ItemResult`, `GestureResult`, `ClipboardResult`, `ValidationResult` |
| `State` | 가변 상태 | 6 | `OSState`, `ZoneState`, `DragState`, `FieldState`, `HistoryState`, `GestureState`, `ItemState` |
| `Input` | resolve 입력 구조체 | 8 | `KeyboardInput`, `MouseInput`, `ClickInput`, `ClipboardInput`, `PointerInput`, `PointerMoveInput`, `TriggerClickInput`, `SliderValueInput`, `FieldConfigInputs`, `DropSenseInput` |
| `Payload` | 커맨드 인자 | 4 | `OSNavigatePayload`, `OSFocusPayload`, `OSSelectPayload`, `OSActivatePayload` |
| `Handle` | API 핸들 | 1 | `AppSliceHandle` |
| `Callback(s)` | 이벤트 핸들러 | 3 | `ZoneCallback`, `ZoneCallbacks`, `ItemCallbacks` |
| `Attrs` | DOM 속성 객체 | 3 | `ItemAttrs`, `TriggerAttrs`, `ContainerProps` (⚠️) |
| `Registry` | 정적 레지스트리 | 4 | `ZoneRegistry`, `FieldRegistry`, `TriggerOverlayRegistry`, `KeybindingRegistry` |
| `Factory` | 커맨드 생성 함수 | 1 | `FieldCommandFactory` |
| `Context` | 실행 환경 | 3 | `KeyResolveContext`, `ZoneContextValue`, `FieldKeyContext`, `ModuleInstallContext` |
| `Overrides` | 선택적 오버라이드 | 1 | `ItemOverrides` |
| `Options` | 선택적 설정 | 1 | `ZoneOptions` |
| `Sense` | DOM 감지 결과 | 1 | `MouseDownSense` |
| `Observer` | 관찰 콜백 | 1 | `InteractionObserver` |
| `Record` | 기록 단위 | 1 | `InteractionRecord` |
| `Union` | 유니온 타입 | 1 | `OSCommandUnion` |
| `Type` | enum-like 타입 | 3 | `FieldType`, `NotificationType`, `OSCommandType` |

### 1.5 Constant Naming

| Pattern | Count | Examples |
|---------|-------|---------|
| `OS_` + SCREAMING_SNAKE | 36 | `OS_NAVIGATE`, `OS_FOCUS`, `OS_FIELD_START_EDIT` |
| `DOM_` + SCREAMING_SNAKE | 5 | `DOM_ITEMS`, `DOM_RECTS`, `DOM_ZONE_ORDER` |
| `ZONE_` + SCREAMING_SNAKE | 1 | `ZONE_CONFIG` |
| `DEFAULT_` + SCREAMING_SNAKE | 13 | `DEFAULT_NAVIGATE`, `DEFAULT_CONFIG` |
| `NOOP` | 1 | `NOOP` (chainResolver sentinel) |
| `ROLE_FIELD_TYPE_MAP` | 1 | role→fieldType 매핑 |

---

## 2. 이상 패턴 리포트

### 2.1 동의어 충돌

| 의미 | 공존 Key | 판정 |
|------|---------|------|
| "결과 타입" | `Result` vs `Sense` | **경미** — `MouseDownSense`만 `Sense` 사용. 나머지는 모두 `Result`. `Sense`는 동사 `sense`의 명사화지만 다른 sense 결과는 `SenseData`가 아님 |
| "DOM 속성 객체" | `Attrs` vs `Props` | **⚠️ 충돌** — `ItemAttrs`, `TriggerAttrs`는 `-Attrs`이지만 `ContainerProps`는 `-Props`. 같은 "DOM 속성 계산 결과"에 두 접미사 공존 |
| "설정" | `Config` vs `Options` | **의도적 구분** — `Config`=필수 구조화 설정, `Options`=선택적 오버라이드. naming.md 규칙 부합 |
| "초기화" | `reset` vs `clear` | **의도적 구분** — `reset`=초기 상태로 복원, `clear`=비움(빈 상태). `resetAllAppSlices`(초기값 복원) vs `clearAll`(레지스트리 전체 삭제) |
| "컨텍스트 타입" | `Context` vs `ContextValue` | **경미** — `ZoneContextValue`만 `Value` 접미. React createContext 관용어 (`XxxContextValue`). 나머지 Context 타입과 구분 의도 |

### 2.2 의미 과적 (Overloading)

| Key | 의미 1 | 의미 2 | 심각도 |
|-----|--------|--------|--------|
| `resolve` | 입력→커맨드 결정 (1-listen) | 상태 보정 (`resolveItemId`, `resolveSelection`, `resolveElement`) | **경미** — 전자는 "외부 입력 분석", 후자는 "stale 데이터 보정". 둘 다 "판단을 수반하는 변환"으로 `resolve` 범위 내 |
| `Entry` | 레지스트리 저장 단위 (`ZoneEntry`, `FieldEntry`) | 네비게이션 진입 방식 (`NavigateEntry`) | **⚠️ 충돌** — `NavigateEntry`의 `Entry`는 "first/last/restore/selected" 진입 전략. 접미사 `Entry`와 의미 충돌. `NavigateEntryMode` 또는 `EntryStrategy`가 명확 |
| `Type` | TypeScript 타입 (`FieldType`, `OSCommandType`) | 커맨드 type 문자열 (`getCommandTypes`) | **허용** — 전자는 타입 이름 접미사, 후자는 메서드 이름. 문맥으로 구분 |

### 2.3 고아 Key (1회만 등장)

| Key | 등장처 | 판정 |
|-----|--------|------|
| `Prettify` | (kernel에만 존재) | — |
| `normalize` | `normalizeKeyDefinition` | **정당** — 키 표기 표준화. 유틸성 |
| `strategy` | `strategyNeedsDOMRects` | **어색** — `needsDOMRects(strategy)` 형태가 자연스러움. 하지만 내부 유틸이라 영향 낮음 |
| `canonical` | `getCanonicalKey` | **정당** — 키보드 키 정규화 관용어 |
| `Project` | `ProjectConfig`, `DEFAULT_PROJECT` | **⚠️ 의미 모호** — "프로젝트"가 아니라 "투영(projection)" 설정. `virtualFocus`, `autoFocus` 관련. 코드 읽는 사람이 "프로젝트 설정?"으로 오해할 수 있음 |
| `Idle` | `createIdleState` | **정당** — 제스처 상태 머신의 초기 상태 |
| `mac` | `macFallbackMiddleware`, `getMacFallbackKey` | **정당** — macOS 전용 키 처리 |
| `Ownership` | `fieldKeyOwnership.ts` (파일명) | **정당** — Field가 키를 "소유"하는지 결정하는 로직 |
| `Container` | `ContainerProps`, `computeContainerProps` | **고아** — Zone의 DOM 컨테이너 속성. `ZoneAttrs` / `computeZoneAttrs`가 ZIFT 어휘 일관성 있음 |

### 2.4 `read*` 함수 잔존 확인

| 함수 | 위치 | 외부 사용 |
|------|------|-----------|
| `readActiveZoneId` | `3-inject/readState.ts` → `compute.ts` re-export | `page.ts` 내부 (locator 구현체) |
| `readZone` | 동상 | 동상 |
| `readFocusedItemId` | 동상 | 동상 |
| `readSelected` | 동상 | 동상 |
| `readSelection` | 동상 | 동상 |

> **현황**: 5개 `read*` 함수 모두 `page.ts` locator 내부 구현에만 사용. 테스트 코드에서 직접 호출 없음. naming.md에서 `read` 동사 폐기 결정(이번 세션)과 일관. 외부 API 아님.

### 2.5 naming.md 규칙 위반

| 규칙 | 위반 | 심각도 |
|------|------|--------|
| `Attrs` 접미사 통일 | `ContainerProps` — `Attrs` 아닌 `Props` 사용 | **경미** — React 관용어(`Props`)와 ZIFT 어휘(`Attrs`) 충돌 |
| `Entry` 접미사 = 레지스트리 저장 | `NavigateEntry` = 진입 전략 | **경미** — 의미 과적 |
| `OS_COMMANDS` 키 네이밍 | `OS_COMMANDS.COPY` 등 13개 키에 `OS_` 접두사 누락 (naming.md §3 경고) | **기존 이슈** — 이미 naming.md에 기록됨 |
| `ProjectConfig` 의미 모호 | "투영" vs "프로젝트" | **경미** — 기존 코드 안정성 우선 |

---

## 3. 구조적 발견

### 3.1 파이프라인 동사 일관성

```
1-listen: sense → extract → resolve    ✅ naming.md §4 파이프라인 완벽 준수
2-resolve: resolve + normalize + get    ✅ 키 해석 도메인에 적합
3-inject:  compute + build + read + get ✅ 상태 계산/조립/조회
4-command: OS_* + resolve + apply       ✅ 커맨드 핸들러 + 순수 판단 분리
5-effect:  clear (DOM 정리)             ✅ 부수효과 최소
```

### 3.2 ZIFT 명사 분포

| ZIFT | engine/ | schema/ | 1-listen | 2-resolve | 3-inject | 4-command |
|------|---------|---------|----------|-----------|----------|-----------|
| Zone | ●●● | ●● | ● | | ●● | ●● |
| Item | ● | ● | | | ●● | ● |
| Field | ●● | ● | | ●● | ● | ●● |
| Trigger | ●● | | ● | | ● | |

> Zone이 가장 넓게 분포. Trigger는 engine(registry) + 1-listen에 집중.

### 3.3 Registry 패턴 일관성

4개 Registry 모두 **정적 싱글턴 + 메서드 집합** 패턴:

| Registry | Methods | 패턴 |
|----------|---------|------|
| `ZoneRegistry` | register/unregister/get/has/keys/... | `const ZoneRegistry = { ... }` |
| `FieldRegistry` | get/register/unregister/updateValue/... | `const FieldRegistry = { ... }` |
| `TriggerOverlayRegistry` | set/clear/get | `const TriggerOverlayRegistry = { ... }` |
| `Keybindings` | register/has/... | `const Keybindings = { ... }` ⚠️ |

> **⚠️ `Keybindings`**: 유일하게 `-Registry` 접미사 없음. 내부에 `createKeybindingRegistry()`로 생성하지만 export 이름은 `Keybindings`. 나머지 3개와 네이밍 패턴 불일치.

---

## 4. 종합 평가

**OS-Core 네이밍은 전반적으로 우수하다.** ~360개 식별자에서 심각한 충돌 없음.

### 잘 지켜진 것
- 파이프라인 동사 규칙 (`sense → extract → resolve → dispatch`) 완벽 준수
- ZIFT 4개 명사 일관적 사용
- `Config`/`Entry`/`Result`/`Input`/`Payload` 접미사 체계적 사용
- `OS_` + SCREAMING_SNAKE 커맨드 네이밍 36개 전수 일관

### 발견 사항 (심각도순)

| # | 이슈 | 심각도 | 권장 |
|---|------|--------|------|
| 1 | `Keybindings` — Registry 접미사 패턴 불일치 | 중 | `KeybindingRegistry`로 통일 검토 |
| 2 | `ContainerProps` — `Attrs` 접미사 불일치 | 경 | `ZoneAttrs` / `computeZoneAttrs` 검토 |
| 3 | `NavigateEntry` — `Entry` 접미사 의미 충돌 | 경 | 현행 유지 (안정성 우선) |
| 4 | `ProjectConfig` — "투영" 의미 모호 | 경 | 현행 유지 |
| 5 | `OS_COMMANDS` 키 `OS_` 접두사 누락 13건 | 기존 | naming.md에 이미 기록됨 |
