<script setup lang="ts">
import { Wifi, WifiOff } from "@lucide/vue"
import type { Paginated, ActiveDevice, Department } from "#shared/types/api"

/**
 * Versi Nuxt dari halaman Active Device -- SEMUA aksi (12 total di
 * backend: list/retrieve/reboot/sync-time/network-params/
 * generic-param/live-users/live-logs/backup-fingerprints/
 * user-toggle-privilege/user-delete/user-transfer-finger) SUDAH
 * diporting lengkap.
 *
 * ⚠️ PENYEDERHANAAN YANG DISENGAJA: versi Next.js py live-update
 * WebSocket (status Online/Offline & Last Activity berubah REAL-TIME
 * tanpa refresh) -- di sini SENGAJA belum diporting (kompleksitas
 * tambahan: WS provider, reactive state sync per-device) supaya modul
 * inti (tabel + semua aksi) bisa selesai dulu. Data di sini ter-refresh
 * saat halaman dibuka/refreshNuxtData() dipanggil (SETIAP kali ada
 * aksi yang berhasil), TIDAK live per-detik spt Next.js. Bisa
 * ditambahkan nanti kalau dibutuhkan.
 */
const PAGE_SIZE = 20
const STALE_MS = 60 * 60 * 1000 // SAMA dgn ACTIVE_DEVICE_STALE_MINUTES Django (60 menit)

const search = ref("")
const page = ref(1)

const { request } = useApiClient()

const query = computed(() => {
  const params = new URLSearchParams({ page: String(page.value), page_size: String(PAGE_SIZE) })
  if (search.value) params.set("q", search.value)
  return params.toString()
})

const { data: devicesData, pending, error, refresh } = await useAsyncData(
  "active-devices-list",
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

function isRecentlyActive(lastActivity: string | null): boolean {
  if (!lastActivity) return false
  const t = new Date(lastActivity).getTime()
  return !Number.isNaN(t) && Date.now() - t < STALE_MS
}

function handleSearch() {
  page.value = 1
  refresh()
}

const totalPages = computed(() => Math.max(1, Math.ceil((devicesData.value?.count ?? 0) / PAGE_SIZE)))
</script>

<template>
  <div>
    <PageHeader
      title="Active Device"
      description="Device fingerprint yang terhubung & aktif berkomunikasi via PUSH SDK."
    >
      <template #action>
        <DeviceFormDialog mode="create" :departments="departmentsData?.results ?? []" />
      </template>
    </PageHeader>

    <Card>
      <div class="flex items-center gap-2 border-b border-border p-3">
        <form class="flex flex-1 gap-2" @submit.prevent="handleSearch">
          <Input v-model="search" placeholder="Cari SN / Alias..." class="max-w-xs" />
          <Button type="submit" variant="outline" size="sm">Cari</Button>
        </form>
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>SN</TableHead>
            <TableHead>Alias</TableHead>
            <TableHead>Device Name</TableHead>
            <TableHead>Pool</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Push Ver</TableHead>
            <TableHead>Realtime</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead title="Waktu transaksi/absensi TERAKHIR dari device ini">Last Data</TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!devicesData?.results.length">
            <TableCell :colspan="11" class="py-8 text-center text-muted-foreground">Tidak ada device ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="device in devicesData?.results" :key="device.SN" v-else>
            <TableCell>
              <Badge v-if="isRecentlyActive(device.LastActivity)" variant="success"><Wifi class="mr-1 h-2.5 w-2.5" /> Online</Badge>
              <Badge v-else variant="secondary"><WifiOff class="mr-1 h-2.5 w-2.5" /> Offline</Badge>
            </TableCell>
            <TableCell class="font-mono">{{ device.SN }}</TableCell>
            <TableCell class="font-medium">{{ device.Alias }}</TableCell>
            <TableCell class="font-medium">{{ device.DeviceName ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ device.DeptName ?? "-" }}</TableCell>
            <TableCell class="font-mono text-muted-foreground">{{ device.IPAddress ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ device.PushVersion ?? "-" }}</TableCell>
            <TableCell>
              <span v-if="device.Realtime" class="text-success">Ya</span>
              <span v-else class="text-muted-foreground">Tidak</span>
            </TableCell>
            <TableCell class="font-tabular text-muted-foreground">{{ device.LastActivity ? new Date(device.LastActivity).toLocaleString("id-ID") : "-" }}</TableCell>
            <TableCell class="font-tabular text-muted-foreground">{{ device.LastData ? new Date(device.LastData).toLocaleString("id-ID") : "-" }}</TableCell>
            <TableCell>
              <div class="flex justify-end gap-0.5">
                <DeviceFormDialog mode="edit" :device="device" :departments="departmentsData?.results ?? []" />
                <DeviceActionsMenu :sn="device.SN" :alias="device.Alias" :departments="departmentsData?.results ?? []" :devices="allDevicesData?.results ?? []" />
                <DeleteDeviceButton :sn="device.SN" :alias="device.Alias" />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div class="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <span>{{ devicesData?.count ?? 0 }} device total</span>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" :disabled="page <= 1" @click="page = Math.max(1, page - 1)">Sebelumnya</Button>
          <span class="font-tabular">{{ page }} / {{ totalPages }}</span>
          <Button variant="outline" size="sm" :disabled="page >= totalPages" @click="page = Math.min(totalPages, page + 1)">Selanjutnya</Button>
        </div>
      </div>
    </Card>
  </div>
</template>
