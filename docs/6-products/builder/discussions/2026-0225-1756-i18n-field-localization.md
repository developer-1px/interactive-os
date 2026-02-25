# Visual CMS 다국어(i18n) 기능 — 파이프라인 검증용

## Journey

**🧑 사용자**: TOBE 파이프라인이 워킹되는지 보자. Visual CMS에 다국어 기능이 필요해. 편집 중인 필드 기준으로 언어 추가, 전환, 저장.

**🤖 AI**: 필드 단위 i18n(Contentful 패턴). Clear → `/stories`로 라우팅.

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | Visual CMS에 필드 단위 다국어(i18n) 기능이 필요하다 |
| **📊 Data** | 콘텐츠 운영자가 같은 페이지를 여러 언어로 관리해야 한다 |
| **🔗 Warrant** | 필드 단위 i18n이 페이지 복제보다 효율적 |
| **📚 Backing** | Contentful, Strapi의 Locale 모델 선례 |
| **⚖️ Qualifier** | 🟢 Clear |
| **⚡ Rebuttal** | 데이터 구조 변경(string→Record<locale, string>)의 마이그레이션 비용 |
| **❓ Open Gap** | 없음 |
