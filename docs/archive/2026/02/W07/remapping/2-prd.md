# 리매핑 설계 — PRD

## 배경

`getCanonicalKey`가 Mac에서 `Meta+Arrow → Home/End`로 변환하면서, `OS_MOVE_UP/DOWN` 키바인딩(`Meta+ArrowUp/Down`)에 도달 불가. 단순 버그가 아니라 **키보드 해석 계층의 책임 경계 문제**.

현재 `KeyboardListener`가 2-pass fallback을 인라인으로 처리하고 있지만, 이는 리스너에 플랫폼 지식이 결합되어 있고 확장 불가.

## 목표

1. **리스너 ↔ 커널 책임 분리**: 리매핑 로직을 커널 미들웨어로 이동
2. **범용 fallback 패턴**: keyboard / mouse / clipboard에 동일 패턴 적용
3. **아키텍처 변경 최소화**: 기존 Middleware 인터페이스에 `fallback` 훅만 추가

## 범위

### In Scope

| 항목 | 설명 |
|------|------|
| 커널 API | `resolveFallback(event: Event)` 추가 |
| Middleware 인터페이스 | `fallback?: (event: Event) => BaseCommand \| null` 훅 추가 |
| KeyboardListener | miss 시 `kernel.resolveFallback(event)` 호출 |
| getCanonicalKey | Mac normalization 제거 (→ 미들웨어로 이동) |
| Mac fallback 미들웨어 | `mac-normalize` 미들웨어 신규 작성 |

### Out of Scope

| 항목 | 이유 |
|------|------|
| osDefaults 변경 | 기존 바인딩 유지 |
| FocusListener / ClipboardListener 변경 | 현재 fallback 필요 케이스 없음 (미래 확장 가능) |
| 키바인딩 시스템 재설계 | 이전 Discussion에서 기각됨 |

## 사용자 시나리오

1. **Mac 사용자가 `Cmd+↑` 누름** → `KeyboardListener`가 `Meta+ArrowUp`으로 resolve → `OS_MOVE_UP` 바인딩 hit → dispatch
2. **Mac 사용자가 `Cmd+↑`을 누르지만 OS_MOVE_UP이 없는 맥락** → 1차 miss → `kernel.resolveFallback(event)` → mac-normalize 미들웨어가 `Home`으로 변환 → `NAVIGATE(home)` dispatch
3. **Windows 사용자** → `Home` 키로 직접 바인딩 → fallback 미들웨어 무동작

## 기술 제약

- `createKernel.ts`는 `@frozen` — 설계 리뷰 후 수정 (이 프로젝트가 리뷰)
- `resolveFallback`는 트랜잭션을 남기지 않음 (노이즈 방지)
- 미들웨어의 `fallback` 훅은 네이티브 Event를 받고, `instanceof`로 필터링
