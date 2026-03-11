# Scaffold Insights — 아카이브 정리 중 발견한 구조적 패턴

> 이 문서는 아카이브 정리 실행 중 발견한 애매한 판단, 패턴, 구조적 의문을 누적한다.
> 스캐폴딩 v2 설계의 입력이 된다.

## 형식

```
### I{N}. [한 줄 제목]
- **상황**: 어떤 파일/폴더에서 발견
- **애매함**: 왜 판단이 어려웠는가
- **시사점**: v2 구조에 대한 함의
```

---

### I1. `testbot/` — v1 이전 구조의 유산
- **상황**: W08 testbot/은 v1 `/project` 이전에 만들어진 프로젝트. `0-discussion-journey.md`, `1-discussion-conclusion.md` 같은 번호 접두사 파일이 있음. 현재 `discussions/` 폴더와 공존
- **애매함**: journey/conclusion은 discussion인가 notes인가? 이름만 보면 discussion이지만 `discussions/` 밖에 있음. 구조가 없던 시절의 산물
- **시사점**: v2에서는 "discussion 결론"의 위치가 명확해야 함. `discussions/` 안에 있거나 BOARD Context에 흡수되거나. 별도 root 파일로 두면 분류 불가

### I2. `collection-clipboard/` — discussions 없이 BOARD+README만 있는 프로젝트
- **상황**: BOARD.md + README.md만 있고 discussions가 없음. 삭제 후 빈 폴더 → 폴더 자체 삭제
- **애매함**: 없음. 명확히 삭제
- **시사점**: **프로젝트가 discussion 없이 끝날 수 있다** = 정리 후 폴더 자체가 소멸하는 경우. v2에서 이것은 정상 경로여야 함 (아카이브에 아무것도 안 남는 프로젝트 = 코드가 모든 것을 말하는 깨끗한 프로젝트)

### I3. `testbot/notes/` — notes 안에서 수명이 갈리는 문제
- **상황**: notes/ 안에 plan류 5개(삭제)와 adr-017(보존) 공존. adr은 3 root cause 깊은 진단
- **애매함**: adr-017은 `notes/`가 아니라 `discussions/`에 있었어야 할 문서. 깊은 진단인데 notes에 들어간 이유 = 당시 분류 기준 부재
- **시사점**: **notes/ 폴더가 v1의 근본 문제.** 수명이 다른 문서를 한 폴더에 담으면 정리 시 개별 판단 필요. v2에서 notes/ 해체 또는 수명별 분리 필요

### I4. closed-issues/ — 이슈 문서의 수명이 두 갈래로 갈린다
- **상황**: W10 closed-issues 18개 중 보존 2개(max-update-depth 깊은 진단, paste_selection KPT), 삭제 16개
- **애매함**: "이슈"라는 분류 자체가 수명을 말해주지 않음. 단순 버그 fix(삭제)와 깊은 진단(보존)이 같은 폴더에 있음
- **시사점**: v2에서 이슈를 만들 때 "이건 단순 fix인가, 깊은 진단이 필요한가"를 구분하는 게이트가 필요할 수 있음. 또는 진단 결과가 notes/가 아닌 decisions/에 가야 함

### I5. `notes/` 안의 [proposal]과 [analysis] — 태그가 수명 힌트를 준다
- **상황**: W10 dev-pipeline/notes에 `[proposal]` 2개(보존 — 안 간 길), `audit` 1개(삭제 — 스냅샷). command-config/notes에 `audit` 2개(삭제), `retrospect` 1개(보존)
- **애매함**: 파일명 태그([proposal], [analysis], [plan], [audit])가 수명의 좋은 힌트지만 **폴더가 이를 강제하지 않음**
- **시사점**: v2에서 파일명 태그 대신 **폴더가 수명을 강제**해야 함. 예: `decisions/` = 보존, `execution/` = 삭제. 태그는 폴더 안에서의 부가 분류

### I6. `eliminate-layout-dispatch/eliminate-layout-dispatch/` — 중첩 폴더 문제
- **상황**: 같은 이름의 하위 폴더가 중첩. 분명 스캐폴딩 실수
- **애매함**: 없음. 명확한 버그
- **시사점**: `/project` 스킬이 중복 폴더를 만들지 않는 가드 필요. 또는 프로젝트 이름 검증 단계

### I7. W10의 보존 파일 유형 분포
- **상황**: 178 → 32. 보존 32개의 분류: retrospective 9개, discussions 14개, [analysis]/진단 4개, [proposal]/기각대안 2개, gap-report 1개, decision-table 1개, 기타 1개
- **애매함**: 없음
- **시사점**: **보존 파일의 82%가 discussions(14) + retrospectives(9).** 이 두 유형만 구조적으로 보장하면 나머지 18%(진단, 기각대안, gap)는 소수 예외. v2에서 `discussions/`와 `retrospective.md`는 1급 시민, 나머지는 `decisions/`로 묶으면 충분할 수 있음

### I8. blueprint가 보존되는 경우 — Challenge Matrix가 핵심
- **상황**: W11에서 blueprint 4개 보존(combobox-role, inspector-os-citizen, layer-playground, seal-useComputed). 공통점: 모두 Challenge Matrix(가정 검증 테이블)를 포함
- **애매함**: `/solve`에서 "기각 대안이 없으면 삭제"로 판정했으나, Challenge Matrix 자체가 "검증한 가정 + 무효화된 전제"를 기록하는 형태. 이것이 "기각 대안"과 동치인가?
- **시사점**: blueprint의 수명은 Challenge Matrix 유무로 갈린다. Goal→Why→Divide만 있는 blueprint = 실행 계획(삭제). Challenge가 있는 blueprint = 의사결정 기록(보존). **v2에서 blueprint 템플릿에 Challenge가 필수면, 더 많은 blueprint가 보존 가치를 가지게 됨**

### I9. `inspector-dogfooding/` — 보존 파일이 3종류 폴더에 분산
- **상황**: discussions/1개, notes/1개(audit), root/2개(plan, blueprint), retrospective.md. 5개 보존 파일이 3개 위치에 분산
- **애매함**: plan이 보존된 것은 예외적 — 7행 변환 매트릭스가 설계 레퍼런스. "plan"이라는 이름이지만 실질은 설계 결정
- **시사점**: **파일명/위치가 수명을 보장하지 못하는 사례.** plan이라는 이름인데 보존 가치가 있고, notes에 있는데 보존해야 하고. **v2에서는 수명을 파일명이 아니라 폴더가 결정해야 한다** — 보존할 것은 `decisions/`에 넣는 순간 수명이 결정됨

### I10. [antipattern] 태그 — 프로젝트에 속하지 않는 독립 문서
- **상황**: W11 root에 `2026-0309-1400-[antipattern]-os-react-overengineering.md` — 어떤 프로젝트에도 속하지 않는 loose file
- **애매함**: 안티패턴 카탈로그는 프로젝트 독립적 지식. 아카이브에 있는 게 맞나, knowledge에 있어야 하나?
- **시사점**: **프로젝트 밖에서 생성되는 지식 문서의 경로가 불명확.** v1은 프로젝트 중심 구조인데, 프로젝트에 귀속되지 않는 발견물(안티패턴, 범용 교훈)의 자리가 없음. v2에서 이것을 어떻게 수용할 것인가?

### I11. W11 보존 파일의 새 패턴 — [survey], [discussion] in notes/
- **상황**: ban-dispatch-tsx에 `[survey]` 태그(전수조사), action-centric-trigger에 `[discussion]` 태그가 notes/에 있음
- **애매함**: discussion이 `discussions/`가 아닌 `notes/`에 있음. survey(전수조사)는 audit와 다른가?
- **시사점**: **discussions/ 폴더 밖에도 discussion 성격 문서가 존재.** v1에서 워크플로우가 일관되지 않았던 시기의 산물. v2에서 `decisions/`로 통합하면 이 혼란은 해소됨
