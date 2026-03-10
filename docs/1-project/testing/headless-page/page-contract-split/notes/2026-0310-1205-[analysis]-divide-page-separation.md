# /divide Report — Page 분리 (Playwright 동형성 복원)

## Problem Frame

| | 내용 |
|---|------|
| **Objective** | `AppPage`/`AppPageInternal`을 제거하고, Page(Playwright 성역) + TestInstance(app/os)로 분리 |
| **Constraints** | C1. Page에 OS 메서드 부착 금지 / C2. 293 suite 774 tests 회귀 0 / C3. Script는 Page만 import |
| **Variables** | V1. AppPage의 어떤 메서드가 Page에 남고 어떤 것이 분리되는가 / V2. 마이그레이션 범위 |

## AppPage 메서드 분류

### 현재 AppPage 인터페이스 (defineApp/types.ts L280-351)

| 메서드 | Playwright 대응물 | 분류 | 이동 대상 |
|--------|-------------------|------|----------|
| `goto(url)` | `page.goto()` ✅ | Playwright | **Page 잔류** |
| `keyboard.press(key)` | `page.keyboard.press()` ✅ | Playwright | **Page 잔류** |
| `keyboard.type(text)` | `page.keyboard.type()` ✅ | Playwright | **Page 잔류** |
| `click(itemId, opts)` | `page.click()` ✅ | Playwright | **Page 잔류** |
| `locator(id)` | `page.locator()` ✅ | Playwright | **Page 잔류** |
| `locator.getAttribute()` | `locator.getAttribute()` ✅ | Playwright | **Page 잔류** |
| `locator.click()` | `locator.click()` ✅ | Playwright | **Page 잔류** |
| `locator.inputValue()` | `locator.inputValue()` ✅ | Playwright | **Page 잔류** |
| `locator.toBeFocused()` | `expect(locator).toBeFocused()` ✅ | Playwright | **Page 잔류** |
| `locator.toHaveAttribute()` | `expect(locator).toHaveAttribute()` ✅ | Playwright | **Page 잔류** |
| `locator.toBeChecked()` | `expect(locator).toBeChecked()` ✅ | Playwright | **Page 잔류** |
| `locator.toBeDisabled()` | `expect(locator).toBeDisabled()` ✅ | Playwright | **Page 잔류** |
| `locator.not` | `expect(locator).not` ✅ | Playwright | **Page 잔류** |
| — | — | — | — |
| `attrs(itemId)` | ❌ 없음 | **OS 전용** | TestInstance or 별도 |
| `focusedItemId(zoneId?)` | ❌ 없음 | **OS 전용** | TestInstance or 별도 |
| `selection(zoneId?)` | ❌ 없음 | **OS 전용** | TestInstance or 별도 |
| `activeZoneId()` | ❌ 없음 | **OS 전용** | TestInstance or 별도 |
| `kernel` | ❌ 없음 | **OS 전용** | TestInstance or 별도 |
| `reset()` | ❌ 없음 | **테스트 유틸** | TestInstance |
| `cleanup()` | ❌ 없음 | **테스트 유틸** | Adapter lifecycle |
| `dumpDiagnostics()` | ❌ 없음 | **테스트 유틸** | TestInstance or 별도 |
| `query(search)` | ❌ 없음 (page.content() 유사) | **OS 전용** | TestInstance or 별도 |
| `html()` | ❌ 없음 (page.content() 유사) | **OS 전용** | TestInstance or 별도 |

### AppPageInternal 추가 메서드 (L362-385)

| 메서드 | 분류 | 이동 대상 |
|--------|------|----------|
| `dispatch(cmd)` | **OS 전용** | TestInstance (이미 존재) |
| `state` | **OS 전용** | TestInstance (이미 존재) |
| `setupZone(...)` | **레거시** | 제거 (defineApp goto로 대체) |
| `getDOMElement(id)` | **디버깅** | 제거 또는 Adapter 내부 |

## Backward Chain

| Depth | Subgoal | 판정 | Evidence |
|-------|---------|------|----------|
| 0 | Page 분리 완료 | ❌ | — |
| 1 | A. Playwright subset Page 인터페이스 분리 | ✅ | `testing/types.ts`에 `Page`, `Locator`, `LocatorAssertions` 이미 존재 |
| 1 | B. OS 전용 메서드를 별도 표면으로 이동 | ❌ | — |
| 2 | B1. `attrs()` — Playwright `getAttribute`로 대체 가능한가? | ❌ | `attrs()`는 전체 attr 객체 반환. `locator.getAttribute(name)`은 개별 속성만. **400회+** 사용 중. 단순 대체 불가 |
| 2 | B2. `focusedItemId()` — Playwright로 대체 가능한가? | 🟡 | `page.locator("[data-focused]").getAttribute("id")`로 가능하나, zoneId 파라미터 처리 필요. **200회+** 사용 |
| 2 | B3. `selection()` — Playwright로 대체 가능한가? | 🟡 | `page.locator("[aria-selected=true]")`로 가능 |
| 2 | B4. `activeZoneId()` — Playwright로 대체 가능한가? | ❌ | OS 내부 상태. DOM에 표현 안 됨 |
| 1 | C. `AppPageInternal` 제거 | ✅ | `as AppPageInternal` 사용 = **1곳** (`window-splitter.apg.test.ts:51`) |
| 1 | D. 테스트 파일 마이그레이션 | ❌ | — |
| 2 | D1. `page.attrs()` 사용 테스트 | ❌ | **400회+ 호출**, 전 파일에 분산 |
| 2 | D2. `page.focusedItemId()` 사용 테스트 | ❌ | **200회+ 호출**, 전 파일에 분산 |
| 2 | D3. `page.selection()` 사용 테스트 | ✅ | 9회 호출, 2파일 |
| 2 | D4. `page.locator()` (순수 Playwright) 사용 테스트 | ✅ | 이미 깨끗함 |

## Work Packages

| WP | Subgoal | Chain | 크기 | 내용 |
|----|---------|-------|------|------|
| 1 | B | Goal ← B | 1턴 | OS 전용 메서드(`attrs`, `focusedItemId`, `selection`, `activeZoneId`, `reset`, `cleanup`, `dumpDiagnostics`)를 Page에서 분리하여 **별도 객체(os)** 에 배치하는 타입/인터페이스 설계 |
| 2 | B1 | Goal ← B ← B1 | 1턴 | `page.attrs(id)` 400회+ 호출을 `os.attrs(id)` 또는 `page.locator(id).getAttribute()` 패턴으로 마이그레이션 방향 결정 + 자동화 스크립트 설계 |
| 3 | D1+D2 | Goal ← D ← D1,D2 | **다턴** | 모든 테스트 파일에서 `page.attrs()`, `page.focusedItemId()` 호출을 새 API로 마이그레이션 (600회+ 변경) |
| 4 | C | Goal ← C | 1턴 | `AppPageInternal` 타입 제거 + `window-splitter.apg.test.ts` 수정 |

## ❓ Gap

- **G1**: `attrs()`를 `os.attrs()`로 옮기는 게 맞는가, 아니면 `page.locator(id).getAttribute()`로 분산시키는 게 맞는가?
  - `os.attrs()`로 옮기면: 600회 `page.` → `os.` 치환 (기계적, 단순)
  - `locator.getAttribute()`로 분산하면: 400회 호출 각각에서 필요한 속성만 쿼리 (Playwright 동형이지만 공수 큼)
  - **제 판단: 1단계에서 `os.attrs()`로 이동 (기계적 치환). 2단계에서 Script만 `locator.getAttribute()`로 전환** — Script만 Playwright 동형이면 되니까.

## Residual Uncertainty

G1 해소 시 모든 WP가 Clear.
