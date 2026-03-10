# /conflict 개선 — 원칙 우선순위 프레임워크 추가

> 작성일: 2026-03-10
> 태그: idea
> 우선순위: P1

## 문제 / 동기

`/conflict`가 충돌을 진단할 때, **기존 코드/테스트의 사용 빈도**가 암묵적으로 높은 가중치를 받는다.
결과: "81파일에서 쓰이니 리네이밍이 합리적"이라는 결론이 나오고, 원칙(Playwright Isomorphism)이 현실에 밀린다.

근본 원인: `/conflict`에 **원칙 간 우선순위 체계**가 없다. Steel-manning이 양쪽을 동등하게 다루기 때문에, "많이 쓰인다"는 사실이 "원칙에 맞다"와 같은 무게를 갖게 된다.

발견 경위: page-contract-split 프로젝트에서 C1(God Object 내부 이름) 해소 시, 사용 빈도(dispatch 81파일, state 66파일)가 리네이밍 방향으로 결론을 기울임. 사용자가 "원칙이 우선"을 명시적으로 선언한 후에야 방향이 바뀜.

## 현재 상태

- `/conflict` Step 2 (Steel-manning)에서 Thesis/Antithesis를 동등 무게로 다룸
- "근거"에 코드 사용 빈도, 파일 수 등 정량적 데이터가 포함됨
- 원칙(rules.md, BOARD.md 원칙)과 현실(기존 코드)의 가중치 차이가 없음
- 관련 파일: `.claude/skills/conflict/SKILL.md`

## 기대 상태

`/conflict`의 Steel-manning 단계에서 **원칙 우선순위 체계**를 적용:

1. **원칙 계층**: 프로젝트 원칙(rules.md, BOARD 원칙) > 기존 코드 관행 > 편의성
2. **사용 빈도의 올바른 해석**: 많이 쓰인다 = 오염 범위의 증거 (유지 근거가 아님)
3. **Collision Point에 원칙 위반 여부를 명시**: "이 코드가 원칙 X를 위반한다" → 위반 쪽이 Antithesis

완료 조건:
- `/conflict` SKILL.md에 원칙 우선순위 프레임워크 추가
- Steel-manning 템플릿에 "원칙 위반 여부" 필드 추가
- "사용 빈도"가 근거로 쓰일 때 자동으로 "오염 범위 해석" 경고 삽입

## 접근 방향

Step 2 (Steel-manning)의 템플릿에 추가:

```
### 원칙 점검
- 이 충돌에 적용되는 프로젝트 원칙: [rules.md/BOARD 원칙 인용]
- Thesis의 원칙 정합성: [위반/준수]
- Antithesis의 원칙 정합성: [위반/준수]
→ 원칙을 위반하는 쪽이 입증 책임을 진다 (default = 원칙 쪽이 이김)
```

## 관련 항목

- `docs/1-project/testing/headless-page/page-contract-split/discussions/2026-0310-conflict-report.md` — 이 문제가 발생한 실제 사례
- `.claude/skills/conflict/SKILL.md` — 수정 대상
