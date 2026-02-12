# UnifiedInspector 고도화 — 논증 결론

## Why
UnifiedInspector는 현재 mock 데이터로만 동작하는 "Vision" 탭이다.
이 프로젝트의 Goal #6 "모든 상태 변화를 관찰하고 되돌릴 수 있다"를 실현하려면,
**결과를 나열하는 로그**가 아니라 **과정이 보이는 파이프라인 시각화**가 필요하다.

## Intent
UnifiedInspector를 실제 커널 Transaction에 연결하고,
6-Domino 파이프라인의 각 단계(Input → Dispatch → Command → State → Effect → Render)가
실시간으로 보이는 도구로 고도화한다.

## Warrants

| # | Warrant |
|---|---------|
| W1 | UnifiedInspector는 현재 mock 데이터로만 동작 — 실제 커널 Transaction과 연결되지 않음 |
| W2 | `Transaction` ↔ `InspectorEvent` 필드가 거의 1:1 매핑됨 |
| W3 | 프로젝트 원칙: "코드를 고치기 전에 정답인지 판단한다" |
| W4 | 커널 `Transaction`에 파이프라인 각 단계별 데이터가 대부분 존재 |
| W5 | 선언문 Goal #6 "모든 상태 변화를 관찰하고 되돌릴 수 있다" — 관찰은 결과가 아니라 과정 |
| W6 | "불확실하면 묻는다"는 맞지만, 정답이 보이는데 묻는 건 핑계다 |

## 한 줄 요약

> **정답이 보이면 증명하고 실행한다 — UnifiedInspector는 Transaction을 직접 받아 파이프라인을 시각화하는 도구로 전환한다.**
