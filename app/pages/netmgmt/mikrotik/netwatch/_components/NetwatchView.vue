<script setup lang="ts">
import { LayoutGrid, List, Search, RefreshCw } from "@lucide/vue"
import { cn } from "@/lib/utils"
import type { MikrotikNetwatchItem } from "#shared/types/api"

/**
 * ⚠️ PENYEDERHANAAN DISENGAJA: versi Next.js data netwatch di sini
 * DIKELOLA PENUH DI CLIENT dgn live-update WebSocket (broadcast setiap
 * status up/down berubah, SELALU berisi DAFTAR LENGKAP) -- di sini
 * DISEDERHANAKAN jadi fetch sekali + tombol refresh manual, SAMA
 * keputusan dgn Active Device & Mail Queue sebelumnya. Search & sort
 * "host down selalu di atas" tetap sepenuhnya di client (jumlah host
 * netwatch biasanya puluhan, bukan ribuan -- wajar diproses di client).
 */
const props = defineProps<{ items: MikrotikNetwatchItem[]; basePath: string }>()

const route = useRoute()
const router = useRouter()
const viewMode = computed(() => (route.query.view as "card" | "list") || "card")
const searchQuery = ref("")

function setViewMode(mode: "card" | "list") {
  router.push({ query: { ...route.query, view: mode } })
}

const visibleItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const filtered = q ? props.items.filter((item) => item.host.toLowerCase().includes(q) || (item.comment ?? "").toLowerCase().includes(q)) : props.items
  // Host 'down' SELALU di atas (langsung terlihat tanpa perlu cari/scroll).
  return [...filtered].sort((a, b) => Number(b.status === "down") - Number(a.status === "down"))
})

const downCount = computed(() => props.items.filter((i) => i.status === "down").length)
const refreshing = ref(false)
async function handleRefresh() {
  refreshing.value = true
  await refreshNuxtData()
  refreshing.value = false
}
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative w-full sm:w-64">
          <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input v-model="searchQuery" placeholder="Cari host / comment" class="pl-8 text-xs" />
        </div>
        <Badge v-if="downCount > 0" variant="destructive">{{ downCount }} host down</Badge>
        <Button variant="outline" size="sm" :disabled="refreshing" @click="handleRefresh">
          <RefreshCw :class="cn('h-3.5 w-3.5', refreshing && 'animate-spin')" /> Refresh
        </Button>
      </div>

      <div class="flex items-center gap-1 rounded-md border border-border p-0.5">
        <Button :variant="viewMode === 'card' ? 'secondary' : 'ghost'" size="sm" @click="setViewMode('card')"><LayoutGrid class="h-3.5 w-3.5" /> Card</Button>
        <Button :variant="viewMode === 'list' ? 'secondary' : 'ghost'" size="sm" @click="setViewMode('list')"><List class="h-3.5 w-3.5" /> List</Button>
      </div>
    </div>

    <template v-if="viewMode === 'card'">
      <Card v-if="visibleItems.length === 0" class="py-8 text-center text-sm text-muted-foreground">Tidak ada host netwatch ditemukan.</Card>
      <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <NetwatchCard v-for="item in visibleItems" :key="item.id" :item="item" :base-path="basePath" />
      </div>
    </template>

    <Card v-else>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Host</TableHead><TableHead>Status</TableHead><TableHead>Since</TableHead><TableHead>Interval</TableHead><TableHead>Disabled?</TableHead><TableHead>Comment</TableHead><TableHead class="text-right">Aksi</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="visibleItems.length === 0">
            <TableCell :colspan="7" class="py-8 text-center text-muted-foreground">Tidak ada host netwatch ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="item in visibleItems" :key="item.id" :class="item.status === 'down' ? 'bg-destructive/5' : undefined">
            <TableCell class="font-mono">{{ item.host }}</TableCell>
            <TableCell>
              <Badge v-if="item.status === 'down'" variant="destructive">Down</Badge>
              <Badge v-else-if="item.status === 'up'" variant="success">Up</Badge>
              <Badge v-else variant="warning">{{ item.status }}</Badge>
            </TableCell>
            <TableCell class="text-muted-foreground">{{ item.since ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ item.interval ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ item.disabled === "true" ? "yes" : "no" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ item.comment ?? "-" }}</TableCell>
            <TableCell>
              <div class="flex justify-end"><NetwatchActionsMenu :hostdata="item" :basepath="basePath" /></div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  </div>
</template>
