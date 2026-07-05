import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable for drag-to-resize panel widths
 */
export function useResizable(initialWidth: number, minWidth = 200, maxWidth = 600) {
  const width = ref(initialWidth)
  const isDragging = ref(false)

  let startX = 0
  let startWidth = 0

  function onMouseDown(e: MouseEvent) {
    isDragging.value = true
    startX = e.clientX
    startWidth = width.value
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging.value) return
    const delta = e.clientX - startX
    const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + delta))
    width.value = newWidth
  }

  function onMouseUp() {
    isDragging.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  function resetWidth() {
    width.value = initialWidth
  }

  return {
    width,
    isDragging,
    onMouseDown,
    resetWidth
  }
}
