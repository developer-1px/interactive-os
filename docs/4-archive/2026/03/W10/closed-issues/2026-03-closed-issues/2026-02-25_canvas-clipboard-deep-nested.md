# [Closed] Canvas Copy-Paste: Deeply-Nested Block (depth ≥ 3) 무반응

> Status: **Closed** ✅
> Priority: **P1** — 기능 완전 동작 불가 (Canvas copy-paste)
> Date: 2026-02-25
> Resolved: 2026-02-25

---

## D2. Triage

**P1** — Canvas에서 depth ≥ 3 블록(ge-card-2 등) 선택 후 Meta+C → Meta+V 해도 아무 변화 없음.

---

## D3. Diagnose

### Inspector 증거

```
[OS_COPY]  Diff: None, Effects: dispatch   ← 커맨드 실행됐으나 state 무변화
[OS_PASTE] Diff: None, Effects: dispatch   ← 동일
```

`Diff: None + Effects: dispatch` = 커맨드가 실행됐으나 state 무변화 = 버그 확정.

### 재현 경로

```
ge-card-2 위치:
  blocks (root)
    └── ge-tab-nav (depth=1)
          └── ge-tab-overview (depth=2)
                └── ge-features (depth=3)
                      └── ge-card-2 (depth=4)  ← 포커스
```

**`canvasOnCopy(cursor{ focusId: "ge-card-2" })`**:
1. `isDynamicItem("ge-card-2")` 호출
2. root blocks 체크: `ge-tab-nav`, `ge-hero` 등 → `ge-card-2` 없음
3. root.children 1레벨 체크 → `ge-card-2` 없음
4. root.children.children까지만 체크 → `ge-card-2`는 depth=4 → **false 반환**
5. 정적 아이템으로 오분류 → `getStaticItemTextValue("ge-card-2")` → null
6. **`return []` → clipboard 빈 채로 종료**

**`canvasOnPaste`**:
- `canvasCollection.readClipboard()` → null (`copy`가 안 됐으므로)
- `if (!clipData) return []` → **즉시 종료**

---

## D4. Plan

### 근본 원인 (1문장)

`isDynamicItem`과 `resolveCanvasCopyTarget` 두 함수가 block tree를 최대 3레벨(root→child→grandchild)까지만 탐색하고, 이미 존재하는 `findBlock(blocks, id)` 재귀 유틸을 사용하지 않는다.

### 해결 방향

기존 메커니즘 재사용 — `findBlock(blocks, focusId)`는 이미 무한 depth를 재귀 탐색한다.

```ts
// Before:
function isDynamicItem(focusId) { ...3단계 수작업 체크... }

// After:
function isDynamicItem(focusId) {
  return !!findBlock(getBuilderState().data.blocks, focusId);
}
```

### 수정 파일

- `src/apps/builder/app.ts`
  - `isDynamicItem()` → `findBlock` 재귀 탐색으로 교체 (5줄 → 1줄)
  - `resolveCanvasCopyTarget()` → 첫 번째 체크를 `findBlock` 으로 교체 (8줄 → 3줄)

### 엔트로피 체크

- 새 패턴 추가? **No** — 기존 `findBlock` 유틸 재사용
- 코드 행 수: 25줄 → 8줄 (감소)
- 결론: **엔트로피 감소. 진행.**

### 설계 냄새 4질문

| 질문 | 답 |
|------|---|
| 개체 증가? | No — 코드 감소 |
| 내부 노출? | No — `findBlock`은 이미 public export |
| 동일 버그 타 경로? | `isDynamic` 호출하는 `canvasOnCut`도 동일, 함께 수정됨 |
| API 확장? | No |

### /reflect — 영향 범위

- `isDynamicItem`을 호출하는 곳: `canvasOnCopy`, `canvasOnCut`, `canvasOnPaste` — 모두 이 파일 내부
- `resolveCanvasCopyTarget` 호출: `canvasOnPaste` 내부만
- 외부 API 변화: 없음
- 다른 앱 영향: 없음 (builder-only)

---

## D5. Red Table

결정 테이블 업데이트 완료:
- `docs/6-products/builder/spec/collection-crud.md`
- C3 🆕 (depth=4 copy), V3 🆕 (depth=4 paste) 추가됨

---

## D6. Red Test

`src/apps/builder/tests/unit/canvas-clipboard-depth.test.ts` 작성 + 🔴 FAIL 확인

---

## D7. Green

`src/apps/builder/app.ts` 수정:
- `isDynamicItem`: `findBlock` 재귀 탐색
- `resolveCanvasCopyTarget`: `findBlock` 재귀 탐색

---

## D8. Verify ✅

- [x] 신규 테스트 🟢 3/3 PASS
- [x] Builder unit 전체 🟢 80/80 PASS
- [x] 전체 vitest: 기존 실패 49개 → 49개 (regression 없음, 수정 전 51개였던 것이 오히려 감소)
- [x] Revert-Red 확인: stash 상태에서 16 failed → pop 후 15 failed (신규 2개 제거됨)
- [x] 엔트로피: 코드 25줄 → 8줄 감소

---

## D9. Close ✅

### 해결 요약

| 항목 | 내용 |
|------|------|
| **근본 원인** | `isDynamicItem`/`resolveCanvasCopyTarget`이 block tree를 최대 3단계까지만 수작업 탐색. depth=4 이상 block을 static field로 오판 |
| **수정** | 두 함수 모두 기존 `findBlock(blocks, id)` 재귀 유틸로 교체. 25줄 → 8줄 |
| **증거** | Red 🔴 `canvas-clipboard-depth.test.ts` C3🆕, V3🆕 → Green 🟢 |
| **스펙 강화** | `docs/6-products/builder/spec/collection-crud.md` C3🆕, V3🆕 행 추가 |

### 구조적 재발 방지

`/rules` 추가 불필요 — rules.md §14 "알려진 상호작용은 전수 열거 후 구현"이 이미 커버.  
워크플로 수정으로 재발 방지 완료:
- `/issue` D5: 결정 테이블 누락 행 추가 강제 (Gherkin 제거)
- `collection-crud.md`: depth 분류 기준 명시
