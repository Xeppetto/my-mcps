# My MCP Servers

Model Context Protocol (MCP) 서버 모음입니다. 각 서버는 특정 서비스나 기능과 상호작용하기 위한 도구들을 제공합니다.

## 포함된 MCP 서버

### 1. [Confluence MCP Server](./mcp-confluence-server)

Atlassian Confluence와 상호작용하기 위한 MCP 서버입니다.

**주요 기능:**
- 📄 키워드로 Confluence 문서 검색
- 📊 스페이스 및 사용자 활동 조회
- 👥 여러 사용자 활동 비교 분석
- 📈 지식베이스 사용 패턴 분석
- 💬 페이지 상세 정보 및 댓글 조회

**사용 사례:** 팀 문서화 현황 파악, 지식베이스 활용도 분석, 협업 활동 추적

[상세 문서 보기 →](./mcp-confluence-server/README.md)

---

### 2. [Jira MCP Server](./mcp-jira-server)

Atlassian Jira와 상호작용하기 위한 MCP 서버입니다.

**주요 기능:**
- 🎫 사용자별 이슈 생성/수정 내역 조회
- 💬 댓글 활동 추적 및 분석
- 🔍 강력한 JQL 검색 지원
- 📋 이슈 상세 정보 조회
- 📊 팀 활동 모니터링

**사용 사례:** 프로젝트 진행 상황 파악, 팀원 업무 추적, 이슈 관리 자동화

[상세 문서 보기 →](./mcp-jira-server/README.md)

---

### 3. [Playwright MCP Server](./mcp-playwright-server)

Playwright를 사용한 브라우저 자동화 MCP 서버입니다.

**주요 기능:**
- 🌐 다중 브라우저 지원 (Chromium, Firefox, WebKit)
- 🖱️ 웹 페이지 탐색 및 요소 조작
- ⌨️ 폼 작성 및 데이터 입력
- 📸 스크린샷 캡처
- 📝 웹 페이지 데이터 추출
- ⏳ 동적 콘텐츠 대기 처리

**사용 사례:** 웹 스크래핑, 자동화된 테스트, 웹 애플리케이션 모니터링

[상세 문서 보기 →](./mcp-playwright-server/README.md)

---

## 설치 및 사용

각 서버는 독립적으로 설치하고 사용할 수 있습니다. 자세한 설치 방법과 설정은 각 서버의 README를 참고하세요.

### 공통 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 기본 설치 방법

```bash
# 특정 서버 디렉토리로 이동
cd mcp-confluence-server  # 또는 mcp-jira-server, mcp-playwright-server

# 의존성 설치
npm install

# 서버 실행 (각 서버마다 다를 수 있음)
npm start
```

## Claude Desktop에서 사용하기

Claude Desktop 설정 파일에 원하는 MCP 서버를 추가하세요:

```json
{
  "mcpServers": {
    "confluence": {
      "command": "node",
      "args": ["/path/to/mcp-confluence-server/server.js"],
      "env": {
        "CONFLUENCE_URL": "https://your-domain.atlassian.net",
        "CONFLUENCE_EMAIL": "your-email@example.com",
        "CONFLUENCE_API_TOKEN": "your-api-token"
      }
    },
    "jira": {
      "command": "node",
      "args": ["/path/to/mcp-jira-server/server.js"],
      "env": {
        "JIRA_URL": "https://your-domain.atlassian.net",
        "JIRA_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-api-token"
      }
    },
    "playwright": {
      "command": "node",
      "args": ["/path/to/mcp-playwright-server/dist/index.js"]
    }
  }
}
```

## 라이선스

각 서버의 라이선스는 해당 디렉토리를 참고하세요.

## 기여

이슈나 풀 리퀘스트는 언제든 환영합니다!
