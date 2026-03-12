# Spec — url-routing

> DocsViewer의 activePath ↔ location.hash 양방향 동기화

## 1. 기능 요구사항

### 1.1 State→URL 동기화 (T1)

**Story**: 개발자로서, 문서를 선택하면 URL이 바뀌어야 한다. 그래야 URL을 공유/북마크할 수 있다.

**Scenarios:**

```
Scenario: 파일 선택 시 hash 업데이트
  Given DocsViewer가 로드된 상태에서
  When selectDoc({id: "docs/STATUS.md"})를 실행하면
  Then location.hash가 "#/docs/STATUS.md"가 된다

Scenario: 폴더 선택 시 hash 업데이트
  Given DocsViewer가 로드된 상태에서
  When selectDoc({id: "folder:docs/1-project"})를 실행하면
  Then location.hash가 "#/folder:docs/1-project"가 된다

Scenario: resetDoc 시 hash 초기화
  Given activePath가 "docs/STATUS.md"인 상태에서
  When resetDoc()을 실행하면
  Then location.hash가 ""가 된다
```

### 1.2 URL→State 동기화 (T2)

**Story**: 개발자로서, URL을 직접 입력하거나 브라우저 뒤로가기를 하면 문서가 바뀌어야 한다.

**Scenarios:**

```
Scenario: hashchange로 문서 전환
  Given activePath가 "docs/A.md"인 상태에서
  When location.hash가 "#/docs/B.md"로 변경되면
  Then activePath가 "docs/B.md"가 된다

Scenario: 무한루프 방지
  Given selectDoc이 hash를 업데이트했을 때
  When 그 hash 변경이 hashchange 이벤트를 발생시키면
  Then selectDoc이 중복 호출되지 않는다 (현재 activePath와 동일하면 무시)

Scenario: 잘못된 hash 무시
  Given location.hash가 "#ext:something"으로 변경되면
  When parseHashToPath가 null을 반환하면
  Then activePath가 변경되지 않는다
```

### 1.3 History 연결 (T3)

**Story**: 개발자로서, Alt+←/→로 문서 히스토리를 탐색하고 싶다.

**Scenarios:**

```
Scenario: goBack으로 이전 문서
  Given A.md → B.md 순서로 탐색한 상태에서
  When goBack을 실행하면
  Then history.back()이 호출되어 hashchange → A.md 복원

Scenario: goForward로 다음 문서
  Given A.md → B.md → goBack으로 A.md인 상태에서
  When goForward를 실행하면
  Then history.forward()가 호출되어 hashchange → B.md 복원
```

## 2. 범위 밖 (Out of Scope)

- TanStack Router 통합 (hash로 충분)
- 서버사이드 라우팅
- 쿼리 파라미터 지원

## 변경 이력

- 2026-03-12: 초기 작성
