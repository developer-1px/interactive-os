# Builder App — defineApp 두 번째 dogfooding

> Area: 30-apps/32-builder
> Source: src/apps/builder/
> Last synced: 2026-02-18

## 개요

Builder App은 defineApp의 **두 번째 dogfooding**이다.
Todo가 Entity CRUD(id → object)라면, Builder는 **flat key-value 콘텐츠 필드** 패턴이다.
각 필드 이름이 OS.Field의 `name` prop과 1:1 매핑된다.

## Zone 구조

```
BuilderApp (defineApp "builder")
  ├── Selectors (v3 compat):
  │   ├── fieldValue(name) → string
  │   ├── selectedId → string | null
  │   ├── selectedType → PropertyType
  │   └── allFields → Record<string, string>
  └── Zones:
      └── canvas — grid (updateField, selectElement)
```

## 커맨드 인벤토리

### canvas Zone (role: grid)
| 커맨드 | Payload | 설명 |
|--------|---------|------|
| updateField | `{ name, value }` | 필드 값 변경 (인라인 + 패널 공유) |
| selectElement | `{ id, type }` | 요소 선택 상태 변경 |

## 상태 구조

```ts
interface BuilderState {
  data: {
    fields: Record<string, string>;  // field name → value
  };
  ui: {
    selectedId: string | null;
    selectedType: PropertyType;      // "text" | "image" | "icon" | ...
  };
}
```

## 설계 특징

1. **Flat Field 패턴** — Todo처럼 entity ID 기반 CRUD가 아닌, 이름 기반 key-value
2. **v3 Compat** — `defineApp` options에 `selectors` 직접 전달 (named selector proxy)
3. **builderUpdateField()** — OS.Field의 callback-based API와 defineApp state를 연결하는 브릿지
4. **NCP 블록** — 실제 네이버클라우드 랜딩페이지 구조를 시뮬레이션

## 파일 구조

```
src/apps/builder/
├── app.ts               — defineApp, zones, commands (232줄)
├── FocusDebugOverlay.tsx — 개발용 포커스 디버그 오버레이
├── primitives/           — 빌더 UI 컴포넌트 (블록, 카드 등)
└── tests/                — Unit / E2E 테스트
```
