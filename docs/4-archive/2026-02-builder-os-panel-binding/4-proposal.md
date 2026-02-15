# Builder OS 개밥먹기 — 구현 제안서

## 개요

`defineApp`/`createWidget`의 두 번째 개밥먹기. Todo v3(엔티티 CRUD)와 다른 도메인(flat key-value 콘텐츠 편집)에서의 OS 사용 패턴을 검증한다.

## /divide 분류

### 🟢 Known (정답 있음 → 바로 실행)

| 작업 | 근거 |
|------|------|
| `BuilderApp` defineApp 정의 | Todo v3과 동일 패턴. state 모델만 다름 |
| `BuilderCanvas` createWidget + `updateField` 커맨드 | 순수 상태 변환. Todo의 `syncDraft`와 동형 |
| `selectElement` 커맨드 | Todo의 `selectCategory`와 동형 |
| Unit tests (`builder.test.ts`) | Todo v3 테스트와 동일 구조 |
| NCP 블록 마이그레이션 (useState → useComputed) | 기계적 치환 |

### 🟡 Constrained (선택지 있음 → 트레이드오프 제시)

| 작업 | 선택지 | 제안 |
|------|--------|------|
| 상태 모델 구조 | A) flat map `fields["name"]` vs B) 블록별 nested `hero.title` | **A**: `OS.Field` name과 1:1 매핑, 더 단순 |
| PropertiesPanel 데이터 소스 | A) kernel focus ID로 DOM 조회 vs B) app state의 selectedId로 조회 | **B**: OS 방식, 테스트 가능 |

### 🔴 Open (의사결정 필요)

| 질문 | 맥락 |
|------|------|
| `Builder.Section/Group/Item` 어노테이션 + `data-builder-type` 메타데이터를 어떻게 app state에 등록할 것인가? | 현재 DOM에만 존재하는 메타데이터 |

## 핵심 설계

### State Model

```typescript
interface BuilderState {
  data: {
    fields: Record<string, string>; // "ncp-hero-title" → "AI 시대를 위한..."
  };
  ui: {
    selectedId: string | null;
    selectedType: PropertyType | null;
  };
}
```

### 테스트 전략 (순수함수 → 커맨드 → E2E 순서)

```typescript
// 1. 순수 상태 테스트 — 브라우저 불필요
const app = BuilderApp.create();
app.dispatch.updateField({ name: "ncp-hero-title", value: "새 제목" });
expect(app.state.data.fields["ncp-hero-title"]).toBe("새 제목");

// 2. selector 테스트
app.dispatch.selectElement({ id: "ncp-hero-title", type: "text" });
expect(app.select.fieldValue("ncp-hero-title")).toBe("새 제목");
expect(app.select.selectedType()).toBe("text");

// 3. 양방향 동기화 증명
// 캔버스 인라인 편집 = 패널 편집 = 같은 커맨드
app.dispatch.updateField({ name: "ncp-hero-title", value: "패널에서 수정" });
expect(app.select.fieldValue("ncp-hero-title")).toBe("패널에서 수정");
```

### 변경 파일

| 구분 | 파일 | 변경 |
|------|------|------|
| NEW | `src/apps/builder/app.ts` | defineApp + createWidget + 커맨드 |
| NEW | `src/apps/builder/tests/builder.test.ts` | 단위 테스트 |
| MODIFY | `src/pages/builder/NCPHeroBlock.tsx` | useState → useComputed |
| MODIFY | `src/pages/builder/NCPNewsBlock.tsx` | 동일 |
| MODIFY | `src/pages/builder/NCPServicesBlock.tsx` | 동일 |
| MODIFY | `src/pages/builder/NCPFooterBlock.tsx` | 동일 |
| MODIFY | `src/pages/builder/PropertiesPanel.tsx` | mock → 실데이터 바인딩 |
| MODIFY | `src/pages/BuilderPage.tsx` | DOM 추론 제거, 커맨드 사용 |

## 검증 계획

1. **단위 테스트** (최우선): `npx vitest run src/apps/builder`
2. **타입 체크**: `npx tsc --noEmit`
3. **기존 E2E 유지**: `npx playwright test e2e/builder` (새로 만들지 않음)
4. **브라우저** (최후): 위 3개가 모두 통과한 후에만

## 산출물

1. 동작하는 코드 + 테스트
2. **OS 사용법 발견 보고서** — PRD의 4가지 핵심 질문에 대한 답
