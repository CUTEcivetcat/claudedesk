import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'chat',
      component: () => import('../views/ChatView.vue')
    },
    {
      path: '/chat/:conversationId',
      name: 'chat-conversation',
      component: () => import('../views/ChatView.vue')
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('../views/HistoryView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue')
    },
    {
      path: '/review',
      name: 'review',
      component: () => import('../views/CodeReviewView.vue')
    },
    {
      path: '/review/:conversationId',
      name: 'review-conversation',
      component: () => import('../views/CodeReviewView.vue')
    }
  ]
})

export default router
