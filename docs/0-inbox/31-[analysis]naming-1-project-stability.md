# Naming Analysis: 1-project 안정성 순 Depth 검증

> 작성일: 2026-03-11
> 원칙: "변하지 않을 구조가 depth 1 → 2 → 3 순"

---

## 안정성 등급표

Scale: 5 = 5년 후에도 존재, 1 = 다음 달 바뀔 수 있음

### 제안된 Depth 1 (Domain)

| 이름 | 안정성 | 근거 |
|------|:---:|------|
| kernel | 5 | 아키텍처 레이어. packages/kernel/ |
| os | 5 | 아키텍처 레이어. packages/os-*/ |
| apps | 4 | 범주로서 영구. 내용물은 변함 |
| ai-workflow | 2 | 방금 만든 이름. 경계 불명확 |

### 제안된 Depth 2 (Epic)

| 이름 | 안정성 | 근거 |
|------|:---:|------|
| headless-page | 5 | 코드 canonical name. page.ts |
| apg-suite | 4 | W3C APG 스펙 연결 |
| sdk-role-factory | 4 | defineRole() 코드 존재 |
| devtool-split | 3 | 액션 이름. 완료 후 퇴색 |
| agent-activity | 3 | 컨셉 있으나 이름 미확정 |
| ban-os-from-tsx | 3 | 정책. 달성 후 퇴색 |
| builder-v2 | 2 | 버전 번호 = 불안정 |
| builder-v3 | 2 | 동일 |

---

## 안정성 역전 (원칙 위반)

```
❌ ai-workflow (depth 1, 안정성 2) < headless-page (depth 2, 안정성 5)
❌ ai-workflow (depth 1, 안정성 2) = builder-v2 (depth 2, 안정성 2)
```

depth 1이 depth 2보다 덜 안정적. 원칙 위반.

---

## 분석

### 왜 역전이 발생하는가

- `kernel`, `os`는 **아키텍처 레이어** → 안정성 5. depth 1 적합
- `apps`, `ai-workflow`는 **분류 범주** → 안정성 2~4. depth 1 부적합
- `headless-page`, `builder`는 **코드 canonical name** → 안정성 5인데 depth 2에 배치

### 근본 원인

3-tier 구조에서 depth 1(domain)을 "대분류 범주"로 설계했는데,
범주 이름(apps, ai-workflow)이 코드에 고정된 컨셉 이름(headless-page)보다 불안정.

### 선택지

**A. 2-tier (epic > project)**: depth 1 = 코드 canonical name(안정성 5).
   grouping은 STATUS.md 섹션으로 해결. 3-tier 합체 82% 현상 해소.

**B. 3-tier 유지, depth 1 이름 강화**: domain을 아키텍처 레이어(kernel, os)로 한정하고,
   나머지는 flat하게 depth 1에 배치.

**C. 3-tier 유지, 안정성 역전 수용**: 실용적 grouping 가치가 안정성 원칙보다 크다고 판단.
