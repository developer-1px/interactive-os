# DocsViewer Breadcrumb 중복 제거

## 현상
- 상단 navbar에 interactive breadcrumb (DocsNavbarUI.Item, 클릭 가능)
- 하단 article metadata에 display-only path (plain span)
- 같은 정보를 두 곳에 표시

## 제안
navbar breadcrumb이 있으니 article 내 path 표시는 제거하거나,
article metadata를 날짜+태그 등 다른 정보로 대체

## 분류
디자인 결정 — OS 구조 문제 아님
