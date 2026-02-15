# Code Review — Inspector Port/Adapter 분리

**대상 파일:**
1. `packages/kernel/src/core/inspectorPort.ts` (신규)
2. `packages/kernel/src/createInspector.ts` (신규)
3. `packages/kernel/src/createKernel.ts` (수정 — Port 생성 + invalidate)
4. `packages/kernel/src/index.ts` (수정 — export 추가)
5. Consumer 6개 (기계적 치환)

**일시:** 2026-02-15 09:19

---

## 🔴 철학 위반 (즉시 수정 필요)

### R1. `parentMap.set()` 시 `invalidateRegistry()` 누락
- **파일:** `createKernel.ts` L596
- **코드:** `parentMap.set(childScope, scope);` — 이후 `invalidateRegistry()` 없음
- **문제:** `group()` 호출로 새 scope이 등록되면 scopeTree가 변경됨. 하지만 inspector의 registry 캐시가 stale 상태로 남음.
- **영향:** `inspector.getRegistry().scopeTree`가 이후 등록된 scope을 누락할 수 있음.
- **수정:**
  ```ts
  parentMap.set(childScope, scope);
  inspector.invalidateRegistry();
  ```
- **심각도:** 🔴 — 캐시 불일치 → 데이터 정합성 결함

### R2. `invalidateRegistry()`가 `KernelInspector` public 인터페이스에 노출
- **파일:** `core/inspectorPort.ts` L85-86
- **코드:** `invalidateRegistry(): void;` in `KernelInspector` interface
- **문제:** `@internal` 주석은 있지만 타입레벨에서 외부 consumer가 호출 가능. `kernel.inspector.invalidateRegistry()` — consumer가 임의로 캐시를 무효화할 수 있음.
- **위반 원칙:** Project 3 — *"모든 변경은 하나의 문을 통과한다"*
- **수정 제안:** `KernelInspector`와 별도로 Internal 타입을 분리:
  ```ts
  // Public (consumer용)
  export type KernelInspector<T> = Omit<KernelInspectorInternal<T>, 'invalidateRegistry'>;
  
  // Internal (커널 내부용)
  export interface KernelInspectorInternal<T> extends KernelInspector<T> {
    invalidateRegistry(): void;
  }
  ```
- **심각도:** 🔴 — 캡슐화 결함

### R3. `getLastTransaction()` 반환 타입 불일치
- **파일:** `createKernel.ts` L156 vs `inspectorPort.ts` L40
- **커널 내부:** `function getLastTransaction(): Transaction | undefined` (L156)
- **Port 인터페이스:** `getLastTransaction(): Transaction | null;` (L40)
- **문제:** `undefined`와 `null`이 혼용됨. tsc는 통과하지만(Port가 실제 구현의 super type이므로) 의미적 불일치.
- **위반 원칙:** Goal 4 — 100% 타입
- **수정:** 둘 중 하나로 통일. `null`이 "명시적 부재"를 나타내므로 커널 내부를 `| null`로 변경 권장.
- **심각도:** 🔴

---

## 🟡 네이밍/구조 (리팩토링 권장)

### N1. Port의 `getAllScopes()`에서 whenGuards 스코프 누락
- **파일:** `createKernel.ts` L660-669
- **코드:** `scopedWhenGuards`의 keys가 수집되지 않음
- **문제:** when guard만 등록하고 command를 등록하지 않은 scope이 있다면 누락됨. 현재는 `defineCommand` 안에서 guard가 등록되므로 실질적 문제는 없지만, 방어적으로 추가 권장.
- **수정:**
  ```ts
  for (const s of scopedWhenGuards.keys()) all.add(s);
  ```

### N2. `inspectorPort.ts` 인덴트가 4칸 (프로젝트 2칸 컨벤션)
- **파일:** `inspectorPort.ts` 전체
- **문제:** 프로젝트의 다른 커널 파일은 2칸 인덴트(`tokens.ts`, `transaction.ts`). 이 파일만 4칸.

### N3. `createInspector.ts` 인덴트가 4칸
- **파일:** `createInspector.ts` 전체
- **문제:** N2와 동일.

### N4. `__stateType` phantom 속성
- **파일:** `inspectorPort.ts` L88
- **코드:** `readonly __stateType?: T;`
- **문제:** 실제 사용처 없음. 타입 앵커가 필요하다면 제네릭으로 충분. YAGNI — Project 5 위반 가능.

---

## 🔵 개선 제안

### I1. `RegistrySnapshot`의 Map 키를 `string`으로 유지하는 옵션
- **현재:** `ReadonlyMap<ScopeToken, readonly string[]>`
- **문제:** PoC consumer는 `string`으로 작업하며 `ScopeToken`으로 캐스팅이 필요함.
- **대안:** PoC는 어차피 폐기/재작성 대상이므로 현재 설계 유지가 맞음. ScopeToken이 정답.

### I2. `getLastTransaction`의 반환 시 `null` vs `undefined` 통일
- **R3에서 이미 언급.** `null`로 통일 시 `Array.at(-1)` 대신 명시적 null 반환 필요.

---

## 종합 판정

| 분류 | 건수 | 요약 |
|------|------|------|
| 🔴 철학 위반 | 3건 | parentMap 무효화 누락, invalidate 노출, 타입 불일치 |
| 🟡 네이밍/구조 | 4건 | 스코프 누락, 인덴트, YAGNI phantom |
| 🔵 개선 제안 | 2건 | 타입 통일 |

### 결론

Port/Adapter 분리 자체는 **설계 원칙에 잘 부합**합니다. 하지만 3개의 🔴 항목이 있으므로 즉시 수정이 필요합니다.
