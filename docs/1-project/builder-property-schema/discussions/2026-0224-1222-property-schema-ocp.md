# Property Schema — Builder OCP 졸업

## Journey

**🧑 사용자**: 우측 패널에서 Form이랑 아코디언을 트리처럼 하려니까 키라인이 안 맞는데 다른 UI 아이디어 없어?

**🤖 AI**: Stacked Disclosure / Tree / Accordion 차이를 분석. 쉐브론 오른쪽 배치 (Figma 패턴) 제안.

---

**🧑 사용자**: 본질은 같다. 키라인이 안 밀리게 설계해줘.

**🤖 AI**: 쉐브론 오른쪽 + 섹션 배경색 구현. Service Card는 동형 반복 자식이라 별도 디자인 제안.

---

**🧑 사용자**: Form Label과 일치감이 없어서 그런 거야. Label은 동일, Field만 다르게.

**🤖 AI**: 핵심 원칙 도출. 자식 블록을 부모 폼 안에서 동일 label 패턴의 다른 field widget으로 표현. 구현.

---

**🧑 사용자**: Button에 링크/action이 있어야지. Icon/Image도 추가해봐. 그리고 OCP하게 개선하자.

**🤖 AI**: `/conflict` 실행. 3가지 긴장 발견: Canvas Registry vs Panel heuristic, PropertyType 유령, `Record<string, string>` 단일 타입.

---

**🧑 사용자**: PoC라서 스키마 설계를 안 해서 그런 거야 그치?

**🤖 AI**: 맞다. T1~T3은 PoC의 정상적 부채. 방향 증명은 끝남.

---

**🧑 사용자**: 각 스키마에 더 잘 맞는 데이터 구조가 있기 마련이고, 인코딩해서 쓰고 디코딩해서 전달하면 돼.

**🤖 AI**: Claim 수렴. Primitive Registry (encode/decode/Widget) + Block Schema (type별 조합) = 3계층 OCP.

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | Web Primitive 12종은 안정적 Atoms. Block Type은 Schema로 Atoms를 조합. Widget은 교체 가능한 View. 3계층이 독립. encode/decode 파이프라인이 경계의 Transform. |
| **📊 Data** | 1) Canvas는 이미 Registry (`block.type → Renderer`), Panel만 heuristic (`inferFieldType`). 2) `PropertyType` 타입이 선언만 있고 사용 0. 3) `fields: Record<string, string>`에서 Button의 href/action 표현 불가. |
| **🔗 Warrant** | Rules.md #3 "경계에 순수 함수" = encode/decode가 Transform. Rules.md #1 "같은 문제를 두 패턴으로 푸면 엔트로피 증가". |
| **📚 Backing** | Gutenberg block.json attributes, Webflow Component Properties, Framer addPropertyControls(), Atomic Design (Brad Frost) |
| **⚖️ Qualifier** | Complicated — 전수 열거 가능, 분석하면 답이 좁혀짐 |
| **⚡ Rebuttal** | encode/decode 오버헤드 (단순 text는 identity로 해결). 기존 캔버스 렌더러가 `fields[key]`로 직접 접근하는 곳은 decode 호출 추가 필요. |
| **❓ Open Gap** | Schema 파일 위치 (co-location vs centralized). Primitive 목록 최종 확정. |
