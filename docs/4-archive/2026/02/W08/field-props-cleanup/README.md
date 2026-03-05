# Field Props Cleanup

- Start Date: 2026-02-21
- Predecessor: `field-compound` (completed 02-20)

## Summary

Field가 `Editable / Input / Textarea / Label` compound namespace로 분리된 후,
Editable의 prop interface에 **파생 가능한 prop 5개**와 **이름 불일치**가 남아 있다.
이를 정리하여 LLM 예측 가능성과 Pit of Success를 확보한다.

## Motivation

> `/discussion` + `/doubt` 산출물

1. **파생 prop은 모순 조합을 허용한다** — `mode="deferred"` + `blurOnInactive={false}` 같은 의도 불명 상태가 타입상 가능.
2. **미사용 prop이 LLM을 혼란시킨다** — `target`, `controls`는 사용처 0인데 interface에 존재.
3. **이름이 실체와 다르다** — `FieldProps`가 "전체 Field 공통"으로 읽히지만 실제로는 Editable 전용.
4. **`name`이 optional이면 레지스트리 충돌** — fallback `"unknown-field"`는 다중 필드에서 충돌.

## Detailed Design

### 제거 대상 (5건 — /doubt Round 1)

| Prop | 제거 사유 | 대체 |
|------|---------|------|
| `multiline` | `fieldType`에서 도출 (block→multiline CSS+aria) | `fieldType` |
| `blurOnInactive` | `mode`에서 도출 (deferred→blur) | `mode` |
| `as` | `fieldType`에서 도출 (block→div, inline→span) | `fieldType` |
| `target` | 사용처 0, 과잉생산 | 필요 시 재추가 |
| `controls` | 사용처 0, target과 쌍 | 필요 시 재추가 |

### 강화 (1건)

- `name: string` — optional → **required**

### Rename

- `FieldProps` → `EditableProps`

### After: 최종 Interface

```ts
export interface EditableProps extends Omit<HTMLAttributes<HTMLElement>,
  "onChange" | "onBlur" | "onFocus" | "onSubmit"> {
  // Identity & Value
  value: string;
  name: string;
  placeholder?: string;

  // Commit pipeline
  onCommit?: FieldCommandFactory;
  trigger?: FieldTrigger;
  schema?: ZodSchema;
  resetOnSubmit?: boolean;
  onCancel?: BaseCommand;

  // Behavior
  mode?: FieldMode;       // "immediate" | "deferred"
  fieldType?: FieldType;  // "inline" | "block" | "tokens" | "editor"
}
```

### 내부 도출 로직

```ts
// fieldType → as tag
const tag = (fieldType === "block" || fieldType === "editor") ? "div" : "span";

// fieldType → multiline CSS + aria
const isMultiline = fieldType === "block" || fieldType === "editor";
const lineClasses = isMultiline ? "whitespace-pre-wrap break-words" : "whitespace-nowrap overflow-hidden";

// mode → blurOnInactive
const blurOnInactive = mode === "deferred";
```

### 영향 범위

| 파일 | 변경 |
|------|------|
| `Field.tsx` | interface rename, prop 제거, 내부 도출 로직 추가 |
| `defineApp.bind.ts` | FieldComponent props 보강 |
| `defineApp.types.ts` | BoundComponents.Field 타입 갱신 |
| `TaskItem.tsx` | `blurOnInactive={true}` 제거 |
| `NCP*Block.tsx` (Builder) | `multiline` → `fieldType="block"`, `as="div"` 제거 |

## Unresolved Questions

- `fieldType`이라는 이름이 최선인가? (현재 판정: 전파 비용 > 이름 개선 이득 → 유지)
