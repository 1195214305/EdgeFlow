import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NODE_TYPES } from '../store'

// 节点组件
const WorkflowNode = ({ node, isSelected, onSelect, onDelete, onDragStart, onConnect, connectingFrom }) => {
  const nodeType = NODE_TYPES[node.nodeType] || { name: '未知', icon: '❓', color: 'gray' }

  const colorClasses = {
    blue: 'bg-blue-500 border-blue-600',
    green: 'bg-green-500 border-green-600',
    purple: 'bg-purple-500 border-purple-600',
    orange: 'bg-orange-500 border-orange-600',
    red: 'bg-red-500 border-red-600',
    gray: 'bg-gray-500 border-gray-600'
  }

  const bgColorClasses = {
    blue: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    green: 'bg-green-50 border-green-200 hover:border-green-400',
    purple: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    orange: 'bg-orange-50 border-orange-200 hover:border-orange-400',
    red: 'bg-red-50 border-red-200 hover:border-red-400',
    gray: 'bg-gray-50 border-gray-200 hover:border-gray-400'
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className={`absolute cursor-move select-none ${isSelected ? 'z-20' : 'z-10'}`}
      style={{ left: node.position.x, top: node.position.y }}
      onMouseDown={(e) => {
        e.stopPropagation()
        onSelect(node.id)
        onDragStart(e, node.id)
      }}
    >
      <div className={`
        w-48 rounded-xl border-2 shadow-lg transition-all duration-200
        ${bgColorClasses[nodeType.color] || bgColorClasses.gray}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 shadow-xl' : ''}
      `}>
        {/* 输入连接点 */}
        {nodeType.type !== 'trigger' && (
          <div
            className={`
              absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full
              border-2 border-gray-300 bg-white cursor-pointer
              hover:border-blue-500 hover:bg-blue-50 transition-colors
              flex items-center justify-center
              ${connectingFrom ? 'animate-pulse border-blue-500' : ''}
            `}
            onClick={(e) => {
              e.stopPropagation()
              if (connectingFrom && connectingFrom !== node.id) {
                onConnect(connectingFrom, node.id)
              }
            }}
          >
            <div className="w-2 h-2 rounded-full bg-gray-400" />
          </div>
        )}

        {/* 节点头部 */}
        <div className={`
          px-3 py-2 rounded-t-lg flex items-center gap-2
          ${colorClasses[nodeType.color] || colorClasses.gray} text-white
        `}>
          <span className="text-lg">{nodeType.icon}</span>
          <span className="font-medium text-sm truncate flex-1">{node.name || nodeType.name}</span>
          {isSelected && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(node.id)
              }}
              className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 节点内容 */}
        <div className="px-3 py-2">
          <p className="text-xs text-gray-500 truncate">{nodeType.description}</p>
          {node.config && Object.keys(node.config).length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(node.config).slice(0, 2).map(([key, value]) => (
                <div key={key} className="flex items-center gap-1 text-xs">
                  <span className="text-gray-400">{key}:</span>
                  <span className="text-gray-600 truncate">{String(value).slice(0, 15)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 输出连接点 */}
        <div
          className={`
            absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full
            border-2 border-gray-300 bg-white cursor-pointer
            hover:border-green-500 hover:bg-green-50 transition-colors
            flex items-center justify-center
          `}
          onClick={(e) => {
            e.stopPropagation()
            onConnect(node.id, null)
          }}
        >
          <div className="w-2 h-2 rounded-full bg-gray-400" />
        </div>
      </div>
    </motion.div>
  )
}

// 连接线组件
const ConnectionLine = ({ from, to, nodes }) => {
  const fromNode = nodes.find(n => n.id === from)
  const toNode = nodes.find(n => n.id === to)

  if (!fromNode || !toNode) return null

  const startX = fromNode.position.x + 192 // 节点宽度
  const startY = fromNode.position.y + 50 // 节点高度的一半
  const endX = toNode.position.x
  const endY = toNode.position.y + 50

  // 贝塞尔曲线控制点
  const midX = (startX + endX) / 2
  const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2"
        strokeDasharray="5,5"
        className="animate-dash"
      />
      <path
        d={path}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeOpacity="0.3"
      />
      {/* 箭头 */}
      <circle cx={endX} cy={endY} r="4" fill="#3b82f6" />
    </g>
  )
}

// 主画布组件
export default function WorkflowCanvas({
  nodes,
  connections,
  selectedNode,
  onSelectNode,
  onUpdateNode,
  onDeleteNode,
  onAddConnection,
  onDeleteConnection
}) {
  const canvasRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragNodeId, setDragNodeId] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [connectingFrom, setConnectingFrom] = useState(null)
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  // 处理节点拖拽开始
  const handleDragStart = useCallback((e, nodeId) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return

    setIsDragging(true)
    setDragNodeId(nodeId)
    setDragOffset({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y
    })
  }, [nodes])

  // 处理鼠标移动
  const handleMouseMove = useCallback((e) => {
    if (isDragging && dragNodeId) {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      onUpdateNode(dragNodeId, { position: { x: Math.max(0, newX), y: Math.max(0, newY) } })
    } else if (isPanning) {
      setCanvasOffset({
        x: canvasOffset.x + (e.clientX - panStart.x),
        y: canvasOffset.y + (e.clientY - panStart.y)
      })
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }, [isDragging, dragNodeId, dragOffset, isPanning, panStart, canvasOffset, onUpdateNode])

  // 处理鼠标释放
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragNodeId(null)
    setIsPanning(false)
  }, [])

  // 处理连接
  const handleConnect = useCallback((fromId, toId) => {
    if (toId === null) {
      // 开始连接
      setConnectingFrom(fromId)
    } else if (connectingFrom) {
      // 完成连接
      onAddConnection(connectingFrom, toId)
      setConnectingFrom(null)
    }
  }, [connectingFrom, onAddConnection])

  // 处理画布点击
  const handleCanvasClick = useCallback((e) => {
    if (e.target === canvasRef.current || e.target.tagName === 'svg') {
      onSelectNode(null)
      setConnectingFrom(null)
    }
  }, [onSelectNode])

  // 处理画布平移开始
  const handlePanStart = useCallback((e) => {
    if (e.target === canvasRef.current || e.target.tagName === 'svg') {
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
    }
  }, [])

  // 处理滚轮缩放
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(z => Math.min(2, Math.max(0.5, z + delta)))
    }
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-gray-50"
      onClick={handleCanvasClick}
      onMouseDown={handlePanStart}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      {/* 网格背景 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`
        }}
      />

      {/* 画布内容 */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {/* 连接线 SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '2000px', minHeight: '2000px' }}>
          <defs>
            <style>
              {`
                @keyframes dash {
                  to { stroke-dashoffset: -10; }
                }
                .animate-dash {
                  animation: dash 0.5s linear infinite;
                }
              `}
            </style>
          </defs>
          {connections.map((conn, index) => (
            <ConnectionLine
              key={`${conn.from}-${conn.to}-${index}`}
              from={conn.from}
              to={conn.to}
              nodes={nodes}
            />
          ))}
        </svg>

        {/* 节点 */}
        <AnimatePresence>
          {nodes.map(node => (
            <WorkflowNode
              key={node.id}
              node={node}
              isSelected={selectedNode === node.id}
              onSelect={onSelectNode}
              onDelete={onDeleteNode}
              onDragStart={handleDragStart}
              onConnect={handleConnect}
              connectingFrom={connectingFrom}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* 缩放控制 */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white rounded-lg shadow-lg px-3 py-2">
        <button
          onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="text-sm text-gray-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(z => Math.min(2, z + 0.1))}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => { setZoom(1); setCanvasOffset({ x: 0, y: 0 }) }}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          title="重置视图"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* 连接提示 */}
      {connectingFrom && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          点击目标节点的输入端口完成连接，或点击空白处取消
        </div>
      )}

      {/* 空状态提示 */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">开始构建工作流</h3>
            <p className="text-gray-500">从左侧面板拖拽节点到画布上</p>
          </div>
        </div>
      )}
    </div>
  )
}
