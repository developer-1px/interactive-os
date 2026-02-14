---
description: 프로젝트 철학 준수 및 네이밍/구조 일관성을 코드 리뷰하여 위반 사항을 리포트한다
---

1. **프로젝트 원칙 로드**
   - `.agent/rules.md`에서 프로젝트 원칙과 컨벤션을 읽는다.

2. **검사 대상 결정**
   - 사용자가 특정 파일/디렉토리를 지정하면 해당 범위만 검사한다.
   - 지정하지 않으면, **현재 대화에서 LLM이 수정·생성·언급한 파일들**을 대상으로 한다.
     - 이번 세션에서 편집한 파일, 코드 제안에 등장한 파일, 논의에서 언급된 파일을 포함한다.
     - 대화 맥락이 없는 경우(첫 메시지 등)에만 fallback으로 `git diff --name-only HEAD~5`를 사용한다.

3. **철학 준수 검사**
   - **커맨드 원칙**: 모든 인터랙션 prop이 `BaseCommand` 브랜드 타입인가? `() => void` 콜백이 커맨드여야 할 자리에 쓰이지 않았는가?
   - **커널 상태 원칙**: 커널 state 대신 로컬 state나 Zustand를 직접 쓴 곳이 없는가?
   - **표준 인터페이스 원칙**: LLM이 이미 학습한 유명한 패턴을 그대로 쓰는가?
     - ARIA role/attribute 표준 준수 (e.g. `role="listbox"`, `aria-selected`)
     - HTML 시맨틱 요소 활용 (e.g. `<dialog>`, `<nav>`, `<menu>`)
     - 커맨드 패턴은 Redux 액션 형태 (`{ type: string }`)
     - prop 네이밍은 React/DOM 관례 (e.g. `onAction`, `onSelect`, `role`, `id`)
     - 자체 발명한 비표준 인터페이스가 있으면 🔴 위반
   - **100% Type-Strict**: `as any` 우회 없는가? 브랜드 타입이 지켜지는가?
     - `exactOptionalPropertyTypes` 호환 (`?: T | undefined`)
     - 제네릭 제약 (`extends BaseCommand`)으로 타입 안전성 보장
     - `biome-ignore` 주석이 있다면 그 이유가 정당한가?
   - **100% Declarative**: 명령형 코드가 선언형으로 대체 가능한 곳에 쓰이지 않았는가?
     - `document.getElementById()` / `querySelector()` 대신 커널 상태 참조
     - `setTimeout` / `requestAnimationFrame`으로 타이밍 해킹하지 않는가?
     - `useEffect`로 상태 동기화하지 않고 커널의 단방향 흐름을 따르는가?
     - DOM 이벤트 직접 부착(`addEventListener`) 대신 선언적 핸들러
   - **로깅 원칙**: `console.log` 대신 `logger` 사용

4. **네이밍/구조 검사**
   - **파일명**: 번호 prefix 컨벤션 준수 (`1-listeners`, `2-contexts`, `3-commands`, `6-components`)
   - **컴포넌트명**: PascalCase, 역할이 이름에 드러나는가 (e.g. `Zone` not `FocusArea`)
   - **커맨드명**: UPPER_SNAKE_CASE, 동사+목적어 패턴 (e.g. `OVERLAY_CLOSE`, `STACK_PUSH`)
   - **타입명**: 접미사 컨벤션 (`Config`, `Props`, `Entry`, `State`)
   - **import 경로**: `@/os-new/` alias 사용, 상대 경로 깊이 3 이상 금지

5. **리포트 작성**
   - `docs/0-inbox/YYYY-MMDD-HHmm-[report]-code-review.md`에 저장한다.
   - 분류:
     - 🔴 **철학 위반**: 설계 원칙에 어긋남 (즉시 수정 필요)
     - 🟡 **네이밍/구조**: 컨벤션 불일치 (리팩토링 권장)
     - 🔵 **개선 제안**: 더 나은 패턴 제안
   - 각 항목: 파일, 라인, 현재 코드, 문제점, 수정 제안

6. **사용자에게 리포트 전달**
   - 리포트 경로와 요약 통보.
   - 🔴 항목이 있으면 즉시 수정 여부를 묻는다.
