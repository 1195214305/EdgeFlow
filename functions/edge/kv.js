/**
 * Edge KV 操作模块
 */

export async function handleEdgeKV(request, env, path) {
  const method = request.method
  const pathParts = path.replace('/kv/', '').split('/')
  const namespace = pathParts[0] || 'default'
  const key = pathParts.slice(1).join('/') || null

  // 获取 KV 命名空间（实际部署时需要绑定）
  const kv = env[`KV_${namespace.toUpperCase()}`] || env.KV_DEFAULT

  switch (method) {
    case 'GET':
      return handleGet(kv, namespace, key)
    case 'PUT':
    case 'POST':
      const body = await request.json()
      return handlePut(kv, namespace, key, body)
    case 'DELETE':
      return handleDelete(kv, namespace, key)
    default:
      return { success: false, error: `不支持的方法: ${method}` }
  }
}

/**
 * 获取值
 */
async function handleGet(kv, namespace, key) {
  if (!key) {
    // 列出所有键
    return handleList(kv, namespace)
  }

  try {
    // 模拟 KV 获取（实际使用 kv.get）
    const mockData = getMockData(namespace, key)

    if (mockData === null) {
      return {
        success: false,
        error: '键不存在',
        namespace,
        key
      }
    }

    return {
      success: true,
      namespace,
      key,
      value: mockData,
      metadata: {
        createdAt: new Date().toISOString()
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      namespace,
      key
    }
  }
}

/**
 * 设置值
 */
async function handlePut(kv, namespace, key, body) {
  if (!key) {
    return { success: false, error: '缺少键名' }
  }

  const { value, expirationTtl, metadata } = body

  try {
    // 模拟 KV 写入（实际使用 kv.put）
    setMockData(namespace, key, value)

    return {
      success: true,
      namespace,
      key,
      message: '值已保存',
      expirationTtl,
      metadata
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      namespace,
      key
    }
  }
}

/**
 * 删除值
 */
async function handleDelete(kv, namespace, key) {
  if (!key) {
    return { success: false, error: '缺少键名' }
  }

  try {
    // 模拟 KV 删除（实际使用 kv.delete）
    deleteMockData(namespace, key)

    return {
      success: true,
      namespace,
      key,
      message: '值已删除'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      namespace,
      key
    }
  }
}

/**
 * 列出键
 */
async function handleList(kv, namespace, options = {}) {
  const { prefix, limit = 100, cursor } = options

  try {
    // 模拟 KV 列表（实际使用 kv.list）
    const keys = listMockKeys(namespace, prefix)

    return {
      success: true,
      namespace,
      keys: keys.slice(0, limit),
      list_complete: keys.length <= limit,
      cursor: keys.length > limit ? 'next-cursor' : null
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      namespace
    }
  }
}

// ============ 模拟数据存储 ============

const mockStorage = new Map()

function getMockData(namespace, key) {
  const fullKey = `${namespace}:${key}`
  return mockStorage.get(fullKey) || null
}

function setMockData(namespace, key, value) {
  const fullKey = `${namespace}:${key}`
  mockStorage.set(fullKey, value)
}

function deleteMockData(namespace, key) {
  const fullKey = `${namespace}:${key}`
  mockStorage.delete(fullKey)
}

function listMockKeys(namespace, prefix = '') {
  const keys = []
  const nsPrefix = `${namespace}:`

  for (const key of mockStorage.keys()) {
    if (key.startsWith(nsPrefix)) {
      const shortKey = key.slice(nsPrefix.length)
      if (!prefix || shortKey.startsWith(prefix)) {
        keys.push({
          name: shortKey,
          expiration: null,
          metadata: {}
        })
      }
    }
  }

  return keys
}

// 初始化一些模拟数据
mockStorage.set('default:config', { theme: 'light', language: 'zh-CN' })
mockStorage.set('default:user:1', { name: '张三', email: 'zhangsan@example.com' })
mockStorage.set('workflows:wf-001', { name: '示例工作流', status: 'active' })

/**
 * 批量操作
 */
export async function batchKVOperation(kv, operations) {
  const results = []

  for (const op of operations) {
    try {
      let result
      switch (op.action) {
        case 'get':
          result = await handleGet(kv, op.namespace, op.key)
          break
        case 'put':
          result = await handlePut(kv, op.namespace, op.key, { value: op.value })
          break
        case 'delete':
          result = await handleDelete(kv, op.namespace, op.key)
          break
        default:
          result = { success: false, error: '未知操作' }
      }
      results.push({ ...op, result })
    } catch (error) {
      results.push({ ...op, result: { success: false, error: error.message } })
    }
  }

  return {
    success: true,
    total: operations.length,
    successful: results.filter(r => r.result.success).length,
    results
  }
}

/**
 * 原子计数器
 */
export async function atomicIncrement(kv, namespace, key, delta = 1) {
  const current = getMockData(namespace, key) || 0
  const newValue = (typeof current === 'number' ? current : 0) + delta
  setMockData(namespace, key, newValue)

  return {
    success: true,
    namespace,
    key,
    previousValue: current,
    newValue,
    delta
  }
}
