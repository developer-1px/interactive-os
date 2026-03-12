# Agent Activity Feed — 멀티 Claude 세션 산출물 추적

> 작성일: 2026-03-10
> 태그: idea
> 우선순위: P2

## 문제 / 동기

여러 Claude Code 세션을 동시에 돌리면, 각 세션이 만든 파일(특히 docs/)을 사람이 실시간으로 파악하기 어렵다.

- 폴더링으로 정리하면 흩어져서 어디 갔는지 모름
- 최신순으로 보면 어떤 세션/맥락에서 만들어졌는지 매핑 안 됨
- 기성 도구 없음: Git Activity 도구(GitDailies, Gitmore)는 원격 레포 기반, Agent Observability 도구(AgentOps, Langfuse)는 LLM 트레이스 기반. 둘의 교차점(로컬 멀티세션 → 파일 산출물 추적)은 빈 영역

## 현재 상태

- git log에 커밋별 변경 파일 + 메시지(맥락) 정보 존재
- Co-Authored-By: Claude 태그로 AI 생성 커밋 식별 가능
- CLAUDE_SESSION_ID 환경변수로 세션 구분 가능 (hooks 인프라 이미 존재)
- docsViewer 앱 존재 (docs/ 브라우징 + 검색)

## 기대 상태

docsViewer (또는 별도 뷰)에서 "최근 생성/수정된 docs 파일"을 시간순으로 보여주되, **어떤 세션(커밋)에서 어떤 맥락으로 만들어졌는지** 한 줄 요약이 함께 표시된다.

완료 조건:
- 최근 N개 파일 변경을 시간순 피드로 표시
- 각 항목에 커밋 메시지(맥락) 표시
- 세션별 그루핑 가능 (선택)

검증: docsViewer에서 "방금 다른 터미널의 Claude가 뭘 만들었지?"를 3초 내에 확인 가능

## 접근 방향

1. **가벼운 해법**: `git log --diff-filter=A --name-only -- docs/` 파싱 → docsViewer "Recent" 존에 피드
2. **중간 해법**: 커밋에 세션 ID 태깅 (hook으로 자동) → 세션별 그루핑 뷰
3. **무거운 해법**: fs.watch 실시간 + Agent Observability 연동 (과잉 가능성)

## 관련 항목

- `docs/1-project/docs/archive-cleanup/` — scaffold v2 설계 중 발견
- docsViewer 앱: `src/docs-viewer/`
- docsViewer os-migration: `docs/1-project/agent-activity/docs-viewer/os-migration/BOARD.md` — Hold (T8 ArrowDown gap)

---

## /wip 분석 이력

### Round 1 (2026-03-12) — Complex 판정

#### 턴 1: /divide
- JSONL 인프라(`vite-plugin-agent-activity.ts`) 발견. 2119 entries 실데이터 수집 중
- docsViewer os-migration Hold (T8 ArrowDown gap)
- **Cynefin**: Complex

#### 턴 2: /solve
- JSONL(실시간, 세션 ID 내장) vs git-log(커밋 맥락, docs/ 필터)는 **보완적**
- **Cynefin**: Complex 유지

---

### Round 2 (2026-03-12) — Complicated 판정

#### 턴 1: /divide (심화) — 블로커 상태 확인
- **Q2 해소**: os-migration T8은 Dialog overlay에만 영향. Activity feed는 독립 구현 가능
- **이미 부분 구현 발견**: `DocsSidebar.tsx` "Agent Activity" 섹션 — 실시간 HMR, 15개 항목, tool badge (Read/Edit/Write)
- **Cynefin**: Complex → Complicated

#### 턴 2: /doubt — 별도 뷰가 정말 필요한가?
- **기존 RecentSection이 이미 MVP 역할 수행 중**
  - 실시간 HMR ✅, 파일 경로 ✅, tool badge ✅, 타임스탬프 ✅
- **백로그 완료 조건과의 갭**: 커밋 메시지(맥락) 없음, 세션별 그루핑 없음
- **결론**: 별도 뷰 불필요. **기존 RecentSection에 2개 S 크기 작업 추가하면 충분**:
  1. git-log에서 커밋 메시지 추출 → 각 항목에 1줄 맥락 표시 (S)
  2. 세션 ID 기준 그루핑 토글 (S)
- **Cynefin**: Complicated (기술적으로 Clear지만 제품 방향 확인 필요)

#### 턴 3: 최종 판정
- Divide leaf 전부 S → Clear 기준 통과
- Conflict 없음 → JSONL + git-log 보완적 사용
- 남은 것: 인간이 "/doubt 결론(기존 섹션 개선이면 충분)"에 동의하는가

### Open Gaps

- [x] ~~Q1: JSONL vs git-log~~ → **보완적 사용**
- [x] ~~Q2: os-migration 블로커~~ → **독립 구현 가능**
- [x] ~~Q3: 기존 RecentSection 개선이면 충분한가?~~ → **/solve 판정: YES.** 제약 5개 중 4개에서 기존 개선이 우세. 별도 뷰는 3초 확인 기준에 오히려 불리. 확장성(15개 제한)은 현재 스코프 밖

### 구현 스케치 (Q3 동의 시)

```
vite-plugin-agent-activity.ts
  └─ git log --format='%H %s' --diff-filter=AM -- docs/ (최근 N개)
     └─ 커밋 hash → JSONL entry 매칭 (파일 경로 기준)
        └─ AgentActivityEntry에 commitMessage? 필드 추가

DocsSidebar.tsx RecentSection
  └─ 각 항목 하단에 커밋 메시지 1줄 (text-[10px] text-slate-400)
  └─ 세션 그루핑 토글: session UUID → 접이식 그룹 헤더
```

---

### Round 3 (2026-03-12) — Complex 유지 (코드 검증 완료)

#### 턴 1: 코드 현황 확인
- **입력**: RecentSection + vite-plugin-agent-activity.ts 실제 코드
- **결과**:
  - `AgentActivityEntry { ts, session, tool, detail }` — commitMessage 필드 없음 확인
  - RecentSection: 15개 항목, ToolBadge(Read/Edit/Write), HMR 실시간 — 동작 중
  - 구현 스케치(Round 2)가 코드 구조와 **정확히 일치** — git-log 파싱 → entry 매칭 → commitMessage 추가 경로 타당
  - 세션 그루핑: `entry.session` 필드 이미 존재 → UI 그루핑만 추가하면 됨
- **Cynefin**: Complex 유지 — Q3(제품 방향)만 남음

#### 턴 2: 최종 판정
- 추가 분석 가치 없음. 기술적으로 Clear, 제품 방향만 인간 판단 필요.

### Open Gaps (인간 입력 필요)

- [x] ~~Q1: JSONL vs git-log~~ → **보완적 사용**
- [x] ~~Q2: os-migration 블로커~~ → **독립 구현 가능**
- [ ] **Q3: 기존 RecentSection 개선이면 충분한가?** — 코드 검증 완료. 동의 시 즉시 `/project` → `/go`

---

### Round 4 (2026-03-12) — Clear 도달

#### 턴 1: /solve (Q3 판정)
- **입력**: 기존 RecentSection 개선 vs 별도 뷰
- **결과**: 제약 5개(완료 조건, 인프라 활용, 3초 확인, 규모, 확장성) 중 4개에서 기존 개선이 우세. Clear 판정
- **Cynefin**: Clear

### Status: 🟢 Clear — `/project` → `/go` 실행 가능

구현 경로:
1. `vite-plugin-agent-activity.ts`에 git-log 파싱 추가 → `AgentActivityEntry.commitMessage?` (S)
2. `DocsSidebar.tsx` RecentSection에 커밋 맥락 1줄 표시 + 세션 그루핑 토글 (S)

예상 규모: Light (S+S)
