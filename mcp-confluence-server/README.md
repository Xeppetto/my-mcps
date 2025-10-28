# Confluence MCP Server

Atlassian Confluence와 상호작용하기 위한 Model Context Protocol (MCP) 서버입니다.

## 기능

이 MCP 서버는 Confluence API를 통해 다음 기능들을 제공합니다:

### 1. 문서 검색 (`search_confluence_content`)
키워드로 Confluence 문서를 검색합니다.

**파라미터:**
- `keyword` (필수): 검색할 키워드
- `spaceKey` (선택): 특정 스페이스로 검색 제한
- `limit` (선택): 검색 결과 개수 제한 (기본값: 20)

**반환 정보:**
- 페이지 제목, 스페이스, 작성자, 수정일
- 키워드가 포함된 내용 요약
- 페이지 링크

### 2. 스페이스 활동 조회 (`get_space_activity`)
특정 스페이스의 일정 기간 내 활동을 조회합니다.

**파라미터:**
- `spaceKey` (필수): Confluence 스페이스 키
- `days` (선택): 조회할 일수 (기본값: 7일)

**반환 정보:**
- 새로 생성된 페이지 수
- 업데이트된 페이지 수
- 활동한 사용자 수
- 최근 생성/업데이트된 페이지 목록

### 3. 사용자 활동 조회 (`get_user_confluence_activity`)
특정 사용자의 Confluence 활동을 조회합니다.

**파라미터:**
- `username` (필수): Confluence 사용자명 또는 이메일
- `days` (선택): 조회할 일수 (기본값: 7일)
- `activityType` (선택): 활동 유형 - `created`, `updated`, `all` (기본값: all)

**반환 정보:**
- 생성한 페이지 수 및 목록
- 수정한 페이지 수 및 목록
- 스페이스별 활동 통계

### 4. 여러 사용자 활동 비교 (`get_multiple_users_activity`)
여러 사용자의 Confluence 활동을 비교 분석합니다.

**파라미터:**
- `usernames` (필수): 사용자명 또는 이메일 목록 (배열)
- `days` (선택): 조회할 일수 (기본값: 7일)
- `spaceKey` (선택): 특정 스페이스로 제한

**반환 정보:**
- 사용자별 생성/수정 페이지 통계
- 활동 순위
- 전체 요약

### 5. 지식베이스 사용 패턴 분석 (`analyze_knowledge_base_usage`)
지식베이스 사용 패턴을 분석합니다.

**파라미터:**
- `spaceKey` (선택): 분석할 스페이스 키
- `days` (선택): 분석 기간 (기본값: 30일)
- `analysisType` (선택): 분석 유형
  - `content-creation`: 콘텐츠 생성 패턴
  - `user-engagement`: 사용자 참여도
  - `popular-content`: 인기 콘텐츠
  - `space-overview`: 스페이스 개요 (기본값)

**반환 정보:**
- 스페이스별 활동 통계
- 가장 활발한 사용자
- 일별 활동 트렌드
- 사용자 참여도 분석

### 6. 페이지 상세 정보 조회 (`get_page_details`)
특정 페이지의 상세 정보 및 댓글을 조회합니다.

**파라미터:**
- `pageId` (필수): Confluence 페이지 ID
- `includeComments` (선택): 댓글 포함 여부 (기본값: true)

**반환 정보:**
- 페이지 제목, 스페이스, 작성자, 생성일
- 최종 수정 정보
- 버전 정보
- 댓글 목록 (작성자, 작성일, 내용)

## 요구사항

- **Node.js**: 18.0.0 이상
- **npm**: 8.0.0 이상

## 설정

다음 환경 변수가 필요합니다:

```bash
CONFLUENCE_URL=https://your-domain.atlassian.net
CONFLUENCE_EMAIL=your-email@example.com
CONFLUENCE_API_TOKEN=your-api-token
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
    "confluence": {
      "command": "node",
      "args": ["/path/to/mcp-confluence-server/server.js"],
      "env": {
        "CONFLUENCE_URL": "https://your-domain.atlassian.net",
        "CONFLUENCE_EMAIL": "your-email@example.com",
        "CONFLUENCE_API_TOKEN": "your-api-token"
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

## 주의사항

- API 토큰은 절대 공개 저장소에 커밋하지 마세요
- 환경 변수 또는 보안 비밀 관리 도구를 사용하세요
- Confluence API 사용량 제한에 유의하세요
