# Spec — OS Clipboard

> OS가 보장하는 클립보드 동작의 요구사항과 체크리스트.
> Source: 코드 + 테스트 역산. Verified: 826 tests pass.

## 1. 아키텍처

```
ClipboardEvent (DOM)
  → ClipboardListener (sense: isInputActive, canZoneHandle)
  → resolveClipboard (pure function)
  → OS_COPY / OS_CUT / OS_PASTE (command)
  → Zone callback (onCopy/onCut/onPaste)
  → App command (실제 복사/잘라내기/붙여넣기 로직)
```

**핵심 원칙**: OS는 클립보드 이벤트를 **중재**만 한다. 실제 데이터 처리는 앱의 Zone callback 책임.

## 2. 요구사항 체크리스트

### 2.1 이벤트 감지 & 라우팅

- [x] `copy`, `cut`, `paste` DOM 이벤트를 window 레벨에서 리슨
- [x] 이벤트 → `resolveClipboard` 순수 함수로 판단
- [x] 판단 결과 `dispatch` → OS 커맨드 실행
- [x] 판단 결과 `passthrough` → 브라우저 기본 동작 유지

### 2.2 판단 규칙 (resolveClipboard)

| 조건 | 결과 | 이유 |
|------|------|------|
| input/textarea/contentEditable 활성 | **passthrough** | 네이티브 편집 보호 |
| Zone에 해당 callback 없음 | **passthrough** | 앱이 처리 안 함 |
| Zone에 callback 있음 + input 비활성 | **dispatch** | OS가 중재 |

- [x] `isInputActive` → passthrough (input, textarea, contentEditable 보호)
- [x] `!zoneHasCallback` → passthrough (Zone이 처리 안 하면 건드리지 않음)
- [x] Zone callback 있음 + input 비활성 → dispatch

### 2.3 OS 커맨드 동작

#### OS_COPY
- [x] activeZoneId 없으면 no-op
- [x] Zone에 onCopy 없으면 no-op
- [x] `buildZoneCursor(zone)` → ZoneCursor 생성
- [x] `entry.onCopy(cursor)` 결과를 dispatch
- [x] **preventDefault 안 함** — 네이티브 copy 공존 (인스펙터 텍스트 선택 동작)

#### OS_CUT
- [x] activeZoneId 없으면 no-op
- [x] Zone에 onCut 없으면 no-op
- [x] `entry.onCut(cursor)` 결과를 dispatch
- [x] **selection 있으면 자동 OS_SELECTION_CLEAR** — OS 책임
- [x] **preventDefault** — 네이티브 cut 방지 (구조적 데이터 보호)

#### OS_PASTE
- [x] activeZoneId 없으면 no-op
- [x] Zone에 onPaste 없으면 no-op
- [x] focusId 없어도 빈 cursor 생성 (`focusId: ""` → append at end)
- [x] `entry.onPaste(cursor)` 결과를 dispatch
- [x] **preventDefault** — 네이티브 paste 방지

### 2.4 ZoneCursor 계약

```ts
interface ZoneCursor {
  focusId: string;        // 현재 포커스된 아이템
  selection: string[];    // 선택된 아이템 목록
  anchor: string | null;  // 선택 앵커
}
```

- [x] `buildZoneCursor(zone)` → zone의 focusId, selection, anchor를 추출
- [x] 앱의 onCopy/onCut/onPaste는 이 cursor를 받아서 처리

### 2.5 앱 연동 패턴 (Zone callback)

```ts
zone.bind({
  onCopy:  (cursor) => copyCommand({ id: cursor.focusId }),
  onCut:   (cursor) => cutCommand({ id: cursor.focusId }),
  onPaste: (cursor) => pasteCommand({ id: cursor.focusId }),
})
```

- [x] 앱은 Zone bind 시 onCopy/onCut/onPaste 콜백 제공
- [x] 콜백은 BaseCommand 또는 BaseCommand[]를 반환
- [x] OS는 반환된 커맨드를 dispatch
- [x] 배치 선택: `cursor.selection`으로 다중 아이템 처리 가능

### 2.6 Collection Zone 통합

- [x] `createCollectionZone`이 onCopy/onCut/onPaste를 자동 생성
- [x] `collectionBindings()`로 keybindings + clipboard callbacks 일괄 연결
- [x] copy: 구조적 복사 (JSON serialize → OS clipboard write)
- [x] cut: copy + delete + selection clear
- [x] paste: OS clipboard read → deserialize → insert

### 2.7 보장하지 않는 것

- ❌ 데이터 포맷 — 앱이 결정 (JSON, plaintext 등)
- ❌ 붙여넣기 위치 — 앱이 결정 (after, replace, append 등)
- ❌ 복사 범위 — 앱이 결정 (단일, 다중, 구조적)
- ❌ 크로스 앱 호환 — 같은 앱 내 클립보드만 보장

## 3. 테스트 매핑

| 체크리스트 항목 | 테스트 파일 |
|----------------|-----------|
| 2.2 판단 규칙 | `resolveClipboard.test.ts` (6 tests) |
| 2.3 OS 커맨드 | `clipboard-commands.test.ts` (7 tests) |
| 2.6 Collection 통합 | `createCollectionZone.test.ts`, `builder-canvas-clipboard.test.ts` |
