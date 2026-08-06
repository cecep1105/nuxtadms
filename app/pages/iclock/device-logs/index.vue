<script setup lang="ts">
import type { Paginated, DeviceLog } from "#shared/types/api"

const PAGE_SIZE = 20
const route = useRoute()
const { request } = useApiClient()

const page = computed(() => Number(route.query.page ?? "1"))
const pageSize = computed(() => Number(route.query.page_size ?? PAGE_SIZE))
const query = computed(() => {
  const params = new URLSearchParams({ page: String(page.value), page_size: String(pageSize.value) })
  if (route.query.q) params.set("q", String(route.query.q))
  if (route.query.ordering) params.set("ordering", String(route.query.ordering))
  return params.toString()
})

const { data, pending, error } = await useAsyncData(
  "device-logs-list",
  () => request<Paginated<DeviceLog>>(`/iclock/device-log/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="Device Log" description="Ringkasan data yang diupload device ke server (jumlah record & error per tipe data)." />
    <Card>
      <div class="flex items-center justify-between border-b border-border p-3">
        <SearchBar placeholder="Cari SN device / tipe data..." />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><SortableHeader label="Waktu Upload" sort-key="OpTime" /></TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Tipe Data</TableHead>
            <TableHead>Object</TableHead>
            <TableHead><SortableHeader label="Jumlah Record" sort-key="Cnt" /></TableHead>
            <TableHead>Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="6" class="py-8 text-center text-muted-foreground">Tidak ada device log.</TableCell>
          </TableRow>
          <TableRow v-for="log in data?.results" :key="log.id" v-else>
            <TableCell class="font-tabular text-muted-foreground">{{ new Date(log.OpTime).toLocaleString("id-ID") }}</TableCell>
            <TableCell class="font-mono">{{ log.SN }}</TableCell>
            <TableCell class="font-medium">{{ log.OP }}</TableCell>
            <TableCell class="text-muted-foreground">{{ log.Object ?? "-" }}</TableCell>
            <TableCell class="font-tabular">{{ log.Cnt }}</TableCell>
            <TableCell>
              <Badge v-if="log.ECnt > 0" variant="destructive">{{ log.ECnt }}</Badge>
              <span v-else class="text-muted-foreground">0</span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="data" :count="data.count" :page-size="pageSize" :current-page="page" />
    </Card>
  </div>
</template>
