# /divide — docs 구조 개선 분해 보고서

| 항목 | 내용 |
|------|------|
| **원문** | /docs 내 폴더의 양식과 구조에 대해 분석하고 보고서 작성 → /divide |
| **대상** | [docs-structure-formatting-audit](2026-0213-0907-[analysis]-docs-structure-formatting-audit.md)의 10개 개선 제안 |
| **날짜** | 2026-02-13 |

---

## 1. 분류 결과

### 🟢 Known — 실행 완료

| # | 항목 | 판단 근거 | 실행 결과 |
|---|------|-----------|-----------|
| K1 | `03-zift-primitives` → `03-os-primitives` | `MIGRATION_MAP`에서 ZIFT → Interactive OS 퇴출 명시. 정답 자명 | ✅ `mv` 완료 |
| K2 | `07-*.md` 번호 중복 해결 | 두 파일이 같은 번호. 후순위 파일을 다음 번호로. 정답 자명 | ✅ `07-typescript-refactoring-tools.md` → `14-typescript-refactoring-tools.md` |
| K4 | 프로젝트 폴더 표준 문서화 | 이미 `define-app`, `testbot`, `create-module` 3개 프로젝트에서 동일 패턴 사용 중. 사실 기록일 뿐 | ✅ `docs/2-area/07-code-standards/03-project-folder-standard.md` 생성 |

### 🔴 Open — 사용자 결정 필요

| # | 항목 | Open인 이유 |
|---|------|-------------|
| O1 | `3-resource` 내 inbox 스타일 파일 3개 위치 | 파일이 레퍼런스 성격(코드베이스 현황판, 워크플로우 평가, 버그 분석)이라 resource에 있는 게 맞을 수도 있음. **네이밍을 resource 스타일로 바꿀지, inbox로 이동할지, 현 상태 유지할지** 판단 필요 |
| O2 | 날짜 포맷 단일화 | `YYYY-MMDD-HHmm`이 최신 표준이지만, 기존 250+ 파일 일괄 변환의 ROI가 불확실. **신규만 적용 vs 일괄 변환** |
| O3 | 구분자 단일화 (`_` vs `-`) | O2와 연동. 워크플로우 산출물의 네이밍 규칙을 변경하면 `/daily`, `/til`, `/discussion` 워크플로우 수정 필요 |
| O4 | YAML frontmatter 도입 | docs-viewer가 frontmatter를 파싱·활용하는 기능이 아직 없음. **도입만 할지, viewer 연동까지 할지** 범위 결정 필요 |
| O5 | `kernel-adr/` 위치 (area vs resource) | ADR은 "의사결정 기록"이므로 resource(참조)와 area(영구 관심사) 양쪽 모두 논리적. PARA 원칙에서 area는 "유지해야 하는 표준", resource는 "참고 자료"인데, ADR은 둘 다에 해당 |
| O6 | Area/Resource 템플릿 | 현재 자유 형식의 품질이 높음. 템플릿 강제가 오히려 생산성을 낮출 수 있음. **경량(제목+요약만) vs 구조화 vs 도입 안 함** |
| O7 | `10-devnote`, `11-discussions` 번호 규칙 | 5~9 빈 번호의 의미 결정. "시간축 문서는 10번대"라는 규칙이 있는지, 아니면 우연인지 |

---

## 2. 실행 상세

### K1: 폴더 리네임

```bash
mv docs/2-area/03-zift-primitives docs/2-area/03-os-primitives
```

영향: `docs/4-archive/` 내 참조 3건은 아카이브(불변 기록)이므로 수정하지 않음.

### K2: 번호 중복 해결

```bash
mv docs/3-resource/07-typescript-refactoring-tools.md docs/3-resource/14-typescript-refactoring-tools.md
```

기존 최고 번호 `13-browser-event-loop-timing.md` → 다음 번호 `14`.

### K4: 프로젝트 표준 문서화

[03-project-folder-standard.md](file:///Users/user/Desktop/interactive-os/docs/2-area/07-code-standards/03-project-folder-standard.md) — WHY→WHAT→IF→HOW 번호 규칙을 명시화.

---

## 3. 남은 열린 질문 (우선순위 순)

1. **O2+O3 (날짜·구분자)**: 기존 파일을 건드릴 것인가? → "신규만 적용"이면 워크플로우 수정만으로 충분
2. **O1 (resource 내 misplaced 파일)**: 번호를 부여하여 resource로 정규화? or inbox로 이동?
3. **O4 (YAML frontmatter)**: docs-viewer 개선 프로젝트와 묶을 것인가?
4. **O5 (kernel-adr 위치)**: 27개 ADR의 물리적 이동은 리스크가 큼. 심볼릭 링크도 고려 가능
5. **O6~O7**: 시급하지 않음. 필요 시 추후 결정

---

**한줄요약**: 10개 제안 중 정답인 3건(K1·K2·K4)을 즉시 실행하고, 나머지 7건은 트레이드오프가 있어 사용자 결정을 기다린다.
