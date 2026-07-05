export default {
  app: {
    title: 'ClaudeDesk',
    subtitle: 'Desktop AI Coding Assistant'
  },
  sidebar: {
    newChat: 'New Chat',
    searchPlaceholder: 'Search conversations...',
    noConversations: 'No conversations yet'
  },
  chat: {
    startConversation: 'Start a Conversation',
    startHint: 'Select a conversation or send a message to begin',
    you: 'You',
    assistant: 'Assistant',
    system: 'System',
    typePlaceholder: 'Type a message... (Enter to send, Shift+Enter for new line)',
    cancel: 'Cancel',
    generating: 'Generating...',
    idle: 'Idle',
    streaming: 'Streaming',
    model: 'Model'
  },
  context: {
    title: 'Context Budget',
    percentUsed: '{percent}% used',
    costEstimate: 'Cost Estimate',
    thisSession: 'This session',
    streaming: 'Status',
    generating: 'Generating...',
    idle: 'Idle'
  },
  settings: {
    title: 'Settings',
    subtitle: 'Manage API providers and profiles',
    addProfile: 'Add Profile',
    editProfile: 'Edit Profile',
    profileName: 'Profile Name',
    profileNamePlaceholder: 'e.g. Work Anthropic',
    provider: 'Provider',
    apiKey: 'API Key',
    apiKeyPlaceholder: 'sk-...',
    apiKeyLeaveEmpty: 'Leave empty to keep current key',
    endpointUrl: 'Endpoint URL',
    endpointAuto: 'Auto-detected if empty',
    defaultModel: 'Default Model',
    maxTokens: 'Max Output Tokens',
    cancel: 'Cancel',
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
    activate: 'Activate',
    active: 'Active',
    edit: 'Edit',
    keyNotSet: 'Not set',
    noProfiles: 'No profiles configured. Add one to get started.',
    confirmDelete: 'Delete this profile?',
    anthropic: 'Anthropic (Claude)',
    openai: 'OpenAI (GPT)',
    deepseek: 'DeepSeek',
    custom: 'Custom (OpenAI-compatible)'
  },
  history: {
    title: 'Conversation History',
    subtitle: 'Browse, search, and export your conversations',
    searchPlaceholder: 'Search across all messages...',
    title_column: 'Title',
    model: 'Model',
    messages: 'Messages',
    tokens: 'Tokens',
    updated: 'Updated',
    actions: 'Actions',
    confirmDelete: 'Delete this conversation?',
    export: 'Export'
  },
  review: {
    title: 'Code Review',
    subtitle: 'Select files and get AI review',
    selectFiles: 'Select Files',
    noFiles: 'No files selected',
    reviewPrompt: 'What should the review focus on? (optional)',
    reviewButton: 'Review {count} File(s)',
    reviewing: 'Reviewing...',
    results: 'Review Results',
    emptyHint: 'Select files on the left and click "Review" to get AI feedback',
    analyzing: 'Analyzing code...',
    configureApiFirst: 'Please configure an API profile first'
  },
  profile: {
    switcherLabel: 'Provider:',
    configureHint: 'Configure API Key →'
  },
  common: {
    cancel: 'Cancel',
    delete: 'Delete',
    save: 'Save',
    export: 'Export',
    loading: 'Loading...',
    error: 'Error',
    noData: 'No data',
    noFolderOpened: 'No folder opened',
    noApi: 'No API configured'
  },
  theme: {
    toggle: 'Toggle Theme'
  },
  activity: {
    explorer: 'Explorer (Ctrl+Shift+E)',
    chats: 'Chats (Ctrl+Shift+H)',
    search: 'Search',
    settings: 'Settings',
    searchComingSoon: 'Search coming soon...'
  },
  editor: {
    selectFile: 'Select a file from Explorer',
    openFolder: 'Open a folder in Explorer to get started',
    shortcuts: 'Ctrl+B Explorer · Ctrl+J Chat · Ask AI to read/write files'
  }
}
