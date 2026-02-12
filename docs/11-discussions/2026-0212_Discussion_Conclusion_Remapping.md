# 리매핑 설계: 리스너 + Fallback 미들웨어

## Why
`getCanonicalKey`의 Mac normalization(`Meta+Arrow → Home/End`)이 키바인딩을 먹어버린다. 단순 버그가 아니라, 키보드 해석 계층의 책임 경계 문제.

## Intent
리스너는 똑똑하게 1차 resolve를 하고, miss일 때만 커널 미들웨어에게 fallback을 위임한다. 아키텍처 변경 없이 확장 포인트를 추가한다.

## Warrant 구조

| # | Warrant | 근거 |
|---|---------|------|
| W4 | 구체적 바인딩 우선 (specificity) | CSS specificity, 라우터 매칭과 동일 패턴 |
| W5 | normalization은 미들웨어다 | 제거/교체/순서 변경 가능해야 한다 |
| W10 | fallback 전략은 호출자가 결정 | 커널은 플랫폼 모름, 리스너가 앎 |
| W13 | 경계선 = DOM 참조 유무 | DOM 필요 → 리스너, 순수 → 미들웨어 |
| W14 | 리스너가 1차, miss만 위임 | 기존 아키텍처 변경 없음 |
| W15 | dispatch 안 타야 노이즈 없음 | UNRESOLVED 매 키스트로크 → 트랜잭션 도배 방지 |
| W17 | keyboard/mouse/clipboard 동일 패턴 | 범용 설계 |
| W18 | 네이티브 Event = 인터페이스 | 별도 data shape 불필요, instanceof로 필터링 |

## 최종 설계

```
DOM Event → 리스너(똑똑) → resolve → hit → dispatch
                                   → miss → kernel.resolveFallback(event)
                                              → 미들웨어 체인 순회
                                              → hit → dispatch
                                              → miss → 조용히 끝
```

```ts
// KeyboardListener
const key = getCanonicalKey(event);      // 순수 물리→논리, 리매핑 없음
const command = resolve(key, context);
if (command) {
  kernel.dispatch(command);
} else {
  kernel.resolveFallback(event);         // 네이티브 Event 그대로
}

// Mac fallback 미들웨어
kernel.use({
  id: "mac-normalize",
  fallback: (event) => {
    if (!(event instanceof KeyboardEvent)) return null;
    const normalized = macNormalize(getCanonicalKey(event));
    return resolve(normalized, ctx);
  }
});
```

## 기각된 대안

| 대안 | 기각 이유 |
|------|----------|
| 리스너를 바보로 (이벤트만 전달) | Focus/Click은 DOM 참조 필요 → 커널 순수성 깨짐 |
| UNRESOLVED 커맨드 dispatch | 트랜잭션 노이즈 |
| 미들웨어 인터페이스에 resolve 훅 추가 | 미들웨어 인터페이스 변경 불필요 |
| getCanonicalKey에서 리매핑 제거 | Home/End 기존 동작 깨짐 |

## 구현 범위

- 커널: `resolveFallback(event)` API 추가 (미들웨어 체인만 돌림, 트랜잭션 안 남김)
- 미들웨어 인터페이스: `fallback?: (event: Event) => Command | null` 훅 추가
- KeyboardListener: miss 시 `kernel.resolveFallback(event)` 호출
- getCanonicalKey: Mac normalization 제거
- osDefaults: 변경 없음

---

**한줄요약**: 리스너가 1차 resolve하고 miss하면 `kernel.resolveFallback(nativeEvent)`로 미들웨어 체인에 위임 — 아키텍처 변경 없이 keyboard/mouse/clipboard 공통 fallback 패턴.
