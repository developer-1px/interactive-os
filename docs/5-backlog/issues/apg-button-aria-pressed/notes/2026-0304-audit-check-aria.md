# /audit Report — APG Button aria-pressed Fix

> 감사 대상: `CheckConfig.aria` 추가 + `computeFieldAttrs` map lookup + ButtonPattern consumer
> 감사일: 2026-03-04

## §1-A 앱→OS 위반

```bash
grep -rnE "useState|useEffect|onClick|..." src/pages/apg-showcase/patterns/ButtonPattern.tsx
```

| # | 파일:줄 | 패턴 | 판정 |
|---|---------|------|------|
| — | (0건) | — | — |

`onClick: true`는 OS config 파라미터 (`ActivateConfig.onClick`), raw HTML handler 아님.

## §1-B OS↔OS 계약

| 검사 항목 | 결과 |
|----------|------|
| `computeFieldAttrs` 순수 함수 유지 | ✅ `(input) → output`, 부작용 없음 |
| `CheckConfig.aria` 후방 호환 | ✅ optional 필드, 기본값 `"checked"` |
| 버블링 체인 선례 일치 | ✅ `ItemOverrides.role`과 동일 패턴 |
| `CHECK_ATTR_MAP` lookup (if 분기 배제) | ✅ map 상수, role 조건 분기 없음 |

## §1-D 표준 명세 준수 (W3C APG Button)

| APG 요구사항 | 구현 | 검증 |
|-------------|------|------|
| Toggle button은 `aria-pressed` 사용 | `check: { aria: "pressed" }` → `aria-pressed` 투영 | 테스트 18/18 PASS |
| Toggle button은 `aria-checked` 미사용 | `aria-checked` → `undefined` | 테스트 L214-221 PASS |
| Enter/Space → 활성화 | OS_ACTIVATE 경로 | 테스트 PASS |
| Action button: `role="button"` | OS childRoleMap `toolbar → button` | 테스트 PASS |

## 0건 규칙 추가 검증

| # | 검사 | 결과 |
|---|------|------|
| 1 | OS 프리미티브 전수 나열 | `CheckConfig`, `ItemOverrides`, `ItemAttrs`, `computeFieldAttrs`, `CHECK_ATTR_MAP` |
| 2 | 콜백 시그니처 선언형 | 신규 콜백 없음. 기존 `onAction` = `BaseCommand` 리턴 ✅ |
| 3 | bind() 메소드 존재 확인 | `CheckConfig.aria` 타입 존재 ✅ |
| 4 | `os.dispatch` 직접 호출 | 0건 ✅ |

## 지표

```
총 위반: 0건
  🔴 LLM 실수: 0건
  🟡 OS 갭: 0건
  ⚪ 정당한 예외: 0건
0건 규칙 추가 검증: 4/4 PASS ✅
```
