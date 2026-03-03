# Retrospect: command-config-invariant (2026-03-03)

## 세션 요약

**목표**: 6-command × rolePresets config chain으로 파이프라인 불변 계약 확립
**결과**: T1-T6 완료, 333 tests PASS, audit/doubt 통과
**워크플로우**: /discussion → /blueprint → /go(plan/red/green/refactor) → /audit → /doubt → /retrospect

---

## KPT

### 🔧 개발 과정

**Keep 🟢**
- T6 config-driven 전환: blueprint로 Clear 판별 후 4줄 교체. ROI 명확.
- preview layer 격리 불변: kernel 945줄 읽고 `enterPreview` 멱등성 활용 → constructor/cleanup 단순화.

**Problem 🔴**
- band-aid(`setState(initialAppState)`) 먼저 적용 → 설계 불변 검토 누락. 사용자 지적 후 교체.
- E0/E0b/E1 진단파일 3개 생성 후 결국 삭제. kernel 소스를 먼저 읽었다면 진단파일 불필요.

**Try 🔵**
- OS 격리 문제 발생 시: 진단 파일 생성 전에 kernel 소스(`createKernel.ts`) 먼저 읽는다.
- 수정 직후: "이게 동작하는가?" 뿐만 아니라 "불변을 유지하는가?" 자문한다.

### 🤝 AI 협업 과정

**Keep 🟢**
- 사용자 짧은 코멘트("설계미스야?", "항상 정상으로 불변을 택해")가 방향타로 효과적.
- /discussion에서 히스토리 추론(Hyrum's Law) → 설계 의도-현실 불일치 명확히 설명.

**Problem 🔴**
- 코드 동작 확인 후 설계 불변 검토를 스스로 하지 않음 (band-aid 사례).

**Try 🔵**
- 수정 완료 시 "이 패턴이 불변인가, 우연히 동작하는가?"를 항상 자문한다.

### ⚙️ 워크플로우

**Keep 🟢**
- /blueprint → /discussion 콤보: Complicated → Clear 판별에 결정적.
- /go 파이프라인: audit → doubt → retrospect 자연스럽게 이어짐.

**Problem 🔴**
- 테스트 격리 디버깅에 진단파일을 만들기 전에 /blueprint나 /why가 없었음.

**Try 🔵**
- 테스트가 이유 모르게 실패할 때 → /why 트리거. 진단파일보다 kernel 소스 추적 우선.

---

## MECE 액션 아이템

| # | 액션 | 카테고리 | 상태 | 긴급도 |
|---|------|---------|------|-------|
| 1 | /red에 입력 기반 테스트 우선 규칙 | 프로세스 | ✅ 반영 완료 | 🔴 |
| 2 | preview layer enterPreview 불변 (코드로 반영) | OS 코드 | ✅ 반영 완료 | 🔴 |
| 3 | "불변 자문" 규칙 → rules.md | 규칙 | ✅ 반영 완료 | 🟡 |
| 4 | Phase 6 Modifier keybindings → backlog | 문서 | ✅ 반영 완료 | 🟡 |

---

## 최종

```
총 액션: 4건
  ✅ 반영 완료: 4건
  🟡 백로그: 0건 잔여
  ❌ 미반영: 0건
```
