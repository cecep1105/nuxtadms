<script setup lang="ts">
import { cn } from "@/lib/utils"
import type { Paginated, MikrotikFirewallFilterRule } from "#shared/types/api"

const PAGE_SIZE = 10
const route = useRoute()
const config = useRuntimeConfig()
const { request } = useApiClient()

const { data: routerDefault } = await useAsyncData(
  "mikrotik-fwfilter-router-default",
  () => (route.query.router ? Promise.resolve(null) : request<{ router_ip: string | null }>("/netmgmt/router-default/?page=fwfilter").catch(() => null))
)
const routerIp = computed(() => (route.query.router as string) || routerDefault.value?.router_ip || config.public.mikrotikFwfilterRouterIp)
const basePath = computed(() => `/netmgmt/routeros/${routerIp.value}/ip-firewall-filter`)

const pageSize = computed(() => Number(route.query.page_size ?? PAGE_SIZE))
const query = computed(() => {
  const params = new URLSearchParams()
  if (route.query.sortBy) params.set("_sort_by", String(route.query.sortBy))
  if (route.query.sortDir) params.set("_order", String(route.query.sortDir))
  if (route.query.q) params.set("_q", String(route.query.q))
  if (route.query.page) params.set("_page", String(route.query.page))
  params.set("_limit", String(pageSize.value))
  params.set("_search_fields", "src-mac-address,comment")
  return params.toString()
})

const { data, pending, error } = await useAsyncData(
  () => `mikrotik-fwfilter-${basePath.value}-${query.value}`,
  () => request<Paginated<MikrotikFirewallFilterRule>>(`${basePath.value}/?${query.value}`),
  { watch: [basePath, query] }
)
</script>

<template>
  <div>
    <PageHeader title="NetMgmt / Mikrotik Firewall Filter" description="Daftar firewall filter">
      <template #action><GrantAccessDialog :router-host="routerIp" /></template>
    </PageHeader>
    <Card>
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
        <SearchBar placeholder="Cari MAC / Comment" />
        <RouterSelector :current-router-ip="routerIp" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="id" label="id" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="chain" label="Chain" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="action" label="Action" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="src-mac-address" label="Source Mac" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="out-interface" label="Out Interface" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="disabled" label="Disable?" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="bytes" label="Bytes" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="comment" label="Comment" /></TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="9" class="py-8 text-center text-muted-foreground">Tidak ada rule ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="fwfilter in data?.results" :key="fwfilter.id" v-else>
            <TableCell class="text-muted-foreground">{{ fwfilter.id }}</TableCell>
            <TableCell class="text-muted-foreground">{{ fwfilter.chain }}</TableCell>
            <TableCell class="text-muted-foreground">{{ fwfilter.action ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ fwfilter["src-mac-address"] ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ fwfilter["out-interface"] ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ fwfilter["disabled"] === "true" ? "yes" : "no" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ fwfilter.bytes ? parseInt(fwfilter.bytes, 10) : "0" }}</TableCell>
            <TableCell :class="cn('text-muted-foreground', fwfilter['disabled'] === 'true' && 'text-destructive')">{{ fwfilter["comment"] ?? "-" }}</TableCell>
            <TableCell>
              <div class="flex justify-end gap-0.5">
                <FwFilterActionsMenu :hostdata="fwfilter" :basepath="basePath" />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data?.count ?? 0" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
