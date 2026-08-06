<script setup lang="ts">
import type { Paginated, OperationLog } from "#shared/types/api"

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
  "operation-logs-list",
  () => request<Paginated<OperationLog>>(`/iclock/operation-log/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="Operation Log" description="Log aksi admin di device fisik (power on/off, alarm, ubah config, dst) -- dikirim device via OPERLOG tag 'OPLOG'." />
    <Card>
      <div class="flex items-center justify-between border-b border-border p-3">
        <SearchBar placeholder="Cari SN device..." />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><SortableHeader label="Waktu" sort-key="OPTime" /></TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Operasi</TableHead>
            <TableHead><SortableHeader label="Admin" sort-key="admin" /></TableHead>
            <TableHead>Object</TableHead>
            <TableHead>Param 1/2/3</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="6" class="py-8 text-center text-muted-foreground">Tidak ada log operasi.</TableCell>
          </TableRow>
          <TableRow v-for="log in data?.results" :key="log.id" v-else>
            <TableCell class="font-tabular text-muted-foreground">{{ new Date(log.OPTime).toLocaleString("id-ID") }}</TableCell>
            <TableCell class="font-mono">{{ log.SN ?? "-" }}</TableCell>
            <TableCell class="font-medium">{{ log.OpName }}</TableCell>
            <TableCell class="font-mono text-muted-foreground">{{ log.admin }}</TableCell>
            <TableCell class="font-mono text-muted-foreground">{{ log.Object ?? "-" }}</TableCell>
            <TableCell class="font-mono text-[11px] text-muted-foreground">{{ log.Param1 ?? "-" }} / {{ log.Param2 ?? "-" }} / {{ log.Param3 ?? "-" }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="data" :count="data.count" :page-size="pageSize" :current-page="page" />
    </Card>
  </div>
</template>
