---
description: HTML + TailwindCSS로 디자인 프로토타입만 만든다. 프로젝트 코드는 건드리지 않는다.
---

## 핵심 규칙
- **기존 프로젝트 소스코드를 수정하지 않는다.** 기존 src/ 파일 수정 금지.
- 산출물은 **단일 TSX 파일** 1개. 컴포넌트는 잘게 나누되 파일은 분리하지 않는다.
- **inline style 금지.** TailwindCSS로만 스타일링한다.
- **디자인 철학**: 가독성 중시 프리미엄 Light Theme
  - 서체: Inter (Google Fonts CDN)
  - 색상: slate/gray 기반, 악센트는 indigo 또는 사용자 지정
  - 여백 충분, 타이포그라피 위계 명확
  - 장식 최소화, 콘텐츠 퍼스트

## 절차

1. **요구사항 확인**: 어떤 화면/컴포넌트를 디자인할지 확인한다.

2. **레퍼런스 리서치**: 웹 검색으로 관련 UI/UX 레퍼런스를 수집한다.

3. **디자인 페이지 생성**: 단일 TSX 파일로 작성한다.
   - 라우트: `/playground/design-{slug}` (TanStack Router flat route)
   - 컴포넌트를 잘게 분리하되 **한 파일 안에** 모두 정의
   - TailwindCSS + mock 데이터로 실제 사용감 재현
   - 외부 의존성 최소 (lucide-react 정도만 허용)

4. **라우트 등록**: `/routes` workflow로 GlobalNav에 등록한다.

5. **브라우저 확인**: 등록된 라우트를 열어 시각적으로 확인한다.

6. **리뷰 요청**: 경로와 스크린샷을 제출, 피드백 반복한다.
