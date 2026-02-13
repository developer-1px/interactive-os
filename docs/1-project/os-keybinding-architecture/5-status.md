# Status: OS 키바인딩 아키텍처 재설계

## 현재 상태: 🟢 핵심 인프라 완료

## 성과 (전체 세션)

| 조각 | 결과 |
|------|------|
| 1. todoKeys.ts 삭제 | ✅ Dead code 제거 |
| 2. WidgetConfig.keybindings | ✅ 타입 + Zone 자동 등록/해제 |
| 3. clipboard.ts 삭제 | ✅ 테스트 mock 전환으로 삭제 완료 |
| 4. Widget.Keybindings | ✅ Zone 없는 위젯도 keybinding 등록 |
| 5. define.command `when` | ✅ 커맨드에 실행 조건 공존, cancelEdit 적용 |
| 6. AppInstance.commands | ✅ 테스트에서 커맨드 메타데이터 접근 |

## 삭제된 레거시 파일

- `src/apps/todo/features/todoKeys.ts` — dead code
- `src/apps/todo/features/commands/clipboard.ts` — v3 커맨드로 대체

## 새로 추가된 API

```ts
// 1. 앱 키바인딩 선언
keybindings: [
  { key: "Meta+D", command: duplicateTodo },
]

// 2. Zone 없는 위젯용 컴포넌트
<TodoToolbar.Keybindings />

// 3. 커맨드 when 가드
define.command("cancelEdit", handler, {
  when: (state) => state.ui.editingId != null,
})
```

## 후속 과제

| 과제 | 레이어 | 우선순위 |
|------|--------|---------|
| Trigger disabled 자동화 | UI | Medium |
| CommandPalette grayed out | UI | Low |

## 검증

- tsc: clean
- vitest: 14 files, 157 passed, 0 failed
