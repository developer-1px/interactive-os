# `1-listeners/` 응집도 리팩토링 제안서

| 항목 | 내용 |
|---|---|
| 원문 | 응집도 측면에서 폴더링하면서 리팩토링하면서 이름도 맞출 리팩토링 제안서 |
| 내(AI)가 추정한 의도 | Listener 폴더가 유틸리티와 뒤섞여 있으니, "Listener = 번역기" 원칙에 맞게 응집도를 높이고 파일 위치를 재정리하라 |

---

## 1. 현재 상태 (AS-IS)

```
1-listeners/
├── ClipboardListener.tsx    # ✅ Listener (60줄)
├── KeyboardListener.tsx     # ✅ Listener (73줄)
├── FocusListener.tsx        # ✅ Listener (213줄)
├── focusDOMQueries.ts       # ❓ DOM 유틸 — FocusListener 전용
├── getCanonicalKey.ts       # ❓ 키 정규화 — KeyboardListener + todoKeys.ts 사용
└── loopGuard.ts             # ❌ 시스템 유틸 — Listener와 무관
```

### 문제 요약

| # | 문제 | 영향받는 파일 |
|---|---|---|
| 1 | **유틸리티 혼재** — `loopGuard`는 시스템 전역 방어 유틸인데 `1-listeners/`에 있음 | `loopGuard.ts` |
| 2 | **타입 누출** — `getCanonicalKey.ts`에 `KeymapConfig` interface가 정의됨 (keymaps 소관) | `getCanonicalKey.ts` |
| 3 | **Private 유틸 미분리** — `focusDOMQueries.ts`는 FocusListener 전용이지만 export되어 있음 | `focusDOMQueries.ts` |
| 4 | **import 경로 불일치** — ClipboardListener는 `@/os-new/kernel` 사용, 나머지는 `../kernel` 사용 | 전체 |

---

## 2. 제안 (TO-BE)

```
1-listeners/
├── ClipboardListener.tsx      # 유지 (이미 정리 완료)
├── KeyboardListener.tsx       # 유지 (import 경로 통일만)
├── FocusListener.tsx          # 유지 (focusDOMQueries 흡수)
└── getCanonicalKey.ts         # → keymaps/로 이동

keymaps/
├── keybindings.ts             # 기존
├── osDefaults.ts              # 기존
├── getCanonicalKey.ts         # ← 1-listeners에서 이동
└── KeymapConfig.ts            # ← getCanonicalKey에서 분리 (또는 getCanonicalKey 내 유지)

lib/                           # (또는 middleware/)
└── loopGuard.ts               # ← 1-listeners에서 이동
```

### 변경 상세

#### 2-1. `loopGuard.ts` → 외부 이동

**근거**: `createReentrantGuard`, `createFrequencyGuard`는 커맨드 디스패치, 포커스 이벤트, 스토어 업데이트 등 **시스템 전역**에서 사용 가능한 방어 유틸. 현재는 FocusListener만 사용하지만, 본질적으로 Listener 계층에 속하지 않음.

**이동 후보**:
- `src/os-new/lib/loopGuard.ts` — 범용 유틸
- `src/os-new/middleware/loopGuard.ts` — 커널 미들웨어 계열

#### 2-2. `getCanonicalKey.ts` → `keymaps/`로 이동

**근거**: 이 파일의 책임은 "키보드 이벤트를 정규화된 키 문자열로 변환". 이건 키 바인딩 시스템의 일부이지 Listener의 일부가 아님. 실제로 `Keybindings.resolve()`와 한 쌍으로 동작함.

**추가**: `KeymapConfig` interface는 현재 사용처가 없으므로 삭제하거나 `keymaps/` 내에 정리.

#### 2-3. `focusDOMQueries.ts` → FocusListener에 흡수 (또는 co-locate)

**근거**: `focusDOMQueries`는 `FocusListener.tsx`만 사용 (31줄). 별도 파일로 분리할 만큼 크지 않고, 외부에서 재사용되지 않음.

**선택지**:
- A) FocusListener.tsx에 인라인 (파일 수 감소)
- B) 동일 폴더에 유지하되 `_focusDOMQueries.ts` (private 관례)

#### 2-4. import 경로 통일

| 파일 | 현재 | 변경 후 |
|---|---|---|
| ClipboardListener | `@/os-new/kernel` | `../kernel` (일관성) |
| 또는 나머지 전부 | `../kernel` | `@os/kernel` (alias) |

프로젝트 전체의 alias 규칙에 따라 하나로 통일.

---

## 3. 결론

| 변경 | 파일 | 난이도 |
|---|---|---|
| `loopGuard.ts` 이동 | 1파일 + 1~2 import 수정 | 쉬움 |
| `getCanonicalKey.ts` 이동 | 1파일 + 2 import 수정 (KeyboardListener, todoKeys) | 쉬움 |
| `focusDOMQueries` 흡수/정리 | 1파일 | 쉬움 |
| import 경로 통일 | 3파일 | 쉬움 |

**리팩토링 후 `1-listeners/`에 남는 파일**: ClipboardListener, KeyboardListener, FocusListener — **순수 Listener만 3개**. "Listener = 번역기" 원칙에 부합.

---

## 자기 평가

- **점수**: B
- **Evidence**: 현재 6개 파일의 응집도 문제를 정확히 식별하고 TO-BE 구조를 제안했지만, `loopGuard`의 최종 이동 위치(lib vs middleware)는 사용자 판단이 필요한 열린 결정으로 남겨둠. 코드 수준의 diff는 포함하지 않았으나 제안서 성격상 적절.

---

## 한줄요약

> `1-listeners/`에 섞여 있는 유틸 3개(loopGuard, getCanonicalKey, focusDOMQueries)를 각각 적절한 곳으로 이동시켜, 폴더에 순수 Listener 3개만 남기는 응집도 리팩토링.
