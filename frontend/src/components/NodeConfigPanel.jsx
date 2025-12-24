import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NODE_TYPES } from '../store'

// 配置字段组件
const ConfigField = ({ label, type, value, onChange, options, placeholder, description }) => {
  switch (type) {
    case 'text':
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      )

    case 'textarea':
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      )

    case 'number':
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      )

    case 'select':
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">请选择...</option>
            {options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      )

    case 'toggle':
      return (
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            {description && <p className="text-xs text-gray-500">{description}</p>}
          </div>
          <button
            onClick={() => onChange(!value)}
            className={`
              relative w-12 h-6 rounded-full transition-colors duration-200
              ${value ? 'bg-blue-500' : 'bg-gray-300'}
            `}
          >
            <div className={`
              absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
              ${value ? 'translate-x-7' : 'translate-x-1'}
            `} />
          </button>
        </div>
      )

    case 'json':
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value))
              } catch {
                onChange(e.target.value)
              }
            }}
            placeholder={placeholder || '{\n  "key": "value"\n}'}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      )

    default:
      return null
  }
}

// 节点配置定义
const NODE_CONFIGS = {
  WEBHOOK: [
    { key: 'path', label: '路径', type: 'text', placeholder: '/api/webhook', description: 'Webhook 接收路径' },
    { key: 'method', label: '请求方法', type: 'select', options: [
      { value: 'GET', label: 'GET' },
      { value: 'POST', label: 'POST' },
      { value: 'PUT', label: 'PUT' },
      { value: 'DELETE', label: 'DELETE' }
    ]},
    { key: 'auth', label: '启用认证', type: 'toggle', description: '是否需要 API Key 认证' }
  ],
  SCHEDULE: [
    { key: 'cron', label: 'Cron 表达式', type: 'text', placeholder: '0 * * * *', description: '例如: 0 * * * * (每小时)' },
    { key: 'timezone', label: '时区', type: 'select', options: [
      { value: 'Asia/Shanghai', label: '中国标准时间 (UTC+8)' },
      { value: 'UTC', label: 'UTC' },
      { value: 'America/New_York', label: '美国东部时间' }
    ]}
  ],
  GEO_TRIGGER: [
    { key: 'countries', label: '目标国家', type: 'text', placeholder: 'CN,US,JP', description: '逗号分隔的国家代码' },
    { key: 'action', label: '触发动作', type: 'select', options: [
      { value: 'include', label: '包含这些国家时触发' },
      { value: 'exclude', label: '排除这些国家时触发' }
    ]}
  ],
  TRANSFORM: [
    { key: 'expression', label: '转换表达式', type: 'textarea', placeholder: 'data.map(item => item.name)', description: 'JavaScript 表达式' },
    { key: 'outputKey', label: '输出键名', type: 'text', placeholder: 'result' }
  ],
  FILTER: [
    { key: 'condition', label: '过滤条件', type: 'textarea', placeholder: 'item.status === "active"', description: 'JavaScript 布尔表达式' }
  ],
  MERGE: [
    { key: 'strategy', label: '合并策略', type: 'select', options: [
      { value: 'concat', label: '数组拼接' },
      { value: 'merge', label: '对象合并' },
      { value: 'zip', label: '配对合并' }
    ]}
  ],
  AI_ANALYZE: [
    { key: 'prompt', label: '分析提示词', type: 'textarea', placeholder: '分析以下数据的趋势和异常...', description: '告诉 AI 如何分析数据' },
    { key: 'model', label: 'AI 模型', type: 'select', options: [
      { value: 'qwen-turbo', label: '通义千问 Turbo (快速)' },
      { value: 'qwen-plus', label: '通义千问 Plus (均衡)' },
      { value: 'qwen-max', label: '通义千问 Max (强大)' }
    ]}
  ],
  AI_GENERATE: [
    { key: 'prompt', label: '生成提示词', type: 'textarea', placeholder: '根据以下信息生成报告...', description: '告诉 AI 生成什么内容' },
    { key: 'format', label: '输出格式', type: 'select', options: [
      { value: 'text', label: '纯文本' },
      { value: 'json', label: 'JSON' },
      { value: 'markdown', label: 'Markdown' }
    ]}
  ],
  AI_CLASSIFY: [
    { key: 'categories', label: '分类类别', type: 'textarea', placeholder: '正面,负面,中性', description: '逗号分隔的类别列表' },
    { key: 'field', label: '分类字段', type: 'text', placeholder: 'content', description: '要分类的数据字段' }
  ],
  EDGE_CACHE: [
    { key: 'ttl', label: '缓存时间(秒)', type: 'number', placeholder: '3600' },
    { key: 'key', label: '缓存键', type: 'text', placeholder: 'cache:${id}', description: '支持变量替换' },
    { key: 'action', label: '操作', type: 'select', options: [
      { value: 'get', label: '读取缓存' },
      { value: 'set', label: '写入缓存' },
      { value: 'delete', label: '删除缓存' }
    ]}
  ],
  EDGE_KV: [
    { key: 'namespace', label: '命名空间', type: 'text', placeholder: 'my-kv-namespace' },
    { key: 'key', label: '键名', type: 'text', placeholder: 'user:${id}' },
    { key: 'action', label: '操作', type: 'select', options: [
      { value: 'get', label: '读取' },
      { value: 'put', label: '写入' },
      { value: 'delete', label: '删除' },
      { value: 'list', label: '列表' }
    ]}
  ],
  EDGE_REDIRECT: [
    { key: 'url', label: '目标 URL', type: 'text', placeholder: 'https://example.com/${path}' },
    { key: 'statusCode', label: '状态码', type: 'select', options: [
      { value: '301', label: '301 永久重定向' },
      { value: '302', label: '302 临时重定向' },
      { value: '307', label: '307 临时重定向(保持方法)' }
    ]}
  ],
  HTTP_REQUEST: [
    { key: 'url', label: '请求 URL', type: 'text', placeholder: 'https://api.example.com/data' },
    { key: 'method', label: '请求方法', type: 'select', options: [
      { value: 'GET', label: 'GET' },
      { value: 'POST', label: 'POST' },
      { value: 'PUT', label: 'PUT' },
      { value: 'DELETE', label: 'DELETE' }
    ]},
    { key: 'headers', label: '请求头', type: 'json', description: 'JSON 格式的请求头' },
    { key: 'body', label: '请求体', type: 'textarea', placeholder: '{"key": "value"}' }
  ],
  EMAIL: [
    { key: 'to', label: '收件人', type: 'text', placeholder: 'user@example.com' },
    { key: 'subject', label: '邮件主题', type: 'text', placeholder: '工作流通知' },
    { key: 'template', label: '邮件模板', type: 'textarea', placeholder: '您好，工作流已执行完成...' }
  ],
  RESPONSE: [
    { key: 'statusCode', label: '状态码', type: 'number', placeholder: '200' },
    { key: 'contentType', label: '内容类型', type: 'select', options: [
      { value: 'application/json', label: 'JSON' },
      { value: 'text/html', label: 'HTML' },
      { value: 'text/plain', label: '纯文本' }
    ]},
    { key: 'body', label: '响应内容', type: 'textarea', placeholder: '{"success": true}' }
  ]
}

// 主配置面板组件
export default function NodeConfigPanel({ node, onUpdate, onClose }) {
  const [localConfig, setLocalConfig] = useState(node?.config || {})
  const [nodeName, setNodeName] = useState(node?.name || '')

  const nodeType = node ? NODE_TYPES[node.nodeType] : null
  const configFields = node ? NODE_CONFIGS[node.nodeType] || [] : []

  useEffect(() => {
    if (node) {
      setLocalConfig(node.config || {})
      setNodeName(node.name || nodeType?.name || '')
    }
  }, [node, nodeType])

  const handleConfigChange = (key, value) => {
    const newConfig = { ...localConfig, [key]: value }
    setLocalConfig(newConfig)
    onUpdate({ config: newConfig })
  }

  const handleNameChange = (name) => {
    setNodeName(name)
    onUpdate({ name })
  }

  if (!node || !nodeType) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">👆</div>
            <p>选择一个节点进行配置</p>
          </div>
        </div>
      </div>
    )
  }

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  }

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-80 bg-white border-l border-gray-200 flex flex-col h-full"
    >
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${colorClasses[nodeType.color]} flex items-center justify-center text-white`}>
              {nodeType.icon}
            </div>
            <span className="font-medium text-gray-800">{nodeType.name}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 节点名称 */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">节点名称</label>
          <input
            type="text"
            value={nodeName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={nodeType.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 配置字段 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {configFields.length > 0 ? (
          configFields.map(field => (
            <ConfigField
              key={field.key}
              label={field.label}
              type={field.type}
              value={localConfig[field.key]}
              onChange={(value) => handleConfigChange(field.key, value)}
              options={field.options}
              placeholder={field.placeholder}
              description={field.description}
            />
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            <div className="text-3xl mb-2">⚙️</div>
            <p className="text-sm">此节点无需额外配置</p>
          </div>
        )}
      </div>

      {/* 底部信息 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          <p className="font-medium mb-1">节点 ID</p>
          <code className="bg-gray-200 px-2 py-1 rounded text-xs">{node.id.slice(0, 8)}...</code>
        </div>
      </div>
    </motion.div>
  )
}
