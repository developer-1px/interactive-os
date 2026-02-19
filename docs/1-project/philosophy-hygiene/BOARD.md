# BOARD — philosophy-hygiene

> 근거: [OS 철학 리뷰 보고서](discussions/2026-0219-2114-report-os-philosophy-review.md)
> /doubt 결과 반영: T2를 타입 제약 → ESLint 규칙으로 변경. 커널은 앱 정책을 강제하지 않는다.

## 🔴 Now

### T1. useComputed 실제 위반 수정 (Clear)
> `(s) => s` 패턴은 모든 상태 변경마다 리렌더. 진짜 버그.

- [x] Step 6: InspectorAdapter — `(s) => s` → `useSyncExternalStore` (의도적 전체 구독 명시)
- [x] Step 6: KernelLabPage — `(s) => s` → `useSyncExternalStore` (디버그 도구)
- [x] Step 6: `useField` 헬퍼 추가 — 개별 필드 primitive 구독 패턴
- [x] Step 6: NCPHeroBlock — `useField` 전환 (1/8, 나머지는 builder-v2에서)
- [ ] Step 6: ListView.tsx — `(s) => s` → 개별 필드 구독
- [ ] Step 6: Sidebar.tsx — `(s) => s.data.categories` → 개별 구독 검토
- [ ] Step 11: /verify

### T2. ESLint `no-full-state-useComputed` 규칙 (Clear)
> `(s) => s` 패턴만 기계적으로 차단. 객체 반환은 앱 레이어 정책 (rules.md).

- [ ] Step 6: 규칙 구현 — `useComputed((s) => s)` 정확 매치만 error
- [ ] Step 6: `eslint.config.js` 활성화
- [ ] Step 11: /verify

### T3. pages/ onClick → OS 프리미티브 전환 (Clear)

- [ ] Step 1~11 (미착수)

### T4. deprecated API 완전 제거 (Clear)

- [ ] Step 1~11 (미착수)

### T5. console.log 제거 (Clear)

- [ ] Step 1~11 (미착수)

---

## 🔲 Blocked

### T6. pages/ useState → kernel state 이관
> builder-v2 완료 후 재평가.

---

## ⏳ Done

(없음)

## 💡 Ideas

- [ ] Builder 블록 7개 `useField` 전환 — builder-v2에서 점진적으로.
- [ ] `useComputed` 객체 반환 경고 ESLint 규칙 (soft warning) — T2 완료 후 검토.

---

## /doubt 결과 (1라운드 수렴)

| Round | 🔴 되돌림 | 🟡 축소 | 🟢 유지 |
|:-----:|:--------:|:------:|:------:|
| 1     | 1 (T extends Primitive) | 1 (Builder 마이그레이션 scope) | 3 (useField, Inspector, KernelLab) |

**핵심 통찰**: 커널(`packages/kernel/`)은 재사용 가능한 라이브러리. `T extends Primitive` 제약은 앱 레이어 정책을 커널에 강제하는 것. Chesterton's Fence — 제네릭 `<T>`는 올바른 설계였다.

**수정된 전략**: 
- 커널 타입: 건드리지 않음
- 실제 위반: 개별 수정 (3건)
- 재발 방지: ESLint `(s) => s` 차단 (최소 범위)
- Builder blocks: `useField` 패턴 제공 + 점진적 전환 (builder-v2에서)
