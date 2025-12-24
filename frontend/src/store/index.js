import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

// 节点类型定义
export const NODE_TYPES = {
  // 触发器
  WEBHOOK: { type: 'trigger', name: 'Webhook', icon: '🔗', color: 'blue', description: '接收 HTTP 请求触发工作流' },
  SCHEDULE: { type: 'trigger', name: '定时触发', icon: '⏰', color: 'blue', description: '按计划定时执行工作流' },
  GEO_TRIGGER: { type: 'trigger', name: '地理触发', icon: '🌍', color: 'blue', description: '基于访问者地理位置触发' },

  // 动作
  HTTP_REQUEST: { type: 'action', name: 'HTTP 请求', icon: '🌐', color: 'purple', description: '发送 HTTP 请求到外部 API' },
  TRANSFORM: { type: 'action', name: '数据转换', icon: '🔄', color: 'purple', description: '转换和处理数据' },
  AI_PROCESS: { type: 'action', name: 'AI 处理', icon: '🤖', color: 'purple', description: '使用 AI 处理数据' },
  CACHE: { type: 'action', name: '边缘缓存', icon: '💾', color: 'purple', description: '读写边缘 KV 存储' },
  DELAY: { type: 'action', name: '延迟', icon: '⏳', color: 'purple', description: '等待指定时间' },

  // 条件
  CONDITION: { type: 'condition', name: '条件判断', icon: '❓', color: 'amber', description: '根据条件分支执行' },
  FILTER: { type: 'condition', name: '数据过滤', icon: '🔍', color: 'amber', description: '过滤数据' },

  // 输出
  RESPONSE: { type: 'output', name: 'HTTP 响应', icon: '📤', color: 'green', description: '返回 HTTP 响应' },
  NOTIFY: { type: 'output', name: '发送通知', icon: '📧', color: 'green', description: '发送邮件或消息通知' },
  LOG: { type: 'output', name: '日志记录', icon: '📝', color: 'green', description: '记录日志' },
}

// 工作流状态管理
export const useWorkflowStore = create(
  persist(
    (set, get) => ({
      // 工作流列表
      workflows: [],

      // 当前编辑的工作流
      currentWorkflow: null,

      // 节点列表
      nodes: [],

      // 连接列表
      connections: [],

      // 选中的节点
      selectedNode: null,

      // 执行历史
      executions: [],

      // 边缘信息
      edgeInfo: null,

      // 创建新工作流
      createWorkflow: (name = '未命名工作流') => {
        const workflow = {
          id: uuidv4(),
          name,
          description: '',
          nodes: [],
          connections: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: 'draft',
        }
        set((state) => ({
          workflows: [...state.workflows, workflow],
          currentWorkflow: workflow,
          nodes: [],
          connections: [],
        }))
        return workflow.id
      },

      // 加载工作流
      loadWorkflow: (workflowId) => {
        const workflow = get().workflows.find((w) => w.id === workflowId)
        if (workflow) {
          set({
            currentWorkflow: workflow,
            nodes: workflow.nodes || [],
            connections: workflow.connections || [],
          })
        }
      },

      // 保存当前工作流
      saveWorkflow: () => {
        const { currentWorkflow, nodes, connections, workflows } = get()
        if (!currentWorkflow) return

        const updatedWorkflow = {
          ...currentWorkflow,
          nodes,
          connections,
          updatedAt: Date.now(),
        }

        set({
          currentWorkflow: updatedWorkflow,
          workflows: workflows.map((w) =>
            w.id === currentWorkflow.id ? updatedWorkflow : w
          ),
        })
      },

      // 添加节点
      addNode: (nodeType, position) => {
        const nodeConfig = NODE_TYPES[nodeType]
        if (!nodeConfig) return

        const node = {
          id: uuidv4(),
          type: nodeType,
          ...nodeConfig,
          position,
          config: {},
          createdAt: Date.now(),
        }

        set((state) => ({
          nodes: [...state.nodes, node],
        }))

        return node
      },

      // 更新节点
      updateNode: (nodeId, updates) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, ...updates } : n
          ),
        }))
      },

      // 删除节点
      deleteNode: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          connections: state.connections.filter(
            (c) => c.sourceId !== nodeId && c.targetId !== nodeId
          ),
          selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
        }))
      },

      // 选中节点
      selectNode: (node) => set({ selectedNode: node }),

      // 添加连接
      addConnection: (sourceId, targetId) => {
        const connection = {
          id: uuidv4(),
          sourceId,
          targetId,
        }
        set((state) => ({
          connections: [...state.connections, connection],
        }))
      },

      // 删除连接
      deleteConnection: (connectionId) => {
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== connectionId),
        }))
      },

      // 删除工作流
      deleteWorkflow: (workflowId) => {
        set((state) => ({
          workflows: state.workflows.filter((w) => w.id !== workflowId),
          currentWorkflow: state.currentWorkflow?.id === workflowId ? null : state.currentWorkflow,
        }))
      },

      // 添加执行记录
      addExecution: (execution) => {
        set((state) => ({
          executions: [execution, ...state.executions].slice(0, 100),
        }))
      },

      // 设置边缘信息
      setEdgeInfo: (info) => set({ edgeInfo: info }),

      // 重置编辑器
      resetEditor: () => set({
        currentWorkflow: null,
        nodes: [],
        connections: [],
        selectedNode: null,
      }),
    }),
    {
      name: 'edgeflow-storage',
      partialize: (state) => ({
        workflows: state.workflows,
        executions: state.executions,
      }),
    }
  )
)
