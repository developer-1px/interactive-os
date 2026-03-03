# TOBE 파이프라인 SRP 적용 + 🚀 Next 라우팅

## Journey

**🧑 사용자**: `/inbox` 워크플로우에서 원문→배경, 한줄요약→3줄요약으로 바꾸고 싶다.

**🤖 AI**: 수정 적용. `<br>`이 테이블 안에서 안 먹히는 문제 발견 → `rehype-raw` 추가로 해결.

---

**🧑 사용자**: TOBE 흐름도 문서를 보면, `/discussion`에서 끝나면 매번 "어디로 갈까요?"를 묻는데, 이걸 AI가 예측해서 제안하면 안 되나?

**🤖 AI**: `🚀 Next` 행을 누적 구조에 추가하자고 제안. Cynefin = 게이트, 행선지 = 논의 성격.

---

**🧑 사용자**: Clear라고 해서 /go는 아냐. Clear는 "어디로 갈지 안다"이지, 행선지가 고정된 게 아니다.

**🤖 AI**: 수정. Cynefin(준비됐나?) × 논의 성격(뭐였나?) = 2축 독립 라우팅.

---

**🧑 사용자**: 나머지 workflow도 TOBE에 맞게 수정해야지.

**🤖 AI**: `/go`(G2 spec), `/project`(Red 삭제→스토리 선택), `/spec`(신규), `/red`(Gate만) 4개 워크플로우 일괄 수정.

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | 1 워크플로우 = 1 책임(SRP). `/discussion`은 `🚀 Next`로 다음 스텝을 예측하여 라우팅 마찰을 제거한다. |
| **📊 Data** | ASIS: `/project`가 Red 테스트까지 작성(SRP↓), `/red`가 DT까지 작성(SRP↓), `/prd`라는 잘못된 이름 |
| **🔗 Warrant** | 책임이 섞이면 AI가 건너뛰고, 이름이 잘못되면 AI가 오해한다 |
| **📚 Backing** | SRP(Robert C. Martin), Cynefin(Dave Snowden), Toulmin Argumentation |
| **⚖️ Qualifier** | 🟢 Clear — 모든 변경이 식별·실행 완료. 나머지 정비(stories, prd 정리, conclusion 구로직)만 남음 |
| **⚡ Rebuttal** | /stories 워크플로우 파일 미생성, 기존 prd.md 아카이브 미처리, /discussion conclusion 섹션 구로직 잔존 |
| **❓ Open Gap** | 없음. 잔여 작업은 Clear 수준 |
