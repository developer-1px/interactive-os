# BOARD — registry-monitor-v5

## 🔴 Now

_(empty)_

## ⏳ Done

- [x] T1: kernel getRegistry API — 이미 존재 (`createInspector.ts` + `inspectorPort.ts` 완비)
- [x] T2: RegistryMonitor v5 재작성 — kernel.inspector.getRegistry() 직접 연결, Scope Tree UI
- [x] T3: GroupRegistry 제거 — `GroupRegistry.ts` + `CommandRow.tsx` 삭제, CommandInspector 정리

## 💡 Ideas
- When Guard 실시간 평가 표시 (현재 등록 여부만 표시, 실시간 평가 미구현)
- 커맨드 dispatch 이력 연동 (flash 애니메이션 — 현재 scope-level만)
