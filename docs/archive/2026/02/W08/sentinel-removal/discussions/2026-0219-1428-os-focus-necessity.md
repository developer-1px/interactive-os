# OS_FOCUS가 정말로 필요할까?

## Journey

**🧑 사용자**: OS_FOCUS가 정말로 필요할까?

**🤖 AI**: Intent 추론 — 방금 `{ ids: [] }` 핵을 `{ id: OS_FOCUS }` 정석으로 교체했는데, 그 "정석" 자체를 의심. 센티널이 필요한 근본적 이유가 있는지 탐색.

현재 흐름 해부:
- App bind 시점에 `OS_FOCUS` (매직 문자열 `"OS.FOCUS"`)를 페이로드에 삽입
- OS 커맨드 발동 시 `resolveFocusId`가 페이로드를 재귀 순회하여 실제 ID로 치환

대안 B (함수 팩토리)를 제시:
```ts
// 현재: onDelete: deleteSection({ id: OS_FOCUS })
// 대안: onDelete: (id) => deleteSection({ id })
```
resolveFocusId 전체가 사라지고, 센티널도, 재귀 탐색도 불필요.

---

**🧑 사용자**: /doubt mece

**🤖 AI**: MECE 분해 수행.

Chesterton's Fence 결과:
- **직렬화**: serialize 참조 0건. 사용 안 함.
- **Inspector 가시성**: Inspector는 커맨드 타입만 표시. OS.FOCUS 값을 읽는 곳 없음.
- **keybinding 타입 일관성**: 구조적으로 묶여 있지만, 함수 전환 시 함께 해결 가능.

판정: 센티널 정당화 사유가 현재 프로젝트에서 **0건 사용**. 함수 패턴이 모든 축에서 우월.

영향 범위: OS 인프라 전체 (ZoneEntry, ZoneBindings, OS 커맨드 6파일, 앱 2개) → 별도 프로젝트 필요.

---

> **한 줄 요약**: OS_FOCUS 센티널은 정당화할 실 사용처가 없으며, `(id: string) => BaseCommand` 함수 패턴이 타입 안전성·코드 양·런타임 비용 모든 축에서 우월하다.

---

## Conclusion

### Why
Zone 콜백(`onDelete`, `onAction` 등)에 런타임 포커스 ID를 주입하는 메커니즘이 필요하다.
현재 이를 **센티널 문자열 + 페이로드 치환**으로 해결하고 있으나, 이는 타입 시스템을 우회하고, 불필요한 코드(resolveFocusId, sentinels.ts)를 발생시킨다.

### Intent
센티널 간접층을 제거하고, 함수 팩토리 패턴으로 전환하여 OS 바인딩 인프라를 단순화한다.

### Warrants
- W1. Sentinel은 타입 시스템을 우회하는 매직 문자열이다 (`id: string`이라 선언하지만 실제로는 `"OS.FOCUS"`)
- W2. `resolveFocusId`의 페이로드 순회/치환은 함수 호출 한 번으로 대체 가능하다
- W3. 함수 패턴은 TypeScript의 타입 추론을 100% 활용한다
- W4. 센티널 정당화 사유(직렬화, inspector 가시성)가 현재 0건 사용 (Chesterton's Fence 통과)
- W5. `OS_SELECTION`은 완전한 죽은 코드 — 즉시 제거 가능

### 영향 범위
| 카테고리 | 파일 수 | 변경 방향 |
|----------|:-------:|----------|
| OS 타입 (`ZoneEntry`, `ZoneBindings`) | 2 | `BaseCommand` → `(id: string) => BaseCommand` |
| OS 커맨드 (`delete`, `move`, `activate`, `check`, `clipboard`) | 6 | `resolveFocusId(cmd, id)` → `cmd(id)` |
| 센티널 인프라 (`sentinels.ts`, `resolveFocusId.ts`, 테스트) | 3 | 제거 |
| 앱 바인딩 (`todo`, `builder`) | 2 | `cmd({ id: OS_FOCUS })` → `(id) => cmd({ id })` |
| 총 LoC 감소 | — | ~100줄 |

> **한 줄 요약**: 함수가 센티널보다 낫다 — 타입 안전하고, 코드가 줄고, 런타임이 싸다.
