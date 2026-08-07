<script setup lang="ts">
import { ArrowLeft } from "@lucide/vue"
import type { AttendanceRecapResponse, DjangoApiUser } from "#shared/types/api"

const PAGE_SIZE = 20
const RECAP_TYPE_LABEL: Record<string, string> = { all: "All", kantin: "Kantin", driver: "Driver" }

definePageMeta({ layout: "portal" })

function formatTime(iso: string | null): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}

const route = useRoute()
const { request } = useApiClient()

const { data: user } = await useAsyncData("portal-recap-me", () => request<DjangoApiUser>("/me/"))
const permissions = computed(() => ({
  can_view_attendance_recap: user.value?.can_view_attendance_recap ?? false,
  can_view_attendance_recap_kantin: user.value?.can_view_attendance_recap_kantin ?? false,
  can_view_attendance_recap_driver: user.value?.can_view_attendance_recap_driver ?? false,
}))

const allowedTypes = computed(() =>
  (["all", "kantin", "driver"] as const).filter((t) => permissions.value[`can_view_attendance_recap${t === "all" ? "" : `_${t}`}` as keyof typeof permissions.value])
)
const recapType = computed(() => {
  const requested = route.query.recap_type as string | undefined
  return requested && allowedTypes.value.includes(requested as "all" | "kantin" | "driver") ? requested : (allowedTypes.value[0] ?? "all")
})

const pageSize = computed(() => Number(route.query.page_size ?? PAGE_SIZE))
const queried = computed(() => Boolean(route.query.date_from && route.query.date_to))

const query = computed(() => {
  if (!queried.value) return null
  const params = new URLSearchParams({
    recap_type: recapType.value, date_from: route.query.date_from as string, date_to: route.query.date_to as string,
    page: (route.query.page as string) ?? "1", page_size: String(pageSize.value),
  })
  if (route.query.pin) params.set("pin", String(route.query.pin))
  if (route.query.function && recapType.value === "all") params.set("function", String(route.query.function))
  if (route.query.pool) params.set("pool", String(route.query.pool))
  if (route.query.device) params.set("device", String(route.query.device))
  return params.toString()
})

const { data: recap, pending } = await useAsyncData(
  () => `portal-recap-${query.value}`,
  () => (query.value ? request<AttendanceRecapResponse>(`/iclock/attendance-recap/?${query.value}`) : Promise.resolve(null)),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader :title="`Rekap Absensi - ${RECAP_TYPE_LABEL[recapType]}`">
      <template #description>
        <NuxtLink to="/portal" class="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft class="h-3 w-3" /> Kembali ke Menu
        </NuxtLink>
      </template>
      <template #action>
        <ExportXlsxButton v-if="queried" api-path="/iclock/attendance-recap/export/" />
      </template>
    </PageHeader>

    <Card v-if="allowedTypes.length === 0" class="p-8 text-center text-sm text-muted-foreground">
      Anda belum memiliki izin untuk melihat Rekap Absensi. Hubungi admin.
    </Card>

    <template v-else>
      <RecapTypeTabs :current="recapType" :permissions="permissions" />
      <PortalRecapFilterBar :recap-type="recapType" :permissions="permissions" />

      <div class="mt-4">
        <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
        <Card v-else-if="!queried" class="p-8 text-center text-sm text-muted-foreground">
          Pilih rentang tanggal & klik "Terapkan Filter" untuk menampilkan rekap.
        </Card>
        <Card v-else-if="!recap?.results.length" class="p-8 text-center text-sm text-muted-foreground">
          Tidak ada data absensi untuk filter ini.
        </Card>
        <Card v-else>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="sticky left-0 z-10 bg-muted/50">Employee</TableHead>
                <TableHead v-for="col in recap.date_columns" :key="col.date" class="text-center">
                  <div>{{ col.day_name }}</div>
                  <div class="font-tabular text-[10px] font-normal">{{ new Date(col.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" }) }}</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="row in recap.results" :key="row.pin">
                <TableCell class="sticky left-0 z-10 bg-card">
                  <p class="font-medium">{{ row.name?.trim() || "-" }}</p>
                  <p class="font-mono text-[11px] text-muted-foreground">{{ row.pin }}</p>
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
          <PaginationBar :count="recap.count" :page-size="pageSize" :current-page="recap.page" />
        </Card>
      </div>
    </template>
  </div>
</template>
