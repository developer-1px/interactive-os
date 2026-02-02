# Proposal: Manifest-Driven Command Architecture

## 1. 문제 진단 (The Boilerplate)
현재 패턴은 세 단계의 중복 정의가 필요합니다.
1. `Command` 정의
2. `Array` 그룹핑 (`SideBarCommands = [...]`)
3. `Registry` 인스턴스화 및 등록 루프
4. UI에서 `Registry` import 및 `Zone`에 주입

## 2. 해결 방안: "Jurisdiction Manifest"

### A. The Manifest (선언)
커맨드를 영역별로 한 번만 나열합니다.

```typescript
// todo_manifest.ts
export const TodoManifest = {
    // 공통 커맨드는 자동으로 모든 레지스트리에 상속되도록 설정 가능
    global: [Undo, Redo, Patch], 
    
    // 각 영역별 커맨드
    sidebar: [MoveCategoryUp, MoveCategoryDown, SelectCategory],
    todoList: [AddTodo, DeleteTodo, ToggleTodo]
};
```

### B. The Engine Factory (자동화)
엔진 생성 시 Manifest를 주입하면, 레지스트리를 자동으로 생성하고 관리합니다.

```typescript
// todo_engine.tsx
export const { useEngine, Registries } = createInteractionEngine({
    manifest: TodoManifest,
    keymap: TODO_KEYMAP, // 키맵도 여기서 주입
    context: mapStateToContext // 컨텍스트 매퍼
});
```

### C. The Smart Zone (사용)
UI에서는 더 이상 레지스트리를 import할 필요가 없습니다. 영역 ID(`area`)만 명시합니다.

```tsx
// Before
import { SIDEBAR_REGISTRY } from './todo_commands';
<Zone registry={SIDEBAR_REGISTRY}>

// After
<Zone area="sidebar"> 
// Zone이 내부적으로 Engine에서 'sidebar' 레지스트리를 찾아 바인딩함
```

## 3. 기대 효과
1. **코드 감소**: `new Registry`, `forEach`, `export registry` 등의 코드가 **0줄**이 됩니다.
2. **응집도 향상**: `Manifest` 파일 하나만 보면 앱의 모든 인터랙션 구조가 보입니다.
3. **DX 개선**: UI 컴포넌트를 만들 때 "이 레지스트리가 어디 있었지?" 찾을 필요가 없습니다. `area` 이름만 알면 됩니다.

## 4. 실행 계획
1. `createInteractionEngine` 팩토리 유틸리티 구현 (`src/lib/engine_factory.ts`)
2. `todo_commands.ts`의 하단부(Registry 생성 코드)를 `TodoManifest`로 대체
3. `Zone` 컴포넌트가 `area` prop을 통해 레지스트리를 룩업하도록 수정
