<script setup lang="ts">
import type { Paginated, PoolDeviceFunction } from "#shared/types/api"

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
  "pool-device-functions-list",
  () => request<Paginated<PoolDeviceFunction>>(`/mclock/pool-device-function/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="Pool Device Function" description="Mapping PoolID -> KANTIN/Bukan KANTIN -- dikelola manual sepenuhnya, TIDAK disinkronkan dari MSSQL.">
      <template #action><PoolDeviceFunctionFormDialog mode="create" /></template>
    </PageHeader>
    <Card>
      <div class="flex items-center justify-between border-b border-border p-3">
        <SearchBar placeholder="Cari Pool ID..." />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><SortableHeader label="Pool ID" sort-key="PoolID" /></TableHead>
            <TableHead><SortableHeader label="Function Type" sort-key="function_type" /></TableHead>
            <TableHead><SortableHeader label="Dibuat" sort-key="created_at" /></TableHead>
            <TableHead>Diperbarui</TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="5" class="py-8 text-center text-muted-foreground">Belum ada mapping.</TableCell>
          </TableRow>
          <TableRow v-for="item in data?.results" :key="item.id" v-else>
            <TableCell class="font-mono font-medium">{{ item.PoolID }}</TableCell>
            <TableCell>
              <Badge :variant="item.function_type === 'KANTIN' ? 'default' : 'secondary'">
                {{ item.function_type === "KANTIN" ? "KANTIN" : "Bukan KANTIN" }}
              </Badge>
            </TableCell>
            <TableCell class="font-tabular text-muted-foreground">{{ new Date(item.created_at).toLocaleString("id-ID") }}</TableCell>
            <TableCell class="font-tabular text-muted-foreground">{{ new Date(item.updated_at).toLocaleString("id-ID") }}</TableCell>
            <TableCell>
              <div class="flex justify-end gap-0.5">
                <PoolDeviceFunctionFormDialog mode="edit" :item="item" />
                <DeleteConfirmButton :endpoint="`/mclock/pool-device-function/${item.id}/`" :label="`Mapping PoolID '${item.PoolID}'`" />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="data" :count="data.count" :page-size="pageSize" :current-page="page" />
    </Card>
  </div>
</template>
