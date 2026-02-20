# /doubt 결과 (Builder app.ts - 2라운드 수렴)

## 라운드 요약
| Round | 🔴 제거 | 🟡 축소/재설계 | ↩️ 자기교정 | 수렴? |
|:-----:|:------:|:------:|:---------:|:----:|
| 1     | 2      | 1      | 0         | ❌  |
| 2     | 0      | 1      | 0         | ❌  |
| 3     | 0      | 0      | 0         | ✅  |

## 🔴 제거 (총 2건)
- `allFields` 셀렉터: 단 한 번도 사용되지 않는 '재고/과잉생산' 상태 발견 (Round 1)
- `builderUpdateField`: `PropertiesPanel`에서조차 쓰이지 않고, `builderUpdateFieldByDomId`만 사용되는 완벽한 Dead Code (Round 1)

## 🟡 축소/병합/재배치 (총 2건)
- `resolveFieldAddress`: (축소/과잉처리 해결) Prefix로 `SectionEntry`를 찾아놓고 ID만 반환해 호출부에서 또 `find`를 하던 비효율을, 참조를 바로 전달하도록 변경하여 O(N) 서치 1회 제거. (Round 1)
- `INITIAL_STATE` 및 `BuilderState`: (재배치/Fit 개선) 140줄이 넘는 Type과 Mock Data가 OS Integration 파일(`app.ts`)에 혼재하던 형태적 부적합. `model/appState.ts`로 추출하여 파일 순도와 가독성 대폭 향상 (BOARD - Ideas 에 존재하던 'INITIAL_STATE 위치 관례' 동시 해결). (Round 2)

## 🟢 유지 (19건)
- `selectedId`, `selectedType`: UI 브릿지 역할로 유효함 (PropertiesPanel 사용)
- `undoCommand`, `redoCommand`: Undo/Redo 공통 팩토리 정상 동작중
- `sidebarCollection` 구문 밎 CRUD alias: 테스트와 바인딩에서 유효하게 쓰임
- `canvasZone`, `updateField`, `selectElement`: 메인 캔버스 렌더링에 필수적인 커맨드
- 기타 binding 설정 객체들 (`BuilderSidebarUI` 등): Side-effect 만을 위한 `bind()` 실행의 주체로서 유효 설계임(Dead Code가 아님)

## 📊 Before → After (누적 누수 방지 효과)
- `src/apps/builder/app.ts` 파일 사이즈: **417라인 → 255라인 (−162라인)** 감량
- 복잡도 낮아짐: App.ts가 오직 OS Integration (Command/Selector/Bindings)만 가지게 됨.
