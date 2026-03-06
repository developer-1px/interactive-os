# purge-os-core-imports

## Context

Claim: 앱 테스트의 @os-core 직접 import는 page API(테스트 SDK) gap의 증거다. 제거하면서 OS gap을 발견한다.

Before: 27 앱 테스트 파일이 @os-core를 직접 import (dispatch, Registry, os singleton, 내부 함수)
After: @os-core import 0건. 제거 불가 = OS gap 리포트로 문서화

Principles:
- page = Playwright subset (절대 경계)
- goto = route, zone 활성화 = click 부수효과
- OS 내부 개념(zone, command, registry)이 page 표면에 노출 금지

Risks: OS gap이 많으면 page API 대규모 확장 필요. 단, 이번 프로젝트는 gap 발견까지만.

## Now

(완료)

## Done

- [x] T1: 범주 분류 — 27파일을 A(OS테스트 9), B(repro 2), C(앱테스트 16)로 분류
- [x] T2: 범주 B 정리 — tab-repro, bulk-undo-repro에서 os.inspector 제거 — 3 tests PASS
- [x] T3: 범주 A 판정 — 9파일 OS 테스트 확정 (코드 이동은 Later)
- [x] T4: 범주 C — 7파일 @os-core import 제거 완료 (160 tests PASS) + 9파일 gap 기록
- [x] T5: Gap 리포트 작성 — 5개 gap (STACK/FIELD/ZONE-SETUP/OVERLAY-STATE/TRIGGER) + 2개 gap-아님 발견 (SELECT/ENFORCE)

## Unresolved

- OS 테스트 전용 객체의 설계 (별도 프로젝트)
- page.goto(route) 재설계 (별도 프로젝트)
- GAP-1: STACK (overlay open/close input 경로) — 4파일
- GAP-2: FIELD (field 값 관찰/조작 API) — 3파일
- GAP-3: ZONE-SETUP (headless zone 자동 등록) — 5파일
- GAP-4: OVERLAY-STATE (overlay 상태 관찰) — 3파일
- GAP-5: TRIGGER (standalone trigger callback 자동 등록) — 1파일

## Ideas

- gap 해소 후 eslint rule로 @os-core import 자동 차단
- 범주 A 파일을 packages/os-core/__tests__/ 로 이동
