/**
 * AI 处理模块
 */

const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

export async function handleAIProcess(request, env) {
  const { action, data, config } = await request.json()

  const apiKey = env.DASHSCOPE_API_KEY || 'sk-54ae495d0e8e4dfb92607467bfcdf357'

  switch (action) {
    case 'analyze':
      return analyzeData(apiKey, data, config)
    case 'generate':
      return generateContent(apiKey, data, config)
    case 'classify':
      return classifyContent(apiKey, data, config)
    case 'summarize':
      return summarizeContent(apiKey, data, config)
    case 'extract':
      return extractEntities(apiKey, data, config)
    default:
      return { success: false, error: `未知 AI 操作: ${action}` }
  }
}

/**
 * 数据分析
 */
async function analyzeData(apiKey, data, config) {
  const prompt = `${config?.prompt || '请分析以下数据，找出关键趋势和异常：'}

数据：
${JSON.stringify(data, null, 2)}

请提供：
1. 数据概览
2. 关键发现
3. 异常检测
4. 建议行动`

  const result = await callQwen(apiKey, config?.model || 'qwen-turbo', prompt)

  return {
    success: true,
    action: 'analyze',
    result,
    timestamp: new Date().toISOString()
  }
}

/**
 * 内容生成
 */
async function generateContent(apiKey, data, config) {
  const format = config?.format || 'text'
  let prompt = config?.prompt || '根据以下信息生成内容：'

  prompt += `\n\n输入数据：\n${JSON.stringify(data, null, 2)}`

  if (format === 'json') {
    prompt += '\n\n请以有效的 JSON 格式输出结果。'
  } else if (format === 'markdown') {
    prompt += '\n\n请以 Markdown 格式输出结果。'
  } else if (format === 'html') {
    prompt += '\n\n请以 HTML 格式输出结果。'
  }

  const result = await callQwen(apiKey, config?.model || 'qwen-turbo', prompt)

  // 如果是 JSON 格式，尝试解析
  let parsedResult = result
  if (format === 'json') {
    try {
      parsedResult = JSON.parse(result)
    } catch (e) {
      // 保持原始文本
    }
  }

  return {
    success: true,
    action: 'generate',
    result: parsedResult,
    format,
    timestamp: new Date().toISOString()
  }
}

/**
 * 内容分类
 */
async function classifyContent(apiKey, data, config) {
  const categories = config?.categories || '类别A,类别B,类别C'
  const content = typeof data === 'string' ? data : (data.content || JSON.stringify(data))

  const prompt = `请将以下内容分类到这些类别之一：${categories}

内容：
${content}

请只回复类别名称，不要包含其他内容。如果无法确定，请回复"未知"。`

  const result = await callQwen(apiKey, 'qwen-turbo', prompt)
  const classification = result.trim()

  return {
    success: true,
    action: 'classify',
    classification,
    categories: categories.split(',').map(c => c.trim()),
    confidence: categories.includes(classification) ? 'high' : 'low',
    timestamp: new Date().toISOString()
  }
}

/**
 * 内容摘要
 */
async function summarizeContent(apiKey, data, config) {
  const content = typeof data === 'string' ? data : (data.content || JSON.stringify(data))
  const maxLength = config?.maxLength || 200

  const prompt = `请为以下内容生成一个简洁的摘要，不超过 ${maxLength} 字：

${content}

摘要：`

  const result = await callQwen(apiKey, 'qwen-turbo', prompt)

  return {
    success: true,
    action: 'summarize',
    summary: result.trim(),
    originalLength: content.length,
    summaryLength: result.trim().length,
    timestamp: new Date().toISOString()
  }
}

/**
 * 实体提取
 */
async function extractEntities(apiKey, data, config) {
  const content = typeof data === 'string' ? data : (data.content || JSON.stringify(data))
  const entityTypes = config?.entityTypes || '人名,地点,组织,日期,金额'

  const prompt = `请从以下内容中提取实体信息，包括：${entityTypes}

内容：
${content}

请以 JSON 格式输出，格式如下：
{
  "entities": [
    {"type": "实体类型", "value": "实体值", "context": "上下文"}
  ]
}`

  const result = await callQwen(apiKey, 'qwen-turbo', prompt)

  let entities = []
  try {
    const parsed = JSON.parse(result)
    entities = parsed.entities || []
  } catch (e) {
    // 解析失败，返回原始结果
    entities = [{ type: 'raw', value: result }]
  }

  return {
    success: true,
    action: 'extract',
    entities,
    entityTypes: entityTypes.split(',').map(t => t.trim()),
    timestamp: new Date().toISOString()
  }
}

/**
 * 调用通义千问 API
 */
async function callQwen(apiKey, model, prompt, options = {}) {
  try {
    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'qwen-turbo',
        messages: [
          { role: 'system', content: options.systemPrompt || '你是一个专业的数据分析和内容处理助手。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.7
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API 请求失败: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''

  } catch (error) {
    console.error('Qwen API error:', error)
    throw error
  }
}

/**
 * 批量 AI 处理
 */
export async function batchAIProcess(apiKey, items, action, config) {
  const results = []

  for (const item of items) {
    try {
      let result
      switch (action) {
        case 'classify':
          result = await classifyContent(apiKey, item, config)
          break
        case 'summarize':
          result = await summarizeContent(apiKey, item, config)
          break
        default:
          result = { error: '不支持的批量操作' }
      }
      results.push({ item, result, success: true })
    } catch (error) {
      results.push({ item, error: error.message, success: false })
    }
  }

  return {
    success: true,
    action: `batch_${action}`,
    total: items.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  }
}
