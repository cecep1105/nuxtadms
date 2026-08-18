<script setup lang="ts">

import { Mail, X } from "@lucide/vue"

const { request } = useApiClient()
const props = defineProps<{ qid: string; }>()
const loading = ref(false)
const error = ref<string | null>(null)


const rawHeaders = ref()

interface MailHeader {
  name: string
  value: string
}

interface QHeaderResponse {
  result: string[]
}


function parseHeaders(lines: string[]): MailHeader[] {
  const headers: MailHeader[] = []

  // try{
  for (const line of lines) {
    // Continuation line
    if (/^[\t ]/.test(line) && headers.length) {
      headers[headers.length - 1]!.value  += ` ${line.trim()}`
      continue
    }

    const separator = line.indexOf(':')

    if (separator === -1) continue

    headers.push({
      name: line.slice(0, separator).trim(),
      value: line.slice(separator + 1).trim(),
    })
  }
// } catch (e) {}

  return headers
}


const headers = computed(() => parseHeaders(rawHeaders.value))

const open = ref(false)
const position = ref({ x: 24, y: 90 })

let dragState: { startX: number; startY: number; originX: number; originY: number } | null = null


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

async function loadMailHeaders() {
  loading.value = true
  error.value = null
  try {
    const data = await request<QHeaderResponse>(`/netmgmt/zentyal-mail/qheader/?qid=${props.qid}`)
    rawHeaders.value = data.result
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal mengambil header email.")
  } finally {
    loading.value = false
  }
}

watch([open], () => { if (open.value) loadMailHeaders() })

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", handleDragMove)
  document.removeEventListener("mouseup", handleDragEnd)
})
</script>

<template>
  <Button v-if="!open" variant="ghost" size="sm" @click="open = true" class="h-auto p-0 font-normal hover:bg-transparent"><Mail class="h-3.5 w-3.5" /></Button>
  <div v-else class="fixed z-50 w-[40rem] overflow-hidden rounded-lg border border-border shadow-2xl" :style="{ left: `${position.x}px`, top: `${position.y}px` }">
    <div class="flex cursor-move select-none items-center justify-between bg-secondary px-3 py-2" @mousedown="handleDragStart">
      <span class="flex items-center gap-1.5 text-xs font-medium text-foreground"><Mail class="h-3.5 w-3.5" /> Mail Header QID: {{ qid }}</span>
      <div class="flex items-center gap-1.5">
        <Button variant="outline" size="icon" class="h-6 w-6 text-foreground" aria-label="Tutup console" @click="open = false"><X class="h-3.5 w-3.5" /></Button>
      </div>
    </div>
    <div class="h-96 space-y-0.5 overflow-y-auto bg-black p-3  text-[8px] text-emerald-400">
        <div class="space-y-2 text-sm">
          <div
            v-for="header in headers"
            :key="header.name"
            class="grid grid-cols-[120px_1fr] gap-3"
          >
            <span class="font-medium text-muted-foreground">
              {{ header.name }}:
            </span>
            <span class="min-w-0 break-words text-xs">
              {{ header.value }}
            </span>
          </div>
        </div>
    </div>
  </div>
</template>
