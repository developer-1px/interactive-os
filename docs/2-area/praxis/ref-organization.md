# 조직·구조화 기법 레퍼런스

> 워크플로우와 규칙에서 참조되는 조직·구조화 기법 5건의 정의·출처·용법.

---

## PARA Method

> 정보를 4개 범주로 분류하는 디지털 조직 방법론: Projects(진행 중, 기한 있음), Areas(지속적 책임), Resources(참고 자료), Archives(완료/비활성).

**출처**: Tiago Forte, *Building a Second Brain* (2022)
**우리의 용법**: `docs/` 폴더 구조의 근간. `1-project/`(Projects), `2-area/`(Areas), `3-resource/`(Resources), `archive/`(Archives). 단, 원본 PARA를 그대로 쓰지 않고 변형:
- `0-inbox/` 추가: 새 문서는 항상 여기에 먼저 생성
- `5-backlog/` 추가: "언젠가 할 아이디어"
- `6-products/` 추가: Product 계층 (BDD 시나리오, VISION)
- `official/` 추가: 소스코드 토폴로지 동형 문서 (PARA에 없는 개념)
- Archives를 `archive/YYYY/MM/WNN/`으로 시간순 매장 (분류 비용 0)

**참조**: `rules.md` 문서 토폴로지, `archive.md`, `retire.md`, `inbox.md`

---

## WBS (Work Breakdown Structure)

> 프로젝트의 최종 산출물을 계층적으로 분해하여 관리 가능한 작업 단위(Work Package)로 만드는 기법. 각 WP는 추정·할당·추적 가능해야 한다.

**출처**: PMI, *PMBOK Guide* (Project Management Body of Knowledge)
**우리의 용법**: `/divide`의 핵심 기법. Goal에서 역추적하여 Work Package를 도출한다. 각 WP는 MECE해야 하고, Cynefin Clear까지 분해되어야 `/go`로 실행 가능하다. `/project`에서 BOARD.md의 Now/Next/Backlog가 WBS의 계층 구조를 반영한다.
**참조**: `divide.md`, `project.md`

---

## FSD (Feature-Sliced Design)

> 프론트엔드 프로젝트를 계층적 슬라이스로 조직하는 아키텍처 방법론. app → pages → widgets → features → entities → shared 순서로 의존 방향이 내려간다.

**출처**: Feature-Sliced Design community (feature-sliced.design), 러시아 프론트엔드 커뮤니티에서 발전
**우리의 용법**: Apps 영역의 폴더 구조 어휘. `app.ts` → `widgets/` → `features/` → `entities/` → `shared/`. OS 영역은 파이프라인(번호 접두사), Apps 영역은 FSD — 두 세계의 구조 어휘를 구분한다. Builder, Todo 앱이 FSD 구조를 따른다.

| FSD 계층 | 역할 | 의존 방향 |
|----------|------|----------|
| `app.ts` | 앱 진입점, Config 선언 | ↓ |
| `widgets/` | 조합된 UI 블록 | ↓ |
| `features/` | 사용자 시나리오 단위 | ↓ |
| `entities/` | 비즈니스 엔티티 | ↓ |
| `shared/` | 유틸, 타입, 상수 | (최하위) |

**참조**: `rules.md` 네이밍 "구조 어휘 — 세 세계", `CLAUDE.md` 네이밍

---

## W3C / APG Standards

> W3C(World Wide Web Consortium)의 웹 접근성 표준과 APG(ARIA Authoring Practices Guide)의 위젯 패턴 가이드. ARIA role, keyboard interaction, focus management의 행동 스펙을 정의한다.

**출처**: W3C WAI (Web Accessibility Initiative), *ARIA Authoring Practices Guide* (w3.org/WAI/ARIA/apg/)
**우리의 용법**: "Focus/Keyboard 동작은 APG가 스펙이다"(검증#10). 구현 전에 APG 해당 패턴을 읽고, 요구사항을 테스트로 인코딩한 뒤, 코드를 작성한다. "그럴 것 같은" 동작이 아니라 "스펙이 요구하는" 동작을 구현. FocusGroupConfig의 17 role preset이 APG 패턴의 Config 표현. `/audit`에서 APG 계약 위반을 검사.

**구현 순서 (위반 금지)**:
1. APG 패턴 읽기
2. 요구사항을 테스트로 인코딩 (`/red`)
3. 테스트를 통과하는 코드 작성 (`/green`)

**참조**: `rules.md` 검증#10, `audit.md`, `red.md`, `docs/3-resource/aria/`

---

## Rust RFC Format

> Rust 언어 커뮤니티의 기능 제안 형식. Summary → Motivation → Guide-level explanation → Reference-level explanation → Drawbacks → Rationale and alternatives → Prior art → Unresolved questions 구조.

**출처**: Rust RFC process (github.com/rust-lang/rfcs)
**우리의 용법**: `/spec`의 문서 구조가 Rust RFC에서 영감을 받았다. 특히 "Drawbacks"(단점/비용), "Rationale and alternatives"(왜 이 방식인가), "Unresolved questions"(열린 질문)은 `/spec`의 Decision Table, `/discussion`의 Rebuttal/Open Gap에 대응한다. `/inbox`의 제안서 형식에서도 "인식 한계"와 "열린 질문" 섹션이 RFC의 영향.
**참조**: `spec.md`, `discussion.md`, `inbox.md`
