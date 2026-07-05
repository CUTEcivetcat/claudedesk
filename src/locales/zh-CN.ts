export default {
  app: {
    title: 'ClaudeDesk',
    subtitle: '桌面端 AI 编程助手'
  },
  sidebar: {
    newChat: '新建对话',
    searchPlaceholder: '搜索对话...',
    noConversations: '暂无对话记录'
  },
  chat: {
    startConversation: '开始对话',
    startHint: '选择一个对话或发送消息开始',
    you: '你',
    assistant: 'AI 助手',
    system: '系统',
    typePlaceholder: '输入消息... (Enter 发送，Shift+Enter 换行)',
    cancel: '取消生成',
    generating: '生成中...',
    idle: '空闲',
    streaming: '流式输出中',
    model: '模型'
  },
  context: {
    title: '上下文用量',
    percentUsed: '{percent}% 已用',
    costEstimate: '费用估算',
    thisSession: '本次会话',
    streaming: '状态',
    generating: '生成中...',
    idle: '空闲'
  },
  settings: {
    title: '设置',
    subtitle: '管理 API 提供商和配置文件',
    addProfile: '添加配置',
    editProfile: '编辑配置',
    profileName: '配置名称',
    profileNamePlaceholder: '例如：工作账号 Anthropic',
    provider: '提供商',
    apiKey: 'API Key',
    apiKeyPlaceholder: 'sk-...',
    apiKeyLeaveEmpty: '留空则保持当前 Key',
    endpointUrl: 'API 地址',
    endpointAuto: '留空自动检测',
    defaultModel: '默认模型',
    maxTokens: '最大输出 Token',
    cancel: '取消',
    create: '创建',
    update: '更新',
    delete: '删除',
    activate: '激活',
    active: '当前使用',
    edit: '编辑',
    keyNotSet: '未设置',
    noProfiles: '尚未配置任何 API，请添加一个开始使用。',
    confirmDelete: '确定删除此配置？',
    anthropic: 'Anthropic (Claude)',
    openai: 'OpenAI (GPT)',
    deepseek: 'DeepSeek',
    custom: '自定义 (兼容 OpenAI)'
  },
  history: {
    title: '对话历史',
    subtitle: '浏览、搜索和导出你的对话',
    searchPlaceholder: '搜索所有消息...',
    title_column: '标题',
    model: '模型',
    messages: '消息',
    tokens: 'Token',
    updated: '更新时间',
    actions: '操作',
    confirmDelete: '删除此对话？',
    export: '导出'
  },
  review: {
    title: '代码审查',
    subtitle: '选择文件并获取 AI 审查意见',
    selectFiles: '选择文件',
    noFiles: '未选择文件',
    reviewPrompt: '审查重点？（可选）',
    reviewButton: '审查 {count} 个文件',
    reviewing: '审查中...',
    results: '审查结果',
    emptyHint: '在左侧选择文件，点击"审查"获取 AI 反馈',
    analyzing: '正在分析代码...',
    configureApiFirst: '请先配置 API 密钥'
  },
  profile: {
    switcherLabel: '提供商：',
    configureHint: '配置 API Key →'
  },
  common: {
    cancel: '取消',
    delete: '删除',
    save: '保存',
    export: '导出',
    loading: '加载中...',
    error: '错误',
    noData: '暂无数据',
    noFolderOpened: '未打开文件夹',
    noApi: '未配置 API'
  },
  theme: {
    toggle: '切换主题'
  },
  activity: {
    explorer: '资源管理器 (Ctrl+Shift+E)',
    chats: '对话 (Ctrl+Shift+H)',
    search: '搜索',
    settings: '设置',
    searchComingSoon: '搜索功能即将推出...'
  },
  editor: {
    selectFile: '从资源管理器中选择文件',
    openFolder: '在资源管理器中打开文件夹以开始',
    shortcuts: 'Ctrl+B 资源管理器 · Ctrl+J 对话 · 让 AI 读写文件'
  }
}
