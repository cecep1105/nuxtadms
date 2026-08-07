<script setup lang="ts">
import { ArrowLeft } from "@lucide/vue"
import type { Paginated, MikrotikDhcpLease } from "#shared/types/api"

const PAGE_SIZE = 10

/**
 * Versi Portal dari DHCP Lease -- BEDA dari staff (mikrotik/dhcp):
 * endpoint TERBATAS /netmgmt/portal/dhcp-lease/ (BUKAN proxy routeros
 * generik yang staff-only), resolusi IP router dilakukan SERVER-SIDE
 * (response-nya SUDAH menyertakan `router_ip` yang RESOLVED, jadi
 * TIDAK perlu panggilan terpisah ke /netmgmt/router-default/ spt versi
 * staff) -- 1 kali panggil API saja. Read-only murni, TANPA aksi
 * Make Static/Delete (itu staff-only).
 */
definePageMeta({ layout: "portal" })

const route = useRoute()
const { request } = useApiClient()

const pageSize = computed(() => Number(route.query.page_size ?? PAGE_SIZE))
const query = computed(() => {
  const params = new URLSearchParams()
  if (route.query.router) params.set("router", String(route.query.router))
  if (route.query.sortBy) params.set("_sort_by", String(route.query.sortBy))
  if (route.query.sortDir) params.set("_order", String(route.query.sortDir))
  if (route.query.q) params.set("_q", String(route.query.q))
  if (route.query.page) params.set("_page", String(route.query.page))
  params.set("_limit", String(pageSize.value))
  return params.toString()
})

const { data, pending, error } = await useAsyncData(
  () => `portal-dhcp-lease-${query.value}`,
  () => request<Paginated<MikrotikDhcpLease> & { router_ip: string }>(`/netmgmt/portal/dhcp-lease/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="DHCP Lease">
      <template #description>
        <NuxtLink to="/portal" class="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft class="h-3 w-3" /> Kembali ke Menu
        </NuxtLink>
      </template>
    </PageHeader>
    <Card>
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
        <SearchBar placeholder="Cari IP Address / MAC / Hostname" />
        <RouterSelector v-if="data" :current-router-ip="data.router_ip" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="address" label="IP Address" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="mac-address" label="MAC Address" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="host-name" label="Hostname" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="last-seen" label="Last Seen" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="4" class="py-8 text-center text-muted-foreground">Tidak ada lease ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="dhcp in data?.results" :key="dhcp.id" v-else>
            <TableCell class="text-muted-foreground">{{ dhcp.address }}</TableCell>
            <TableCell class="text-muted-foreground">{{ dhcp["mac-address"] ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ dhcp["host-name"] ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ dhcp["last-seen"] ?? "-" }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data?.count ?? 0" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
