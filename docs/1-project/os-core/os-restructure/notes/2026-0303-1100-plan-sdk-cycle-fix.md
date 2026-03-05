# os-react↔os-sdk 사이클 해소 — Discussion + /divide + /plan

## Discussion Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | headless/(compute, simulate, types) 4파일을 os-core로 이동. os-react→os-sdk 역의존 해소 |
| **📊 Data** | headless/ 4파일 전부 React 의존 0, @kernel+@os-core만 사용. os-react→os-sdk 역의존 1건(Item.tsx→computeItem) |
| **🔗 Warrant** | 위계 kernel→os-core→os-react→os-sdk 확정. 순수 로직은 하위(os-core)에 있어야 |
| **⚖️ Qualifier** | 🟢 Clear |

---

## /divide Backward Chain

| Depth | Subgoal | 충족? | Evidence |
|-------|---------|-------|----------|
| 0 | os-react→os-sdk 역의존 0 | ❌ | Item.tsx:13 `@os-sdk/library/headless/compute` |
| 1 | A: computeItem이 os-core에 존재 | ❌ | 🔨 이동 필요 |
| 1 | B: Item.tsx가 os-core에서 import | ❌ | →A 완료 후 자동 |
| 2 | A1: compute.ts의 모든 의존이 os-core 이하 | ✅ | `@os-core/3-inject`, `@os-core/engine/registries` |
| 2 | A2: simulate.ts의 모든 의존이 os-core 이하 | ✅ | `@kernel`, `@os-core/1-listen`, `@os-core/2-resolve` |
| 2 | A3: types.ts의 모든 의존이 os-core 이하 | ✅ | `@os-core/engine/kernel` |

---

## /plan 변환 명세표

| # | 대상 | Before | After | Cynefin |
|---|------|--------|-------|---------|
| 1 | `headless/compute.ts` (196줄) | `@os-sdk/library/headless/` | `@os-core/3-inject/compute.ts` | 🟢 |
| 2 | `headless/simulate.ts` | `@os-sdk/library/headless/` | `@os-core/3-inject/simulate.ts` | 🟢 |
| 3 | `headless/types.ts` | `@os-sdk/library/headless/` | `@os-core/3-inject/headless.types.ts` | 🟢 |
| 4 | `headless/index.ts` | `@os-sdk/library/headless/` | re-export from os-core로 교체 | 🟢 |
| 5 | `Item.tsx` import 갱신 | `@os-sdk/library/headless/compute` | `@os-core/3-inject/compute` | 🟢 |
| 6 | 전체 `@os-sdk/library/headless` 참조 갱신 | N곳 | `@os-core/3-inject/...` | 🟢 |

### 검증
```bash
npx tsc --noEmit                    # tsc 0
npx vitest run                      # 141/144 (baseline)
# os-react → os-sdk 역의존 0 확인
grep -rl '@os-sdk/' packages/os-react/src   # 0 files
```
