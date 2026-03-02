# ADR: ZIFT 4-프리미티브 → Zone 단일 Facade 전환

> 2026-03-01 | Status: **Accepted**

## 결정

ZIFT의 외부 API를 **Zone 하나의 Facade**로 통합한다.
Item, Field, Trigger는 Zone의 **내부 개념**으로 흡수된다.

## 맥락

기존 ZIFT는 4개 프리미티브(Zone, Item, Field, Trigger)를 **동등한 수준의 독립 개념**으로 노출했다. 이 모델은 ARIA 접근성 패턴에는 잘 맞았으나, Data(Entity/Collection)와 CRUD를 통합하려 할 때 문제가 발생:

- Zone ≠ Collection, Item ≠ Entity → 매핑이 암묵적
- Field를 string/boolean/number로 확장할수록 책임 비대화 (7~8회 리팩토링 반복)
- `createCollectionZone`이라는 별도 Facade가 필요해짐 → 모델 밖 개념 증식

## 고려한 대안

### A. 5번째 프리미티브 추가 (Entity 또는 Collection)
- **기각 이유**: 개념 수 증가. Zone↔Collection, Item↔Entity 이중 구조가 더 복잡해짐

### B. ZIFT 4개 유지 + 매핑 공식화
- **기각 이유**: 4개 프리미티브 각각에 ARIA/Data/CRUD 3축 R&R을 정의하면 4×3 = 12개 책임 매트릭스 → 복잡성 폭발

### C. Zone을 유일한 Facade로 (채택)
- Zone = `from`/`to` + `entity` + `with[]`
- Item = NormalizedStore의 엔트리 (Zone이 자동 도출)
- Field = entity schema의 속성 (Zone이 자동 매핑)
- Trigger = `with[]` 모듈의 액션 (activate, crud 등)

## 폐기된 분석

### ZIFT 4-프리미티브 커버리지 표 (폐기)

이 분석은 4개 프리미티브가 독립이라는 전제로 작성. Zone 단일 Facade 모델에서는 무의미.

| 개념 영역 | Zone | Item | Field | Trigger | 미소유 |
|-----------|:----:|:----:|:-----:|:-------:|:------:|
| Topology | ✅ | ✅ | — | — | |
| Navigation | ✅ | ✅ | — | — | |
| Focus | — | ✅ | — | — | Stack은 OS |
| Selection | ✅ | ✅ | — | — | |
| Activation | — | ✅ | — | ✅ | |
| Field | — | — | ✅ | — | |
| Overlay | — | — | — | — | ⚠️ |
| Data | — | — | — | — | ⚠️ |
| CRUD | — | — | △ | ✅ | |

**폐기 이유**: "ZIFT가 18개 중 10개만 커버"라는 결론은 ZIFT의 범위를 잘못 설정한 결과. ZIFT는 OS 전체가 아니라 **뷰↔데이터 접점**만 담당. History, Pipeline, Verification은 별도 레이어.

### 탐색했지만 채택하지 않은 API

```typescript
// ❌ app.detail() — Master-Detail 별도 프리미티브
// 기각: Zone의 from()에서 선택된 아이템 기반으로 소싱하면 충분. 별도 개념 불필요.
const properties = app.detail("properties", { source: sidebar });

// ❌ <sidebar.View /> — OS 자동 생성 UI
// 미확정: ZIFT가 헤드리스인지 기본 UI도 제공하는지 결정 안 됨.

// ❌ entity: (state) => dynamicSchema — 동적 schema 함수
// 미확정: 타입 안전성 보장 방법 불명. T1에서 설계.
```

## 결과

- `concept-map.md` — 순수 개념 트리만 남김. 커버리지 분석 제거
- `usage-spec-builder.md` — 확정된 핵심 모델만 남김. 미확정은 BOARD T1~T6으로 위임
- `normalized-store-design.md` — 확정된 shape만 남김. 미확정 타입 제거
