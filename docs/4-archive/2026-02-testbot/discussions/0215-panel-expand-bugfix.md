# 0215 — TestBot 패널 Suite 펼침 버그 수정

> **한 줄 요약**: 실행 전 Suite 펼침이 안 되던 버그를 `SuiteDetails`의 빈 상태 처리로 해결. 디자인 변경 없음.

---

## Journey

**🧑 사용자**: 테스트 봇 패널 수정

**🤖 AI**: 패널 분석 후 이중 헤더, 디자인 불일치, 카드 과잉 장식 등 여러 개선점을 제안.

---

**🧑 사용자**: 디자인은 지금 좋으니까 건들지마. 실행전에 미리 펼침을 못하는 거 수정해줘. 디자인을 절대 건들지.

**🤖 AI**: 원인 분석 → `SuiteDetails`가 `steps.length === 0`일 때 `return null`하여, 토글은 작동하지만 렌더링할 내용이 없었음. 기존 스타일 클래스만 재사용하여 "Ready to run" 플레이스홀더 추가.

---

## Conclusion

### Why
실행 전 Suite를 펼칠 수 없는 UX 버그.

### Intent
디자인을 일절 건들지 않고, 기능 버그만 최소한으로 수정한다.

### Warrants
1. **W1**: 사용자가 현재 디자인에 만족 → 스타일/레이아웃 변경 금지.
2. **W2**: 버그 원인은 `SuiteDetails`의 `return null` — 토글 상태는 정상이나 빈 steps에서 렌더링이 없었음.

### 변경사항
| 파일 | 변경 |
|------|------|
| `SuiteDetails.tsx` | `steps.length === 0`일 때 `null` 대신 "Ready to run" 플레이스홀더 반환 |
