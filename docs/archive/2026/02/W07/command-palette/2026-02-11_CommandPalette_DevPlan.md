# ⌘K Command Palette — Development Plan

## 1. 기술 스택

| Layer | Technology | 비고 |
|-------|-----------|------|
| 모달 | `OS.Dialog` | Radix-compatible compound component |
| 검색 입력 | Native `<input>` + `useState` | OS.Field는 contentEditable 기반이라 input에 부적합 |
| 결과 리스트 | `OS.Zone` + `OS.Item` | kernel 기반 ↑/↓ 네비게이션 |
| 키보드 힌트 | `OS.Kbd` | ⌘K, ↵, ⎋ 등 |
| 글로벌 트리거 | `Keybindings.register()` | Inspector 패턴 동일 |
| 커맨드 | `kernel.defineCommand()` | OPEN/CLOSE/GOTO 커맨드 |
| Fuzzy Search | 직접 구현 (경량) | 외부 라이브러리 불필요 |
| 라우트 추출 | `router.routesByPath` / `routeTree` | TanStack Router API |

---

## 2. 파일 구조

```
src/
  command-palette/
    register.ts          # [NEW] 커맨드 정의 + ⌘K 키바인딩 등록
    CommandPalette.tsx    # [NEW] 메인 UI 컴포넌트
    fuzzyMatch.ts         # [NEW] fuzzy search 유틸
    useRouteList.ts       # [NEW] TanStack Router에서 라우트 추출 hook
  routes/
    __root.tsx            # [MODIFY] CommandPalette 마운트
```

---

## 3. 구현 순서

### Step 1: `fuzzyMatch.ts` — Fuzzy Search 유틸
- 입력 문자열이 대상 문자열의 subsequence인지 판별
- 매칭 점수 계산 (연속 매치 보너스, 시작 매치 보너스)
- 매칭된 문자 인덱스 반환 (하이라이팅용)

### Step 2: `useRouteList.ts` — 라우트 목록 추출
- `useRouter()`로 라우터 인스턴스 접근
- `routeTree.gen.ts`의 `FileRoutesByFullPath`에서 전체 경로 추출
- layout 라우트(`_minimal`, `_todo`, `_kanban`) 제외, 실제 페이지 경로만 반환

### Step 3: `register.ts` — 커맨드 + 키바인딩
- `OPEN_COMMAND_PALETTE` 커맨드 정의 (kernel.defineCommand)
- `GOTO_ROUTE` 커맨드 정의 — payload로 path를 받아 `router.navigate()` 실행
- `Meta+K` 키바인딩 등록

### Step 4: `CommandPalette.tsx` — UI
- `OS.Dialog` 기반 모달
- 상단: `<input>` (검색), 하단: `OS.Zone role="listbox"` + `OS.Item`
- Enter → 포커스된 Item의 경로로 `router.navigate()` 
- ESC → 닫기 (Dialog가 자동 처리)
- 매칭 문자 하이라이팅

### Step 5: `__root.tsx` 수정
- `import "@/command-palette/register"` (side-effect import)
- `<CommandPalette />` 렌더

### Step 6: Smoke Test 등록
- `e2e/smoke.spec.ts`에 `/` 라우트에서 ⌘K 동작 E2E 테스트 추가 (선택적)

---

## 4. OS Component Dogfooding Map

| 기능 | OS 컴포넌트 | 검증 항목 |
|------|------------|----------|
| 모달 열기/닫기 | `Dialog` + `OVERLAY_OPEN/CLOSE` | overlay stack, focus trap, ESC dismiss |
| 결과 리스트 탐색 | `Zone role="listbox"` | ↑/↓ 네비게이션, activeZoneId |
| 결과 항목 | `Item` | focusedItemId, isFocused 상태 |
| Enter 활성화 | `ACTIVATE` 커맨드 → `Zone.onAction` | 커맨드 dispatch 체인 |
| ⌘K 트리거 | `Keybindings.register()` | 글로벌 키바인딩 해석 |
| 단축키 표시 | `Kbd` | key symbol 포맷팅 |
| 커맨드 체계 | `kernel.defineCommand()` | 커맨드 정의 + dispatch |

---

## 5. 라우트 설계

이번 spike는 **별도 라우트가 아닌 글로벌 오버레이**로 구현한다.
`__root.tsx`에 마운트하여 모든 라우트에서 ⌘K로 접근 가능하게 한다.
