# /divide 보고서 — 남은 tsc 에러 22개

> 작성: 2026-02-20 00:00
> 선행 세션: 275 → 22 (253개 해결, 92%)

## 요약

22개 에러를 **5개 근본 원인 클러스터**로 분류. Clear 7개는 즉시 실행 가능, Complicated 15개는 프로덕션 타입 설계 결정이 필요.

## 클러스터 분류

### A. `exactOptionalPropertyTypes` 충돌 — 6개 (Complicated)

**파일**: Field.tsx, Item.tsx, Trigger.tsx(×2), defineApp.bind.ts, register.ts

**근본 원인**: `tsconfig.json`에 `exactOptionalPropertyTypes: true`가 설정되어 있는데, `React.HTMLAttributes<T>`의 optional property들은 `prop?: string` 형태 (=undefined 불허)이고, spread 결과물은 `string | undefined` 형태. 이 둘이 호환되지 않음.

**해법 후보**:
1. `FocusItemProps` / `ZoneProps` 정의에서 optional props에 `| undefined` 명시 → 가장 정직하지만 거대한 변경
2. tsconfig에서 `exactOptionalPropertyTypes` 비활성화 → 다른 곳에서 잡던 에러를 놓치게 됨
3. spread 대신 명시적 prop 전달 → 가장 안전하지만 코드량 증가

**판단**: ② 또는 ①의 변형 필요. 사용자 의사결정 대기.

### B. `FieldCommandFactory` 테스트 불일치 — 5개 (Complicated)

**파일**: field-registry.test.ts (56, 87, 94, 117, 138)

**근본 원인**:
- `FieldCommandFactory = ((payload: P) => BaseCommand) & { id: string; _def?: unknown }`
- 테스트의 mock factory에 `id`, `_def` 속성 없음
- `onChange`가 `FieldConfig`에서 제거됨 (deprecated)

**해법**: `FieldCommandFactory` 정의 변경 — `& { id; _def? }` 요구를 완화하거나, mock factory에 `id` 추가. `onChange` 테스트는 삭제하거나 현행 API에 맞게 리라이트.

### C. 개별 Clear 에러 — 7개

| 파일 | 에러 | 해법 | 난이도 |
|------|------|------|--------|
| `todo.spec.ts:511` | `_secondItem` unused | 변수 삭제 | ⭐ |
| `fsAccessUtils.ts:22` | `.entries()` 미존재 | `lib: ["DOM.Iterable"]` 추가 또는 `@ts-expect-error` | ⭐ |
| `MarkdownRenderer.tsx:102` | `.props` on ReactNode | `isValidElement()` 가드 추가 | ⭐⭐ |
| `ElementPanel.tsx:233` | `.getState` 미존재 | store API 확인 후 수정 | ⭐⭐ |
| `inferPipeline.test.ts:76` | `{ meta: undefined }` + exactOptional | `{}` 로 변경 | ⭐ |
| `TestDashboard.tsx:163` | union 배열 불일치 | 타입 가드 또는 filter 결과 캐스트 | ⭐ |
| `smoke.spec.ts` ×3 | `node:` imports | tsconfig exclude 또는 별도 tsconfig | ⭐ |

### D. Inspector 타입 — 2개 (Complicated)

| 파일 | 에러 | 근본 원인 |
|------|------|----------|
| `InspectorAdapter.tsx:22` | `AppState` ≠ `Record<string, unknown>` | 제네릭 파라미터 |
| `ElementPanel.tsx:233` | `.getState` 미존재 | store API 변경 |

### E. defineApp 내부 — 1개 (Complicated)

| 파일 | 에러 | 근본 원인 |
|------|------|----------|
| `defineApp.testInstance.ts:99` | overload 불일치 | defineCommand bridge 타입 |

## 실행 우선순위

| 순위 | 클러스터 | 개수 | 이유 |
|------|----------|------|------|
| 1 | **C. Clear 에러** | 7 | 즉시 해결 가능, 의사결정 불필요 |
| 2 | **B. FieldCommandFactory** | 5 | FieldConfig 현행에 맞추면 해결, 작은 설계 결정 |
| 3 | **A. exactOptionalPropertyTypes** | 6 | 근본 원인 1개인데 영향 범위가 크다. 사용자 판단 필요 |
| 4 | **D. Inspector** | 2 | Inspector 리팩토링과 함께 |
| 5 | **E. defineApp** | 1 | defineApp 타입 bridge 재설계 시 |

## 의사결정 필요 항목

1. **`exactOptionalPropertyTypes`**: 유지? 비활성화? FocusItemProps에 `| undefined` 추가?
2. **`FieldCommandFactory`의 `& { id; _def? }` 요구**: 이게 runtime에 필요한가, 아니면 타입만의 문제인가?
