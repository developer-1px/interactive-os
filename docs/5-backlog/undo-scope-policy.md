# Undo Scope Policy — Field vs Zone 히스토리 스택 분리

> 작성일: 2026-03-07
> 출처: todo bug-hunt 세션에서 발견

## 문제

Draft zone(항상 편집 중인 텍스트 필드)에서 `Meta+Z`가 OS undo로 라우팅되지 않는다.

- `INLINE_ZONE_PASSTHROUGH`에 `Meta+Z`가 없음 → 필드가 키를 흡수
- 브라우저 네이티브 텍스트 undo와 OS 앱 상태 undo가 충돌

## 업계 선례

| 앱 | 정책 |
|----|------|
| IntelliJ | 에디터 탭별 독립 스택, sidebar 별도 스택 |
| VS Code | 에디터 탭별 독립 스택, sidebar는 undo 없음 |
| Figma/Photoshop/Excel | 글로벌 단일 스택 |
| macOS (NSUndoManager) | Responder Chain 기반 — First Responder 버블링 |

두 진영: **Focus-scoped** (IntelliJ, VS Code) vs **Global** (Figma, Excel)

## 현재 OS 구조

- `history()` 모듈 = 앱 단일 스택
- `OS_UNDO` → activeZoneId → ZoneRegistry → onUndo callback
- 스택은 하나, 라우팅은 zone 기반

## 핵심 긴장

1. 브라우저 `<input>`의 네이티브 텍스트 undo vs OS 앱 상태 undo
2. IntelliJ는 자체 에디터라서 둘 다 자기가 관리 — 브라우저 앱은 네이티브 텍스트 undo를 빼앗으면 UX 위반
3. "always-active field" (draft, search)에서 앱 undo를 어떻게 트리거하는가?

## 가능한 방향

1. **addTodo 후 list zone으로 포커스 자동 이동** — 앱 레벨 우회. draft를 떠나야 undo 가능
2. **Meta+Z를 INLINE_ZONE_PASSTHROUGH에 추가** — OS 레벨. 네이티브 텍스트 undo 상실
3. **Field에 undo 위임 프로토콜 추가** — Field가 "내 undo 스택 비었으면 OS에 위임" 판단
4. **Zone별 독립 스택** — IntelliJ식. 교차 작업 undo 순서가 직관에 반할 수 있음

## 판단 보류 이유

정답이 없는 Complex 영역. 앱이 더 성숙한 후 실제 UX 패턴에서 결정해야 함.

---

## /wip 분석 이력 (2026-03-12)

### 분석 과정

#### 턴 1: /divide — 기존 인프라 탐색
- **입력**: undo/history 아키텍처 전수 조사
- **결과 — 빌딩블록 이미 풍부**:
  - **Noise filtering**: `historyKernelMiddleware.ts:212-282` — 500ms 코에일레스 (동일 type + target)
  - **Transaction grouping**: `beginTransaction()`/`endTransaction()` + `groupId` → 원자적 undo
  - **Field lifecycle**: `OS_FIELD_START_EDIT`/`OS_FIELD_COMMIT`/`OS_FIELD_CANCEL` 존재
  - **Field passthrough**: `INLINE_ZONE_PASSTHROUGH` — Tab, ↑↓만 통과. `Meta+Z`는 브라우저 네이티브로 처리 (의도적)
  - **Zone.onUndo/onRedo**: static `BaseCommand`. `createUndoRedoCommands()` factory로 생성
- **Solution 3 (Transaction Auto-Wrapping) 유력**: field lifecycle hooks에 transaction 자동 연결
  - `OS_FIELD_START_EDIT` → `beginTransaction()`
  - `OS_FIELD_COMMIT`/`CANCEL` → `endTransaction()`
  - 기존 `groupId` 인프라 그대로 활용
- **한계**: always-active field (draft, search)는 START_EDIT/COMMIT 수명주기 없음 → Solution 3 적용 불가
- **Cynefin**: Complex (일반 field = Complicated, always-active = Complex)

#### 턴 2: /solve — always-active field 근본 긴장
- **입력**: Meta+Z의 이중성 — 브라우저 텍스트 undo vs OS 앱 상태 undo
- **결과 — 앱별 정책이 정답**:
  - Todo draft: Enter 후 focus 이동 → OS_UNDO 자연 진입 (Option 1, app-level)
  - Search field: 텍스트 undo가 정답 (앱 상태 undo 무의미)
  - Code editor: 에디터 자체 undo 스택 (VS Code 방식)
  - **결론**: always-active field의 undo는 **field type별/앱별 결정**이지 OS 단일 정책이 아님
- **Cynefin**: Complex 유지 (B에 대해)

#### 턴 3: 최종 판정 — 문제 분리
- **문제 A (일반 field history 폭발)**: **Clear** — Solution 3으로 해결 가능
  - Before: 매 키스트로크마다 history entry 생성 → undo 1회 = 1글자 복원
  - After: field edit session 전체가 1 transaction → undo 1회 = 전체 편집 복원
  - 구현: `historyKernelMiddleware.ts`의 before hook에서 `OS_FIELD_START_EDIT` 감지 → auto `beginTransaction()`
- **문제 B (always-active field undo 라우팅)**: **Complex** → 앱 성숙 후 재방문
  - OS 레벨 해결 불가. 각 앱이 자기 always-active field의 undo 정책 결정

### Open Gaps (인간 입력 필요)

- [ ] **Q1: 문제 A만 분리하여 프로젝트화할 것인가?** — 해소 시 Transaction Auto-Wrapping 즉시 구현 가능 (S 크기)
- [ ] Q2: 문제 B는 백로그에 남기되, "앱별 정책" 가이드라인을 별도 문서화할 것인가?

### 구현 스케치 (Q1 동의 시, 문제 A)

```typescript
// historyKernelMiddleware.ts before hook 추가
if (command.type === "OS_FIELD_START_EDIT") {
  beginTransaction();  // auto-start
}
if (command.type === "OS_FIELD_COMMIT" || command.type === "OS_FIELD_CANCEL") {
  endTransaction();    // auto-end → 전체 편집이 1 undo 단위
}
```

### 다음 /wip 시 시작점

Q1 동의 시 → `/project` (field-history-transaction) → `/go`. 문제 B는 백로그 잔류
