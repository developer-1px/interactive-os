# AUDITBOOK — OS 감사 지식베이스

> `/audit` 시작 시 반드시 읽는다.
> 감사 기준, 알려진 OS 갭, 정당한 예외를 축적하여 재논쟁을 방지한다.
> 새 판정이 생기면 `/audit` 종료 시 이 파일을 갱신한다.

---

## 1. 반드시 써야 하는 OS 패턴

> 이 패턴이 있는데 App이 직접 구현했으면 → 즉시 **🔴 LLM 실수**.

### 1-A. 앱→OS (기존)

| 패턴 | OS API | 잘못된 예 |
|------|--------|-----------|
| 상태 관리 | `BuilderApp.useComputed()`, `os.getState()` | `useState` |
| 커맨드 dispatch | `os.dispatch(command())` | 직접 state mutate |
| 목록 포커스/네비게이션 | Zone `bind({ role: "tree"/"grid" })` | `onKeyDown` arrow key |
| 아이템 선택 | Zone `onAction`, `onActivate` | `onClick` 직접 state 변경 |
| 필드 편집 | `Field.Editable`, `OS_FIELD_COMMIT` | `<input onChange>` |
| Undo/Redo | `createUndoRedoCommands` | 별도 history stack |

### 1-B. OS 내부 계약 (OS↔OS)

> OS 프리미티브 간의 일관성. 위반 시 **🟡 OS 갭**.

| 패턴 | 올바른 예 | 잘못된 예 |
|------|----------|----------|
| Zone 콜백 시그니처 | `(info) => BaseCommand \| BaseCommand[]` (선언형) | `(info) => void` (명령형) |
| Listener 격리 | 하나의 물리 제스처 → 하나의 Listener | 같은 pointerdown을 Mouse+Drag 각각 처리 |
| DOM convention 자동화 | OS가 `data-*` 속성 자동 주입 | 앱이 `data-drag-handle` 수동 부착 |

### 1-C. OS↔앱 계약 완전성

> bind() 연결이 실제로 동작하는가. 위반 시 **🔴 LLM 실수** 또는 **🟡 OS 갭**.

| 검사 항목 | 방법 |
|----------|------|
| bind()에서 호출하는 메소드가 존재하는가 | tsc + 수동 확인 |
| 앱이 `os.dispatch`를 onReorder 등 콜백 안에서 직접 호출하는가 | grep → 있으면 OS gap |
| 콜백에서 리턴한 커맨드를 OS가 실제로 dispatch하는가 | OS command 코드 확인 |

---

## 2. 알려진 OS 갭

> 아직 OS에 없는 것. 발견되어도 🔴가 아니라 🟡. `5-backlog/os-gaps.md` 참조.

| ID | 패턴 | 상태 | 발견일 |
|----|------|------|--------|
| OG-001 | Dropdown (listbox) Zone — 열기/닫기/Escape/Arrow/backdrop 통합 | 🟡 미해결 | 2026-02-25 |
| OG-002 | `onReorder: void` — 명령형 시그니처. 다른 콜백은 선언형(BaseCommand 리턴) | ✅ 해결 | 2026-02-26 |
| OG-003 | MouseListener + DragListener 충돌 — 같은 물리 제스처를 경쟁 처리 | 🟡 미해결 | 2026-02-26 |
| OG-004 | `data-drag-handle` DOM convention — OS가 자동 주입하지 않음. 앱이 수동 부착 | 🟡 미해결 | 2026-02-26 |
| OG-005 | 커서 메타 등록 — 앱이 useEffect로 수동 mount/unmount 동기화. OS 미들웨어/ZoneRegistry 확장 필요 | 🟡 미해결 | 2026-02-26 |

> **주의**: OG-001 관련 패턴(드롭다운 onClick)은 OS 갭이므로 🔴로 분류하지 않는다.
> **주의**: OG-003, OG-004 관련 패턴은 OS 갭이므로 🔴로 분류하지 않는다.

---

## 3. 알려진 정당한 예외

> OS가 대체할 수 없는 것. 발견되어도 무시. ⚪.

| 패턴 | 이유 | 예시 |
|------|------|------|
| `window.addEventListener` (OS 진입점) | OS 커널이 브라우저 이벤트를 받는 유일한 진입점 | `src/os/kernel.ts` |
| 외부 라이브러리 ref/callback | 써드파티 API 요구사항 | leaflet, chart.js 등 |
| `document.getElementById` (포커스 복구) | 브라우저 포커스 API 직접 호출 | 모달 dismiss 후 복구 |

---

## 4. 근본 원인 진단표

> 🔴 LLM 실수 발견 시, 어느 파이프라인 단계로 루프백할지 판단.

| 근본 원인 | 판정 기준 | 루프백 |
|----------|----------|--------|
| Story / DT 잘못됨 | DT에 없는 커맨드를 구현했거나, DT 자체가 OS 불가능 구조 | → `/stories` |
| Spec Scenario 잘못됨 | DT를 잘못 번역하여 BDD가 OS 패턴과 어긋남 | → `/spec` |
| Red 테스트 잘못됨 | 테스트가 DOM/이벤트를 직접 검증 (OS Hook 미사용) | → `/red` |
| Bind 잘못됨 | OS Hook/Command가 있는데 raw HTML 이벤트 사용 | → `/bind` |

---

## 5. 판정 선례

> 과거 감사에서 내린 분류 결정. 같은 패턴이 나오면 재논쟁 없이 동일 적용.

| 선례 | 패턴 | 판정 | 이유 | 날짜 |
|------|------|------|------|------|
| LocaleSwitcher onClick 4건 | 드롭다운 내부 onClick | 🟡 OS 갭 (OG-001) | Dropdown Zone 프리미티브 부재. LLM 실수가 아님 | 2026-02-25 |
| BuilderTabs useState | 탭 활성 상태 useState | 🟡 OS 갭 (T5) | tablist Zone의 activate→state 경로 미구현 | 2026-02-25 |
| DnD onReorder void | zone 콜백 명령형 시그니처 | 🟡 OS 갭 (OG-002) → ✅ 수정 | void 콜백은 앱이 os.dispatch 직접 호출 강제. 선언형으로 수정 | 2026-02-26 |
| DnD BuilderApp.dispatch | 존재하지 않는 메소드 호출 | 🔴 LLM 실수 (OG-002 기인) | OS gap이 LLM 실수를 유발한 사례 | 2026-02-26 |
| DnD e.preventDefault 충돌 | Listener 간 side-effect | 🟡 OS 갭 (OG-003) | Mouse+Drag 분리 구조의 한계 | 2026-02-26 |

---

## 갱신 방법

`/audit` 종료 시:
1. **새 OS 갭** 발견 → §2에 추가 + `5-backlog/os-gaps.md`에 등록
2. **새 정당한 예외** 확인 → §3에 추가
3. **새 판정 선례** 생성 → §5에 추가
4. **OS 갭 해결됨** → §2 항목 `✅ 해결`로 체크 + `os-gaps.md` 업데이트
