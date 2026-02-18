---
description: 프로젝트 완료 시 지식을 Area/Resource로 분배하고, 잔여 산출물만 4-archive로 이동한다.
---

## /archive — 프로젝트 완료 & 지식 환류

> **목적**: 프로젝트 완료 시 지식을 소멸시키지 않고 Area와 Resource로 환류한다.
> **원칙**: 단순 이동 금지. 지식을 분배한 후 껍데기만 아카이브한다.

### Why

프로젝트가 완료되면 BOARD.md, discussions/ 등이 통째로 `4-archive/`로 이동했다.
그 안에 있던 **아키텍처 결정, 스펙 변경, 참고자료**도 함께 묻혔다.
결과: 코드는 24번 바뀌었는데 Area 지식은 멈춰있는 상태.

`/archive`는 이 문제를 해결한다:
**프로젝트의 지식을 Area/Resource로 분배 → 잔여물만 archive.**

### 프로세스

#### 1. 프로젝트 식별

대상 프로젝트의 `BOARD.md`를 읽어 완료 상태를 확인한다.

```
📋 Archive 대상: [project-name]
📁 위치: docs/1-project/[project-name]/
```

#### 2. 소스코드 모듈 매핑

이 프로젝트가 건드린 소스코드 모듈을 식별한다:

```bash
# 프로젝트 기간의 git log에서 변경된 소스 모듈 추출
git log --name-only --pretty=format: -- src/ packages/ | sort -u | head -20
```

매핑 결과 예시:
```
소스 모듈              →  대응 Area
src/os/3-commands/     →  2-area/20-os/21-commands/
packages/kernel/       →  2-area/10-kernel/
src/os/schemas/focus/  →  2-area/20-os/22-focus/
```

#### 3. 지식 분배 (핵심)

프로젝트의 모든 문서를 하나씩 검토하고 **4갈래 라우팅**:

| 판단 기준 | 행선지 | 예시 |
|-----------|--------|------|
| **현재 코드의 동작을 설명**한다 | `2-area/` (스펙/아키텍처 갱신) | "focus pipeline은 이렇게 동작한다" |
| **의사결정 과정을 기록**한다 | `2-area/` (ADR로 보존) | "왜 X 대신 Y를 선택했는가" |
| **외부 지식/비교 분석**이다 | `3-resource/` | "W3C ARIA 스펙 비교", "Radix vs 자체 구현 분석" |
| **진행 기록일 뿐**이다 | `4-archive/` | BOARD.md, 일일 진행 상황 |

구체적 동작:

**a) Area 갱신 (스펙/아키텍처)**
- 대응 Area 문서가 이미 있으면 → **기존 문서 내용 업데이트** (merge)
- 없으면 → **새 문서 생성** (Johnny.Decimal 번호 부여)
- Area 문서는 "현재 코드가 어떻게 동작하는가"의 진실이어야 함

**b) Resource 이동 (참고자료)**
- 프로젝트 안에서 생산된 조사/비교/분석 문서
- `3-resource/[category]/`로 이동 (원본 유지, tombstone 금지)

**c) Archive 이동 (잔여)**
- BOARD.md, 진행 기록, 일시적 메모
- `4-archive/YYYY-MM-[project-name]/`으로 이동

#### 4. Area 동기화 검증

분배 후, 변경된 Area 문서가 현재 소스코드와 일치하는지 검증:

- Area 문서에서 언급하는 파일/함수가 실제로 존재하는가?
- 삭제되거나 이름이 바뀐 것은 없는가?
- 새로 추가된 주요 개념이 Area에 반영됐는가?

#### 5. STATUS.md 갱신

```md
## ✅ Completed (→ archive 완료)
| Project | Completed | Area 갱신 | Archived |
|---------|-----------|----------|----------|
| [name]  | MM-DD     | ✅ 20-os/22-focus | ✅ 4-archive/YYYY-MM |
```

- Area 갱신 컬럼 추가 — 어떤 Area가 갱신됐는지 추적
- Last updated 타임스탬프 갱신

#### 6. 보고

```
📊 Archive Report: [project-name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Area 갱신: N개 문서
   - 2-area/20-os/22-focus/22.03-pipeline-invariants.md (업데이트)
   - 2-area/10-kernel/10.02-inspector-api.md (신규)
📖 Resource 이동: N개
   - 3-resource/aria/w3c-comparison.md
📦 Archive 이동: N개
   - 4-archive/YYYY-MM-[name]/BOARD.md
   - 4-archive/YYYY-MM-[name]/daily-notes/
```

### `/para`와의 관계

`/para` 워크플로우의 Step 3 "Project Review"에서 완료된 프로젝트를 발견하면,
**직접 mv하지 않고 `/archive`를 호출**한다.

### `/retire`와의 차이

| | `/archive` | `/retire` |
|---|---|---|
| **대상** | 완료된 **프로젝트** | superseded된 **문서** |
| **핵심 동작** | 지식 분배 후 잔여물 아카이브 | AI 컨텍스트에서 제거 |
| **Area 영향** | ✅ Area 갱신 | ❌ Area 무관 |
| **트리거** | 프로젝트 완료 시 | 문서가 outdated 판정 시 |
