# Focus 시스템 속성 레퍼런스

> Focus 시스템의 모든 속성을 MECE(상호 배타적, 전체 포괄적) 원칙에 따라 분류한 문서입니다.

---

## 1. 설정(Configuration) 속성

FocusGroup에 전달되는 정적 설정값입니다.

### 1.1 Navigate (탐색)

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `orientation` | `horizontal` \| `vertical` \| `both` | `vertical` | 방향키 탐색 방향 |
| `loop` | `boolean` | `false` | 끝에서 처음으로 순환 |
| `seamless` | `boolean` | `false` | Zone 경계 넘어 탐색 |
| `typeahead` | `boolean` | `false` | 타이핑으로 항목 검색 |
| `entry` | `first` \| `last` \| `restore` \| `selected` | `first` | Zone 진입 시 초기 포커스 위치 |
| `recovery` | `next` \| `prev` \| `nearest` | `next` | 삭제된 항목 대체 전략 |

### 1.2 Tab (탭 동작)

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `behavior` | `trap` \| `escape` \| `flow` | `escape` | Tab 키 동작 모드 |
| `restoreFocus` | `boolean` | `false` | Zone 이탈 후 복귀 시 이전 위치 복원 |

### 1.3 Select (선택)

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `mode` | `none` \| `single` \| `multiple` | `none` | 선택 모드 |
| `followFocus` | `boolean` | `false` | 포커스 이동 시 자동 선택 |
| `disallowEmpty` | `boolean` | `false` | 빈 선택 방지 |
| `range` | `boolean` | `false` | Shift+방향키 범위 선택 허용 |
| `toggle` | `boolean` | `false` | 재클릭 시 선택 해제 |

### 1.4 Activate (활성화)

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `mode` | `manual` \| `automatic` | `manual` | 활성화 트리거 방식 |

### 1.5 Dismiss (해제)

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `escape` | `close` \| `deselect` \| `none` | `none` | ESC 키 동작 |
| `outsideClick` | `close` \| `none` | `none` | 외부 클릭 동작 |

### 1.6 Project (프로젝션)

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `virtualFocus` | `boolean` | `false` | 가상 포커스 사용 (DOM focus 미이동) |
| `autoFocus` | `boolean` | `false` | Zone 마운트 시 자동 포커스 |

---

## 2. 런타임 상태(State) 속성

Store에서 관리되는 동적 상태값입니다.

### 2.1 Cursor (커서)

| 속성 | 타입 | 설명 |
|------|------|------|
| `focusedItemId` | `string \| null` | 현재 포커스된 아이템 ID |
| `lastFocusedId` | `string \| null` | 마지막 포커스 위치 (restore용) |

### 2.2 Selection (선택)

| 속성 | 타입 | 설명 |
|------|------|------|
| `selection` | `string[]` | 선택된 아이템 ID 배열 |
| `selectionAnchor` | `string \| null` | 범위 선택 기준점 |

### 2.3 Expansion (확장)

| 속성 | 타입 | 설명 |
|------|------|------|
| `expandedItems` | `string[]` | 확장된 아이템 ID 배열 |

### 2.4 Spatial (공간 기억)

| 속성 | 타입 | 설명 |
|------|------|------|
| `stickyX` | `number \| null` | 수직 이동 시 X 좌표 기억 |
| `stickyY` | `number \| null` | 수평 이동 시 Y 좌표 기억 |

### 2.5 Items (항목 레지스트리)

| 속성 | 타입 | 설명 |
|------|------|------|
| `items` | `string[]` | 등록된 아이템 ID 배열 (DOM 순서) |

---

## 3. Zone 데이터(ZoneData) 속성

FocusData WeakMap에 저장되는 Zone 메타데이터입니다.

### 3.1 구조 정보

| 속성 | 타입 | 설명 |
|------|------|------|
| `store` | `FocusGroupStore` | Zone의 Zustand 스토어 인스턴스 |
| `config` | `FocusGroupConfig` | Zone의 설정 객체 |
| `parentId` | `string \| null` | 부모 Zone ID (중첩 구조용) |

### 3.2 바인딩된 커맨드

| 속성 | 타입 | 트리거 | 설명 |
|------|------|--------|------|
| `activateCommand` | `BaseCommand` | Enter/Space/Click | 항목 활성화 시 실행 |
| `selectCommand` | `BaseCommand` | Focus 이동 | 선택 변경 시 실행 |
| `copyCommand` | `BaseCommand` | ⌘+C | 복사 시 실행 |
| `cutCommand` | `BaseCommand` | ⌘+X | 잘라내기 시 실행 |
| `pasteCommand` | `BaseCommand` | ⌘+V | 붙여넣기 시 실행 |
| `deleteCommand` | `BaseCommand` | Delete/Backspace | 삭제 시 실행 |
| `undoCommand` | `BaseCommand` | ⌘+Z | 실행 취소 시 실행 |
| `redoCommand` | `BaseCommand` | ⌘+Shift+Z | 다시 실행 시 실행 |

---

## 4. 글로벌 상태

FocusData 모듈에서 관리하는 전역 상태입니다.

| 속성/메서드 | 반환 타입 | 설명 |
|-------------|-----------|------|
| `activeZoneId` | `string \| null` | 현재 활성 Zone ID |
| `getFocusPath()` | `string[]` | 루트→현재 Zone 경로 배열 |
| `getOrderedZones()` | `string[]` | 모든 Zone ID (DOM 순서) |
| `getSiblingZone(dir)` | `string \| null` | 형제 Zone ID (Tab용) |

---

## 5. Intent (의도) 타입

파이프라인에서 사용되는 Focus Intent 유형입니다.

| Intent | 주요 필드 | 설명 |
|--------|-----------|------|
| `NAVIGATE` | `direction: up\|down\|left\|right` | 방향키 탐색 |
| `TAB` | `direction: forward\|backward` | Tab 이동 |
| `SELECT` | `mode: single\|toggle\|range\|all\|none` | 선택 동작 |
| `ACTIVATE` | `trigger: enter\|space\|click\|focus` | 활성화 동작 |
| `DISMISS` | `reason: escape\|outsideClick` | 해제 동작 |
| `FOCUS` | `targetId, source` | 직접 포커스 지정 |
| `POINTER` | `subtype: enter\|leave\|down\|up` | 포인터 이벤트 |
| `EXPAND` | `action: toggle\|expand\|collapse` | 확장/축소 |

---

## 6. 파이프라인 컨텍스트(PipelineContext)

Intent 처리 중 전달되는 컨텍스트 객체입니다.

| 속성 | 타입 | 설명 |
|------|------|------|
| `sourceId` | `string \| null` | 원본 아이템 ID |
| `sourceGroupId` | `string \| null` | 원본 Zone ID |
| `intent` | `FocusIntent` | 처리 중인 Intent |
| `targetId` | `string \| null` | 계산된 대상 아이템 ID |
| `targetGroupId` | `string \| null` | 계산된 대상 Zone ID |
| `stickyX/Y` | `number \| null` | 공간 기억 좌표 |
| `shouldTrap` | `boolean` | 포커스 트랩 여부 |
| `shouldProject` | `boolean` | DOM 포커스 이동 여부 |
| `newSelection` | `string[]` | 새 선택 목록 |
| `newAnchor` | `string \| null` | 새 앵커 ID |
| `activated` | `boolean` | 활성화 발생 여부 |

---

*마지막 업데이트: 2026-02-07*
