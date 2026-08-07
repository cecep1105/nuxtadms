<script setup lang="ts">
import { cn } from "@/lib/utils"
import { ArrowLeft } from "@lucide/vue"
import type { Paginated, MikrotikFirewallFilterRule } from "#shared/types/api"

const PAGE_SIZE = 10

/**
 * Versi Portal dari Firewall Filter -- BEDA dari staff (mikrotik/fwfilter):
 * endpoint TERBATAS /netmgmt/portal/fwfilter/ (BUKAN proxy routeros
 * generik staff-only), read-only murni utk daftar rule (TANPA
 * Enable/Disable per-baris -- itu staff-only), CUMA aksi "Berikan Akses
 * Internet" (bikin rule BARU) yang tersedia.
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
  () => `portal-fwfilter-${query.value}`,
  () => request<Paginated<MikrotikFirewallFilterRule> & { router_ip: string }>(`/netmgmt/portal/fwfilter/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="Firewall Filter">
      <template #description>
        <NuxtLink to="/portal" class="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft class="h-3 w-3" /> Kembali ke Menu
        </NuxtLink>
      </template>
      <template #action>
        <PortalGrantAccessDialog v-if="data" :router-host="data.router_ip" />
      </template>
    </PageHeader>
    <Card>
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
        <SearchBar placeholder="Cari MAC / Comment" />
        <RouterSelector v-if="data" :current-router-ip="data.router_ip" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="chain" label="Chain" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="action" label="Action" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="src-mac-address" label="Source Mac" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="disabled" label="Disable?" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="comment" label="Comment" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="5" class="py-8 text-center text-muted-foreground">Tidak ada rule ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="fwfilter in data?.results" :key="fwfilter.id" v-else>
            <TableCell class="text-muted-foreground">{{ fwfilter.chain }}</TableCell>
            <TableCell class="text-muted-foreground">{{ fwfilter.action ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ fwfilter["src-mac-address"] ?? "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ fwfilter["disabled"] === "true" ? "yes" : "no" }}</TableCell>
            <TableCell :class="cn('text-muted-foreground', fwfilter['disabled'] === 'true' && 'text-destructive')">{{ fwfilter["comment"] ?? "-" }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data?.count ?? 0" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
