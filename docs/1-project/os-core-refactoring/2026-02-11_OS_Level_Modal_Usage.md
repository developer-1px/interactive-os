# OS-Level Modal — Usage 제안

> **Date**: 2026-02-11  
> **Topic**: Modal을 OS level에서 직접 구현할 때 최적의 usage API 설계

---

## 1. 개요 (Overview)

현재 Modal은 **앱 레벨에서 직접 구현**하는 패턴을 따른다:
- `useState`로 open/close 관리
- 로컬 `<Modal>` 컴포넌트로 overlay/backdrop 렌더링
- `<FocusGroup role="dialog">` + `project={{ autoFocus: true }}` + `onDismiss`로 OS focus만 위임

이 패턴의 문제점:
1. **Modal마다 반복 코드** — overlay, backdrop click, ESC close를 매번 구현
2. **Focus Stack은 OS가 관리하지만 열기/닫기는 앱이 관리** — 관심사가 분리되지 않음
3. **Nested modal 시 상태 관리 복잡도 증가** — `modal1Open`, `modal2Open` 등 N개의 state

> [!IMPORTANT]
> Modal의 **open/close lifecycle**과 **visual layer(backdrop + positioning)**를 OS가 소유하면,
> 앱은 "무엇을 보여줄 것인가"만 선언하면 된다.

---

## 2. 분석 — 3가지 Usage 후보

### Option A: `OS.Modal` Primitive (선언형 컴포넌트)

```tsx
// 앱 코드 — open/close state는 여전히 앱이 소유
<OS.Modal open={isOpen} onClose={() => setIsOpen(false)}>
  <OS.Zone role="dialog">
    <OS.Item id="ok">OK</OS.Item>
    <OS.Item id="cancel">Cancel</OS.Item>
  </OS.Zone>
</OS.Modal>
```

| 장점 | 단점 |
|------|------|
| React 개발자에게 가장 친숙한 패턴 | open/close state가 여전히 앱 소유 |
| 기존 `OS.Zone` 조합과 일관성 유지 | OS가 modal lifecycle을 완전히 제어하지 못함 |
| 점진적 마이그레이션 용이 | `<dialog>` native와 중복 가능 |

**구현 범위**: 
- backdrop, portal, scroll-lock, aria-modal 자동화
- 내부적으로 `STACK_PUSH/POP` + `FocusGroup role="dialog"` 조합

---

### Option B: Kernel Command (`OS_MODAL_OPEN` / `OS_MODAL_CLOSE`) ⭐ 추천

```tsx
// 앱 코드 — OS에 "이 Zone을 modal로 열어줘"라고 요청
const OPEN_SETTINGS = kernel.defineCommand("OPEN_SETTINGS", (ctx) => () => ({
  modal: {
    id: "settings-modal",
    content: <SettingsPanel />,  // or a registered component key
    backdrop: true,
    size: "md",
  },
}));

// Zone 안에서 자연스럽게 trigger
<OS.Zone role="listbox" onAction={OPEN_SETTINGS}>
  <OS.Item id="settings">Settings</OS.Item>
</OS.Zone>
```

```tsx
// 또는 간단한 imperative API
kernel.dispatch(OS_MODAL_OPEN({
  id: "confirm-delete",
  content: <ConfirmDialog onConfirm={handleDelete} />,
}));
```

| 장점 | 단점 |
|------|------|
| **Modal lifecycle이 완전히 kernel 상태** | ReactNode를 kernel state에 넣기 어려움 |
| Time-travel debugging에 modal open/close 포함 | 구현 복잡도 높음 |
| 중첩 modal stack을 OS가 완전히 관리 | 앱 개발자에게 러닝 커브 |
| Inspector에서 modal 상태 추적 가능 | |

**구현 범위**:
- `OSState`에 `modals: ModalEntry[]` 슬라이스 추가
- `OS_MODAL_OPEN` / `OS_MODAL_CLOSE` command 정의
- `<OS.Root>` 내부에 `<ModalLayer />` 렌더러 추가
- `STACK_PUSH/POP`을 modal open/close에 자동 연결

---

### Option C: Hybrid — `useModal` Hook (가장 실용적) ⭐⭐ 강력 추천

```tsx
function MyApp() {
  const settingsModal = OS.useModal("settings");

  return (
    <OS.Zone role="listbox">
      <OS.Item id="open-settings">
        <OS.Trigger onClick={settingsModal.open}>
          Settings
        </OS.Trigger>
      </OS.Item>

      <settingsModal.Portal>
        <OS.Zone role="dialog">
          <OS.Item id="ok">OK</OS.Item>
          <OS.Item id="cancel" onAction={settingsModal.close}>
            Cancel
          </OS.Item>
        </OS.Zone>
      </settingsModal.Portal>
    </OS.Zone>
  );
}
```

| 장점 | 단점 |
|------|------|
| **앱은 선언적, OS는 lifecycle 소유** | Hook 기반이라 조건부 사용 불가 |
| `Portal`이 자동으로 backdrop + stack 관리 | Option B보다 구조적 자유도 낮음 |
| `open/close`가 내부적으로 kernel command | |
| Nested modal은 hook 중첩으로 자연 해결 | |
| 기존 `OS.Zone`/`OS.Item`과 100% 호환 | |

**구현 범위**:
- `useModal(id)` → 내부적으로 kernel state (`os.modals[]`) 연동
- `Portal` 컴포넌트가 backdrop + `createPortal` + scroll-lock 자동화
- `open()` → `OS_MODAL_OPEN` dispatch + `STACK_PUSH`
- `close()` → `OS_MODAL_CLOSE` dispatch + `STACK_POP`
- **isOpen은 kernel state에서 파생** → Inspector/time-travel 호환

---

## 3. 결론 및 제안

### 추천: **Option C (`useModal` Hook)** 우선, Option A(`OS.Modal`) 보조

```
실용성:  C > A > B
OS 철학: B > C > A  
구현난이도: A < C < B
```

**Phase 1**: `OS.useModal` hook 구현
- `OSState`에 `modals` 슬라이스 추가
- `OS_MODAL_OPEN` / `OS_MODAL_CLOSE` kernel command
- `<ModalLayer />` in `OS.Root`

**Phase 2**: `OS.Modal` (Option A) 추가
- `useModal` 위에 thin wrapper
- 기존 코드 마이그레이션 용이

### Kernel State Extension (공통)

```ts
// OSState 확장
interface OSState {
  focus: { ... };
  modals: ModalEntry[];  // ← NEW
}

interface ModalEntry {
  id: string;
  backdrop?: boolean;
  size?: "sm" | "md" | "lg" | "full";
  // content는 React tree에서 관리 (kernel에 JSX 저장 X)
}
```

> [!TIP]
> **핵심 원칙**: kernel state에는 **modal이 열려있는지**(id, config)만 저장하고,
> **무엇을 렌더링할지**(JSX)는 React tree에서 `Portal` 패턴으로 관리한다.  
> 이렇게 하면 serializable state + React rendering이 자연스럽게 분리된다.

### 최종 Usage 이미지

```tsx
// ✅ 깔끔한 앱 코드
function FileManager() {
  const deleteConfirm = OS.useModal("delete-confirm");

  return (
    <>
      <OS.Zone role="listbox" onAction={deleteConfirm.open}>
        <OS.Item id="file-1">Document.pdf</OS.Item>
      </OS.Zone>

      <deleteConfirm.Portal backdrop size="sm">
        <OS.Zone role="dialog">
          <p>정말 삭제할까요?</p>
          <OS.Item id="yes" onAction={handleDelete}>예</OS.Item>
          <OS.Item id="no" onAction={deleteConfirm.close}>아니오</OS.Item>
        </OS.Zone>
      </deleteConfirm.Portal>
    </>
  );
}
```

---

> **Next Action**: Option C 구현 계획을 `1-project`로 승격할지, 추가 논의가 필요한지 결정 필요.
