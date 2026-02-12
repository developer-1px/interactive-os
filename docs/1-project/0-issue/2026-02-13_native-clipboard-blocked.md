# 🐛 네이티브 클립보드가 OS 오버라이드에 의해 차단됨

> 등록일: 2026-02-13
> 상태: **closed**
> 심각도: P1

## 원문 (요구사항)

> 클립보드가 앱에서 오버라이드 하지 않을때 기본적으로 클립보드 복사가 되어야 하는데 그게 안되고 있어

## 해석

앱(예: Todo)이 `onCopy`를 등록한 Zone 안에서는 OS가 클립보드를 가로채서 앱 전용 복사를 수행해야 한다.
하지만 앱이 `onCopy`를 등록하지 않은 곳(예: Docs 페이지, 빈 영역)에서는 **브라우저 네이티브 ⌘C가 그대로 동작**해야 한다.

현재는 `KeyboardListener`가 `Meta+C`를 무조건 가로채서 `e.preventDefault()` 호출 → 네이티브 복사가 죽음.

## 첫 감 (초기 접근)

**이중 경로 문제**: 클립보드가 KeyboardListener(keydown)와 ClipboardListener(copy event) 두 곳에서 처리됨.

```
수정 방향:
  ⌘C keydown → KeyboardListener → 키바인딩에서 제거, 통과
  ⌘C → native copy event 발생
  copy event → ClipboardListener → zone에 onCopy 있으면? dispatch + preventDefault
                                 → zone에 onCopy 없으면? return (네이티브 복사 유지)
```

## 해결 요약

- **원인**: `osDefaults.ts`에 `Meta+C/X/V` 키바인딩 등록 → KeyboardListener가 무조건 `e.preventDefault()` → 네이티브 clipboard 이벤트 발생 차단
- **수정**:
  - `osDefaults.ts` — clipboard 키바인딩 제거
  - `ClipboardListener.tsx` — `canZoneHandle()` 가드 추가, zone에 콜백 없으면 네이티브 동작 유지
  - `clipboard.ts` (todo app) — `ClipboardItem` sync throw 방지 try-catch
- **검증**:
  - `tsc --noEmit`: ✅ 0 errors
  - `clipboard-commands.test.ts`: ✅ 5/5 passed
  - 브라우저 Scenario 1 (Todo: ⌘C→⌘V): ✅ 복제 성공
  - 브라우저 Scenario 2 (Docs: 텍스트 선택→⌘C): ✅ `defaultPrevented: false`, 네이티브 복사 정상
