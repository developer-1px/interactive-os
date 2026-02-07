# CommandEngineStore.ts 심층 분석 및 간소화 제안

**분석 대상:** `src/os/features/command/store/CommandEngineStore.ts`
**검토 목적:** 코드의 용도/효용성 확인 및 간소화 가능성 분석

---

## 1. 코드의 용도 및 효용성 (Purpose & Utility)

이 파일은 OS의 **커맨드 실행 두뇌(Brain)** 역할을 담당하는 핵심 저장소입니다.

*   **중앙 레지스트리 (Central Registry):** OS 수준의 명령어(복사, 붙여넣기 등)와 각 앱(App)별 명령어 매핑 정보를 저장합니다.
*   **실행 라우터 (Execution Router):** 입력된 커맨드(`cmd.type`)를 받아 현재 활성화된 앱의 실제 핸들러 함수(`dispatch`)로 전달합니다.
*   **상태 스냅샷 (State Snapshot):** Time Travel Debugging이나 TestBot을 위해 앱의 현재 상태(`state`)를 보관하고 복원하는 기능을 제공합니다.
*   **통합 로깅 (Unified Logging):** 최근 변경을 통해 모든 커맨드 실행의 로그를 수집하는 단일 관문(Gateway) 역할을 수행합니다.

**판단:** 이 모듈은 OS 아키텍처에서 **제거할 수 없는 필수 컴포넌트**입니다. 다만, 구현 방식에서 불필요한 복잡도가 발견되었습니다.

---

## 2. 간소화 검토 (Simplification Analysis)

코드를 면밀히 분석한 결과, 기능에는 영향을 주지 않으면서 코드를 줄이고 구조를 단순화할 수 있는 4가지 영역을 발견했습니다.

### ① 죽은 코드 제거 (Dead Code Elimination)

다음 함수들은 정의만 되어 있고, 프로젝트 전체에서 **한 번도 호출되지 않습니다.** 삭제하여 번들 사이즈를 줄이고 인터페이스를 명확히 해야 합니다.

| 함수명 | 라인 | 제안 |
|--------|------|------|
| `getActiveRegistry()` | L50, L111 | **삭제** (외부에서 레지스트리를 직접 조회하는 로직 없음) |
| `getOSRegistry()` | L51, L118 | **삭제** (과거 `routeCommand`에서 사용했으나 현재는 미사용) |
| `setActiveApp()` | L46, L89 | **삭제** (`registerApp`이 활성화를 담당하므로 불필요) |
| `useContextMap` | L183 | **삭제** (`CommandContext`에서 re-export 되지만 실제 사용처 0) |

### ② 아키텍처 분리 (Separation of Concerns)

현재 파일은 **Zustand Store 정의**와 **React Hooks 정의**가 뒤섞여 있습니다.

*   **현황:** `useDispatch`, `useAppState` 등의 Hook이 Store 파일 하단(L160~)에 정의됨.
*   **문제:** Store는 순수한 상태 로직만 가져야 하며, UI 연결용 Hook은 별도 파일(`CommandContext.tsx` 또는 `hooks/`)에 있는 것이 맞습니다. 또한 현재 `CommandContext.tsx`에서 이들을 다시 export 하는 중복 구조가 있습니다.
*   **제안:** 하단의 "Convenience Hooks" 섹션(L157~L187)을 **전체 삭제**하고, `CommandContext.tsx`로 이관하거나 통합하십시오.

### ③ 안전한 커맨드 실행 (Safety)

```typescript
// L195 dispatch 함수
if (dispatch) {
  // ... 실행
}
// else -> Silent Failure (아무 일도 안 일어남)
```

**제안:** 코드를 복잡하게 만드는 것이 아니라, **안전 장치를 추가**해야 합니다. `activeDispatch`가 없을 경우 `console.warn`을 출력하거나 InspectorLog에 `DROP` 이벤트를 남겨 디버깅 시간을 단축해야 합니다.

### ④ 불필요한 정적 래퍼 제거

```typescript
// L254 CommandEngineStore 객체
get: () => useCommandEngineStore.getState(),
```

**제안:** `CommandEngineStore.get()`은 `useCommandEngineStore.getState()`와 완전히 동일합니다. 굳이 래퍼를 유지할 효용이 낮습니다. 직접 호출로 통일하여 간소화할 수 있습니다.

---

## 3. 결론 및 실행 제안 (Conclusion)

이 파일은 필수적이지만, **약 20~30%의 코드는 정리 가능**합니다.

**실행 계획:**
1.  **[즉시]** Dead Code (`getActiveRegistry`, `getOSRegistry`, `setActiveApp`) 삭제.
2.  **[즉시]** Store 파일 내의 React Hooks를 제거하고 `CommandContext.tsx`로 역할을 넘김.
3.  **[권장]** `dispatch` 함수에 `else` 분기를 추가하여 '커맨드 유실 경고' 추가.

이 작업을 통해 파일의 라인 수를 줄이고, "저장소"로서의 단일 책임 원칙(SRP)을 강화할 수 있습니다.
