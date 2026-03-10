# /doubt 결과 — contracts.ts (2라운드 수렴)

> 대상: `tests/apg/helpers/contracts.ts` 현재 코드 282줄
> 날짜: 2026-03-10

## 라운드 요약

| Round | 🔴 제거 | 🟡 축소 | ↩️ 자기교정 | 수렴? |
|:-----:|:------:|:------:|:---------:|:----:|
| 1     | 2      | 4      | 0         | —    |
| 2     | 0      | 0      | 0         | ✅   |

## 🔴 제거 (2건)

### 1. os / read* / compute* / readSelection / readActiveZoneId — 5개 import 전부 제거
os import 0줄 원칙 위반. locator로 대체.

### 2. `os.dispatch(OS_STACK_POP())` — assertFocusRestore 내부
Playwright에서 사용자는 Escape만 누른다. OS가 stack pop을 하는 건 내부 구현.
테스트에서 수동 dispatch = OS 구현에 커플링.
Escape 후 포커스 복원이 안 되면 OS 버그지, 테스트가 수동으로 해야 할 일이 아니다.

## 🟡 재설계 (4건)

### 1. Factory 타입에 items 추가 필요
현재: `(...args) => { page, cleanup }`
문제: locator 전환 시 "다음 아이템 ID"를 알 수 없다.
해결: `(...args) => { page, cleanup, items: string[] }`
→ items[0], items[1] 로 ID를 명시적으로 참조.

### 2. assertVerticalNav 등 6개 — locator 기반 재작성
```typescript
// Before (os 의존)
const first = readFocusedItemId(os)!;
page.keyboard.press("ArrowDown");
expect(computeAttrs(os, next).tabIndex).toBe(0);

// After (locator 동형)
page.keyboard.press("ArrowDown");
expect(page.locator("#" + items[1])).toBeFocused();
expect(page.locator("#" + items[1])).toHaveAttribute("tabindex", "0");
expect(page.locator("#" + items[0])).toHaveAttribute("tabindex", "-1");
```

### 3. assertNoSelection — items 순회로
```typescript
// Before
expect(readSelection(os, zoneId)).toEqual([]);

// After
for (const id of items) {
  expect(page.locator("#" + id)).toHaveAttribute("aria-selected", "false");
}
```

### 4. assertEscapeClose — 방식 미확정 ⚠️
`readActiveZoneId(os)` = Playwright에 직접 대응 없음.
- 가능한 방법: 이전 포커스 아이템이 tabindex="-1"이 되는 것으로 간접 확인?
- 또는 dialog 경우 overlay DOM 자체가 사라짐 → locator.not.toBeVisible()?
- **headless에서는 DOM이 없으므로 구조적 한계. 사용자 결정 필요.**

## 🟢 유지 (2건)
- **Factory 타입 (이름)**: 11곳 반복 방지. 인라인보다 타입 1줄이 낫다.
- **contracts.ts 파일 존재**: 9개 파일 공유. 유효.

## 📊 Before → After (누적)
- os-core imports: 5 → 0
- os.dispatch 호출: 1 → 0
- Factory 반환 필드: 2 (`page`, `cleanup`) → 3 (`page`, `cleanup`, `items`)
- 미확정: assertEscapeClose 패턴
