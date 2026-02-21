# Spec — 인라인 편집 (Inline Editing)

> Source: builder-mvp (W08 archive), builder-os-panel-binding (W07 archive)
> Verified: Production code, 826 tests pass

## 1. 편집 진입/종료

| 동작 | 트리거 | 결과 |
|------|--------|------|
| 편집 진입 | F2 (OS 표준), Enter (onAction) | Field가 contentEditable 활성화 |
| 편집 저장 | Enter | `onCommit` → `updateField` command → state 갱신 |
| 편집 취소 | Escape | 원래 값 복원, 편집 모드 종료 |

## 2. 패널 ↔ 캔버스 양방향 동기화

```
캔버스 수정:  OS.Field onCommit → updateField command → state 갱신
패널 수정:    input onChange → updateFieldByDomId command → state 갱신
패널 읽기:    BuilderApp.useComputed((s) => s.data.blocks)
캔버스 읽기:  BuilderApp.useComputed((s) => s.data.blocks)
```

**동일한 state + 동일한 command** = 자연스러운 양방향 동기화. 추가 동기화 코드 불필요.

## 3. Field 주소 해석

`resolveFieldAddress(domId, blocks)` — DOM ID → `{ section: Block, field: string }`

예: `"ncp-hero-title"` → `{ section: Block{id:"ncp-hero"}, field: "title" }`

## 4. 상태 머신

| 상태 | 설명 | 진입 | 탈출 |
|------|------|------|------|
| Browsing | 탐색 중 | 앱 시작, 편집 완료 | 요소 포커스 |
| Selected | 요소 선택됨 | 클릭/Arrow키 | 다른 요소 선택, 편집 시작 |
| Editing | 인라인 편집 중 | F2/Enter | Enter(저장), Escape(취소) |
| PanelEditing | 패널 편집 중 | 패널 input 포커스 | blur, 다른 요소 선택 |
