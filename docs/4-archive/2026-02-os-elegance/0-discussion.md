# OS Elegance — Discussion

> **출발점**: todo v5 회고 + defineApp v5 코드 리뷰 + 프로젝트 현황 감사
> **날짜**: 2026-02-14

---

## 배경

defineApp v5 프로젝트를 성공적으로 완료한 후, 회고를 통해 다음 사실이 드러남:

1. **API 설계는 우아하다 (⭐⭐⭐⭐⭐)** — `condition()`, `selector()`, `command()`, `createZone()`, `bind()` 5개 메서드로 앱 전체를 표현.
2. **내부 구현에 잔여물이 있다 (⭐⭐⭐)** — dead guard, 이중 체크, void 무덤, 타입/구현 불일치.
3. **OS Shell(GlobalNav, 404, Layout)은 기능적이나 "뛰어나지" 않다** — 기본 기능은 동작하지만, 시각적 완성도와 사용 경험에서 갈고닦을 여지가 크다.
4. **Playground 라우트 정리 미완** — 사용하지 않는 showcase/playground 라우트들이 여전히 존재.
5. **Dead code 및 레거시 잔존** — `as any` 캐스팅, `console.log`, deprecated 파일 등.

## 핵심 질문

> **"지금의 OS는 데모할 수 있는가?"**

기능은 동작하지만, 처음 보는 사람이 "와" 할 수준인가? 
답: 아직 아니다.

## 목표 (Discussion 결론)

- OS Shell의 시각적 완성도를 "와" 수준으로 끌어올린다.
- 코드 레벨의 잔여물을 정리하여 "코드도 우아한 OS"를 증명한다.
- 불필요한 라우트와 dead code를 제거한다.
- defineApp v5 코드 리뷰에서 발견된 R1(dead guard), E1(Immer 일관성), E4(타입 불일치) 등을 수정한다.
