/**
 * Webhook 触发处理
 */

export async function handleWorkflowWebhook(request, env, webhookId) {
  // 获取请求数据
  let triggerData = {}

  if (request.method === 'POST' || request.method === 'PUT') {
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      try {
        triggerData = await request.json()
      } catch (e) {
        triggerData = { body: await request.text() }
      }
    } else if (contentType.includes('form')) {
      const formData = await request.formData()
      triggerData = Object.fromEntries(formData)
    } else {
      triggerData = { body: await request.text() }
    }
  }

  // 添加请求元数据
  const url = new URL(request.url)
  triggerData._meta = {
    webhookId,
    method: request.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    headers: Object.fromEntries(request.headers),
    timestamp: new Date().toISOString(),
    cf: request.cf || {}
  }

  // 查找对应的工作流（这里简化处理，实际应从 KV 存储获取）
  const workflow = await findWorkflowByWebhook(env, webhookId)

  if (!workflow) {
    return {
      success: false,
      error: `未找到 Webhook ID: ${webhookId} 对应的工作流`
    }
  }

  // 导入执行引擎
  const { handleWorkflowExecute } = await import('./execute.js')

  // 创建模拟请求
  const executeRequest = new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflow,
      triggerData
    })
  })

  return handleWorkflowExecute(executeRequest, env)
}

/**
 * 根据 Webhook ID 查找工作流
 */
async function findWorkflowByWebhook(env, webhookId) {
  // 模拟工作流数据（实际应从 KV 存储获取）
  const mockWorkflows = {
    'demo-webhook': {
      id: 'wf-demo',
      name: '演示工作流',
      nodes: [
        {
          id: 'node-1',
          nodeType: 'WEBHOOK',
          name: '接收请求',
          position: { x: 100, y: 100 },
          config: { path: '/demo', method: 'POST' }
        },
        {
          id: 'node-2',
          nodeType: 'TRANSFORM',
          name: '数据转换',
          position: { x: 400, y: 100 },
          config: { expression: '{ ...data, processed: true }', outputKey: 'result' }
        },
        {
          id: 'node-3',
          nodeType: 'RESPONSE',
          name: '返回结果',
          position: { x: 700, y: 100 },
          config: { statusCode: 200, contentType: 'application/json' }
        }
      ],
      connections: [
        { from: 'node-1', to: 'node-2' },
        { from: 'node-2', to: 'node-3' }
      ]
    }
  }

  return mockWorkflows[webhookId] || null
}

/**
 * 注册 Webhook
 */
export async function registerWebhook(env, workflowId, config) {
  const webhookId = `wh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // 存储 Webhook 配置（实际应存储到 KV）
  const webhookData = {
    id: webhookId,
    workflowId,
    path: config.path || `/webhook/${webhookId}`,
    method: config.method || 'POST',
    auth: config.auth || false,
    createdAt: new Date().toISOString()
  }

  return {
    success: true,
    webhook: webhookData,
    url: `https://edgeflow.example.com/api/webhook/${webhookId}`
  }
}

/**
 * 验证 Webhook 认证
 */
export function validateWebhookAuth(request, config) {
  if (!config.auth) return true

  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return false

  // 简单的 Bearer Token 验证
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    return token === config.apiKey
  }

  return false
}
