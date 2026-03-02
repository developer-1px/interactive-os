# 폴더 구조 리팩토링 Discussion

> 2026-03-02 | Session: f904bdf9

---

## Journey

**🧑 사용자**: os 폴더 이하의 파일들을 줄이고 싶은데 defineApp 등 너무 많은거 같아. 파일들은 폴더때처럼 같은 폴더내 파일들의 위상이나 성격들이 같은지 분석해줘.

**🤖 AI**: 9개 루트 파일 분석 → 4가지 성격 혼재 발견 (커널 부트, API 진입점, 내부 구현, 테스트 전용). defineApp.*.ts는 하나의 모듈의 파일 분할인데 폴더 없이 점 표기법으로 표현 — 다른 폴더와 표현 방식 불일치.

---

**🧑 사용자**: 그렇게 해보자 → (실행: kernel→core/, appSlice→core/, defineApp.*→defineApp/ 폴더화)

**🤖 AI**: `src/os/` 루트에 파일 0개, 폴더 10개. tsc 0 | vitest 142/143. ✅

---

**🧑 사용자**: 2depth 폴더와 파일들도 같은 렌즈로 보자. 같은 위상인지

**🤖 AI**: 10개 폴더 내부 전수조사 → 3건 위반 발견: (1) core/ 3축 혼재, (2) 1-listen/ Root.tsx+shared 중복, (3) 6-project/tests/ 경미.

**🧑 사용자**: 위상이 다른것들은 subGroupFolder를 만들어서 위상을 맞춰보자

**🤖 AI**: core/widgets/ 분리, 1-listen/_shared/ 통합. tsc 0 | vitest 142/143. ✅

---

**🧑 사용자**: 컨셉맵하고도 긴장은 어때?

**🤖 AI**: 컨셉맵(18개 영역)이 구 구조 기준이라 현 구조와 불일치. 재작성 필요.

**🧑 사용자**: 다시 작성해봐. 의존성, 컨셉, flow, 위상 4가지 관점에서

**🤖 AI**: 4-Lens 분석 → 6개 긴장 포인트 (T1~T6) 식별. T1, T2는 테스트 전용 역방향 의존이라 심각도 낮음.

---

**🧑 사용자**: 이 모든 걸 다 만족할 수 있는 구조를 만들거야. 파이프라인을 큰 골자로 하면서 나머지 렌즈들을 어떤 순서대로 쌓을지 제안해봐

**🤖 AI**: Flow → Dependency → Concept → Topology 순서 제안. Maslow 비유: 골격 > 면역 > 근육 > 피부.

**🧑 사용자**: /go

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | 폴더 구조는 **Flow → Dependency → Concept → Topology** 순서로 4개 렌즈를 스택해야 한다. 충돌 시 상위 렌즈가 우선한다. |
| **📊 Data** | `src/os/` 리팩토링 전후 비교: 15→10 folders, 9 root files→0, 6개 긴장 포인트 중 4개 해소, 2개(T1,T2) 테스트 전용으로 허용 |
| **🔗 Warrant** | 위반 비용 순서: 구조 붕괴(Flow) > 순환 의존(Dependency) > 탐색 불가(Concept) > 미관(Topology). 비용이 큰 것을 먼저 보장해야 한다 |
| **📚 Backing** | Christopher Alexander "Quality Without a Name" — 좋은 구조는 단일 축 최적화가 아니라 다중 관심사의 동시 충족. DB 복합 인덱스 — 순서가 쿼리 효율을 결정 |
| **⚖️ Qualifier** | 🟢 Clear |
| **⚡ Rebuttal** | `core/`가 14/18 개념에 관여하지만 이는 `headless/`의 본질적 특성. `3-inject` 번호와 실행 순서 불일치는 lazy inject 관습으로 허용 |
| **❓ Open Gap** | 이 원칙을 docs/official/ 또는 .agent/knowledge/에 문서화하여 세션 간 일관성 보장 필요 |
