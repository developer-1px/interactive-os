# 남은 리팩토링 계획 브리핑

## 1. 개요 (Overview)

오늘(2026-02-10) 수행한 작업과 기존 계획서 기반으로, OS 마이그레이션의 현재 상태와 남은 작업을 정리.

**전체 진척률: ~65%** (기능 기준)

---

## 2. 오늘 완료한 것

| 작업 | 상태 |
|------|------|
| 폴더 번호 충돌 해소 (As-Is → To-Be) | ✅ |
| Phase C: Inspector/TestBot → `src/inspector/` 분리 | ✅ (import 깨짐 수정 포함) |
| Phase A: Builder → `src/apps/builder/` 분리 | ✅ (삭제됨, 이동 완료) |
| Phase B: Zustand `@deprecated` 마킹 | ✅ |
| OS-level 빌드 에러 전부 해소 (0개) | ✅ |
| 스모크 테스트 11/11 통과 | ✅ |
| `/fix` workflow 순서 변경 (스모크 먼저) | ✅ |
| 에이전트 규칙에 파일 이동 체크리스트 추가 | ✅ |

---

## 3. 남은 리팩토링 전체 Map

```
Phase 1 (구조 정리) ✅ 완료
  ├── 폴더 번호 충돌 해소 ✅
  ├── Builder → apps/ ✅
  ├── Inspector → inspector/ ✅
  └── Zustand @deprecated ✅

Phase 2 (기능 전환) ← 여기부터
  ├── 🔴 FIELD_* 커맨드 Kernel 등록 (5개)
  ├── 🔴 Field 컴포넌트 Kernel 기반 재작성
  ├── 🟡 COPY/CUT/PASTE/DELETE 커맨드 등록
  ├── 🟡 UNDO/REDO 커맨드 등록
  ├── 🟡 useFocusRecovery → Kernel hook
  └── 🟢 Trigger, Label, Root 컴포넌트

Phase 3 (Legacy 제거)
  ├── store/ (Zustand) 완전 삭제
  ├── primitives/ (FocusGroup → Zone 전환 완료 후)
  ├── middleware/ 삭제
  ├── 2-command/ 잔존 로직 흡수 → 삭제
  └── os/ 폴더 최종 정리

Phase 4 (앱 레이어)
  ├── 🟡 apps/todo 빌드 에러 18개 해결
  ├── 🟡 apps/kanban 빌드 에러 34개 해결
  └── 🟢 apps/ → os-new 통일 import
```

---

## 3. 상세: 다음에 할 일 (Phase 2)

### 🔴 우선순위 높음

**FIELD_* 커맨드 5개 Kernel 등록** (~1일)

Pre-mortem에서도 블로커로 식별됨. Field는 Todo/Kanban의 핵심 인터랙션(인라인 편집). 현재 Legacy EventBus + FieldRegistry(Zustand)에 강하게 결합.

| 커맨드 | 기능 |
|--------|------|
| `FIELD_START_EDIT` | 편집 모드 진입 |
| `FIELD_COMMIT` | 편집 확정 |
| `FIELD_CANCEL` | 편집 취소 |
| `FIELD_BLUR` | 포커스 이탈 |
| `FIELD_SYNC` | 값 동기화 |

**Field 컴포넌트 Kernel 기반 재작성** (~1일)

`os/app/export/primitives/Field.tsx`를 `os-new/6-components/Field.tsx`로 재작성. FieldRegistry 의존성 제거.

### 🟡 우선순위 중간

| 항목 | 추정 | 비고 |
|------|------|------|
| COPY/CUT/PASTE/DELETE 등록 | 0.5일 | 클립보드 커맨드 |
| UNDO/REDO 등록 | 0.5일 | History middleware 연동 |
| useFocusRecovery | 0.5일 | Recovery 전략 이미 확정 (하이브리드) |

### 🟢 우선순위 낮음

| 항목 | 추정 | 비고 |
|------|------|------|
| Trigger/Label/Root 컴포넌트 | 0.5일 | thin wrapper 가능 |
| PersistenceAdapter | 0.5일 | 타입만 존재 |
| spike/ 데모 정리 | 0.5일 | 검증 후 삭제 |

---

## 4. 리스크 (Pre-mortem에서 식별)

| 리스크 | 심각도 | 완화 |
|--------|--------|------|
| "영원한 공존" — os/와 os-new/ 둘 다 안 사라짐 | 🔴 | 앱 import를 os-new/로 atomic 전환 |
| "Zustand를 못 죽인다" — per-zone 생명주기 | 🔴 | registerZone/unregisterZone 커맨드 추가 |
| "FIELD가 블로커" — EventBus 강결합 | 🟡 | 커맨드 먼저 등록, UI 나중에 교체 |
| "성능 회귀" — 단일 state tree 리렌더 | 🟡 | useComputed shallow comparison |

---

## 5. 결론 (Conclusion)

**Phase 1(구조 정리)은 오늘 완료.** 다음은 Phase 2(기능 전환).

추천 순서:
1. **FIELD 커맨드 + 컴포넌트** — 가장 큰 블로커, 먼저 해치우기
2. **앱 빌드 에러 52개** — FIELD 전환하면서 같이 해결될 가능성
3. **Zustand 제거** — Field 완료 후 store/ 정리
4. **Legacy os/ 폴더 삭제** — 마지막 단계

> 예상 총 잔여 작업량: **~5일** (Phase 2~3 합산)
