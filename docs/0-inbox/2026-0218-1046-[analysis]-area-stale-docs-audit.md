# Area 문서 소스코드 불일치 감사 보고서

| 항목 | 내용 |
|------|------|
| 원문 | area에 있는 내용을 실제 소스코드와 비교하면서 소스를 진실의 원천으로 믿고 점검하며 불필요한 부분을 제거, 충돌은 inbox에 정리 |
| 내(AI)가 추정한 의도 | Area 문서가 과거 아키텍처(Zustand 파이프라인)를 기술하고 있어 현재 커널 기반 구조와 괴리가 있으며, 이를 정리하고 싶다 |
| 날짜 | 2026-02-18 10:46 |
| 상태 | 🟡 의사결정 필요 |

## 1. 개요

Area 문서 58개를 소스코드(`src/os/`, `packages/kernel/`)와 대조했다.
**소스코드가 진실의 원천**이라는 전제 하에 /doubt 절차를 적용했다.

## 2. 핵심 발견: 아키텍처 대전환

프로젝트는 **Zustand 파이프라인 구조**에서 **커널 기반 구조**로 전환되었다:

| 과거 (문서가 기술) | 현재 (소스코드) |
|---|---|
| `src/os/features/focus/pipeline/` | `src/os/3-commands/` |
| `FocusGroupStore` (Zustand) | `kernel.ts` → `createKernel()` |
| `FocusSensor`, `FocusIntent` (React 컴포넌트) | `FocusListener.tsx`, `KeyboardListener.tsx` |
| `FocusRegistry`, `DOMRegistry` | `zoneRegistry.ts` |
| `CommandEngineStore` | kernel `dispatch()` |
| `focusData.ts` 모듈 변수 | kernel OSState |
| `InspectorLog` | kernel `getTransactions()` |
| `runOS()` 파이프라인 러너 | kernel `dispatch()` → command handler |
| `src/os-new/` | `src/os/` (통합 완료) |

## 3. 실행 결과

### 🔴 제거 완료 (6건)

| 문서 | 제거 이유 |
|------|-----------|
| `22-focus/click-select-toggle-conflict.md` | `onToggle` 삭제됨, `os-new/` 경로, 이슈 해결 완료 |
| `22-focus/2026-02-11-pop-and-restore-focus-red-team.md` | `focusData.ts` 삭제됨, `os-new/` 경로, setTimeout→kernel 전환 |
| `22-focus/06-pipeline-embedded-logging.md` | `InspectorLog`, `CommandEngineStore` 삭제됨, kernel transaction으로 대체 |
| `22-focus/07-state-effect-schema.md` | `FocusGroupStore`, `focusData.ts` 삭제됨, 통합 상태 모델 제안이 kernel로 해결 |
| `22-focus/05-nested-zone-focus.md` | `FocusData.setActiveZone()` 삭제됨, kernel state로 전환 |
| `22-focus/04-escape-dismiss-cohesion.md` | `FocusSensor`, `OS_COMMANDS.EXIT` 삭제됨, ESCAPE 커맨드로 해결 완료 |

### 🟢 유지 (확정, 39건+)

| 그룹 | 유지 이유 |
|------|-----------|
| `SPEC.md` | 2026-02-16 검증 완료. 커맨드/키맵/컴포넌트 계약이 소스와 일치 |
| `25-defineApp.md` | 방금 소스에서 직접 작성 |
| `03-field-key-ownership.md` | 방금 소스에서 직접 작성 |
| `08-focus-recovery.md` | 방금 소스에서 직접 작성 |
| `30-apps/*`, `10-kernel/*` | 방금 소스에서 직접 작성 |
| `80-cross-cutting/*` | 코딩 표준, 테스트 전략 — 소스 경로와 무관한 원칙 문서 |
| `90-meta/*` | 철학/원칙 — 소스 경로와 무관 |
| `23-primitives/*` | 프리미티브 스펙 — 대부분 컴포넌트 API 설명이며 현재도 유효 |
| `24-aria/*` | W3C 표준 참조 — 소스 변경과 무관 |

### 🟡 축소/갱신 필요 (7건) — 의사결정 필요

이 문서들은 **핵심 원칙/설계 결정은 여전히 유효**하지만, **소스코드 경로와 구현 상세가 과거 아키텍처를 참조**하고 있다.

| # | 문서 | 유효한 부분 | 불일치 부분 | 불일치 횟수 |
|---|------|-----------|-----------|-----------|
| 1 | `21-commands/00-architecture.md` | 커맨드 시스템 원칙 (허용적 디스패치, 의도 기반) | `features/command/`, `features/focus/pipeline/`, `sliceZone.ts` | 3 |
| 2 | `21-commands/01-keyboard-governance.md` | 키보드 거버넌스 (두꺼비집 패턴) | `features/keyboard/`, `features/command/` | 2 |
| 3 | `21-commands/02-pure-payload-architecture.md` | Pure Payload 해결 패턴 | `features/command/middleware/`, `entities/FocusTarget.ts` | 2 |
| 4 | `22-focus/00-overview.md` | 포커스 시스템 개요, Config-Driven 모델 | `features/focus/` 전체 디렉토리 구조, `FocusGroupStore`, `roleRegistry.ts` 경로 | 9 |
| 5 | `22-focus/01-pipeline-spec.md` | FocusGroupProps 인터페이스, Role Presets | `features/focus/pipeline/` 경로 | 1 |
| 6 | `22-focus/02-pipeline-invariants.md` | 파이프라인 불변 법칙 | `features/focus/pipeline/` 경로 | 1 |
| 7 | `22-focus/03-focusgroup-architecture.md` | Config 객체 상세, Role Preset, import 경로 예시 | 디렉토리 구조 전체, `FocusGroupStore`, `FocusRegistry`, `DOMRegistry` | 21 |

## 4. 결론 / 제안

### 옵션 A: 경로만 수정 (최소 변경)
각 문서에서 `src/os/features/focus/` → `src/os/` 등 경로만 현행화.
디렉토리 구조 섹션을 현재 구조로 대체.

**장점**: 빠름, 핵심 원칙 보존
**단점**: 구현 상세가 Zustand 기반인데 실제는 kernel — 경로만 바꿔도 내용 불일치 잔존

### 옵션 B: SPEC.md로 통합 (대폭 축소)
SPEC.md가 이미 커맨드/컴포넌트/키맵 계약의 진실의 원천.
🟡 문서들의 유효한 원칙 부분만 SPEC.md Appendix나 ADR 섹션으로 흡수.
나머지는 /retire.

**장점**: 문서 수 대폭 감소, 중복 해소
**단점**: 작업량 큼, 설계 결정의 맥락(Red/Blue Team 토론) 유실 가능

### 옵션 C: 원칙만 남기고 구현 상세 삭제 (중간)
각 문서에서 "현재 구현 위치", "디렉토리 구조", "Store 구조" 등 구현 상세 섹션을 삭제.
설계 원칙과 ADR 결정만 보존.

**장점**: 원칙 문서는 아키텍처 전환에 무관하게 유효
**단점**: 원칙만 남으면 검색/실행 가능성 저하

## 5. Cynefin 도메인 판정

🟡 **Complicated** — 문서 7개 × 선택지 3개의 조합. 각 문서를 분석하면 최적해가 좁혀진다. 하지만 "어떤 수준의 문서 관리를 원하는가"에 대한 팀 판단이 필요.

## 6. 인식 한계 (Epistemic Status)

- 소스코드와 문서의 대조는 **정적 분석**(grep, 경로 검색)에 기반함
- 삭제된 6건은 참조하는 모든 핵심 모듈(`FocusData`, `CommandEngineStore` 등)이 소스에 없음을 확인함
- 🟡 7건의 "원칙은 유효하다" 판단은 SPEC.md와의 일관성 비교에 기반하나, 원칙 자체의 현행 준수 여부는 런타임 검증 없이 확인 불가

## 7. 열린 질문

1. **🟡 7건 처리 전략**: A(경로 수정) / B(SPEC 통합) / C(원칙만 보존) 중 선택?
2. **`01-naming-convention.md`**: `os-new/` 참조 8회. 이 문서는 이미 `rules.md`에 반영됨. 별도 Area 문서가 필요한가, 아니면 `rules.md`로 통합하고 Area에서 제거하나?
3. **`docs/official/kernel/`** (10개, 60KB): Area `10-kernel/`과 별도로 유지할지, Area로 흡수할지?

---

**한줄요약**: Area 문서 58개 감사 결과, 6개 과거 아키텍처 문서를 삭제하고, 7개 문서에 대해 "경로만 수정 / SPEC 통합 / 원칙만 보존" 중 하나의 처리 전략 결정이 필요하다.
