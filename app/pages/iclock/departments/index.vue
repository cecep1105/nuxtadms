<script setup lang="ts">
import type { Paginated, Department } from "#shared/types/api"

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
  "departments-list",
  () => request<Paginated<Department>>(`/iclock/department/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="Pool / Department" description="Pengelompokan lokasi/departemen untuk device & employee.">
      <template #action><DepartmentFormDialog mode="create" /></template>
    </PageHeader>
    <Card>
      <div class="flex items-center justify-between border-b border-border p-3">
        <SearchBar placeholder="Cari nama pool..." />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><SortableHeader label="Pool ID" sort-key="DeptID" /></TableHead>
            <TableHead><SortableHeader label="Nama Pool" sort-key="DeptName" /></TableHead>
            <TableHead>Net ID</TableHead>
            <TableHead>Router</TableHead>
            <TableHead>Subnet</TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="6" class="py-8 text-center text-muted-foreground">Tidak ada pool ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="dept in data?.results" :key="dept.DeptID" v-else>
            <TableCell class="font-mono">{{ dept.DeptID }}</TableCell>
            <TableCell class="font-medium">{{ dept.DeptName }}</TableCell>
            <TableCell class="text-muted-foreground">{{ dept.NetID }}</TableCell>
            <TableCell class="font-mono text-muted-foreground">{{ dept.DeptRouter }}</TableCell>
            <TableCell class="font-mono text-muted-foreground">{{ dept.DeptSubnet }}</TableCell>
            <TableCell>
              <div class="flex justify-end gap-0.5">
                <DepartmentFormDialog mode="edit" :department="dept" />
                <DeleteConfirmButton :endpoint="`/iclock/department/${dept.DeptID}/`" :label="`Pool '${dept.DeptName}'`" />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="data" :count="data.count" :page-size="pageSize" :current-page="page" />
    </Card>
  </div>
</template>
