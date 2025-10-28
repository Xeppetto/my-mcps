# Playwright MCP Server

브라우저 자동화를 위한 Model Context Protocol (MCP) 서버입니다. Playwright를 사용하여 웹 페이지 탐색, 요소 조작, 스크린샷 캡처 등의 작업을 수행할 수 있습니다.

## 기능

이 MCP 서버는 Playwright를 통해 다음 기능들을 제공합니다:

### 1. 브라우저 실행 (`launch_browser`)
Chromium, Firefox, 또는 WebKit 브라우저를 실행합니다.

**파라미터:**
- `browser` (필수): 실행할 브라우저 타입 - `chromium`, `firefox`, `webkit`
- `headless` (선택): 헤드리스 모드 실행 여부 (기본값: true)
- `browser_id` (선택): 브라우저 인스턴스 고유 식별자 (기본값: "default")

**반환 정보:**
- 브라우저 실행 성공 메시지 및 ID

**사용 사례:**
- 웹 스크래핑 작업 시작
- 웹 애플리케이션 테스트 준비
- 여러 브라우저 인스턴스 동시 관리

### 2. 새 페이지 생성 (`new_page`)
브라우저에 새 페이지(탭)를 생성합니다.

**파라미터:**
- `browser_id` (선택): 대상 브라우저 인스턴스 ID (기본값: "default")
- `page_id` (선택): 페이지 고유 식별자 (기본값: "default")

**반환 정보:**
- 페이지 생성 성공 메시지 및 ID

**사용 사례:**
- 여러 웹 페이지 동시 탐색
- 병렬 작업 수행
- 각 작업별 독립된 세션 관리

### 3. URL 이동 (`navigate`)
지정된 URL로 페이지를 이동합니다.

**파라미터:**
- `url` (필수): 이동할 URL
- `page_id` (선택): 대상 페이지 ID (기본값: "default")

**반환 정보:**
- 페이지 이동 성공 메시지

**사용 사례:**
- 특정 웹사이트 접속
- 웹 애플리케이션 탐색
- 여러 페이지 순차 방문

### 4. 요소 클릭 (`click`)
페이지 내 특정 요소를 클릭합니다.

**파라미터:**
- `selector` (필수): CSS 셀렉터 또는 텍스트
- `page_id` (선택): 대상 페이지 ID (기본값: "default")

**반환 정보:**
- 클릭 성공 메시지

**사용 사례:**
- 버튼 클릭
- 링크 선택
- 폼 제출
- UI 요소 상호작용

### 5. 텍스트 입력 (`type`)
특정 입력 요소에 텍스트를 입력합니다.

**파라미터:**
- `selector` (필수): 입력 요소의 CSS 셀렉터
- `text` (필수): 입력할 텍스트
- `page_id` (선택): 대상 페이지 ID (기본값: "default")

**반환 정보:**
- 텍스트 입력 성공 메시지

**사용 사례:**
- 폼 작성
- 검색어 입력
- 로그인 정보 입력
- 텍스트 필드 자동화

### 6. 텍스트 추출 (`get_text`)
특정 요소에서 텍스트 콘텐츠를 가져옵니다.

**파라미터:**
- `selector` (필수): 대상 요소의 CSS 셀렉터
- `page_id` (선택): 대상 페이지 ID (기본값: "default")

**반환 정보:**
- 추출된 텍스트 내용

**사용 사례:**
- 웹 페이지 데이터 추출
- 동적 콘텐츠 수집
- 검증용 텍스트 확인
- 스크래핑 작업

### 7. 스크린샷 캡처 (`screenshot`)
현재 페이지의 스크린샷을 저장합니다.

**파라미터:**
- `path` (필수): 스크린샷 저장 경로
- `page_id` (선택): 대상 페이지 ID (기본값: "default")

**반환 정보:**
- 스크린샷 저장 성공 메시지 및 경로

**사용 사례:**
- 페이지 상태 기록
- 시각적 테스트
- 버그 리포트용 증거 수집
- 웹 페이지 아카이빙

### 8. 요소 대기 (`wait_for_selector`)
특정 요소가 나타날 때까지 대기합니다.

**파라미터:**
- `selector` (필수): 대기할 요소의 CSS 셀렉터
- `timeout` (선택): 타임아웃 시간(밀리초) (기본값: 30000)
- `page_id` (선택): 대상 페이지 ID (기본값: "default")

**반환 정보:**
- 요소 출현 성공 메시지

**사용 사례:**
- 동적 콘텐츠 로딩 대기
- AJAX 요청 완료 대기
- SPA(Single Page Application) 탐색
- 느린 페이지 로딩 처리

### 9. 브라우저 종료 (`close_browser`)
브라우저 인스턴스를 종료합니다.

**파라미터:**
- `browser_id` (선택): 종료할 브라우저 인스턴스 ID (기본값: "default")

**반환 정보:**
- 브라우저 종료 성공 메시지

**사용 사례:**
- 작업 완료 후 리소스 정리
- 자동화 스크립트 종료
- 메모리 절약

## 요구사항

- **Node.js**: 18.0.0 이상
- **npm**: 8.0.0 이상
- **TypeScript**: 5.0.0 이상 (개발 시)

## 설치

```bash
npm install
```

## 빌드

```bash
npm run build
```

## 서버 실행

```bash
npm start
```

## 사용 예시

Claude Desktop 또는 다른 MCP 클라이언트의 설정 파일에 추가:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": ["/path/to/mcp-playwright-server/dist/index.js"]
    }
  }
}
```

## 여러 브라우저/페이지 관리

이 서버는 여러 브라우저 인스턴스와 페이지를 동시에 관리할 수 있습니다:

```
1. launch_browser(browser="chromium", browser_id="browser1")
2. launch_browser(browser="firefox", browser_id="browser2")
3. new_page(browser_id="browser1", page_id="page1")
4. new_page(browser_id="browser1", page_id="page2")
5. navigate(url="https://example.com", page_id="page1")
6. navigate(url="https://google.com", page_id="page2")
```

## 지원 브라우저

- **Chromium**: Google Chrome 기반 브라우저
- **Firefox**: Mozilla Firefox
- **WebKit**: Safari 기반 브라우저

## 주의사항

- 헤드리스 모드가 아닌 경우 브라우저 창이 표시됩니다
- 여러 인스턴스 사용 시 시스템 리소스에 주의하세요
- 작업 완료 후 반드시 `close_browser`로 리소스를 정리하세요
- CSS 셀렉터는 표준 CSS 선택자 문법을 따릅니다

## 버전

현재 버전: 1.0.0