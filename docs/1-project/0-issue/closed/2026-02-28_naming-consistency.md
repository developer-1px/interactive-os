# Issue: naming-consistency [Closed]

> **Opened**: 2026-02-28
> **Closed**: 2026-02-28
> **Priority**: P3 (cosmetic — 런타임 오류 없음, 일관성 저해)
> **Source**: /discussion → naming audit 전수 조사에서 발견

---

## 증상

코드베이스의 네이밍 패턴이 선택적으로만 준수됨:

1. `OS_COMMANDS` 키 이름 9개에 `OS_` 접두사 누락 (값은 모두 올바름)
2. `allIds()` — 동일 파일의 `getRoots/getChildren/getParent`와 달리 `get` 접두사 누락
3. `useFieldHooks.ts` — 파일명에 "Hooks" 이중 포함

---

## 근본 원인

**점진적 확장에서 발생한 일관성 붕괴**.

`OSCommands.ts`는 두 단계에 걸쳐 커맨드가 추가됐다:
- 초기 추가분 (`OS_NAVIGATE`, `OS_FOCUS` 등): `OS_` 접두사 일관적
- 후기 추가분 (`COPY`, `DELETE`, `UNDO` 등): 실수로 `OS_` 누락

Naming convention 문서는 있었으나 새 커맨드 추가 시 패턴 검사 없음.

---

## 해결

| 파일 | 변경 |
|------|------|
| `src/os/schemas/command/OSCommands.ts` | 9개 키를 값과 동일한 `OS_` 접두사로 통일 |
| `src/os/schemas/command/OSCommandPayload.ts` | 키 참조 갱신 |
| `src/os/collection/NormalizedCollection.ts` | `allIds` → `getAllIds` |
| `src/os/collection/tests/unit/normalized-collection.test.ts` | import + 호출부 갱신 |
| `src/os/5-hooks/useFieldHooks.ts` | `useField.ts`로 rename |
| `src/os/6-components/field/Field.tsx` | import 경로 갱신 |

---

## 검증

```
tsc --noEmit → 에러 0
```

---

## 재발 방지

1. `.agent/knowledge/naming.md` — 동사/접두사 Dictionary 신설 (이 이슈로 생성됨)
2. `.agent/knowledge/naming-conventions.md` — `OS_COMMANDS 키 접두사` 주의사항 추가됨
3. `/naming` 워크플로우 — 충돌 검사 체크리스트에 접두사 일관성 확인 포함됨
