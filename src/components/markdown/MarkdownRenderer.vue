<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

// Configure marked with syntax highlighting
marked.setOptions({
  highlight: function (code: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch { /* fall through */ }
    }
    try {
      return hljs.highlightAuto(code).value
    } catch {
      return code
    }
  },
  breaks: true,
  gfm: true
})

const props = defineProps<{ content: string }>()

const renderedHtml = computed(() => {
  if (!props.content) return ''
  try {
    return marked.parse(props.content) as string
  } catch {
    return props.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
})
</script>

<template>
  <div class="markdown-body" v-html="renderedHtml" />
</template>

<style>
.markdown-body {
  font-size: 14px;
  line-height: 1.65;
  color: var(--n-text-color);
}

.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--n-text-color);
}

.markdown-body h1 { font-size: 1.4em; }
.markdown-body h2 { font-size: 1.25em; }
.markdown-body h3 { font-size: 1.1em; }

.markdown-body p {
  margin-bottom: 8px;
}

.markdown-body p:last-child {
  margin-bottom: 0;
}

.markdown-body code {
  background: var(--n-color-embedded);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
}

.markdown-body pre {
  background: #1e1e2e;
  border-radius: 8px;
  padding: 14px 16px;
  overflow-x: auto;
  margin: 10px 0;
  border: 1px solid var(--n-border-color);
}

.markdown-body pre code {
  background: transparent;
  padding: 0;
  border-radius: 0;
  font-size: 13px;
  color: #cdd6f4;
}

.markdown-body ul, .markdown-body ol {
  padding-left: 20px;
  margin-bottom: 8px;
}

.markdown-body li {
  margin-bottom: 4px;
}

.markdown-body blockquote {
  border-left: 3px solid var(--n-color-target);
  padding-left: 12px;
  margin: 10px 0;
  color: var(--n-text-color-2);
}

.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
  font-size: 13px;
}

.markdown-body th, .markdown-body td {
  border: 1px solid var(--n-border-color);
  padding: 6px 12px;
  text-align: left;
}

.markdown-body th {
  background: var(--n-color-embedded);
  font-weight: 600;
}

.markdown-body a {
  color: var(--n-color-target);
  text-decoration: underline;
}

.markdown-body strong {
  font-weight: 600;
}
</style>
