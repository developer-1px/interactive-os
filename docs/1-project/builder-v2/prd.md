# PRD — Builder Block Tree & Container Primitives

> builder-v2 | Heavy | 2026-02-20
> Discussion: [block-tree-tab-container](discussions/2026-0220-1131-block-tree-tab-container.md)

## 1. Problem

현재 빌더의 데이터 모델 `sections: SectionEntry[]`는 **플랫 리스트**로, 블록이 다른 블록을 포함할 수 없다.
탭, 아코디언, 캐러셀 등 **조건부 가시성을 가진 컨테이너**를 표현하려면 재귀적 블록 트리가 필요하다.

## 2. Goal

**두 번 개발하지 않을 이상적 구조**: Block Tree + Builder Primitives로 웹의 모든 콘텐츠를 인라인 편집 가능하게 한다.

## 3. Core Principles

1. **Design Block + Editing Overlay** — 디자인은 자유, 편집은 Builder Primitives로 고정
2. **Primitives = Schema** — 프리미티브 사용 자체가 편집 방식의 선언. 별도 검증 불필요
3. **fields: Record\<string, string\>** — 웹 콘텐츠의 편집 가능 원자 값은 전부 문자열

## 4. Data Model

### Before (현재)

```ts
interface SectionEntry {
  id: string;
  label: string;
  type: "hero" | "news" | "services" | "footer";
  fields: Record<string, string>;
}
// state.data.sections: SectionEntry[]
```

### After (목표)

```ts
interface Block {
  id: string;
  type: string;                    // 레지스트리 기반 (open set)
  label: string;
  fields: Record<string, string>;  // 편집 가능 콘텐츠
  children?: Block[];              // 컨테이너면 자식 보유
  accept?: string[];               // 허용 하위 블록 타입 (예: ["section"])
}
// state.data.blocks: Block[]
```

### `accept` Constraint

`accept`는 Container Block이 **어떤 `data-level` 타입의 자식만 받는지** 선언한다.

| Container | `accept` | 의미 |
|-----------|----------|-----|
| Tab Container | `["section"]` | 각 탭 패널 = 독립 Section |
| (미래) Accordion | `["section"]` | 각 패널 = Section |
| (미래) Card Grid | `["group"]` | 각 카드 = Group |

이 제약은 copy/paste, drag, keyboard move 등 모든 블록 이동 경로에서 일원화된 필터로 동작한다 (Phase 2).

### Dual Projection 아키텍처

하나의 Block Tree 데이터에서 두 개의 뷰를 파생한다:

| 영역 | 투영 방식 | ARIA Role |
|------|----------|----------|
| 좌 사이드바 | Tree (폴더/파일 탐색기) | `role="tree"` / `role="treeitem"` |
| 우 캔버스 | Visual Rendering (탭 UI 등) | `role="tablist"` / `role="tabpanel"` |

## 5. Builder Primitives 분류

| 분류 | 프리미티브 | 역할 |
|------|-----------|------|
| **구조** | Section, Group, Item | 공간 계층 |
| **구조 (NEW)** | **Tabs**, TabPanel | 조건부 가시성 컨테이너 |
| **콘텐츠** | Field, Image, Icon, Button, Link, Badge, Divider | 편집 가능 원자 |

## 6. Tab Interaction

- TabList: `role="tablist"`, 좌우 화살표 전환
- Tab: `role="tab"`, Enter로 패널 진입
- TabPanel: `role="tabpanel"`, Escape로 탭 리스트 복귀
- 활성 탭 상태: **런타임 로컬 상태** (퍼블리싱 시 URL 바인딩)

## 7. Sidebar Tree View

```
Sections                 4
──────────────────────────
 1  ▪ Hero
 2  ▾ Tabs: Pricing
       ├─ Monthly
       └─ Annual
 3  ▪ Services
 4  ▪ Footer
```

- indent로 계층 표현
- `▸`/`▾` 접기/펼치기
- ARIA `role="treeitem"` + `aria-expanded`

## 8. Implementation Order

1. **T9** ✅: Block 인터페이스 + SectionEntry 마이그레이션 + 블록 레지스트리 + 재귀 렌더러
2. **T10** ✅: Builder.Tabs 프리미티브 + 인터랙션 + 예제 블록
3. **T11** ✅: 사이드바 트리 뷰 (indent + collapse)
4. **T13** 🔴: Tab Container → 범용 Container Block
   - `Block.accept?: string[]` 필드
   - `BuilderTabs` → Block Tree 데이터 주도 렌더링
   - 사이드바 `role="listbox"` → `role="tree"` 전환
   - Dual Projection 검증

## 9. Success Criteria

- [x] 기존 4개 섹션(Hero, News, Services, Footer)이 Block Tree로 동작
- [ ] Tab Container 블록 추가 시 사이드바에 Tree로 표현 (`role="tree"` + `aria-expanded`)
- [ ] 탭 전환 키보드 내비게이션 동작 (←→ 전환, Enter 진입, Esc 복귀)
- [ ] 탭 라벨 인라인 편집 동작
- [ ] Tab Container에 기존 Section 블록 붙여넣기 가능 (`accept: ["section"]` 검증)
- [ ] Dual Projection: 트리에서 접기/펼치기 ↔ 캔버스 탭 전환 연동
- [x] 기존 테스트 전체 통과
- [ ] Accordion/Carousel로 확장 가능한 구조 확인 (Ideas)
