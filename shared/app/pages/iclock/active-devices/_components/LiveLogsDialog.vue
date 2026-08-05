<script setup lang="ts">
import { Loader2, RefreshCw } from "@lucide/vue"
import type { DeviceLiveLog } from "#shared/types/api"

const PAGE_SIZE = 10
type SortKey = "user_id" | "timestamp" | "status_label" | "punch_label"

const props = defineProps<{ sn: string; alias: string }>()
const open = defineModel<boolean>("open", { required: true })

const { request } = useApiClient()
const loading = ref(false)
const error = ref<string | null>(null)
const allLogs = ref<DeviceLiveLog[]>([])

const search = ref("")
const page = ref(1)
const sortKey = ref<SortKey>("timestamp")
const sortDir = ref<"asc" | "desc">("desc")

async function loadAllLogs() {
  loading.value = true
  error.value = null
  try {
    const data = await request<{ count: number; results: DeviceLiveLog[] }>(`/iclock/active-device/${props.sn}/live-logs/?page_size=100000`)
    allLogs.value = data.results
    page.value = 1
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal mengambil log absensi dari device.")
  } finally {
    loading.value = false
  }
}

watch(open, (isOpen) => { if (isOpen) loadAllLogs() })

function handleSort(key: string) {
  const k = key as SortKey
  if (k === sortKey.value) sortDir.value = sortDir.value === "asc" ? "desc" : "asc"
  else { sortKey.value = k; sortDir.value = k === "timestamp" ? "desc" : "asc" }
  page.value = 1
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleString("id-ID")
}

const filteredSorted = computed(() => {
  let result = allLogs.value
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    result = result.filter((l) => String(l.user_id ?? "").toLowerCase().includes(q))
  }
  result = [...result].sort((a, b) => {
    const av = String(a[sortKey.value] ?? "")
    const bv = String(b[sortKey.value] ?? "")
    const cmp = av.localeCompare(bv, undefined, { numeric: true })
    return sortDir.value === "desc" ? -cmp : cmp
  })
  return result
})

const count = computed(() => filteredSorted.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(count.value / PAGE_SIZE)))
const pageLogs = computed(() => filteredSorted.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))

watch(search, () => { page.value = 1 })
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[85vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Live Logs — {{ alias }}</DialogTitle>
        <DialogDescription>
          Log absensi yang MASIH TERSIMPAN di memori device saat ini (koneksi langsung, bukan dari database). Diambil sekali saat dibuka -- pencarian/pengurutan/halaman berikutnya semuanya instan.
        </DialogDescription>
      </DialogHeader>

      <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

      <div class="flex items-center gap-2">
        <Input v-model="search" placeholder="Cari PIN..." class="flex-1" :disabled="loading" />
        <Button variant="outline" size="icon" aria-label="Muat ulang dari device" :disabled="loading" @click="loadAllLogs">
          <RefreshCw :class="['h-3.5 w-3.5', loading && 'animate-spin']" />
        </Button>
      </div>

      <div class="overflow-y-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTh label="PIN" sort-key="user_id" :current-sort="sortKey" :current-dir="sortDir" @sort="handleSort" />
              <SortableTh label="Waktu" sort-key="timestamp" :current-sort="sortKey" :current-dir="sortDir" @sort="handleSort" />
              <SortableTh label="Status" sort-key="status_label" :current-sort="sortKey" :current-dir="sortDir" @sort="handleSort" />
              <SortableTh label="Verifikasi" sort-key="punch_label" :current-sort="sortKey" :current-dir="sortDir" @sort="handleSort" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="loading"><TableCell :colspan="4" class="py-8 text-center"><Loader2 class="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
            <TableRow v-else-if="pageLogs.length === 0"><TableCell :colspan="4" class="py-6 text-center text-muted-foreground">Tidak ada log ditemukan.</TableCell></TableRow>
            <TableRow v-for="(l, i) in pageLogs" :key="`${l.user_id}-${l.timestamp}-${i}`" v-else>
              <TableCell class="font-mono">{{ l.user_id }}</TableCell>
              <TableCell class="font-tabular text-muted-foreground">{{ formatTimestamp(l.timestamp) }}</TableCell>
              <TableCell><Badge variant="secondary">{{ l.status_label }}</Badge></TableCell>
              <TableCell class="text-muted-foreground">{{ l.punch_label }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <span>{{ count }} log{{ search.trim() ? ` (dari ${allLogs.length} total)` : "" }}</span>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" :disabled="page <= 1 || loading" @click="page = Math.max(1, page - 1)">Sebelumnya</Button>
          <span class="font-tabular">{{ page }} / {{ totalPages }}</span>
          <Button variant="outline" size="sm" :disabled="page >= totalPages || loading" @click="page = Math.min(totalPages, page + 1)">Selanjutnya</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
