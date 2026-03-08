# Retrospective: seal-useComputed

> 날짜: 2026-03-09
> 목표: os.useComputed를 앱 레벨에서 accessor hook으로 교체

## 핵심 발견

1. **Goodhart's Law**: "LLM-friendly" API 설계가 오히려 환각을 유발. os.useComputed ≅ Redux useSelector → LLM이 accessor hook 대신 직접 호출
2. **Pit of Success 재정의**: "쉬운 API" ≠ "잘못 쓰기 어려운 API"
3. **실증**: 이 세션에서 AI가 만든 ModalPortal이 useOverlay 대신 os.useComputed 직접 호출 → 문제가 이론이 아닌 관측 사실

## KPT 요약

- **Keep**: Discussion에서 근본 원인(Goodhart's Law) 먼저 짚고 나서 구현
- **Keep**: 사용자가 AI 인지적 편향을 메타적으로 지적 → 고품질 피드백 루프
- **Problem**: 없음 (기계적 교체)
- **Try**: 없음 (워크플로우 변경 불필요)

## 반영 결과

| 반영 | 내용 |
|------|------|
| rules.md | os.useComputed 금지 + Goodhart's Law 교훈 |
| contract-checklist | grep 패턴 + 수정 대응표 + §1-A 추가 |
| accessor hooks 4개 | useActiveZone, useEditingItem, useNotifications, useZoneValue |
| src/ 마이그레이션 | 9파일 10곳 → accessor hook 교체 |
