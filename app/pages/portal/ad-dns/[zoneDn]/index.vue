<script setup lang="ts">
import { ArrowLeft } from "@lucide/vue"
import type { Paginated, DnsRecordRow } from "#shared/types/api"

/**
 * VIEW-ONLY MURNI (SENGAJA, beda dari staff) -- tambah/edit/hapus
 * record TETAP staff-only, tidak diperluas ke izin portal can_view_ad_dns.
 */
const PAGE_SIZE = 20

/** Ringkas isi `data` (beda field per tipe) jadi 1 baris teks manusiawi. */
function formatRecordValue(record: DnsRecordRow): string {
  const d = record.data
  switch (record.type) {
    case "A": case "AAAA": return d.address ?? "-"
    case "CNAME": case "NS": case "PTR": return d.target ?? "-"
    case "MX": return `${d.preference ?? "?"} ${d.exchange ?? "-"}`
    case "SRV": return `${d.priority ?? "?"} ${d.weight ?? "?"} ${d.port ?? "?"} ${d.target ?? "-"}`
    case "TXT": return d.text ?? "-"
    default: return "(format tidak dikenal -- read-only)"
  }
}

definePageMeta({ layout: "portal" })

const route = useRoute()
const zoneDn = computed(() => decodeURIComponent(route.params.zoneDn as string))
const { request } = useApiClient()

const pageSize = computed(() => Number(route.query.page_size ?? PAGE_SIZE))
const query = computed(() => {
  const params = new URLSearchParams()
  if (route.query.sortBy) params.set("_sort_by", String(route.query.sortBy))
  if (route.query.sortDir) params.set("_order", String(route.query.sortDir))
  if (route.query.q) params.set("_q", String(route.query.q))
  if (route.query.page) params.set("_page", String(route.query.page))
  params.set("_limit", String(pageSize.value))
  params.set("_search_fields", "name,type")
  return params.toString()
})

const { data, pending, error } = await useAsyncData(
  () => `portal-ad-dns-records-${zoneDn.value}-${query.value}`,
  () => request<Paginated<DnsRecordRow>>(`/netmgmt/ad/dns/zones/${encodeURIComponent(zoneDn.value)}/records/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="Active Directory - DNS Records">
      <template #description>
        <div class="flex flex-col gap-1">
          <NuxtLink to="/portal/ad-dns" class="inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft class="h-3 w-3" /> Kembali ke Daftar Zone
          </NuxtLink>
          <span class="font-mono text-[11px] text-muted-foreground">{{ zoneDn }}</span>
        </div>
      </template>
    </PageHeader>
    <Card>
      <div class="flex items-center justify-between border-b border-border p-3">
        <SearchBar placeholder="Cari nama / tipe" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="name" label="Nama" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="type" label="Tipe" /></TableHead>
            <TableHead>Nilai</TableHead>
            <TableHead><RouterOSSortableHeader column-key="ttl_seconds" label="TTL" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="4" class="py-8 text-center text-muted-foreground">Tidak ada record ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="record in data?.results" :key="record.raw_b64" v-else>
            <TableCell class="font-mono">{{ record.name }}</TableCell>
            <TableCell><Badge variant="secondary">{{ record.type }}</Badge></TableCell>
            <TableCell class="font-mono text-muted-foreground">{{ formatRecordValue(record) }}</TableCell>
            <TableCell class="font-tabular text-muted-foreground">{{ record.ttl_seconds }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data?.count ?? 0" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
