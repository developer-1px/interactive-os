# toolbar role preset: click inputmap 누락

> Status: Open
> Priority: P2 (대안존재 — Space/Enter로 activate 가능)
> 발견: backlog에서 이관

## D3. Diagnose

- `roleRegistry.ts:252` toolbar preset: `inputmap: { Space: [OS_ACTIVATE()], Enter: [OS_ACTIVATE()] }` — click 없음
- `PointerListener.tsx:357`: `activateOnClick = clickCommands.length > 0` — click 없으면 클릭 무시
- 12개 role이 click inputmap 사용. toolbar만 누락.

## D4. Plan

- 근본 원인: toolbar role preset inputmap에 click 키 누락
- 해결 방향: 기존 메커니즘 재사용 (click inputmap 패턴)
- 수정 파일: `packages/os-core/src/engine/registries/roleRegistry.ts` (1줄)
- 엔트로피 체크: No — 기존 패턴 그대로
- 설계 냄새: 개체 증가 없음, 내부 노출 없음, 타 경로 없음, API 확장 없음
