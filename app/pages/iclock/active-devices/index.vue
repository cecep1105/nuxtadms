<script setup lang="ts">
import { Wifi, WifiOff, Radio } from "@lucide/vue"
import type { Paginated, ActiveDevice, Department } from "#shared/types/api"
import type { WsMessage } from "@/composables/createWsConnection"

/**
 * Versi Nuxt dari halaman Active Device -- SEMUA aksi (12 total di
 * backend) SUDAH diporting lengkap SEBELUMNYA. Update INI melengkapi 2
 * hal yang tadinya SENGAJA disederhanakan:
 *
 * 1. Sorting & pagination -- SEBELUMNYA halaman ini pakai state lokal
 *    manual (form search + tombol Sebelumnya/Selanjutnya sendiri),
 *    TIDAK KONSISTEN dgn pola URL-param (?q=/?page=/?ordering=) yang
 *    dipakai SEMUA halaman lain -- sekarang disamakan, pakai
 *    SearchBar/SortableHeader/PaginationBar spt biasa.
 * 2. Live update WebSocket (/ws/iclock) -- status Online/Offline &
 *    Last Activity/Last Data berubah REAL-TIME tanpa refresh. Field
 *    yang di-update lokal via WS (LastActivity/LastData) di-MERGE ke
 *    atas data hasil fetch server (bukan ganti total) -- supaya
 *    sorting/filter/pagination TETAP dari server, cuma 2 kolom itu yg
 *    "hidup".
 */
const PAGE_SIZE = 20
// SAMAKAN dgn iclock/views.py::ACTIVE_DEVICE_STALE_MINUTES (dashboard
// Django, default 60 menit).
const STALE_MS = 60 * 60 * 1000

const route = useRoute()
const { request } = useApiClient()

const page = computed(() => Number(route.query.page ?? "1"))
const pageSize = computed(() => Number(route.query.page_size ?? PAGE_SIZE))
const search = computed(() => (route.query.q as string) ?? "")
const ordering = computed(() => (route.query.ordering as string) ?? "")

const query = computed(() => {
  const params = new URLSearchParams({ page: String(page.value), page_size: String(pageSize.value) })
  if (search.value) params.set("q", search.value)
  if (ordering.value) params.set("ordering", ordering.value)
  return params.toString()
})

const { data: devicesData, pending, error } = await useAsyncData(
  () => `active-devices-list-${query.value}`,
  () => request<Paginated<ActiveDevice>>(`/iclock/active-device/?${query.value}`),
  { watch: [query] }
)

const { data: departmentsData } = await useAsyncData(
  "active-devices-departments",
  () => request<Paginated<Department>>("/iclock/department/?page_size=200")
)

const { data: allDevicesData } = await useAsyncData(
  "active-devices-all",
  // Terpisah dari devicesData (list terpaginasi, cuma ~20/halaman) --
  // ini KHUSUS utk isi dropdown "Device Spesifik" di dialog Transfer
  // Finger, butuh SEMUA device tanpa terpotong halaman.
  () => request<Paginated<ActiveDevice>>("/iclock/active-device/?page_size=500")
)

// Overlay lokal utk field yang di-update via WebSocket -- KEYED per SN,
// di-MERGE saat render (bukan mutasi devicesData langsung) supaya data
// hasil fetch server tetap sumber kebenaran utk field lain/urutan.
const liveOverlay = ref<Record<string, { LastActivity?: string; LastData?: string }>>({})

// Reset overlay tiap kali query (halaman/sort/search) berganti -- overlay
// LAMA milik device yg mungkin sudah tidak ada di halaman baru ini.
watch(query, () => { liveOverlay.value = {} })

function handleWsMessage(msg: WsMessage) {
  const sn = msg.message?.sn as string | undefined
  if (!sn) return
  const la = msg.message?.la
  const timestamp = typeof la === "string" ? la : new Date().toISOString()

  // PENTING: nama section PERSIS 'device_request'/'device_attlog' --
  // device_request (heartbeat/polling) -> update Last Activity
  // device_attlog (ada transaksi/absensi baru) -> update Last Data
  if (msg.section === "device_request") {
    liveOverlay.value = { ...liveOverlay.value, [sn]: { ...liveOverlay.value[sn], LastActivity: timestamp } }
  } else if (msg.section === "device_attlog") {
    liveOverlay.value = { ...liveOverlay.value, [sn]: { ...liveOverlay.value[sn], LastData: timestamp } }
  }
}
const { status: wsStatus } = useIclockWsMessage(handleWsMessage)

function displayDevice(device: ActiveDevice): ActiveDevice {
  const overlay = liveOverlay.value[device.SN]
  return overlay ? { ...device, ...overlay } : device
}

function isRecentlyActive2(lastActivity: string | null): boolean {
  if (!lastActivity) return false
  const t = new Date(lastActivity).getTime()
  return !Number.isNaN(t) && Date.now() - t < STALE_MS
}

function isRecentlyActive(lastActivity: string | null, lastData: string | null): boolean {
  const timestamps = [lastActivity, lastData]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => new Date(value).getTime())
    .filter((time) => !Number.isNaN(time));

  if (timestamps.length === 0) return false;

  const latestTimestamp = Math.max(...timestamps);
  return Date.now() - latestTimestamp < STALE_MS;
}




</script>

<template>
  <div>
    <PageHeader title="Active Device" description="Device fingerprint yang terhubung & aktif berkomunikasi via PUSH SDK. Kolom Status & Last Activity update REAL-TIME (WebSocket) tanpa perlu refresh.">
      <template #action>
        <DeviceFormDialog mode="create" :departments="departmentsData?.results ?? []" />
      </template>
    </PageHeader>

    <Card>
      <div class="flex items-center justify-between border-b border-border p-3">
        <SearchBar placeholder="Cari SN / Alias..." />
        <WsConsolePanel />
      </div>

      <div class="flex items-center justify-end border-b border-border px-3 py-1.5">
        <Tooltip>
          <TooltipTrigger as-child>
            <span :class="['inline-flex items-center gap-1 text-[11px]', wsStatus === 'connected' ? 'text-success' : wsStatus === 'connecting' ? 'text-warning' : 'text-muted-foreground']">
              <Radio class="h-3 w-3" /> {{ wsStatus === "connected" ? "Live" : wsStatus === "connecting" ? "Menghubungkan..." : "Terputus" }}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {{ wsStatus === "connected" ? "Live -- update real-time aktif" : wsStatus === "connecting" ? "Menghubungkan ke server real-time..." : "Real-time terputus -- data tetap bisa dilihat, tapi tidak update otomatis" }}
          </TooltipContent>
        </Tooltip>
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead><SortableHeader label="SN" sort-key="SN" /></TableHead>
            <TableHead><SortableHeader label="Alias" sort-key="Alias" /></TableHead>
            <TableHead><SortableHeader label="Device Name" sort-key="DeviceName" /></TableHead>
            <TableHead>Pool</TableHead>
            <TableHead><SortableHeader label="IP Address" sort-key="IPAddress" /></TableHead>
            <TableHead>Push Ver</TableHead>
            <TableHead>Realtime</TableHead>
            <TableHead><SortableHeader label="Last Activity" sort-key="LastActivity" /></TableHead>
            <TableHead title="Waktu transaksi/absensi TERAKHIR dari device ini (beda dari Last Activity yang cuma heartbeat/polling)">Last Data</TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!devicesData?.results.length">
            <TableCell :colspan="11" class="py-8 text-center text-muted-foreground">Tidak ada device ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="rawDevice in devicesData?.results" :key="rawDevice.SN" v-else>
            <TableCell>
              <Badge v-if="isRecentlyActive(displayDevice(rawDevice).LastActivity, displayDevice(rawDevice).LastData)" variant="success"><Wifi class="mr-1 h-2.5 w-2.5" /> Online</Badge>
              <Badge v-else variant="secondary"><WifiOff class="mr-1 h-2.5 w-2.5" /> Offline</Badge>
            </TableCell>
            <TableCell class="font-mono">{{ rawDevice.SN }}</TableCell>
            <TableCell class="font-medium">{{ rawDevice.Alias }}</TableCell>
            <TableCell class="font-medium">{{ rawDevice.DeviceName ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ rawDevice.DeptName ?? "-" }}</TableCell>
            <TableCell class="font-mono text-muted-foreground">{{ rawDevice.IPAddress ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ rawDevice.PushVersion ?? "-" }}</TableCell>
            <TableCell>
              <span v-if="rawDevice.Realtime" class="text-success">Ya</span>
              <span v-else class="text-muted-foreground">Tidak</span>
            </TableCell>
            <FlashCell
              :value="displayDevice(rawDevice).LastActivity ? new Date(displayDevice(rawDevice).LastActivity!).toLocaleString('id-ID') : '-'"
              class="font-tabular text-muted-foreground"
            />
            <FlashCell
              :value="displayDevice(rawDevice).LastData ? new Date(displayDevice(rawDevice).LastData!).toLocaleString('id-ID') : '-'"
              class="font-tabular text-muted-foreground"
            />
            <TableCell>
              <div class="flex justify-end gap-0.5">
                <DeviceFormDialog mode="edit" :device="rawDevice" :departments="departmentsData?.results ?? []" />
                <DeviceActionsMenu :sn="rawDevice.SN" :alias="rawDevice.Alias" :departments="departmentsData?.results ?? []" :devices="allDevicesData?.results ?? []" />
                <DeleteDeviceButton :sn="rawDevice.SN" :alias="rawDevice.Alias" />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <PaginationBar v-if="!pending && !error" :count="devicesData?.count ?? 0" :page-size="pageSize" :current-page="page" />
    </Card>
  </div>
</template>
