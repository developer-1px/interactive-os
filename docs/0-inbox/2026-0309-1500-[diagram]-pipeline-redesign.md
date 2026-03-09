# 파이프라인 재설계 다이어그램

> 작성일: 2026-03-09
> 출처: /discussion — 과설계 논의 → 파이프라인 재구성

## 1. 현재 파이프라인 (AS-IS)

```mermaid
flowchart TD
    subgraph 논의["🗣️ 논의"]
        discussion["/discussion\nClaim 도달"]
    end

    subgraph 계획["📋 계획 (3개가 겹침)"]
        plan["/plan\n변환 명세표\nBefore→After"]
        divide["/divide\nWork Package\n세션 단위"]
        project["/project\nBOARD.md\nContext + Now"]
        spec["/spec\nBDD + DT\n프로젝트당 1파일"]
    end

    subgraph 실행["⚙️ 실행 (1턴=1샷)"]
        go["/go 라우터"]
        red["/red"]
        green["/green"]
        refactor["/refactor"]
        bind["/bind"]
    end

    subgraph 검증["✅ 검증"]
        verify["/verify\ntsc+lint+test"]
        audit["/audit"]
        doubt["/doubt"]
    end

    subgraph 종료["📦 종료"]
        retrospect["/retrospect"]
        archive["/archive"]
    end

    discussion --> plan
    plan --> divide
    divide --> project
    project --> go

    go --> spec
    go --> red
    go --> green
    go --> refactor
    go --> bind
    go --> verify
    go --> audit
    go --> doubt
    go --> retrospect
    retrospect --> archive

    %% 문제 표시
    plan -.->|"❌ 겹침"| divide
    divide -.->|"❌ 겹침"| project

    style plan fill:#fee,stroke:#c33
    style divide fill:#fee,stroke:#c33
    style spec fill:#fee,stroke:#c33
    style go fill:#fee,stroke:#c33
```

### 문제점
- `/plan`, `/divide` 역할 중복 (둘 다 "뭘 해야 하나")
- `/project`가 전략(Context) + 전술(Now) 혼재
- `/spec`이 프로젝트 단위라 태스크별 분리 불가
- `/go`가 1턴=1샷 — 검증 후 재진입 없음
- `/blueprint` §7도 실행 계획을 만듦 (또 겹침)

---

## 2. 제안 파이프라인 (TO-BE)

```mermaid
flowchart TD
    subgraph 논의["🗣️ 논의"]
        discussion["/discussion\nClaim 도달"]
    end

    subgraph 전략["🎯 전략"]
        project["/project\nBOARD.md Context\nGoal + Risks + Unresolved"]
    end

    subgraph 계획["📋 계획 (통합)"]
        plan["/plan\n= plan + divide\nTask Map + 현황판\n1턴 크기 분해"]
    end

    subgraph 실행["⚙️ 실행 (멀티턴 루프)"]
        go["/go 라우터\n+ 멀티턴 게이트"]

        subgraph 태스크별["📦 태스크 1턴 사이클"]
            spec["/spec\n태스크별 BDD+DT"]
            red["/red"]
            green["/green"]
            refactor["/refactor"]
        end

        gate{"정량 검증\n통과?"}
    end

    subgraph 검증["✅ 검증"]
        audit["/audit"]
        doubt["/doubt"]
    end

    subgraph 종료["📦 종료"]
        retrospect["/retrospect"]
        archive["/archive"]
    end

    discussion -->|"분류"| project
    project --> plan
    plan -->|"Task Map"| go

    go --> spec
    spec --> red
    red --> green
    green --> refactor
    refactor --> gate

    gate -->|"❌ 미달"| go
    gate -->|"✅ 통과"| next_task{"다음\n태스크?"}

    next_task -->|"있음"| go
    next_task -->|"없음"| audit

    audit --> doubt
    doubt --> retrospect
    retrospect --> archive

    %% 현황판 갱신
    gate -.->|"현황판 갱신\n⬜→🔄→✅"| plan

    style plan fill:#efe,stroke:#3a3
    style go fill:#efe,stroke:#3a3
    style gate fill:#ffe,stroke:#aa3
```

### 해소된 충돌

| # | 충돌 | 해소 |
|---|------|------|
| C1 | /blueprint §7 vs /plan | /blueprint §7 제거. /blueprint는 §1~§6(분석)만 담당, 실행 계획은 /plan으로 위임 |
| C2 | /solve → /divide 참조 | /solve의 Complex 위임 대상을 /divide → /plan으로 교체 |
| C3 | /go 전면 재구성 | 멀티턴 게이트 추가. 정량 검증 실패 시 같은 단계 재진입 |
| C4 | spec 단위 | 프로젝트당 1파일 → 태스크별 섹션 (spec.md 안에 태스크 헤딩) |
| C5 | Meta 예외 | Meta → /plan 스킵. /project가 Now에 직접 태스크 배치 (현행 유지) |

---

## 3. 역할 비교

```mermaid
graph LR
    subgraph AS_IS["AS-IS: 역할 겹침"]
        A1["/plan\n파일별 Before→After"]
        A2["/divide\nWP 분해"]
        A3["/project\nContext + Now"]
        A4["/spec\n프로젝트 BDD"]
        A1 ---|겹침| A2
        A2 ---|겹침| A3
    end

    subgraph TO_BE["TO-BE: 역할 분리"]
        B1["/project\n전략 = Context"]
        B2["/plan\n전술 = Task Map\n+ 현황판"]
        B3["/spec\n태스크별 BDD"]
        B1 --> B2 --> B3
    end

    style A1 fill:#fee
    style A2 fill:#fee
    style TO_BE fill:#efe
```

---

## 4. 멀티턴 게이트 상세

```mermaid
flowchart LR
    subgraph turn["1턴"]
        work["워크플로우 실행\n(/plan, /spec, /green 등)"]
    end

    subgraph gate["검증 턴"]
        check{"정량 기준\n충족?"}
        metric["기준 예시:\n/plan → 빈 셀 0\n/green → tsc 0 + PASS\n/audit → 전수 증빙"]
    end

    work --> check
    check -->|"✅"| next["다음 단계"]
    check -->|"❌ (≤3회)"| work
    check -->|"❌ (>3회)"| stop["⛔ 보고 + 정지"]
    metric -.-> check

    style gate fill:#ffe,stroke:#aa3
```
