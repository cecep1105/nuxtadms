<script setup lang="ts">
import { Smartphone, Fingerprint as FingerprintIcon } from "@lucide/vue"
import type { Paginated, Employee, Department, ActiveDevice } from "#shared/types/api"

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
  "employees-list",
  () => request<Paginated<Employee>>(`/iclock/device-user/?${query.value}`),
  { watch: [query] }
)
const { data: departmentsData } = await useAsyncData(
  "employees-departments",
  () => request<Paginated<Department>>("/iclock/department/?page_size=200")
)
const { data: devicesData } = await useAsyncData(
  "employees-devices",
  () => request<Paginated<ActiveDevice>>("/iclock/active-device/?page_size=500")
)
</script>

<template>
  <div>
    <PageHeader title="Employee" description="Karyawan/pengguna yang terdaftar di mesin fingerprint & mobile attendance.">
      <template #action><EmployeeFormDialog mode="create" :departments="departmentsData?.results ?? []" /></template>
    </PageHeader>

    <Card>
      <div class="flex items-center justify-between border-b border-border p-3">
        <SearchBar placeholder="Cari PIN / Nama..." />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><SortableHeader label="PIN" sort-key="PIN" /></TableHead>
            <TableHead><SortableHeader label="Nama" sort-key="EName" /></TableHead>
            <TableHead>Pool</TableHead>
            <TableHead>Last Pool</TableHead>
            <TableHead>Last Device</TableHead>
            <TableHead><SortableHeader label="Last Seen" sort-key="UTime" /></TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="7" class="py-8 text-center text-muted-foreground">Tidak ada employee ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="emp in data?.results" :key="emp.id" v-else>
            <TableCell class="font-mono">{{ emp.PIN }}</TableCell>
            <TableCell class="font-medium">{{ emp.EName?.trim() || "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ emp.DeptName ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ emp.LastPool ?? "-" }}</TableCell>
            <TableCell>
              <Badge v-if="emp.LastDevice === 'Mobile'" variant="default"><Smartphone class="mr-1 h-2.5 w-2.5" /> Mobile</Badge>
              <span v-else-if="emp.LastDevice" class="inline-flex items-center gap-1 text-muted-foreground">
                <FingerprintIcon class="h-3 w-3" /> {{ emp.LastDevice }}
              </span>
              <span v-else class="text-muted-foreground">-</span>
            </TableCell>
            <TableCell class="font-tabular text-muted-foreground">{{ emp.UTime ? new Date(emp.UTime).toLocaleString("id-ID") : "-" }}</TableCell>
            <TableCell>
              <div class="flex justify-end gap-0.5">
                <EmployeeFormDialog mode="edit" :employee="emp" :departments="departmentsData?.results ?? []" />
                <SetAdminButton :employee-id="emp.id" :privilege="emp.Privilege" />
                <TransferFingerDialog :employee="emp" :departments="departmentsData?.results ?? []" :devices="devicesData?.results ?? []" />
                <DeleteConfirmButton :endpoint="`/iclock/device-user/${emp.id}/`" :label="`Employee '${emp.PIN} — ${emp.EName?.trim() || 'tanpa nama'}'`" />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <PaginationBar v-if="data" :count="data.count" :page-size="pageSize" :current-page="page" />
    </Card>
  </div>
</template>
