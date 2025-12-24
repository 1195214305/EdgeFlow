/**
 * EdgeFlow - 边缘工作流自动化引擎
 * 主入口 Edge Function
 */

import { handleWorkflowExecute } from './workflow/execute.js'
import { handleWorkflowWebhook } from './workflow/webhook.js'
import { handleAIProcess } from './edge/ai.js'
import { handleEdgeKV } from './edge/kv.js'

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Workflow-ID',
  'Access-Control-Max-Age': '86400'
}

// 路由处理
async function handleRequest(request, env, ctx) {
  const url = new URL(request.url)
  const path = url.pathname

  // CORS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // API 路由
    if (path.startsWith('/api/')) {
      const apiPath = path.replace('/api', '')

      // 工作流执行
      if (apiPath === '/workflow/execute' && request.method === 'POST') {
        const result = await handleWorkflowExecute(request, env)
        return jsonResponse(result)
      }

      // Webhook 触发
      if (apiPath.startsWith('/webhook/')) {
        const webhookId = apiPath.replace('/webhook/', '')
        const result = await handleWorkflowWebhook(request, env, webhookId)
        return jsonResponse(result)
      }

      // AI 处理
      if (apiPath === '/ai/process' && request.method === 'POST') {
        const result = await handleAIProcess(request, env)
        return jsonResponse(result)
      }

      // KV 操作
      if (apiPath.startsWith('/kv/')) {
        const result = await handleEdgeKV(request, env, apiPath)
        return jsonResponse(result)
      }

      // 工作流模板
      if (apiPath === '/templates' && request.method === 'GET') {
        return jsonResponse({
          success: true,
          templates: getWorkflowTemplates()
        })
      }

      // 执行历史
      if (apiPath === '/executions' && request.method === 'GET') {
        const executions = await getExecutionHistory(env)
        return jsonResponse({ success: true, executions })
      }

      // 健康检查
      if (apiPath === '/health') {
        return jsonResponse({
          success: true,
          status: 'healthy',
          timestamp: new Date().toISOString(),
          edge: {
            location: request.cf?.colo || 'unknown',
            country: request.cf?.country || 'unknown'
          }
        })
      }

      return jsonResponse({ error: 'API not found' }, 404)
    }

    // 静态文件回退到前端
    return env.ASSETS.fetch(request)

  } catch (error) {
    console.error('Request error:', error)
    return jsonResponse({
      error: error.message || 'Internal server error',
      stack: error.stack
    }, 500)
  }
}

// JSON 响应辅助函数
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  })
}

// 获取工作流模板
function getWorkflowTemplates() {
  return [
    {
      id: 'geo-redirect',
      name: '地理位置重定向',
      description: '根据访问者地理位置自动重定向到不同页面',
      category: '边缘能力',
      nodes: [
        { nodeType: 'GEO_TRIGGER', name: '地理触发', position: { x: 100, y: 100 }, config: { countries: 'CN', action: 'include' } },
        { nodeType: 'EDGE_REDIRECT', name: '重定向', position: { x: 400, y: 100 }, config: { url: 'https://cn.example.com', statusCode: '302' } }
      ],
      connections: [{ from: 0, to: 1 }]
    },
    {
      id: 'ai-content-filter',
      name: 'AI 内容过滤',
      description: '使用 AI 自动分类和过滤用户提交的内容',
      category: 'AI 能力',
      nodes: [
        { nodeType: 'WEBHOOK', name: '接收内容', position: { x: 100, y: 100 }, config: { path: '/content', method: 'POST' } },
        { nodeType: 'AI_CLASSIFY', name: 'AI 分类', position: { x: 400, y: 100 }, config: { categories: '正常,垃圾,违规', field: 'content' } },
        { nodeType: 'FILTER', name: '过滤违规', position: { x: 700, y: 100 }, config: { condition: 'result !== "违规"' } },
        { nodeType: 'RESPONSE', name: '返回结果', position: { x: 1000, y: 100 }, config: { statusCode: 200, contentType: 'application/json' } }
      ],
      connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }]
    },
    {
      id: 'smart-cache',
      name: '智能边缘缓存',
      description: '根据请求特征智能缓存响应',
      category: '边缘能力',
      nodes: [
        { nodeType: 'WEBHOOK', name: '接收请求', position: { x: 100, y: 100 }, config: { path: '/data', method: 'GET' } },
        { nodeType: 'EDGE_CACHE', name: '检查缓存', position: { x: 400, y: 100 }, config: { action: 'get', key: 'cache:${url}' } },
        { nodeType: 'HTTP_REQUEST', name: '获取数据', position: { x: 700, y: 200 }, config: { url: 'https://api.example.com/data', method: 'GET' } },
        { nodeType: 'EDGE_CACHE', name: '写入缓存', position: { x: 1000, y: 200 }, config: { action: 'set', key: 'cache:${url}', ttl: 3600 } },
        { nodeType: 'RESPONSE', name: '返回数据', position: { x: 1000, y: 100 }, config: { statusCode: 200, contentType: 'application/json' } }
      ],
      connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 }, { from: 1, to: 4 }]
    },
    {
      id: 'scheduled-report',
      name: '定时报告生成',
      description: '定时收集数据并使用 AI 生成报告',
      category: 'AI 能力',
      nodes: [
        { nodeType: 'SCHEDULE', name: '每日触发', position: { x: 100, y: 100 }, config: { cron: '0 9 * * *', timezone: 'Asia/Shanghai' } },
        { nodeType: 'HTTP_REQUEST', name: '获取数据', position: { x: 400, y: 100 }, config: { url: 'https://api.example.com/stats', method: 'GET' } },
        { nodeType: 'AI_GENERATE', name: 'AI 生成报告', position: { x: 700, y: 100 }, config: { prompt: '根据以下数据生成日报...', format: 'markdown' } },
        { nodeType: 'EMAIL', name: '发送邮件', position: { x: 1000, y: 100 }, config: { to: 'team@example.com', subject: '每日数据报告' } }
      ],
      connections: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }]
    }
  ]
}

// 获取执行历史
async function getExecutionHistory(env) {
  // 模拟执行历史数据
  return [
    {
      id: 'exec-001',
      workflowId: 'wf-001',
      workflowName: '地理位置重定向',
      status: 'success',
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() - 3599000).toISOString(),
      duration: 1000,
      trigger: 'webhook',
      nodesExecuted: 2
    },
    {
      id: 'exec-002',
      workflowId: 'wf-002',
      workflowName: 'AI 内容过滤',
      status: 'success',
      startTime: new Date(Date.now() - 7200000).toISOString(),
      endTime: new Date(Date.now() - 7198500).toISOString(),
      duration: 1500,
      trigger: 'webhook',
      nodesExecuted: 4
    },
    {
      id: 'exec-003',
      workflowId: 'wf-001',
      workflowName: '地理位置重定向',
      status: 'failed',
      startTime: new Date(Date.now() - 10800000).toISOString(),
      endTime: new Date(Date.now() - 10799500).toISOString(),
      duration: 500,
      trigger: 'webhook',
      nodesExecuted: 1,
      error: '目标 URL 无效'
    }
  ]
}

export default {
  fetch: handleRequest
}
