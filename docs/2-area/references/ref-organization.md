# Organization Reference

> 프로젝트 구조, 문서 체계, 코드 아키텍처의 조직 원칙 모음.

---

## PARA Method

> 정보를 Projects, Areas, Resources, Archives 4가지 범주로 분류하는 개인 지식 관리 시스템.

**출처**: Tiago Forte (Building a Second Brain, 2022)

| 범주 | 정의 | 특성 |
|------|------|------|
| **Projects** | 기한이 있는 목표 | 시작과 끝이 있다 |
| **Areas** | 지속적으로 관리하는 영역 | 기한 없이 계속 유지 |
| **Resources** | 관심 주제의 참고 자료 | 불변, 외부에서 온 지식 |
| **Archives** | 완료되거나 비활성화된 것 | 검색 가능하되 시야에서 제거 |

**우리의 용법**: `docs/` 폴더 구조의 최상위 체계. PARA의 4범주가 `docs/`의 폴더에 매핑된다:

| PARA | docs/ 매핑 | 역할 |
|------|-----------|------|
| Projects | `1-project/` | BOARD.md 기반 활성 프로젝트 |
| Areas | `2-area/praxis/` | 진화하는 실천 지혜 (Living Document) |
| Resources | `3-resource/` | 불변 외부 지식 (W3C spec, 프레임워크 정의 등) |
| Archives | `archive/YYYY/MM/WNN/` | 완료된 프로젝트의 잔여물, 주차별 flat 매장 |

`/archive` 워크플로우가 PARA의 라이프사이클을 구현: 프로젝트 완료 시 지식을 `official/`(시스템 지식)과 `rules.md`(규칙)로 환류하고, 나머지는 `archive/`로 매장. `/para` 워크플로우는 전체 docs/ 구조의 PARA 정합성을 점검.

**참조**: `CLAUDE.md` 문서 토폴로지, `/archive`, `/para`, 네이밍 섹션 "구조 어휘 — 세 세계"

---

## WBS — Work Breakdown Structure

> 프로젝트의 전체 범위를 계층적으로 분해하여 관리 가능한 작업 단위(Work Package)까지 나누는 기법.

**출처**: PMI PMBOK (Project Management Body of Knowledge, 6th Edition)

**우리의 용법**: `/divide`의 분해 목표. "MECE Issue Tree decomposed to Work Package level (WBS)." 모든 리프 노드가 Clear(자명한 해법)이 될 때까지 분해하며, 각 리프는 하나의 Work Package — 독립적으로 실행·검증 가능한 최소 작업 단위. `/reframe`에서도 한국어 "조각"을 WBS의 "Work Package"로 매핑. Progressive Elaboration(점진적 상세화)도 PMBOK 개념으로, `/divide`의 최소 3 iteration 게이트에 적용.

**참조**: `/divide` Theoretical Basis, `/reframe` Framework Mapping 예시

---

## FSD — Feature-Sliced Design

> 프론트엔드 프로젝트를 계층(app → processes → pages → widgets → features → entities → shared)으로 조직하는 아키텍처 방법론.

**출처**: Feature-Sliced Design (feature-sliced.design, 러시아 프론트엔드 커뮤니티에서 시작, 2018~)

**우리의 용법**: Apps 계층의 어휘 체계. OS 코드는 자체 파이프라인(번호 접두사: `1-listeners/` → ... → `6-components/`), 문서는 토폴로지(`official/` + `2-area/` + `3-resource/` + `archive/`), 그리고 앱 코드는 FSD를 따른다.

```
app.ts         ← 앱 정의 (상태, 커맨드, Zone 바인딩)
  widgets/     ← 조합된 UI 블록
  features/    ← 사용자 시나리오 단위
  entities/    ← 도메인 모델
  shared/      ← 공유 유틸리티
```

"표준이 있으면 발명하지 않는다" (Project #7) — FSD라는 검증된 체계의 어휘를 그대로 사용하여 학습 비용을 0으로 만든다.

**참조**: `CLAUDE.md` 네이밍 "구조 어휘 — 세 세계", `.agent/rules.md` 네이밍 섹션

---

## W3C / APG Standards

> W3C Web Accessibility Initiative의 ARIA Authoring Practices Guide. 위젯별 키보드 상호작용, 포커스 관리, ARIA 속성의 행동 스펙을 정의한다.

**출처**: W3C WAI (Web Accessibility Initiative), APG (ARIA Authoring Practices Guide, https://www.w3.org/WAI/ARIA/apg/)

**우리의 용법**: "표준은 행동 스펙이다. 구현 방법이 아니다" (Project #10). APG가 정의한 행동은 따르되, 구현은 OS가 자체 메커니즘(Enter→action→command 파이프라인 등)으로 제공한다. "브라우저가 이미 하니까 위임"은 OS의 존재 이유를 부정한다.

검증 #10: "Focus/Keyboard 동작은 APG가 스펙이다." 구현 전에 APG 해당 패턴을 반드시 읽는다. 순서:
1. APG 패턴 읽기
2. 요구사항을 테스트로 인코딩
3. 테스트를 통과하는 코드 작성

"그럴 것 같은" 동작이 아니라 "스펙이 요구하는" 동작을 구현한다.

**참조**: `CLAUDE.md` Project #10, 검증 #10, `.agent/rules.md` Project #10, 검증 #10, `docs/official/os/aria-checklist.md`

---

## Rust RFC Format

> 기술적 변경 제안을 구조화된 문서로 작성하여, 의사결정의 근거와 대안을 영구 기록하는 포맷.

**출처**: Rust Language Community (RFC Process, https://github.com/rust-lang/rfcs, 2014~)

| 섹션 | 역할 |
|------|------|
| Summary | 한 줄 요약 |
| Motivation | 왜 필요한가 |
| Guide-level explanation | 사용자 관점 설명 |
| Reference-level explanation | 구현 상세 |
| Drawbacks | 단점 |
| Alternatives | 고려한 대안 |
| Unresolved questions | 미해결 질문 |

**우리의 용법**: 직접 "Rust RFC"로 명명하지는 않지만, 이 포맷의 구조가 여러 워크플로우에 반영되어 있다. `/blueprint`의 7단계(Goal → Why → Challenge → Ideal → Inputs → Gap → Execution Plan)는 Rust RFC의 Motivation → Guide-level → Reference-level → Drawbacks → Alternatives → Unresolved와 유사한 구조. `/discussion`의 Toulmin 결론(Claim + Data + Warrant + Backing + Rebuttal + Open Gap)도 RFC의 의사결정 기록과 동일한 목적. `/project`의 BOARD.md(Context + Risks + Unresolved + Ideas)도 RFC 정신을 계승. "의사결정의 근거를 영구 기록한다"는 원칙이 공통.

**참조**: `/blueprint`, `/discussion` 결론 포맷, `/project` BOARD.md 포맷
