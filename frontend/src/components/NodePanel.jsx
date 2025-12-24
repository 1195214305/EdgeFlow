import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NODE_TYPES } from '../store'

// 节点分类
const NODE_CATEGORIES = [
  {
    name: '触发器',
    icon: '⚡',
    description: '工作流的起点',
    types: ['WEBHOOK', 'SCHEDULE', 'GEO_TRIGGER']
  },
  {
    name: '数据处理',
    icon: '🔄',
    description: '转换和处理数据',
    types: ['TRANSFORM', 'FILTER', 'MERGE']
  },
  {
    name: 'AI 能力',
    icon: '🤖',
    description: '智能分析和生成',
    types: ['AI_ANALYZE', 'AI_GENERATE', 'AI_CLASSIFY']
  },
  {
    name: '边缘能力',
    icon: '🌐',
    description: 'ESA 边缘特性',
    types: ['EDGE_CACHE', 'EDGE_KV', 'EDGE_REDIRECT']
  },
  {
    name: '输出动作',
    icon: '📤',
    description: '发送结果和通知',
    types: ['HTTP_REQUEST', 'EMAIL', 'RESPONSE']
  }
]

// 节点卡片组件
const NodeCard = ({ nodeKey, onAdd }) => {
  const nodeType = NODE_TYPES[nodeKey]
  if (!nodeType) return null

  const colorClasses = {
    blue: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
    green: 'border-green-200 hover:border-green-400 hover:bg-green-50',
    purple: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
    orange: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50',
    red: 'border-red-200 hover:border-red-400 hover:bg-red-50'
  }

  const iconBgClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600'
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onAdd(nodeKey)}
      className={`
        w-full p-3 rounded-lg border-2 bg-white text-left
        transition-all duration-200 group
        ${colorClasses[nodeType.color] || 'border-gray-200 hover:border-gray-400'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center text-xl
          ${iconBgClasses[nodeType.color] || 'bg-gray-100 text-gray-600'}
        `}>
          {nodeType.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-800 text-sm">{nodeType.name}</h4>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{nodeType.description}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>
    </motion.button>
  )
}

// 分类折叠组件
const CategorySection = ({ category, isExpanded, onToggle, onAddNode }) => {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-xl">{category.icon}</span>
        <div className="flex-1 text-left">
          <h3 className="font-medium text-gray-800">{category.name}</h3>
          <p className="text-xs text-gray-500">{category.description}</p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">
              {category.types.map(nodeKey => (
                <NodeCard
                  key={nodeKey}
                  nodeKey={nodeKey}
                  onAdd={onAddNode}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// 主面板组件
export default function NodePanel({ onAddNode }) {
  const [expandedCategories, setExpandedCategories] = useState(['触发器'])
  const [searchQuery, setSearchQuery] = useState('')

  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    )
  }

  // 搜索过滤
  const filteredCategories = searchQuery
    ? NODE_CATEGORIES.map(cat => ({
        ...cat,
        types: cat.types.filter(key => {
          const node = NODE_TYPES[key]
          return node && (
            node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            node.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
        })
      })).filter(cat => cat.types.length > 0)
    : NODE_CATEGORIES

  return (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800 mb-3">节点库</h2>

        {/* 搜索框 */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索节点..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 节点列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredCategories.length > 0 ? (
          filteredCategories.map(category => (
            <CategorySection
              key={category.name}
              category={category}
              isExpanded={searchQuery ? true : expandedCategories.includes(category.name)}
              onToggle={() => toggleCategory(category.name)}
              onAddNode={onAddNode}
            />
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p>未找到匹配的节点</p>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>点击节点添加到画布，然后连接节点构建工作流</p>
        </div>
      </div>
    </div>
  )
}
