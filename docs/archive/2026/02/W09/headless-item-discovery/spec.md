# Spec: headless-item-discovery

## T1: DOM_ITEMS — getItems() primary, DOM fallback 제거

### Zone 체크: ❌ Zone 없음 (아키텍처 리팩토링)

**Story**: OS 개발자로서, DOM_ITEMS context가 getItems()만 사용하고 DOM querySelectorAll을 사용하지 않길 원한다. 그래야 headless에서 아이템 네비게이션이 동작한다.

**Scenarios (Given/When/Then):**

Scenario T1-1: getItems가 있으면 DOM 없이 아이템 목록 반환
  Given Zone "z1"이 getItems=() => ["a","b","c"]로 등록됨
  And element=null (headless)
  When DOM_ITEMS를 조회한다
  Then ["a","b","c"]가 반환된다

Scenario T1-2: getItems + itemFilter 적용
  Given Zone "z1"이 getItems=() => ["a","b","c"]이고 itemFilter=(items) => items.filter(i => i !== "b")
  When DOM_ITEMS를 조회한다
  Then ["a","c"]가 반환된다

Scenario T1-3: getItems 없으면 빈 배열
  Given Zone "z1"이 getItems 없이 등록됨
  When DOM_ITEMS를 조회한다
  Then []가 반환된다

Scenario T1-4: 기존 브라우저 테스트 regression 없음
  Given 기존 테스트가 모두 PASS
  When DOM_ITEMS에서 DOM fallback을 제거한다
  Then 기존 테스트가 여전히 PASS한다 (getItems가 이미 제공되는 경우)

## T2: DOM_ZONE_ORDER — DOM fallback 삭제

### Zone 체크: ❌ Zone 없음

**Scenarios:**

Scenario T2-1: getItems 있는 Zone들의 순서 유지
  Given Zone "z1"(getItems=["a","b"])과 Zone "z2"(getItems=["x","y"])가 등록됨
  When DOM_ZONE_ORDER를 조회한다
  Then [{zoneId:"z1", firstItemId:"a", lastItemId:"b"}, {zoneId:"z2", firstItemId:"x", lastItemId:"y"}]

Scenario T2-2: document.querySelectorAll safety net 제거
  Given headless 환경 (document 없음)
  When DOM_ZONE_ORDER를 조회한다
  Then document.querySelectorAll이 호출되지 않는다

## T3: getZoneItems — querySelectorAll → getItems()

### Zone 체크: ❌ Zone 없음

**Scenarios:**

Scenario T3-1: getItems()로 아이템 반환
  Given Zone "z1"이 getItems=() => ["a","b","c"]로 등록됨
  When getZoneItems("z1")을 호출한다
  Then ["a","b","c"]가 반환된다

Scenario T3-2: getItems 없으면 빈 배열
  Given Zone "z1"이 getItems 없이 등록됨
  When getZoneItems("z1")을 호출한다
  Then []가 반환된다
