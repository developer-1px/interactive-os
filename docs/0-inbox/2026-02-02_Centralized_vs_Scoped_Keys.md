# 아키텍처 토론: Zone이 분리되었는데 왜 키는 중앙집중형인가?

## 1. User 님의 핵심 질문
> *"Zone을 분리했고 Zone끼리는 겹치지 않는데... 키는 왜 중앙집중형(`todo_keys.ts`)으로 관리하는 거야?"*
> *"그냥 Sidebar 폴더에 `sidebar_keys.ts` 만들고, TodoList 폴더에 `list_keys.ts` 만드는 게 더 모듈화된 거 아냐?"*

정말 정확한 지적입니다. **"Zone이 완벽하게 격리(Isolated)되어 있다면"**, 키바인딩도 각 Zone이 알아서 관리하는 게 맞습니다. 이를 **Scoped Decentralization**이라고 합니다.

## 2. 왜 중앙집중형을 선택했는가? (Fear of Global Shadowing)

저희가 중앙집중형을 선택한 이유는 **"지역(Zone)이 전역(Global)을 가리는 사고(Shadowing)"**를 막기 위해서입니다.

### 시나리오: `Cmd+P`의 비극
전역 단축키 `Cmd+P` (Quick Open)가 있다고 가정합시다.

**분산형 (Decentralized) 구조:**
1.  `GlobalKeys.ts`: `{ key: 'Cmd+P', command: 'QUICK_OPEN' }`
2.  `SidebarKeys.ts`: `{ key: 'Cmd+P', command: 'PRINT_SIDEBAR' }` (개발자가 실수로 추가)

사용자가 사이드바에 포커스를 둔 상태에서 `Cmd+P`를 누르면?
-   Sidebar가 입력을 가로채서 `PRINT_SIDEBAR`를 실행합니다.
-   사용자: *"어? 왜 검색창이 안 뜨지? 버그인가?"*

**중앙집중형 (Centralized) 구조:**
`todo_keys.ts` 파일 하나에 다 모여 있으면, 개발자가 `Cmd+P`를 검색했을 때 이미 Global에 정의된 것을 보고 실수를 피할 수 있습니다. 혹은 Linter가 "Duplicate Key Detected" 경고를 띄워줄 수 있습니다.

## 3. 또 다른 이유: 설정 UI (Configuration UX)
사용자가 "설정 > 단축키 변경" 메뉴에 들어갔을 때를 상상해 보세요.
사용자는 **모든 단축키를 한 리스트**에서 보고 싶어 합니다.
- (O) 전체 검색: "Enter" 검색 시 Global, Sidebar, List 등 모든 `Enter` 동작이 나옴.
- (X) 파일별 검색: Sidebar 설정 따로, List 설정 따로 들어가야 함.

이를 구현하려면 어차피 런타임에는 모든 키바인딩을 **하나의 배열로 평탄화(Flattening)** 해야 합니다. 소스 코드 레벨에서 미리 모아두면 이 과정이 단순해집니다.

## 4. 하지만 User 님의 방식도 틀리지 않습니다
만약 "모듈성(Modularity)"이 최우선 가치라면(예: Sidebar를 별도 라이브러리로 배포해야 한다면), User 님 말씀대로 키바인딩을 분산시키는 것이 맞습니다.
다만, 그 경우 **"Global Shadowing 방지 매커니즘"**(예: Global 키는 아예 Zone에서 정의 못하게 막는 타입 시스템 등)이 추가로 필요합니다.

## 5. 결론
현재의 중앙집중형은 **"안전(Safety)"**과 **"관리 편의성(Manageability)"**을 위한 선택이었습니다.
-   **Zone Isolation**: 논리적으로는 분리됨.
-   **Key Registry**: 물리적으로는 모아둠 (충돌 방지 및 전역 관리).

마치 **"모든 방은 벽으로 나뉘어 있지만(Zone), 전기는 하나의 배전반(Registry)에서 관리하는 것"**과 같습니다.
