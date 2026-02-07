# 리팩토링된 CommandEngineStore 레드팀 검수 보고서

**검수 대상:** 
- `src/os/features/command/store/CommandEngineStore.ts` (리팩토링 후)
- `src/os/features/command/ui/CommandContext.tsx` (리팩토링 후)

---

## 1. 개요 (Overview)
기존의 비대했던 `CommandEngineStore`를 "앱 라우터"라는 단일 책임에 집중하도록 간소화한 리팩토링 결과에 대한 레드팀 감사 결과입니다.

---

## 2. 분석 (Details)

### 🔴 CRITICAL: 비가역적 데이터 유실 경고 (Silent Warning)
`dispatch` 실패 시 `console.warn`을 추가했지만, 이는 개발자가 콘솔을 열어봐야만 알 수 있는 **사후 약방문**입니다.
- **취약점:** 앱이 등록되기 전이나 활성 앱이 없을 때 발생하는 중요한 유저 액션이 여전히 "증발"합니다.
- **제안:** `InspectorLog`에 `type: "ERROR"` 또는 `type: "SYSTEM"`으로 커맨드 유실(Command Dropped) 이벤트를 기록하여 디버깅 도구상에서 시각적으로 인지할 수 있게 해야 합니다.

### 🟡 WARNING: InspectorLog 강결합 유지
사용자의 요청에 따라 `InspectorLog`를 직접 호출하는 방식을 유지했으나, 이는 여전히 **아키텍처적 부채**입니다.
- **취약점:** `CommandEngineStore`는 이제 순수한 라우터인데, 디버깅 툴인 `InspectorLog`를 위해 `details: state` 같은 무거운 객체를 계속 임포트하고 처리합니다.
- **제안:** 다음 단계에서 반드시 `EventBus` 기반의 비침습적(Non-invasive) 관찰 모델로 전환하여 Store의 순수성을 회복해야 합니다.

### 🟡 WARNING: 재렌더링 비효율성 (Over-rendering)
`CommandContext.tsx`로 옮겨진 Hook들이 여전히 Store 전체를 구독하고 있을 가능성이 있습니다.
- **현황:** `const activeAppId = useCommandEngineStore((s) => s.activeAppId);`
- **취약점:** `appRegistries` Map은 내용물이 바뀌어도 참조가 바뀌지 않으면 괜찮지만, 만약 `set` 시에 Map을 새로 생성하는 로직이 있다면(`new Map(get().appRegistries)`), 무관한 앱 등록 시에도 모든 UI 컴포넌트가 재렌더링될 수 있습니다. (현재 `registerApp`에서 `new Map` 수행 중)

### 🟢 INFO: 인터페이스 간소화 성공
`getActiveRegistry`, `getOSRegistry`, `setActiveApp` 등 그동안 팀원들을 혼란스럽게 했던 "죽은 가지"들이 모두 제거되었습니다. 이제 "커맨드가 왜 안 가지?"를 추적할 때 살펴야 할 코드가 40% 줄어들었습니다.

---

## 3. 결론 (Conclusion)

### 총평: "안전해졌으나, 아직은 시한폭탄을 안고 있는 상태"

**성과:** 
- 책임의 분리 (Store vs Hook) 성공.
- 코드 응집도(Cohesion) 대폭 상승.

**남은 과제:**
1. **커맨드 유실 시각화:** `console.warn`을 넘어 Inspector 스트림에 빨간색 로그로 표시할 것.
2. **의존성 제거:** `InspectorLog`를 Store에서 떼어내어 `CommandGateway`나 `EventBus` 쪽으로 밀어낼 것.
3. **상태 분리:** `appRegistries`는 자주 바뀌지 않으므로 큰 문제는 없으나, `updateAppState` 로그가 너무 잦다면 분리를 검토할 것.

**결정:** 이 코드를 메인 브랜치에 반영하는 것은 **승인(Approve)**하나, 위 위험 요소들에 대한 후속 이슈를 발행해야 함.
