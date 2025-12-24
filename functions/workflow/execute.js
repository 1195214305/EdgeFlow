/**
 * 工作流执行引擎
 */

// 节点执行器映射
const nodeExecutors = {
  // 触发器
  WEBHOOK: executeWebhookTrigger,
  SCHEDULE: executeScheduleTrigger,
  GEO_TRIGGER: executeGeoTrigger,

  // 数据处理
  TRANSFORM: executeTransform,
  FILTER: executeFilter,
  MERGE: executeMerge,

  // AI 能力
  AI_ANALYZE: executeAIAnalyze,
  AI_GENERATE: executeAIGenerate,
  AI_CLASSIFY: executeAIClassify,

  // 边缘能力
  EDGE_CACHE: executeEdgeCache,
  EDGE_KV: executeEdgeKV,
  EDGE_REDIRECT: executeEdgeRedirect,

  // 输出动作
  HTTP_REQUEST: executeHttpRequest,
  EMAIL: executeEmail,
  RESPONSE: executeResponse
}

/**
 * 执行工作流
 */
export async function handleWorkflowExecute(request, env) {
  const { workflow, triggerData } = await request.json()

  if (!workflow || !workflow.nodes || workflow.nodes.length === 0) {
    return { success: false, error: '工作流无效' }
  }

  const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const startTime = Date.now()

  const context = {
    executionId,
    workflow,
    env,
    request,
    data: triggerData || {},
    results: {},
    logs: []
  }

  try {
    // 构建执行图
    const executionOrder = buildExecutionOrder(workflow)

    // 按顺序执行节点
    for (const nodeId of executionOrder) {
      const node = workflow.nodes.find(n => n.id === nodeId)
      if (!node) continue

      context.logs.push({
        nodeId,
        nodeName: node.name,
        status: 'started',
        timestamp: new Date().toISOString()
      })

      try {
        const executor = nodeExecutors[node.nodeType]
        if (!executor) {
          throw new Error(`未知节点类型: ${node.nodeType}`)
        }

        const result = await executor(node, context)
        context.results[nodeId] = result
        context.data = { ...context.data, ...result }

        context.logs.push({
          nodeId,
          nodeName: node.name,
          status: 'completed',
          result,
          timestamp: new Date().toISOString()
        })

        // 检查是否需要提前终止
        if (result?._terminate) {
          break
        }
      } catch (nodeError) {
        context.logs.push({
          nodeId,
          nodeName: node.name,
          status: 'failed',
          error: nodeError.message,
          timestamp: new Date().toISOString()
        })
        throw nodeError
      }
    }

    const endTime = Date.now()

    return {
      success: true,
      executionId,
      duration: endTime - startTime,
      results: context.results,
      logs: context.logs,
      finalData: context.data
    }

  } catch (error) {
    return {
      success: false,
      executionId,
      error: error.message,
      logs: context.logs
    }
  }
}

/**
 * 构建执行顺序（拓扑排序）
 */
function buildExecutionOrder(workflow) {
  const { nodes, connections } = workflow
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const inDegree = new Map()
  const adjacency = new Map()

  // 初始化
  nodes.forEach(node => {
    inDegree.set(node.id, 0)
    adjacency.set(node.id, [])
  })

  // 构建邻接表和入度
  connections.forEach(conn => {
    adjacency.get(conn.from)?.push(conn.to)
    inDegree.set(conn.to, (inDegree.get(conn.to) || 0) + 1)
  })

  // 拓扑排序
  const queue = []
  const result = []

  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId)
  })

  while (queue.length > 0) {
    const nodeId = queue.shift()
    result.push(nodeId)

    adjacency.get(nodeId)?.forEach(nextId => {
      const newDegree = inDegree.get(nextId) - 1
      inDegree.set(nextId, newDegree)
      if (newDegree === 0) queue.push(nextId)
    })
  }

  return result
}

// ============ 节点执行器实现 ============

async function executeWebhookTrigger(node, context) {
  return {
    triggered: true,
    method: context.request.method,
    headers: Object.fromEntries(context.request.headers),
    body: context.data
  }
}

async function executeScheduleTrigger(node, context) {
  return {
    triggered: true,
    scheduledTime: new Date().toISOString(),
    cron: node.config?.cron
  }
}

async function executeGeoTrigger(node, context) {
  const cf = context.request.cf || {}
  const country = cf.country || 'unknown'
  const targetCountries = (node.config?.countries || '').split(',').map(c => c.trim())
  const action = node.config?.action || 'include'

  const isMatch = action === 'include'
    ? targetCountries.includes(country)
    : !targetCountries.includes(country)

  return {
    triggered: isMatch,
    country,
    city: cf.city,
    continent: cf.continent,
    latitude: cf.latitude,
    longitude: cf.longitude
  }
}

async function executeTransform(node, context) {
  const expression = node.config?.expression || 'data'
  const outputKey = node.config?.outputKey || 'transformed'

  try {
    const fn = new Function('data', `return ${expression}`)
    const result = fn(context.data)
    return { [outputKey]: result }
  } catch (error) {
    throw new Error(`转换失败: ${error.message}`)
  }
}

async function executeFilter(node, context) {
  const condition = node.config?.condition || 'true'

  try {
    const fn = new Function('item', 'data', `return ${condition}`)
    const passed = fn(context.data, context.data)
    return { passed, _terminate: !passed }
  } catch (error) {
    throw new Error(`过滤条件错误: ${error.message}`)
  }
}

async function executeMerge(node, context) {
  const strategy = node.config?.strategy || 'merge'
  const inputs = Object.values(context.results)

  switch (strategy) {
    case 'concat':
      return { merged: inputs.flat() }
    case 'merge':
      return { merged: Object.assign({}, ...inputs) }
    case 'zip':
      return { merged: inputs }
    default:
      return { merged: inputs }
  }
}

async function executeAIAnalyze(node, context) {
  const prompt = node.config?.prompt || '分析以下数据'
  const model = node.config?.model || 'qwen-turbo'

  const response = await callQwenAPI(context.env, model, `${prompt}\n\n数据: ${JSON.stringify(context.data)}`)
  return { analysis: response }
}

async function executeAIGenerate(node, context) {
  const prompt = node.config?.prompt || '生成内容'
  const format = node.config?.format || 'text'
  const model = 'qwen-turbo'

  let fullPrompt = `${prompt}\n\n输入数据: ${JSON.stringify(context.data)}`
  if (format === 'json') {
    fullPrompt += '\n\n请以 JSON 格式输出'
  } else if (format === 'markdown') {
    fullPrompt += '\n\n请以 Markdown 格式输出'
  }

  const response = await callQwenAPI(context.env, model, fullPrompt)
  return { generated: response, format }
}

async function executeAIClassify(node, context) {
  const categories = node.config?.categories || '类别A,类别B'
  const field = node.config?.field || 'content'
  const content = context.data[field] || JSON.stringify(context.data)

  const prompt = `请将以下内容分类到这些类别之一: ${categories}\n\n内容: ${content}\n\n只需回复类别名称，不要其他内容。`
  const response = await callQwenAPI(context.env, 'qwen-turbo', prompt)

  return { classification: response.trim(), content }
}

async function executeEdgeCache(node, context) {
  const action = node.config?.action || 'get'
  const key = interpolate(node.config?.key || 'cache-key', context.data)
  const ttl = parseInt(node.config?.ttl) || 3600

  // 使用 Cache API
  const cache = caches.default
  const cacheKey = new Request(`https://edgeflow.cache/${key}`)

  switch (action) {
    case 'get': {
      const cached = await cache.match(cacheKey)
      if (cached) {
        const data = await cached.json()
        return { cached: true, data }
      }
      return { cached: false, data: null }
    }
    case 'set': {
      const response = new Response(JSON.stringify(context.data), {
        headers: { 'Cache-Control': `max-age=${ttl}` }
      })
      await cache.put(cacheKey, response)
      return { cached: true, key, ttl }
    }
    case 'delete': {
      await cache.delete(cacheKey)
      return { deleted: true, key }
    }
    default:
      return { error: '未知缓存操作' }
  }
}

async function executeEdgeKV(node, context) {
  const namespace = node.config?.namespace || 'default'
  const key = interpolate(node.config?.key || 'key', context.data)
  const action = node.config?.action || 'get'

  // 模拟 KV 操作（实际需要绑定 KV 命名空间）
  return {
    action,
    namespace,
    key,
    success: true,
    message: 'KV 操作已模拟执行'
  }
}

async function executeEdgeRedirect(node, context) {
  const url = interpolate(node.config?.url || '/', context.data)
  const statusCode = parseInt(node.config?.statusCode) || 302

  return {
    redirect: true,
    url,
    statusCode,
    _response: Response.redirect(url, statusCode)
  }
}

async function executeHttpRequest(node, context) {
  const url = interpolate(node.config?.url || '', context.data)
  const method = node.config?.method || 'GET'
  const headers = node.config?.headers || {}
  const body = node.config?.body ? interpolate(node.config.body, context.data) : undefined

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: method !== 'GET' ? body : undefined
  })

  const contentType = response.headers.get('content-type') || ''
  let data
  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers),
    data
  }
}

async function executeEmail(node, context) {
  const to = interpolate(node.config?.to || '', context.data)
  const subject = interpolate(node.config?.subject || '', context.data)
  const template = interpolate(node.config?.template || '', context.data)

  // 模拟邮件发送
  return {
    sent: true,
    to,
    subject,
    message: '邮件已模拟发送（实际需要配置邮件服务）'
  }
}

async function executeResponse(node, context) {
  const statusCode = parseInt(node.config?.statusCode) || 200
  const contentType = node.config?.contentType || 'application/json'
  const body = node.config?.body ? interpolate(node.config.body, context.data) : JSON.stringify(context.data)

  return {
    statusCode,
    contentType,
    body,
    _response: new Response(body, {
      status: statusCode,
      headers: { 'Content-Type': contentType }
    })
  }
}

// ============ 辅助函数 ============

/**
 * 调用通义千问 API
 */
async function callQwenAPI(env, model, prompt) {
  const apiKey = env.DASHSCOPE_API_KEY || 'sk-54ae495d0e8e4dfb92607467bfcdf357'

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'qwen-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000
      })
    })

    const data = await response.json()
    return data.choices?.[0]?.message?.content || '无响应'
  } catch (error) {
    console.error('AI API error:', error)
    return `AI 调用失败: ${error.message}`
  }
}

/**
 * 字符串插值
 */
function interpolate(template, data) {
  return template.replace(/\$\{(\w+)\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match
  })
}
