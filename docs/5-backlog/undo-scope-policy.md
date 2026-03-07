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
