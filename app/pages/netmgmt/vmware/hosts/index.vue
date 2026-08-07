<script setup lang="ts">
import type { VsphereHost } from "#shared/types/api"

/**
 * Data diambil LANGSUNG via server route lokal (/api/vsphere/host, BUKAN
 * lewat Django) -- lihat server/utils/vsphere.ts & server/api/vsphere/[...path].ts.
 * Pagination/sort/search dikerjakan DI SINI (client, atas SEMUA host
 * sekaligus) via useListUtils -- SAMA pola dgn list-utils.ts versi
 * Next.js, dipakai krn tidak ada backend Django di tengah utk itu.
 */
const CONNECTION_VARIANT: Record<string, "success" | "destructive" | "warning"> = {
  CONNECTED: "success", DISCONNECTED: "destructive", NOT_RESPONDING: "warning",
}

const route = useRoute()
const { data: hostsData, pending, error } = await useAsyncData("vmware-hosts-raw", () => $fetch<{ value: VsphereHost[] }>("/api/vsphere/host"))
const allHosts = computed(() => hostsData.value?.value ?? [])

const page = computed(() => Number(route.query.page ?? "1"))
const pageSize = computed(() => Number(route.query.page_size ?? 10))
const sortBy = computed(() => (route.query.sortBy as string) || "name")
const sortDir = computed<"asc" | "desc">(() => (route.query.sortDir === "desc" ? "desc" : "asc"))
const searchQuery = computed(() => ((route.query.q as string) ?? "").trim().toLowerCase())

const data = computed(() => paginateSortFilter(allHosts.value as unknown as Record<string, unknown>[], {
  page: page.value, pageSize: pageSize.value, sortBy: sortBy.value, sortDir: sortDir.value,
  searchQuery: searchQuery.value, searchFields: ["name", "connection_state"],
}))
</script>

<template>
  <div>
    <PageHeader title="NetMgmt / VMware / Host" :description="`ESXi host terdaftar di vCenter (${data.count} host).`" />
    <Card>
      <div class="border-b border-border p-3">
        <SearchBar placeholder="Cari nama host / connection state" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="name" label="Nama" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="connection_state" label="Connection State" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="power_state" label="Power State" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data.results.length">
            <TableCell :colspan="3" class="py-8 text-center text-muted-foreground">Tidak ada host ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="host in (data.results as unknown as VsphereHost[])" :key="host.host" v-else>
            <TableCell class="font-medium">{{ host.name }}</TableCell>
            <TableCell><Badge :variant="CONNECTION_VARIANT[host.connection_state] ?? 'secondary'">{{ host.connection_state }}</Badge></TableCell>
            <TableCell><Badge :variant="host.power_state === 'POWERED_ON' ? 'success' : 'secondary'">{{ host.power_state }}</Badge></TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data.count" :page-size="pageSize" :current-page="page" />
    </Card>
  </div>
</template>
