# Inspector API 분리 — 대화 기록

## 발단: PoC 리뷰에서 구조적 문제 감지

**🧑 사용자**: createKernel에 inspector가 필요한 부분을 몰아서 API가 늘어나도 관리를 용이하게 할 수 있을까? root를 제외하고 나머지 inspector 분량이 점점 늘어나는 느낌인데?

**🤖 AI**: 현황을 수치로 분석. Inspector 관련이 반환 블록의 ~60%를 차지. 업계 표준인 Facade/Namespace 패턴으로 `kernel.inspector.*`로 그룹핑하는 방향을 제안. 3가지 구현 방향 제시:
- A. 객체 리터럴 네스팅 (가장 단순)
- B. createInspector() 팩토리 분리 (파일 분리 가능)
- C. `__inspector` getter (dev-only)

"A를 먼저, 문제 되면 B로" — 즉, "나중에" 접근을 제안.

---

## 전환점 1: "나중에"를 거부

**🧑 사용자**: 커널은 최대한 우아하게 할수 있는데까지 해서 변화를 최소화 해야해. 하다가 문제가 되면 이라고 생각하지 말고 개발 공학을 최대한 적용하자. 특히 low-level은 known문제일텐데?

**🤖 AI**: 맞다고 인정. B의 리스크(클로저 변수 `let state` 참조 끊김, 내부 구조 노출)를 해결하는 Known 패턴으로 **Port/Adapter** 제안:
- `KernelIntrospectionPort` 인터페이스로 narrow read-only 창을 정의
- `createInspector(port)` — 별도 파일, 포트만 의존
- 클로저 안에서 port 객체를 getter로 생성하여 `let state` 문제 해결

---

## 전환점 2: 자가 점검

**🧑 사용자**: 또 네가 알고 있는 정답인데 적용하지 않는게 있다면?

**🤖 AI**: `/reflect` 1차 실행. 6건 발견:
1. Port 타입에 `unknown` 사용 — 100% 타입 위반
2. `buildBubblePath` Port 미포함
3. consumer 영향 범위 미확인 → 6파일 14호출 확인
4. `index.ts` export 변경 미고려
5. PoC 부채를 "허용"으로 넘긴 것 — "등록"으로 변경 필요

---

## 전환점 3: 끝까지

**🧑 사용자**: 놓친게 없을때까지

**🤖 AI**: `/reflect` 2차 실행. 5건 추가 발견:
1. `"GLOBAL"` 매직 스트링 → `GLOBAL` 상수 미사용
2. `evaluateWhenGuard(scope: string)` → `ScopeToken` 브랜드 타입 무시
3. `getRegistry()` 반환에서 ScopeToken 소실
4. `getRegistry()` 매 호출 Map 5개 생성 → dirty flag 캐싱 미적용
5. Port가 핸들러 참조를 노출 → ISP 위반 → narrow typed accessor로 전환

최종적으로 Port 인터페이스를 재설계:

```ts
interface KernelIntrospectionPort {
  getCommandTypes(scope: ScopeToken): readonly string[];
  getWhenGuardTypes(scope: ScopeToken): readonly string[];
  getMiddlewareIds(scope: ScopeToken): readonly string[];
  getEffectTypes(scope: ScopeToken): readonly string[];
  getAllScopes(): readonly ScopeToken[];
  getParent(scope: ScopeToken): ScopeToken | null;
  evaluateWhenGuard(scope: ScopeToken, type: string): boolean | null;
  getTransactions(): readonly Transaction[];
  getLastTransaction(): Transaction | null;
  clearTransactions(): void;
  travelTo(index: number): void;
}
```

---

**한 줄 요약:** "나중에 하자"를 두 번 거부하면서, Inspector 분리를 Port/Adapter 패턴 + 타입 안전성 + 캐싱까지 Known 수준으로 완성했다.

---

# Conclusion: Inspector API 분리

## Why
`createKernel` 반환 객체에서 Inspector API가 ~60%를 차지하며 성장 추세. 핵심 런타임(dispatch, store, group/scope)과 디버깅 도구(transaction, registry, scope tree)의 경계가 흐려지고 있다.

## Intent
커널 본체의 인터페이스 안정성을 보호하면서, Inspector가 자유롭게 성장할 공간을 확보한다.

## Warrants (전체)

### 구조적 근거
- W1. Inspector가 반환 블록의 ~60% — 분리 필요
- W2. 인라인 30줄 함수(getRegistry) = 코드 냄새
- W3. Facade/Namespace = 업계 표준 (Redux DevTools, Zustand devtools)
- W4. frozen은 핵심 런타임에만 — Inspector는 자유
- W8. low-level은 처음부터 제대로 — "나중에"는 커널에 적용하면 안 됨

### Port/Adapter 설계 근거
- W5. Port로 클로저 안전성 유지 (getter로 `let state` 참조)
- W6. C(getter)의 tree-shake는 싱글톤에서 무의미
- W7. Port 인터페이스는 `unknown` 금지
- W9. Port는 핸들러 참조 노출 금지 (ISP)
- W14. Narrow accessor — 커맨드 타입 목록만 반환

### 타입 안전성 근거
- W12. `ScopeToken` 브랜드가 Inspector API 전체에 관통해야 함
- W13. `getRegistry()` 캐싱 = dirty flag 패턴, 설계 시점에 결정

### 운영 근거
- W10. consumer 6파일 14호출 — 기계적 치환, 리스크 낮음
- W11. PoC 부채는 "허용"이 아니라 "등록"

## 결정사항

### 아키텍처
```
kernel.inspector.getRegistry()
kernel.inspector.evaluateWhenGuard(scope, type)
kernel.inspector.getTransactions()
kernel.inspector.getLastTransaction()
kernel.inspector.clearTransactions()
kernel.inspector.travelTo(index)
kernel.inspector.getScopePath(scope)
kernel.inspector.getScopeParent(scope)
```

### 파일 구조
```
packages/kernel/src/
  createKernel.ts        ← Port 생성 + core만 반환
  createInspector.ts     ← Inspector 구현 (Port 의존)
  core/
    tokens.ts
    transaction.ts
    inspectorPort.ts     ← Port 인터페이스 + RegistrySnapshot 타입
```

### Port 인터페이스 (최종)
```ts
interface KernelIntrospectionPort<T> {
  getState(): T;
  getCommandTypes(scope: ScopeToken): readonly string[];
  getWhenGuardTypes(scope: ScopeToken): readonly string[];
  getMiddlewareIds(scope: ScopeToken): readonly string[];
  getEffectTypes(scope: ScopeToken): readonly string[];
  getAllScopes(): readonly ScopeToken[];
  getParent(scope: ScopeToken): ScopeToken | null;
  buildBubblePath(scope: string): string[];
  evaluateWhenGuard(scope: ScopeToken, type: string): boolean | null;
  getTransactions(): readonly Transaction[];
  getLastTransaction(): Transaction | null;
  clearTransactions(): void;
  travelTo(index: number): void;
}
```

### 캐싱 전략
- dirty flag + lazy memoization
- `defineCommand`/`defineEffect`/`use` 호출 시 dirty = true
- `getRegistry()` 호출 시 dirty이면 재생성, 아니면 캐시 반환

## 한 줄 요약
> Inspector를 Port/Adapter로 분리하여, 커널은 핵심 런타임만 남기고 Inspector는 타입 안전한 narrow port를 통해 자유롭게 성장한다.
