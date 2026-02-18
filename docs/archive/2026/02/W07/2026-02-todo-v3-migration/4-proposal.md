# Todo v3 통합 마이그레이션 — Proposal

## 구현 전략

### 접근 방식: In-place 교체

v3 위젯을 v1 `widgets/` 위치로 직접 이동하여 교체한다.
별도 브랜치 없이 단일 커밋으로 마이그레이션한다.

### 단계별 순서

1. **GlobalNav 이동** — `widgets/` 삭제 전 선행 필수
2. **v1 widgets 삭제** — 기존 `widgets/` 비우기
3. **v3 → widgets 이동** — `widgets-v3/` → `widgets/`, V3 접미사 제거
4. **TodoPage 교체** — v3 컨텐츠로 덮어쓰기
5. **v2 전용 삭제** — `widgets-v2/`, `module.ts`, 테스트, 라우트
6. **V2/V3 페이지 삭제** — `TodoPageV2.tsx`, `TodoPageV3.tsx`
7. **Cleanup** — TSC, Biome, Knip, Build

### 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| E2E 실패 | v3 위젯이 v1과 동일한 DOM 구조를 생성하지 않을 수 있음 | E2E는 `data-*` 속성 기반이라 구조 변경에 강건함 |
| BoardView 미구현 | `viewMode: "board"` 전환 시 빈 화면 | 이번 스코프 아웃, 후속 작업 |
| OS 테스트 의존성 | todoSlice 삭제 시 OS 테스트 깨짐 | todoSlice 유지로 회피 |

### 변경 범위 요약

- **삭제**: ~20 파일, ~2,500줄
- **이동/리네임**: 5 파일 (widgets-v3 → widgets)
- **수정**: 3 파일 (__root.tsx, TodoPage.tsx, SidebarV3 title)
- **유지**: app.ts, features/*, selectors.ts, model/*, v3/*, tests/todo.test.ts, tests/todo.v3.test.ts
