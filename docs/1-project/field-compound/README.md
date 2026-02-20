# field-compound — Field Compound Component 리팩토링

## WHY

AI agent(cold-start)가 `Field`를 보면 사전학습 기반으로 네이티브 `<input>` wrapper를 기대한다.
실제로는 contentEditable `<span>` 기반이므로 이름과 실체의 괴리가 환각을 유발한다.

**W14**: "나는 아니까 괜찮다"는 설계 기준이 아니다. cold-start agent 안전성이 기준.

## Goals

1. `Field`를 네임스페이스로 전환 (컴포넌트 → compound namespace)
2. `Field.Editable` — 기존 contentEditable 인라인 편집 (rename)
3. `Field.Input` — native `<input>` (폼 패널용, 신규)
4. `Field.Textarea` — native `<textarea>` (폼 패널용, 신규)
5. `Field.Label` — 기존 유지
6. 모든 소비자 코드 마이그레이션

## Scope

- `src/os/6-components/field/Field.tsx` → 내부 리팩토링
- 소비자 7개 파일: NCP 블록 5개 + AriaInteractionTest + Todo ListView
- `Field.Input`, `Field.Textarea` 신규 생성
- 테스트 업데이트

## Out of Scope

- PropertiesPanel의 실제 `Field.Input` 적용 (별도 태스크)
- 칩/멘션 기능 구현
- FieldRegistry 구조 변경

## 관련 문서

- [Discussion: Field API Surface](discussions/2026-0220-2102-field-api-surface.md)
