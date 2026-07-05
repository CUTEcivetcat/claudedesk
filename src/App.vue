<script setup lang="ts">
import AppShell from './components/layout/AppShell.vue'
</script>

<template>
  <AppShell />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Force naive-ui layout containers to not scroll */
.n-layout,
.n-layout-content {
  overflow: hidden !important;
}
</style>
