# /plan — AI Native 파이프라인 여정 문서 시리즈

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `docs/3-resource/ai-native-pipeline/01-why-planning-is-hard.md` | 없음 | 1편: 공감→골 픽션→모드 분리. `/discussion` 실물 + git log 증거 + 외부 레퍼런스 | Clear | — | 사용자 리뷰 | 에피소드 디테일이 메모에만 의존 |
| 2 | `docs/3-resource/ai-native-pipeline/02-artifact-driven-thinking.md` | 없음 | 2편: 산출물 재정의→세 기둥→한 턴의 함정. `/red`,`/green` 실물 + 분리 과정 증거 | Clear | →#1 | 사용자 리뷰 | /tdd 원본 삭제 가능 |
| 3 | `docs/3-resource/ai-native-pipeline/03-pipeline-design.md` | 없음 | 3편: 파이프라인=산출물→복구 경로→폭주→Task 분해. `/go`,`/why`,`/reflect` 실물 + 타임라인 | Clear | →#2 | 사용자 리뷰 | 폭주 에피소드 git 증거 부족 가능 |
| 4 | `docs/3-resource/ai-native-pipeline/04-self-learning-and-beyond.md` | 없음 | 4편: 자가 학습→/auto→전체 구성도→이상향→현재 위치. `_middleware`,`/retrospect`,`/auto` 실물 | Clear | →#3 | 사용자 리뷰 | /auto 성숙도 낮음 |

## 라우팅
승인 후 → `/project` (Meta: ai-native-pipeline) → `/go` Step 1.5
