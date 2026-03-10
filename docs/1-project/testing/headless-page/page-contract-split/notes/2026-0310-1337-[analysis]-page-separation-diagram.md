# AS-IS → TO-BE: AppPage 제거 — 타입 구조 변환

> Discussion에서 도출된 Page 분리 설계를 시각화한다.
> 핵심: AppPage(혼합) → Page(Playwright) + os(OS 전용) 분리

---

## 1. 타입 계층 — AS-IS

현재 `AppPage`가 Playwright 메서드와 OS 메서드를 하나의 인터페이스에 섞고 있다.
`AppPageInternal`이 이를 더 확장하여 `dispatch`/`state`까지 추가한다.

```mermaid
graph TB
    subgraph "AS-IS: 혼합된 타입 계층"
        direction TB
        
        Page["Page<br/>(testing/types.ts)<br/>───<br/>Playwright 순수 인터페이스<br/>keyboard, click, locator"]
        
        AppPage["AppPage<br/>(defineApp/types.ts)<br/>───<br/>🔴 Playwright + OS 혼합<br/>keyboard, click, locator<br/>attrs, focusedItemId<br/>selection, activeZoneId<br/>reset, cleanup, html"]
        
        AppPageInternal["AppPageInternal<br/>(defineApp/types.ts)<br/>───<br/>🔴 AppPage + 내부 접근<br/>dispatch, state<br/>setupZone, getDOMElement"]
        
        Page -.->|"정의만 존재<br/>실제 미사용"| Unused["⚠️ 고아 타입"]
        AppPage -->|"extends"| AppPageInternal
        
        createHP["createHeadlessPage()"]
        createHP -->|"returns"| AppPage
        
        Test1["테스트 파일"]
        Test1 -->|"page.keyboard.press()"| AppPage
        Test1 -->|"page.attrs()"| AppPage
        Test1 -->|"page.focusedItemId()"| AppPage
        Test1 -->|"as AppPageInternal"| AppPageInternal
    end
    
    style Page fill:#4a9eff,color:#fff
    style AppPage fill:#ff4444,color:#fff
    style AppPageInternal fill:#cc0000,color:#fff
    style Unused fill:#666,color:#fff
    style createHP fill:#ffa726,color:#000
    style Test1 fill:#7c4dff,color:#fff
```

### 문제

- `Page` 인터페이스는 정의만 있고 실제 사용되지 않는 **고아 타입**
- `AppPage`가 모든 것을 삼킨 **God Interface** (15개 메서드)
- `AppPageInternal extends AppPage`가 **Page에 OS를 붙인 안티패턴**
- E2E(Playwright)에서 `page.attrs()` 같은 메서드를 부르면 → **런타임 에러**

---

## 2. 타입 계층 — TO-BE

`AppPage`를 삭제하고, `Page`(Playwright 성역) + `os`(OS 전용)로 분리한다.

```mermaid
graph TB
    subgraph "TO-BE: 분리된 타입 구조"
        direction TB
        
        PageNew["Page<br/>(testing/types.ts)<br/>───<br/>🟢 Playwright 성역<br/>keyboard, click, locator<br/>goto, type"]
        
        OsHandle["os object<br/>───<br/>🟢 OS 전용<br/>attrs, focusedItemId<br/>selection, activeZoneId<br/>reset, cleanup<br/>dumpDiagnostics"]
        
        TestInstance["TestInstance<br/>(defineApp/types.ts)<br/>───<br/>🟢 기존 타입 재사용<br/>dispatch, state<br/>evaluate, select"]
        
        createTE["createTestEnv()"]
        createTE -->|"returns page"| PageNew
        createTE -->|"returns os"| OsHandle
        
        AppDef["const app = defineApp()"]
        AppDef -->|".create()"| TestInstance
        
        TestFile["테스트 파일"]
        TestFile -->|"page.keyboard.press()"| PageNew
        TestFile -->|"os.attrs()"| OsHandle
        TestFile -->|"os.focusedItemId()"| OsHandle
        TestFile -->|"app.dispatch()"| TestInstance
        
        Script["TestScript (E2E 대상)"]
        Script -->|"page만 사용"| PageNew
        Script -.->|"❌ 접근 불가"| OsHandle
        Script -.->|"❌ 접근 불가"| TestInstance
    end
    
    style PageNew fill:#4caf50,color:#fff
    style OsHandle fill:#2196f3,color:#fff
    style TestInstance fill:#ff9800,color:#fff
    style createTE fill:#ffa726,color:#000
    style AppDef fill:#ffa726,color:#000
    style TestFile fill:#7c4dff,color:#fff
    style Script fill:#e91e63,color:#fff
```

### 원칙

- **Script는 `page`만 안다** → E2E 동형 보장
- **Unit test는 `page` + `os` + `app` 모두 사용 가능**
- **새 타입 발명 없음** — `Page`(기존), `TestInstance`(기존) 재사용

---

## 3. 테스트 코드 변환 — Before / After

```mermaid
graph LR
    subgraph "AS-IS: 테스트 코드"
        direction TB
        A1["const page = createHeadlessPage(TodoApp, TodoPage)"]
        A2["page.keyboard.press('ArrowDown')"]
        A3["page.focusedItemId()"]
        A4["page.attrs('item-1')"]
        A5["(page as AppPageInternal).dispatch(cmd)"]
        A1 --> A2 --> A3 --> A4 --> A5
    end
    
    subgraph "TO-BE: 테스트 코드"
        direction TB
        B1["const { page, os } = createTestEnv(TodoApp, TodoPage)"]
        B2["page.keyboard.press('ArrowDown')"]
        B3["os.focusedItemId()"]
        B4["os.attrs('item-1')"]
        B5["app.dispatch(cmd)"]
        B1 --> B2 --> B3 --> B4 --> B5
    end
    
    A1 -.->|"팩토리 교체"| B1
    A3 -.->|"page → os"| B3
    A4 -.->|"page → os"| B4
    A5 -.->|"캐스트 제거"| B5
    
    style A1 fill:#ff4444,color:#fff
    style A3 fill:#ff4444,color:#fff
    style A4 fill:#ff4444,color:#fff
    style A5 fill:#cc0000,color:#fff
    style B1 fill:#4caf50,color:#fff
    style B3 fill:#2196f3,color:#fff
    style B4 fill:#2196f3,color:#fff
    style B5 fill:#ff9800,color:#fff
    style A2 fill:#4a9eff,color:#fff
    style B2 fill:#4a9eff,color:#fff
```

---

## 4. 삭제 대상 / 잔류 대상 요약

| 타입 | AS-IS | TO-BE | 이유 |
|------|-------|-------|------|
| `Page` | 고아 (미사용) | **🟢 주인공** | Playwright 성역 |
| `AppPage` | God Interface | **🔴 삭제** | Playwright + OS 혼합 |
| `AppPageInternal` | AppPage 확장 | **🔴 삭제** | dispatch/state는 TestInstance로 |
| `AppLocatorAssertions` | AppPage 전용 | **🔴 삭제** | LocatorAssertions로 통합 |
| `TestInstance` | app.create() 반환값 | **🟢 유지** | dispatch, state 이미 보유 |
| `createHeadlessPage()` | AppPage 반환 | **🟡 교체** → `createTestEnv()` | `{ page, os }` 반환 |

---

## 범례

- 🔴 빨간색 = 삭제 대상 (안티패턴)
- 🟢 초록색 = Playwright 성역 / 깨끗한 타입
- 🔵 파란색 = OS 전용 (분리된 표면)
- 🟠 주황색 = App 계층 (TestInstance)
- 🟣 보라색 = 테스트 파일 (소비자)
- 🔗 점선 = 접근 불가 또는 미사용
