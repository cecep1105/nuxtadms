<script setup lang="ts">
import type { Paginated, DeviceCommand, ActiveDevice } from "#shared/types/api"

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
  "device-commands-list",
  () => request<Paginated<DeviceCommand>>(`/iclock/device-command/?${query.value}`),
  { watch: [query] }
)
const { data: devicesData } = await useAsyncData(
  "device-commands-devices",
  () => request<Paginated<ActiveDevice>>("/iclock/active-device/?page_size=500")
)

function statusVariant(cmd: DeviceCommand): "warning" | "success" | "destructive" {
  if (!cmd.CmdOverTime) return "warning"
  return cmd.CmdReturn === "0" ? "success" : "destructive"
}
function statusLabel(cmd: DeviceCommand): string {
  if (!cmd.CmdOverTime) return "Pending"
  return cmd.CmdReturn === "0" ? "Sukses" : `Gagal (${cmd.CmdReturn})`
}
</script>

<template>
  <div>
    <PageHeader title="Device Command" description="Antrean command ke device fisik -- diambil device saat polling getrequest berikutnya.">
      <template #action><SendCommandDialog :devices="devicesData?.results ?? []" /></template>
    </PageHeader>
    <Card>
      <div class="flex items-center justify-between border-b border-border p-3">
        <SearchBar placeholder="Cari SN / isi command..." />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Command</TableHead>
            <TableHead><SortableHeader label="Diajukan" sort-key="CmdCommitTime" /></TableHead>
            <TableHead>Diambil Device</TableHead>
            <TableHead>Selesai</TableHead>
            <TableHead>Oleh</TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="8" class="py-8 text-center text-muted-foreground">Belum ada command.</TableCell>
          </TableRow>
          <TableRow v-for="cmd in data?.results" :key="cmd.id" v-else>
            <TableCell><Badge :variant="statusVariant(cmd)">{{ statusLabel(cmd) }}</Badge></TableCell>
            <TableCell class="font-mono">{{ cmd.SN }}</TableCell>
            <TableCell class="font-mono font-medium">{{ cmd.CmdContent }}</TableCell>
            <TableCell class="font-tabular text-muted-foreground">{{ new Date(cmd.CmdCommitTime).toLocaleString("id-ID") }}</TableCell>
            <TableCell class="font-tabular text-muted-foreground">{{ cmd.CmdTransTime ? new Date(cmd.CmdTransTime).toLocaleString("id-ID") : "-" }}</TableCell>
            <TableCell class="font-tabular text-muted-foreground">{{ cmd.CmdOverTime ? new Date(cmd.CmdOverTime).toLocaleString("id-ID") : "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ cmd.Username ?? "-" }}</TableCell>
            <TableCell>
              <div class="flex justify-end">
                <DeleteConfirmButton :endpoint="`/iclock/device-command/${cmd.id}/`" :label="`Command '${cmd.CmdContent}' untuk ${cmd.SN}`" />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="data" :count="data.count" :page-size="pageSize" :current-page="page" />
    </Card>
  </div>
</template>
