<script setup lang="ts">
import { Search, Radio } from "@lucide/vue"
import { cn } from "@/lib/utils"
import type { MikrotikNetwatchItem } from "#shared/types/api"
import type { WsMessage } from "@/composables/createWsConnection"

/**
 * Versi PORTAL dari NetwatchView (staff) -- CUMA mode Card (TIDAK ADA
 * toggle List, TIDAK ADA tombol Tambah/aksi per-host -- scope Portal
 * utk Netwatch cuma lihat). Mekanisme WebSocket SAMA PERSIS dgn versi
 * staff: data diambil SEKALIGUS (tanpa pagination server) saat halaman
 * dibuka, update SETELAHNYA murni via broadcast (section='netwatch'),
 * TIDAK ADA request ulang ke server.
 */
const props = defineProps<{ initialData: MikrotikNetwatchItem[] }>()

const items = ref<MikrotikNetwatchItem[]>(props.initialData)
watch(() => props.initialData, (val) => { items.value = val })

const { status } = useNetmgmtWsMessage((msg: WsMessage) => {
  if (msg.section === "netwatch") {
    const results = (msg.message as { results?: MikrotikNetwatchItem[] }).results
    if (Array.isArray(results)) items.value = results
  }
})

const searchQuery = ref("")
const visibleItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const filtered = q ? items.value.filter((item) => item.host.toLowerCase().includes(q) || (item.comment ?? "").toLowerCase().includes(q)) : items.value
  return [...filtered].sort((a, b) => Number(b.status === "down") - Number(a.status === "down"))
})
const downCount = computed(() => items.value.filter((i) => i.status === "down").length)
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center gap-3">
      <div class="relative w-full sm:w-64">
        <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Cari host / comment" class="pl-8 text-xs" />
      </div>
      <Badge v-if="downCount > 0" variant="destructive">{{ downCount }} host down</Badge>
      <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Radio :class="cn('h-3.5 w-3.5', status === 'connected' ? 'text-success' : 'text-muted-foreground')" />
        {{ status === "connected" ? "Live" : status === "connecting" ? "Menghubungkan..." : "Terputus" }}
      </div>
    </div>

    <Card v-if="visibleItems.length === 0" class="py-8 text-center text-sm text-muted-foreground">Tidak ada host netwatch ditemukan.</Card>
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <PortalNetwatchCard v-for="item in visibleItems" :key="item.id" :item="item" />
    </div>
  </div>
</template>
