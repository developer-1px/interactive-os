---
description: 프로젝트의 진실의 원천(Single Source of Truth for WHAT). 기능 요구사항, 상태, 엣지 케이스를 정의한다. 
---

# PRD: State Monitor Inspector Redesign
**Version**: 1.0 (2026-02-20)
**Context**: [Inspector Redesign Discussion](../discussions/2026-0220-0859-inspector-redesign.md)

## 1. 개요 (Overview)
기존 `UnifiedInspector.tsx`는 모든 Transaction 이벤트를 동일한 6단계 파이프라인(Input, Dispatch, Command, State, Effect, Render)으로 나열하여, 실제로 디버깅에 필요한 "어떤 커맨드가 어떤 상태 변화(diff)를 일으켰는가"를 파악하기 어려웠다.

본 프로젝트는 AI 협업 최적화 및 인과관계 파악 속도를 극대화하기 위해 인스펙터를 "시그널(Signal)"과 "노이즈(Noise)"로 분리된 타임라인 기반의 컨텍스트 캡처 도구로 재설계한다.

## 2. 핵심 목표 (Core Objectives)
1. **타임라인 기반 뷰 (Signal-First)**: Event → Command → Diff의 핵심 정보만 채팅처럼 노출한다.
2. **시그널/노이즈 분리**:
   - `Focus`, `Mouse Move`, `Drag` 등 잦은 OS 레벨 이벤트는 `[OS Events]` 필터 토글로 묶어 평소엔 숨긴다.
   - 상태 변경(`changes`) 밎 `effects`가 없는 단순 껍데기 커맨드는 희미하게(Dimmed) 처리하거나 숨긴다.
3. **Copy for AI 기능 (가장 중요)**:
   - 각 Transaction 항목 우측 상단에 `[Copy for AI]` 버튼을 배치한다.
   - 클릭 시 "Trigger Payload(Event) + Command + State Diff"가 마크다운 텍스트 형식으로 클립보드에 복사된다.
   - 전체 상태 트리를 덤프하는 대신, 이 인과관계의 단서(Context)만을 복사하여 AI 토큰 낭비를 막는다.

## 3. UI/UX 스펙 (Requirements)

### 3.1. 상단 컨트롤 바 (Header & Filters)
- **Title & Counter**: "Inspector (N events)"
- **[OS Events] Toggle**: Checkbox 형태. (Default: Off)
  - Off 상태일 때: `meta.inputType === "FOCUS"` 이거나 특정 고빈도 마우스 이벤트(단순 move 등)인 Transaction을 필터링한다.
- **[Clear] Button**: 트랜잭션 기록 초기화.
- **[View Full State] Toggle**: On-Demand로 현재 로컬 스토어의 덤프를 열어볼 수 있는 아코디언.

### 3.2. 메인 타임라인 (Timeline Area)
- **Auto-scroll**: 새로운 트랜잭션이 추가되면 채팅처럼 위로 말려 올라감 (기존 로직 유지/크게 개선 불필요).
- **스크롤 오프셋 배지**: 사용자가 위로 스크롤 시 `[↓ Jump to latest]` 플로팅 버튼 등장.
- **개별 Node (Transaction Item)**:
  - **Header**: `#12 [Click] -> COM_ACTIVATE_ITEM (14:02:11)`
  - **Body (Expanded)**:
    - **Payload**: `{ "id": "task-1" }` (단일 줄 JSON 형태)
    - **Diff**: 변경된 상태만 `A -> B` 형태로 노출. 없으면 생략.
    - **[Copy for AI] Action Button**: 복사 로직 호출.

### 3.3. 복사 페이로드 스펙 (Clipboard Format)
```markdown
**[Inspector Captured Event]**
- **Action**: Click (Element: item-123)
- **Command**: `COM_ACTIVATE_ITEM`
- **Payload**: `{"id": "item-123", "zone": "board"}`
- **Diff**:
  - `state.selection`: `null` -> `"item-123"`
```

## 4. 데이터 모델 설계 (Data Models)

> 기존 `inferPipeline` 대신, `inferSignal` 헬퍼 함수를 신설한다.
```typescript
interface InspectorSignal {
  type: "OS" | "STATE_MUTATION" | "NO_OP";
  trigger: { kind: "KEYBOARD" | "MOUSE" | "FOCUS"; raw: string; elId?: string };
  command: { type: string; payload: unknown };
  diff: Array<{ path: string; from: unknown; to: unknown }>;
  effects: string[];
}

function inferSignal(tx: Transaction): InspectorSignal { ... }
```

## 5. 단계별 구현 계획 (Execution Plan)
1. `kernel/src/core/transaction.ts` 혹은 app 레벨에서 `inferSignal` 커스텀 유틸리티 생성.
2. `UnifiedInspector.tsx` 마크업 구조를 Signal/Noise 구조로 전면 교체.
3. [OS Events] 필터 토글 상태 도입.
4. `Copy for AI` 클립보드 기능 구현 (Clipboard API).
5. 엣지 케이스 점검 (변경이 전혀 없는 커맨드, 에러 발생 커맨드 등).
