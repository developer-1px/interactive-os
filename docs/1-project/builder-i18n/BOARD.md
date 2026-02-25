# builder-i18n

## Context

Claim: Visual CMS에 필드 단위 다국어(i18n) 기능이 필요하다. 페이지 복제 없이 한 필드에서 여러 언어를 관리한다.

Before → After:
- Before: 텍스트 필드가 단일 `string`. 다국어 지원 없음.
- After: 텍스트 필드가 `Record<locale, string>`. 언어 전환으로 같은 필드에서 다국어 편집·저장.

Risks:
- 기존 데이터 구조와의 마이그레이션 비용

Stories: US-001, US-002, US-003

## Now

## Done
- [x] T1: 언어 전환 (US-001) — tsc 0 | +3 tests (DT #1,#2,#4) | regression 없음 ✅

## Unresolved
- 언어 전환 시 미저장 편집 콘텐츠 처리 정책

## Ideas
- RTL 언어 지원
- 번역 API 연동
- 번역 진행률 대시보드
