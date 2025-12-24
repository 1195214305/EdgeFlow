import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useWorkflowStore } from '../store'

// 图标
const Icons = {
  ArrowLeft: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export default function ExecutionsPage() {
  const navigate = useNavigate()
  const { executions } = useWorkflowStore()

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 导航栏 */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Icons.ArrowLeft />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">执行历史</h1>
            <p className="text-sm text-slate-500">{executions.length} 条记录</p>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {executions.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    工作流
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    执行时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    耗时
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    节点数
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {executions.map((execution, index) => (
                  <motion.tr
                    key={execution.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {execution.workflowName}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {execution.workflowId?.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`execution-status ${execution.status}`}>
                        {execution.status === 'success' && <Icons.Check />}
                        {execution.status === 'failed' && <Icons.X />}
                        {execution.status === 'running' && <Icons.Clock />}
                        {execution.status === 'success' ? '成功' :
                         execution.status === 'failed' ? '失败' :
                         execution.status === 'running' ? '运行中' : '等待中'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(execution.startedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {formatDuration(execution.duration)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {execution.nodesExecuted} 个
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Icons.Clock />
            </div>
            <p className="text-slate-500">暂无执行记录</p>
            <p className="text-sm text-slate-400 mt-1">运行工作流后，执行记录将显示在这里</p>
          </div>
        )}
      </main>
    </div>
  )
}
