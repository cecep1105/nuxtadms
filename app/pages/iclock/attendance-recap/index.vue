<script setup lang="ts">
import type { AttendanceRecapResponse, Paginated, Department, ActiveDevice } from "#shared/types/api"

const PAGE_SIZE = 20
const RECAP_TYPE_LABEL: Record<string, string> = { all: "All", kantin: "Kantin", driver: "Driver" }

function formatTime(iso: string | null): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}

const route = useRoute()
const { user } = useUserSession()
const { request } = useApiClient()

const permissions = computed(() => ({
  can_view_attendance_recap: user.value?.can_view_attendance_recap ?? false,
  can_view_attendance_recap_kantin: user.value?.can_view_attendance_recap_kantin ?? false,
  can_view_attendance_recap_driver: user.value?.can_view_attendance_recap_driver ?? false,
}))

// Kalau recap_type di URL TIDAK diizinkan (atau tidak diisi), jatuh ke
// jenis PERTAMA yang user PUNYA izinnya (prioritas: All -> Kantin ->
// Driver) -- BUKAN sekadar default 'all', krn user yang CUMA
// diizinkan Kantin/Driver harus tetap dapat tampilan relevan.
const allowedTypes = computed(() =>
  (["all", "kantin", "driver"] as const).filter((t) => permissions.value[`can_view_attendance_recap${t === "all" ? "" : `_${t}`}` as keyof typeof permissions.value])
)
const recapType = computed(() => {
  const requested = route.query.recap_type as string | undefined
  return requested && allowedTypes.value.includes(requested as "all" | "kantin" | "driver") ? requested : (allowedTypes.value[0] ?? "all")
})

const { data: departmentsData } = await useAsyncData("recap-departments", () => request<Paginated<Department>>("/iclock/department/?page_size=200"))
const { data: devicesData } = await useAsyncData("recap-devices", () => request<Paginated<ActiveDevice>>("/iclock/active-device/?page_size=500"))

const queried = computed(() => Boolean(route.query.date_from && route.query.date_to))
const pageSize = computed(() => Number(route.query.page_size ?? PAGE_SIZE))

const recapQuery = computed(() => {
  if (!queried.value) return null
  const params = new URLSearchParams({
    recap_type: recapType.value,
    date_from: route.query.date_from as string,
    date_to: route.query.date_to as string,
    page: (route.query.page as string) ?? "1",
    page_size: String(pageSize.value),
  })
  if (route.query.pin) params.set("pin", route.query.pin as string)
  if (route.query.function && recapType.value === "all") params.set("function", route.query.function as string)
  if (route.query.pool) params.set("pool", route.query.pool as string)
  if (route.query.device) params.set("device", route.query.device as string)
  return params.toString()
})

const { data: recap, pending, error } = await useAsyncData(
  "attendance-recap-data",
  () => (recapQuery.value ? request<AttendanceRecapResponse>(`/iclock/attendance-recap/?${recapQuery.value}`) : Promise.resolve(null)),
  { watch: [recapQuery] }
)
</script>

<template>
  <div>
    <div v-if="allowedTypes.length === 0">
      <PageHeader title="Attendance Recap" description="Anda belum memiliki izin untuk melihat Rekap Absensi jenis apa pun." />
      <Card class="p-8 text-center text-sm text-muted-foreground">
        Hubungi admin untuk meminta akses lewat halaman "Kelola Izin User".
      </Card>
    </div>

    <template v-else>
      <PageHeader :title="`Attendance Recap - ${RECAP_TYPE_LABEL[recapType]}`" description="Matrix jam check-in pertama & check-out terakhir per hari, per employee. Klik hasil pencarian PIN untuk lihat kartu bulanan lengkap.">
        <template v-if="queried" #action><ExportXlsxButton api-path="/iclock/attendance-recap/export/" /></template>
      </PageHeader>

      <RecapTypeTabs :current="recapType" :permissions="permissions" />
      <RecapFilterBar :departments="departmentsData?.results ?? []" :devices="devicesData?.results ?? []" :recap-type="recapType" :permissions="permissions" />

      <div class="mt-4">
        <Card v-if="!queried" class="p-8 text-center text-sm text-muted-foreground">
          Pilih rentang tanggal &amp; klik "Terapkan Filter" untuk menampilkan rekap.
        </Card>
        <Card v-else-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</Card>
        <Card v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</Card>
        <Card v-else-if="!recap?.results.length" class="p-8 text-center text-sm text-muted-foreground">
          Tidak ada data absensi untuk filter ini.
        </Card>
        <Card v-else>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="sticky left-0 z-10 bg-muted/50">Employee</TableHead>
                <TableHead v-for="col in recap!.date_columns" :key="col.date" class="text-center">
                  <div>{{ col.day_name }}</div>
                  <div class="font-tabular text-[10px] font-normal">{{ new Date(col.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" }) }}</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="row in recap!.results" :key="row.pin">
                <TableCell class="sticky left-0 z-10 bg-card">
                  <NuxtLink :to="`/iclock/attendance-recap/${encodeURIComponent(row.pin)}`" class="block hover:text-primary">
                    <p class="font-medium">{{ row.name?.trim() || "-" }}</p>
                    <p class="font-mono text-[11px] text-muted-foreground">{{ row.pin }}</p>
                  </NuxtLink>
                </TableCell>
                <TableCell v-for="cell in row.cells" :key="cell.date" class="text-center font-tabular text-[11px]">
                  <span v-if="cell.in_count === 0 && cell.out_count === 0" class="text-muted-foreground">-</span>
                  <div v-else>
                    <div class="text-success">
                      {{ formatTime(cell.in_first) }}<span v-if="cell.in_count > 1" class="text-muted-foreground"> ({{ cell.in_count }})</span>
                    </div>
                    <div class="text-destructive">
                      {{ formatTime(cell.out_last) }}<span v-if="cell.out_count > 1" class="text-muted-foreground"> ({{ cell.out_count }})</span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <PaginationBar :count="recap!.count" :page-size="pageSize" :current-page="recap!.page" />
        </Card>
      </div>
    </template>
  </div>
</template>
