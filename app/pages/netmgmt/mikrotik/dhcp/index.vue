<script setup lang="ts">
import type { Paginated, MikrotikDhcpLease } from "#shared/types/api"
import { MonitorPlay } from "@lucide/vue"

const PAGE_SIZE = 10
const route = useRoute()
const config = useRuntimeConfig()
const { request } = useApiClient()

/**
 * Tentukan IP router yang dipakai, urutan prioritas:
 *   1. Param URL ?router= (user pilih manual lewat dropdown)
 *   2. Default yang diset admin lewat Django Admin (NetmgmtRouterDefault)
 *   3. Env var fallback -- MENJAGA KOMPATIBILITAS dgn setup lama
 */
const { data: routerDefault } = await useAsyncData(
  "mikrotik-dhcp-router-default",
  () => (route.query.router ? Promise.resolve(null) : request<{ router_ip: string | null }>("/netmgmt/router-default/?page=dhcp").catch(() => null))
)
const routerIp = computed(() => (route.query.router as string) || routerDefault.value?.router_ip || config.public.mikrotikDhcpRouterIp)
const basePath = computed(() => `/netmgmt/routeros/${routerIp.value}/ip-dhcp_server-lease`)

const pageSize = computed(() => Number(route.query.page_size ?? PAGE_SIZE))
const query = computed(() => {
  const params = new URLSearchParams()
  if (route.query.sortBy) params.set("_sort_by", String(route.query.sortBy))
  if (route.query.sortDir) params.set("_order", String(route.query.sortDir))
  if (route.query.q) params.set("_q", String(route.query.q))
  if (route.query.page) params.set("_page", String(route.query.page))
  params.set("_limit", String(pageSize.value))
  params.set("_search_fields", "address,mac-address,host-name")
  return params.toString()
})

const { data, pending, error } = await useAsyncData(
  () => `mikrotik-dhcp-${basePath.value}-${query.value}`,
  () => request<Paginated<MikrotikDhcpLease>>(`${basePath.value}/?${query.value}`),
  { watch: [basePath, query] }
)
</script>

<template>
  <div>
    <PageHeader title="NetMgmt / Mikrotik DHCP" description="Daftar lease dhcp-server" />
    <Card>
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
        <SearchBar placeholder="Cari IP Address / MAC / Hostname" />
        <RouterSelector :current-router-ip="routerIp" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="address" label="IP Address" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="mac-address" label="MAC Address" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="server" label="Server" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="host-name" label="Hostname" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="last-seen" label="Last Seen" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="dynamic" label="Dynamic" /></TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="7" class="py-8 text-center text-muted-foreground">Tidak ada lease ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="dhcp in data?.results" :key="dhcp.id" v-else>
            <TableCell class="text-muted-foreground">{{ dhcp.address }}</TableCell>
            <TableCell class="text-muted-foreground">{{ dhcp["mac-address"] ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ dhcp.server ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ dhcp["host-name"] ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ dhcp["last-seen"] ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ dhcp.dynamic ?? "-" }}</TableCell>
            <TableCell>
              <div class="flex justify-end gap-0.5">
                <DhcpActionsMenu :hostdata="dhcp" :basepath="basePath" />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data?.count ?? 0" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
