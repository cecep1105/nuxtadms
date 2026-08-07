<script setup lang="ts">
import type { Paginated, MobileAttendanceSource, MobileAttendanceRow } from "#shared/types/api"

const PAGE_SIZE = 10
const route = useRoute()
const { request } = useApiClient()

const { data: sourcesData } = await useAsyncData(
  "mobile-attendance-sources",
  () => request<{ results: MobileAttendanceSource[] }>("/mclock/mobile-attendance/sources/")
)
const sources = computed(() => sourcesData.value?.results ?? [])

const currentSlug = computed(() => {
  const requested = route.query.source as string | undefined
  return requested && sources.value.some((s) => s.slug === requested) ? requested : sources.value[0]?.slug
})
const currentTitle = computed(() => sources.value.find((s) => s.slug === currentSlug.value)?.title ?? "")

const pageSize = computed(() => Number(route.query.page_size ?? PAGE_SIZE))

const tableQuery = computed(() => {
  if (!currentSlug.value) return null
  const params = new URLSearchParams()
  if (route.query.sortBy) params.set("_sort_by", String(route.query.sortBy))
  if (route.query.sortDir) params.set("_order", String(route.query.sortDir))
  if (route.query.q) params.set("_q", String(route.query.q))
  if (route.query.page) params.set("_page", String(route.query.page))
  params.set("_limit", String(pageSize.value))
  return `${currentSlug.value}?${params.toString()}`
})

const { data, pending, error } = await useAsyncData(
  () => `mobile-attendance-data-${tableQuery.value}`,
  () => (tableQuery.value ? request<Paginated<MobileAttendanceRow>>(`/mclock/mobile-attendance/${tableQuery.value}`) : Promise.resolve({ count: 0, page: 1, results: [], next: null, previous: null } as Paginated<MobileAttendanceRow>)),
  { watch: [tableQuery] }
)
</script>

<template>
  <div>
    <PageHeader
      title="Mobile Attendance"
      :description="currentTitle ? `Data mentah &quot;${currentTitle}&quot; dari MSSQL -- read-only, belum diproses (bProses=0).` : 'Belum ada submenu tersedia.'"
    />
    <Card>
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
        <SearchBar placeholder="Cari NIK" />
        <MobileAttendanceSourceSelector v-if="currentSlug" :current="currentSlug" :sources="sources" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="Id" label="ID" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="sn" label="SN/Pool ID" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="nik" label="NIK" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="ttime" label="Waktu" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="ctype" label="Tipe" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="bProses" label="Status" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="6" class="py-8 text-center text-muted-foreground">Tidak ada data ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="row in data?.results" :key="row.Id" v-else>
            <TableCell class="font-mono text-muted-foreground">{{ row.Id }}</TableCell>
            <TableCell class="font-mono text-muted-foreground">{{ row.sn }}</TableCell>
            <TableCell class="font-mono">{{ row.nik }}</TableCell>
            <TableCell class="text-muted-foreground">{{ row.ttime }}</TableCell>
            <TableCell class="text-muted-foreground">{{ row.ctype }}</TableCell>
            <TableCell>
              <Badge :variant="row.bProses ? 'success' : 'warning'">{{ row.bProses ? "Sudah Diproses" : "Belum Diproses" }}</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="data" :count="data.count" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
