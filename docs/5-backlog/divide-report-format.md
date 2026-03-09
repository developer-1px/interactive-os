# /divide REPORT 형식 개선

## 현재 문제
- Backward Chain 테이블이 트리를 flat table로 렌더 — 추론이 안 읽힘
- 같은 정보 3회 반복 (chain → layer 증거 → WP 테이블)
- 3단 논법의 인과 순서가 포인터 추적으로 치환됨

## 합의된 방향
- **B·C·G blockquote**: Background(왜) / Constraint(제약) / Goal(목표) — 불릿, 스캔 가능
- **Backward Chain**: Goal에서 역추적 → SubGoal → 전제조건 → Gap(❌) 식별
- **WP**: Gap별로 묶어 의존성 순 테이블
- 역추론(왜 깨졌나)과 순추론(뭘 먼저 하나) 분리

## 해야 할 것
- `.claude/skills/divide/SKILL.md` 템플릿의 Report Format 섹션을 위 구조로 교체
- zero-drift REPORT가 실험 사례 (`docs/1-project/os-core/zero-drift/REPORT.md`)
