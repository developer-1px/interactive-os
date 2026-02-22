# 🐛 Issue: Todo 삭제 다이얼로그 키보드 UX

> Date: 2026-02-22
> Priority: P1 (기능불가)
> Status: [Open — Step 3 설계 중]

## 증상

- 삭제 확인 다이얼로그에서 Enter로 확인 실행 안 됨
- 다이얼로그 내 Tab으로 버튼 간 포커스 이동 안 됨
- keyboard-only 사용자에게 마우스 강제

## 기대 동작 (APG modal dialog 스펙)

1. Dialog 열림 → 첫 번째 focusable element에 focus
2. Tab → dialog 내 tabbable elements 사이 순환 (trap)
3. Enter → focused button 활성화 (각 버튼의 고유 action)
4. Escape → dialog 닫기

## 근본 원인

OS의 `onAction` 시스템이 **Zone 레벨에서 하나의 callback**만 지원.
Dialog buttons는 각각 **서로 다른 command**(confirm vs cancel)를 가짐.
→ Zone 레벨의 단일 onAction으로 해결 불가.

## 해결 방향: item-level actionCommand

FocusItem에 `actionCommand` prop을 추가하여,
각 item이 자기 고유의 action command를 선언할 수 있게 한다.

```
<FocusItem id="confirm-btn" actionCommand={confirmDeleteTodo()}>
  <button>Delete</button>
</FocusItem>
```

OS의 action 파이프라인:
1. Enter → OS_ACTIVATE
2. OS가 현재 focused item의 actionCommand를 lookup
3. 해당 command를 dispatch

### 엔트로피 체크 (Project #1)

- 새로운 유일한 패턴? → **No** — 기존 command dispatch 패턴 재사용
- 기존 메커니즘 확장? → **Yes** — FocusItem에 prop 1개, ZoneRegistry에 필드 1개

### 설계 냄새 4질문

1. 개체 증가? → FocusItem prop 1개. 최소.
2. 내부 노출? → No. 기존 FocusItem API 확장.
3. 동일 이슈 타 경로? → toolbar button, menu item 등도 이 패턴 사용 가능.
4. API 확장? → 앱에서 dialog 외에도 item별 다른 action이 필요한 곳에 범용.

### 수정 파일 목록 (예상)

1. `FocusItem.tsx` — `actionCommand` prop 추가
2. `FocusGroup.tsx` — item 등록 시 actionCommand 저장
3. `zoneRegistry.ts` — item별 actionCommand lookup 지원
4. `OS_ACTIVATE handler` — focused item의 actionCommand가 있으면 우선 dispatch
5. `defineApp.trigger.ts` — TriggerDismiss에서 actionCommand 설정
6. `Dialog.tsx` — 변경 불필요 (TriggerDismiss가 자동으로 처리)

### 오답 이력

- ~~오답 #1: DOM `.click()` 호출~~ → ZIFT 위반, 되돌림
- ~~오답 #2: 브라우저 native behavior에 위임~~ → OS 존재 이유 부정, 폐기
- 상세: `.agent/mistakes/2026-02-22_dialog-keyboard-ux.md`
