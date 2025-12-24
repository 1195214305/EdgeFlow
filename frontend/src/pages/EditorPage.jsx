import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkflowStore, NODE_TYPES } from '../store'

// 图标
const Icons = {
  ArrowLeft: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  Save: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  Play: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  X: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
}

// 节点组件
const WorkflowNode = ({ node, isSelected, onSelect, onDelete }) => {
  const colorMap = {
    blue: 'border-l-flow-500 bg-flow-50',
    purple: 'border-l-purple-500 bg-purple-50',
    amber: 'border-l-amber-500 bg-amber-50',
    green: 'border-l-success-500 bg-success-50',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        workflow-node p-4 cursor-pointer border-l-4
        ${colorMap[node.color] || 'bg-white'}
        ${isSelected ? 'ring-2 ring-flow-500 shadow-glow' : ''}
      `}
      style={{
        position: 'absolute',
        left: node.position?.x || 100,
        top: node.position?.y || 100,
        width: 200,
      }}
      onClick={() => onSelect(node)}
      drag
      dragMomentum={false}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{node.icon}</span>
          <span className="font-medium text-slate-900">{node.name}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(node.id)
          }}
          className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
        >
          <Icons.X />
        </button>
      </div>
      <p className="text-xs text-slate-500">{node.description}</p>

      {/* 连接端口 */}
      <div className="node-port absolute -left-1.5 top-1/2 -translate-y-1/2" />
      <div className="node-port absolute -right-1.5 top-1/2 -translate-y-1/2" />
    </motion.div>
  )
}

// 侧边栏节点项
const SidebarNodeItem = ({ nodeKey, nodeConfig, onDragStart }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, nodeKey)}
    className="sidebar-node"
  >
    <span className="text-xl">{nodeConfig.icon}</span>
    <div>
      <div className="font-medium text-slate-900 text-sm">{nodeConfig.name}</div>
      <div className="text-xs text-slate-500">{nodeConfig.description}</div>
    </div>
  </div>
)

// 节点配置面板
const NodeConfigPanel = ({ node, onUpdate, onClose }) => {
  if (!node) return null

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-80 bg-white border-l border-slate-200 p-4 overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">节点配置</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 text-slate-400"
        >
          <Icons.X />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            节点名称
          </label>
          <input
            type="text"
            value={node.name}
            onChange={(e) => onUpdate(node.id, { name: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            节点类型
          </label>
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <span className="text-xl">{node.icon}</span>
            <span className="text-sm text-slate-600">{NODE_TYPES[node.type]?.name}</span>
          </div>
        </div>

        {/* 根据节点类型显示不同配置 */}
        {node.type === 'WEBHOOK' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Webhook URL
            </label>
            <div className="p-2 bg-slate-100 rounded-lg font-mono text-xs text-slate-600 break-all">
              /api/workflow/{node.id}/trigger
            </div>
          </div>
        )}

        {node.type === 'HTTP_REQUEST' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                请求 URL
              </label>
              <input
                type="text"
                placeholder="https://api.example.com/endpoint"
                className="input-field"
                value={node.config?.url || ''}
                onChange={(e) => onUpdate(node.id, {
                  config: { ...node.config, url: e.target.value }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                请求方法
              </label>
              <select
                className="input-field"
                value={node.config?.method || 'GET'}
                onChange={(e) => onUpdate(node.id, {
                  config: { ...node.config, method: e.target.value }
                })}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </>
        )}

        {node.type === 'CONDITION' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              条件表达式
            </label>
            <input
              type="text"
              placeholder="data.status === 'success'"
              className="input-field font-mono text-sm"
              value={node.config?.expression || ''}
              onChange={(e) => onUpdate(node.id, {
                config: { ...node.config, expression: e.target.value }
              })}
            />
          </div>
        )}

        {node.type === 'RESPONSE' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              响应状态码
            </label>
            <input
              type="number"
              placeholder="200"
              className="input-field"
              value={node.config?.statusCode || 200}
              onChange={(e) => onUpdate(node.id, {
                config: { ...node.config, statusCode: parseInt(e.target.value) }
              })}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function EditorPage() {
  const { workflowId } = useParams()
  const navigate = useNavigate()

  const {
    currentWorkflow,
    nodes,
    connections,
    selectedNode,
    loadWorkflow,
    saveWorkflow,
    addNode,
    updateNode,
    deleteNode,
    selectNode,
    addExecution,
  } = useWorkflowStore()

  const [isSaving, setIsSaving] = useState(false)

  // 加载工作流
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId)
    }
  }, [workflowId])

  // 保存工作流
  const handleSave = async () => {
    setIsSaving(true)
    saveWorkflow()
    await new Promise((r) => setTimeout(r, 500))
    setIsSaving(false)
  }

  // 运行工作流
  const handleRun = () => {
    const execution = {
      id: Date.now().toString(),
      workflowId: currentWorkflow?.id,
      workflowName: currentWorkflow?.name,
      status: 'success',
      startedAt: Date.now(),
      completedAt: Date.now() + 1234,
      duration: 1234,
      nodesExecuted: nodes.length,
    }
    addExecution(execution)
    alert('工作流执行成功！')
  }

  // 拖拽添加节点
  const handleDragStart = (e, nodeType) => {
    e.dataTransfer.setData('nodeType', nodeType)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const nodeType = e.dataTransfer.getData('nodeType')
    if (nodeType) {
      const rect = e.currentTarget.getBoundingClientRect()
      const position = {
        x: e.clientX - rect.left - 100,
        y: e.clientY - rect.top - 50,
      }
      addNode(nodeType, position)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  // 按类型分组节点
  const groupedNodes = Object.entries(NODE_TYPES).reduce((acc, [key, value]) => {
    if (!acc[value.type]) acc[value.type] = []
    acc[value.type].push({ key, ...value })
    return acc
  }, {})

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* 顶部工具栏 */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Icons.ArrowLeft />
          </button>
          <div>
            <h1 className="font-semibold text-slate-900">
              {currentWorkflow?.name || '未命名工作流'}
            </h1>
            <p className="text-xs text-slate-500">
              {nodes.length} 个节点 · {connections.length} 个连接
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-secondary flex items-center gap-2"
          >
            <Icons.Save />
            {isSaving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={handleRun}
            className="btn-success flex items-center gap-2"
          >
            <Icons.Play />
            运行
          </button>
        </div>
      </header>

      {/* 主内容 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧节点面板 */}
        <div className="w-64 bg-white border-r border-slate-200 p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            节点库
          </h2>

          {/* 触发器 */}
          <div className="mb-6">
            <h3 className="text-xs font-medium text-slate-400 mb-2">触发器</h3>
            <div className="space-y-2">
              {groupedNodes.trigger?.map((node) => (
                <SidebarNodeItem
                  key={node.key}
                  nodeKey={node.key}
                  nodeConfig={node}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </div>

          {/* 动作 */}
          <div className="mb-6">
            <h3 className="text-xs font-medium text-slate-400 mb-2">动作</h3>
            <div className="space-y-2">
              {groupedNodes.action?.map((node) => (
                <SidebarNodeItem
                  key={node.key}
                  nodeKey={node.key}
                  nodeConfig={node}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </div>

          {/* 条件 */}
          <div className="mb-6">
            <h3 className="text-xs font-medium text-slate-400 mb-2">条件</h3>
            <div className="space-y-2">
              {groupedNodes.condition?.map((node) => (
                <SidebarNodeItem
                  key={node.key}
                  nodeKey={node.key}
                  nodeConfig={node}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </div>

          {/* 输出 */}
          <div>
            <h3 className="text-xs font-medium text-slate-400 mb-2">输出</h3>
            <div className="space-y-2">
              {groupedNodes.output?.map((node) => (
                <SidebarNodeItem
                  key={node.key}
                  nodeKey={node.key}
                  nodeConfig={node}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 画布区域 */}
        <div
          className="flex-1 workflow-canvas relative overflow-auto"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => selectNode(null)}
        >
          {nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <p className="mb-2">从左侧拖拽节点到画布开始设计工作流</p>
                <p className="text-sm">或选择一个模板快速开始</p>
              </div>
            </div>
          ) : (
            nodes.map((node) => (
              <WorkflowNode
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                onSelect={selectNode}
                onDelete={deleteNode}
              />
            ))
          )}
        </div>

        {/* 右侧配置面板 */}
        <AnimatePresence>
          {selectedNode && (
            <NodeConfigPanel
              node={selectedNode}
              onUpdate={updateNode}
              onClose={() => selectNode(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
