# Jira MCP Server

Atlassian Jira와 상호작용하기 위한 Model Context Protocol (MCP) 서버입니다.

## 기능

이 MCP 서버는 Jira API를 통해 다음 기능들을 제공합니다:

### 1. 사용자 이슈 조회 (`get_user_issues`)
특정 사용자가 생성한 이슈를 조회합니다.

**파라미터:**
- `username` (필수): Jira 사용자명 또는 이메일
- `days` (선택): 조회할 일수 (기본값: 7일)

**반환 정보:**
- 이슈 키, 제목, 상태
- 우선순위, 이슈 유형
- 담당자, 보고자
- 생성일

**사용 사례:**
- 특정 팀원이 최근에 생성한 이슈 파악
- 사용자별 업무 활동 추적
- 보고서 작성을 위한 데이터 수집

### 2. 사용자 댓글 활동 조회 (`get_user_comments`)
특정 사용자가 댓글을 단 이슈들을 조회합니다.

**파라미터:**
- `username` (필수): Jira 사용자명 또는 이메일
- `days` (선택): 조회할 일수 (기본값: 7일)

**반환 정보:**
- 댓글을 단 이슈 목록
- 각 이슈의 상태
- 댓글 내용 및 작성 시간
- 총 댓글 수 및 이슈 수

**사용 사례:**
- 팀원의 협업 활동 모니터링
- 이슈 논의 참여도 확인
- 커뮤니케이션 패턴 분석

### 3. 이슈 댓글 상세 조회 (`get_issue_comments`)
특정 이슈의 모든 댓글을 상세히 조회합니다.

**파라미터:**
- `issueKey` (필수): 이슈 키 (예: PROJ-123)
- `username` (선택): 특정 사용자의 댓글만 필터링

**반환 정보:**
- 댓글 작성자 및 이메일
- 댓글 작성/수정 시간
- 댓글 전체 내용
- 댓글 ID

**사용 사례:**
- 이슈 토론 내용 확인
- 특정 사용자의 의견 추출
- 이슈 해결 과정 추적

### 4. JQL 이슈 검색 (`search_issues`)
JQL (Jira Query Language)을 사용하여 이슈를 검색합니다.

**파라미터:**
- `jql` (필수): JQL 쿼리 문자열
- `maxResults` (선택): 최대 결과 개수 (기본값: 50)

**반환 정보:**
- 이슈 키, 제목, 상태
- 우선순위, 담당자
- 생성일, 수정일

**JQL 예시:**
```
project = "MYPROJECT" AND status = "In Progress"
assignee = currentUser() AND created >= -7d
priority = High AND status != Done
```

**사용 사례:**
- 복잡한 조건으로 이슈 검색
- 커스텀 필터 적용
- 대시보드 데이터 수집

### 5. 이슈 상세 정보 조회 (`get_issue_details`)
특정 이슈의 모든 상세 정보를 조회합니다.

**파라미터:**
- `issueKey` (필수): 이슈 키 (예: PROJ-123)

**반환 정보:**
- 제목, 설명
- 상태, 우선순위, 유형
- 보고자, 담당자
- 생성일, 수정일, 해결일
- 컴포넌트, 레이블
- 이슈 링크

**사용 사례:**
- 이슈 전체 정보 확인
- 상태 및 진행 상황 파악
- 관련 메타데이터 수집

## 설정

다음 환경 변수가 필요합니다:

```bash
JIRA_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
```

## 설치

```bash
npm install
```

## 사용 예시

Claude Desktop 또는 다른 MCP 클라이언트의 설정 파일에 추가:

```json
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/path/to/mcp-jira-server/server.js"],
      "env": {
        "JIRA_URL": "https://your-domain.atlassian.net",
        "JIRA_EMAIL": "your-email@example.com",
        "JIRA_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

## API 토큰 생성

1. Atlassian 계정 설정으로 이동
2. Security → API tokens
3. Create API token
4. 토큰 이름 입력 후 생성
5. 생성된 토큰을 안전하게 보관

## JQL (Jira Query Language) 참고

JQL을 사용하면 강력한 검색이 가능합니다:

- `project = "MYPROJECT"` - 특정 프로젝트
- `assignee = currentUser()` - 현재 사용자에게 할당됨
- `status = "In Progress"` - 진행 중 상태
- `created >= -7d` - 최근 7일 이내 생성
- `priority = High` - 높은 우선순위
- `labels = "urgent"` - 특정 레이블

연산자: `AND`, `OR`, `NOT`, `=`, `!=`, `>`, `<`, `>=`, `<=`, `~` (contains)

## 주의사항

- API 토큰은 절대 공개 저장소에 커밋하지 마세요
- 환경 변수 또는 보안 비밀 관리 도구를 사용하세요
- Jira API 사용량 제한에 유의하세요
- 댓글 조회는 권한에 따라 제한될 수 있습니다

## 버전

현재 버전: 0.3.0
