import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkflowStore } from '../store'

// 图标组件
const Icons = {
  Plus: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Play: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Zap: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Globe: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Code: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
}

// 特性卡片
const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="card p-6"
  >
    <div className="w-12 h-12 rounded-xl bg-flow-100 flex items-center justify-center text-flow-600 mb-4">
      <Icon />
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm">{description}</p>
  </motion.div>
)

// 工作流卡片
const WorkflowCard = ({ workflow, onEdit, onDelete, onRun }) => {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card p-5 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-900">{workflow.name}</h3>
          <p className="text-sm text-slate-500">
            {workflow.nodes?.length || 0} 个节点
          </p>
        </div>
        <span className={`execution-status ${workflow.status === 'active' ? 'success' : 'pending'}`}>
          {workflow.status === 'active' ? '运行中' : '草稿'}
        </span>
      </div>

      <p className="text-sm text-slate-400 mb-4 line-clamp-2">
        {workflow.description || '暂无描述'}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          更新于 {formatDate(workflow.updatedAt)}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onRun(workflow)}
            className="p-1.5 rounded-lg hover:bg-success-100 text-slate-400 hover:text-success-600 transition-colors"
            title="运行"
          >
            <Icons.Play />
          </button>
          <button
            onClick={() => onEdit(workflow)}
            className="p-1.5 rounded-lg hover:bg-flow-100 text-slate-400 hover:text-flow-600 transition-colors"
            title="编辑"
          >
            <Icons.Edit />
          </button>
          <button
            onClick={() => onDelete(workflow)}
            className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
            title="删除"
          >
            <Icons.Trash />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// 模板卡片
const TemplateCard = ({ template, onClick }) => (
  <button
    onClick={onClick}
    className="card p-4 text-left hover:border-flow-300 hover:shadow-md transition-all group"
  >
    <div className="text-2xl mb-2">{template.icon}</div>
    <h4 className="font-medium text-slate-900 group-hover:text-flow-600 transition-colors">
      {template.name}
    </h4>
    <p className="text-xs text-slate-500 mt-1">{template.description}</p>
  </button>
)

// 预设模板
const templates = [
  { id: 1, icon: '🔗', name: 'Webhook 转发', description: '接收 Webhook 并转发到其他服务' },
  { id: 2, icon: '🌍', name: '地理位置路由', description: '根据访问者位置返回不同内容' },
  { id: 3, icon: '🤖', name: 'AI 内容处理', description: '使用 AI 处理请求内容' },
  { id: 4, icon: '💾', name: '边缘缓存', description: '缓存 API 响应到边缘节点' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { workflows, createWorkflow, deleteWorkflow, loadWorkflow, edgeInfo, setEdgeInfo } = useWorkflowStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWorkflowName, setNewWorkflowName] = useState('')

  // 获取边缘信息
  useEffect(() => {
    // 模拟获取边缘信息
    setEdgeInfo({
      edgeNode: 'CN-Shanghai',
      latency: 12,
    })
  }, [])

  // 创建新工作流
  const handleCreate = () => {
    const name = newWorkflowName.trim() || '未命名工作流'
    const workflowId = createWorkflow(name)
    setNewWorkflowName('')
    setShowCreateModal(false)
    navigate(`/editor/${workflowId}`)
  }

  // 编辑工作流
  const handleEdit = (workflow) => {
    loadWorkflow(workflow.id)
    navigate(`/editor/${workflow.id}`)
  }

  // 删除工作流
  const handleDelete = (workflow) => {
    if (confirm(`确定要删除工作流 "${workflow.name}" 吗？`)) {
      deleteWorkflow(workflow.id)
    }
  }

  // 运行工作流
  const handleRun = (workflow) => {
    alert(`工作流 "${workflow.name}" 已触发执行`)
  }

  // 使用模板创建
  const handleUseTemplate = (template) => {
    const workflowId = createWorkflow(template.name)
    navigate(`/editor/${workflowId}`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 导航栏 */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="EdgeFlow" className="w-10 h-10" />
            <div>
              <span className="text-xl font-bold text-slate-900">EdgeFlow</span>
              <span className="text-xs text-slate-500 block">边缘工作流自动化</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {edgeInfo && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="pulse-dot" />
                <span>{edgeInfo.edgeNode}</span>
                <span className="text-slate-300">|</span>
                <span>{edgeInfo.latency}ms</span>
              </div>
            )}
            <button
              onClick={() => navigate('/executions')}
              className="btn-secondary text-sm"
            >
              执行历史
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <Icons.Plus />
              新建工作流
            </button>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            无代码边缘工作流自动化
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            像 Zapier 一样简单，但运行在阿里云 ESA 边缘节点。
            <br />
            毫秒级响应，全球分布，无服务器运维。
          </p>
        </motion.div>

        {/* 特性 */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <FeatureCard
            icon={Icons.Zap}
            title="毫秒级执行"
            description="工作流在边缘节点执行，延迟低至 10ms"
          />
          <FeatureCard
            icon={Icons.Globe}
            title="全球分布"
            description="自动部署到全球边缘节点，就近执行"
          />
          <FeatureCard
            icon={Icons.Clock}
            title="定时触发"
            description="支持 Cron 表达式定时触发工作流"
          />
          <FeatureCard
            icon={Icons.Code}
            title="无代码设计"
            description="可视化拖拽设计，无需编写代码"
          />
        </div>

        {/* 我的工作流 */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">我的工作流</h2>
            <span className="text-sm text-slate-400">{workflows.length} 个工作流</span>
          </div>

          {workflows.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {workflows.map((workflow) => (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRun={handleRun}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Icons.Zap />
              </div>
              <p className="text-slate-500 mb-4">还没有工作流，创建一个开始自动化吧</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                创建工作流
              </button>
            </div>
          )}
        </div>

        {/* 模板 */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">快速开始模板</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => handleUseTemplate(template)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Powered by</span>
              <a
                href="https://www.aliyun.com/product/esa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-flow-600 hover:text-flow-700 font-medium"
              >
                阿里云 ESA
              </a>
            </div>
            <div className="text-sm text-slate-400">
              EdgeFlow - 边缘工作流自动化引擎
            </div>
          </div>
        </div>
      </footer>

      {/* 创建弹窗 */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-slate-900 mb-4">创建新工作流</h3>
              <input
                type="text"
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
                placeholder="输入工作流名称"
                className="input-field mb-4"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 btn-primary"
                >
                  创建
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
