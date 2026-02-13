# 프로젝트 현황 리포트 — 2026-02-13

## 📊 프로젝트 현황 테이블

| 프로젝트 | RAG | Done | In Progress | Todo | 진척률 | 비고 |
|----------|-----|------|-------------|------|--------|------|
| **define-app** | 🟢 | 10 | 0 | 3 | 77% | Phase 1 코어 완료, v3 위젯 UI·E2E 남음 |
| **builder-os-panel-binding** | 🟡 | 4 | 0 | 3 | 57% | NCP 4블록 마이그레이션 완료, PropertiesPanel 미연동 |
| **create-module** | 🟡 | 4 | 0 | 6 | 40% | Discussion·문서 완료, 코어 구현 미착수 |
| **testbot** | 🟡 | 4 | 0 | 3 | 57% | Todo 12/12·Playwright 75/75 PASS, Playground 0/63 |
| **todo-v3-migration** | 🟡 | — | — | — | ~50% | PRD·KPI·Proposal 작성, 상태문서 없음 |
| **builder-focus-navigation** | 🔴 | 0 | 0 | 3+ | 0% | 문서만 생성, 구현 미착수 |
| **focus-recovery** | 🔴 | 0 | 0 | 3+ | 0% | 분석 문서만 존재, 프로젝트 미시작 |
| **stream-inspector** | 🟢 | ✅ | 0 | 0 | 100% | 완료 — UnifiedInspector 통합 |
| **workflow-ecosystem-refactoring** | 🟢 | ✅ | 0 | 0 | 100% | 완료 — 5개 액션 전부 실행 |
| **docs-dashboard** | 🟡 | — | — | — | — | 프로젝트 문서 없음, 현황 불명 |
| **os-core-refactoring** | 🟡 | — | — | — | — | 프로젝트 문서 없음, 현황 불명 |

---

## 🔴 블로커

| 프로젝트 | 블로커 | 영향 |
|----------|--------|------|
| **builder-focus-navigation** | `NAVIGATE` 커맨드의 Context Provider (`DOM_ITEMS`, `DOM_RECTS`) 끊어짐 | 빌더에서 키보드 네비게이션 불가 |
| **create-module** | Proposal 리뷰/승인 대기 | 코어 구현 착수 블로킹 |

---

## 🟡 주의 항목

| 프로젝트 | 리스크 | 설명 |
|----------|--------|------|
| **builder-os-panel-binding** | PropertiesPanel 미연동 | NCP 블록 마이그은 됐지만 패널 폼이 아직 mock 상태. 개밥먹기 목표의 핵심 |
| **builder-os-panel-binding** | 레거시 블록 잔존 | `HeroBlock`, `CTA`, `Features`, `Testimonials` — 여전히 `useState` 사용 |
| **todo-v3-migration** | 상태문서(5-status.md) 부재 | 진척도 추적 불가. 코드 리뷰 위반 수정은 진행된 것으로 확인 |
| **testbot** | Playground 63개 spec 미대응 | 추가 Playwright API shim 필요 (fill, focus, toBeVisible 등) |

---

## ✅ 최근 완료 항목

| 날짜 | 프로젝트 | 완료 내용 |
|------|----------|-----------|
| 2026-02-13 | **stream-inspector** | UnifiedInspector 접이식 패널 통합, 구 코드 삭제, tsc 0err + 12/12 tests |
| 2026-02-13 | **workflow-ecosystem** | `/next` 폐기, `/go`·`/refactor`·`/poc`·`/routes` 생성 (25개 워크플로) |
| 2026-02-13 | **define-app** | `defineApp.ts` + `createWidget` + Todo v3 app 정의 + 19/19 unit tests |
| 2026-02-13 | **builder-os-panel-binding** | NCP 4블록 (Hero·News·Services·Footer) `BuilderApp.useComputed` 마이그레이션 |

---

## 📂 영역(Area) 개요

| 영역 | 문서 수 | 최근 갱신 |
|------|---------|-----------|
| 00-principles | — | — |
| 01-command-pipeline | — | — |
| 02-focus-navigation | — | — |
| 03-os-primitives | — | — |
| 04-aria | — | — |
| 05-kernel | — | — |
| 06-testing | — | — |
| 07-code-standards | — | — |

---

## 🏗️ 빌더 집중 분석

사용자가 물어본 **"빌더 만들기"** 관련 현황을 정리합니다:

### 코드 실측 결과

| 파일 | 상태 | 방식 |
|------|------|------|
| `NCPHeroBlock.tsx` | ✅ 마이그 완료 | `BuilderApp.useComputed` + `builderUpdateField` |
| `NCPNewsBlock.tsx` | ✅ 마이그 완료 | `BuilderApp.useComputed` + `builderUpdateField` |
| `NCPServicesBlock.tsx` | ✅ 마이그 완료 | `BuilderApp.useComputed` + `builderUpdateField` |
| `NCPFooterBlock.tsx` | ✅ 마이그 완료 | `BuilderApp.useComputed` + `builderUpdateField` |
| `HeroBlock.tsx` | ❌ 레거시 | `useState` |
| `CTABlock.tsx` | ❌ 레거시 | `useState` |
| `FeaturesBlock.tsx` | ❌ 레거시 | `useState` |
| `TestimonialsBlock.tsx` | ❌ 레거시 | `useState` |
| `PropertiesPanel.tsx` | ❌ 미연동 | `useState` (mock 폼) |

### 남은 작업 (빌더 전체)

1. **PropertiesPanel 실제 데이터 바인딩** — 패널에서 값 수정 → 캔버스 반영 (개밥먹기 핵심 목표)
2. **레거시 블록 마이그레이션** (4개) — Out-of-scope으로 선언됐지만 코드 일관성 차원
3. **개밥먹기 보고서** — 적용 과정 발견 패턴·마찰·개선점
4. **포커스 네비게이션 복원** — Context Provider 재연결 필요
5. **E2E 테스트** — `builder-spatial.spec.ts` 통과 확인
