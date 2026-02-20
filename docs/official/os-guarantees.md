# OS Guarantees — 데이터 조작 후 상태 보장 명세

> W3C APG가 "키보드 탐색 행동"을 정의하듯, 이 문서는 "데이터 조작 후 OS가 보장하는 상태"를 정의한다.
> APG에 해당하는 국제 표준은 없다. macOS HIG / Windows UIA / GNOME GTK의 공통분모를 추출하여 우리 OS의 공식 계약으로 정한다.

---

## §1 Delete + Focus Recovery

> 참조: `recovery: "next" | "prev" | "nearest"` config, `recoveryTargetId`

| # | 조건 | 보장 |
|:-:|------|------|
| 1.1 | 단일 아이템 삭제 (중간 위치) | 포커스 → 다음 아이템 |
| 1.2 | 마지막 아이템 삭제 | 포커스 → 이전 아이템 |
| 1.3 | 유일한 아이템 삭제 | RECOVER no-op (stale pointer). 재진입 시 정리됨 |
| 1.4 | 멀티선택 삭제 | 포커스 → recoveryTargetId (삭제 범위 바로 다음) |
| 1.5 | 삭제 후 selection | selection = [] (항상 비워짐) |

## §2 Clipboard

| # | 조건 | 보장 |
|:-:|------|------|
| 2.1 | Copy | 포커스/선택 변화 없음 |
| 2.2 | Cut (단일) | §1.1과 동일 포커스 이동 + selection 클리어 |
| 2.3 | Cut (멀티) | §1.4와 동일 포커스 이동 + selection 클리어 |
| 2.4 | Paste | 포커스 → 마지막 붙여넣은 항목 (또는 앱이 결정) |

## §3 Multi-Select + 작업

| # | 조건 | 보장 |
|:-:|------|------|
| 3.1 | 선택 5개 중 3개 삭제 | 남은 2개는 선택 해제됨 (§1.5) |
| 3.2 | 빈 selection에서 Delete | 포커스 아이템만 삭제 (§1.1/1.2) |
| 3.3 | 전체 선택 + Delete | 빈 리스트 (§1.3) |
