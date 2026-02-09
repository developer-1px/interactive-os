# schema

타입 정의 — 모든 레이어가 공유하는 인터페이스.

## 파일

- `types.ts` — OSContext, OSResult, DOMEffect, OSCommand
- `state.ts` — ZoneState, FocusStoreState
- `transaction.ts` — Transaction, StateDiff
- `effects.ts` — EffectRecord, InputSource

## 역할

순환 의존 없는 타입 정의.
파이프라인 간 계약(contract) 명시.
