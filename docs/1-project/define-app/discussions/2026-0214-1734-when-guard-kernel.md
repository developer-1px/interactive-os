# Journey: when guard 커널 승격

**🧑 사용자**: 커널로 승격이 필요할까?

**🤖 AI**: v3에서 `when`은 UI hint (disabled/grayed)이었고 커널 dispatch에 영향 없었음. v5에서 when = dispatch guard로 합의(W26)했는데, 두 가지 옵션 제시:
- **옵션 A**: defineApp 레이어에서 체크 (커널 수정 없음)
- **옵션 B**: kernel `processCommand`에서 체크 (단일 경로)

핵심 긴장: "커널은 frozen" (PRD) vs "모든 변경은 하나의 문을 통과" (원칙 3).

defineApp에서 체크하면 CommandPalette, Keybindings 등 다른 진입점이 우회 가능 — 문이 두 개가 된다.

**🧑 사용자**: 커널이 프로즌이 아니라면 Known은?

**🤖 AI**: **Known. 커널에 넣는다.** "커널이 frozen"만 제거하면 답은 자명. `processCommand`가 유일한 문이고, 여기서 체크하면 우회 불가. 커널 frozen ≠ 수정 금지. 파이프라인 핵심 기능은 커널에 속한다.

---

**한 줄 요약**: 커널 frozen 원칙의 재해석 — "무의미한 수정 금지"이지 "파이프라인 핵심 기능의 defineApp 우회"가 아니다.

---

# Conclusion: when guard 커널 승격

## Why
v5에서 `when`을 dispatch guard로 확정(W26)했으나, 실행 위치가 미결이었다. defineApp 레이어 vs kernel.

## Intent
단일 파이프라인 원칙(원칙 3)을 위반하지 않으면서 when guard를 구현하는 위치를 결정.

## Warrants

| # | Warrant |
|---|---------|
| W26 | when = dispatch guard. kernel이 차단 |
| W32 | 커널 frozen ≠ 수정 금지. 파이프라인 핵심 기능은 커널에 속한다 |
| W33 | when guard 위치 = `processCommand`, handler 실행 직전. `defineCommand` 시 when 메타데이터 등록 |

## 결정

**kernel `processCommand`에 when guard 추가.** defineApp이 아닌 kernel에서 처리.

- `defineCommand` 시 `when` 함수를 메타데이터로 등록
- `processCommand`에서 handler 실행 직전에 `when(state)` 체크
- false면 handler 실행 안 함

## 한 줄 요약

**when guard는 커널 파이프라인에 속한다 — 모든 dispatch 진입점이 거치는 유일한 문이므로.**
