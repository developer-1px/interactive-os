# T1 실행 전략: 산출물과 작업 방식 정의

| 항목 | 내용 |
|------|------|
| **원문** | 전통적인 앱 개발 파이프라인을 타면 안 될 것 같고 자유롭게 해야 할텐데 그럼에도 테스트 코드가 남았으면 좋겠거든? 어떤 산출물을 낼지 작성해줘 |
| **내(AI)가 추정한 의도** | |
| 경위 | T1(FocusGroup bindElement)을 시작하려는데, /red→/green→/bind TDD 파이프라인이 이 작업 성격에 안 맞음. |
| 표면 | 자유로운 리팩토링이지만 테스트가 남는 작업 방식 정의. |
| 의도 | 탐색적 리팩토링에 맞는 경량 프로세스를 확립하되, "다시 거짓 GREEN을 만들지 않는다"는 보증으로서 테스트를 남기고 싶다. |
| **날짜** | 2026-02-27 |
| **프로젝트** | headless-simulator |

## 1. 개요

이 작업은 기능 추가가 아니라 **아키텍처 리팩토링**이다. 기존 동작을 유지하면서 코드 구조를 바꾸는 것이므로 /red(실패 테스트 먼저 작성)가 어울리지 않는다.

하지만 "테스트가 남아야 한다"는 요구는 정당하다. 왜냐하면:
- 이 프로젝트의 존재 이유 자체가 "거짓 GREEN 근절"이기 때문
- 리팩토링이 끝나면 "이전에는 vitest가 못 잡던 것을 이제 잡는다"는 증거가 있어야 한다

## 2. 분석: 왜 /red→/green이 안 맞는가

| 기존 파이프라인 | 이 작업 |
|----------------|---------|
| 새 기능 → 스펙 → 실패 테스트 → 구현 | 기존 기능 유지 → 구조 변경 |
| 테스트가 스펙을 정의 | e2e가 이미 스펙 (25개 실패 = regression spec) |
| RED → GREEN → REFACTOR | 이미 RED (e2e). 리팩토링 자체가 GREEN으로 가는 길 |
| 한 번에 하나의 테스트 | 구조 변경은 여러 테스트에 동시 영향 |

## 3. 제안: 산출물 3종

### 산출물 A: 코드 변경 (리팩토링)
- FocusGroup Phase 2 → `ZoneRegistry.bindElement()` 이동
- buildZoneEntry → ZoneRegistry로 이동
- 자유롭게 탐색, 시행착오 허용

### 산출물 B: e2e GREEN 복구 (기존 테스트 = regression gate)
- 이미 존재하는 Playwright 25개 = **regression spec**
- 리팩토링 전후로 `npm run test:e2e:summary` 비교
- 25 FAIL → 0 FAIL 이 리팩토링의 성공 증거
- **새로 작성할 필요 없음. 기존 e2e가 gate.**

### 산출물 C: vitest 동등 검증 테스트 (핵심 신규 산출물) ⭐

"이전에는 vitest가 못 잡던 것을 이제 잡는다"는 증거:

```typescript
// e2e에서만 검증 가능했던 것을 vitest로 재현
describe("headless-simulator: e2e 동등 검증", () => {
  
  test("click → ArrowDown → aria-current 이동", () => {
    const page = createOsPage();
    page.goto("focus-showcase");    // zone 등록
    page.click("apple");            // 클릭
    page.press("ArrowDown");        // navigate
    
    expect(page.attrs("banana")["aria-current"]).toBe(true);  // 이전: 미검증
    expect(page.attrs("apple")["aria-current"]).toBeUndefined();
  });

  test("Vertical loop — 경계에서 wrap", () => {
    const page = createOsPage();
    page.goto("focus-showcase");
    page.click("apple");
    page.press("ArrowUp");          // first → last (loop)
    
    expect(page.attrs("cherry")["aria-current"]).toBe(true);
  });
});
```

이 테스트가 **리팩토링 전에는 거짓 GREEN**, **리팩토링 후에는 정확히 e2e와 동일한 결과**를 보여줘야 한다.

### 제안하는 작업 루프

```
while (not done) {
  1. 코드 자유 수정 (탐색적 리팩토링)
  2. vitest 확인 — 기존 테스트 깨지면 안 됨
  3. 사용자가 e2e 실행 → AI가 summary 읽기
  4. e2e FAIL 수 감소 확인
  5. 필요하면 방향 조정
}

완료 후:
  6. 산출물 C 작성 — e2e 동등 vitest 추가
  7. vitest만 돌려도 e2e와 같은 결과 나오는지 최종 확인
```

**핵심: 코드 수정은 자유, 검증은 기존 e2e + 신규 vitest.**

## 4. Cynefin 도메인 판정

🔴 **Complex** — 아키텍처 리팩토링은 짜놓은 설계대로 진행되지 않는다. 코드를 옮기다 보면 예상 못한 의존성이 나오고, 시행착오를 통해 올바른 API 형태를 발견해야 한다. 고정된 스펙으로 접근할 수 없다.

## 5. 인식 한계

- "산출물 C"의 구체적 테스트 수는 아직 미정. e2e 29개를 전부 vitest로 옮길지, 핵심 패턴만 옮길지는 리팩토링 진행 후 결정.
- vitest에서 `page.attrs()`의 `aria-current` 검증이 computeAttrs 수정 없이 가능한지 아직 미확인 (T7 선행 필요할 수 있음).
- 작업 루프의 반복 횟수 예측 불가.

## 6. 열린 질문

1. 산출물 C(vitest 동등 테스트)를 **리팩토링하면서 점진적으로** 작성할 것인가, **리팩토링 완료 후** 일괄 작성할 것인가?
2. e2e 29개 전부를 vitest로 복제할 것인가, 카테고리별 대표 케이스만 뽑을 것인가?
3. 작업 중 중간 커밋 단위는? (Task 단위? 의미 있는 변경 단위?)

---

> **산출물 3종: (A) 코드 리팩토링, (B) e2e GREEN 복구 (기존 25개), (C) e2e 동등 vitest 신규 작성.**
> **작업 방식: 자유 탐색 + 기존 e2e가 regression gate + 신규 vitest가 "거짓 GREEN 방지" 증거.**
> **핵심: /red→/green이 아니라 "이미 RED(e2e 25 FAIL) → 리팩토링으로 GREEN 복구 → vitest로 동등 검증 추가."**
