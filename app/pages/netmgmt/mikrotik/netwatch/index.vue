<script setup lang="ts">
import { Radio } from "@lucide/vue"
import type { MikrotikNetwatchItem } from "#shared/types/api"
import type { WsMessage } from "@/composables/createWsConnection"

const config = useRuntimeConfig()
const routerIp = config.public.mikrotikNetwatchRouterIp
const basePath = `/netmgmt/routeros/${routerIp}/tool-netwatch`

const { request } = useApiClient()
const { data, pending, error } = await useAsyncData(
  "mikrotik-netwatch",
  () => request<{ results: MikrotikNetwatchItem[] }>(`${basePath}/?_limit=1000`)
)

/**
 * Live update WebSocket -- BEDA pola dari Mail Queue (yg cuma
 * memicu re-fetch): broadcast netwatch SELALU membawa DAFTAR LENGKAP
 * (bukan cuma "ada perubahan, silakan refresh") -- section='netwatch',
 * `message.results` diganti LANGSUNG ke data lokal, TANPA perlu
 * request tambahan ke server sama sekali.
 */
const { status: wsStatus } = useNetmgmtWsMessage((msg: WsMessage) => {
  if (msg.section === "netwatch") {
    const results = (msg.message as { results?: MikrotikNetwatchItem[] }).results
    if (Array.isArray(results) && data.value) data.value = { results }
  }
})
</script>

<template>
  <div>
    <PageHeader title="NetMgmt / Mikrotik Netwatch" description="Mikrotik Host Monitoring -- live, update otomatis saat status berubah.">
      <template #action><AddNetwatchButton :base-path="basePath" /></template>
    </PageHeader>

    <div class="mb-3 flex items-center justify-end">
      <span :class="['inline-flex items-center gap-1.5 text-xs', wsStatus === 'connected' ? 'text-success' : wsStatus === 'connecting' ? 'text-warning' : 'text-muted-foreground']">
        <Radio class="h-3.5 w-3.5" />
        {{ wsStatus === "connected" ? "Live" : wsStatus === "connecting" ? "Menghubungkan..." : "Terputus, mencoba lagi..." }}
      </span>
    </div>

    <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
    <div v-else-if="error" class="rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
    <NetwatchView v-else :items="data?.results ?? []" :base-path="basePath" />
  </div>
</template>
