<script setup lang="ts">
import { Radio } from "@lucide/vue"
import { cn } from "@/lib/utils"
import type { WsMessage } from "@/composables/createWsConnection"

/**
 * TIDAK render tabelnya sendiri (data tetap dari useAsyncData di
 * index.vue) -- komponen ini CUMA dengarkan broadcast WebSocket
 * section='mailq' (dikirim Celery Beat tiap ~1 menit) & panggil
 * refreshNuxtData('zentyal-mail-queue') -- re-fetch data (TERMASUK
 * pagination/sort/filter yg SEDANG aktif di URL, krn key useAsyncData
 * yg SAMA dipakai ulang) dari server, TANPA reload penuh & TANPA
 * duplikasi logic pagination/sort/filter di sini.
 */
const lastUpdate = ref<Date | null>(null)

const { status } = useNetmgmtWsMessage((msg: WsMessage) => {
  if (msg.section === "mailq") {
    lastUpdate.value = new Date()
    refreshNuxtData("zentyal-mail-queue")
  }
})

// Re-render tiap 5 detik supaya teks "X detik lalu" ikut jalan.
const tick = ref(0)
let interval: ReturnType<typeof setInterval> | undefined
onMounted(() => { interval = setInterval(() => { tick.value++ }, 5000) })
onBeforeUnmount(() => { if (interval) clearInterval(interval) })

const secondsAgo = computed(() => {
  tick.value // dependency -- paksa recompute tiap tick
  return lastUpdate.value ? Math.round((Date.now() - lastUpdate.value.getTime()) / 1000) : null
})
</script>

<template>
  <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
    <Radio :class="cn('h-3.5 w-3.5', status === 'connected' ? 'text-success' : 'text-muted-foreground')" />
    <span v-if="status === 'connected'">Live<template v-if="secondsAgo !== null"> — diperbarui {{ secondsAgo }}d lalu</template></span>
    <span v-else-if="status === 'connecting'">Menghubungkan...</span>
    <span v-else>Terputus, mencoba lagi...</span>
  </div>
</template>
