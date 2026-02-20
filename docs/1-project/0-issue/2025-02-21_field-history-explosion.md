# 2025-02-21 — Field 타이핑 시 history 폭발 + FOCUS_GROUP_INIT 반복

## 상태: [Open]

## 환경
- 빌더 캔버스의 service-card-5 `service-details` 필드에 텍스트 입력

## 증상
1. **매 키스트로크마다 history.past[0..49] 전체가 shift됨**
   - 50개 엔트리가 매 키 입력 시 O(n) cascade
   - 각 엔트리에 전체 필드 값이 복사됨 (메모리 낭비)
2. **매 키스트로크마다 FOCUS_GROUP_INIT × 2 재발**
   - `ncp-pricing-plans-tablist`, `tab-container-1-tabs-tablist`
   - 필드 입력과 무관한 tablist의 init이 반복 호출
3. **UI 속도 저하** — 사용자 보고

## 재현 단계
1. 빌더 페이지 열기
2. 서비스 카드의 세부내용 필드에 텍스트 빠르게 입력
3. Inspector에서 history.past diff 관찰

## 기대 결과
- 연속 타이핑은 debounce/batch되어 단일 undo 엔트리로 합쳐져야 함
- FOCUS_GROUP_INIT은 필드 입력 시 재발하지 않아야 함

## 실제 결과
- 글자 하나마다 history 엔트리 1개 생성 → 50개 엔트리 매번 shift
- FOCUS_GROUP_INIT이 리렌더마다 반복 호출

## Triage: P1
- 특정 기능(필드 편집) 사용 시 전체 앱 속도 저하
