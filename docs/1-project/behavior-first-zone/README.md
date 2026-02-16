# behavior-first-zone

## Why

현재 OS의 Zone 설정은 **ARIA Role이 행동을 결정**하는 구조다:
`role: "listbox"` → typeahead ON, vertical nav, single select, escape tab...

이 설계에는 근본적 문제가 있다:
1. **인과관계 역전** — Role(접근성 어노테이션)이 행동(앱 동작)의 원인이 됨
2. **SHOULD→MUST 격상** — APG의 권장사항이 기본값으로 강제됨
3. **부정형 설정** — 원하지 않는 행동을 명시적으로 빼야 함 (override)
4. **LLM 함정** — AI가 ARIA 기반 확신에 빠져 잘못된 기본값을 강화

### 실증 사례
Todo 앱에서 `role: "listbox"` preset이 typeahead를 자동 활성화.
알파벳 기반 typeahead는 정적 선택 목록(국가, 파일)에 적합하지,
동적 사용자 작업 목록(Todo)에는 해가 됨.

## Goals

**Behavior를 1급 시민으로, Role은 편의 preset으로 재정의한다.**

1. Behavior primitive 정의 — 독립적으로 존재하고 조합 가능한 행동 단위
2. Role preset 재구성 — behavior 조합의 편의 별명으로 전환
3. `aria` 속성 분리 — DOM 접근성 어노테이션은 행동과 독립
4. 기존 앱(Todo, Builder 등) 마이그레이션
5. PRD/테스트 정합성 확보

## Scope

### In
- `src/os/registry/roleRegistry.ts` 재설계
- `zone.bind()` API 재설계 (defineApp.types.ts, defineApp.bind.ts)
- `OS.Zone` props 재설계
- `FocusGroup` config 처리 수정
- 기존 zone binding 마이그레이션 (Todo, Builder, Playground 등)
- Typeahead fallback middleware 연동

### Out
- ARIA role 자체의 삭제 (role은 유지, 의미만 변경)
- 새로운 behavior 추가 (기존 행동을 primitive로 분리하는 것이 scope)
- 키보드 이벤트 처리 로직 변경 (KeyboardListener, keybindings)
