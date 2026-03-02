# pipeline-folder-restructure

## Principle

**4-Lens Folder Stack**: Flow → Dependency → Concept → Topology
→ `.agent/knowledge/folder-structure.md`

## Final Structure

```
src/os/  (10 folders, 0 files)
├── 1-listen/     Sense     (Flow: P1)
│   ├── keyboard/ pointer/ mouse/ clipboard/ focus/ input/  (Concept: 이벤트 채널)
│   ├── _shared/                                            (Topology: 지원 역할)
│   └── Root.tsx                                            (진입점)
├── 2-resolve/       Intent    (Flow: P2)
├── 3-inject/     Context   (Flow: P3, lazy inject)
├── 4-command/      Resolve   (Flow: P4)
│   └── navigate/ focus/ selection/ field/ clipboard/ ...   (Concept: 개념별 커맨드)
├── 5-effect/       Sync      (Flow: P5)
├── core/            Kernel Infrastructure  (Dependency: leaf layer)
│   ├── types/ state/ registries/ middlewares/ headless/ collection/ lib/
│   ├── widgets/     toast/ radix/ quickpick/ Kbd.tsx       (Topology: React 분리)
│   └── kernel.ts appState.ts                               (부트 진입점)
├── defineApp/       App Framework  (index, types, bind, trigger, undoRedo, page, testInstance)
├── modules/         defineApp Plugins (history, persistence, deleteToast)
├── 6-project/      ZIFT (Zone, Item, Field, Trigger, hooks/)
└── testing/         TestPage + Tests
```

## Verification
- tsc 0 errors ✅
- vitest 142/143 (1 pre-existing aria-listbox) ✅
- 1426/1430 tests passed ✅

## Allowed Tensions
- `core/` 14/18 개념 관여 — `headless/` 본질적 특성
- `3-inject` 번호 3, 실행은 4 내부 — lazy inject 관습
- `core/` 파일+폴더 혼재 — kernel.ts, appState.ts는 부트 진입점
