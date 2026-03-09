# 🔍 삽질 일지: DocsViewer Zero Drift — headless 19 PASS / browser 4 FAIL

> 날짜: 2026-03-09
> 실행 명령: `npx vitest run tests/headless/apps/docs-viewer/docs-scenarios.test.ts`
> 결과: headless 0개 실패 / 19개 통과, browser TestBot 4개 실패 / 19개 전체

## 증상

같은 `testbot-docs.ts`의 `run()` 함수가 headless에서 PASS, browser TestBot에서 FAIL:

| 시나리오 | headless | browser | browser 에러 |
|---------|----------|---------|-------------|
| §1f End키→마지막 | ✅ | ❌ | STATUS focused: false (items 불일치) |
| §1h 마지막↓클램프 | ✅ | ❌ | STATUS focused: false (다른 zone 반응) |
| §3a 즐겨찾기 클릭 | ✅ | ❌ | `[click] undefined — NOT FOUND` |
| §3b 즐겨찾기 이동 | ✅ | ❌ | `undefined[aria-selected] = (absent)` |

## 즉시 수정한 것들

없음. 읽기 전용 분석만 수행.

## 삽질 과정

처음엔 "OS state는 정상인데 DOM에 반영 안 됨 → 5-effect 타이밍 문제"일 거라 생각했다.

그런데 코드를 따라가보니 **items 자체가 달랐다**.

### 핵심 발견: items 해석 경로가 두 갈래

| 경로 | items 출처 | 코드 위치 |
|------|-----------|----------|
| **headless** `runScenarios.ts:44` | `scenario.getItems()` → testbot의 `getSidebarItems()` | `expanded=[]` 고정 |
| **browser** `app.ts:242` | `getZoneItems(script.zone)` → `ZoneRegistry.get(zoneId)?.getItems()` | OS state의 실시간 expanded 참조 |

### §1f, §1h 추적

`getSidebarItems()` (testbot-docs.ts:46-51)는 `flattenVisibleTree(docTree, [], ...)` — 폴더 전부 접힌 초기 상태.

`ZoneRegistry.get("docs-sidebar").getItems()` (app.ts:244-256)는 `os.getState().os.focus.zones["docs-sidebar"]?.items`에서 expanded를 읽어서 동적 계산.

browser에서 이전 테스트(§1a~§1e)가 폴더를 확장시켰을 수 있고, 그 상태가 리셋 안 됨 → items가 76개로 불어남 → 마지막 item이 달라짐 → §1f End키가 다른 item을 마지막으로 봄 → assertion 실패.

§1h의 OS Diagnostic이 결정적 증거: `docs-recent` zone의 STATUS에서 ArrowDown이 반응. 이건 **테스트가 `docs-sidebar`의 STATUS를 click했다고 생각했지만, 실제로는 `docs-recent`의 STATUS가 클릭된 것**. browser에서 items[items.length-1]이 "STATUS"가 아닌 다른 값이었고, 그 ID가 docs-recent zone에도 존재.

### §3a, §3b 추적

`getFavItems()` (testbot-docs.ts:54-56): `getFavoriteFiles(allFiles)` 결과가 비면 fallback `allFiles.slice(0, 2)`.

browser `ZoneRegistry.get("docs-favorites").getItems()` (app.ts:210): `getFavoriteFiles(allFiles).map(f => f.path)` — **fallback 없음**.

headless에서는 localStorage 비어있음 → fallback 작동 → items=[첫 2개 파일] → PASS.
browser에서는 localStorage 비어있음 → items=[] → items[0]=undefined → `[click] undefined — NOT FOUND`.

## 원인 추정 — 5 Whys

### §1f, §1h

1. 왜 browser에서 End키가 다른 item으로 갔나? → items 배열이 headless와 달라서 `items[items.length-1]`이 다른 값
2. 왜 items가 달랐나? → headless는 `scenario.getItems()` (정적), browser는 `ZoneRegistry.getItems()` (동적)
3. 왜 두 경로가 다른 함수를 호출하나? → **runScenarios는 scenario 객체의 getItems를 쓰고, browser TestBot은 ZoneRegistry를 씀**
4. 왜 이 불일치가 설계에 존재하나? → TestBot runner(app.ts:242)가 scenario 메타데이터에 접근할 수 없고 script만 받기 때문. manifest의 `extractScripts()`가 scripts만 추출하고 scenario의 getItems는 버림

→ **근본 원인**: browser TestBot runner가 scenario의 getItems가 아닌 ZoneRegistry.getItems를 사용하는데, 이 둘은 동일하지 않다. **items 해석 경로의 이원화.**
→ **확신도**: 높음

### §3a, §3b

1. 왜 items[0]이 undefined인가? → items가 빈 배열
2. 왜 빈 배열인가? → browser의 `ZoneRegistry.get("docs-favorites").getItems()`가 `getFavoriteFiles(allFiles)`를 호출하는데 localStorage 비어있음
3. 왜 headless에서는 통과했나? → headless는 scenario.getItems → `getFavItems()` → fallback `allFiles.slice(0, 2)` 작동
4. 왜 fallback이 다른가? → **같은 이유: items 해석 경로 이원화. testbot의 getFavItems에는 fallback이 있고, app.ts binding의 getItems에는 없음**

→ **근본 원인**: 동일 — items 해석 경로 이원화. browser와 headless가 **다른 getItems 함수를 호출**.
→ **확신도**: 높음

## 다음 액션 제안

### 방향 A: browser TestBot이 scenario.getItems를 사용하도록 수정

manifest가 scripts뿐 아니라 scenario 메타데이터(zone, getItems)도 전달하도록 변경. browser TestBot runner의 `getZoneItems(script.zone)`을 scenario의 getItems로 교체.

- **장점**: headless와 browser가 정확히 같은 items를 씀
- **단점**: 근본적으로 "테스트용 items"를 쓰는 것이지 "실제 앱의 items"를 쓰는 것이 아님. Zero Drift의 진짜 의미는 실제 앱 동작과 일치해야 하는 것

### 방향 B: headless의 runScenarios도 ZoneRegistry.getItems를 사용하도록 수정

runScenarios에서 `scenario.getItems()` 대신 headless page의 ZoneRegistry에서 items를 가져옴. 이러면 headless도 **앱 binding의 getItems**를 사용.

- **장점**: Zero Drift의 원래 정의에 부합 — headless와 browser 모두 "앱이 선언한 getItems"를 씀
- **단점**: headless의 ZoneRegistry가 올바른 getItems를 가지려면 page.goto() 시점에 앱 binding이 정확히 등록되어야 함

### 방향 C: testbot의 getItems를 app binding의 getItems와 동일하게 수정

`getSidebarItems()`가 `expanded=[]` 대신 OS state를 읽도록 변경. `getFavItems()`의 fallback을 제거하거나 app binding에도 fallback을 추가.

- **장점**: 기존 구조 유지, 최소 변경
- **단점**: 임시방편. 앞으로 testbot getItems와 app getItems가 다시 어긋날 위험

### 제 판단: 방향 B

Zero Drift = "headless가 진실, browser는 투영". 그런데 지금은 **headless가 테스트 전용 getItems를 쓰고, browser가 앱 실제 getItems를 씀** — 진실이 테스트 전용이면 안 된다. 양쪽 모두 앱의 실제 getItems를 사용해야 Zero Drift가 성립한다.
