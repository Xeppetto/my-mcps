# Confluence MCP Server

AI 도구에 MCP로 연동하는 Atlassian Confluence 서버입니다.

MCP를 이용하면 AI 도구에서 LLM이 이해할 수 있는 방식으로 인간의 언어(자연어)로 입력하면 AI 도구가 Confluence 페이지를 검색하고 추출하여 답변을 가져와 보여주게 됩니다. 인간의 활동이 '접속 > 검색 > 읽기' 였던 것에 비해 훨씬 빠르고 간편하게 정보를 받아볼 수 있습니다. Atlassian은 다양한 [Confluence API](https://developer.atlassian.com/cloud/confluence/rest/v2/)를 제공하지만, 비개발자들이 사용하기에는 복잡합니다. MCP를 활용하면 사용자는 자연어로만 입력하여 정보를 가져올 수 있습니다.
<br>

## 활용 방법

1. 문서 검색 및 요약

   > React, TypeScript 관련한 OJT 문서가 있는 지 검색하여 알려주세요.

   > {검색 쿼리} 관련 문서들을 Confluence에서 찾인 후 핵심 내용을 요약해 주세요. 핵심 내용 별로 실제 내용이 담긴 페이지의 링크롤 reference 형식으로 제공해주세요.

   > {Jira-1234} 관련 문서가 Confluence에 있는지 확인 하고 내용을 요약해 주세요. 해당 페이지의 문서 링크도 제공해주세요.

   > {Jira Project 이름}과 관련된 문서 전체를 Confluence에서 검색하여 알려주세요.

2. 문서의 활용도 확인

   > Confluence 문서 중 작성한 지 6개월 이상, 마지막 접속이 3개월 이상된 문서들의 목록을 링크로 제공해주세요.

   > 최근 댓글들을 30개 추출해주세요.

   > 우리 팀({email1}, {email2}, {email3})이 페이지 생성, 수정, 댓글, 삭제 등 현재 활동 중인 Space 목록을 알려주세요.

3. 문서 비교 및 취합

   > {페이지 URI}와 비슷한 내용이 담긴 다른 페이지가 있는 지 확인하고 링크를 제공해 주세요.

   > {페이지 URI1}과 {페이지 URI2}를 취합하려고 해요. 취합 내용을 제안해 주세요.

4. 활동 보고

   > 우리 팀({email1}, {email2}, {email3})이 지난 한 달 간 작성, 수정, 댓글 등 활동한 내용들이 어떤 Space에서 어떤 내용으로 진행되었는 지 등 요약해주세요.

   > 내가 지난 분기(4월~6월) 동안 작성, 수정, 댓글 등 활동한 내용들을 전체 목록으로 제공 및 링크를 제공해주세요.

   > 지난 달 '스프린트 회고' 회의록들을 모두 찾아주고, 주요 논의 사항과 액션 아이템을 정리해 주세요. 액션 아이템 중 Confluence에 비슷한 내용이 있는 경우 링크를 제공해 주세요.

<br>

## Confluence MCP 주요 기능

Confluence MCP 서버는 Confluence API를 통해 다음 기능들을 제공합니다. 아래는 개발자들을 위한 정보이므로, 상세한 API 별 파라미터들의 사용 사례에 대해 알고 싶으신 경우 확인해 주세요.

#### 1. `search_confluence_content`

**(1) 개요 :** 키워드로 Confluence 문서를 검색합니다.

**(2) 파라미터:**

- `keyword` (필수): 검색할 키워드
- `spaceKey` (선택): 특정 스페이스로 검색 제한
- `limit` (선택): 검색 결과 개수 제한 (기본값: 20)

**(3) 반환 정보:**

- 페이지 제목, 스페이스, 작성자, 수정일
- 키워드가 포함된 내용 요약
- 페이지 링크

#### 2. `get_space_activity`

**(1) 개요 :** 특정 스페이스의 일정 기간 내 활동을 조회합니다.

**(2) 파라미터:**

- `spaceKey` (필수): Confluence 스페이스 키
- `days` (선택): 조회할 일수 (기본값: 7일)

**(3) 반환 정보:**

- 새로 생성된 페이지 수
- 업데이트된 페이지 수
- 활동한 사용자 수
- 최근 생성/업데이트된 페이지 목록

#### 3. `get_user_confluence_activity`

**(1) 개요 :** 특정 사용자의 Confluence 활동을 조회합니다.

**(2) 파라미터:**

- `username` (필수): Confluence 사용자명 또는 이메일
- `days` (선택): 조회할 일수 (기본값: 7일)
- `activityType` (선택): 활동 유형 - `created`, `updated`, `all` (기본값: all)

**(3) 반환 정보:**

- 생성한 페이지 수 및 목록
- 수정한 페이지 수 및 목록
- 스페이스별 활동 통계

#### 4. `get_multiple_users_activity`

**(1) 개요 :** 여러 사용자의 Confluence 활동을 비교 분석합니다.

**(2) 파라미터:**

- `usernames` (필수): 사용자명 또는 이메일 목록 (배열)
- `days` (선택): 조회할 일수 (기본값: 7일)
- `spaceKey` (선택): 특정 스페이스로 제한

**(3) 반환 정보:**

- 사용자별 생성/수정 페이지 통계
- 활동 순위
- 전체 요약

#### 5. `analyze_knowledge_base_usage`

**(1) 개요 :** 지식베이스 사용 패턴을 분석합니다.

**(2) 파라미터:**

- `spaceKey` (선택): 분석할 스페이스 키
- `days` (선택): 분석 기간 (기본값: 30일)
- `analysisType` (선택): 분석 유형
  - `content-creation`: 콘텐츠 생성 패턴
  - `user-engagement`: 사용자 참여도
  - `popular-content`: 인기 콘텐츠
  - `space-overview`: 스페이스 개요 (기본값)

**(3) 반환 정보:**

- 스페이스별 활동 통계
- 가장 활발한 사용자
- 일별 활동 트렌드
- 사용자 참여도 분석

#### 6. `get_page_details`

**(1) 개요 :** 특정 페이지의 상세 정보 및 댓글을 조회합니다.

**(2) 파라미터:**

- `pageId` (필수): Confluence 페이지 ID
- `includeComments` (선택): 댓글 포함 여부 (기본값: true)

**(3) 반환 정보:**

- 페이지 제목, 스페이스, 작성자, 생성일
- 최종 수정 정보
- 버전 정보
- 댓글 목록 (작성자, 작성일, 내용)

<br>

## 설정 및 확인

1. Confluence 환경 변수 확인하여 입력

   ```bash
   CONFLUENCE_URL=https://your-domain.atlassian.net
   CONFLUENCE_EMAIL=your-email@example.com
   CONFLUENCE_API_TOKEN=your-api-token
   ```

2. MCP config 설정

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

3. LLM 도구에서 MCP 연동 확인 요청

   > Confluence MCP 연동되었는지 확인해 주세요.

<br>

## 참고 : API 토큰 생성

1. Atlassian 계정 설정으로 이동
2. Security → API tokens
3. Create API token
4. 토큰 이름 입력 후 생성
5. 생성된 토큰을 안전하게 보관

## 주의사항

- API 토큰은 절대 공개 저장소에 커밋하지 마세요.
- 환경 변수 또는 보안 비밀 관리 도구를 사용하세요.
- Confluence API 사용량 제한에 유의하세요.
