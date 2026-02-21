# Spec — Block Tree 데이터 모델

> Source: builder-v2 prd.md, builder-mvp report.md
> Verified: Production code, Block interface in model/appState.ts

## 1. Block Interface

```ts
interface Block {
  id: string;
  type: string;                    // 레지스트리 기반 (open set)
  label: string;
  fields: Record<string, string>;  // 편집 가능 콘텐츠. 모든 값은 문자열
  children?: Block[];              // 컨테이너면 자식 보유
  accept?: string[];               // 허용 하위 블록 타입
}
```

## 2. 핵심 원칙

1. **fields: Record\<string, string\>** — 웹 콘텐츠의 편집 가능 원자 값은 전부 문자열
2. **Design Block + Editing Overlay** — 디자인은 자유, Builder Primitives가 편집 포인트 선언
3. **Primitives = Schema** — 프리미티브 사용 자체가 편집 방식의 선언

## 3. Builder Primitives

| 분류 | 프리미티브 | 역할 |
|------|-----------|------|
| 구조 | Section, Group, Item | 공간 계층 |
| 컨테이너 | Tabs, TabPanel | 조건부 가시성 |
| 콘텐츠 | Field, Image, Icon, Button, Link, Badge, Divider | 편집 가능 원자 |

## 4. accept Constraint

Container Block이 허용하는 자식 블록 타입 선언.

| Container | `accept` | 의미 |
|-----------|----------|------|
| Tab Container | `["section"]` | 각 탭 패널 = 독립 Section |
| (미래) Accordion | `["section"]` | 각 패널 = Section |

## 5. Dual Projection

하나의 Block Tree → 두 개의 뷰:

| 영역 | 투영 | ARIA Role |
|------|------|-----------|
| 사이드바 | Tree (탐색기) | `role="tree"` / `role="treeitem"` |
| 캔버스 | Visual Rendering | `role="grid"` / `role="tablist"` |

## 6. Flat → Tree 마이그레이션 이력

```
v1: SectionEntry[] (flat, type: enum)
v2: Block[] (tree, type: string open set, children recursive)
```

마이그레이션: `sections → blocks`, 9개 파일 변경, `BLOCK_COMPONENTS` 레지스트리 도입.
