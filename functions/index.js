/**
 * EdgeFlow - 边缘工作流自动化引擎
 * 路径: /api/index
 */

const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const API_KEY = 'sk-54ae495d0e8e4dfb92607467bfcdf357'

export default async function handler(request) {
  const url = new URL(request.url)
  const path = url.pathname

  // CORS 处理
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Workflow-ID'
      }
    });
  }

  try {
    const apiPath = path.replace('/api', '')

    // 工作流执行
    if (apiPath === '/workflow/execute' && request.method === 'POST') {
      const result = await handleWorkflowExecute(request)
      return jsonResponse(result)
    }

    // AI 处理
    if (apiPath === '/ai/process' && request.method === 'POST') {
      const result = await handleAIProcess(request)
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
      const executions = getExecutionHistory()
      return jsonResponse({ success: true, executions })
    }

    // 健康检查
    if (apiPath === '/health') {
      return jsonResponse({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        edge: {
          location: request.headers.get('x-edge-node') || 'unknown',
          country: request.headers.get('x-geo-country') || 'unknown'
        }
      })
    }

    return jsonResponse({ error: 'API not found' }, 404)

  } catch (error) {
    console.error('Request error:', error)
    return jsonResponse({
      error: error.message || 'Internal server error'
    }, 500)
  }
}

// JSON 响应辅助函数
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

// 工作流执行
async function handleWorkflowExecute(request) {
  const { workflow, input } = await request.json()

  if (!workflow || !workflow.nodes) {
    return { success: false, error: '无效的工作流定义' }
  }

  const startTime = Date.now()
  const results = []

  // 简化的工作流执行逻辑
  for (const node of workflow.nodes) {
    const nodeResult = await executeNode(node, input)
    results.push({
      nodeId: node.id,
      nodeType: node.nodeType,
      result: nodeResult,
      timestamp: new Date().toISOString()
    })
  }

  return {
    success: true,
    workflowId: workflow.id,
    executionTime: Date.now() - startTime,
    results
  }
}

// 执行单个节点
async function executeNode(node, input) {
  switch (node.nodeType) {
    case 'WEBHOOK':
      return { triggered: true, data: input }
    case 'AI_CLASSIFY':
      return await classifyContent(input, node.config)
    case 'AI_GENERATE':
      return await generateContent(input, node.config)
    case 'FILTER':
      return { passed: true, data: input }
    case 'RESPONSE':
      return { statusCode: node.config?.statusCode || 200 }
    default:
      return { executed: true }
  }
}

// AI 处理
async function handleAIProcess(request) {
  const { action, data, config } = await request.json()

  switch (action) {
    case 'classify':
      return await classifyContent(data, config)
    case 'generate':
      return await generateContent(data, config)
    case 'summarize':
      return await summarizeContent(data, config)
    default:
      return { success: false, error: `未知 AI 操作: ${action}` }
  }
}

// 内容分类
async function classifyContent(data, config) {
  const categories = config?.categories || '类别A,类别B,类别C'
  const content = typeof data === 'string' ? data : (data.content || JSON.stringify(data))

  const prompt = `请将以下内容分类到这些类别之一：${categories}

内容：
${content}

请只回复类别名称。`

  const result = await callQwen(prompt)

  return {
    success: true,
    action: 'classify',
    classification: result.trim(),
    timestamp: new Date().toISOString()
  }
}

// 内容生成
async function generateContent(data, config) {
  const prompt = config?.prompt || '根据以下信息生成内容：'
  const fullPrompt = `${prompt}\n\n输入数据：\n${JSON.stringify(data, null, 2)}`

  const result = await callQwen(fullPrompt)

  return {
    success: true,
    action: 'generate',
    result: result,
    timestamp: new Date().toISOString()
  }
}

// 内容摘要
async function summarizeContent(data, config) {
  const content = typeof data === 'string' ? data : (data.content || JSON.stringify(data))
  const maxLength = config?.maxLength || 200

  const prompt = `请为以下内容生成一个简洁的摘要，不超过 ${maxLength} 字：

${content}`

  const result = await callQwen(prompt)

  return {
    success: true,
    action: 'summarize',
    summary: result.trim(),
    timestamp: new Date().toISOString()
  }
}

// 调用通义千问 API
async function callQwen(prompt) {
  try {
    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          { role: 'system', content: '你是一个专业的数据分析和内容处理助手。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''

  } catch (error) {
    console.error('Qwen API error:', error)
    throw error
  }
}

// 获取工作流模板
function getWorkflowTemplates() {
  return [
    {
      id: 'geo-redirect',
      name: '地理位置重定向',
      description: '根据访问者地理位置自动重定向到不同页面',
      category: '边缘能力'
    },
    {
      id: 'ai-content-filter',
      name: 'AI 内容过滤',
      description: '使用 AI 自动分类和过滤用户提交的内容',
      category: 'AI 能力'
    },
    {
      id: 'smart-cache',
      name: '智能边缘缓存',
      description: '根据请求特征智能缓存响应',
      category: '边缘能力'
    },
    {
      id: 'scheduled-report',
      name: '定时报告生成',
      description: '定时收集数据并使用 AI 生成报告',
      category: 'AI 能力'
    }
  ]
}

// 获取执行历史
function getExecutionHistory() {
  return [
    {
      id: 'exec-001',
      workflowId: 'wf-001',
      workflowName: '地理位置重定向',
      status: 'success',
      startTime: new Date(Date.now() - 3600000).toISOString(),
      duration: 1000,
      trigger: 'webhook'
    },
    {
      id: 'exec-002',
      workflowId: 'wf-002',
      workflowName: 'AI 内容过滤',
      status: 'success',
      startTime: new Date(Date.now() - 7200000).toISOString(),
      duration: 1500,
      trigger: 'webhook'
    }
  ]
}
