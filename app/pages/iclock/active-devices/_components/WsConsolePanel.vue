<script setup lang="ts">
import { Terminal, X, Trash2 } from "@lucide/vue"
import type { WsMessage } from "@/composables/createWsConnection"

interface LogLine { id: number; time: string; section: string; text: string }
const MAX_LINES = 500

/**
 * Console log WebSocket -- panel MELAYANG & BISA DIGESER (draggable),
 * supaya bisa dipindah menutupi bagian yang tidak sedang dilihat sambil
 * tetap bisa lihat tabel di baliknya.
 */
const open = ref(false)
const lines = ref<LogLine[]>([])
const position = ref({ x: 24, y: 90 })
const logContainerEl = ref<HTMLDivElement>()
let logIdCounter = 0
let dragState: { startX: number; startY: number; originX: number; originY: number } | null = null

const { status } = useIclockWsMessage((msg: WsMessage) => {
  logIdCounter += 1
  const time = new Date().toLocaleTimeString("id-ID")
  lines.value.push({ id: logIdCounter, time, section: msg.section, text: JSON.stringify(msg.message) })
  if (lines.value.length > MAX_LINES) lines.value = lines.value.slice(lines.value.length - MAX_LINES)
})

watch(lines, () => {
  nextTick(() => {
    if (logContainerEl.value) logContainerEl.value.scrollTop = logContainerEl.value.scrollHeight
  })
}, { deep: false })

function handleDragStart(e: MouseEvent) {
  dragState = { startX: e.clientX, startY: e.clientY, originX: position.value.x, originY: position.value.y }
  document.addEventListener("mousemove", handleDragMove)
  document.addEventListener("mouseup", handleDragEnd)
}
function handleDragMove(e: MouseEvent) {
  if (!dragState) return
  const dx = e.clientX - dragState.startX
  const dy = e.clientY - dragState.startY
  position.value = { x: Math.max(0, dragState.originX + dx), y: Math.max(0, dragState.originY + dy) }
}
function handleDragEnd() {
  dragState = null
  document.removeEventListener("mousemove", handleDragMove)
  document.removeEventListener("mouseup", handleDragEnd)
}
onBeforeUnmount(() => {
  document.removeEventListener("mousemove", handleDragMove)
  document.removeEventListener("mouseup", handleDragEnd)
})
</script>

<template>
  <Button v-if="!open" variant="outline" size="sm" @click="open = true"><Terminal class="h-3.5 w-3.5" /> Console</Button>

  <div v-else class="fixed z-50 w-[40rem] overflow-hidden rounded-lg border border-border shadow-2xl" :style="{ left: `${position.x}px`, top: `${position.y}px` }">
    <div class="flex cursor-move select-none items-center justify-between bg-secondary px-3 py-2" @mousedown="handleDragStart">
      <span class="flex items-center gap-1.5 text-xs font-medium"><Terminal class="h-3.5 w-3.5" /> WebSocket Console (/ws/iclock)</span>
      <div class="flex items-center gap-1.5">
        <Badge v-if="status === 'connected'" variant="success">Terhubung</Badge>
        <Badge v-else-if="status === 'connecting'" variant="warning">Menghubungkan...</Badge>
        <Badge v-else variant="destructive">Terputus</Badge>
        <Button variant="ghost" size="icon" class="h-6 w-6" aria-label="Bersihkan log" @click="lines = []"><Trash2 class="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" class="h-6 w-6" aria-label="Tutup console" @click="open = false"><X class="h-3.5 w-3.5" /></Button>
      </div>
    </div>
    <div ref="logContainerEl" class="h-56 space-y-0.5 overflow-y-auto bg-black p-3 font-mono text-[11px] text-emerald-400">
      <p v-if="lines.length === 0" class="text-muted-foreground">Menunggu event WebSocket...</p>
      <div v-for="line in lines" :key="line.id">[{{ line.time }}] ({{ line.section }}) {{ line.text }}</div>
    </div>
  </div>
</template>
