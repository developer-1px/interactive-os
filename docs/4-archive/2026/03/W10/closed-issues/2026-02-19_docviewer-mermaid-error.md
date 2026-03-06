# 🐛 [Closed] DocViewer Mermaid Error 표시 현상
> 등록일: 2026-02-19
> 상태: closed
> 심각도: P2

## 원문
docViewer에서 Mermaid Error가 라는 현상을 수정

## 환경 (Environment)
- 브라우저/OS: Chrome, macOS
- 관련 서버 상태: App 5555 ✅

## 재현 단계 (Reproduction Steps)
1. DocViewer 라우트 접속
2. Mermaid 다이어그램이 포함된 마크다운 문서 열기
3. Mermaid 블록이 "Mermaid Error"로 표시됨

## 기대 결과 (Expected)
Mermaid 다이어그램이 정상적으로 렌더링되어야 한다.

## 실제 결과 (Actual)
"Mermaid Error"라는 에러 메시지가 표시된다.

## 해결 요약
- 원인: `mermaid.render(id, code)` 호출 시 `useRef`로 고정된 ID를 사용하여, React StrictMode에서 useEffect 이중 실행 시 동일 ID로 두 번 렌더를 시도하면 충돌 발생. 에러 후 ghost SVG 요소가 DOM에 남아 이후 시도도 실패.
- 수정: 매 렌더 시도마다 `crypto.randomUUID()`로 고유 ID 생성, cleanup에서 잔여 ghost 요소 제거 (`src/docs-viewer/MermaidBlock.tsx`)
- 검증: type ✅ / test 8/8 ✅

## Changelog
| 커밋 | 내용 |
|------|------|
| `0dedb7e` | fix(docs-viewer): resolve mermaid render ID collision — MermaidBlock.tsx |
