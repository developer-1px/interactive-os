# 논증 기법 레퍼런스

> 워크플로우와 규칙에서 참조되는 논증 기법 1건의 정의·출처·용법.

---

## Toulmin Argumentation Model

> 주장의 구조를 6개 요소로 분석하는 논증 모델. 일상적 논증(법정, 과학, 토론)에서 형식논리보다 실용적인 분석 도구.

**출처**: Stephen Toulmin, *The Uses of Argument* (1958)

### 6개 요소

| 요소 | 역할 | 비유 |
|------|------|------|
| **Claim** | 주장. 증명하고자 하는 결론 | "이렇게 해야 한다" |
| **Data** | 근거. Claim을 뒷받침하는 사실 | "왜냐하면 이런 사실이 있다" |
| **Warrant** | 논거. Data가 Claim을 뒷받침하는 논리적 다리 | "이 사실이 이 결론을 뒷받침하는 이유는..." |
| **Backing** | 후원. Warrant 자체를 뒷받침하는 권위/이론 | "이 논리는 X 이론/표준에 기반한다" |
| **Qualifier** | 한정어. Claim의 확실성 정도 | "아마도", "대부분의 경우", "확실히" |
| **Rebuttal** | 반론. Claim이 성립하지 않는 예외 조건 | "단, 이런 경우는 예외다" |

### 우리의 용법

`/discussion`의 전체 구조가 Toulmin 모델을 따른다.

**매 턴 누적 구조**:
- **Emerging Claim** = Claim (수렴 중인 결론)
- **Warrants** = Warrant 누적 리스트 (Data→Claim의 논거)
- **Cynefin** = Qualifier (확실성 정도)
- **Complex Gap** = Rebuttal 탐색 (성립하지 않는 조건 찾기)

**종료 시 산출물** (Conclusion 표):
| Toulmin | 매핑 |
|---------|------|
| Claim | 합의된 결론 |
| Data | 핵심 사실 |
| Warrant | Data→Claim 논리 |
| Backing | 학문적·산업적 출처 |
| Qualifier | Cynefin 도메인 |
| Rebuttal | 반론·리스크·예외 |

**Expert Toolkit과의 관계**:
- **Steel-manning**: 상대 주장의 Warrant를 최강으로 재구성
- **Inversion / Pre-mortem**: Rebuttal을 선제적으로 탐색
- **Conceptual Anchoring**: Backing을 기존 이론에서 확보

**참조**: `discussion.md`, `elicit.md`
