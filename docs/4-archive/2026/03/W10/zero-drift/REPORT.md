# Zero Drift

> **Background**
> - APG headless 테스트 628개 전부 통과, 브라우저(TestBot) 2개 실패
> - headless가 browser를 보장 못하면 매 변경마다 브라우저를 열어야 한다
> - 에이전트는 브라우저를 못 연다 — 품질 증명 수단이 사라진다

> **Constraint**
> - OS에서 닫을 수 있는 gap은 무조건 OS가 닫는다 (Pit of Success)
> - 앱의 useEffect dispatch 초기화 금지 — OS가 선언적으로 받는다
> - DOM 전용은 닫힌 집합 6개: DOMRect, focus, scroll, input.value, caretRangeFromPoint, dialog.showModal

> **Goal**
> - 에이전트가 headless 테스트만으로 품질을 증명한다
> - 브라우저 확인이 필요 없다

---

## Backward Chain

Goal을 달성하려면 headless 통과가 browser 동작을 보장해야 한다 (Zero Drift).

Zero Drift가 성립하려면 3가지가 충족되어야 한다:

```
에이전트가 headless만으로 품질을 증명한다
  ← Zero Drift: headless 통과 = browser 동일 동작
    ← 초기 상태가 headless와 browser에서 동일하다 ............ ❌ Gap A
    ← overlay 열릴 때 focus가 자동으로 이동한다 .............. ❌ Gap B
    ← 같은 입력이 같은 횟수만 실행된다 ...................... ✅ 충족
```

### Gap A: 초기 상태가 다르다

headless와 browser에서 초기 상태가 동일하려면:

```
초기 상태가 동일하다
  ← OS가 초기값을 선언적으로 받는다
    ← ValueConfig에 initial 필드가 있다 ..................... ❌ 없음 (FocusGroupConfig.ts:150)
    ← Zone mount가 initial을 원자 적용한다 .................. ❌ 없음 (Zone.tsx:155)
    ← headless goto()도 동형으로 지원한다 ................... ❌ values 없음 (createOsPage.ts:564)
  ← 기존 useEffect dispatch가 제거되었다 ................... ❌ 5건 잔존
```

잔존 5건:

| File | 초기값 |
|------|--------|
| `SpinbuttonPattern.tsx:183` | hours 9, min 30, dur 60 |
| `SliderPattern.tsx:201` | RGB 128, 200, 64 |
| `MeterPattern.tsx:184` | CPU 42%, Mem 9.6G, Disk 340G |
| `WindowSplitterPattern.tsx:127` | 50% |
| `SliderMultiThumbPattern.tsx:183` | min 100, max 300 |

### Gap B: overlay focus가 안 간다

overlay 열릴 때 focus가 자동 이동하려면:

```
overlay focus가 동작한다
  ← Zone mount 시 autoFocus intent를 소비한다
    ← overlay stack에서 entry("first"|"last")를 읽는다 ...... ❌ 읽는 코드 0건
    ← autoFocus=true일 때 OS_FOCUS를 dispatch한다 ........... ❌ 소비자 없음 (FocusGroupConfig.ts:100)
```

끊김 지점:

```
OS_OVERLAY_OPEN({ entry: "first" })
  → stack.push({ entry })       ✅
  → Popover 렌더                ✅
  → Zone mount                  ✅
  → autoFocus 소비              ❌ ← 여기
  → Item focus                  ✅ (IF focusedItemId 있으면)
```

---

## Work Packages

### Gap A → 초기값 선언화

| 순서 | WP | 내용 | 대상 |
|------|-----|------|------|
| 1 | WP1 | ValueConfig에 `initial?: Record<string, number>` 추가 | `FocusGroupConfig.ts` |
| 2 | WP2 | Zone mount 시 initial → setState 원자 적용 | `Zone.tsx` |
| 3 | WP3 | headless goto()에 `initial.values` 지원 | `createOsPage.ts` |
| 4 | WP4 | useEffect dispatch 5건 마이그레이션 | 위 5개 파일 |

### Gap B → autoFocus 연결

| 순서 | WP | 내용 | 대상 |
|------|-----|------|------|
| 5 | WP5 | overlay stack에서 entry 읽어 아이템 결정 | `Zone.tsx` |
| 6 | WP6 | autoFocus=true → OS_FOCUS dispatch | `Zone.tsx` |

두 Gap은 독립 — 병렬 가능.

---

## 범위 밖

- MeterPattern setInterval: 앱 로직 (앱의 useEffect 허용, OS init dispatch만 금지)
