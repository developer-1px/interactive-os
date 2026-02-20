# builder-clipboard — 빌더 Cut/Copy/Paste

## WHY

빌더에서 섹션/카드/탭을 자유롭게 cut/copy/paste할 수 있어야 한다.
OS가 보편 clipboard를 제공하고, 앱은 `accept` 선언만 하면 동작하는 세계를 증명한다.

## Goals

1. 사이드바에서 섹션 copy/cut/paste/duplicate 동작
2. 캔버스에서도 동일하게 동작 (같은 데이터)
3. Paste bubbling — 데이터 계층을 올라가며 accept 찾기
4. 정적 아이템은 구조적 연산 불가 (cut/delete ❌)
5. 필드 편집 중에는 네이티브 clipboard (isFieldActive)
6. cross-collection paste — 타입 매칭 (accept 함수)

## Scope

- 사이드바 collectionZone에 clipboard 바인딩 연결
- 캔버스의 계층적 clipboard 지원
- Paste bubbling 메커니즘 (OS 레벨)
- `toText` 함수 구현 (섹션/카드 → 텍스트)
- 동적 컬렉션(카드, 탭)의 clipboard 지원

## 관련 문서

- [Discussion: Clipboard Design](discussions/2026-0220-2127-clipboard-design.md)
