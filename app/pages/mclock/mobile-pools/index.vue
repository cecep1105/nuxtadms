<script setup lang="ts">
import type { Paginated, MobilePool } from "#shared/types/api"

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
  "mobile-pools-list",
  () => request<Paginated<MobilePool>>(`/mclock/mobile-pool/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="Mobile Pool" description="Data pool/lokasi absensi mobile, disinkronkan dari MSSQL eksternal.">
      <template #action><MobilePoolFormDialog mode="create" /></template>
    </PageHeader>
    <Card>
      <div class="flex items-center justify-between border-b border-border p-3">
        <SearchBar placeholder="Cari Pool ID / Code / Nama..." />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><SortableHeader label="Pool ID" sort-key="PoolID" /></TableHead>
            <TableHead><SortableHeader label="Pool Code" sort-key="PoolCode" /></TableHead>
            <TableHead><SortableHeader label="Nama" sort-key="PoolName" /></TableHead>
            <TableHead>Koordinat</TableHead>
            <TableHead>Radius</TableHead>
            <TableHead><SortableHeader label="Synced" sort-key="SyncedAt" /></TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="7" class="py-8 text-center text-muted-foreground">Tidak ada pool ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="pool in data?.results" :key="pool.PoolID" v-else>
            <TableCell class="font-mono">{{ pool.PoolID }}</TableCell>
            <TableCell class="font-mono text-muted-foreground">{{ pool.PoolCode ?? "-" }}</TableCell>
            <TableCell class="font-medium">{{ pool.PoolName ?? "-" }}</TableCell>
            <TableCell class="font-mono text-[11px] text-muted-foreground">
              {{ pool.Latitude && pool.Longitude ? `${pool.Latitude}, ${pool.Longitude}` : "-" }}
            </TableCell>
            <TableCell class="text-muted-foreground">{{ pool.Radius ? `${pool.Radius}m` : "-" }}</TableCell>
            <TableCell class="font-tabular text-muted-foreground">{{ pool.SyncedAt ? new Date(pool.SyncedAt).toLocaleString("id-ID") : "-" }}</TableCell>
            <TableCell>
              <div class="flex justify-end gap-0.5">
                <MobilePoolFormDialog mode="edit" :pool="pool" />
                <DeleteConfirmButton :endpoint="`/mclock/mobile-pool/${pool.PoolID}/`" :label="`Pool '${pool.PoolName || pool.PoolID}'`" />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="data" :count="data.count" :page-size="pageSize" :current-page="page" />
    </Card>
  </div>
</template>
