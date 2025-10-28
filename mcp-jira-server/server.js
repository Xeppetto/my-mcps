#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// MCP 서버 인스턴스 생성
const server = new Server(
  {
    name: 'jira-mcp-server',
    version: '0.3.0', // 버전 업데이트
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 도구 목록 정의
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_user_issues',
        description: '특정 사용자가 생성한 이슈 조회',
        inputSchema: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: 'Jira 사용자명 또는 이메일',
            },
            days: {
              type: 'number',
              description: '조회할 일수 (기본값: 7일)',
              default: 7,
            },
          },
          required: ['username'],
        },
      },
      {
        name: 'get_user_comments',
        description: '특정 사용자가 댓글을 단 이슈들 조회',
        inputSchema: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: 'Jira 사용자명 또는 이메일',
            },
            days: {
              type: 'number',
              description: '조회할 일수 (기본값: 7일)',
              default: 7,
            },
          },
          required: ['username'],
        },
      },
      {
        name: 'get_issue_comments',
        description: '특정 이슈의 댓글 상세 조회',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: '이슈 키 (예: EZQA-1258)',
            },
            username: {
              type: 'string',
              description: '특정 사용자의 댓글만 필터링 (선택사항)',
            },
          },
          required: ['issueKey'],
        },
      },
      {
        name: 'search_issues',
        description: 'JQL을 사용한 이슈 검색',
        inputSchema: {
          type: 'object',
          properties: {
            jql: {
              type: 'string',
              description: 'JQL 쿼리 문자열',
            },
            maxResults: {
              type: 'number',
              description: '최대 결과 개수 (기본값: 50)',
              default: 50,
            },
          },
          required: ['jql'],
        },
      },
      {
        name: 'get_issue_details',
        description: '특정 이슈의 상세 정보 조회',
        inputSchema: {
          type: 'object',
          properties: {
            issueKey: {
              type: 'string',
              description: '이슈 키 (예: EZQA-1258)',
            },
          },
          required: ['issueKey'],
        },
      },
    ],
  };
});

// 도구 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_user_issues':
        return await getUserIssues(args.username, args.days || 7);
      
      case 'get_user_comments':
        return await getUserComments(args.username, args.days || 7);
      
      case 'get_issue_comments':
        return await getIssueComments(args.issueKey, args.username);
      
      case 'search_issues':
        return await searchIssues(args.jql, args.maxResults || 50);
      
      case 'get_issue_details':
        return await getIssueDetails(args.issueKey);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
    };
  }
});

// Jira API 설정
const JIRA_BASE_URL = process.env.JIRA_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

// Jira API 클라이언트 설정
const jiraClient = axios.create({
  baseURL: JIRA_BASE_URL,
  auth: {
    username: JIRA_EMAIL,
    password: JIRA_API_TOKEN,
  },
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// JQL 검색 공통 함수 - POST 방식 사용
async function searchWithJQL(jql, fields = null, maxResults = 50) {
  try {
    // GET 방식으로 JQL 검색
    const response = await jiraClient.get('/rest/api/3/search/jql', {
      params: {
        jql: jql,
        fields: fields ? fields.join(',') : 'key,summary,status,created,updated,priority,issuetype,assignee,reporter',
        maxResults: maxResults,
        startAt: 0
      }
    });
    return response;
  } catch (error) {
    throw error;
  }
}

// 사용자가 생성한 이슈 조회 함수
async function getUserIssues(username, days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const dateStr = startDate.toISOString().split('T')[0];

  try {
    let jql = `reporter = "${username}" AND created >= "${dateStr}"`;
    
    if (!username.includes('@')) {
      jql = `(reporter = "${username}" OR reporter.displayName ~ "${username}") AND created >= "${dateStr}"`;
    }

    const response = await searchWithJQL(
      jql, 
      ['key', 'summary', 'status', 'created', 'priority', 'issuetype', 'assignee', 'reporter'],
      100
    );

    const issues = response.data.issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.name || 'Unknown',
      created: issue.fields.created,
      priority: issue.fields.priority?.name || 'None',
      issueType: issue.fields.issuetype?.name || 'Unknown',
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      reporter: issue.fields.reporter?.displayName || username,
    }));

    return {
      content: [
        {
          type: 'text',
          text: `${username}님이 최근 ${days}일 동안 생성한 이슈 (총 ${issues.length}개):\n\n` +
                issues.map(issue => 
                  `• [${issue.key}] ${issue.summary}\n` +
                  `  상태: ${issue.status} | 우선순위: ${issue.priority} | 유형: ${issue.issueType}\n` +
                  `  담당자: ${issue.assignee} | 보고자: ${issue.reporter}\n` +
                  `  생성일: ${new Date(issue.created).toLocaleString('ko-KR')}\n`
                ).join('\n'),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error.response?.data?.errorMessages?.[0] || error.message;
    throw new Error(`Jira API 호출 실패: ${errorMessage}`);
  }
}

// JQL 검색 함수
async function searchIssues(jql, maxResults) {
  try {
    const response = await searchWithJQL(
      jql,
      ['key', 'summary', 'status', 'priority', 'assignee', 'created', 'updated'],
      maxResults
    );

    const issues = response.data.issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.name || 'Unknown',
      priority: issue.fields.priority?.name || 'None',
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      created: new Date(issue.fields.created).toLocaleString('ko-KR'),
      updated: new Date(issue.fields.updated).toLocaleString('ko-KR'),
    }));

    return {
      content: [
        {
          type: 'text',
          text: `🔍 **JQL 검색 결과** (총 ${issues.length}개):\n` +
                `쿼리: \`${jql}\`\n\n` +
                issues.map(issue =>
                  `📌 **[${issue.key}]** ${issue.summary}\n` +
                  `   상태: ${issue.status} | 우선순위: ${issue.priority}\n` +
                  `   담당자: ${issue.assignee}\n` +
                  `   생성: ${issue.created} | 수정: ${issue.updated}\n`
                ).join('\n'),
        },
      ],
    };
  } catch (error) {
    throw new Error(`JQL 검색 실패: ${error.response?.data?.errorMessages?.[0] || error.message}`);
  }
}

// 이슈 상세 조회 함수
async function getIssueDetails(issueKey) {
  try {
    const response = await jiraClient.get(`/rest/api/3/issue/${issueKey}`, {
      params: {
        expand: 'renderedFields,names,schema,transitions,operations,editmeta,changelog',
      },
    });

    const issue = response.data;
    const fields = issue.fields;

    return {
      content: [
        {
          type: 'text',
          text: `📋 **이슈 상세 정보: ${issueKey}**\n\n` +
                `**제목**: ${fields.summary}\n` +
                `**설명**: ${extractDescription(fields.description)}\n\n` +
                `**기본 정보**:\n` +
                `• 상태: ${fields.status?.name || 'Unknown'}\n` +
                `• 우선순위: ${fields.priority?.name || 'None'}\n` +
                `• 유형: ${fields.issuetype?.name || 'Unknown'}\n` +
                `• 보고자: ${fields.reporter?.displayName || 'Unknown'}\n` +
                `• 담당자: ${fields.assignee?.displayName || 'Unassigned'}\n\n` +
                `**일정**:\n` +
                `• 생성일: ${new Date(fields.created).toLocaleString('ko-KR')}\n` +
                `• 수정일: ${new Date(fields.updated).toLocaleString('ko-KR')}\n` +
                `• 해결일: ${fields.resolutiondate ? new Date(fields.resolutiondate).toLocaleString('ko-KR') : '미해결'}\n\n` +
                `**추가 정보**:\n` +
                `• 컴포넌트: ${fields.components?.map(c => c.name).join(', ') || '없음'}\n` +
                `• 레이블: ${fields.labels?.join(', ') || '없음'}\n` +
                `• 링크: ${JIRA_BASE_URL}/browse/${issueKey}`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`이슈 상세 조회 실패: ${error.response?.data?.errorMessages?.[0] || error.message}`);
  }
}

// 설명 필드 텍스트 추출 함수
function extractDescription(description) {
  if (!description) return '설명 없음';
  
  if (typeof description === 'string') {
    return description.substring(0, 500) + (description.length > 500 ? '...' : '');
  }
  
  if (description?.content) {
    const text = extractTextFromADF(description.content);
    return text.substring(0, 500) + (text.length > 500 ? '...' : '');
  }
  
  return '설명 형식을 파싱할 수 없음';
}

// 사용자가 댓글을 단 이슈 조회 함수
async function getUserComments(username, days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const dateStr = startDate.toISOString().split('T')[0];

  try {
    console.error(`댓글 조회 시도: ${username}, ${days}일`);
    
    let commentDetails = [];
    let searchApproach = 'comment-search';
    
    try {
      // comment ~ 연산자 사용
      let jql = `comment ~ "${username}" AND updated >= "${dateStr}"`;
      
      if (!username.includes('@')) {
        jql = `(comment ~ "${username}") AND updated >= "${dateStr}"`;
      }
      
      const response = await searchWithJQL(
        jql,
        ['key', 'summary', 'status', 'updated'],
        50
      );
      
      console.error(`comment 필드 사용 성공: ${response.data.issues.length}개 이슈`);
      commentDetails = await processIssuesForComments(response.data.issues, username, startDate);
      
    } catch (commentError) {
      console.error(`comment 필드 사용 실패: ${commentError.message}`);
      
      // 대안: 최근 업데이트된 이슈에서 수동 필터링
      searchApproach = 'manual-filter';
      const response = await searchWithJQL(
        `updated >= "${dateStr}" ORDER BY updated DESC`,
        ['key', 'summary', 'status', 'updated'],
        100
      );
      
      console.error(`대안 방법 사용: ${response.data.issues.length}개 이슈 검토`);
      commentDetails = await processIssuesForComments(response.data.issues, username, startDate);
    }

    const totalComments = commentDetails.reduce((sum, issue) => sum + issue.comments.length, 0);

    return {
      content: [
        {
          type: 'text',
          text: `${username}님의 최근 ${days}일 댓글 활동:\n\n` +
                `📊 **요약**: ${commentDetails.length}개 이슈, ${totalComments}개 댓글\n\n` +
                (commentDetails.length > 0 ? 
                  commentDetails.map(issue => 
                    `🎫 **[${issue.issueKey}]** ${issue.issueSummary}\n` +
                    `   📋 상태: ${issue.issueStatus}\n` +
                    issue.comments.map(comment => 
                      `   💬 ${new Date(comment.created).toLocaleString('ko-KR')}\n` +
                      `      "${comment.body.substring(0, 200)}${comment.body.length > 200 ? '...' : ''}"\n`
                    ).join('') + '\n'
                  ).join('') :
                  '이 기간 동안 댓글 활동이 없습니다.\n'
                ),
        },
      ],
    };
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 403) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ 댓글 조회 권한 부족\n\n` +
                  `**문제**: ${error.response?.data?.errorMessages?.[0] || error.message}\n\n` +
                  `**대안**: 개별 이슈 상세 조회를 통해 댓글 확인 가능합니다.`,
          },
        ],
      };
    }
    throw new Error(`Jira API 호출 실패: ${error.response?.data?.errorMessages || error.message}`);
  }
}

// 이슈들에서 특정 사용자의 댓글 추출
async function processIssuesForComments(issues, username, startDate) {
  const commentDetails = [];
  
  for (const issue of issues.slice(0, 20)) {
    try {
      const commentsResponse = await jiraClient.get(`/rest/api/3/issue/${issue.key}/comment`, {
        params: {
          orderBy: '-created',
          maxResults: 50,
        },
      });
      
      const userComments = commentsResponse.data.comments.filter(comment => {
        const commentDate = new Date(comment.created);
        const commentAuthor = comment.author?.emailAddress || comment.author?.displayName || '';
        
        return commentDate >= startDate && 
               (commentAuthor === username || 
                commentAuthor.toLowerCase().includes(username.toLowerCase()) ||
                comment.author?.displayName === username);
      });

      if (userComments.length > 0) {
        commentDetails.push({
          issueKey: issue.key,
          issueSummary: issue.fields.summary,
          issueStatus: issue.fields.status.name,
          comments: userComments.map(comment => ({
            body: extractCommentText(comment.body),
            created: comment.created,
            author: comment.author?.displayName || 'Unknown',
          })),
        });
      }
    } catch (commentError) {
      console.error(`이슈 ${issue.key} 댓글 조회 실패:`, commentError.message);
      continue;
    }
  }
  
  return commentDetails;
}

// 댓글 본문 텍스트 추출
function extractCommentText(commentBody) {
  if (typeof commentBody === 'string') {
    return commentBody;
  }
  
  if (commentBody?.content) {
    return extractTextFromADF(commentBody.content);
  }
  
  return JSON.stringify(commentBody);
}

// ADF에서 텍스트 추출
function extractTextFromADF(content) {
  let text = '';
  
  if (Array.isArray(content)) {
    content.forEach(node => {
      if (node.type === 'paragraph' && node.content) {
        node.content.forEach(textNode => {
          if (textNode.type === 'text' && textNode.text) {
            text += textNode.text + ' ';
          }
        });
      } else if (node.type === 'text' && node.text) {
        text += node.text + ' ';
      } else if (node.content) {
        text += extractTextFromADF(node.content) + ' ';
      }
    });
  }
  
  return text.trim() || '(텍스트 추출 실패)';
}

// 특정 이슈의 댓글 상세 조회
async function getIssueComments(issueKey, username) {
  try {
    const commentsResponse = await jiraClient.get(`/rest/api/3/issue/${issueKey}/comment`, {
      params: {
        orderBy: '-created',
        maxResults: 100,
      },
    });

    let comments = commentsResponse.data.comments;
    
    if (username) {
      comments = comments.filter(comment => {
        const author = comment.author?.emailAddress || comment.author?.displayName || '';
        return author === username || 
               author.toLowerCase().includes(username.toLowerCase()) ||
               comment.author?.displayName === username;
      });
    }

    const commentDetails = comments.map(comment => ({
      id: comment.id,
      author: comment.author?.displayName || 'Unknown',
      authorEmail: comment.author?.emailAddress || '',
      created: comment.created,
      updated: comment.updated,
      body: extractCommentText(comment.body),
    }));

    return {
      content: [
        {
          type: 'text',
          text: `🎫 **이슈 ${issueKey} 댓글 조회** ${username ? `(${username} 사용자만)` : ''}\n\n` +
                `📊 **총 ${commentDetails.length}개 댓글**\n\n` +
                (commentDetails.length > 0 ?
                  commentDetails.map((comment, index) =>
                    `**${index + 1}. ${comment.author}** (${comment.authorEmail})\n` +
                    `📅 작성: ${new Date(comment.created).toLocaleString('ko-KR')}\n` +
                    `${comment.updated !== comment.created ? `📝 수정: ${new Date(comment.updated).toLocaleString('ko-KR')}\n` : ''}` +
                    `💬 내용: ${comment.body}\n\n`
                  ).join('') :
                  '댓글이 없습니다.\n'
                ),
        },
      ],
    };
  } catch (error) {
    throw new Error(`이슈 댓글 조회 실패: ${error.response?.data?.errorMessages || error.message}`);
  }
}

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Jira MCP Server v0.3.0 running - Using POST method for JQL searches');
}

main().catch(console.error);