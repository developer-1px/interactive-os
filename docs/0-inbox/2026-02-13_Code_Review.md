# 🔍 Code Review: Command Palette UX Changes
> Date: 2026-02-13
> Scope: `CommandPalette.tsx`, `Dialog.tsx`

## 🔴 철학 위반 (즉시 수정 필요)

### 1. `document.querySelector()` 직접 사용 — 100% Declarative 위반
- **File**: [CommandPalette.tsx](file:///Users/user/Desktop/interactive-os/src/command-palette/CommandPalette.tsx#L143-L154)
- **Lines**: 143–154
- **현재 코드**:
  ```tsx
  const zoneEl = document.querySelector('[data-zone-id="command-palette-list"]');
  if (zoneEl) {
    zoneEl.dispatchEvent(new KeyboardEvent("keydown", { ... }));
  }
  ```
- **문제점**: DOM 직접 조회 + 가상 이벤트 발생은 명령형 패턴. 프로젝트 원칙 "document.getElementById() / querySelector() 대신 커널 상태 참조" 위반.
- **수정 제안**: 커널 커맨드를 직접 dispatch하여 포커스를 이동. 예: `OS_NAVIGATE` 커맨드를 dispatch하면 커널이 zone 내 포커스를 이동시킴.

### 2. `requestAnimationFrame` 타이밍 해킹 — 100% Declarative 위반
- **File**: [CommandPalette.tsx](file:///Users/user/Desktop/interactive-os/src/command-palette/CommandPalette.tsx#L110)
- **Line**: 110
- **현재 코드**:
  ```tsx
  requestAnimationFrame(() => inputRef.current?.focus());
  ```
- **문제점**: 프로젝트 원칙 "setTimeout / requestAnimationFrame으로 타이밍 해킹하지 않는가?" 위반. 커널의 autoFocus 메커니즘이 이미 존재.
- **수정 제안**: `OS.Zone`의 `autoFocus` 설정으로 input에 자동 포커스되도록 구성하거나, 포커스 커맨드를 dispatch.

### 3. `options` 인라인 객체 리터럴 반복 — 자기모순
- **File**: [CommandPalette.tsx](file:///Users/user/Desktop/interactive-os/src/command-palette/CommandPalette.tsx#L217)
- **Line**: 217
- **현재 코드**:
  ```tsx
  <OS.Zone
    options={{ project: { autoFocus: true } }}
  ```
- **문제점**: `Dialog.tsx`에서 이 정확한 패턴을 "커서 점프의 근본 원인"이라고 진단하고 상수로 추출했는데, `CommandPalette.tsx`의 Zone에서 **동일한 인라인 객체를 그대로 사용**하고 있음.
- **수정 제안**: 상수로 추출.

## 🟡 네이밍/구조 (리팩토링 권장)

### 4. PaletteItem의 `onClick` / `onKeyDown` 콜백 — 커맨드 원칙 위반 (기존 코드)
- **File**: [CommandPalette.tsx](file:///Users/user/Desktop/interactive-os/src/command-palette/CommandPalette.tsx#L315-L324)
- **Lines**: 315–324
- **문제점**: `() => void` 콜백이 커맨드여야 할 자리에 쓰이고 있음. `OS.Item`의 `onAction`으로 처리해야 하는 로직이 raw event handler에 있음.
- **참고**: 기존 코드이므로 이번 PR 범위 밖이나, 개선 대상으로 기록.

## 🔵 개선 제안

### 5. Footer Hints에 Tab 힌트 미표시
- **File**: [CommandPalette.tsx](file:///Users/user/Desktop/interactive-os/src/command-palette/CommandPalette.tsx#L262-L289)
- **문제점**: Typeahead 기능을 추가했지만, Footer Hints에 `Tab` 키에 대한 설명이 없음.
- **수정 제안**: `Tab` complete 힌트를 Footer에 추가.

## 요약

| 분류 | 건수 | 즉시 수정 |
|------|------|-----------|
| 🔴 철학 위반 | 3 | ✅ 필요 |
| 🟡 네이밍/구조 | 1 | 기존 코드 |
| 🔵 개선 제안 | 1 | 권장 |
