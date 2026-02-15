# OS Folder Structure Refactor: As-Is vs To-Be Report

> **작성일:** 2026-02-10  
> **작성자:** Antigravity  
> **태그:** refactoring, architecture, os-new, documentation

---

## 1. 개요 (Overview)

`src/os-new/` 디렉토리에 존재하던 **Legacy Pipeline**과 **Kernel Pipeline** 간의 번호 충돌(`1-sensor` vs `1-listeners` 등)을 해소하고, 단일 파이프라인 아키텍처로 통합하는 리팩토링을 완료했습니다.

이 문서는 변경 전(As-Is)의 혼동스러운 구조와 변경 후(To-Be)의 명확한 단일 파이프라인 구조를 비교하여 설명합니다.

---

## 2. 변경 전 (As-Is): 이중 파이프라인 혼재

두 가지 아키텍처 스타일이 동일한 상위 디렉토리에 공존하며, 번호(`1-`, `2-`, `3-`, `4-`)가 서로 다른 의미로 사용되어 혼란을 유발했습니다.

### 문제점
- **번호 충돌:** `1-sensor`(Legacy)와 `1-listeners`(Kernel)가 동시에 존재.
- **역할 중복:** `2-command`(순수 로직)와 `3-commands`(Kernel 핸들러)가 분리되어 로직 파편화.
- **명명 혼동:** `4-effect`(미들웨어)와 `4-effects`(Kernel 이펙트)가 이름이 거의 동일하나 역할은 상이함.

### As-Is 구조도

```mermaid
graph TD
    subgraph "Legacy Pipeline (Zustand 기반)"
    L1[1-sensor<br/>(Keyboard/Focus/Clipboard)]
    L2[2-command<br/>(Pure Logic & Resolvers)]
    L3[3-store<br/>(Zustand Stores)]
    L4[4-effect<br/>(Middleware & Types)]
    end

    subgraph "Kernel Pipeline (새 아키텍처)"
    K1[1-listeners<br/>(DOM Event Listeners)]
    K2[2-contexts<br/>(Dependency Injection)]
    K3[3-commands<br/>(Kernel Command Handlers)]
    K4[4-effects<br/>(Kernel Side Effects)]
    K5[5-hooks]
    K6[6-components]
    end

    %% Conflict links
    L1 -.- K1
    L2 -.- K2
    L3 -.- K3
    L4 -.- K4
```

---

## 3. 변경 후 (To-Be): 단일 Kernel 파이프라인

Legacy 요소들을 적절한 위치로 흡수하거나 명확한 이름으로 변경하여, **숫자가 붙은 폴더는 오직 Kernel Pipeline (`1`→`6`)만 존재**하도록 정리했습니다.

### 개선 사항
1. **`1-sensor` 제거:** 내용물을 `1-listeners/` (DOM 연동)와 `lib/` (유틸리티)로 통합.
2. **`2-command` 제거:** 순수 로직(`resolve*.ts`)을 `3-commands/` 내부의 하위 디렉토리로 이동하여 커맨드 핸들러와 응집도 향상.
3. **번호 제거:** Legacy `3-store` → `store/`, `4-effect` → `middleware/`로 이름 변경하여 파이프라인 단계가 아님을 명시.

### To-Be 구조도

```mermaid
graph TD
    subgraph "Kernel Pipeline (Standard)"
    K1[1-listeners<br/>(+ Sensor integrated)]
    K2[2-contexts<br/>(DI)]
    K3[3-commands<br/>(+ Logic integrated)]
    K4[4-effects<br/>(Side Effects)]
    K5[5-hooks<br/>(useComputed)]
    K6[6-components<br/>(React Primitives)]
    end

    subgraph "Supporting Modules (No Numbers)"
    S1[store/<br/>(Legacy Zustand Stores)]
    S2[middleware/<br/>(Legacy Middleware)]
    S3[primitives/<br/>(Legacy UI Components)]
    S4[core/<br/>(Shared Kernel Logic)]
    end

    K1 --> K3
    K3 --> K4
    K5 --> K6
```

### 디렉토리 매핑 표

| As-Is (Before) | To-Be (After) | 비고 |
|---|---|---|
| `1-sensor/` | `1-listeners/` + `lib/` | Sensor와 Listener 통합 |
| `2-command/` | `3-commands/{navigate,expand}/` | 로직을 핸들러 내부로 흡수 |
| `3-store/` | `store/` | 번호 제거 (파이프라인 아님) |
| `4-effect/` | `middleware/` | 이름 변경 (실제 역할 반영) |
| `1-listeners/` | `1-listeners/` | 유지 |
| `2-contexts/` | `2-contexts/` | 유지 |
| `3-commands/` | `3-commands/` | 유지 |
| `4-effects/` | `4-effects/` | 유지 |

---

## 4. 결론 (Conclusion)

이제 `src/os-new/` 내의 숫자 접두사(`1-` ~ `6-`)는 **오직 Kernel 아키텍처의 데이터 흐름 순서**만을 나타냅니다.

- **입력:** `1-listeners`
- **주입:** `2-contexts`
- **처리:** `3-commands`
- **결과:** `4-effects`
- **구독:** `5-hooks`
- **렌더:** `6-components`

이 명확한 구조는 향후 OS 마이그레이션 작업을 더욱 가속화할 수 있는 기반이 됩니다.
