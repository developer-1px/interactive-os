# TodoAppShell 구조적 문제점 분석 보고서

## 1. 개요 (Overview)
사용자는 `App.tsx`에서의 `<TodoAppShell>` 사용 방식과, `TodoAppShell.tsx` 내부의 구현 구조에 대해 "구조가 너무 이상하다"는 피드백을 남겼습니다. 본 보고서는 해당 컴포넌트들이 왜 구조적으로 이질감을 주는지(Code Smell)를 분석하고, 이를 개선하기 위한 방향을 제시합니다.

## 2. 분석 (Analysis)

### 2.1. 역할의 과도한 결합 (God Component Symptom)
현재 `TodoAppShell`은 단일 컴포넌트 내에서 서로 다른 레벨의 책임들을 동시에 수행하고 있습니다:
1.  **Infrastructure Level**: `useTodoEngine()`을 통한 엔진 초기화 및 `AntigravityOS` Context Provider 제공.
2.  **Layout Level**: 화면 전체를 채우는 Flexbox 레이아웃, 배경색, 폰트 설정.
3.  **Feature Level**: `Inspector`의 조건부 렌더링 및 `ClipboardManager` 배치.
4.  **Zone Management**: 모든 자식 요소(`children`)를 `id="main"`인 `Zone`으로 강제 래핑.

이로 인해 "Todo 앱을 구동하기 위한 껍데기(Shell)"라는 이름 하에 **데이터(OS/Engine)** 와 **뷰(Layout/UI)** 가 강하게 결합되어 있습니다.

### 2.2. Inspector 위치의 부자연스러움
```tsx
{/* Inspector (Separated from OS Core) */}
{isInspectorOpen && (
    <aside className="h-full w-[600px]...">
        <CommandInspector />
    </aside>
)}
```
- **문제점**: 디버징 도구인 `Inspector`가 앱의 메인 레이아웃 구조(수평 Flex Layout)에 하드코딩되어 있습니다.
- **영향**:
    - 앱의 레이아웃을 변경하려면 쉘 전체를 뜯어고쳐야 합니다.
    - Inspector가 앱의 DOM 구조에 침투하여, 실제 운영 환경(Production)의 레이아웃과 개발 환경의 레이아웃이 달라질 수 있는 구조입니다(현재는 논리적으로 분리되어 있지만 레이아웃에 영향을 주는 방식).
    - `w-[600px]` 등의 하드코딩된 스타일이 재사용성을 저해합니다.

### 2.3. Zone 계층 구조의 강제성
`App.tsx` 구조:
```tsx
<TodoAppShell>
  <GlobalNav />
  <Outlet />
</TodoAppShell>
```

`TodoAppShell.tsx` 내부:
```tsx
<Zone id="main" area="main" layout="row">
    <ClipboardManager />
    {children}
</Zone>
```
- **문제점**: `GlobalNav`(전역 네비게이션)와 `Outlet`(페이지 컨텐츠)이 모두 `main`이라는 하나의 Zone 안에 묶이게 됩니다.
- **영향**: 일반적으로 네비게이션 영역과 컨텐츠 영역은 서로 다른 Zone(예: `sidebar` vs `content`)으로 분리되어 포커스 흐름을 제어해야 할 경우가 많은데, 현재 구조는 이를 단일 Zone으로 평탄화(Flatten) 시켜버립니다.

## 3. 결론 및 제안 (Conclusion & Proposal)

구조적 "이상함"을 해소하기 위해 **Concerns(관심사)의 분리**가 필요합니다.

### 3.1. Provider와 Layout의 분리 (권장)
`App.tsx` 레벨에서 OS의 생명주기를 관리하는 Provider와, 화면을 그리는 Layout을 명확히 구분하는 것이 좋습니다.

**개선 예시 (Conceptual):**

```tsx
// App.tsx
export default function App() {
  return (
    <AntigravityEngineProvider> {/* 엔진 인스턴스 생성 및 주입 */}
      <BrowserRouter>
        <Routes>
          <Route element={<TodoAppLayout />}> {/* 순수 레이아웃 */}
             {/* ... routes ... */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AntigravityEngineProvider>
  );
}
```

### 3.2. Layout 컴포넌트의 단순화
`TodoAppShell`(또는 `TodoAppLayout`)은 오직 UI 배치(Main Area, Sidebar 등)에만 집중하고, `Inspector`는 별도의 레이어(Overlay)나 상위 레이아웃 컴포넌트에서 주입(Slot/Composition) 받는 패턴을 고려해야 합니다.

### 3.3. Zone 정의의 명시화
`TodoAppShell`이 내부적으로 `Zone`을 숨기기보다, 필요한 곳(예: `GlobalNav`, `Page` 내부)에서 명시적으로 `Zone`을 선언하거나, Layout이 명확한 Zone 영역(`SidebarZone`, `ContentZone`)을 프롭스로 받아 렌더링하도록 변경하여 계층 구조를 명확히 해야 합니다.
