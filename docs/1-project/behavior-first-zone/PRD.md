# PRD — behavior-first-zone

> Single Source of Truth for WHAT

## 1. 문제 정의

현재 OS의 Zone 구성은 **ARIA Role → 행동 결정** 구조.
Role preset이 ARIA APG의 SHOULD(권장)를 MUST(필수)로 격상시켜,
앱 요구사항과 불일치하는 기본 행동을 강제한다.

**실증**: Todo listbox에서 typeahead가 자동 활성화 → 동적 작업 목록에 부적합.

## 2. 목표 상태

**Behavior가 1급 시민, Role은 편의 preset.**

```
Layer 1: Behavior primitives (독립 원자)
Layer 2: Role = behavior 조합의 별명 (preset)
Layer 3: 앱 개발자 API (role preset 또는 직접 조합)
```

## 3. 기능 요구사항

### FR-1: rolePreset에서 SHOULD 행동을 opt-in으로 변경

**현재**: listbox/tree preset에 `typeahead: true` 포함
**변경**: `typeahead: true` 제거 (DEFAULT_NAVIGATE가 이미 false)

**Acceptance Criteria**:
- [ ] AC-1.1: `resolveRole("listbox").navigate.typeahead === false`
- [ ] AC-1.2: `resolveRole("tree").navigate.typeahead === false`
- [ ] AC-1.3: `resolveRole("combobox").navigate.typeahead === false` (이미 false)
- [ ] AC-1.4: 기존 rolePreset 테스트 통과 (typeahead 관련 assertion 추가)
- [ ] AC-1.5: Todo의 `options: { navigate: { typeahead: false } }` override 제거 (불필요해짐)

### FR-2: zone.bind()에 options 지원 (이미 구현됨)

**현재**: defineApp.bind.ts에 options 전달 경로 추가됨 (이번 세션)
**검증**: 동작 확인 후 유지

**Acceptance Criteria**:
- [ ] AC-2.1: `zone.bind({ role: "listbox", options: { navigate: { typeahead: true } } })` 작동
- [ ] AC-2.2: options 없이 `zone.bind({ role: "listbox" })` 시 preset 기본값 적용

### FR-3: roleRegistry 문서화 — MUST vs SHOULD 구분

**현재**: 주석에 "recommended" 언급하면서 기본값으로 활성화
**변경**: 주석에서 MUST/SHOULD를 명확히 구분, SHOULD는 "opt-in via options"로 안내

**Acceptance Criteria**:
- [ ] AC-3.1: listbox 주석에 "typeahead: opt-in (APG SHOULD, not default)" 명시
- [ ] AC-3.2: tree 주석에 동일 명시

## 4. 엣지 케이스

| # | 시나리오 | 예상 행동 |
|---|---------|-----------|
| E-1 | role 없이 zone 사용 | DEFAULT 값 적용 (typeahead: false) |
| E-2 | role:"listbox" + options.navigate.typeahead:true | typeahead 활성화 (override 우선) |
| E-3 | role:"combobox" (이미 typeahead:false) | 변경 없음 |
| E-4 | role:"tree" in Builder (파일 트리) | typeahead 비활성화 (opt-in 필요 시 options로) |

## 5. Phase 1 범위 (이번 실행)

Phase 1은 **preset 감사**만 수행. API 재설계(behavior primitive, aria 분리)는 Phase 2로.

| 변경 대상 | 변경 내용 |
|-----------|-----------|
| `roleRegistry.ts` | listbox, tree에서 `typeahead: true` 제거 |
| `rolePresets.test.ts` | typeahead 검증 assertion 추가 |
| `todo/app.ts` | `options: { navigate: { typeahead: false } }` 제거 (불필요) |
| `roleRegistry.ts` 주석 | MUST vs SHOULD 구분 명시 |

## 6. 향후 Phase (백로그)

- **Phase 2**: Behavior primitive 정의 + composition API
- **Phase 3**: `role` → `aria` + behavior 분리
- **Phase 4**: 기존 앱 마이그레이션
