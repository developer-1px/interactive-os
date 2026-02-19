# Code Review Report: createKernel.ts

**이론적 기반**: Conventional Comments
**대상 파일**: `packages/kernel/src/createKernel.ts`

## 🔴 [Blocker] 철학 위반 - 100% Type-Strict 미준수 (`as unknown as` 남용)
- **위치**: L248, L548~L555, L643~L645 등
- **설명**: 프로젝트 원칙 "Rule 56: `as any`는 해결이 아니라 부채다"에 어긋나는 강제 타입 캐스팅이 다수 발견되었습니다. 특히 `CommandFactory` 객체에 프로퍼티를 추가할 때 `(factory as unknown as { commandType: string }).commandType = type` 구조로 무리하게 우회하고 있습니다.
- **제안**: `Object.assign(factory, { commandType: type, id: type, ... })` 패턴을 사용하거나, 더 명확한 타입 교정을 통해 강제 타입 단언을 제거해야 합니다.

## 🟡 [Suggest] 성능 패턴 방어망 미흡 (`useComputed` 반환 타입 제약)
- **위치**: L666 (`function useComputed<T>(selector: (state: S) => T): T`)
- **설명**: "Rule 64: `useComputed` selector는 원시값을 반환한다(string/object 금지)" 원칙이 있지만, Kernel의 `useComputed` 서명은 제네릭 `<T>`에 제약을 두지 않아 사용하는 쪽의 오류를 방어구간에서 걸러내지 못합니다.
- **제안**: `<T extends boolean | number | null | undefined>` 와 같이 타입 시스템 단에서 방어벽을 세우는 것을 제안합니다.

## 🔵 [Nitpick] 코드 품질 - 단순 주석 중복
- **위치**: L662, L664
- **설명**: `// ─── useComputed (React Hook) ───` 주석이 연속으로 두 줄에 걸쳐 중복되어 있습니다.
- **제안**: 중복된 주석 하나를 삭제합니다.

---

**조치 필요 사항:**
🔴 Blocker/철학 위반 항목이 검출되었습니다. 위반 사항에 대해 즉시 코드 수정을 진행할까요?
