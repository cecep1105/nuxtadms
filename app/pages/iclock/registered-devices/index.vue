<script setup lang="ts">
import type { Paginated, RegisteredDevice, Department } from "#shared/types/api"

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
  "registered-devices-list",
  () => request<Paginated<RegisteredDevice>>(`/iclock/registered-device/?${query.value}`),
  { watch: [query] }
)
const { data: departmentsData } = await useAsyncData(
  "registered-devices-departments",
  () => request<Paginated<Department>>("/iclock/department/?page_size=200")
)
</script>

<template>
  <div>
    <PageHeader title="Registered Device" description="Device baru yang auto-terdaftar (Rule 2a) tapi belum diaktivasi ke Pool manapun." />
    <Card>
      <div class="flex items-center justify-between border-b border-border p-3">
        <SearchBar placeholder="Cari SN / nama device..." />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><SortableHeader label="SN" sort-key="SN" /></TableHead>
            <TableHead>Alias</TableHead>
            <TableHead><SortableHeader label="Nama Device" sort-key="DeviceName" /></TableHead>
            <TableHead><SortableHeader label="Pool" sort-key="DeptID" /></TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead><SortableHeader label="Last Activity" sort-key="LastActivity" /></TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="7" class="py-8 text-center text-muted-foreground">Tidak ada registered device.</TableCell>
          </TableRow>
          <TableRow v-for="rd in data?.results" :key="rd.id" v-else>
            <TableCell class="font-mono">{{ rd.SN }}</TableCell>
            <TableCell class="text-muted-foreground">{{ rd.Alias ?? "-" }}</TableCell>
            <TableCell class="font-medium">{{ rd.DeviceName || "-" }}</TableCell>
            <TableCell>
              <Badge v-if="!rd.DeptID || rd.DeptID === 0" variant="warning">Belum aktivasi</Badge>
              <span v-else class="text-muted-foreground">{{ rd.DeptName }}</span>
            </TableCell>
            <TableCell class="font-mono text-muted-foreground">{{ rd.IPAddress ?? "-" }}</TableCell>
            <TableCell class="font-tabular text-muted-foreground">{{ rd.LastActivity ? new Date(rd.LastActivity).toLocaleString("id-ID") : "-" }}</TableCell>
            <TableCell>
              <div class="flex justify-end gap-0.5">
                <RegisteredDeviceFormDialog :device="rd" :departments="departmentsData?.results ?? []" />
                <DeleteConfirmButton :endpoint="`/iclock/registered-device/${rd.id}/`" :label="`Registered Device '${rd.SN}'`" />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="data" :count="data.count" :page-size="pageSize" :current-page="page" />
    </Card>
  </div>
</template>
