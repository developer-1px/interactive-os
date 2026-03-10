# Headless Test — 이름 관계도

| 항목 | 내용 |
|------|------|
| **원문** | 이름을 중심으로 관계도를 머메이드로 그려줄래? |
| **내(AI)가 추정한 의도** | **경위**: headless test 개념 확립 과정에서 naming Key Pool이 텍스트 표로만 존재. **표면**: Mermaid 다이어그램으로 이름 간 관계를 시각화하라. **의도**: 흩어진 식별자들의 구조적 관계를 한눈에 보고, 개념의 계층과 빈 자리를 직관적으로 파악하고 싶다. |
| **날짜** | 2026-03-10 |
| **선행 문서** | [headless-test-concept.md](../0-inbox/2026-0310-1105-[analysis]-headless-test-concept.md) |

---

## 1. 3-Tier 실행 모델

```mermaid
graph TB
    subgraph "Write Once"
        TS["TestScript"]
        TSc["TestScenario"]
        TSc -->|"scripts: TestScript[]"| TS
    end

    subgraph "Run Anywhere — 3-Tier Execution"
        direction LR
        T1["1. Headless<br/><code>createHeadlessPage()</code><br/>vitest · &lt;1ms"]
        T2["2. Browser<br/><code>createBrowserPage()</code><br/>Inspector · PointerEvent"]
        T3["3. Playwright<br/>native page<br/>E2E · shim 0"]
    end

    TS -->|"run(page, expect, items)"| T1
    TS -->|"run(page, expect, items)"| T2
    TS -->|"run(page, expect, items)"| T3

    ZD["Zero Drift 보장<br/>Headless PASS = DOM 동일 동작"]
    T1 -.->|"isomorphic"| T2
    T2 -.->|"isomorphic"| T3
    ZD -.-> T1
```

---

## 2. Type 계층 — 인터페이스와 구현

```mermaid
graph TD
    subgraph "Playwright Subset API (types.ts)"
        Page["Page<br/>press · type · locator · keyboard"]
        Locator["Locator<br/>click · getAttribute · inputValue"]
        LA["LocatorAssertions<br/>toHaveAttribute · toBeFocused<br/>toBeChecked · toBeDisabled · not"]
        Locator -->|"extends"| LA
        Page -->|"locator(selector)"| Locator
    end

    subgraph "Headless 구현 (page.ts)"
        HP["createHeadlessPage()"]
        AP["createAppPage()"]
        LR2["LocatorResult<br/>attrs · click · expect()"]
        HP -->|"내부 호출"| AP
        AP -->|"locator(id)"| LR2
        LR2 -->|"implements"| Locator
    end

    subgraph "Browser 구현 (createBrowserPage.ts)"
        BP["createBrowserPage()"]
        VE["VisualEffects<br/>moveCursorTo · showRipple<br/>showKeyBadge · showStamp"]
        BP -->|"uses"| VE
        BP -->|"implements"| Page
    end

    subgraph "expect 래퍼 (expect.ts)"
        EX["expect(locator)"]
        EX -->|"returns"| LA
    end
```

---

## 3. 동사 × 대상 — 함수 관계 맵

```mermaid
graph LR
    subgraph "create — 인스턴스 생성"
        cHP["createHeadlessPage"]
        cBP["createBrowserPage"]
        cAP["createAppPage"]
        cNL["createNegatedLocator"]
        cPL["createPositiveLocator"]
        cHE["createHeadlessEffects"]
        cVE["createVisualEffects"]
    end

    subgraph "simulate — 상호작용 재현"
        sKP["simulateKeyPress"]
        sC["simulateClick"]
    end

    subgraph "build / resolve — 변환"
        bKI["buildKeyboardInput"]
        rCS["resolveClipboardShim"]
    end

    subgraph "register — 등록"
        rHZ["registerHeadlessZone"]
    end

    subgraph "read / get — 조회"
        gZI["getZoneItems"]
    end

    subgraph "format / run — 실행·출력"
        fD["formatDiagnostics"]
        rS["runScenarios"]
        eS["extractScenarios"]
    end

    cHP -->|"내부"| cAP
    cAP -->|"press/click"| sKP
    cAP -->|"press/click"| sC
    cAP -->|"goto()"| rHZ
    sKP -->|"input 생성"| bKI
    sKP -->|"clipboard 감지"| rCS
    rS -->|"각 scenario"| cHP
    rS -->|"items 조회"| gZI
    cBP -->|"시각 효과"| cVE
    cAP -->|"locator()"| cNL
    cAP -->|"locator()"| cPL
    cAP -->|"진단"| fD
```

---

## 4. Page API 메서드 — Playwright 대칭 맵

```mermaid
graph TD
    subgraph "Page API — Playwright 대칭"
        goto["goto(url)<br/>Zone 등록 + 상태 시드"]
        setupZone["setupZone(id, opts)<br/>⚠️ LEGACY — 제거 예정"]
        press["keyboard.press(key)"]
        type["keyboard.type(text)"]
        click["click(itemId, opts?)"]
        locator["locator(selector)<br/>→ LocatorResult"]
    end

    subgraph "OS 확장 API — Headless 전용"
        attrs["attrs(itemId)<br/>→ ItemAttrs"]
        focusedItemId["focusedItemId(zoneId?)"]
        selection["selection(zoneId?)"]
        activeZoneId["activeZoneId()"]
        state["state()<br/>→ AppState"]
        dispatch["dispatch(command)"]
        dumpDiag["dumpDiagnostics()"]
        query["query(search)"]
        html["html()"]
        reset["reset()"]
    end

    subgraph "내부 메서드"
        registerZone["registerZoneFromBinding()"]
        seedInitial["seedInitialState()"]
        renderHtml["renderHtml()"]
        parseProj["parseProjectionItems()"]
        syncProj["syncProjectionToRegistry()"]
    end

    goto -->|"각 zone"| registerZone
    registerZone --> seedInitial
    renderHtml --> parseProj
    parseProj --> syncProj
    setupZone -.->|"deprecated by"| goto
```

---

## 5. TestScript 생태계 — 스크립트 분류

```mermaid
graph TD
    subgraph "Generic Scripts (scripts.ts)"
        listbox["listboxScript"]
        toolbar["toolbarScript"]
        grid["gridScript"]
        radiogroup["radiogroupScript"]
        accordion["accordionScript"]
    end

    subgraph "APG Scripts (scripts/apg/)"
        apgAcc["apgAccordionScript"]
        apgBtn["apgButtonScript"]
        apgCar["apgCarouselScript"]
        apgChk["apgCheckboxScript"]
        apgDis["apgDisclosureScript"]
        apgFeed["apgFeedScript"]
        apgGrid["apgGridScript"]
        apgLBM["apgListboxMultiScript"]
        apgLBS["apgListboxSingleScript"]
        apgMenu["apgMenuScript"]
        apgMB["apgMenuButtonScript"]
        apgMeter["apgMeterScript"]
        apgRadio["apgRadiogroupScript"]
        apgSlider["apgSliderScript"]
        apgSliderM["apgSliderMultiThumbScript"]
        apgSpin["apgSpinbuttonScript"]
        apgSwitch["apgSwitchScript"]
        apgTabs["apgTabsAutoScript"]
        apgTB["apgToolbarScript"]
        apgTooltip["apgTooltipScript"]
        apgTree["apgTreeScript"]
        apgTG["apgTreegridScript"]
        apgWS["apgWindowSplitterScript"]
    end

    subgraph "Runners"
        runS["runScenarios()"]
        TBR["TestBotRegistry"]
    end

    TS2["TestScenario<br/>zone + role + config + scripts"]
    TS2 --> runS
    TS2 --> TBR
    runS -->|"vitest<br/>describe/it"| listbox
    TBR -->|"Browser<br/>Inspector"| apgAcc
```

---

## 6. 이상 패턴 시각화

```mermaid
graph LR
    subgraph "🔴 동의어 충돌"
        setupZone2["setupZone()"] -.->|"같은 역할"| goto2["goto()"]
        format2["formatDiagnostics()"] -.->|"순수 vs side-effect"| dump2["dumpDiagnostics()"]
    end

    subgraph "🟣 의미 과적"
        Page2["Page"] -->|"의미 1"| PageIF["Playwright interface<br/>(types.ts)"]
        Page2 -->|"의미 2"| PageImpl["Headless 구현체<br/>(page.ts)"]
        expect2["expect"] -->|"의미 1"| vitestExp["vitest expect"]
        expect2 -->|"의미 2"| ourExp["testing expect<br/>(Playwright shim)"]
    end

    subgraph "🟡 고아 Key"
        dump3["dump — 1회"]
        shim3["Shim — 1회"]
        reset3["reset — 1회"]
        bot3["Bot — 1회"]
    end
```

---

## 4. Cynefin 도메인 판정

🟢 **Clear** — Key Pool 데이터가 이미 수집되어 있고, Mermaid 문법으로 시각화하는 작업은 자명한 변환.

---

## 5. 인식 한계

- Mermaid 렌더러에 따라 `<code>`, `<br/>` 태그가 다르게 해석될 수 있다. GitHub/VS Code에서는 정상 렌더링 확인.
- `scripts/apg/` 23개 스크립트의 개별 내부 호출 관계는 생략. 모두 동일한 `TestScript` 인터페이스를 따른다.

---

## 6. 열린 질문

(없음 — Clear 도메인)

---

> **3줄 요약**
> Headless Test 시스템의 모든 식별자를 6개 Mermaid 다이어그램으로 시각화: 3-Tier 실행 모델, Type 계층, 동사×대상 함수 맵, Page API 대칭도, TestScript 생태계, 이상 패턴.
> 핵심 구조: TestScript → Page(interface) → 3개 구현(Headless/Browser/Playwright). Locator가 assertion과 요소 접근을 합친 Playwright 호환 API.
> 이상 패턴 3건(setupZone↔goto, format↔dump, Page 의미 과적)이 다이어그램에서 시각적으로 확인됨.
