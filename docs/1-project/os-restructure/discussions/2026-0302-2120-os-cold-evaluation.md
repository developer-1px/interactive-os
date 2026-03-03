# Interactive OS 냉정한 평가 — 바퀴의 재발명 vs LLM시대 방향

> **Date**: 2026-03-02 21:20
> **Participants**: 1px, AI (Critical Friend)
> **Trigger**: 2달간 46개 프로젝트 완료 후 방향성 근본 검증

---

## Journey

**🧑 사용자**: 지금까지 만든 OS에 대해 냉정하게 평가하자. 바퀴의 재발명인지, LLM시대의 올바른 방향인지.

**🤖 AI**: Steel-manning — React Aria, Radix, Ark UI 등 기존 라이브러리가 이미 존재. 하지만 이들은 "컴포넌트의 행동"을 풀고, Interactive OS는 "앱 전체의 상호작용 일관성"을 품. 다른 레이어의 문제.

---

**🧑 사용자**: 제일 불안한 지점은 규모야.

**🤖 AI**: 실측 — OS 순수 코드 17K줄, 문서 811개, 전체 75K줄. 18개 개념 카테고리를 1명+AI로 커버할 수 있는가?

**🧑 사용자**: 이미 코드베이스가 커졌다고 느끼는데?

---

**🤖 AI**: OS 코드 해부 결과, 5개 추상화 레이어가 쌓여있음:
1. OS Command (navigate, select…) — 본체
2. defineApp SDK
3. Collection Façade
4. Testing Infra
5. Headless Engine

OS 본체(~3,500줄)보다 감싸는 레이어(~7,000줄)가 2배.

**🧑 사용자**: Inspector는 devtool로 핵심 제품. Testing infra도 LLM 개발에 필수. 문서는 내부 자산. **자기참조 레이어**가 뭔데?

---

**🤖 AI**: 자기참조 레이어 = "OS가 자기 자신을 편하게 쓰기 위해" 만든 코드. 근데 더 쪼개보니:
- 진짜 OS Core: **5,336줄** (커맨드 로직)
- DOM 바인딩: 2,228줄 (React 연결)
- 인프라: 1,793줄 (타입, 레지스트리)

**🧑 사용자**: 그러면 폴더 구조가 이 구분을 제대로 못하고 있는 거네?

**🤖 AI**: 맞다. `src/os/` 안에 5가지 성격의 코드가 구분 없이 19,729줄. `core/` 폴더가 4가지 다른 관심사의 쓰레기통.

---

**🧑 사용자**: src 이하 폴더나 packages의 구조를 다시 잡아야 하는 거 아닐까?

**🤖 AI**: 두 가지 방향:
- A: `src/os/` 내부 폴더 재배치 (경량)
- B: `packages/`로 패키지 분리 (의존성 방향 강제)

**🧑 사용자**: **B안으로 가자.**

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | Interactive OS는 바퀴의 재발명이 아니다. **규모 불안의 근본 원인은 코드 양이 아니라 관심사 미분리**. 해법은 `packages/`로 패키지를 분리하여 OS Core / React Binding / SDK / DevTool의 경계를 물리적으로 강제하는 것 |
| **📊 Data** | OS 전체 17K줄 중 Core 5,336줄, DOM바인딩 2,228줄, 인프라 1,793줄, SDK 4,100줄, DevTool 2,800줄. `core/` 폴더에 4가지 관심사 혼재. `packages/kernel`은 이미 성공적으로 분리된 선례 |
| **🔗 Warrant** | 관심사가 폴더에 반영되지 않으면 모든 코드가 "OS 규모"로 체감된다. 패키지 분리는 의존성 방향을 강제하여 LLM이 잘못된 레이어에 코드를 쓰는 것을 구조적으로 방지한다 |
| **📚 Backing** | Alan Kay "The computer revolution hasn't happened yet" — 시스템 수준 통합의 필요성. Linux Kernel vs Userspace 분리 — OS 설계의 정석. packages/kernel 분리 성공 경험 |
| **⚖️ Qualifier** | 🟡 Complicated — 방향은 확정됨, 구체적 분해가 필요 |
| **⚡ Rebuttal** | 252개 파일의 import path 변경 비용. 모노레포 workspace 설정 + 빌드 파이프라인 수정으로 2-3일+ 소요 가능. 리팩토링 중 기능 개발 중단 |
| **❓ Open Gap** | 패키지 경계의 정확한 위치 — 어떤 파일이 os-core이고 어떤 것이 os-react인지의 세부 분류 |

---

### Warrants (누적)

- W1. LLM은 명시적 규칙 시스템에서 압도적으로 잘 동작
- W2. Headless Testing은 LLM 자율 개발의 전제 조건
- W3. 선언적 API가 LLM 오류 표면적을 최소화
- W4. LLM 시대의 엣지 케이스 전략은 "필요할 때 만든다"
- W5. OS의 규모는 Kernel의 규모로 재정의되어야 함
- W6. OS 17K줄 + 문서 811개는 유지보수 임계점에 근접
- W7. 완성 기준이 "앱을 만들 수 있다"면 이미 거의 달성됨
- W8. OS 코드의 1/3은 자기참조 비용
- W9. LLM은 "이거 지금 필요해?"를 묻지 않으므로 팽창 가속
- W10. Inspector는 LLM 시대 핵심 제품 카테고리
- W11. 5개 추상화 레이어의 순차 생성 — 각 층이 새로운 무게
- W12. 폴더 구조가 관심사를 반영하지 못하면 전체가 "OS 규모"로 체감
- W13. 분류가 정교해야 규모 판단이 가능
- W14. packages/kernel 분리 성공 선례

---

### 🚀 Next

**🟡 Complicated → `/divide`** — packages/ 패키지 분리 Work Package 분해

제안 패키지 구조:
```
packages/
├── kernel/         ← 이미 있음 (3,548줄)
├── os-core/        ← pipeline + commands + engine (순수 로직)
├── os-react/       ← Zone, Item, Field, Trigger (React 바인딩)
├── os-sdk/         ← defineApp, collection façade
└── os-devtool/     ← testing, headless, scripts
```
