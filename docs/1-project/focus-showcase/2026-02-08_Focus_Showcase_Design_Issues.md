# Focus Showcase: Design Decisions Needed

> 12개 테스트 중 10개 통과, 나머지 2개 실패에 대한 설계 이슈 분석 보고서입니다.

## 1. Select: Range Selection

**현상**: Multi-select 모드(`select: { mode: "multiple" }`)인 그리드에서 아이템을 그냥 클릭(Plain Click)했을 때, 기존 선택이 초기화되고 클릭한 아이템만 선택됨.
**테스트 기대**: Plain Click시 기존 선택이 유지되거나 추가됨(Additive).

### 분석
- **현재 구현 (`FocusSensor`)**: Plain Click은 **항상 `replace` 모드**로 동작합니다. 이는 macOS Finder, Windows Explorer 등 일반적인 OS 파일 탐색기의 표준 동작입니다 (다중 선택 하려면 `Command/Ctrl` 필요).
- **테스트 의도**: 엑셀이나 스프레드시트처럼 Plain Click도 선택을 유지/추가하는 동작을 기대하고 있습니다.

### 제안 (옵션)
1. **OS 표준 따르기 (권장)**: 구현을 유지하고, **테스트를 수정**합니다. 다중 선택 시 `Ctrl/Cmd` 키를 누르도록 시뮬레이션합니다.
2. **Context-aware 변경**: `select.mode === "multiple"`인 영역에서는 Plain Click을 `toggle`로 처리하도록 센서 로직을 변경합니다. (스프레드시트 UX)

---

## 2. Focus Stack: Restore

**현상**: 모달을 열었을 때 모달 내부의 첫 번째 아이템으로 포커스가 자동으로 이동하지 않음.
**원인**: `FocusGroup`의 `autoFocus` 로직이 **페이지 로드 시 단 한 번만 수행**되도록 전역 플래그(`autoFocusClaimed`)로 막혀 있음.

### 분석
- **현재 구현**: `role="dialog"`나 `role="alertdialog"`인 경우에만 전역 플래그를 무시하고 강제 포커싱합니다.
- **문제점**: 현재 테스트의 모달은 `role="menu"`로 설정되어 있어, 시스템이 이를 '새로운 최상위 모달'로 인식하지 않고 일반 그룹으로 취급하여 오토포커스를 차단합니다.

### 제안 (옵션)
1. **Semantics 수정 (권장)**: 모달 컴포넌트의 역할(Role)을 올바르게 `dialog`로 변경합니다. 이렇게 하면 OS가 "아, 이건 대화상자니까 포커스를 납치해도 되는구나"라고 인식합니다.
2. **로직 완화**: `config.project.autoFocus: true`가 명시적으로 설정된 경우 전역 플래그를 무시하도록 `FocusGroup` 구현을 수정합니다.
