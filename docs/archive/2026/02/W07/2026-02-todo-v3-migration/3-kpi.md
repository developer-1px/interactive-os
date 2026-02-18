# Todo v3 마이그레이션 — KPI

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|-----------|
| Todo 위젯 디렉토리 수 | 3 (`widgets/`, `widgets-v2/`, `widgets-v3/`) | 1 (`widgets/`) | `ls src/apps/todo/widgets*` |
| Todo 페이지 파일 수 | 3 (`TodoPage`, `V2`, `V3`) | 1 (`TodoPage`) | `ls src/pages/Todo*` |
| Todo playground 라우트 수 | 2 (`todo-v2`, `todo-v3`) | 0 | `ls src/routes/_minimal/playground.todo*` |
| `module.ts` 존재 | ✅ (513줄) | ❌ 삭제 | `ls src/apps/todo/module.ts` |
| `npx tsc --noEmit` | PASS | PASS | 커맨드 실행 |
| `npm run build` | PASS | PASS | 커맨드 실행 |
| `npm test` | PASS | PASS | 커맨드 실행 |
