---
description: 개발 환경이 정상 동작하는지 확인하고, 아니면 복구한다. 서버 + 타입 + 렌더 스모크까지 보장.
---


## /ready — 개발 환경 준비 보장

> **원칙**: 진단만 하지 않는다. 복구까지 한다.
> `/ready` 호출 후 반환되면, **앱이 돌아가는 상태**라고 신뢰할 수 있어야 한다.
> 서버가 떴다 ≠ 앱이 동작한다. 렌더까지 확인해야 "ready"다.

### 검증 범위

| 레벨 | 검증 항목 | 실패 시 |
|------|----------|---------|
| 1. 서버 | App(5555) + Docs(4444) HTTP 200 | 좀비 정리 → 재기동 |
| 2. 타입 | `npx tsc --noEmit` 0 errors | 에러 보고 → 멈춤 |
| 3. 렌더 | App 홈페이지에 콘텐츠가 렌더되는가 | 에러 보고 → 멈춤 |

### 대상 서버

| 서버 | 포트 | 용도 | 시작 명령 |
|------|------|------|----------|
| App  | 5555 | 메인 앱 (Vite + TanStack Router) | `npx vite` |
| Docs | 4444 | 문서 뷰어 (Vite + docs.html) | `npx vite --config vite.docs.config.ts` |

### 절차

1. **Node 버전 보장**
   - 프로젝트 루트의 `.nvmrc` 파일에 명시된 버전을 사용한다.
   - `source ~/.nvm/nvm.sh && nvm use`
   - 이후 모든 명령(`tsc`, `vite` 등)은 이 Node 버전 위에서 실행해야 한다.

2. **패키지 최신화**
   - `ncu` (npm-check-updates)로 최신 버전을 확인한다.
   - 업데이트가 있으면:
     ```
     ncu -u
     npm install
     ```
   - peer dependency conflict 등으로 제외해야 할 패키지는 `.ncurc.json`의 `reject`에 추가하여 관리한다.
   - 변경 없으면 아무것도 하지 않는다.
   - 이후 Step 3(타입 체크)에서 breakage를 잡는다.

3. **타입 체크**
   - `npx tsc --noEmit`
   - 0 errors가 아니면 에러를 보고하고 **멈춘다**. 타입이 깨진 채로 서버를 띄워봐야 의미 없다.

4. **좀비 프로세스 정리**
   - 각 포트(5555, 4444)에 대해 health check:
     ```
     curl -s --connect-timeout 3 --max-time 5 -o /dev/null -w "%{http_code}" http://localhost:{PORT}/
     ```
   - 200이면 → 해당 서버 정상. 다음 포트로.
   - 연결은 되지만 응답 없음(타임아웃) → 좀비. `lsof -t -i :{PORT} | xargs kill -9`
   - 연결 거부 → 서버 없음. 6단계에서 기동.

5. **Vite 캐시 확인**
   - 좀비가 발견됐거나 서버를 새로 시작해야 하면:
     ```
     rm -rf node_modules/.vite
     ```
   - 이미 두 서버 모두 정상이면 캐시를 건드리지 않는다.

6. **서버 기동**
   - 정상이 아닌 서버만 개별 시작한다.
   - 모든 서버 기동 명령 앞에 `source ~/.nvm/nvm.sh && nvm use` 를 붙인다.
   - App 서버가 없으면: `source ~/.nvm/nvm.sh && nvm use && npx vite` (백그라운드)
   - Docs 서버가 없으면: `source ~/.nvm/nvm.sh && nvm use && npx vite --config vite.docs.config.ts` (백그라운드)
   - 각 서버가 200 응답할 때까지 재시도 (최대 15초).

7. **렌더 스모크**
   - App 서버의 홈페이지가 실제로 렌더되는지 확인:
     ```
     curl -s http://localhost:5555/ | grep -q '<div id="root">'
     ```
   - HTML이 정상 응답되면 ✅
   - 빈 응답이거나 에러 페이지이면 Vite 터미널 로그를 확인하고 에러를 보고한다.

8. **결과 보고**
   ```
   | 항목    | 결과 |
   |---------|------|
   | Node    | ✅ (`.nvmrc` 버전) |
   | npm     | ✅ up to date |
   | tsc     | ✅ 0 errors |
   | App     | ✅ 5555 |
   | Docs    | ✅ 4444 |
   | Render  | ✅ |
   ```

### 호출 관계

이 워크플로우를 호출하는 곳:
- `/verify` — Step 0으로 호출 (전제조건)
- `/issue` — Step 3 베이스라인 확보
- 독립 실행 — 작업 시작 전 수동 호출
