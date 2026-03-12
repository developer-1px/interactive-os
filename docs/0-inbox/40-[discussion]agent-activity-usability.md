# Agent Activity 사용성 — Discussion 결론

> 작성일: 2026-03-13
> Cynefin: Complicated (방향 확정, 구현 분해 남음)
> Domain: agent-activity

## Claim

Agent Activity UI는 **Write-first + 세션 그룹 + 활동 감지** 구조여야 한다.

## 설계 5항목

1. **Read 인디케이터**: 최신 1개만 표시 ("지금 뭘 보고 있나")
2. **Write 목록**: 세션(UUID)별 그룹, 최신 생성 상단
3. **파일 표시**: 파일명(볼드) + 디렉토리(작은 글씨) 2단
4. **활동 감지**: 최근 2분 내 로그 있는 세션 = 활동 중(펼침), 아니면 접힘
5. **Scope out**: 세션 내 subagent 분리는 다음 단계 (로그 포맷 변경 필요)

## Warrants (논거)

- W1. docs-viewer = agent-activity dogfooding
- W2. Read:Write 비율 ~10:1 → flat list는 노이즈 압도
- W3. 사용자 핵심 needs = "뭐가 수정됐나" (코드 리뷰 동기)
- W4. Read 최신 1개 = "지금 뭘 하고 있나" 충분 전달
- W5. 파일명만으로 같은 이름 다른 위치 파일 구분 불가
- W6. 세션 = 자연스러운 작업 단위, 역순 = 최신 관심사 우선
- W7. 멀티 세션(다른 터미널)은 UUID로 자연 구분 가능
- W8. 세션 내 subagent 분리는 로그 포맷 변경 필요 → scope out
- W9. 에이전트 활동 시 로그가 연속적 → 2분 gap = 비활동 heuristic 안전
- W10. HMR watcher가 이미 JSONL 변경 감지 중 → 추가 인프라 불필요

## 현재 구현 참조

- `src/docs-viewer/vite-plugin-agent-activity.ts` — JSONL 수집 + HMR
- `src/docs-viewer/DocsSidebar.tsx` — UI + useAgentActivity hook
- `src/docs-viewer/docsUtils.ts` — getAgentRecentFiles 변환

## 와이어프레임

```
┌─ Agent Activity ─────────────────────┐
│                                      │
│  Reading: docsUtils.ts               │
│  src/docs-viewer/                    │
│                                      │
│  Modified                            │
│                                      │
│  v abc123  ·  방금                   │
│    DocsSidebar.tsx                    │
│    src/docs-viewer/                  │
│    app.ts                            │
│    src/docs-viewer/                  │
│                                      │
│  v xyz789  ·  1분 전                 │
│    BOARD.md                          │
│    docs/1-project/...                │
│                                      │
│  > def456  ·  2시간 전               │
│    (3 files)                         │
└──────────────────────────────────────┘
```
