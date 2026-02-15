# OS Core Refactoring — 현황

> 마지막 갱신: 2026-02-12
> 전체 진행률: **~65%** (기능 기준)

---

## 📋 현재 상태 요약

| Layer | 상태 | 비고 |
|-------|------|------|
| **Kernel** | ✅ 완성 | dispatch, bubblePath, EffectMap, Transaction, useComputed |
| **OS (os-new)** | 🚧 부분 완성 | Legacy Pipeline ↔ Kernel Pipeline 공존 중 |
| **App** | ❌ 미착수 | kernel 기반 재작성 필요 |

### 파이프라인 계층별 현황

| 계층 | 상태 | 상세 |
|------|------|------|
| 1-listeners | ✅ | Keyboard, Clipboard, Focus, History — 모두 마이그레이션 완료 |
| 2-contexts | ✅ | DOM_ITEMS, DOM_RECTS, ZONE_CONFIG, ZoneRegistry |
| 3-commands | ⚠️ | NAVIGATE, ACTIVATE, ESCAPE, TAB, SELECT 등 Kernel 등록 완료. FIELD_*, DELETE, TOGGLE은 Pipeline only |
| 4-effects | ✅ | FOCUS, SCROLL, BLUR, CLICK — Kernel defineEffect 전환 완료 |
| 5-hooks | ✅ | useFocused, useSelected, useActiveZone — Kernel useComputed 기반 |
| 6-components | ⚠️ | Zone, Item 완료. App, Field, Label, Root, Trigger 미전환 |

---

## 🔴 Now (이번 주)

- [ ] **Legacy Pipeline Dead Code 제거** — `*Command.ts` 래퍼, old KeyboardIntent/Sensor
- [ ] **FocusData → Kernel State 전환**
- [ ] **FIELD_* 커맨드 Kernel 등록** — START_EDIT, COMMIT, CANCEL, BLUR, SYNC (5개)
- [ ] **Field 컴포넌트 Kernel 기반 재작성** — Zustand FieldRegistry → Kernel dispatch

---

## 🟡 Next (이번 달)

- [ ] **CommandEngineStore → Kernel 완전 전환** (Phase 3)
  - `defineApplication` → kernel `group({ scope })`
  - Apps (todo, kanban): kernel group 기반 커맨드 등록
- [ ] **Legacy Pipeline 최종 삭제** — `os/features/command/`, `keyboard/pipeline/`, `focus/pipeline/`
- [ ] **COPY/CUT/PASTE/DELETE/UNDO/REDO** Kernel 커맨드 등록
- [ ] **`useFocusRecovery`** Kernel useComputed 기반 재구현
- [ ] **os-new 커맨드 단위 테스트** 추가

---

## 🟢 Later (미래)

- [ ] Builder* 컴포넌트 처리 (Kernel 전환 또는 분리)
- [ ] Trigger, Label, Root 컴포넌트 Kernel 전환
- [ ] PersistenceAdapter 구현
- [ ] `os/` 폴더 완전 삭제 → `os-new/` → `os/` 리네임
- [ ] focus-showcase 기반 Playwright 스냅샷 테스트 (CI 통합)

---

## ❗ Blockers

| 블로커 | 영향 |
|--------|------|
| **Builder* 유지 여부 결정** — 6개 Builder 컴포넌트가 NCP 데모 전용 | `os/` 삭제 시점 |
| **Zustand(3-store) 제거 시점** — `primitives/FocusGroup.tsx`가 의존 | 이중 상태 관리 |
| **양방향 의존** — `os/` ↔ `os-new/` 교차 import ~47곳 | 마이그레이션 완료 조건 |
| **데드라인 미설정** — 점진적 마이그레이션의 최대 리스크 | 전체 프로젝트 |

---

## 📊 마일스톤

| 마일스톤 | 상태 | 날짜 |
|----------|------|------|
| Kernel 패키지 완성 | ✅ | 2026-02-09 |
| Spike (Kernel 기반 Zone 프로토타입) | ✅ | 2026-02-10 |
| 6-Domino 폴더 구조 적용 | ✅ | 2026-02-09 |
| Legacy Dead Code 1차 정리 | ✅ | 2026-02-10 |
| Dialog/Modal Kernel 구현 | ✅ | 2026-02-11 |
| FIELD 커맨드 Kernel 등록 | ⬜ | — |
| CommandEngineStore 제거 | ⬜ | — |
| `os/` 완전 삭제 | ⬜ | — |
