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
    name: 'confluence-mcp-server',
    version: '0.1.0',
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
        name: 'search_confluence_content',
        description: '키워드로 Confluence 문서 검색',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: '검색할 키워드',
            },
            spaceKey: {
              type: 'string',
              description: '특정 스페이스로 검색 제한 (선택사항)',
            },
            limit: {
              type: 'number',
              description: '검색 결과 개수 제한 (기본값: 20)',
              default: 20,
            },
          },
          required: ['keyword'],
        },
      },
      {
        name: 'get_space_activity',
        description: '특정 스페이스의 일정 기간 내 활동 조회',
        inputSchema: {
          type: 'object',
          properties: {
            spaceKey: {
              type: 'string',
              description: 'Confluence 스페이스 키',
            },
            days: {
              type: 'number',
              description: '조회할 일수 (기본값: 7일)',
              default: 7,
            },
          },
          required: ['spaceKey'],
        },
      },
      {
        name: 'get_user_confluence_activity',
        description: '특정 사용자의 Confluence 활동 조회',
        inputSchema: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: 'Confluence 사용자명 또는 이메일',
            },
            days: {
              type: 'number',
              description: '조회할 일수 (기본값: 7일)',
              default: 7,
            },
            activityType: {
              type: 'string',
              description: '활동 유형 (created, updated, all)',
              enum: ['created', 'updated', 'all'],
              default: 'all',
            },
          },
          required: ['username'],
        },
      },
      {
        name: 'get_multiple_users_activity',
        description: '여러 사용자의 Confluence 활동 비교 분석',
        inputSchema: {
          type: 'object',
          properties: {
            usernames: {
              type: 'array',
              items: { type: 'string' },
              description: '사용자명 또는 이메일 목록',
            },
            days: {
              type: 'number',
              description: '조회할 일수 (기본값: 7일)',
              default: 7,
            },
            spaceKey: {
              type: 'string',
              description: '특정 스페이스로 제한 (선택사항)',
            },
          },
          required: ['usernames'],
        },
      },
      {
        name: 'analyze_knowledge_base_usage',
        description: '지식베이스 사용 패턴 분석',
        inputSchema: {
          type: 'object',
          properties: {
            spaceKey: {
              type: 'string',
              description: '분석할 스페이스 키 (선택사항)',
            },
            days: {
              type: 'number',
              description: '분석 기간 (기본값: 30일)',
              default: 30,
            },
            analysisType: {
              type: 'string',
              description: '분석 유형',
              enum: ['content-creation', 'user-engagement', 'popular-content', 'space-overview'],
              default: 'space-overview',
            },
          },
        },
      },
      {
        name: 'get_page_details',
        description: '특정 페이지의 상세 정보 및 댓글 조회',
        inputSchema: {
          type: 'object',
          properties: {
            pageId: {
              type: 'string',
              description: 'Confluence 페이지 ID',
            },
            includeComments: {
              type: 'boolean',
              description: '댓글 포함 여부 (기본값: true)',
              default: true,
            },
          },
          required: ['pageId'],
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
      case 'search_confluence_content':
        return await searchConfluenceContent(args.keyword, args.spaceKey, args.limit || 20);
      
      case 'get_space_activity':
        return await getSpaceActivity(args.spaceKey, args.days || 7);
      
      case 'get_user_confluence_activity':
        return await getUserConfluenceActivity(args.username, args.days || 7, args.activityType || 'all');
      
      case 'get_multiple_users_activity':
        return await getMultipleUsersActivity(args.usernames, args.days || 7, args.spaceKey);
      
      case 'analyze_knowledge_base_usage':
        return await analyzeKnowledgeBaseUsage(args.spaceKey, args.days || 30, args.analysisType || 'space-overview');
      
      case 'get_page_details':
        return await getPageDetails(args.pageId, args.includeComments !== false);
      
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

// Confluence API 설정
const CONFLUENCE_BASE_URL = process.env.CONFLUENCE_URL;
const CONFLUENCE_EMAIL = process.env.CONFLUENCE_EMAIL;
const CONFLUENCE_API_TOKEN = process.env.CONFLUENCE_API_TOKEN;

// Confluence API 클라이언트 설정
const confluenceClient = axios.create({
  baseURL: CONFLUENCE_BASE_URL,
  auth: {
    username: CONFLUENCE_EMAIL,
    password: CONFLUENCE_API_TOKEN,
  },
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// 1) 문서 검색 및 조회
async function searchConfluenceContent(keyword, spaceKey, limit) {
  try {
    let cql = `text ~ "${keyword}" AND type = page`;
    if (spaceKey) {
      cql += ` AND space = "${spaceKey}"`;
    }

    const response = await confluenceClient.get('/wiki/rest/api/content/search', {
      params: {
        cql: cql,
        expand: 'space,version,body.view',
        limit: limit,
      },
    });

    const results = response.data.results.map(page => ({
      id: page.id,
      title: page.title,
      space: page.space.name,
      spaceKey: page.space.key,
      url: `${CONFLUENCE_BASE_URL}/wiki${page._links.webui}`,
      lastModified: page.version.when,
      author: page.version.by.displayName,
      excerpt: extractExcerpt(page.body?.view?.value, keyword),
    }));

    return {
      content: [
        {
          type: 'text',
          text: `"${keyword}" 검색 결과 (총 ${results.length}개):\n\n` +
                results.map((page, index) => 
                  `${index + 1}. **${page.title}**\n` +
                  `   📁 스페이스: ${page.space} (${page.spaceKey})\n` +
                  `   👤 작성자: ${page.author}\n` +
                  `   📅 수정일: ${new Date(page.lastModified).toLocaleString('ko-KR')}\n` +
                  `   🔗 링크: ${page.url}\n` +
                  (page.excerpt ? `   📝 요약: ${page.excerpt}\n` : '') +
                  '\n'
                ).join(''),
        },
      ],
    };
  } catch (error) {
    throw new Error(`Confluence 검색 실패: ${error.response?.data?.message || error.message}`);
  }
}

// 2) 특정 스페이스 활동 조회
async function getSpaceActivity(spaceKey, days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // 최근 생성된 페이지
    const createdPages = await confluenceClient.get('/wiki/rest/api/content', {
      params: {
        spaceKey: spaceKey,
        expand: 'history,version',
        limit: 50,
        orderby: 'created',
      },
    });

    // 최근 수정된 페이지
    const updatedPages = await confluenceClient.get('/wiki/rest/api/content', {
      params: {
        spaceKey: spaceKey,
        expand: 'history,version',
        limit: 50,
        orderby: 'modified',
      },
    });

    const recentCreated = createdPages.data.results.filter(page => 
      new Date(page.history.createdDate) >= startDate
    );

    const recentUpdated = updatedPages.data.results.filter(page => 
      new Date(page.version.when) >= startDate && 
      new Date(page.history.createdDate) < startDate // 새로 생성이 아닌 업데이트만
    );

    // 활동 통계
    const stats = {
      totalCreated: recentCreated.length,
      totalUpdated: recentUpdated.length,
      activeUsers: new Set([
        ...recentCreated.map(p => p.history.createdBy.displayName),
        ...recentUpdated.map(p => p.version.by.displayName)
      ]).size,
    };

    return {
      content: [
        {
          type: 'text',
          text: `📊 ${spaceKey} 스페이스 최근 ${days}일 활동 요약:\n\n` +
                `**📈 활동 통계**\n` +
                `• 새로 생성된 페이지: ${stats.totalCreated}개\n` +
                `• 업데이트된 페이지: ${stats.totalUpdated}개\n` +
                `• 활동한 사용자: ${stats.activeUsers}명\n\n` +
                
                `**📄 최근 생성된 페이지 (${recentCreated.length}개):**\n` +
                recentCreated.slice(0, 10).map(page =>
                  `• ${page.title}\n` +
                  `  👤 ${page.history.createdBy.displayName} | ` +
                  `📅 ${new Date(page.history.createdDate).toLocaleString('ko-KR')}\n`
                ).join('') +
                
                `\n**✏️ 최근 업데이트된 페이지 (${recentUpdated.length}개):**\n` +
                recentUpdated.slice(0, 10).map(page =>
                  `• ${page.title}\n` +
                  `  👤 ${page.version.by.displayName} | ` +
                  `📅 ${new Date(page.version.when).toLocaleString('ko-KR')}\n`
                ).join(''),
        },
      ],
    };
  } catch (error) {
    throw new Error(`스페이스 활동 조회 실패: ${error.response?.data?.message || error.message}`);
  }
}

// 3) 특정 사용자 활동 조회
async function getUserConfluenceActivity(username, days, activityType) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const dateStr = startDate.toISOString().split('T')[0];

  try {
    let createdPages = [];
    let updatedPages = [];

    if (activityType === 'created' || activityType === 'all') {
      const createdResponse = await confluenceClient.get('/wiki/rest/api/content/search', {
        params: {
          cql: `creator = "${username}" AND created >= "${dateStr}"`,
          expand: 'space,version,history',
          limit: 100,
        },
      });
      createdPages = createdResponse.data.results;
    }

    if (activityType === 'updated' || activityType === 'all') {
      const updatedResponse = await confluenceClient.get('/wiki/rest/api/content/search', {
        params: {
          cql: `lastModified >= "${dateStr}"`,
          expand: 'space,version,history',
          limit: 100,
        },
      });
      updatedPages = updatedResponse.data.results.filter(page => 
        page.version.by.emailAddress === username || 
        page.version.by.displayName === username
      );
    }

    // 스페이스별 활동 분류
    const spaceActivity = {};
    [...createdPages, ...updatedPages].forEach(page => {
      const spaceKey = page.space.key;
      if (!spaceActivity[spaceKey]) {
        spaceActivity[spaceKey] = { spaceName: page.space.name, created: 0, updated: 0 };
      }
    });

    createdPages.forEach(page => {
      spaceActivity[page.space.key].created++;
    });

    updatedPages.forEach(page => {
      if (!createdPages.find(cp => cp.id === page.id)) {
        spaceActivity[page.space.key].updated++;
      }
    });

    return {
      content: [
        {
          type: 'text',
          text: `👤 ${username}님의 최근 ${days}일 Confluence 활동:\n\n` +
                `**📊 활동 요약**\n` +
                `• 생성한 페이지: ${createdPages.length}개\n` +
                `• 수정한 페이지: ${updatedPages.length}개\n` +
                `• 활동한 스페이스: ${Object.keys(spaceActivity).length}개\n\n` +
                
                `**📁 스페이스별 활동:**\n` +
                Object.entries(spaceActivity).map(([key, data]) =>
                  `• ${data.spaceName} (${key}): 생성 ${data.created}개, 수정 ${data.updated}개\n`
                ).join('') +
                
                `\n**📄 최근 생성한 페이지:**\n` +
                createdPages.slice(0, 10).map(page =>
                  `• ${page.title} (${page.space.name})\n` +
                  `  📅 ${new Date(page.history.createdDate).toLocaleString('ko-KR')}\n`
                ).join('') +
                
                `\n**✏️ 최근 수정한 페이지:**\n` +
                updatedPages.slice(0, 10).map(page =>
                  `• ${page.title} (${page.space.name})\n` +
                  `  📅 ${new Date(page.version.when).toLocaleString('ko-KR')}\n`
                ).join(''),
        },
      ],
    };
  } catch (error) {
    throw new Error(`사용자 활동 조회 실패: ${error.response?.data?.message || error.message}`);
  }
}

// 4) 여러 사용자 활동 비교
async function getMultipleUsersActivity(usernames, days, spaceKey) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const dateStr = startDate.toISOString().split('T')[0];

  try {
    const userActivities = {};

    for (const username of usernames) {
      let cql = `(creator = "${username}" OR lastModified >= "${dateStr}") AND created >= "${dateStr}"`;
      if (spaceKey) {
        cql += ` AND space = "${spaceKey}"`;
      }

      const response = await confluenceClient.get('/wiki/rest/api/content/search', {
        params: {
          cql: cql,
          expand: 'space,version,history',
          limit: 100,
        },
      });

      const created = response.data.results.filter(page => 
        page.history.createdBy.emailAddress === username || 
        page.history.createdBy.displayName === username
      );

      const updated = response.data.results.filter(page => 
        (page.version.by.emailAddress === username || page.version.by.displayName === username) &&
        !created.find(cp => cp.id === page.id)
      );

      userActivities[username] = {
        created: created.length,
        updated: updated.length,
        pages: [...created, ...updated],
      };
    }

    const totalStats = {
      totalCreated: Object.values(userActivities).reduce((sum, user) => sum + user.created, 0),
      totalUpdated: Object.values(userActivities).reduce((sum, user) => sum + user.updated, 0),
    };

    return {
      content: [
        {
          type: 'text',
          text: `👥 여러 사용자 활동 비교 (최근 ${days}일${spaceKey ? `, ${spaceKey} 스페이스` : ''}):\n\n` +
                `**📊 전체 요약**\n` +
                `• 총 생성된 페이지: ${totalStats.totalCreated}개\n` +
                `• 총 수정된 페이지: ${totalStats.totalUpdated}개\n` +
                `• 분석 대상 사용자: ${usernames.length}명\n\n` +
                
                `**👤 사용자별 활동:**\n` +
                Object.entries(userActivities).map(([username, activity]) =>
                  `• **${username}**\n` +
                  `  📄 생성: ${activity.created}개 | ✏️ 수정: ${activity.updated}개 | 📊 총 활동: ${activity.created + activity.updated}개\n`
                ).join('') +
                
                `\n**🏆 활동 순위:**\n` +
                Object.entries(userActivities)
                  .sort(([,a], [,b]) => (b.created + b.updated) - (a.created + a.updated))
                  .map(([username, activity], index) =>
                    `${index + 1}. ${username}: ${activity.created + activity.updated}개 활동\n`
                  ).join(''),
        },
      ],
    };
  } catch (error) {
    throw new Error(`다중 사용자 활동 조회 실패: ${error.response?.data?.message || error.message}`);
  }
}

// 5) 지식베이스 사용 패턴 분석
async function analyzeKnowledgeBaseUsage(spaceKey, days, analysisType) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    let cql = `created >= "${startDate.toISOString().split('T')[0]}" OR lastModified >= "${startDate.toISOString().split('T')[0]}"`;
    if (spaceKey) {
      cql += ` AND space = "${spaceKey}"`;
    }

    const response = await confluenceClient.get('/wiki/rest/api/content/search', {
      params: {
        cql: cql,
        expand: 'space,version,history',
        limit: 200,
      },
    });

    const pages = response.data.results;

    // 분석 데이터 구성
    const analysis = {
      totalPages: pages.length,
      spaces: {},
      users: {},
      dailyActivity: {},
    };

    pages.forEach(page => {
      // 스페이스별 분석
      const spaceKey = page.space.key;
      if (!analysis.spaces[spaceKey]) {
        analysis.spaces[spaceKey] = { name: page.space.name, count: 0, created: 0, updated: 0 };
      }
      analysis.spaces[spaceKey].count++;

      // 사용자별 분석
      const creator = page.history.createdBy.displayName;
      const updater = page.version.by.displayName;
      
      if (!analysis.users[creator]) analysis.users[creator] = { created: 0, updated: 0 };
      if (!analysis.users[updater]) analysis.users[updater] = { created: 0, updated: 0 };
      
      analysis.users[creator].created++;
      if (creator !== updater) {
        analysis.users[updater].updated++;
      }

      // 일별 활동
      const date = new Date(page.version.when).toISOString().split('T')[0];
      if (!analysis.dailyActivity[date]) analysis.dailyActivity[date] = 0;
      analysis.dailyActivity[date]++;
    });

    let resultText = `📊 지식베이스 사용 패턴 분석 (최근 ${days}일${spaceKey ? `, ${spaceKey} 스페이스` : ''}):\n\n`;

    switch (analysisType) {
      case 'content-creation':
        resultText += `**📝 콘텐츠 생성 패턴**\n` +
          `• 총 페이지 활동: ${analysis.totalPages}개\n` +
          `• 일평균 활동: ${(analysis.totalPages / days).toFixed(1)}개\n\n` +
          `**👤 가장 활발한 사용자들:**\n` +
          Object.entries(analysis.users)
            .sort(([,a], [,b]) => (b.created + b.updated) - (a.created + a.updated))
            .slice(0, 5)
            .map(([user, stats], index) =>
              `${index + 1}. ${user}: 생성 ${stats.created}개, 수정 ${stats.updated}개\n`
            ).join('');
        break;

      case 'user-engagement':
        const activeUsers = Object.keys(analysis.users).length;
        resultText += `**👥 사용자 참여도**\n` +
          `• 활동한 사용자 수: ${activeUsers}명\n` +
          `• 사용자당 평균 활동: ${(analysis.totalPages / activeUsers).toFixed(1)}개\n\n` +
          `**🏆 참여도 순위:**\n` +
          Object.entries(analysis.users)
            .map(([user, stats]) => [user, stats.created + stats.updated])
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([user, total], index) =>
              `${index + 1}. ${user}: ${total}개 활동\n`
            ).join('');
        break;

      case 'space-overview':
      default:
        resultText += `**📁 스페이스별 활동:**\n` +
          Object.entries(analysis.spaces)
            .sort(([,a], [,b]) => b.count - a.count)
            .map(([key, data]) =>
              `• ${data.name} (${key}): ${data.count}개 활동\n`
            ).join('') +
          
          `\n**📈 일별 활동 트렌드:**\n` +
          Object.entries(analysis.dailyActivity)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .slice(0, 7)
            .map(([date, count]) =>
              `• ${date}: ${count}개 활동\n`
            ).join('');
        break;
    }

    return {
      content: [{ type: 'text', text: resultText }],
    };
  } catch (error) {
    throw new Error(`지식베이스 분석 실패: ${error.response?.data?.message || error.message}`);
  }
}

// 6) 페이지 상세 정보 및 댓글 조회
async function getPageDetails(pageId, includeComments) {
  try {
    const pageResponse = await confluenceClient.get(`/wiki/rest/api/content/${pageId}`, {
      params: {
        expand: 'space,version,history,body.view',
      },
    });

    const page = pageResponse.data;
    let result = `📄 **페이지 상세 정보**\n\n` +
      `**제목:** ${page.title}\n` +
      `**스페이스:** ${page.space.name} (${page.space.key})\n` +
      `**작성자:** ${page.history.createdBy.displayName}\n` +
      `**생성일:** ${new Date(page.history.createdDate).toLocaleString('ko-KR')}\n` +
      `**최종 수정:** ${new Date(page.version.when).toLocaleString('ko-KR')} (${page.version.by.displayName})\n` +
      `**버전:** ${page.version.number}\n\n`;

    if (includeComments) {
      try {
        const commentsResponse = await confluenceClient.get(`/wiki/rest/api/content/${pageId}/child/comment`, {
          params: {
            expand: 'body.view,version',
            limit: 50,
          },
        });

        const comments = commentsResponse.data.results;
        result += `**💬 댓글 (${comments.length}개):**\n`;
        
        if (comments.length > 0) {
          comments.forEach((comment, index) => {
            const commentText = extractTextFromHtml(comment.body.view.value);
            result += `\n${index + 1}. **${comment.version.by.displayName}** (${new Date(comment.version.when).toLocaleString('ko-KR')})\n` +
              `   ${commentText.substring(0, 200)}${commentText.length > 200 ? '...' : ''}\n`;
          });
        } else {
          result += '\n댓글이 없습니다.\n';
        }
      } catch (commentError) {
        result += '\n💬 댓글 조회 중 오류가 발생했습니다.\n';
      }
    }

    return {
      content: [{ type: 'text', text: result }],
    };
  } catch (error) {
    throw new Error(`페이지 상세 조회 실패: ${error.response?.data?.message || error.message}`);
  }
}

// 유틸리티 함수들
function extractExcerpt(htmlContent, keyword) {
  if (!htmlContent) return '';
  
  const text = extractTextFromHtml(htmlContent);
  const keywordIndex = text.toLowerCase().indexOf(keyword.toLowerCase());
  
  if (keywordIndex === -1) return text.substring(0, 150) + '...';
  
  const start = Math.max(0, keywordIndex - 75);
  const end = Math.min(text.length, keywordIndex + keyword.length + 75);
  
  return '...' + text.substring(start, end) + '...';
}

function extractTextFromHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Confluence MCP Server running on stdio');
}

main().catch(console.error);