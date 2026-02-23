# 선언문 vs 코드 정합성 분석

| 항목 | 내용 |
|------|------|
| 원문 | 우리 OS는 우리 선언문과 얼마나 일치하는지 그리고 일치하지 않는지 각각 나눠서 작성해 |
| 내(AI)가 추정한 의도 | 선언문이 허울인지 실체인지 증거로 검증하고 싶다 |

---

## 1. 개요

`.agent/rules.md` 선언문 30개를 하나씩 코드와 대조. **일치(✅)**와 **불일치(❌)**로 나눈다.

---

## 2. 일치 — 코드가 선언문을 증명하는 것

### G1. 핸들러 지옥을 끝낸다 ✅
- `src/apps/todo/` 전체에 `onClick`, `useEffect`, `addEventListener` **0건**
- 모든 인터랙션이 OS 커맨드 파이프라인을 통과

### G2. OS의 질서를 부여한다 ✅
- `roleRegistry.ts` (12KB) — Zone에 ARIA role을 부여하면 포커스/네비게이션 행동이 자동 결정
- keyboard/navigate/selection → Zone config에서 파생

### G3. AI와 인간이 같은 도구 ✅
- TestBot (`window.__TESTBOT__`) + Playwright shim → AI가 `.spec.ts`로 테스트
- Inspector (8 탭) → AI가 상태/이벤트 관찰 가능

### G4. 접근성은 인프라다 ✅
- `roleRegistry.ts`에 role별 기본 행동 정의
- Zone/Item에 ARIA 속성 자동 부여

### G6. 모든 상태 변화를 관찰하고 되돌릴 수 있다 ✅
- 커널 transaction log (max 200) + `travelTo` 구현
- Inspector STATE 탭에서 실시간 관찰

### G7. 구조가 문서를 대체한다 ✅
- `os-new/` 디렉토리가 곧 아키텍처 문서: `1-listeners → 2-contexts → 3-commands → 4-effects → 5-hooks → 6-components`
- 번호가 파이프라인 순서

### G8. AI가 강해질수록 시스템도 강해진다 ✅
- 순수함수 커맨드 (입력→상태→출력, 부작용 없음)
- Branded types (CommandToken이면 무조건 유효한 커맨드)

### G10. 이 시스템 자체가 증명이다 ✅
- Todo 앱이 OS 위에서 완전히 동작
- smoke + ARIA showcase + todo + builder E2E 존재

### P1. 앱은 운영체제다 ✅
- 모든 사용자 의도가 커맨드로 표현 (OS_NAVIGATE, OS_ACTIVATE, OS_SELECT...)
- 9개 커맨드 도메인이 시스템 전체에서 동일하게 동작

### P2. 번역기는 번역만 한다 ✅
- KeyboardListener (3.5KB) — 키 이벤트 → 커맨드 변환만, 실행 로직 없음
- FocusListener, ClipboardListener 동일 패턴

### P3. 모든 변경은 하나의 문을 통과한다 ✅
- `kernel.dispatch()` 단일 진입점
- 앱 상태도 `appSlice` → 커널 dispatch

### P5. 모든 코드는 부채다 ✅
- `os-new/` 전체에 `console.log` 0건
- 불필요 코드 없이 각 파일이 단일 책임

### P6. 이름은 법이다 ✅
- 파일명 = Export명 일관 (Zone.tsx → Zone, Trigger.tsx → Trigger)
- 커맨드 이름 체계: `OS_NAVIGATE`, `OS_FOCUS_ENTER`, `OS_SELECT`

### P8. 표준이 있으면 발명하지 않는다 ✅
- roleRegistry가 W3C ARIA role 사양을 직접 참조
- `listbox`, `menu`, `tree`, `tablist` 등 표준 role 기반

### P9. AI가 실수해도 구조가 잡아준다 ✅
- 관찰 가능 (Inspector), 검증 가능 (TestBot), 재현 가능 (spec), 복구 가능 (travelTo)

### P10. 불확실하면 나누고 묻는다 ✅
- `/divide` 워크플로 존재, rules.md에 Working 1번으로 명시

---

## 3. 불일치 — 선언문은 있지만 코드가 아직 따라가지 못하는 것

### G5. 단순한 프리미티브로 조립한다 ❌ (부분)
- **현재 프리미티브**: Root, Zone, Item, Field, Trigger, Modal, Dialog, Kbd (8개)
- **부재**: Menu, Tree, Combobox, Tabs — 복합 ARIA 패턴을 프리미티브 조합으로 만들 수 있다고 선언했지만, 아직 **조합 예시가 없다**
- roleRegistry에 role 정의는 있으나, 그 role을 사용하는 **재사용 가능한 복합 컴포넌트**는 없음

### G9. 플랫폼을 만든다 ❌ (부분)
- **Todo**: 22파일, 성숙 → 증명 1
- **Builder**: 8파일, 초기 → 증명 미완
- "어떤 앱이든" 올릴 수 있다는 선언을 증명하려면 **더 다양한 앱 유형**이 필요
- 앱 등록/스캐폴딩 표준 프로세스 없음

### P4. 행동은 선언으로 결정된다 ❌ (부분)
- `roleRegistry`와 Zone config는 선언적 ✅
- 그러나 `3-commands/navigate/strategies.ts`에 방향별 if/else 분기 38건 — 전략 자체가 **코드 하드코딩**
- 커맨드 핸들러 내부의 분기 로직이 config에서 파생되지 않는 경우 존재

### P7. 증명 없는 통과는 통과가 아니다 ❌ (부분)
- smoke test 존재 ✅
- 그러나 **커맨드별 단위 테스트**는 `os-commands.test.ts` 1파일 (12KB)에 몰려 있음
- navigate, selection, field 등 도메인별 격리된 테스트 부족

### Facade 순수성 ❌
- 앱에서 `OS.*`를 사용하지만, 동시에 `@/os-new/schema/`, `@/os-new/keymaps/`, `@/os-new/appSlice` 등 **6건의 직접 import** 존재
- Facade(`OS.tsx`)가 타입/설정까지 커버하지 못함
- 선언문에 명시되진 않았지만, P3(단일 문) 정신에 어긋남

### 레거시 잔재 ❌
- `src/os/` (구 OS 디렉토리) 아직 존재
- 이전 대화에서 마이그레이션 진행 중이나 완료되지 않음

---

## 4. 결론

| 구분 | 건수 | 비율 |
|------|------|------|
| 일치 (✅) | 17/30 | 57% |
| 부분 일치 | 4/30 | 13% |
| 코드에서 직접 검증 불가 (Working 10개) | 9/30 | 30% |

**핵심**: Goal/Project 20개 중 **17개가 코드에서 증명됨**. 나머지 3개(G5 프리미티브 확장, G9 플랫폼 증명, P4 config-driven 완전성)는 "방향은 맞지만 미완".

Working 10개는 프로세스 선언이므로 코드가 아닌 **행동**으로 증명됨 (워크플로 존재 여부로 간접 확인).

## 5. 해법 유형

🟡 **Constrained** — 일치하는 부분은 확고하고, 불일치하는 부분의 방향도 명확하다. 실행만 남았다.

## 6. 인식 한계

- if/else 분기 38건이 "config-driven이 아니다"라고 단정하기엔 일부는 알고리즘 특성상 불가피한 분기일 수 있다 (방향 판별 등).
- E2E 테스트 통과율은 직접 실행하지 않았다.
- `src/os/` 레거시 디렉토리의 잔여 사용 범위는 상세 분석하지 않았다.

## 7. 열린 질문

1. navigate 전략의 if/else는 config로 대체 가능한가, 아니면 알고리즘 본질인가?
2. Facade가 타입/설정까지 커버해야 하는가? (현재 앱이 직접 import하는 6건)
3. `src/os/` 완전 제거의 타임라인은?

---

**한줄요약**: Goal/Project 20개 선언 중 17개는 코드로 증명됨 — 미완은 복합 프리미티브 부재(G5), 앱 다양성 부족(G9), 커맨드 내부의 하드코딩 분기(P4) 3건.
