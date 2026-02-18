# registry-monitor-v5

> v5 커널의 scopedCommands를 직접 읽는 Registry Monitor. 레거시 GroupRegistry를 제거한다.

## WHY

현재 Registry Monitor는 레거시 `GroupRegistry`(정적 Map)에서 데이터를 읽는다.
v5 커널은 `scopedCommands`를 클로저 안에서 관리하므로 GroupRegistry와 데이터가 불일치한다.
커널이 유일한 진실의 원천이 되어야 한다.

## Goals

1. 커널에 `getRegistry()` Inspector API 추가
2. RegistryMonitor가 커널 직접 연결
3. 레거시 GroupRegistry 제거

## Scope

- In: kernel getRegistry API, RegistryMonitor 재작성, GroupRegistry 삭제
- Out: 커맨드 편집 UI, 키바인딩 재할당
