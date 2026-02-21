# Discussion — Product vs Project 관리 체계

## Journey

**🧑 사용자**: 빌더에 대한 기획서가 없어. 네가 뭘 기준으로 만들어야 할지 모르네.

**🤖 AI**: VISION.md를 Product Vision Board 포맷으로 작성하겠습니다.

**🧑 사용자**: 그전에 workflow 자체가 없어. 단발성 코딩만 잘했지 장기적인 진짜 프로젝트를 정의하고 만들어가는 프로세스가 없네?

> 전환점 — 문서 하나의 문제가 아니라, 프로세스 자체의 부재.

**🤖 AI**: Project(bounded) vs Product(ongoing)의 구분이 필요합니다. Product → Milestone → Task 계층.

**🧑 사용자**: 용어부터 정리. project는 뭘 의미하는지, PARA와의 관계도.

**🤖 AI**: PARA의 Area = ongoing, Project = bounded. `builder-v2`는 Area인데 Project에 있다.

**🧑 사용자**: PARA가 아닌 새로운 폴더 구조가 더 나아?

**🤖 AI**: PARA는 개인 지식 관리용. `area`→`products`로 부르면 번역 비용 0.

**🧑 사용자**: 번호 접두사는 폴더 정렬용. `6-products`를 만들어.

---

**🧑 사용자**: VISION.md 작성해봐. 그런데 빌더가 아니야. Visual CMS야. 기존 웹 페이지의 콘텐츠를 비주얼 그대로 편집 관리하는 시스템.

> 전환점 — 프로덕트 정체성의 재정의. Builder ≠ 제품명, Visual CMS가 본질.

**🧑 사용자**: products 문서가 너무 빈약한데?

**🤖 AI**: 어떤 판단에서 막히는지에 따라 SPEC, DESIGN 등 추가 문서가 필요합니다.

**🧑 사용자**: project를 진행하면서 products로 에스컬레이션하는 식으로 하면?

> 전환점 — Product 문서를 미리 쓰는 게 아니라, Project 완료 시 검증된 지식이 bottom-up으로 축적.

**요약**: Product 문서는 추측으로 쓰지 않고, Project가 끝날 때 검증된 결정만 에스컬레이션하여 축적한다.

---

## Conclusion

### Why
단발성 태스크 실행(Project)은 잘 동작하지만, 장기 프로덕트의 방향(Vision)과 축적된 결정(Spec/Design)을 보유하는 상위 레이어가 없어서, 리팩토링할 때마다 판단 기준이 흔들렸다.

### Intent
Product(끝나지 않는 것)와 Project(끝나는 것)를 분리하여, Product가 Why를 보유하고 Project가 What/How를 실행하는 체계를 만든다. Product 문서는 bottom-up으로 축적한다.

### Warrants
1. 기획서 없이 리팩토링하면 매 판단이 흔들린다 (level, 색상 기준 등)
2. 현재 워크플로우는 태스크 실행(How)에 강하지만 방향 설정(What/Why)이 없다
3. `/prd`는 기능 스펙이지 프로덕트 비전이 아니다
4. 판단 기준 부재가 불필요한 산출물보다 더 큰 부채
5. 단발성 `/project`는 잘 동작한다 — 고치지 말고 상위 계층(Product)을 추가
6. Product에는 "완료"가 없으므로 Project가 bounded 단위 역할
7. PARA의 Area ↔ Project 구분이 이 문제를 풀지만, "Area"보다 "Products"가 자명
8. `6-products/`를 추가하면 기존 구조 변경 없이 확장 가능
9. Product Vision Board (Roman Pichler) + Now/Next/Later (Janna Bastow)가 업계 표준
10. 추측으로 쓴 스펙은 부채, 검증된 결정의 환류는 자산
11. `/archive` 워크플로우에 "product 귀속 여부 판단" 스텝을 추가

### 결정 사항

| 용어 | 위치 | 특성 |
|------|------|------|
| **Product** | `6-products/` | 끝나지 않음, VISION.md + 축적된 spec/design |
| **Project** | `1-project/` | bounded, 완료→archive, README+BOARD |
| **Task** | BOARD.md 내 T1, T2 | Project 안의 실행 단위 |

### 한 줄 요약

> **Product는 Why를 보유하고 bottom-up으로 성장하며, Project는 bounded하게 실행하고 검증된 지식을 Product에 환류한다.**
