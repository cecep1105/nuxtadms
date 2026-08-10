<script setup lang="ts">
import { ArrowLeft } from "@lucide/vue"
import type { Paginated, ActiveDevice, Department } from "#shared/types/api"

/**
 * Versi SEDERHANA (SENGAJA TANPA IclockWsProvider/live-update
 * WebSocket spt staff) dari halaman Active Device -- cakupan portal V1
 * ini cukup lihat status apa adanya + 3 aksi yg disepakati (sync jam,
 * live log, transfer finger) -- bisa diperluas nanti kalau live-update
 * real-time dibutuhkan juga di portal.
 */
const PAGE_SIZE = 20
definePageMeta({ layout: "portal" })

const route = useRoute()
const { request } = useApiClient()

const query = computed(() => {
  const params = new URLSearchParams()
  if (route.query.q) params.set("q", String(route.query.q))
  if (route.query.page) params.set("page", String(route.query.page))
  params.set("page_size", String(PAGE_SIZE))
  return params.toString()
})

const { data: devicesData, pending, error } = await useAsyncData(
  () => `portal-active-devices-${query.value}`,
  () => request<Paginated<ActiveDevice>>(`/iclock/active-device/?${query.value}`),
  { watch: [query] }
)

const { data: departmentsData } = await useAsyncData(
  "portal-active-devices-departments",
  () => request<Paginated<Department>>("/iclock/department/?page_size=200")
)

const { data: allDevicesData } = await useAsyncData(
  "portal-active-devices-all",
  // Terpisah dari devicesData (list terpaginasi) -- KHUSUS isi dropdown
  // "Device Spesifik" di dialog Transfer Finger, butuh SEMUA device.
  () => request<Paginated<ActiveDevice>>("/iclock/active-device/?page_size=500")
)
</script>

<template>
  <div>
    <PageHeader title="Active Device">
      <template #description>
        <NuxtLink to="/portal" class="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft class="h-3 w-3" /> Kembali ke Menu
        </NuxtLink>
      </template>
    </PageHeader>
    <Card>
      <div class="border-b border-border p-3">
        <SearchBar placeholder="Cari SN / Alias" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>SN</TableHead>
            <TableHead>Alias</TableHead>
            <TableHead>Departemen</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!devicesData?.results.length">
            <TableCell :colspan="6" class="py-8 text-center text-muted-foreground">Tidak ada device ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="device in devicesData?.results" :key="device.SN" v-else>
            <TableCell class="font-mono">{{ device.SN }}</TableCell>
            <TableCell class="font-medium">{{ device.Alias }}</TableCell>
            <TableCell><Badge variant="secondary">{{ device.DeptName || "-" }}</Badge></TableCell>
            <TableCell class="text-muted-foreground">{{ device.IPAddress || "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ device.LastActivity ? new Date(device.LastActivity).toLocaleString("id-ID") : "-" }}</TableCell>
            <TableCell>
              <div class="flex justify-end">
                <PortalDeviceActionsMenu :sn="device.SN" :alias="device.Alias" :departments="departmentsData?.results ?? []" :devices="allDevicesData?.results ?? []" />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="devicesData?.count ?? 0" :page-size="PAGE_SIZE" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
