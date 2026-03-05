# /plan — OS 패키지 분리 변환 명세표

> **Date**: 2026-03-02
> **Source**: /discussion (os-cold-evaluation) → /divide (REPORT.md) → /plan
> **Scope**: `src/os/` 19,729줄 → 5개 패키지로 분리

---

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `@/os/*` alias 혼재 (45파일) | `@/os/4-command/focus` 등 45개 파일에서 `@/os/` 사용 | `@os/`로 통일. `@/os/` 전면 제거 | 🟢 Clear | — | tsc 0, vite dev 정상 | sed 일괄 치환. 오탈자 시 빌드 실패 → 즉시 감지 |
| 2 | `core/adapter/widgets/` → `6-project/widgets/` | `core/adapter/widgets/{QuickPick,Dialog,Toast,Modal,Kbd}` — `core/` 안에서 `6-project/Item,Zone,Trigger` 역참조 | `6-project/widgets/`로 이동. 역의존 해소 | 🟢 Clear | — | tsc 0, 기존 테스트 유지 | QuickPick 소비자(`command-palette/`, `apps/`) import 경로 변경 |
| 3 | `packages/os-core/` 생성 | `src/os/{2-resolve,3-inject,4-command,core/engine,core/schema}` + `1-listen/` 순수 파일 7개 | `packages/os-core/src/` 하위로 이동. React-free 순수 TS 패키지 | 🟢 Clear | →#1 | tsc 0, 기존 모든 테스트 유지 | 가장 큰 이동. 97+파일 import 경로 변경 |
| 4 | `packages/os-react/` 생성 | `src/os/{6-project,1-listen/*.tsx,5-effect}` + widgets | `packages/os-react/src/` 하위로 이동. React 바인딩 패키지 | 🟢 Clear | →#2,#3 | tsc 0, 기존 테스트 유지 | os-core를 import해야 하므로 #3 선행 |
| 5 | `packages/os-sdk/` 생성 | `src/os/{app/defineApp/*.ts(page.ts 제외),core/library/collection,app/modules}` | `packages/os-sdk/src/` 하위로 이동. 앱 개발 프레임워크 | 🟢 Clear | →#3,#4 | tsc 0, Todo+Builder 앱 정상 동작 | defineApp이 os-core + os-react 모두 의존 |
| 6 | `packages/os-devtool/` 생성 | `src/os/{testing,core/library/headless,app/defineApp/page.ts,app/defineApp/testInstance.ts}` | `packages/os-devtool/src/` 하위로 이동 | 🟢 Clear | →#3,#5 | tsc 0, 테스트 141개 전체 PASS | page.ts가 os-sdk의 defineApp 타입에 의존 |
| 7 | `tsconfig.app.json` paths 갱신 | `@os/*: ./src/os/*` 단일 alias | 패키지별 alias: `@os-core/*`, `@os-react/*`, `@os-sdk/*`, `@os-devtool/*` | 🟢 Clear | →#3~6 | tsc 0 | vite.config.ts도 동시 갱신 필요 |
| 8 | `vite.config.ts` alias 갱신 | `@os: /src/os` 단일 | 패키지별 경로 추가 | 🟢 Clear | →#7 | vite dev 정상, HMR 동작 | vite와 tsconfig의 alias가 불일치하면 런타임 에러 |
| 9 | import 일괄 변경 | `@os/4-command/...` → `@os-core/commands/...` 등 ~142파일 | 새 패키지 alias로 갱신 | 🟢 Clear | →#3~8 | tsc 0, vite dev 정상 | 리터럴 치환이므로 sed + tsc로 검증 |
| 10 | 잔여 `src/os/` 정리 | 이동 후 `src/os/`에 남는 파일 확인 | `src/os/` 폴더 삭제 또는 re-export index.ts만 유지 | 🟢 Clear | →#9 | `src/os/` 자체 import 0 | 이동 누락 파일이 있으면 빌드 실패 → 즉시 감지 |

---

## MECE 점검

1. **CE**: 10개 행 모두 실행하면 `src/os/` → 5개 패키지 분리 완성? → ✅ 예
2. **ME**: 중복? → `#9`(import 변경)이 `#3~6`(패키지 이동)과 겹칠 수 있으나, 이동과 import 갱신은 별도 작업. → 유지
3. **No-op**: Before=After? → 없음

---

## 의존 그래프

```
#1 (@/os/ 통일)
  ↓
#2 (widgets 이동)
  ↓
#3 (os-core) ←─────────────────────┐
  ↓                                │
#4 (os-react) ──depends on──→ #3   │
  ↓                                │
#5 (os-sdk)  ──depends on──→ #3,#4 │
  ↓                                │
#6 (os-devtool) ─depends on→ #3,#5│
  ↓                                │
#7 (tsconfig)  ──depends on──→ #3~6┘
  ↓
#8 (vite.config) → #7
  ↓
#9 (import 일괄) → #3~8
  ↓
#10 (정리) → #9
```

## 패키지별 내부 구조

### packages/os-core/
```
src/
├── resolve/        ← 2-resolve/ (965줄)
├── inject/         ← 3-inject/ (689줄)
├── commands/       ← 4-command/ (3,538줄)
├── listen/         ← 1-listen/ 순수 파일 7개 (resolve*.ts, senseMouse, domQuery)
├── engine/         ← core/engine/ (1,665줄)
└── schema/         ← core/schema/ (629줄)
```

### packages/os-react/
```
src/
├── primitives/     ← 6-project/{Zone,Item,Field,Trigger}.tsx + accessors/
├── listeners/      ← 1-listen/{Root,*Listener}.tsx (React 6개)
├── effects/        ← 5-effect/ (95줄)
└── widgets/        ← core/adapter/widgets/ (997줄) [#2에서 이동]
```

### packages/os-sdk/
```
src/
├── defineApp/      ← app/defineApp/{index,bind,trigger,undoRedo,types}.ts
├── collection/     ← core/library/collection/
└── modules/        ← app/modules/ (history, persistence, deleteToast)
```

### packages/os-devtool/
```
src/
├── testing/        ← testing/{scripts,createBrowserPage,createHeadlessPage,expect,types}
├── headless/       ← core/library/headless/{simulate,compute}
└── page/           ← app/defineApp/{page,testInstance}.ts
```

---

## 라우팅

승인 후 → `/go` (기존 프로젝트 `os-restructure`) — Heavy 리팩토링. Meta 성격(코드 이동 + import 변경). #1→#10 순차 실행.
